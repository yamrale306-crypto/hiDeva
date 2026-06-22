/**
 * Mock Exotel Webhook Payload Generator
 * 
 * Use this to test the webhook locally without hitting real Exotel.
 * 
 * Usage:
 *   curl -X POST http://localhost:8080/api/calls/webhook \
 *     -H "Content-Type: application/json" \
 *     -d "$(node ./mock-exotel.js known-vip)"
 * 
 * Scenarios:
 *   - known-vip: Contact in DB with high priority → expect 'connect'
 *   - known-spam: Contact marked as spam → expect 'reject'
 *   - unknown: No contact record → expect 'screen' (or depends on rules)
 */

import crypto from 'crypto';

interface MockScenario {
  name: string;
  payload: {
    CallSid: string;
    CallFrom: string;
    CallTo: string;
    Direction: 'incoming' | 'outgoing';
  };
  description: string;
}

const scenarios: Record<string, MockScenario> = {
  'known-vip': {
    name: 'VIP Contact (Mom)',
    payload: {
      CallSid: crypto.randomUUID(),
      CallFrom: '+919123456789', // This should be in contacts with priority='high'
      CallTo: '080-HIDEVA-1', // Virtual ExoPhone
      Direction: 'incoming',
    },
    description: 'Contact exists with high priority → should route to "connect"',
  },

  'known-spam': {
    name: 'Known Spam / Low Priority',
    payload: {
      CallSid: crypto.randomUUID(),
      CallFrom: '+918001234567', // Known spam / telemarketer
      CallTo: '080-HIDEVA-1',
      Direction: 'incoming',
    },
    description: 'Contact marked as spam or low priority → should route to "reject"',
  },

  'unknown-caller': {
    name: 'Unknown Number',
    payload: {
      CallSid: crypto.randomUUID(),
      CallFrom: '+919999999999', // Not in contacts
      CallTo: '080-HIDEVA-1',
      Direction: 'incoming',
    },
    description: 'No contact record; unknown caller → should route to "screen"',
  },

  'telemarketer-pattern': {
    name: 'Matches Telemarketer Pattern (1800*)',
    payload: {
      CallSid: crypto.randomUUID(),
      CallFrom: '+911800112233', // Matches rule for 1800 numbers
      CallTo: '080-HIDEVA-1',
      Direction: 'incoming',
    },
    description: 'Caller number matches custom rule pattern → decision depends on rule action',
  },

  'stress-test': {
    name: 'Stress Test (100 calls)',
    payload: {
      CallSid: crypto.randomUUID(),
      CallFrom: '+919000000000',
      CallTo: '080-HIDEVA-1',
      Direction: 'incoming',
    },
    description: 'Generate 100 concurrent calls to measure performance',
  },
};

function generatePayload(scenario: string): string {
  const sc = scenarios[scenario];
  if (!sc) {
    console.error(`Unknown scenario: ${scenario}`);
    console.error(`Available: ${Object.keys(scenarios).join(', ')}`);
    process.exit(1);
  }

  console.error(`[MOCK] Scenario: ${sc.name}`);
  console.error(`[MOCK] ${sc.description}`);

  return JSON.stringify(sc.payload);
}

// CLI interface
const scenario = process.argv[2] || 'unknown-caller';
console.log(generatePayload(scenario));

export { generatePayload, scenarios };
