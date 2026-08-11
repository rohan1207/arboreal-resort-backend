import axios from 'axios';
import https from 'https';

// Ezee API Configuration - Using the Listing API endpoint
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = process.env.EZEE_HOTEL_CODE || '49890';
const API_KEY = process.env.EZEE_API_KEY || '91243578294ceaac47-9172-11f1-8';

// Some local Windows/antivirus SSL setups fail Node cert verification for eZee
const ezeeHttpsAgent = new https.Agent({
  rejectUnauthorized: process.env.EZEE_TLS_STRICT === 'true',
});

const ezeeAxiosConfig = {
  timeout: 30000,
  httpsAgent: ezeeHttpsAgent,
};

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
    // IMPORTANT: eZee API seems to validate total guests against single room capacity
    // So for multiple rooms, we search with 1 room to get all available room types
    // Then users can select multiple rooms in the cart
    // This matches how the old website likely works
    const numRooms = parseInt(rooms, 10);
    const totalAdults = parseInt(adults, 10);
    const totalChildren = parseInt(children || 0, 10);
    
    // For multiple rooms, search with 1 room using per-room averages
    // This allows us to see all available room types, then user selects multiple in cart
    const searchRooms = numRooms > 1 ? 1 : numRooms;
    
    // Calculate per-room average for the API call (eZee validates against single room)
    // Using Math.ceil to ensure we don't under-estimate (e.g., 7 adults / 3 rooms = 3 adults per room)
    const adultsPerRoom = Math.ceil(totalAdults / numRooms);
    const childrenPerRoom = Math.ceil(totalChildren / numRooms);
    
    const queryParams = new URLSearchParams({
      request_type: 'RoomList',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      check_in_date: checkIn,
      check_out_date: checkOut,
      // Note: Do NOT send num_nights when sending check_out_date (causes InvalidSearchCriteria error)
      number_adults: adultsPerRoom.toString(),
      number_children: childrenPerRoom.toString(),
      num_rooms: searchRooms.toString(), // Search with 1 room to get all available types
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

    // Make request to Ezee API
    const response = await axios.get(apiUrl, ezeeAxiosConfig);

    // eZee API can return:
    // 1. An array of rooms (success)
    // 2. An error object with Errors property
    // 3. An empty array [] (no rooms available, but valid response)
    
    // Check if eZee returned an error object
    if (response.data && typeof response.data === 'object' && !Array.isArray(response.data)) {
      if (response.data.Errors || response.data.error || response.data.Error) {
        const errorMessage = response.data.Errors?.ErrorMessage || 
                            response.data.error || 
                            response.data.Error || 
                            'No rooms available';
        
        return res.status(200).json({
          success: true,
          data: [], // Return empty array when there's an error
          Errors: {
            ErrorMessage: errorMessage
          },
          searchParams: {
            checkIn,
            checkOut,
            rooms,
            adults,
            children
          }
        });
      }
    }

    // Handle array response (successful - can be empty array or array of rooms)
    let roomData = Array.isArray(response.data) ? response.data : [];
    
    // Check if array contains error objects (eZee sometimes returns errors as array items)
    if (roomData.length > 0 && roomData[0] && roomData[0]['Error Details']) {
      const errorDetails = roomData[0]['Error Details'];
      const errorMessage = errorDetails.Error_Message || 'No rooms available';
      const errorCode = errorDetails.Error_Code;
      
      return res.status(200).json({
        success: true,
        data: [], // Return empty array when there's an error
        Errors: {
          ErrorMessage: errorMessage,
          ErrorCode: errorCode
        },
        searchParams: {
          checkIn,
          checkOut,
          rooms,
          adults,
          children
        }
      });
    }
    
    // Filter out any error objects and keep only valid room objects
    roomData = roomData.filter(item => {
      // Valid room should have roomtypeunkid or Room_Name
      return item && (item.roomtypeunkid || item.Room_Name || item.Roomtype_Name) && !item['Error Details'];
    });
    
    // Return the response from Ezee API
    return res.status(200).json({
      success: true,
      data: roomData,
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

    // Make POST request to Ezee InsertBooking API with form data
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      ...ezeeAxiosConfig,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

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
      
      // Check for nested "Error Details" object
      if (firstError["Error Details"]) {
        const errorDetails = firstError["Error Details"];
        
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
      
      return res.status(400).json({
        success: false,
        message: 'Booking failed',
        error: response.data.error || response.data.Error
      });
    }
    
    // Unknown format
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

    const response = await axios.get(apiUrl, ezeeAxiosConfig);

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
      return res.status(200).json({
        success: true,
        data: response.data
      });
    } else {
      // No extra charges available
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

    const response = await axios.get(apiUrl, ezeeAxiosConfig);

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

    // Make POST request to eZee ProcessBooking API
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      ...ezeeAxiosConfig,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    // Check if processing was successful
    const data = response.data || {};
    const isSuccess =
      data.Status === "Success" ||
      data.success === true ||
      (typeof data.result === "string" &&
        data.result.toLowerCase() === "success");

    if (isSuccess) {
      return res.status(200).json({
        success: true,
        message: `Booking ${Action === "ConfirmBooking" ? "confirmed" : "cancelled"} successfully`,
        data
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

    const response = await axios.get(apiUrl, ezeeAxiosConfig);

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
        return res.status(200).json({
          success: true,
          data: razorpayGateways
        });
      } else {
        return res.status(200).json({
          success: true,
          data: [],
          message: 'No Razorpay gateway configured'
        });
      }
    } else {
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
