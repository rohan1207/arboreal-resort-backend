import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the parent directory
dotenv.config({ path: path.join(__dirname, '..', '.env') });

console.log('🔍 Testing Cloudinary Credentials...\n');

// Get credentials from environment or use defaults
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || 'ddfuu6bop';
const apiKey = process.env.CLOUDINARY_API_KEY || 'daYpxdvUO57iyIvyZh3swpDsIQw';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '417893748926271';

console.log('📋 Credentials being used:');
console.log(`  Cloud Name: ${cloudName}`);
console.log(`  API Key: ${apiKey}`);
console.log(`  API Secret: ${apiSecret}`);
console.log(`  API Secret length: ${apiSecret.length} characters\n`);

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Test the credentials by trying to ping Cloudinary
async function testCredentials() {
  try {
    console.log('🧪 Testing credentials...\n');
    
    // Try to get account details (this will fail if credentials are wrong)
    const result = await cloudinary.api.ping();
    
    console.log('✅ SUCCESS! Credentials are valid!');
    console.log(`   Status: ${result.status}\n`);
    
    // Try to list resources to further verify
    try {
      const resources = await cloudinary.api.resources({
        type: 'upload',
        max_results: 1,
      });
      console.log(`✅ Account access verified!`);
      console.log(`   Total resources: ${resources.total_count || 0}`);
    } catch (err) {
      console.log(`⚠️  Could not list resources: ${err.message}`);
      console.log(`   But ping succeeded, so credentials are valid!`);
    }
    
  } catch (error) {
    console.error('❌ FAILED! Credentials are invalid or account is not accessible.');
    const errorMsg = error?.message || JSON.stringify(error) || String(error);
    console.error(`   Error: ${errorMsg}`);
    console.error(`   Full error:`, error);
    console.log('');
    
    console.log('💡 Possible issues:');
    console.log('   1. API Key does not match the Cloud Name');
    console.log('   2. API Key or Secret has extra spaces or characters');
    console.log('   3. Account is not fully activated');
    console.log('   4. Account has been suspended or disabled');
    console.log('   5. The credentials might be incorrect\n');
    
    console.log('🔍 Please verify in your Cloudinary Dashboard:');
    console.log('   1. Go to: https://console.cloudinary.com/settings/api');
    console.log('   2. Check that Cloud Name matches:', cloudName);
    console.log('   3. Check that API Key matches:', apiKey);
    console.log('   4. Verify the API Secret is correct');
    console.log('   5. Make sure the account is active (not suspended)\n');
    
    console.log('📝 Double-check:');
    console.log('   - No extra spaces before/after credentials');
    console.log('   - Cloud Name, API Key, and API Secret all belong to the same account');
    console.log('   - Account is not in trial/limited mode that might restrict API access\n');
    
    process.exit(1);
  }
}

testCredentials();

