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
