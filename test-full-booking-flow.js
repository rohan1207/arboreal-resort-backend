import axios from 'axios';

const EZEE_API_BASE_URL = 'https://live.ipms247.com/booking/reservation_api/listing.php';
const HOTEL_CODE = '49890';
const API_KEY = '012892983818a824a6-e3aa-11ef-a';

async function testFullBookingFlow() {
  try {
    console.log('\n========================================');
    console.log('=== STEP 1: SEARCH AVAILABLE ROOMS ===');
    console.log('========================================\n');

    // Step 1: Search for rooms
    const searchParams = new URLSearchParams({
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

    const searchUrl = `${EZEE_API_BASE_URL}?${searchParams.toString()}`;
    console.log('Searching rooms...');

    const searchResponse = await axios.get(searchUrl, {
      timeout: 30000
    });

    if (!Array.isArray(searchResponse.data) || searchResponse.data.length === 0) {
      console.error('No rooms found!');
      return;
    }

    console.log(`Found ${searchResponse.data.length} available rooms`);

    // Find "Limited Period - Classic Sunroom - CP" (NOT filtered out, matches WordPress booking)
    const testRoom = searchResponse.data.find(room => 
      room.Room_Name === 'Limited Period - Classic Sunroom - CP'
    );

    if (!testRoom) {
      console.error('Limited Period Classic Sunroom package not found!');
      console.log('Available rooms:', searchResponse.data.map(r => r.Room_Name));
      return;
    }

    console.log('\n=== CLASSIC SUNROOM ROOM DATA ===');
    console.log('Room Name:', testRoom.Room_Name);
    console.log('roomrateunkid:', forestBathtub.roomrateunkid);
    console.log('ratetypeunkid:', forestBathtub.ratetypeunkid);
    console.log('roomtypeunkid:', forestBathtub.roomtypeunkid);
    console.log('\nRate Info:');
    console.log('  rack_rate:', forestBathtub.room_rates_info?.rack_rate);
    console.log('  exclusive_tax:', forestBathtub.room_rates_info?.exclusive_tax);
    console.log('  avg_per_night_after_discount:', forestBathtub.room_rates_info?.avg_per_night_after_discount);
    console.log('\nExtra Adult Rates:');
    console.log('  rack_rate:', forestBathtub.extra_adult_rates_info?.rack_rate);
    console.log('  exclusive_tax:', forestBathtub.extra_adult_rates_info?.exclusive_tax);
    console.log('\nExtra Child Rates:');
    console.log('  rack_rate:', forestBathtub.extra_child_rates_info?.rack_rate);
    console.log('  exclusive_tax:', forestBathtub.extra_child_rates_info?.exclusive_tax);

    // Extract rates from MULTIPLE sources to compare
    const baseRateExclusiveTax = Object.values(forestBathtub.room_rates_info?.exclusive_tax || {})[0];
    const baseRateExclusiveTaxBaserate = Object.values(forestBathtub.room_rates_info?.exclusivetax_baserate || {})[0];
    const baseRateRackRate = Math.round(parseFloat(forestBathtub.room_rates_info?.rack_rate || 0));
    const baseRateAvgAfterDiscount = forestBathtub.room_rates_info?.avg_per_night_after_discount || 0;
    
    const extraAdultExclusiveTax = Object.values(forestBathtub.extra_adult_rates_info?.exclusive_tax || {})[0];
    const extraAdultRackRate = Math.round(parseFloat(forestBathtub.extra_adult_rates_info?.rack_rate || 0));
    
    const extraChildExclusiveTax = Object.values(forestBathtub.extra_child_rates_info?.exclusive_tax || {})[0];
    const extraChildRackRate = Math.round(parseFloat(forestBathtub.extra_child_rates_info?.rack_rate || 0));

    console.log('\n=== EXTRACTED RATES ===');
    console.log('baserate (exclusive_tax):', baseRateExclusiveTax);
    console.log('baserate (exclusivetax_baserate):', baseRateExclusiveTaxBaserate);
    console.log('baserate (rack_rate):', baseRateRackRate);
    console.log('baserate (avg_per_night_after_discount):', baseRateAvgAfterDiscount);
    console.log('extradultrate (exclusive_tax):', extraAdultExclusiveTax);
    console.log('extradultrate (rack_rate):', extraAdultRackRate);
    console.log('extrachildrate (exclusive_tax):', extraChildExclusiveTax);
    console.log('extrachildrate (rack_rate):', extraChildRackRate);
    console.log('\n🔍 TRYING exclusivetax_baserate (may handle discounts properly)');

    // Step 2: Create booking with exact data from room search
    console.log('\n========================================');
    console.log('=== STEP 2: CREATE BOOKING ===');
    console.log('========================================\n');

    const bookingData = {
      "Room_Details": {
        "Room_1": {
          "Rateplan_Id": String(forestBathtub.roomrateunkid),
          "Ratetype_Id": String(forestBathtub.ratetypeunkid),
          "Roomtype_Id": String(forestBathtub.roomtypeunkid),
          "baserate": String(Math.round(parseFloat(baseRateExclusiveTaxBaserate))),
          "extradultrate": String(Math.round(parseFloat(extraAdultExclusiveTax))),
          "extrachildrate": String(Math.round(parseFloat(extraChildExclusiveTax))),
          "number_adults": "2",
          "number_children": "1",
          "ExtraChild_Age": "5",
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
      "paymenttypeunkid": ""  // Leave empty like WordPress does - payment happens after
    };

    console.log('Booking Data:');
    console.log(JSON.stringify(bookingData, null, 2));

    // Create booking
    const formData = new URLSearchParams();
    formData.append('request_type', 'InsertBooking');
    formData.append('HotelCode', HOTEL_CODE);
    formData.append('APIKey', API_KEY);
    formData.append('BookingData', JSON.stringify(bookingData));

    console.log('\nCreating booking...');

    const bookingResponse = await axios.post(EZEE_API_BASE_URL, formData, {
      timeout: 30000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    console.log('\n========================================');
    console.log('=== BOOKING RESPONSE ===');
    console.log('========================================');
    console.log(JSON.stringify(bookingResponse.data, null, 2));

    if (bookingResponse.data.ReservationNo) {
      console.log('\n✅ SUCCESS! Booking created!');
      console.log('Reservation Number:', bookingResponse.data.ReservationNo);
    } else if (Array.isArray(bookingResponse.data) && bookingResponse.data[0]?.["Error Details"]) {
      console.log('\n❌ BOOKING FAILED!');
      console.log('Error Code:', bookingResponse.data[0]["Error Details"].Error_Code);
      console.log('Error Message:', bookingResponse.data[0]["Error Details"].Error_Message);
    } else {
      console.log('\n⚠️ UNEXPECTED RESPONSE');
    }

  } catch (error) {
    console.error('\n❌ ERROR:', error.response?.data || error.message);
  }
}

testFullBookingFlow();
