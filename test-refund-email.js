/**
 * Test script to send a test refund notification email
 * This shows what the admin will receive when a booking fails but payment is done
 * 
 * Usage: node test-refund-email.js [scenario_index]
 * 
 * Scenarios:
 * 0 - Booking Creation Failed
 * 1 - Booking Confirmation Failed  
 * 2 - System Error
 */

import axios from 'axios';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:5001';
const scenarioIndex = process.argv[2] ? parseInt(process.argv[2]) : 0;

const scenarios = [
  'Booking Creation Failed',
  'Booking Confirmation Failed',
  'System Error'
];

async function testRefundEmail() {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/api/booking/razorpay/test-refund-email`,
      { scenario: scenarioIndex },
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

  } catch (error) {
    console.error('❌ Error sending test email:');
    if (error.response) {
      console.error('[Status]:', error.response.status);
      console.error('[Data]:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('[Error]:', error.message);
    }
    process.exit(1);
  }
}

testRefundEmail();


