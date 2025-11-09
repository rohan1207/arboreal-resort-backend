/**
 * Test using GET method as per eZee official documentation
 */

import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testWithGetMethod() {
  try {
    // Remove fields with empty values - maybe eZee considers empty strings as "missing"
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
          "Title": "Mr.",
          "First_Name": "Test",
          "Last_Name": "User",
          "Gender": "Male",
          "SpecialRequest": "None"
        }
      },
      "check_in_date": "2025-11-10",
      "check_out_date": "2025-11-12",
      "Booking_Payment_Mode": "online",
      "Email_Address": "test@example.com",
      "Source_Id": "1",
      "MobileNo": "+911111111111",
      "Address": "Test Address",
      "State": "Maharashtra",
      "Country": "India",
      "City": "Mumbai",
      "Zipcode": "400001",
      "Device": "Web",
      "Languagekey": "en"
      // Removed Fax and paymenttypeunkid
    };

    console.log('\n========================================');
    console.log('TESTING WITH GET METHOD (Official Docs)');
    console.log('========================================\n');

    // Build URL with query parameters as per documentation
    const url = `${EZEE_API_BASE_URL}?request_type=InsertBooking&HotelCode=${HOTEL_CODE}&APIKey=${API_KEY}&BookingData=${encodeURIComponent(JSON.stringify(bookingData))}`;

    console.log('Request URL (first 200 chars):', url.substring(0, 200) + '...');
    console.log('\nBooking Data:');
    console.log(JSON.stringify(bookingData, null, 2));

    console.log('\n[Making GET Request...]');
    const response = await axios.get(url, {
      timeout: 30000,
      headers: {
        'Accept': 'application/json'
      }
    });

    console.log('\n========================================');
    console.log('EZEE API RESPONSE');
    console.log('========================================\n');
    console.log(JSON.stringify(response.data, null, 2));

    if (response.data.ReservationNo) {
      console.log('\n✅✅✅ SUCCESS! Booking Created! ✅✅✅');
      console.log('Reservation Number:', response.data.ReservationNo);
      console.log('Sub Reservation Number:', response.data.SubReservationNo);
      console.log('Inventory Mode:', response.data.Inventory_Mode);
    } else if (Array.isArray(response.data) && response.data[0]?.["Error Details"]) {
      console.log('\n❌ BOOKING FAILED!');
      console.log('Error Code:', response.data[0]["Error Details"].Error_Code);
      console.log('Error Message:', response.data[0]["Error Details"].Error_Message);
    }

  } catch (error) {
    console.error('\n❌ REQUEST FAILED');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('Error:', error.message);
    }
  }
}

testWithGetMethod();
