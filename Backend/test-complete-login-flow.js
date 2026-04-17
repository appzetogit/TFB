/**
 * Complete Login Flow Test
 * Tests the entire login flow from OTP sending to successful login
 */

const axios = require('axios');

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_CREDENTIALS = {
  user: {
    email: 'user@test.com',
    password: 'password123'
  }
};

async function testCompleteLoginFlow() {
  console.log('\n=== COMPLETE LOGIN FLOW TEST ===');
  
  try {
    // Step 1: Test OTP sending
    console.log('\n1. Testing OTP sending...');
    const otpResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      email: TEST_CREDENTIALS.user.email,
      purpose: 'login'
    });
    
    console.log('OTP send status:', otpResponse.status);
    console.log('OTP send response:', otpResponse.data);
    
    if (otpResponse.status !== 200) {
      throw new Error('OTP sending failed');
    }
    
    // Step 2: Test OTP verification with dummy OTP to simulate real flow
    console.log('\n2. Testing OTP verification...');
    const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
      email: TEST_CREDENTIALS.user.email,
      otp: '123456', // Dummy OTP for testing
      purpose: 'login',
      role: 'user'
    });
    
    console.log('OTP verify status:', verifyResponse.status);
    console.log('OTP verify response:', verifyResponse.data);
    
    if (verifyResponse.status !== 200) {
      throw new Error('OTP verification failed');
    }
    
    // Step 3: Check if we get proper response with tokens
    const { success, accessToken, user } = verifyResponse.data.data || {};
    
    if (!success || !accessToken || !user) {
      throw new Error('Invalid login response - missing tokens');
    }
    
    console.log('\n✅ SUCCESS: Login flow working!');
    console.log('Access Token:', accessToken ? 'RECEIVED' : 'MISSING');
    console.log('User Data:', user ? 'RECEIVED' : 'MISSING');
    
    // Step 4: Test if we can access protected endpoint with the token
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
    
  } catch (error) {
    console.error('Complete login flow test failed:', error.message);
  }
}

async function runCompleteTest() {
  console.log('='.repeat(60));
  console.log('COMPLETE LOGIN FLOW TEST STARTING');
  console.log('='.repeat(60));
  
  await testCompleteLoginFlow();
  
  console.log('\n=== COMPLETE LOGIN FLOW TEST RESULTS ===');
  console.log('Check the above output for:');
  console.log('1. OTP sending functionality');
  console.log('2. OTP verification with token generation');
  console.log('3. Token reception and storage');
  console.log('4. Protected endpoint access with token');
  console.log('5. Overall login flow functionality');
  
  console.log('\nExpected behavior:');
  console.log('- OTP should send successfully');
  console.log('- OTP verification should return tokens');
  console.log('- Tokens should be properly formatted');
  console.log('- Protected endpoints should work with tokens');
  
  console.log('\nCommon issues to look for:');
  console.log('- Backend not running');
  console.log('- CORS blocking requests');
  console.log('- Missing tokens in response');
  console.log('- Invalid token format');
  console.log('- Protected endpoints rejecting valid tokens');
  
  console.log('='.repeat(60));
}

// Run test if called directly
if (require.main === module) {
  runCompleteTest().catch(console.error);
}

module.exports = {
  testCompleteLoginFlow,
  runCompleteTest
};
