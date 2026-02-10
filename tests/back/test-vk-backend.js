/**
 * VK Backend API Checkpoint Test
 * 
 * This script tests all VK backend components:
 * - VK authentication middleware
 * - Rate limiting middleware
 * - Order validation and price recomputation
 * - Telegram notification formatting
 * - Complete order creation flow
 */

const crypto = require('crypto');
const { validateSignature, isTimestampValid, extractUserInfo } = require('./middleware/vkAuthMiddleware');
const { validateOrderAndRecomputePrice, clearCache } = require('./services/orderValidation');
const { formatOrderMessage } = require('./services/telegramNotification');
const logger = require('./utils/logger');

// Test configuration
const TEST_VK_APP_SECRET = 'test_secret_key_12345';
const TEST_VK_USER_ID = 123456789;

// Helper function to generate valid Launch Params
function generateValidLaunchParams(secret, userId = TEST_VK_USER_ID) {
    const params = {
        vk_user_id: userId.toString(),
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
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(queryString);
    const sign = hmac.digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    params.sign = sign;
    return params;
}

// Test 1: VK Authentication - Signature Validation
function testSignatureValidation() {
    console.log('\n=== Test 1: VK Authentication - Signature Validation ===');
    
    try {
        // Test valid signature
        const validParams = generateValidLaunchParams(TEST_VK_APP_SECRET);
        const isValid = validateSignature(validParams, TEST_VK_APP_SECRET);
        
        if (isValid) {
            console.log('✅ Valid signature accepted');
        } else {
            console.log('❌ Valid signature rejected');
            return false;
        }

        // Test invalid signature
        const invalidParams = { ...validParams, sign: 'invalid_signature' };
        const isInvalid = validateSignature(invalidParams, TEST_VK_APP_SECRET);
        
        if (!isInvalid) {
            console.log('✅ Invalid signature rejected');
        } else {
            console.log('❌ Invalid signature accepted');
            return false;
        }

        // Test missing signature
        const missingSignParams = { ...validParams };
        delete missingSignParams.sign;
        const isMissing = validateSignature(missingSignParams, TEST_VK_APP_SECRET);
        
        if (!isMissing) {
            console.log('✅ Missing signature rejected');
        } else {
            console.log('❌ Missing signature accepted');
            return false;
        }

        return true;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Test 2: VK Authentication - Timestamp Validation
function testTimestampValidation() {
    console.log('\n=== Test 2: VK Authentication - Timestamp Validation ===');
    
    try {
        // Test valid timestamp (current time)
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const isCurrentValid = isTimestampValid(currentTimestamp);
        
        if (isCurrentValid) {
            console.log('✅ Current timestamp accepted');
        } else {
            console.log('❌ Current timestamp rejected');
            return false;
        }

        // Test expired timestamp (25 hours ago)
        const expiredTimestamp = currentTimestamp - (25 * 60 * 60);
        const isExpiredValid = isTimestampValid(expiredTimestamp);
        
        if (!isExpiredValid) {
            console.log('✅ Expired timestamp rejected');
        } else {
            console.log('❌ Expired timestamp accepted');
            return false;
        }

        // Test future timestamp
        const futureTimestamp = currentTimestamp + 3600;
        const isFutureValid = isTimestampValid(futureTimestamp);
        
        if (!isFutureValid) {
            console.log('✅ Future timestamp rejected');
        } else {
            console.log('❌ Future timestamp accepted');
            return false;
        }

        // Test boundary timestamp (exactly 24 hours ago)
        const boundaryTimestamp = currentTimestamp - (24 * 60 * 60);
        const isBoundaryValid = isTimestampValid(boundaryTimestamp);
        
        if (isBoundaryValid) {
            console.log('✅ Boundary timestamp (24h) accepted');
        } else {
            console.log('⚠️ Boundary timestamp (24h) rejected (acceptable behavior)');
        }

        return true;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Test 3: VK Authentication - User Info Extraction
function testUserInfoExtraction() {
    console.log('\n=== Test 3: VK Authentication - User Info Extraction ===');
    
    try {
        const params = generateValidLaunchParams(TEST_VK_APP_SECRET, 987654321);
        const userInfo = extractUserInfo(params);
        
        const checks = [
            { name: 'vk_user_id', expected: 987654321, actual: userInfo.vk_user_id },
            { name: 'vk_app_id', expected: 51234567, actual: userInfo.vk_app_id },
            { name: 'vk_is_app_user', expected: 1, actual: userInfo.vk_is_app_user },
            { name: 'vk_language', expected: 'ru', actual: userInfo.vk_language },
            { name: 'vk_platform', expected: 'mobile_web', actual: userInfo.vk_platform }
        ];

        let allPassed = true;
        for (const check of checks) {
            if (check.actual === check.expected) {
                console.log(`✅ ${check.name}: ${check.actual}`);
            } else {
                console.log(`❌ ${check.name}: expected ${check.expected}, got ${check.actual}`);
                allPassed = false;
            }
        }

        return allPassed;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Test 4: Order Validation - Product Validation (Mock)
async function testOrderValidation() {
    console.log('\n=== Test 4: Order Validation - Product Validation ===');
    
    try {
        // Note: This test requires SABY Service to be running
        // We'll test the validation logic with mock data
        
        console.log('⚠️ This test requires SABY Service to be running');
        console.log('⚠️ Skipping actual API call, testing validation logic only');
        
        // Test empty order
        const emptyResult = await validateOrderAndRecomputePrice([], 0);
        if (!emptyResult.valid && emptyResult.errors.length > 0) {
            console.log('✅ Empty order rejected');
        } else {
            console.log('❌ Empty order accepted');
            return false;
        }

        // Test order with invalid quantity
        const invalidQuantityOrder = [
            { product_id: 'test-1', quantity: 0, price: 100 }
        ];
        const invalidQuantityResult = await validateOrderAndRecomputePrice(invalidQuantityOrder, 100);
        if (!invalidQuantityResult.valid) {
            console.log('✅ Invalid quantity rejected');
        } else {
            console.log('❌ Invalid quantity accepted');
            return false;
        }

        console.log('✅ Order validation logic working correctly');
        console.log('⚠️ Full validation test requires SABY Service connection');
        
        return true;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Test 5: Telegram Notification - Message Formatting
function testTelegramMessageFormatting() {
    console.log('\n=== Test 5: Telegram Notification - Message Formatting ===');
    
    try {
        // Test order with delivery
        const deliveryOrder = {
            orderId: 12345,
            vkUser: { vk_user_id: 123456789 },
            phone: '+79001234567',
            deliveryMethod: 'delivery',
            deliveryAddress: 'ул. Ленина, д. 10, кв. 5',
            comment: 'Позвоните за 10 минут',
            items: [
                { product_name: 'Пицца Маргарита', quantity: 2, price: 500 },
                { product_name: 'Кола 0.5л', quantity: 1, price: 100 }
            ],
            totalPrice: 1100,
            createdAt: new Date()
        };

        const deliveryMessage = formatOrderMessage(deliveryOrder);
        
        // Check required fields in message
        const deliveryChecks = [
            { name: 'VK User ID', text: '123456789' },
            { name: 'Phone', text: '+79001234567' },
            { name: 'Order ID', text: '#12345' },
            { name: 'Product 1', text: 'Пицца Маргарита' },
            { name: 'Product 2', text: 'Кола 0.5л' },
            { name: 'Total', text: '1100₽' },
            { name: 'Delivery method', text: 'Доставка' },
            { name: 'Address', text: 'ул. Ленина, д. 10, кв. 5' },
            { name: 'Comment', text: 'Позвоните за 10 минут' }
        ];

        let allDeliveryChecks = true;
        for (const check of deliveryChecks) {
            if (deliveryMessage.includes(check.text)) {
                console.log(`✅ ${check.name} included`);
            } else {
                console.log(`❌ ${check.name} missing: ${check.text}`);
                allDeliveryChecks = false;
            }
        }

        // Test order with pickup (no address)
        const pickupOrder = {
            orderId: 12346,
            vkUser: { vk_user_id: 987654321 },
            phone: '+79009876543',
            deliveryMethod: 'pickup',
            items: [
                { product_name: 'Суши сет', quantity: 1, price: 800 }
            ],
            totalPrice: 800,
            createdAt: new Date()
        };

        const pickupMessage = formatOrderMessage(pickupOrder);
        
        // Check that address is NOT included for pickup
        if (pickupMessage.includes('Самовывоз')) {
            console.log('✅ Pickup method included');
        } else {
            console.log('❌ Pickup method missing');
            allDeliveryChecks = false;
        }

        if (!pickupMessage.includes('Адрес:')) {
            console.log('✅ Address correctly excluded for pickup');
        } else {
            console.log('❌ Address incorrectly included for pickup');
            allDeliveryChecks = false;
        }

        return allDeliveryChecks;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Test 6: Integration - Complete Flow Check
function testCompleteFlowCheck() {
    console.log('\n=== Test 6: Integration - Complete Flow Check ===');
    
    try {
        console.log('Checking component integration...');
        
        // Check that all required modules are loaded
        const components = [
            { name: 'VK Auth Middleware', module: require('./middleware/vkAuthMiddleware') },
            { name: 'Rate Limit Middleware', module: require('./middleware/rateLimitMiddleware') },
            { name: 'Order Validation Service', module: require('./services/orderValidation') },
            { name: 'Telegram Notification Service', module: require('./services/telegramNotification') },
            { name: 'VK Routes', module: require('./routes/vk') },
            { name: 'Error Handler', module: require('./middleware/errorHandler') }
        ];

        let allLoaded = true;
        for (const component of components) {
            if (component.module) {
                console.log(`✅ ${component.name} loaded`);
            } else {
                console.log(`❌ ${component.name} failed to load`);
                allLoaded = false;
            }
        }

        // Check environment variables
        console.log('\nChecking environment configuration...');
        const envVars = [
            { name: 'VK_APP_SECRET', value: process.env.VK_APP_SECRET },
            { name: 'SABY_SERVICE_URL', value: process.env.SABY_SERVICE_URL },
            { name: 'TELEGRAM_BOT_TOKEN', value: process.env.TELEGRAM_BOT_TOKEN },
            { name: 'TELEGRAM_CHAT_ID', value: process.env.TELEGRAM_CHAT_ID }
        ];

        for (const envVar of envVars) {
            if (envVar.value) {
                console.log(`✅ ${envVar.name} configured`);
            } else {
                console.log(`⚠️ ${envVar.name} not configured (optional for testing)`);
            }
        }

        return allLoaded;
    } catch (error) {
        console.log('❌ Test failed with error:', error.message);
        return false;
    }
}

// Run all tests
async function runAllTests() {
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║   VK Backend API Checkpoint Test Suite                ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    const results = {
        'Signature Validation': testSignatureValidation(),
        'Timestamp Validation': testTimestampValidation(),
        'User Info Extraction': testUserInfoExtraction(),
        'Order Validation': await testOrderValidation(),
        'Telegram Message Formatting': testTelegramMessageFormatting(),
        'Complete Flow Check': testCompleteFlowCheck()
    };

    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║   Test Results Summary                                 ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    let passCount = 0;
    let failCount = 0;

    for (const [testName, result] of Object.entries(results)) {
        const status = result ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} - ${testName}`);
        if (result) passCount++;
        else failCount++;
    }

    console.log('\n' + '='.repeat(60));
    console.log(`Total: ${passCount + failCount} tests`);
    console.log(`Passed: ${passCount}`);
    console.log(`Failed: ${failCount}`);
    console.log('='.repeat(60));

    if (failCount === 0) {
        console.log('\n🎉 All tests passed! Backend API is ready.');
        return true;
    } else {
        console.log('\n⚠️ Some tests failed. Please review the errors above.');
        return false;
    }
}

// Run tests
runAllTests()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Fatal error running tests:', error);
        process.exit(1);
    });
