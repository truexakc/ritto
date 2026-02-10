/**
 * Checkpoint 7 Verification Script
 * Verifies that the backend service is working correctly
 */

const { query } = require('./config/postgres');
const logger = require('./utils/logger');

async function verifyCheckpoint() {
  console.log('🔍 Starting Checkpoint 7 Verification...\n');
  
  let allChecksPass = true;
  
  // Check 1: Verify saby_orders table exists
  console.log('✓ Check 1: Verifying saby_orders table exists...');
  try {
    const tableCheck = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'saby_orders'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('  ✅ saby_orders table exists\n');
    } else {
      console.log('  ❌ saby_orders table does NOT exist\n');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('  ❌ Error checking table:', error.message, '\n');
    allChecksPass = false;
  }
  
  // Check 2: Verify table schema
  console.log('✓ Check 2: Verifying saby_orders table schema...');
  try {
    const schemaCheck = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'saby_orders'
      ORDER BY ordinal_position;
    `);
    
    const expectedColumns = {
      'id': 'integer',
      'saby_order_id': 'character varying',
      'created_at': 'timestamp with time zone'
    };
    
    let schemaValid = true;
    for (const row of schemaCheck.rows) {
      const expectedType = expectedColumns[row.column_name];
      if (expectedType && row.data_type === expectedType) {
        console.log(`  ✅ Column ${row.column_name}: ${row.data_type}`);
      } else if (expectedType) {
        console.log(`  ❌ Column ${row.column_name}: expected ${expectedType}, got ${row.data_type}`);
        schemaValid = false;
      }
    }
    
    if (schemaValid) {
      console.log('  ✅ Table schema is correct\n');
    } else {
      console.log('  ❌ Table schema has issues\n');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('  ❌ Error checking schema:', error.message, '\n');
    allChecksPass = false;
  }
  
  // Check 3: Verify indexes exist
  console.log('✓ Check 3: Verifying indexes...');
  try {
    const indexCheck = await query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'saby_orders';
    `);
    
    const indexes = indexCheck.rows.map(r => r.indexname);
    const expectedIndexes = ['idx_saby_orders_order_id', 'idx_saby_orders_created_at'];
    
    let indexesValid = true;
    for (const expectedIndex of expectedIndexes) {
      if (indexes.includes(expectedIndex)) {
        console.log(`  ✅ Index ${expectedIndex} exists`);
      } else {
        console.log(`  ❌ Index ${expectedIndex} is missing`);
        indexesValid = false;
      }
    }
    
    if (indexesValid) {
      console.log('  ✅ All indexes are present\n');
    } else {
      console.log('  ❌ Some indexes are missing\n');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('  ❌ Error checking indexes:', error.message, '\n');
    allChecksPass = false;
  }
  
  // Check 4: Verify old tables are removed
  console.log('✓ Check 4: Verifying old tables are removed...');
  try {
    const oldTables = ['orders', 'order_items', 'payments'];
    let oldTablesRemoved = true;
    
    for (const tableName of oldTables) {
      const tableCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = $1
        );
      `, [tableName]);
      
      if (!tableCheck.rows[0].exists) {
        console.log(`  ✅ Old table ${tableName} removed`);
      } else {
        console.log(`  ⚠️  Old table ${tableName} still exists`);
        oldTablesRemoved = false;
      }
    }
    
    if (oldTablesRemoved) {
      console.log('  ✅ All old tables removed\n');
    } else {
      console.log('  ⚠️  Some old tables still exist (may be intentional)\n');
    }
  } catch (error) {
    console.log('  ❌ Error checking old tables:', error.message, '\n');
  }
  
  // Check 5: Test insert into saby_orders
  console.log('✓ Check 5: Testing insert into saby_orders...');
  try {
    const testOrderId = `TEST-${Date.now()}`;
    const insertResult = await query(
      'INSERT INTO saby_orders (saby_order_id) VALUES ($1) RETURNING id, saby_order_id, created_at',
      [testOrderId]
    );
    
    if (insertResult.rows.length > 0) {
      const row = insertResult.rows[0];
      console.log(`  ✅ Successfully inserted test order:`);
      console.log(`     - id: ${row.id}`);
      console.log(`     - saby_order_id: ${row.saby_order_id}`);
      console.log(`     - created_at: ${row.created_at}`);
      
      // Clean up test data
      await query('DELETE FROM saby_orders WHERE saby_order_id = $1', [testOrderId]);
      console.log('  ✅ Test data cleaned up\n');
    } else {
      console.log('  ❌ Insert failed\n');
      allChecksPass = false;
    }
  } catch (error) {
    console.log('  ❌ Error testing insert:', error.message, '\n');
    allChecksPass = false;
  }
  
  // Summary
  console.log('═══════════════════════════════════════════════════════');
  if (allChecksPass) {
    console.log('✅ All checks passed! Backend service is ready.');
  } else {
    console.log('❌ Some checks failed. Please review the issues above.');
  }
  console.log('═══════════════════════════════════════════════════════\n');
  
  process.exit(allChecksPass ? 0 : 1);
}

// Run verification
verifyCheckpoint().catch(error => {
  console.error('❌ Verification script failed:', error);
  process.exit(1);
});
