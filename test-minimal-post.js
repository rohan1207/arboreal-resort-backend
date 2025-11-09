/**
 * Test with POST and MINIMAL fields only (exactly as documentation example)
 */

import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testMinimalPost() {
  try {
    // Use EXACT same structure as documentation example - minimal fields only
    const bookingData = {
      "Room_Details": {
        "Room_1": {
          "Rateplan_Id": "4989000000000000002",
          "Ratetype_Id": "4989000000000000001",
          "Roomtype_Id": "4989000000000000002",
          "baserate": "16281",
          "extradultrate": "3000",
          "extrachildrate": "1500",
          "number_adults": "2",
          "number_children": "1",
          "ExtraChild_Age": "5",
          "Title": "",
          "First_Name": "ABC",
          "Last_Name": "Joy",
          "Gender": "",
          "SpecialRequest": ""
        }
      },
      "check_in_date": "2025-11-10",
      "check_out_date": "2025-11-12",
      "Booking_Payment_Mode": "",
      "Email_Address": "abc@gmail.com",
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
    console.log('TESTING WITH MINIMAL FIELDS (POST)');
    console.log('Exactly as documentation example');
    console.log('========================================\n');

    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', JSON.stringify(bookingData));

    console.log('Booking Data:');
    console.log(JSON.stringify(bookingData, null, 2));

    console.log('\n[Making POST Request with form data...]');
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

testMinimalPost();
