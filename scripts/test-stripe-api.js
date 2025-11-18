#!/usr/bin/env node

/**
 * Test Stripe API connectivity with the updated environment variables
 * This will validate that the Stripe secret key is clean and working
 */

const https = require('https');

// Get the secret key from environment (should be clean now)
const secretKey = process.env.STRIPE_SECRET_KEY;

if (!secretKey) {
  console.error('❌ STRIPE_SECRET_KEY not found in environment');
  process.exit(1);
}

console.log('🔑 Testing Stripe API with secret key...');
console.log('Key starts with:', secretKey.substring(0, 15) + '...');
console.log('Key length:', secretKey.length);
console.log('Key ends with:', secretKey.substring(secretKey.length - 10));
console.log('Has newline at end?', secretKey.endsWith('\n') ? '❌ YES (BROKEN)' : '✅ NO (CLEAN)');
console.log('Has \\n literal?', secretKey.includes('\\n') ? '❌ YES (BROKEN)' : '✅ NO (CLEAN)');
console.log('');

// Test API call
const options = {
  hostname: 'api.stripe.com',
  path: '/v1/customers?limit=1',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${secretKey.trim()}`,
    'Content-Type': 'application/x-www-form-urlencoded'
  }
};

console.log('📡 Making test API call to Stripe...');

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('Response status:', res.statusCode);

    if (res.statusCode === 200) {
      console.log('✅ SUCCESS! Stripe API is working correctly');
      console.log('Response:', JSON.parse(data));
    } else {
      console.log('❌ FAILED! Stripe API returned error');
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
  process.exit(1);
});

req.end();
