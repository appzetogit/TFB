/**
 * Real Login Flow Test
 * Tests the actual OTP flow with real OTP generation
 */

const axios = require('axios');
const mongoose = require('mongoose');
const OTPService = require('./modules/auth/services/otpService.js');

const API_BASE_URL = 'http://localhost:5000/api';

async function testRealLoginFlow() {
  console.log('\n=== REAL LOGIN FLOW TEST ===');
  
  try {
    // Connect to MongoDB to get real OTP
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Step 1: Send OTP for real user
    console.log('\n1. Sending OTP to test user...');
    const otpResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      email: 'user@test.com',
      purpose: 'login'
    });
    
    console.log('OTP send status:', otpResponse.status);
    console.log('OTP send response:', otpResponse.data);
    
    if (otpResponse.status !== 200) {
      throw new Error('OTP sending failed');
    }
    
    // Step 2: Get the actual OTP from database
    console.log('\n2. Getting OTP from database...');
    const otpService = require('./modules/auth/services/otpService.js');
    const otpData = await otpService.getOTP('user@test.com', 'login');
    
    if (!otpData || !otpData.otp) {
      throw new Error('No OTP found in database');
    }
    
    const realOTP = otpData.otp;
    console.log('Real OTP found:', realOTP);
    
    // Step 3: Verify OTP with real OTP
    console.log('\n3. Verifying OTP with real OTP...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      email: 'user@test.com',
      otp: realOTP,
      purpose: 'login',
      role: 'user'
    });
    
    console.log('OTP verify status:', verifyResponse.status);
    console.log('OTP verify response:', verifyResponse.data);
    
    if (verifyResponse.status !== 200) {
      throw new Error('OTP verification failed');
    }
    
    // Step 4: Check if we get proper response with tokens
    const { success, accessToken, user } = verifyResponse.data.data || {};
    
    if (!success || !accessToken || !user) {
      throw new Error('Invalid login response - missing tokens');
    }
    
    console.log('\n✅ SUCCESS: Login flow working!');
    console.log('Access Token:', accessToken ? 'RECEIVED' : 'MISSING');
    console.log('User Data:', user ? 'RECEIVED' : 'MISSING');
    
    // Step 5: Test if we can access protected endpoint with the token
    console.log('\n4. Testing protected endpoint access...');
    try {
      const protectedResponse = await axios.get(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      console.log('Protected endpoint status:', protectedResponse.status);
      console.log('Protected endpoint response:', protectedResponse.data);
      
      if (protectedResponse.status === 200) {
        console.log('✅ SUCCESS: Token authentication works!');
      } else {
        console.log('❌ FAILED: Token authentication failed');
      }
      
    } catch (protectedError) {
      console.log('Protected endpoint error:', protectedError.response?.status || protectedError.message);
    }
    
    // Step 6: Test cookie setting
    console.log('\n5. Testing cookie setting in response...');
    const cookies = verifyResponse.headers['set-cookie'];
    console.log('Set-Cookie header:', cookies);
    
    if (cookies) {
      console.log('✅ SUCCESS: Cookies are being set in response');
    } else {
      console.log('❌ FAILED: No cookies found in response headers');
    }
    
  } catch (error) {
    console.error('Real login flow test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

async function runRealTest() {
  console.log('='.repeat(60));
  console.log('REAL LOGIN FLOW TEST STARTING');
  console.log('='.repeat(60));
  
  await testRealLoginFlow();
  
  console.log('\n=== REAL LOGIN FLOW TEST RESULTS ===');
  console.log('Check the above output for:');
  console.log('1. OTP sending functionality');
  console.log('2. Real OTP retrieval from database');
  console.log('3. OTP verification with real OTP');
  console.log('4. Token generation and response');
  console.log('5. Protected endpoint access with token');
  console.log('6. Cookie setting in response headers');
  console.log('7. Overall login flow functionality');
  
  console.log('\nExpected behavior:');
  console.log('- OTP should send successfully');
  console.log('- Real OTP should be retrievable from database');
  console.log('- OTP verification should return tokens');
  console.log('- Tokens should be properly formatted');
  console.log('- Protected endpoints should work with tokens');
  console.log('- Cookies should be set in response headers');
  
  console.log('\nCommon issues to look for:');
  console.log('- Backend not running');
  console.log('- CORS blocking requests');
  console.log('- Missing tokens in response');
  console.log('- Invalid token format');
  console.log('- Protected endpoints rejecting valid tokens');
  console.log('- Cookies not being set in response');
  
  console.log('='.repeat(60));
}

// Run test
runRealTest().catch(console.error);
