import axios from 'axios';

// Ezee API Configuration - Using the Listing API endpoint
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890'; // Your hotel code
const API_KEY = '012892983818a824a6-e3aa-11ef-a'; // Your API key

/**
 * Search for available rooms using Ezee Listing API
 * POST /api/booking/search
 */
export const searchRooms = async (req, res) => {
  try {
    const { checkIn, checkOut, rooms, adults, children } = req.body;

    // Validate required fields
    if (!checkIn || !checkOut || !rooms || !adults) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: checkIn, checkOut, rooms, adults'
      });
    }

    // Build query parameters for Ezee API
    const queryParams = new URLSearchParams({
      request_type: 'RoomList',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      check_in_date: checkIn,
      check_out_date: checkOut,
      number_adults: adults,
      number_children: children || 0,
      num_rooms: rooms,
      promotion_code: '',
      property_configuration_info: '0',
      showtax: '0',
      show_only_available_rooms: '1',
      language: 'en',
      roomtypeunkid: '',
      packagefor: 'DESKTOP',
      promotionfor: 'DESKTOP'
    });

    const apiUrl = `${EZEE_API_BASE_URL}?${queryParams.toString()}`;
    console.log('Searching rooms with URL:', apiUrl);

    // Make request to Ezee API
    const response = await axios.get(apiUrl, {
      timeout: 30000 // 30 second timeout
    });

    // Return the response from Ezee API
    return res.status(200).json({
      success: true,
      data: response.data, // This will be the array of rooms
      searchParams: {
        checkIn,
        checkOut,
        rooms,
        adults,
        children
      }
    });

  } catch (error) {
    console.error('Error searching rooms:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to search for available rooms',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Get room details by room ID
 * GET /api/booking/room/:roomId
 */
export const getRoomDetails = async (req, res) => {
  try {
    const { roomId } = req.params;

    // You can implement additional room details fetching logic here
    // For now, returning a placeholder response
    
    return res.status(200).json({
      success: true,
      message: 'Room details endpoint',
      roomId
    });

  } catch (error) {
    console.error('Error fetching room details:', error);
    
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch room details',
      error: error.message
    });
  }
};

/**
 * Create a new booking using Ezee InsertBooking API
 * POST /api/booking/create
 */
export const createBooking = async (req, res) => {
  try {
    const bookingData = req.body;

    // Validate required booking data
    if (!bookingData.Room_Details || !bookingData.check_in_date || !bookingData.check_out_date || !bookingData.Email_Address) {
      return res.status(400).json({
        success: false,
        message: 'Missing required booking information'
      });
    }

    // Build the BookingData JSON string
    const bookingDataJson = JSON.stringify(bookingData);

    // Create form data for POST request (CORRECT METHOD as per testing)
    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', bookingDataJson);
    
    console.log('\n========================================');
    console.log('=== CREATING BOOKING WITH EZEE API ===');
    console.log('========================================');
    console.log('[Booking Data Received]:', JSON.stringify(bookingData, null, 2));
    console.log('\n[Form Data Being Sent]:');
    console.log(formData.toString().substring(0, 500) + '...\n');
    console.log('========================================\n');

    // Make POST request to Ezee InsertBooking API with form data
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000, // 30 second timeout
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('\n========================================');
    console.log('=== EZEE API RESPONSE ===');
    console.log('========================================');
    console.log('[Response Status]:', response.status);
    console.log('[Response Headers]:', JSON.stringify(response.headers, null, 2));
    console.log('[Response Data]:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('========================================\n');

    // Check if booking was successful
    if (response.data.ReservationNo) {
      return res.status(200).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          ReservationNo: response.data.ReservationNo,
          SubReservationNo: response.data.SubReservationNo,
          InventoryMode: response.data.Inventory_Mode || response.data.InventoryMode
        }
      });
    }
    
    // Handle error array format (most common from eZee API)
    if (Array.isArray(response.data) && response.data.length > 0) {
      const firstError = response.data[0];
      console.error('\n[Ezee API Error - Array Format]');
      console.error('Full error array:', JSON.stringify(response.data, null, 2));
      
      // Check for nested "Error Details" object
      if (firstError["Error Details"]) {
        const errorDetails = firstError["Error Details"];
        console.error('Error Code:', errorDetails.Error_Code);
        console.error('Error Message:', errorDetails.Error_Message);
        
        return res.status(400).json({
          success: false,
          message: 'Booking failed',
          error: response.data,
          errorDetails: errorDetails
        });
      }
      
      // Fallback for other array formats
      let errorMessage = 'Booking failed';
      if (firstError.Error_Message) {
        errorMessage = firstError.Error_Message;
      } else if (firstError.message) {
        errorMessage = firstError.message;
      } else if (typeof firstError === 'string') {
        errorMessage = firstError;
      }
      
      return res.status(400).json({
        success: false,
        message: errorMessage,
        error: response.data,
        errorDetails: firstError
      });
    }
    
    // Handle Error_Details object format
    if (response.data.Error_Details || response.data["Error Details"]) {
      const errorDetails = response.data.Error_Details || response.data["Error Details"];
      console.error('\n[Ezee API Error - Object Format]');
      console.error('Error Details:', JSON.stringify(errorDetails, null, 2));
      
      return res.status(400).json({
        success: false,
        message: errorDetails.Error_Message || 'Booking failed',
        errorCode: errorDetails.Error_Code,
        errorDetails: errorDetails
      });
    }
    
    // Handle other error formats
    if (response.data.error || response.data.Error) {
      const errorMsg = response.data.error || response.data.Error || 'Unknown error from booking system';
      console.error('\n[Ezee API Error - String Format]:', errorMsg);
      
      return res.status(400).json({
        success: false,
        message: 'Booking failed',
        error: response.data.error || response.data.Error
      });
    }
    
    // Unknown format
    console.error('\n[Ezee API - Unexpected Response Format]');
    console.error('Response data:', JSON.stringify(response.data, null, 2));
    
    return res.status(400).json({
      success: false,
      message: 'Booking failed - unexpected response format',
      error: response.data
    });

  } catch (error) {
    console.error('Error creating booking:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to create booking',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Get available extra charges for the hotel
 * GET /api/booking/extras
 */
export const getExtraCharges = async (req, res) => {
  try {
    const queryParams = new URLSearchParams({
      request_type: 'ExtraCharges',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      language: 'en'
    });

    const apiUrl = `${EZEE_API_BASE_URL}?${queryParams.toString()}`;
    console.log('=== Fetching Extra Charges ===');
    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    console.log('Extra Charges API Response:', JSON.stringify(response.data, null, 2));

    // Check for error responses
    if (response.data.error || response.data.Error || response.data === -1) {
      console.error('Extra Charges API Error:', response.data.error || response.data.Error || 'No data found');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No extra charges configured'
      });
    }

    // Check if data is array
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`Found ${response.data.length} extra charges`);
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } else {
      // No extra charges available
      console.log('No extra charges found - empty array or no data');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No extra charges configured'
      });
    }

  } catch (error) {
    console.error('Error fetching extra charges:', error.response?.data || error.message);
    
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No extra charges available',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Calculate extra charge cost
 * POST /api/booking/calculate-extras
 * Body: { checkInDate, checkOutDate, extraChargeId, totalExtraItem }
 */
export const calculateExtraCharge = async (req, res) => {
  try {
    const { checkInDate, checkOutDate, extraChargeId, totalExtraItem } = req.body;

    if (!checkInDate || !checkOutDate || !extraChargeId || !totalExtraItem) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: checkInDate, checkOutDate, extraChargeId, totalExtraItem'
      });
    }

    const queryParams = new URLSearchParams({
      request_type: 'CalculateExtraCharge',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      ExtraChargeId: extraChargeId,
      Total_ExtraItem: totalExtraItem
    });

    const apiUrl = `${EZEE_API_BASE_URL}?${queryParams.toString()}`;
    console.log('Calculating extra charges...');

    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    console.log('Calculate Extra Charges Response:', response.data);

    if (response.data.TotalCharge !== undefined) {
      return res.status(200).json({
        success: true,
        data: {
          individualCharges: response.data.IndividualCharge || {},
          totalCharge: response.data.TotalCharge
        }
      });
    } else if (response.data.error || response.data.Error) {
      return res.status(400).json({
        success: false,
        message: 'Failed to calculate extra charges',
        error: response.data.error || response.data.Error
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Invalid response from extra charge calculation'
      });
    }

  } catch (error) {
    console.error('Error calculating extra charges:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to calculate extra charges',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Process booking after payment (Confirm or Cancel)
 * POST /api/booking/process
 * Body: { ReservationNo, Action: "ConfirmBooking" | "CancelBooking", InventoryMode, ErrorText }
 */
export const processBooking = async (req, res) => {
  try {
    const { ReservationNo, Action, InventoryMode, ErrorText } = req.body;

    // Validate required fields
    if (!ReservationNo || !Action) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: ReservationNo and Action are required'
      });
    }

    // Build Process_Data object
    const processData = {
      Action: Action, // "ConfirmBooking" or "CancelBooking"
      ReservationNo: ReservationNo,
      Inventory_Mode: InventoryMode || "ALLOCATED",
      Error_Text: ErrorText || ""
    };

    // Create form data for POST request
    const formData = new URLSearchParams();
    formData.append('request_type', 'ProcessBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('Process_Data', JSON.stringify(processData));

    console.log('\n========================================');
    console.log('=== PROCESSING BOOKING ===');
    console.log('========================================');
    console.log('[Action]:', Action);
    console.log('[ReservationNo]:', ReservationNo);
    console.log('[Process Data]:', JSON.stringify(processData, null, 2));
    console.log('========================================\n');

    // Make POST request to eZee ProcessBooking API
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('\n========================================');
    console.log('=== EZEE PROCESS BOOKING RESPONSE ===');
    console.log('========================================');
    console.log('[Response Status]:', response.status);
    console.log('[Response Data]:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('========================================\n');

    // Check if processing was successful
    if (response.data.Status === "Success" || response.data.success) {
      return res.status(200).json({
        success: true,
        message: `Booking ${Action === "ConfirmBooking" ? "confirmed" : "cancelled"} successfully`,
        data: response.data
      });
    }

    // Handle error responses
    if (response.data.error || response.data.Error) {
      return res.status(400).json({
        success: false,
        message: 'Booking processing failed',
        error: response.data.error || response.data.Error
      });
    }

    // Unknown response
    return res.status(400).json({
      success: false,
      message: 'Unexpected response from booking processing',
      data: response.data
    });

  } catch (error) {
    console.error('Error processing booking:', error.response?.data || error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      message: 'Failed to process booking',
      error: error.response?.data || error.message
    });
  }
};

/**
 * Get configured payment gateways
 * GET /api/booking/payment-gateways
 */
export const getPaymentGateways = async (req, res) => {
  try {
    const queryParams = new URLSearchParams({
      request_type: 'ConfiguredPGList',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY
    });

    const apiUrl = `${EZEE_API_BASE_URL}?${queryParams.toString()}`;
    console.log('=== Fetching Payment Gateways ===');
    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    console.log('Payment Gateways API Response:', JSON.stringify(response.data, null, 2));

    // Check for error responses
    if (response.data.error || response.data.Error || response.data === -1) {
      console.error('Payment Gateways API Error:', response.data.error || response.data.Error || 'No data found');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No payment gateways configured'
      });
    }

    // Check if data is array
    if (Array.isArray(response.data) && response.data.length > 0) {
      // Filter to only include Razorpay gateways (case-insensitive)
      const razorpayGateways = response.data.filter(gateway => 
        gateway.paymenttype && gateway.paymenttype.toLowerCase().includes('razorpay')
      );
      
      if (razorpayGateways.length > 0) {
        console.log(`Found ${razorpayGateways.length} Razorpay gateway(s)`);
        return res.status(200).json({
          success: true,
          data: razorpayGateways
        });
      } else {
        console.log('No Razorpay gateways found');
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No Razorpay gateway configured'
        });
      }
    } else {
      console.log('No payment gateways found');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No payment gateways configured'
      });
    }

  } catch (error) {
    console.error('Error fetching payment gateways:', error.response?.data || error.message);
    
    return res.status(200).json({
      success: true,
      data: [],
      message: 'No payment gateways available',
      error: error.response?.data || error.message
    });
  }
};
