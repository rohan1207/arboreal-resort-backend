/**
 * Test with ZERO extra rates - maybe that's the issue
 */

import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testWithZeroExtras() {
  try {
    // Try with base_adult_occupancy only (2 adults, 0 children)
    // NO extra charges
    const bookingData = {
      "Room_Details": {
        "Room_1": {
          "Rateplan_Id": "4989000000000000002",
          "Ratetype_Id": "4989000000000000001",
          "Roomtype_Id": "4989000000000000002",
          "baserate": "16281",
          "extradultrate": "0",    // ZERO extra adult rate
          "extrachildrate": "0",   // ZERO extra child rate
          "number_adults": "2",
          "number_children": "0",  // NO children - remove ExtraChild_Age
          "Title": "",
          "First_Name": "Test",
          "Last_Name": "User",
          "Gender": "",
          "SpecialRequest": ""
        }
      },
      "check_in_date": "2025-11-10",
      "check_out_date": "2025-11-12",
      "Booking_Payment_Mode": "",
      "Email_Address": "test@example.com",
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

    console.log('\n========================================');
    console.log('TESTING WITH ZERO EXTRA RATES');
    console.log('2 adults, 0 children, no extras');
    console.log('========================================\n');

    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', JSON.stringify(bookingData));

    console.log('Booking Data:');
    console.log(JSON.stringify(bookingData, null, 2));

    console.log('\n[Making POST Request...]');
    const response = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('\n========================================');
    console.log('EZEE API RESPONSE');
    console.log('========================================\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.ReservationNo) {
      console.log('\n✅✅✅ SUCCESS! Booking Created! ✅✅✅');
      console.log('Reservation Number:', response.data.ReservationNo);
    } else if (Array.isArray(response.data) && response.data[0]?.["Error Details"]) {
      console.log('\n❌ BOOKING FAILED!');
      console.log('Error Code:', response.data[0]["Error Details"].Error_Code);
      console.log('Error Message:', response.data[0]["Error Details"].Error_Message);
    }

  } catch (error) {
    console.error('\n❌ REQUEST FAILED');
    console.error(error.response?.data || error.message);
  }
}

testWithZeroExtras();
