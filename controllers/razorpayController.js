import Razorpay from 'razorpay';
import crypto from 'crypto';
import axios from 'axios';
import { sendRefundNotificationEmail } from '../utils/emailService.js';

// Initialize Razorpay instance
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// eZee API Configuration
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
// Use env vars if provided, otherwise fall back to the same credentials used in bookingController.js
const HOTEL_CODE = process.env.EZEE_HOTEL_CODE || '49890';
const API_KEY = process.env.EZEE_API_KEY || '012892983818a824a6-e3aa-11ef-a';

// eZee Kiosk/AddPayment configuration
// Docs: AddPayment via https://live.ipms247.com/index.php/page/service.kioskconnectivity
const EZEE_KIOSK_URL = 'https://live.ipms247.com/index.php/page/service.kioskconnectivity';
const KIOSK_HOTEL_CODE = process.env.EZEE_KIOSK_HOTEL_CODE || HOTEL_CODE;
const KIOSK_AUTH_CODE = process.env.EZEE_KIOSK_AUTH_CODE;
// These should be provided by eZee (PaymentID for Razorpay and CurrencyID for INR)
const KIOSK_PAYMENT_ID = process.env.EZEE_KIOSK_PAYMENT_ID;
const KIOSK_CURRENCY_ID = process.env.EZEE_KIOSK_CURRENCY_ID;

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

    const order = await razorpay.orders.create(options);

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
 * Verify Razorpay Payment and Create Booking with eZee (NEW FLOW: Payment First, Then Booking)
 * POST /api/booking/razorpay/verify-payment
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData, guestInfo, amount }
 */
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      bookingData, // Booking payload to create booking after payment
      guestInfo, // Guest information for refund emails
      amount,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment verification details'
      });
    }

    if (!bookingData) {
      return res.status(400).json({
        success: false,
        message: 'Booking data is required'
      });
    }

    // STEP 1: Verify payment signature
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

    // STEP 2: Create booking in eZee (AFTER payment is verified)
    // Simplified: If InsertBooking succeeds, booking is created. If it fails, show error + send email.

    // Validate required booking data
    if (!bookingData.Room_Details || !bookingData.check_in_date || !bookingData.check_out_date || !bookingData.Email_Address) {
      console.error('❌ Invalid booking data - sending notification email (manual refund required)');
      
      // Send email notification to admin (they will handle refund manually)
      try {
        await sendRefundNotificationEmail({
          paymentId: razorpay_payment_id,
          refundId: null,
          amount: req.body.amount * 100,
          reason: 'Invalid booking data provided - Manual refund required',
          guestName: guestInfo?.name || (guestInfo?.firstName && guestInfo?.lastName ? `${guestInfo.firstName} ${guestInfo.lastName}` : 'N/A'),
          guestEmail: guestInfo?.email || 'N/A',
          guestPhone: guestInfo?.phone || 'N/A',
          bookingDetails: null
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send notification email:', emailError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Invalid booking data',
        refundInitiated: false,
        requiresRefund: true,
        paymentId: razorpay_payment_id
      });
    }

    // Build the BookingData JSON string
    const bookingDataJson = JSON.stringify(bookingData);

    // Create form data for POST request
    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', bookingDataJson);

    // Make POST request to Ezee InsertBooking API
    const bookingResponse = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Check if booking was successful
    if (!bookingResponse.data.ReservationNo) {
      // Booking creation failed - send email notification (NO AUTO REFUND)
      console.error('❌ Booking creation failed - sending notification email (manual refund required)');
      
      let errorMessage = 'Booking creation failed';
      if (Array.isArray(bookingResponse.data) && bookingResponse.data[0] && bookingResponse.data[0]['Error Details']) {
        errorMessage = bookingResponse.data[0]['Error Details'].Error_Message || errorMessage;
      }
      
      // Send email notification to admin (they will handle refund manually)
      try {
        await sendRefundNotificationEmail({
          paymentId: razorpay_payment_id,
          refundId: null,
          amount: req.body.amount * 100,
          reason: `Booking creation failed: ${errorMessage} - Manual refund required`,
          guestName: guestInfo?.name || (guestInfo?.firstName && guestInfo?.lastName ? `${guestInfo.firstName} ${guestInfo.lastName}` : 'N/A'),
          guestEmail: guestInfo?.email || 'N/A',
          guestPhone: guestInfo?.phone || 'N/A',
          bookingDetails: {
            checkIn: bookingData.check_in_date,
            checkOut: bookingData.check_out_date,
            rooms: Object.keys(bookingData.Room_Details).length
          }
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send notification email:', emailError);
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        refundInitiated: false,
        requiresRefund: true,
        paymentId: razorpay_payment_id
      });
    }

    // Booking created successfully!
    const reservationNo = bookingResponse.data.ReservationNo;

    // STEP 3: Confirm booking with ProcessBooking (this triggers confirmation email)
    const processData = {
      Action: "ConfirmBooking",
      ReservationNo: reservationNo,
      Inventory_Mode: "ALLOCATED",
      Error_Text: ""
    };

    const processFormData = new URLSearchParams();
    processFormData.append('request_type', 'ProcessBooking');
    processFormData.append('HotelCode', HOTEL_CODE);
    processFormData.append('APIKey', API_KEY);
    processFormData.append('Process_Data', JSON.stringify(processData));

    const processResponse = await axios.post(EZEE_API_BASE_URL, processFormData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const processData_result = processResponse.data || {};
    const isProcessSuccess =
      processData_result.Status === "Success" ||
      processData_result.success === true ||
      (typeof processData_result.result === "string" &&
        processData_result.result.toLowerCase() === "success");

    if (!isProcessSuccess) {
      console.error('❌ Booking confirmation failed - sending notification email (manual refund required)');
      
      // Send email notification to admin (they will handle refund manually)
      try {
        await sendRefundNotificationEmail({
          paymentId: razorpay_payment_id,
          refundId: null,
          amount: req.body.amount * 100,
          reason: 'Booking confirmation failed - Manual refund required',
          guestName: guestInfo?.name || (guestInfo?.firstName && guestInfo?.lastName ? `${guestInfo.firstName} ${guestInfo.lastName}` : 'N/A'),
          guestEmail: guestInfo?.email || 'N/A',
          guestPhone: guestInfo?.phone || 'N/A',
          bookingDetails: {
            checkIn: bookingData.check_in_date,
            checkOut: bookingData.check_out_date,
            rooms: Object.keys(bookingData.Room_Details).length,
            reservationNo: reservationNo
          }
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send notification email:', emailError);
      }
      
      return res.status(400).json({
        success: false,
        message: 'Booking confirmation failed',
        reservationNo: reservationNo,
        refundInitiated: false,
        requiresRefund: true,
        paymentId: razorpay_payment_id
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Payment successful and booking confirmed',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      reservationNo: reservationNo,
    });

  } catch (error) {
    console.error('Error in payment verification/booking creation:', error.response?.data || error.message);
    
    // If payment was verified but error occurred, send email notification (NO AUTO REFUND)
    if (req.body.razorpay_payment_id) {
      try {
        await sendRefundNotificationEmail({
          paymentId: req.body.razorpay_payment_id,
          refundId: null, // No refund initiated yet
          amount: req.body.amount ? req.body.amount * 100 : 0, // Convert to paise
          reason: `System error: ${error.message} - Manual refund required`,
          guestName: req.body.guestInfo?.name || (req.body.guestInfo?.firstName && req.body.guestInfo?.lastName ? `${req.body.guestInfo.firstName} ${req.body.guestInfo.lastName}` : 'N/A'),
          guestEmail: req.body.guestInfo?.email || 'N/A',
          guestPhone: req.body.guestInfo?.phone || 'N/A',
          bookingDetails: null
        });
      } catch (emailError) {
        console.error('⚠️ Failed to send notification email:', emailError);
      }
    }
    
    return res.status(500).json({
      success: false,
      message: 'Payment verification/booking creation failed',
      error: error.response?.data || error.message,
      refundInitiated: false,
      requiresRefund: true,
      paymentId: req.body.razorpay_payment_id
    });
  }
};

/**
 * Test Refund Notification Email
 * POST /api/booking/razorpay/test-refund-email
 * Sends a test refund notification email to show what admin receives
 */
export const testRefundNotificationEmail = async (req, res) => {
  try {
    // Sample test data matching real scenarios
    const testScenarios = [
      {
        name: 'Booking Creation Failed',
        data: {
          paymentId: 'pay_test_RpusnrdIlShBCS',
          refundId: null,
          amount: 1793600, // ₹17,936.00 in paise
          reason: 'Booking creation failed: Room inventory not available - Manual refund required',
          guestName: 'testing rohan Ambhore',
          guestEmail: 'rohanambhore7@gmail.com',
          guestPhone: '8855817434',
          bookingDetails: {
            checkIn: '2025-12-17',
            checkOut: '2025-12-18',
            rooms: 1,
            reservationNo: null
          }
        }
      },
      {
        name: 'Booking Confirmation Failed',
        data: {
          paymentId: 'pay_test_ABC123XYZ789',
          refundId: null,
          amount: 2500000, // ₹25,000.00 in paise
          reason: 'Booking confirmation failed - Manual refund required',
          guestName: 'John Doe',
          guestEmail: 'john.doe@example.com',
          guestPhone: '+91 9876543210',
          bookingDetails: {
            checkIn: '2026-01-20',
            checkOut: '2026-01-22',
            rooms: 2,
            reservationNo: '1611'
          }
        }
      },
      {
        name: 'System Error',
        data: {
          paymentId: 'pay_test_DEF456UVW012',
          refundId: null,
          amount: 3000000, // ₹30,000.00 in paise
          reason: 'System error: Network timeout during booking process - Manual refund required',
          guestName: 'Jane Smith',
          guestEmail: 'jane.smith@example.com',
          guestPhone: '+91 9876543211',
          bookingDetails: {
            checkIn: '2026-02-10',
            checkOut: '2026-02-12',
            rooms: 2,
            reservationNo: null
          }
        }
      }
    ];

    const scenarioIndex = req.body.scenario || 0; // Default to first scenario
    const testData = testScenarios[scenarioIndex]?.data || testScenarios[0].data;
    const scenarioName = testScenarios[scenarioIndex]?.name || testScenarios[0].name;

    // Send test email
    const result = await sendRefundNotificationEmail(testData);

    return res.status(200).json({
      success: true,
      message: `Test refund notification email sent successfully (Scenario: ${scenarioName})`,
      scenario: scenarioName,
      emailMessageId: result.messageId,
      testData: testData,
      availableScenarios: testScenarios.map((s, i) => ({ index: i, name: s.name }))
    });

  } catch (error) {
    console.error('Error sending test refund notification email:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to send test email',
      error: error.message
    });
  }
};

/**
 * Refund Razorpay Payment
 * POST /api/booking/razorpay/refund
 * Body: { payment_id, amount (optional), reason, guestInfo, bookingDetails }
 */
export const refundRazorpayPayment = async (req, res) => {
  try {
    const { 
      payment_id, 
      amount, // Optional - if not provided, full refund
      reason,
      guestInfo,
      bookingDetails
    } = req.body;

    if (!payment_id) {
      return res.status(400).json({
        success: false,
        message: 'Payment ID is required'
      });
    }

    // Prepare refund options
    const refundOptions = {
      notes: {
        reason: reason || 'Booking creation failed',
        timestamp: new Date().toISOString()
      }
    };

    // If amount is specified, add it (in paise)
    if (amount) {
      refundOptions.amount = Math.round(amount * 100); // Convert to paise
    }

    // Initiate refund
    const refund = await razorpay.payments.refund(payment_id, refundOptions);

    // Send email notification to reservation team
    try {
      await sendRefundNotificationEmail({
        paymentId: payment_id,
        refundId: refund.id,
        amount: refund.amount,
        reason: reason || 'Booking creation failed',
        guestName: guestInfo?.name || (guestInfo?.firstName && guestInfo?.lastName ? `${guestInfo.firstName} ${guestInfo.lastName}` : 'N/A'),
        guestEmail: guestInfo?.email || 'N/A',
        guestPhone: guestInfo?.phone || 'N/A',
        bookingDetails: bookingDetails
      });
    } catch (emailError) {
      console.error('⚠️ Failed to send refund notification email:', emailError);
      // Don't fail the refund if email fails
    }

    return res.status(200).json({
      success: true,
      message: 'Refund initiated successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        currency: refund.currency
      }
    });

  } catch (error) {
    console.error('Error initiating refund:', error.response?.data || error.message);
    
    return res.status(500).json({
      success: false,
      message: 'Refund initiation failed',
      error: error.response?.data || error.message
    });
  }
};
