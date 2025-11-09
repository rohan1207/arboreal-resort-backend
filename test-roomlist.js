/**
 * Test script to fetch available room types from eZee API
 * This will show us the real Roomtype_Id, Ratetype_Id, and Rateplan_Id
 * Run this with: node test-roomlist.js
 */

import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testRoomList() {
  try {
    console.log('\n========================================');
    console.log('FETCHING ROOM LIST FROM EZEE API');
    console.log('========================================\n');

    // Build query parameters
    const queryParams = new URLSearchParams({
      request_type: 'RoomList',
      HotelCode: HOTEL_CODE,
      APIKey: API_KEY,
      check_in_date: '2025-11-15',
      check_out_date: '2025-11-16',
      number_adults: '2',
      number_children: '0',
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

    console.log('[API Request Details]');
    console.log('Method: GET');
    console.log('Request Type: RoomList');
    console.log('Hotel Code:', HOTEL_CODE);
    console.log('Check-in: 2025-11-15');
    console.log('Check-out: 2025-11-16');
    console.log('\n[Making API Call...]');

    const response = await axios.get(apiUrl, {
      timeout: 30000
    });

    console.log('\n========================================');
    console.log('EZEE API RESPONSE');
    console.log('========================================\n');
    console.log('Status Code:', response.status);
    console.log('\nRAW RESPONSE DATA:');
    console.log(JSON.stringify(response.data, null, 2));
    console.log('\n');

    // Check if we got rooms
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log(`✅ SUCCESS! Found ${response.data.length} room type(s)\n`);
      
      response.data.forEach((room, index) => {
        console.log(`--- Room ${index + 1}: ${room.RoomType} ---`);
        console.log('Roomtype_Id:', room.Roomtype_Id);
        console.log('Room Name:', room.RoomType);
        console.log('Max Adults:', room.Max_Adults);
        console.log('Max Children:', room.Max_Children);
        console.log('Max Occupancy:', room.Max_Occupancy);
        
        // Show rate plans
        if (room.RatePlans && Array.isArray(room.RatePlans)) {
          console.log('\n  Available Rate Plans:');
          room.RatePlans.forEach((plan, planIndex) => {
            console.log(`    [${planIndex + 1}] ${plan.RatePlan_Name}`);
            console.log(`        Rateplan_Id: ${plan.Rateplan_Id}`);
            console.log(`        Ratetype_Id: ${plan.Ratetype_Id}`);
            console.log(`        Base Rate: ${plan.Total_Rate}`);
            console.log(`        Currency: ${plan.Currency_Code}`);
          });
        }
        console.log('\n');
      });

      // Show a sample booking data structure
      const firstRoom = response.data[0];
      const firstPlan = firstRoom.RatePlans?.[0];
      
      if (firstPlan) {
        console.log('========================================');
        console.log('SAMPLE BOOKING DATA FOR YOUR HOTEL');
        console.log('========================================\n');
        console.log(JSON.stringify({
          Room_Details: {
            Room_1: {
              Rateplan_Id: firstPlan.Rateplan_Id,
              Ratetype_Id: firstPlan.Ratetype_Id,
              Roomtype_Id: firstRoom.Roomtype_Id,
              baserate: firstPlan.Total_Rate || "500",
              extradultrate: "500",
              extrachildrate: "500",
              number_adults: "2",
              number_children: "0",
              Title: "Mr",
              First_Name: "Test",
              Last_Name: "User",
              Gender: "Male",
              SpecialRequest: ""
            }
          },
          check_in_date: "2025-11-15",
          check_out_date: "2025-11-16",
          Booking_Payment_Mode: "Online",
          Email_Address: "test@example.com",
          Source_Id: "1",
          MobileNo: "9999999999",
          Address: "Test Address",
          State: "Test State",
          Country: "India",
          City: "Test City",
          Zipcode: "000000"
        }, null, 2));
      }

    } else if (response.data.error || response.data.Error) {
      console.log('❌ ERROR!');
      console.log('Error:', response.data.error || response.data.Error);
    } else {
      console.log('⚠️ No rooms found or unexpected response format');
      console.log('Response:', JSON.stringify(response.data, null, 2));
    }

  } catch (error) {
    console.error('\n========================================');
    console.error('REQUEST FAILED');
    console.error('========================================\n');
    
    if (error.response) {
      console.error('Response Status:', error.response.status);
      console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error Message:', error.message);
    }
  }
}

// Run the test
testRoomList();
