/**
 * Check if VK tables exist in the database
 */

require('dotenv').config();
const db = require('./config/postgres');

async function checkTables() {
    try {
        console.log('Checking VK tables in database...\n');

        // Check vk_orders table
        const ordersCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'vk_orders'
            );
        `);
        
        if (ordersCheck.rows[0].exists) {
            console.log('✅ vk_orders table exists');
            
            // Get column info
            const ordersColumns = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'vk_orders'
                ORDER BY ordinal_position;
            `);
            console.log('   Columns:', ordersColumns.rows.map(r => r.column_name).join(', '));
        } else {
            console.log('❌ vk_orders table does NOT exist');
        }

        // Check vk_order_items table
        const itemsCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'vk_order_items'
            );
        `);
        
        if (itemsCheck.rows[0].exists) {
            console.log('✅ vk_order_items table exists');
            
            const itemsColumns = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'vk_order_items'
                ORDER BY ordinal_position;
            `);
            console.log('   Columns:', itemsColumns.rows.map(r => r.column_name).join(', '));
        } else {
            console.log('❌ vk_order_items table does NOT exist');
        }

        // Check vk_rate_limits table
        const rateLimitsCheck = await db.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'vk_rate_limits'
            );
        `);
        
        if (rateLimitsCheck.rows[0].exists) {
            console.log('✅ vk_rate_limits table exists');
            
            const rateLimitsColumns = await db.query(`
                SELECT column_name, data_type, is_nullable
                FROM information_schema.columns
                WHERE table_name = 'vk_rate_limits'
                ORDER BY ordinal_position;
            `);
            console.log('   Columns:', rateLimitsColumns.rows.map(r => r.column_name).join(', '));
        } else {
            console.log('❌ vk_rate_limits table does NOT exist');
        }

        // Check indexes
        console.log('\nChecking indexes...');
        const indexesCheck = await db.query(`
            SELECT indexname, tablename
            FROM pg_indexes
            WHERE tablename LIKE 'vk_%'
            ORDER BY tablename, indexname;
        `);
        
        if (indexesCheck.rows.length > 0) {
            console.log('✅ Indexes found:');
            indexesCheck.rows.forEach(row => {
                console.log(`   - ${row.indexname} on ${row.tablename}`);
            });
        } else {
            console.log('⚠️ No indexes found for VK tables');
        }

        console.log('\n✅ Database check complete');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error checking tables:', error.message);
        process.exit(1);
    }
}

checkTables();
