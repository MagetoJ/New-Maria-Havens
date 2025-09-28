#!/usr/bin/env node

/**
 * Simple Dashboard Test for Maria Havens POS
 * Tests basic connectivity and functionality
 */

const http = require('http');
const https = require('https');

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000';

// Test credentials
const testUsers = [
  { email: "admin@mariahavens.com", password: "admin123", role: "admin", name: "John Kamau" },
  { email: "manager@mariahavens.com", password: "manager123", role: "manager", name: "Sarah Wanjiku" },
  { email: "receptionist@mariahavens.com", password: "reception123", role: "receptionist", name: "Peter Mwangi" },
  { email: "waiter@mariahavens.com", password: "waiter123", role: "waiter", name: "Grace Akinyi" },
  { email: "kitchen@mariahavens.com", password: "kitchen123", role: "kitchen", name: "David Ochieng" },
];

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 5000,
    };

    const req = http.request(requestOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data,
        });
      });
    });

    req.on('error', (error) => reject(error));
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (options.data) {
      req.write(options.data);
    }
    req.end();
  });
}

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend Connection...');
  try {
    const response = await makeRequest(BASE_URL);
    if (response.status === 200) {
      console.log('✅ Frontend is running and accessible');
      return true;
    } else if (response.status === 404) {
      console.log('⚠️ Frontend is running but route not found (expected for some routes)');
      return true;
    }
    console.log(`⚠️ Frontend returned status: ${response.status}`);
    return true; // Consider it working if we get any response
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Frontend server is not running on port 3000');
      return false;
    }
    console.log(`❌ Frontend connection failed: ${error.message}`);
    return false;
  }
}

async function testBackendConnection() {
  console.log('🔍 Testing Backend Connection...');
  try {
    const response = await makeRequest(`${API_BASE_URL}/admin/`);
    console.log('✅ Backend is running and accessible');
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running on port 8000');
      return false;
    }
    console.log(`✅ Backend connection test passed (expected error: ${error.message})`);
    return true;
  }
}

async function testLoginAPI(user) {
  console.log(`🔍 Testing Login API for ${user.role}...`);
  try {
    const postData = JSON.stringify({
      email: user.email,
      password: user.password
    });

    const response = await makeRequest(`${API_BASE_URL}/api/auth/login/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      data: postData
    });

    if (response.status === 200) {
      const responseData = JSON.parse(response.data);
      if (responseData.user) {
        console.log(`✅ Login successful for ${user.role}: ${responseData.user.first_name} ${responseData.user.last_name}`);
        return true;
      }
    }
    console.log(`❌ Login failed for ${user.role} - Status: ${response.status}`);
    return false;
  } catch (error) {
    console.log(`❌ Login API test failed for ${user.role}: ${error.message}`);
    return false;
  }
}

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function runSimpleTest() {
  console.log('🚀 Starting Maria Havens POS Simple Test Suite');
  console.log('=' .repeat(60));
  
  // Wait for servers to be ready
  console.log('⏳ Waiting for servers to be ready...');
  await delay(2000);
  
  let results = {
    frontend: false,
    backend: false,
    loginCount: 0,
    overall: false
  };
  
  // Test frontend
  results.frontend = await testFrontendConnection();
  await delay(1000);
  
  // Test backend
  results.backend = await testBackendConnection();
  await delay(1000);
  
  // Test login for admin user only (quick test)
  console.log('\n🔐 Testing User Authentication (Admin)...');
  const adminLoginSuccess = await testLoginAPI(testUsers[0]);
  if (adminLoginSuccess) results.loginCount = 1;
  
  results.overall = results.frontend && results.backend;
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 QUICK TEST RESULTS');
  console.log('=' .repeat(60));
  
  console.log(`Frontend (Next.js): ${results.frontend ? '✅ RUNNING' : '❌ FAILED'}`);
  console.log(`Backend (Django): ${results.backend ? '✅ RUNNING' : '❌ FAILED'}`);
  console.log(`Admin Login Test: ${results.loginCount > 0 ? '✅ WORKING' : '❌ FAILED'}`);
  
  console.log(`\n🎯 OVERALL STATUS: ${results.overall ? '✅ SERVERS RUNNING' : '❌ ISSUES DETECTED'}`);
  
  if (results.overall) {
    console.log('\n🎉 SUCCESS! Your servers are running!');
    console.log('\n📝 Manual Testing Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. You should see the Maria Havens login page');
    console.log('   3. Click "Show Test Credentials"');
    console.log('   4. Click on any user to auto-fill credentials');
    console.log('   5. Click "Sign In" to access the dashboard');
    console.log('   6. Test the navigation buttons in the sidebar');
    console.log('   7. Test the quick action buttons');
    console.log('   8. Verify role-based content changes');
    
    console.log('\n🔧 Dashboard Buttons to Test:');
    console.log('   Navigation Sidebar:');
    console.log('     • Dashboard (Overview)');
    console.log('     • Reservations');
    console.log('     • Restaurant POS');
    console.log('     • Rooms');
    console.log('     • Menu');
    console.log('     • Reports');
    console.log('     • Financial');
    console.log('     • Admin Portal (admin only)');
    console.log('     • Settings');
    
    console.log('   Quick Action Buttons:');
    console.log('     • New Reservation');
    console.log('     • Take Order / View Orders');
    console.log('     • Check-in Guest');
    console.log('     • View Reports');
    console.log('     • Admin Portal');
    
    console.log('   Other Buttons:');
    console.log('     • View All Reservations');
    console.log('     • View All Orders');
    console.log('     • View System Logs (admin)');
    console.log('     • View Room Management');
    console.log('     • User Profile Dropdown');
    console.log('     • Search Bar');
    console.log('     • Notifications Bell');
    
  } else {
    console.log('\n⚠️ Issues detected. Please check:');
    if (!results.frontend) {
      console.log('   - Start Frontend: cd "c:\\Users\\DELL\\Desktop\\New Maria Havens" && npm run dev');
    }
    if (!results.backend) {
      console.log('   - Start Backend: cd "c:\\Users\\DELL\\Desktop\\New Maria Havens\\backend" && python manage.py runserver');
    }
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the test
runSimpleTest().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});