import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';

// Razorpay Configuration
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'your_razorpay_key_id',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret',
});

// Ezee API Configuration for ProcessBooking
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

/**
 * Create Razorpay Order
 * POST /api/payment/create-order
 * 
 * This creates a Razorpay order after the booking is created
 * and reservation number is received from eZee API
 */
export const createOrder = async (req, res) => {
  try {
    const { amount, currency, reservationNo, email, phone, name } = req.body;

    if (!amount || !currency || !reservationNo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: amount, currency, reservationNo',
      });
    }

    // Create Razorpay order
    const options = {
      amount: Math.round(amount * 100), // Convert to paise (smallest currency unit)
      currency: currency || 'INR',
      receipt: `receipt_${reservationNo}`,
      notes: {
        reservationNo,
        email,
        phone,
        name,
      },
    };

    console.log('Creating Razorpay order:', options);

    const order = await razorpay.orders.create(options);

    console.log('Razorpay order created:', order);

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        reservationNo,
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to create payment order',
      error: error.message,
    });
  }
};

/**
 * Verify Razorpay Payment
 * POST /api/payment/verify
 * 
 * This verifies the payment signature from Razorpay
 * and then calls ProcessBooking API to confirm or fail the booking
 */
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      reservationNo,
      inventoryMode,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !reservationNo) {
      return res.status(400).json({
        success: false,
        message: 'Missing required payment verification fields',
      });
    }

    // Verify signature
    const body = razorpay_order_id + '|' + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'your_razorpay_key_secret')
      .update(body.toString())
      .digest('hex');

    const isAuthentic = expectedSignature === razorpay_signature;

    console.log('Payment Verification:', {
      isAuthentic,
      razorpay_order_id,
      razorpay_payment_id,
      reservationNo,
    });

    if (isAuthentic) {
      // Payment successful - Confirm booking using ProcessBooking API
      const confirmResult = await processBooking({
        Action: 'ConfirmBooking',
        ReservationNo: reservationNo,
        Inventory_Mode: inventoryMode || 'ALLOCATED',
        Error_Text: '',
      });

      if (confirmResult.success) {
        return res.status(200).json({
          success: true,
          message: 'Payment verified and booking confirmed',
          data: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            reservationNo,
            bookingStatus: 'CONFIRMED',
          },
        });
      } else {
        // ProcessBooking failed - but payment was successful
        console.error('ProcessBooking failed after successful payment:', confirmResult);
        return res.status(500).json({
          success: false,
          message: 'Payment successful but booking confirmation failed',
          error: confirmResult.error,
          data: {
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id,
            reservationNo,
            bookingStatus: 'PENDING_CONFIRMATION',
          },
        });
      }
    } else {
      // Payment verification failed - Mark booking as failed
      const failResult = await processBooking({
        Action: 'FailBooking',
        ReservationNo: reservationNo,
        Inventory_Mode: inventoryMode || 'ALLOCATED',
        Error_Text: 'Payment verification failed',
      });

      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        data: {
          reservationNo,
          bookingStatus: 'FAILED',
        },
      });
    }
  } catch (error) {
    console.error('Error verifying payment:', error);

    // Try to fail the booking
    if (req.body.reservationNo) {
      await processBooking({
        Action: 'FailBooking',
        ReservationNo: req.body.reservationNo,
        Inventory_Mode: req.body.inventoryMode || 'ALLOCATED',
        Error_Text: `Payment verification error: ${error.message}`,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message,
    });
  }
};

/**
 * Handle Payment Failure
 * POST /api/payment/fail
 * 
 * This is called when payment fails on the frontend
 * It calls ProcessBooking API to mark the booking as failed
 */
export const handlePaymentFailure = async (req, res) => {
  try {
    const { reservationNo, inventoryMode, errorText } = req.body;

    if (!reservationNo) {
      return res.status(400).json({
        success: false,
        message: 'Reservation number is required',
      });
    }

    console.log('Handling payment failure for reservation:', reservationNo);

    // Call ProcessBooking API to fail the booking
    const failResult = await processBooking({
      Action: 'FailBooking',
      ReservationNo: reservationNo,
      Inventory_Mode: inventoryMode || 'ALLOCATED',
      Error_Text: errorText || 'Payment failed by user',
    });

    if (failResult.success) {
      return res.status(200).json({
        success: true,
        message: 'Booking marked as failed',
        data: {
          reservationNo,
          bookingStatus: 'FAILED',
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to process booking failure',
        error: failResult.error,
      });
    }
  } catch (error) {
    console.error('Error handling payment failure:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to handle payment failure',
      error: error.message,
    });
  }
};

/**
 * Internal helper function to call ProcessBooking API
 * 
 * Actions: 'ConfirmBooking', 'FailBooking', 'PendingBooking'
 */
async function processBooking(processData) {
  try {
    const processDataJson = JSON.stringify(processData);
    const encodedProcessData = encodeURIComponent(processDataJson);

    const apiUrl = `${EZEE_API_BASE_URL}?request_type=ProcessBooking&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&Process_Data=${encodedProcessData}&LANGUAGE=en`;

    console.log('Calling ProcessBooking API:', {
      action: processData.Action,
      reservationNo: processData.ReservationNo,
    });

    const response = await axios.get(apiUrl, {
      timeout: 30000,
    });

    console.log('ProcessBooking API Response:', response.data);

    if (response.data.result === 'success' || response.data.Success) {
      return {
        success: true,
        data: response.data,
      };
    } else if (response.data.error || response.data.Error) {
      return {
        success: false,
        error: response.data.error || response.data.Error,
      };
    } else {
      return {
        success: false,
        error: 'Unknown response from ProcessBooking API',
        data: response.data,
      };
    }
  } catch (error) {
    console.error('Error in ProcessBooking API call:', error.response?.data || error.message);

    return {
      success: false,
      error: error.response?.data || error.message,
    };
  }
}

export default {
  createOrder,
  verifyPayment,
  handlePaymentFailure,
};
