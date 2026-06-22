/**
 * Seed Script: Test Matrix Population
 * 
 * Populates local PostgreSQL instance with a comprehensive testing dataset.
 * Includes VIP contacts, flagged offenders, and active behavioral rules.
 * 
 * Usage:
 *   NODE_ENV=development DATABASE_URL="postgres://..." tsx scripts/seed-test-matrix.ts
 * 
 * Note: This script clears existing test data before seeding.
 * Safe to run multiple times for testing.
 */

import { db } from '@workspace/db';
import { contacts, routingRules } from '@workspace/db';

const MVP_USER_ID = "00000000-0000-0000-0000-000000000001"; // MVP placeholder user

async function seed() {
  console.log('🌱 Seeding hiDeva local test matrix...\n');

  try {
    // ================================================================
    // 1. CLEAR EXISTING TEST DATA
    // ================================================================
    console.log('Clearing existing test data...');
    await db.delete(routingRules);
    await db.delete(contacts);
    console.log('✓ Cleared\n');

    // ================================================================
    // 2. SEED TEST CONTACTS
    // ================================================================
    console.log('Seeding test contacts...');

    const testContacts = [
      {
        userId: MVP_USER_ID,
        name: 'Dad (VIP)',
        phoneNumber: '+919999999999',
        priority: 'high' as const,
        isSpamReported: false,
      },
      {
        userId: MVP_USER_ID,
        name: 'Mom (VIP)',
        phoneNumber: '+919123456789',
        priority: 'high' as const,
        isSpamReported: false,
      },
      {
        userId: MVP_USER_ID,
        name: 'Co-founder (High Priority)',
        phoneNumber: '+918765432109',
        priority: 'high' as const,
        isSpamReported: false,
      },
      {
        userId: MVP_USER_ID,
        name: 'Persistent Telemarketer',
        phoneNumber: '+911400000000',
        priority: 'low' as const,
        isSpamReported: true,
      },
      {
        userId: MVP_USER_ID,
        name: 'Known Spam Offender (1800)',
        phoneNumber: '+911800112233',
        priority: 'low' as const,
        isSpamReported: true,
      },
      {
        userId: MVP_USER_ID,
        name: 'College Friend',
        phoneNumber: '+918888888888',
        priority: 'medium' as const,
        isSpamReported: false,
      },
      {
        userId: MVP_USER_ID,
        name: 'Work Contact',
        phoneNumber: '+919876543210',
        priority: 'medium' as const,
        isSpamReported: false,
      },
      {
        userId: MVP_USER_ID,
        name: 'Local Number (0-format)',
        phoneNumber: '08067123456',
        priority: 'medium' as const,
        isSpamReported: false,
      },
    ];

    const insertedContacts = await db.insert(contacts).values(testContacts).returning();
    console.log(`✓ Inserted ${insertedContacts.length} test contacts\n`);

    // ================================================================
    // 3. SEED ROUTING RULES
    // ================================================================
    console.log('Seeding routing rules...');

    const testRules = [
      {
        userId: MVP_USER_ID,
        name: 'Default Unknown Screening',
        description: 'All unknown callers (not in contacts) → screen',
        triggerType: 'unknown' as const,
        triggerValue: null,
        action: 'screen' as const,
        priority: 100,
        isActive: true,
      },
      {
        userId: MVP_USER_ID,
        name: 'Block 1800 Telemarketer Lines',
        description: 'Reject calls from known 1800 telemarketer prefix',
        triggerType: 'pattern' as const,
        triggerValue: '+911800*',
        action: 'reject' as const,
        priority: 50,
        isActive: true,
      },
      {
        userId: MVP_USER_ID,
        name: 'Block 140 Series (Customer Care Lines)',
        description: 'Reject calls matching 140xxx pattern (often spam)',
        triggerType: 'pattern' as const,
        triggerValue: '+91140*',
        action: 'reject' as const,
        priority: 51,
        isActive: true,
      },
      {
        userId: MVP_USER_ID,
        name: 'Alternative Rule - Screen 1800',
        description: 'Alternative rule: Screen instead of reject (for A/B testing)',
        triggerType: 'pattern' as const,
        triggerValue: '+918000*',
        action: 'screen' as const,
        priority: 150,
        isActive: false, // Disabled for now
      },
    ];

    const insertedRules = await db.insert(routingRules).values(testRules).returning();
    console.log(`✓ Inserted ${insertedRules.length} routing rules\n`);

    // ================================================================
    // 4. SEED SUMMARY & STATS
    // ================================================================
    console.log('📊 Test Matrix Summary:');
    console.log(`   • User ID: ${MVP_USER_ID}`);
    console.log(`   • Contacts: ${insertedContacts.length}`);
    console.log(`     - High Priority (VIP): 3`);
    console.log(`     - Medium Priority: 2`);
    console.log(`     - Low Priority (Spam): 2`);
    console.log(`     - Local Number Format: 1`);
    console.log(`   • Routing Rules: ${insertedRules.length}`);
    console.log(`     - Active: ${insertedRules.filter(r => r.isActive).length}`);
    console.log(`     - Inactive: ${insertedRules.filter(r => !r.isActive).length}`);
    console.log('\n✅ Local test matrix seeded successfully!\n');

    // ================================================================
    // 5. SHOW NEXT STEPS
    // ================================================================
    console.log('🚀 Next Steps:');
    console.log('   1. Start API server:');
    console.log('      pnpm run dev');
    console.log('   2. Run webhook tests:');
    console.log('      bash scripts/test-webhook.sh');
    console.log('   3. Run mock payload generator:');
    console.log('      node scripts/mock-exotel.ts known-vip');
    console.log('   4. Run stress test:');
    console.log('      tsx scripts/stress-test.ts\n');

  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

// Run the seed
seed();
