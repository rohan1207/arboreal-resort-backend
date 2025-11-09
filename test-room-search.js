import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testRoomSearch() {
  try {
    // Build query parameters for Ezee API
    const queryParams = new URLSearchParams({
      request_type: 'RoomList',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      check_in_date: '2025-11-10',
      check_out_date: '2025-11-12',
      number_adults: '2',
      number_children: '1',
      num_rooms: '1',
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
    console.log('Room Search API URL:', apiUrl);
    console.log('\n========================================');
    console.log('=== FETCHING ROOM LIST FROM EZEE ===');
    console.log('========================================\n');

    // Make request to Ezee API
    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    console.log('\n========================================');
    console.log('=== EZEE ROOM LIST RESPONSE ===');
    console.log('========================================');
    console.log('Response Status:', response.status);
    console.log('\nRoom Data (Full):');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('\n========================================');
      console.log('=== FIRST ROOM DETAILS ===');
      console.log('========================================');
      const firstRoom = response.data[0];
      console.log('Room Name:', firstRoom.Room_Name);
      console.log('roomrateunkid:', firstRoom.roomrateunkid);
      console.log('ratetypeunkid:', firstRoom.ratetypeunkid);
      console.log('roomtypeunkid:', firstRoom.roomtypeunkid);
      console.log('\nAll Room Fields:');
      Object.keys(firstRoom).forEach(key => {
        console.log(`  ${key}: ${firstRoom[key]}`);
      });
      
      console.log('\n========================================');
      console.log('=== ID COMPARISON ===');
      console.log('========================================');
      console.log('roomrateunkid === ratetypeunkid:', firstRoom.roomrateunkid === firstRoom.ratetypeunkid);
      console.log('roomrateunkid === roomtypeunkid:', firstRoom.roomrateunkid === firstRoom.roomtypeunkid);
      console.log('ratetypeunkid === roomtypeunkid:', firstRoom.ratetypeunkid === firstRoom.roomtypeunkid);
    }
    console.log('========================================\n');

  } catch (error) {
    console.error('Error searching rooms:', error.response?.data || error.message);
  }
}

testRoomSearch();
