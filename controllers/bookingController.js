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

    // Build the BookingData JSON string and MANUALLY encode it to avoid encoding quirks
    const bookingDataJson = JSON.stringify(bookingData);
    const encodedBookingData = encodeURIComponent(bookingDataJson);

    // Build URL manually to ensure BookingData is correctly encoded
    const apiUrl = `${EZEE_API_BASE_URL}?request_type=InsertBooking&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&BookingData=${encodedBookingData}&LANGUAGE=en`;
    
    console.log('Creating booking with Ezee API...');
    console.log('Booking Data:', JSON.stringify(bookingData, null, 2));

    // Make request to Ezee InsertBooking API
    const response = await axios.get(apiUrl, {
      timeout: 30000 // 30 second timeout
    });

    console.log('Ezee API Response:', JSON.stringify(response.data, null, 2));

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
    } else if (response.data.Error_Details) {
      // Handle Ezee API error responses with Error_Details
      console.error('Ezee API Error Details:', response.data.Error_Details);
      return res.status(400).json({
        success: false,
        message: response.data.Error_Details.Error_Message || 'Booking failed',
        errorCode: response.data.Error_Details.Error_Code,
        errorDetails: response.data.Error_Details
      });
    } else if (response.data.error || response.data.Error) {
      // Handle other error formats
      const errorMsg = response.data.error || response.data.Error || 'Unknown error from booking system';
      console.error('Ezee API Error:', errorMsg);
      return res.status(400).json({
        success: false,
        message: 'Booking failed',
        error: response.data.error || response.data.Error
      });
    } else if (Array.isArray(response.data) && response.data.length > 0) {
      // Handle error array format
      console.error('Ezee API returned array (likely error):', response.data);
      return res.status(400).json({
        success: false,
        message: 'Booking failed - no reservation number received',
        error: response.data
      });
    } else {
      console.error('Ezee API - Unexpected response format:', response.data);
      return res.status(400).json({
        success: false,
        message: 'Booking failed - unexpected response format',
        error: response.data
      });
    }

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
      console.log(`Found ${response.data.length} payment gateways`);
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } else {
      // No payment gateways configured, return Pay at Hotel as default
      console.log('No payment gateways found - will use Pay at Hotel only');
      return res.status(200).json({
        success: true,
        data: [],
        message: 'No payment gateways configured - Pay at Hotel available'
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
