#!/usr/bin/env node
// setup-verify.js - Verify MongoDB and Authentication Setup

import axios from 'axios';

const API_URL = 'http://localhost:4000';

async function checkBackendRunning() {
  try {
    console.log('🔍 Checking if backend is running...');
    await axios.get(`${API_URL}/auth/me`, { params: { userId: 'test' } });
    console.log('✅ Backend is running on', API_URL);
    return true;
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Backend is not running');
      console.error('   Run: npm run server');
      return false;
    }
    // 404 means server is running, just missing the request
    return true;
  }
}

async function testRegistration() {
  try {
    console.log('\n🧪 Testing Registration Endpoint...');
    const testUser = {
      full_name: 'Test User',
      email: `test-${Date.now()}@test.com`,
      password: 'TestPassword123!',
      role: 'employee'
    };
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    console.log('✅ Registration successful');
    console.log('   Created user:', response.data.email);
    return response.data;
  } catch (error) {
    if (error.response?.status === 409) {
      console.error('❌ Email already registered');
      return null;
    }
    console.error('❌ Registration failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testLogin() {
  try {
    console.log('\n🧪 Testing Login Endpoint...');
    const testCreds = {
      email: 'test@test.com',
      password: 'TestPassword123!'
    };
    const response = await axios.post(`${API_URL}/auth/login`, testCreds);
    console.log('✅ Login successful');
    console.log('   User:', response.data.email);
    return response.data._id || response.data.id;
  } catch (error) {
    if (error.response?.status === 401) {
      console.error('⚠️  Login failed (invalid credentials)');
      return null;
    }
    console.error('❌ Login failed:', error.response?.data?.message || error.message);
    return null;
  }
}

async function testGetUser(userId) {
  try {
    if (!userId) {
      console.log('\n⏭️  Skipping Get User test (no user ID)');
      return;
    }
    console.log('\n🧪 Testing Get User Endpoint...');
    const response = await axios.get(`${API_URL}/auth/me`, { params: { userId } });
    console.log('✅ Get user successful');
    console.log('   User:', response.data.full_name);
  } catch (error) {
    console.error('❌ Get user failed:', error.response?.data?.message || error.message);
  }
}

async function runTests() {
  console.log('\n' + '='.repeat(50));
  console.log('PayrollPro MongoDB Authentication Verification');
  console.log('='.repeat(50) + '\n');

  const backendRunning = await checkBackendRunning();
  if (!backendRunning) {
    console.error('\n❌ Backend not running. Cannot continue tests.');
    process.exit(1);
  }

  const newUser = await testRegistration();
  await testLogin();
  if (newUser && newUser._id) {
    await testGetUser(newUser._id);
  }

  console.log('\n' + '='.repeat(50));
  console.log('✅ Verification Complete!');
  console.log('='.repeat(50));
  console.log('\n📖 For full documentation, see:');
  console.log('   • QUICK_START.md');
  console.log('   • MONGODB_SETUP.md');
  console.log('\n🚀 Ready to test? Go to: http://localhost:5173\n');
}

runTests().catch(err => {
  console.error('Verification error:', err.message);
  process.exit(1);
});
