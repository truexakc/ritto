/**
 * VK Mini App End-to-End Integration Test
 * 
 * Tests the complete order flow:
 * 1. Fetch catalog from SABY Service
 * 2. Create order with VK Launch Params
 * 3. Verify order in database
 * 4. Verify Telegram notification (check logs)
 * 
 * Requirements: All requirements
 */

require('dotenv').config({ path: require('path').join(__dirname, '.env') });

const axios = require('axios');
const crypto = require('crypto');
const { Pool } = require('pg');

// Configuration
const BACKEND_API_URL = process.env.BACKEND_API_URL || 'http://localhost:5001';
const SABY_SERVICE_URL = 'http://localhost:8080'; // Always use localhost for testing
const VK_APP_SECRET = process.env.VK_APP_SECRET;

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    user: process.env.DB_USER || 'ritto_user',
    password: process.env.DB_PASSWORD || 'ritto_password',
    database: process.env.DB_NAME || 'ritto_db'
};

const pool = new Pool(dbConfig);

/**
 * Generate VK Launch Params with valid signature
 */
function generateLaunchParams(vkUserId = 12345678) {
    const timestamp = Math.floor(Date.now() / 1000);
    
    const params = {
        vk_user_id: vkUserId,
        vk_app_id: 54445027,
        vk_is_app_user: 1,
        vk_are_notifications_enabled: 1,
        vk_language: 'ru',
        vk_platform: 'mobile_web',
        vk_ts: timestamp
    };
    
    // Sort parameters and create query string
    const sortedKeys = Object.keys(params).sort();
    const queryString = sortedKeys
        .map(key => `${key}=${params[key]}`)
        .join('&');
    
    // Calculate HMAC-SHA256 signature
    const hmac = crypto.createHmac('sha256', VK_APP_SECRET);
    hmac.update(queryString);
    const sign = hmac.digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    return { ...params, sign };
}

/**
 * Convert Launch Params to query string
 * Note: sign parameter is added at the end, not sorted with other parameters
 */
function launchParamsToQueryString(launchParams) {
    const { sign, ...paramsWithoutSign } = launchParams;
    const sortedKeys = Object.keys(paramsWithoutSign).sort();
    const queryString = sortedKeys.map(key => `${key}=${paramsWithoutSign[key]}`).join('&');
    return `${queryString}&sign=${sign}`;
}

/**
 * Convert Launch Params to headers (for X-Request-ID)
 */
function launchParamsToHeaders(launchParams) {
    return {
        'x-vk-user-id': launchParams.vk_user_id.toString(),
        'x-vk-app-id': launchParams.vk_app_id.toString(),
        'x-vk-is-app-user': launchParams.vk_is_app_user.toString(),
        'x-vk-are-notifications-enabled': launchParams.vk_are_notifications_enabled.toString(),
        'x-vk-language': launchParams.vk_language,
        'x-vk-platform': launchParams.vk_platform,
        'x-vk-ts': launchParams.vk_ts.toString(),
        'x-vk-sign': launchParams.sign
    };
}

/**
 * Generate UUID for request ID
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = (Math.random() * 16) | 0;
        const v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}

/**
 * Test 1: Fetch catalog from SABY Service
 */
async function testFetchCatalog() {
    console.log('\n📦 Test 1: Fetching catalog from SABY Service...');
    
    try {
        const response = await axios.get(`${SABY_SERVICE_URL}/api/catalog/products`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        const products = Array.isArray(response.data) ? response.data : response.data.products || [];
        
        if (products.length === 0) {
            console.log('⚠️  Warning: Catalog is empty');
            return [];
        }
        
        console.log(`✅ Catalog fetched successfully: ${products.length} products`);
        console.log(`   Sample product: ${products[0]?.name || 'N/A'}`);
        
        return products;
    } catch (error) {
        console.error('❌ Failed to fetch catalog:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Test 2: Validate authentication
 */
async function testValidateAuth(launchParams) {
    console.log('\n🔐 Test 2: Validating authentication...');
    
    try {
        const queryString = launchParamsToQueryString(launchParams);
        console.log('   Full query string:', queryString);
        const response = await axios.get(`${BACKEND_API_URL}/api/vk/auth?${queryString}`);
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200, got ${response.status}`);
        }
        
        console.log('✅ Authentication validated successfully');
        console.log('   User ID:', response.data.user.vk_user_id);
        
        return response.data;
    } catch (error) {
        console.error('❌ Failed to validate authentication:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Test 3: Create order
 */
async function testCreateOrder(launchParams, products) {
    console.log('\n📝 Test 3: Creating order...');
    
    // Select first 2 products from catalog (or use mock if catalog is empty)
    let orderItems;
    if (products.length > 0) {
        orderItems = products.slice(0, 2).map(product => ({
            product_id: product.id,
            product_name: product.name,
            quantity: 2,
            price: product.price
        }));
    } else {
        // Use mock items if catalog is empty
        console.log('⚠️  Using mock items (catalog is empty)');
        orderItems = [
            {
                product_id: 'mock-product-1',
                product_name: 'Test Product 1',
                quantity: 2,
                price: 500
            },
            {
                product_id: 'mock-product-2',
                product_name: 'Test Product 2',
                quantity: 1,
                price: 300
            }
        ];
    }
    
    const requestId = generateUUID();
    const frontendTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    
    const orderData = {
        request_id: requestId,
        items: orderItems,
        delivery_method: 'delivery',
        delivery_address: 'Test Address, 123',
        phone: '+79991234567',
        comment: 'E2E Integration Test Order',
        frontend_total: frontendTotal
    };
    
    try {
        const queryString = launchParamsToQueryString(launchParams);
        const response = await axios.post(
            `${BACKEND_API_URL}/api/vk/orders?${queryString}`,
            orderData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                }
            }
        );
        
        if (response.status !== 201) {
            throw new Error(`Expected status 201, got ${response.status}`);
        }
        
        console.log('✅ Order created successfully');
        console.log('   Order ID:', response.data.order_id);
        console.log('   Actual Total:', response.data.actual_total);
        console.log('   Status:', response.data.status);
        
        return {
            orderId: response.data.order_id,
            requestId,
            actualTotal: response.data.actual_total
        };
    } catch (error) {
        console.error('❌ Failed to create order:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
}

/**
 * Test 4: Verify order in database
 */
async function testVerifyOrderInDatabase(orderId, requestId, vkUserId) {
    console.log('\n🔍 Test 4: Verifying order in database...');
    
    try {
        // Query vk_orders table
        const orderQuery = `
            SELECT id, request_id, vk_user_id, phone, delivery_method, 
                   delivery_address, total_price, status, created_at
            FROM vk_orders
            WHERE id = $1
        `;
        const orderResult = await pool.query(orderQuery, [orderId]);
        
        if (orderResult.rows.length === 0) {
            throw new Error(`Order ${orderId} not found in database`);
        }
        
        const order = orderResult.rows[0];
        
        // Verify order data
        if (order.request_id !== requestId) {
            throw new Error(`Request ID mismatch: expected ${requestId}, got ${order.request_id}`);
        }
        
        if (order.vk_user_id !== vkUserId) {
            throw new Error(`User ID mismatch: expected ${vkUserId}, got ${order.vk_user_id}`);
        }
        
        console.log('✅ Order found in database');
        console.log('   Order ID:', order.id);
        console.log('   Request ID:', order.request_id);
        console.log('   VK User ID:', order.vk_user_id);
        console.log('   Phone:', order.phone);
        console.log('   Delivery Method:', order.delivery_method);
        console.log('   Total Price:', order.total_price);
        console.log('   Status:', order.status);
        
        // Query vk_order_items table
        const itemsQuery = `
            SELECT product_id, product_name, quantity, price
            FROM vk_order_items
            WHERE order_id = $1
        `;
        const itemsResult = await pool.query(itemsQuery, [orderId]);
        
        console.log(`   Items: ${itemsResult.rows.length} items`);
        itemsResult.rows.forEach((item, index) => {
            console.log(`     ${index + 1}. ${item.product_name} x${item.quantity} - ${item.price}₽`);
        });
        
        return order;
    } catch (error) {
        console.error('❌ Failed to verify order in database:', error.message);
        throw error;
    }
}

/**
 * Test 5: Test idempotency (duplicate request)
 */
async function testIdempotency(launchParams, requestId, expectedOrderId) {
    console.log('\n🔄 Test 5: Testing idempotency (duplicate request)...');
    
    const orderData = {
        request_id: requestId,
        items: [
            {
                product_id: 'test-product',
                product_name: 'Test Product',
                quantity: 1,
                price: 100
            }
        ],
        delivery_method: 'pickup',
        phone: '+79991234567',
        frontend_total: 100
    };
    
    try {
        const queryString = launchParamsToQueryString(launchParams);
        const response = await axios.post(
            `${BACKEND_API_URL}/api/vk/orders?${queryString}`,
            orderData,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Request-ID': requestId
                }
            }
        );
        
        if (response.status !== 200) {
            throw new Error(`Expected status 200 (idempotent), got ${response.status}`);
        }
        
        if (response.data.order_id !== expectedOrderId) {
            throw new Error(`Order ID mismatch: expected ${expectedOrderId}, got ${response.data.order_id}`);
        }
        
        console.log('✅ Idempotency test passed');
        console.log('   Returned existing order ID:', response.data.order_id);
        console.log('   Message:', response.data.message);
        
        return response.data;
    } catch (error) {
        console.error('❌ Idempotency test failed:', error.message);
        if (error.response) {
            console.error('   Response status:', error.response.status);
            console.error('   Response data:', error.response.data);
        }
        throw error;
    }
}

/**
 * Main test runner
 */
async function runTests() {
    console.log('🚀 Starting VK Mini App E2E Integration Tests');
    console.log('================================================');
    console.log('Backend API URL:', BACKEND_API_URL);
    console.log('SABY Service URL:', SABY_SERVICE_URL);
    console.log('VK App Secret:', VK_APP_SECRET ? '✓ Configured' : '✗ Not configured');
    
    if (!VK_APP_SECRET) {
        console.error('\n❌ VK_APP_SECRET is not configured. Please set it in .env file.');
        process.exit(1);
    }
    
    let testsPassed = 0;
    let testsFailed = 0;
    
    try {
        // Generate Launch Params
        const vkUserId = Math.floor(Math.random() * 1000000) + 1000000; // Random user ID
        const launchParams = generateLaunchParams(vkUserId);
        console.log('\n🔑 Generated Launch Params for VK User ID:', vkUserId);
        
        // Test 1: Fetch catalog
        let products = [];
        try {
            products = await testFetchCatalog();
            testsPassed++;
        } catch (error) {
            testsFailed++;
            console.log('⚠️  Continuing with empty catalog...');
        }
        
        // Test 2: Validate authentication
        try {
            await testValidateAuth(launchParams);
            testsPassed++;
        } catch (error) {
            testsFailed++;
        }
        
        // Test 3: Create order
        let orderResult;
        try {
            orderResult = await testCreateOrder(launchParams, products);
            testsPassed++;
        } catch (error) {
            testsFailed++;
            throw error; // Can't continue without order
        }
        
        // Test 4: Verify order in database
        try {
            await testVerifyOrderInDatabase(orderResult.orderId, orderResult.requestId, vkUserId);
            testsPassed++;
        } catch (error) {
            testsFailed++;
        }
        
        // Test 5: Test idempotency
        try {
            await testIdempotency(launchParams, orderResult.requestId, orderResult.orderId);
            testsPassed++;
        } catch (error) {
            testsFailed++;
        }
        
        // Summary
        console.log('\n================================================');
        console.log('📊 Test Summary');
        console.log('================================================');
        console.log(`✅ Tests Passed: ${testsPassed}`);
        console.log(`❌ Tests Failed: ${testsFailed}`);
        console.log(`📝 Total Tests: ${testsPassed + testsFailed}`);
        
        if (testsFailed === 0) {
            console.log('\n🎉 All tests passed!');
            console.log('\n📱 Telegram Notification:');
            console.log('   Check your Telegram bot for the order notification.');
            console.log('   The notification should include:');
            console.log('   - VK User ID');
            console.log('   - Phone number');
            console.log('   - Order items');
            console.log('   - Total price');
            console.log('   - Delivery method and address');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the errors above.');
            process.exit(1);
        }
        
    } catch (error) {
        console.error('\n💥 Test execution failed:', error.message);
        process.exit(1);
    } finally {
        // Close database connection
        await pool.end();
    }
}

// Run tests
runTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
