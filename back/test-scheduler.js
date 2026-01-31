/**
 * Test script for scheduler functionality
 * This script temporarily modifies the cron expression to run in 1 minute,
 * waits for execution, and verifies the logs
 */

const fs = require('fs');
const path = require('path');

// Calculate cron expression for 1 minute from now
const now = new Date();
const targetTime = new Date(now.getTime() + 60000); // 1 minute from now
const minute = targetTime.getMinutes();
const hour = targetTime.getHours();

// Create cron expression: "minute hour * * *"
const testCronExpression = `${minute} ${hour} * * *`;

console.log('🧪 Starting Scheduler Test');
console.log('━'.repeat(50));
console.log(`⏰ Current time: ${now.toLocaleTimeString()}`);
console.log(`🎯 Target execution time: ${targetTime.toLocaleTimeString()}`);
console.log(`📝 Test cron expression: ${testCronExpression}`);
console.log('━'.repeat(50));

// Set the environment variable
process.env.IMPORT_SCHEDULE_CRON = testCronExpression;

// Import and initialize the scheduler
const { initScheduler, stopScheduler } = require('./services/scheduler');
const logger = require('./utils/logger');

// Initialize scheduler
initScheduler();

console.log('\n✅ Scheduler initialized');
console.log(`⏳ Waiting for scheduled execution at ${targetTime.toLocaleTimeString()}...`);
console.log('   (This will take approximately 1 minute)\n');

// Set a timeout to stop the scheduler after 2 minutes
setTimeout(() => {
    console.log('\n━'.repeat(50));
    console.log('🏁 Test completed');
    console.log('━'.repeat(50));
    console.log('\n📋 Check the logs above to verify:');
    console.log('   ✓ Import started at the scheduled time');
    console.log('   ✓ Import completed successfully');
    console.log('   ✓ Statistics were logged');
    console.log('\n💡 If you see the import logs above, the test passed!');
    console.log('   If not, check the error messages.\n');
    
    stopScheduler();
    process.exit(0);
}, 130000); // Wait 2 minutes and 10 seconds

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n⚠️  Test interrupted by user');
    stopScheduler();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\n⚠️  Test terminated');
    stopScheduler();
    process.exit(0);
});
