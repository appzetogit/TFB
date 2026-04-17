/**
 * Login Flow Diagnosis Test Script
 * Tests backend and frontend login components systematically
 */

import axios from 'axios';

// Configuration
const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const TEST_CREDENTIALS = {
  user: {
    email: 'user@test.com',
    password: 'password123'
  }
};

async function testBackendLogin() {
  console.log('\n=== TESTING BACKEND LOGIN API ===');
  
  try {
    // Test 1: Check if backend is running
    console.log('1. Testing backend health...');
    const healthResponse = await axios.get(`${API_BASE_URL.replace('/api', '')}/health`, { timeout: 5000 });
    console.log('Health check:', healthResponse.status, healthResponse.data);
    
    // Test 2: Test OTP sending
    console.log('\n2. Testing OTP sending...');
    const otpResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      email: TEST_CREDENTIALS.user.email,
      purpose: 'login'
    });
    console.log('OTP send status:', otpResponse.status);
    console.log('OTP send response:', otpResponse.data);
    
    // Test 3: Test OTP verification (this should fail without OTP)
    console.log('\n3. Testing OTP verification without OTP...');
    try {
      const verifyResponse = await axios.post(`${API_BASE_URL}/auth/verify-otp`, {
        email: TEST_CREDENTIALS.user.email,
        otp: '123456',
        purpose: 'login',
        role: 'user'
      });
      console.log('OTP verify status:', verifyResponse.status);
      console.log('OTP verify response:', verifyResponse.data);
    } catch (verifyError) {
      console.log('OTP verify error (expected):', verifyError.response?.data || verifyError.message);
    }
    
  } catch (error) {
    console.error('Backend test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ BACKEND NOT RUNNING - Start backend first!');
    }
  }
}

async function testFrontendAPI() {
  console.log('\n=== TESTING FRONTEND API CONFIG ===');
  
  try {
    // Test API base URL configuration
    console.log('1. API_BASE_URL:', API_BASE_URL);
    
    // Test 2: Test API connectivity
    console.log('\n2. Testing API connectivity...');
    const response = await axios.get(`${API_BASE_URL}/auth/me`, { 
      timeout: 5000,
      validateStatus: false // Don't throw on 401
    }).catch(err => {
      console.log('API connectivity error:', err.response?.status || err.code);
    });
    
    console.log('API connectivity status:', response?.status || 'No response');
    
  } catch (error) {
    console.error('Frontend API test failed:', error.message);
  }
}

async function testCORSConfiguration() {
  console.log('\n=== TESTING CORS CONFIGURATION ===');
  
  try {
    // Test CORS preflight
    console.log('1. Testing CORS preflight...');
    const preflightResponse = await axios.options(`${API_BASE_URL}/auth/send-otp`, {
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('CORS preflight status:', preflightResponse.status);
    console.log('CORS preflight headers:', preflightResponse.headers);
    
    // Test 2: Test actual request with credentials
    console.log('\n2. Testing actual request with credentials...');
    const actualResponse = await axios.post(`${API_BASE_URL}/auth/send-otp`, {
      email: TEST_CREDENTIALS.user.email,
      purpose: 'login'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Actual request status:', actualResponse.status);
    console.log('Response data:', actualResponse.data);
    
    // Check for Set-Cookie header
    const setCookieHeader = actualResponse.headers['set-cookie'];
    console.log('Set-Cookie header:', setCookieHeader);
    
  } catch (error) {
    console.error('CORS test failed:', error.message);
  }
}

async function runDiagnosis() {
  console.log('='.repeat(60));
  console.log('LOGIN FLOW DIAGNOSIS STARTING');
  console.log('='.repeat(60));
  
  await testBackendLogin();
  await testFrontendAPI();
  await testCORSConfiguration();
  
  console.log('\n=== DIAGNOSIS COMPLETE ===');
  console.log('\nCheck the above output for:');
  console.log('1. Backend health and connectivity');
  console.log('2. OTP sending functionality');
  console.log('3. API base URL configuration');
  console.log('4. CORS and credentials handling');
  console.log('5. Cookie setting in responses');
  
  console.log('\nCommon issues to look for:');
  console.log('- Backend not running (ECONNREFUSED)');
  console.log('- CORS blocking requests');
  console.log('- Missing withCredentials in frontend');
  console.log('- Cookie not being set by backend');
  console.log('- Wrong API base URL in frontend');
  console.log('- JWT_SECRET not configured');
  console.log('- Token storage issues in frontend');
  
  console.log('='.repeat(60));
}

// Run diagnosis
runDiagnosis().catch(console.error);

export {
  testBackendLogin,
  testFrontendAPI,
  testCORSConfiguration,
  runDiagnosis
};
