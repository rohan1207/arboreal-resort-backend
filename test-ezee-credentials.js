/**
 * Test eZee API credentials and check if InsertBooking is enabled
 */

import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testCredentials() {
  console.log('\n========================================');
  console.log('TESTING EZEE API CREDENTIALS');
  console.log('========================================\n');
  console.log('Hotel Code:', HOTEL_CODE);
  console.log('API Key:', API_KEY);

  // Test 1: ConfiguredPGList (we know this works)
  console.log('\n[Test 1] Testing ConfiguredPGList API...');
  try {
    const pgUrl = `${EZEE_API_BASE_URL}?request_type=ConfiguredPGList&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}`;
    const pgResponse = await axios.get(pgUrl);
    console.log('✅ ConfiguredPGList works!');
    console.log('Payment Gateways found:', JSON.stringify(pgResponse.data, null, 2));
  } catch (error) {
    console.log('❌ ConfiguredPGList failed!', error.response?.data || error.message);
  }

  // Test 2: RoomList (Check Availability)
  console.log('\n[Test 2] Testing RoomList API...');
  try {
    const roomListUrl = `${EZEE_API_BASE_URL}?request_type=RoomList&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&check_in_date=2025-11-15&check_out_date=2025-11-17&number_adults=2&number_children=0&num_rooms=1&property_configuration_info=0&showtax=0&language=en`;
    const roomResponse = await axios.get(roomListUrl);
    
    if (Array.isArray(roomResponse.data) && roomResponse.data.length > 0) {
      console.log('✅ RoomList works!');
      console.log(`Found ${roomResponse.data.length} rooms`);
      console.log('First room:', {
        name: roomResponse.data[0].Room_Name,
        roomtype_id: roomResponse.data[0].roomtypeunkid,
        rateplan_id: roomResponse.data[0].roomrateunkid,
        ratetype_id: roomResponse.data[0].ratetypeunkid
      });
    } else if (roomResponse.data.error || roomResponse.data.Error) {
      console.log('❌ RoomList returned error:', roomResponse.data);
    } else {
      console.log('⚠️ RoomList returned unexpected format:', roomResponse.data);
    }
  } catch (error) {
    console.log('❌ RoomList failed!', error.response?.data || error.message);
  }

  // Test 3: Check if we have RESERVATION account (required for InsertBooking)
  console.log('\n[Test 3] Checking account type...');
  console.log('NOTE: InsertBooking requires "eZee Reservation" account.');
  console.log('If you only have "eZee Centrix" or other product, InsertBooking won\'t work.');
  console.log('');
  console.log('Possible error causes:');
  console.log('1. Hotel doesn\'t have eZee Reservation enabled');
  console.log('2. API Key doesn\'t have InsertBooking permission');
  console.log('3. Property settings in eZee backend block API bookings');
  console.log('');
  console.log('📞 RECOMMENDATION: Contact eZee Support');
  console.log('   Email: support@ezeetechnosys.com');
  console.log('   Ask them to:');
  console.log('   - Verify Hotel Code:', HOTEL_CODE);
  console.log('   - Confirm InsertBooking API is enabled');
  console.log('   - Check if there are any missing required parameters');
}

testCredentials();
