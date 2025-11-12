import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// eZee API Configuration
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = process.env.EZEE_HOTEL_CODE;
const API_KEY = process.env.EZEE_API_KEY;

/**
 * Create Razorpay Order
 * POST /api/booking/razorpay/create-order
 * Body: { amount, currency, receipt, notes }
 */
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency, receipt, notes } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: 'Amount is required'
      });
    }

    // Convert amount to paise (Razorpay requires amount in smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const options = {
      amount: amountInPaise,
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    };

    console.log('\n========================================');
    console.log('=== CREATING RAZORPAY ORDER ===');
    console.log('========================================');
    console.log('[Order Details]:', JSON.stringify(options, null, 2));
    console.log('========================================\n');

    const order = await razorpay.orders.create(options);

    console.log('\n========================================');
    console.log('=== RAZORPAY ORDER CREATED ===');
    console.log('========================================');
    console.log('[Order ID]:', order.id);
    console.log('[Amount]:', order.amount);
    console.log('[Currency]:', order.currency);
    console.log('========================================\n');

    return res.status(200).json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to create Razorpay order',
      error: error.message
    });
  }
};

/**
 * Verify Razorpay Payment and Confirm Booking with eZee
 * POST /api/booking/razorpay/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, reservationNo }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      reservationNo 
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    if (!reservationNo) {
      return res.status(400).json({
        success: false,
        message: 'Reservation number is required'
      });
    }

    console.log('\n========================================');
    console.log('=== VERIFYING RAZORPAY PAYMENT ===');
    console.log('========================================');
    console.log('[Order ID]:', razorpay_order_id);
    console.log('[Payment ID]:', razorpay_payment_id);
    console.log('[Reservation No]:', reservationNo);
    console.log('========================================\n');

    // Verify signature
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature !== razorpay_signature) {
      console.error('❌ Payment verification failed - Invalid signature');
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature'
      });
    }

    console.log('✅ Payment signature verified successfully');

    // STEP 2: Confirm booking with eZee ProcessBooking API
    console.log('\n========================================');
    console.log('=== CONFIRMING BOOKING WITH EZEE ===');
    console.log('========================================');

    const processData = {
      Action: "ConfirmBooking",
      ReservationNo: reservationNo,
      Inventory_Mode: "ALLOCATED",
      Error_Text: ""
    };

    const formData = new URLSearchParams();
    formData.append('request_type', 'ProcessBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('Process_Data', JSON.stringify(processData));

    console.log('[Process Data]:', JSON.stringify(processData, null, 2));

    const ezeeResponse = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('[eZee Response]:', JSON.stringify(ezeeResponse.data, null, 2));
    console.log('========================================\n');

    const data = ezeeResponse.data || {};
    const msg = String(data.message || data.Error || '').toLowerCase();
    const ezeeOk = data.Status === "Success" || data.success || msg.includes('already confirm') || msg.includes('already confirmed');

    if (ezeeOk) {
      console.log('✅ Booking confirmed successfully in eZee dashboard');
      return res.status(200).json({
        success: true,
        message: 'Payment successful and booking confirmed',
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        reservationNo: reservationNo,
        ezeeConfirmed: true
      });
    }

    console.error('❌ eZee booking confirmation failed:', data);
    return res.status(200).json({
      success: true,
      message: 'Payment verified, booking status not updated in eZee',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      reservationNo: reservationNo,
      ezeeConfirmed: false,
      ezeeError: data.error || data.Error || 'Unknown error'
    });

  } catch (error) {
    console.error('Error verifying payment:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.response?.data || error.message
    });
  }
};
