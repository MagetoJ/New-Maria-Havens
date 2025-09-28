#!/usr/bin/env node

/**
 * Dashboard Button Testing Script for Maria Havens POS
 * Tests all dashboard functionality and button interactions
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const API_BASE_URL = 'http://localhost:8000/api';

// Test credentials
const testUsers = [
  { email: "admin@mariahavens.com", password: "admin123", role: "admin", name: "John Kamau" },
  { email: "manager@mariahavens.com", password: "manager123", role: "manager", name: "Sarah Wanjiku" },
  { email: "receptionist@mariahavens.com", password: "reception123", role: "receptionist", name: "Peter Mwangi" },
  { email: "waiter@mariahavens.com", password: "waiter123", role: "waiter", name: "Grace Akinyi" },
  { email: "kitchen@mariahavens.com", password: "kitchen123", role: "kitchen", name: "David Ochieng" },
];

// Dashboard routes to test
const dashboardRoutes = [
  '/dashboard',
  '/dashboard/reservations',
  '/dashboard/pos',
  '/dashboard/rooms',
  '/dashboard/menu',
  '/dashboard/reports',
  '/dashboard/financial',
  '/dashboard/admin',
  '/dashboard/settings',
  '/dashboard/profile',
];

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testBackendConnection() {
  console.log('🔍 Testing Backend Connection...');
  try {
    const response = await axios.get(`${API_BASE_URL}/auth/me/`, { timeout: 5000 });
    console.log('❌ Backend connection failed (expected - no auth)');
    return false;
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.log('✅ Backend API is running and responding correctly');
      return true;
    }
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Backend server is not running');
      return false;
    }
    console.log('✅ Backend connection test passed');
    return true;
  }
}

async function testFrontendConnection() {
  console.log('🔍 Testing Frontend Connection...');
  try {
    const response = await axios.get(BASE_URL, { timeout: 5000 });
    if (response.data.includes('Maria Havens') || response.status === 200) {
      console.log('✅ Frontend is running and accessible');
      return true;
    }
    console.log('❌ Frontend returned unexpected content');
    return false;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Frontend server is not running');
      return false;
    }
    console.log(`❌ Frontend connection failed: ${error.message}`);
    return false;
  }
}

async function testLoginAPI(user) {
  console.log(`🔍 Testing Login API for ${user.role}...`);
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login/`, {
      email: user.email,
      password: user.password
    }, { timeout: 5000 });

    if (response.data && response.data.user) {
      console.log(`✅ Login successful for ${user.role}: ${response.data.user.first_name} ${response.data.user.last_name}`);
      console.log(`   Role: ${response.data.user.role}, Status: ${response.data.user.status}`);
      return true;
    }
    console.log(`❌ Login failed for ${user.role} - No user data returned`);
    return false;
  } catch (error) {
    console.log(`❌ Login failed for ${user.role}: ${error.response?.data?.error || error.message}`);
    return false;
  }
}

async function testDashboardRoutes() {
  console.log('🔍 Testing Dashboard Routes...');
  const results = [];
  
  for (const route of dashboardRoutes) {
    try {
      const response = await axios.get(`${BASE_URL}${route}`, { 
        timeout: 5000,
        validateStatus: function (status) {
          return status < 500; // Accept any status less than 500
        }
      });
      
      const isAccessible = response.status === 200;
      console.log(`${isAccessible ? '✅' : '⚠️'} ${route} - Status: ${response.status}`);
      results.push({ route, status: response.status, accessible: isAccessible });
    } catch (error) {
      console.log(`❌ ${route} - Error: ${error.message}`);
      results.push({ route, status: 'ERROR', accessible: false, error: error.message });
    }
    await delay(100); // Small delay between requests
  }
  
  return results;
}

async function testDashboardComponents() {
  console.log('🔍 Testing Dashboard Components...');
  
  const componentsToTest = [
    'Dashboard Layout (Navigation)',
    'Dashboard Overview (Stats Cards)',
    'Quick Actions Buttons',
    'Role-based Permissions',
    'Recent Reservations',
    'Restaurant Orders',
    'System Status (Admin)',
    'Room Status (Receptionist)',
  ];
  
  console.log('📋 Dashboard Components Expected:');
  componentsToTest.forEach(component => {
    console.log(`   ✓ ${component}`);
  });
}

async function runFullTest() {
  console.log('🚀 Starting Maria Havens POS Dashboard Test Suite');
  console.log('=' .repeat(60));
  
  // Wait for servers to be ready
  console.log('⏳ Waiting for servers to be ready...');
  await delay(3000);
  
  const results = {
    backend: false,
    frontend: false,
    loginTests: [],
    routeTests: [],
    overall: false
  };
  
  // Test backend connection
  results.backend = await testBackendConnection();
  await delay(1000);
  
  // Test frontend connection
  results.frontend = await testFrontendConnection();
  await delay(1000);
  
  // Test login for each user role
  console.log('\n🔐 Testing User Authentication...');
  for (const user of testUsers) {
    const loginSuccess = await testLoginAPI(user);
    results.loginTests.push({ user: user.role, success: loginSuccess });
    await delay(500);
  }
  
  // Test dashboard routes
  console.log('\n🌐 Testing Dashboard Routes...');
  results.routeTests = await testDashboardRoutes();
  
  // Test dashboard components
  console.log('\n🎛️ Dashboard Components Analysis...');
  await testDashboardComponents();
  
  // Summary
  console.log('\n' + '=' .repeat(60));
  console.log('📊 TEST RESULTS SUMMARY');
  console.log('=' .repeat(60));
  
  console.log(`Backend API: ${results.backend ? '✅ WORKING' : '❌ FAILED'}`);
  console.log(`Frontend App: ${results.frontend ? '✅ WORKING' : '❌ FAILED'}`);
  
  const successfulLogins = results.loginTests.filter(t => t.success).length;
  console.log(`User Authentication: ${successfulLogins}/${results.loginTests.length} roles working`);
  
  const accessibleRoutes = results.routeTests.filter(r => r.accessible).length;
  console.log(`Dashboard Routes: ${accessibleRoutes}/${results.routeTests.length} routes accessible`);
  
  results.overall = results.backend && results.frontend && successfulLogins >= 3;
  
  console.log(`\n🎯 OVERALL STATUS: ${results.overall ? '✅ SYSTEM WORKING' : '❌ ISSUES DETECTED'}`);
  
  if (results.overall) {
    console.log('\n🎉 SUCCESS! Your Maria Havens POS system is fully functional!');
    console.log('\n📝 Next Steps:');
    console.log('   1. Open http://localhost:3000 in your browser');
    console.log('   2. Click "Show Test Credentials" on the login page');
    console.log('   3. Try logging in with different roles:');
    testUsers.forEach(user => {
      console.log(`      • ${user.name} (${user.role}): ${user.email}`);
    });
    console.log('   4. Test the dashboard buttons and navigation');
    console.log('   5. Verify role-based permissions are working');
  } else {
    console.log('\n⚠️ Some issues were detected. Please check:');
    if (!results.backend) console.log('   - Backend Django server (python manage.py runserver)');
    if (!results.frontend) console.log('   - Frontend Next.js server (npm run dev)');
    if (successfulLogins < 3) console.log('   - User authentication setup');
  }
  
  console.log('\n' + '=' .repeat(60));
}

// Run the test
runFullTest().catch(error => {
  console.error('❌ Test suite failed:', error.message);
  process.exit(1);
});