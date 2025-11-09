/**
 * Test script to directly test eZee InsertBooking API
 * Testing with OFFICIAL eZee API documentation format
 * Run this with: node test-insert-booking.js
 */

import axios from 'axios';

// Using live.ipms247.com as per OFFICIAL eZee API documentation
const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

// Booking data - Using Forest Bathtub room with EXACT data from room search
const minimalBookingData = {
  "Room_Details": {
    "Room_1": {
      "Rateplan_Id": "4989000000000000002",  // roomrateunkid from Forest Bathtub
      "Ratetype_Id": "4989000000000000001",  // ratetypeunkid from Forest Bathtub
      "Roomtype_Id": "4989000000000000002",  // roomtypeunkid from Forest Bathtub
      "baserate": "20100",                    // exclusive_tax per night from room search
      "extradultrate": "2500",                // extra_adult_rates_info.exclusive_tax
      "extrachildrate": "2500",               // extra_child_rates_info.exclusive_tax
      "number_adults": "2",
      "number_children": "1",
      "Title": "",
      "First_Name": "testing",
      "Last_Name": "Web testing",
      "Gender": "",
      "SpecialRequest": "",
      "ExtraChild_Age": "5"
    }
  },
  "check_in_date": "2025-11-10",
  "check_out_date": "2025-11-12",
  "Booking_Payment_Mode": "",
  "Email_Address": "testing@gmail.com",
  "Source_Id": "",
  "MobileNo": "",
  "Address": "",
  "State": "",
  "Country": "",
  "City": "",
  "Zipcode": "",
  "Fax": "",
  "Device": "",
  "Languagekey": "",
  "paymenttypeunkid": ""
};

async function testInsertBooking() {
  try {
    console.log('\n========================================');
    console.log('TESTING EZEE INSERTBOOKING API');
    console.log('Using OFFICIAL eZee Documentation Format');
    console.log('========================================\n');

    console.log('Booking Data to Send:');
    console.log(JSON.stringify(minimalBookingData, null, 2));

    // Convert booking data to JSON string
    const bookingDataJson = JSON.stringify(minimalBookingData);

    // Try method 1: POST with form data body (as per some eZee examples)
    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', bookingDataJson);

    console.log('\n[API Request Details]');
    console.log('Method: POST with form data body');
    console.log('Base URL:', EZEE_API_BASE_URL);
    console.log('Hotel Code:', HOTEL_CODE);
    console.log('API Key:', API_KEY.substring(0, 10) + '...');
    console.log('Request Type: InsertBooking');
    console.log('\n[Form Data]:', formData.toString().substring(0, 300) + '...\n');

    console.log('[Making POST Request with Form Data...]');
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Node.js Test Script'
      }
    });

    console.log('\n========================================');
    console.log('EZEE API RESPONSE');
    console.log('========================================\n');
    console.log('Status Code:', response.status);
    console.log('Response Data:');
    console.log(JSON.stringify(response.data, null, 2));

    // Check for success
    if (response.data.ReservationNo) {
      console.log('\n✅ SUCCESS! Booking Created');
      console.log('Reservation Number:', response.data.ReservationNo);
    } else if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('\n❌ ERROR! eZee returned an error');
      const error = response.data[0];
      if (error["Error Details"]) {
        console.log('Error Code:', error["Error Details"].Error_Code);
        console.log('Error Message:', error["Error Details"].Error_Message);
      }
    } else {
      console.log('\n⚠️ UNEXPECTED RESPONSE FORMAT');
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
testInsertBooking();
