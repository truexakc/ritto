/**
 * Simple VK Auth Test
 * Tests VK authentication with debug output
 */

const axios = require('axios');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:5001';
const VK_APP_SECRET = 'ca3dcdb0ca3dcdb0ca3dcdb099c9030e53cca3dca3dcdb0a3ba40e0437e1eeeb8678ce9';

// Generate valid Launch Params
function generateValidLaunchParams() {
    const params = {
        vk_user_id: '123456789',
        vk_app_id: '51234567',
        vk_is_app_user: '1',
        vk_are_notifications_enabled: '1',
        vk_language: 'ru',
        vk_platform: 'mobile_web',
        vk_ts: Math.floor(Date.now() / 1000).toString()
    };

    // Generate signature
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys.map(key => `${key}=${params[key]}`).join('&');
    const hmac = crypto.createHmac('sha256', VK_APP_SECRET);
    hmac.update(queryString);
    const sign = hmac.digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    params.sign = sign;
    return params;
}

async function testAuth() {
    console.log('Testing VK Auth Endpoint...\n');
    
    const params = generateValidLaunchParams();
    console.log('Generated params:', params);
    
    // Convert to headers
    const headers = {};
    Object.keys(params).forEach(key => {
        const headerName = `x-${key.replace(/_/g, '-')}`;
        headers[headerName] = params[key];
        console.log(`Header: ${headerName} = ${params[key]}`);
    });
    
    console.log('\nSending request...\n');
    
    try {
        const response = await axios.get(`${BASE_URL}/api/vk/auth`, { headers });
        console.log('✅ Success!');
        console.log('Response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
        if (error.response) {
            console.log('❌ Error:', error.response.status);
            console.log('Response:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.log('❌ Error:', error.message);
        }
    }
}

testAuth();
