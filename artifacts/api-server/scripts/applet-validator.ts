/**
 * Applet Validator: Response Contract Verification
 * 
 * Verifies that our Express backend returns the exact JSON structure
 * and decision outcomes (connect, screen, reject) that Exotel expects.
 * 
 * Test Coverage:
 *   1. VIP Contacts → 'connect'
 *   2. Spam/Low Priority → 'reject'
 *   3. Unknown Callers → 'screen'
 *   4. Pattern Matching → Correct action based on rules
 *   5. Rule Priority Order → First match wins
 *   6. Invalid Payloads → Safe default (screen)
 *   7. Performance → Response within SLA
 * 
 * Usage:
 *   NODE_ENV=development tsx scripts/applet-validator.ts
 */

import crypto from 'crypto';
import https from 'https';

interface ValidatorConfig {
  apiBaseUrl: string;
  timeout: number;
}

interface ValidationTest {
  name: string;
  payload: Record<string, any>;
  expectedAction: 'connect' | 'screen' | 'reject';
  maxResponseTime?: number;
  skipReason?: string;
}

interface TestResult {
  test: ValidationTest;
  passed: boolean;
  actualAction?: string;
  responseTime: number;
  error?: string;
}

class AppletValidator {
  private config: ValidatorConfig;
  private results: TestResult[] = [];

  constructor(config: ValidatorConfig) {
    this.config = config;
  }

  private async sendWebhook(payload: Record<string, any>): Promise<{
    action: string;
    responseTime: number;
  }> {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      const jsonPayload = JSON.stringify(payload);

      const options = {
        hostname: new URL(this.config.apiBaseUrl).hostname,
        port: 443,
        path: '/api/calls/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(jsonPayload),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';

        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;

          try {
            const response = JSON.parse(body);
            resolve({
              action: response.select,
              responseTime,
            });
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${body}`));
          }
        });
      });

      req.on('error', reject);
      req.setTimeout(this.config.timeout);
      req.write(jsonPayload);
      req.end();
    });
  }

  private generateCallSid(): string {
    return `test-${crypto.randomUUID()}`;
  }

  async runTests(): Promise<void> {
    console.log('\n🔍 Running Applet Validator Tests\n');

    const tests: ValidationTest[] = [
      {
        name: 'VIP Contact (High Priority) → connect',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+919999999999', // VIP from seed
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'connect',
        maxResponseTime: 500,
      },
      {
        name: 'Known Spam Contact → reject',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+911400000000', // Spam from seed
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'reject',
        maxResponseTime: 500,
      },
      {
        name: 'Unknown Caller → screen',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+919111111111', // Not in contacts
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'screen',
        maxResponseTime: 500,
      },
      {
        name: 'Pattern Match (1800*) → reject',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+911800112233', // Matches 1800* rule
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'reject',
        maxResponseTime: 500,
      },
      {
        name: 'Pattern Match (140*) → reject',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+911405555555', // Matches 140* rule
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'reject',
        maxResponseTime: 500,
      },
      {
        name: 'Missing CallSid → safe default (screen)',
        payload: {
          CallFrom: '+919876543210',
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'screen',
        maxResponseTime: 500,
      },
      {
        name: 'Missing CallFrom → safe default (screen)',
        payload: {
          CallSid: this.generateCallSid(),
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'screen',
        maxResponseTime: 500,
      },
      {
        name: 'Medium Priority Contact → screen (no override)',
        payload: {
          CallSid: this.generateCallSid(),
          CallFrom: '+918888888888', // Medium priority from seed
          CallTo: '080-HIDEVA-1',
          Direction: 'incoming',
        },
        expectedAction: 'screen',
        maxResponseTime: 500,
      },
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      process.stdout.write(`Testing: ${test.name.padEnd(55)}`);

      try {
        const { action, responseTime } = await this.sendWebhook(test.payload);

        const actionMatch = action === test.expectedAction;
        const timeMatch = !test.maxResponseTime || responseTime <= test.maxResponseTime;

        const testPassed = actionMatch && timeMatch;

        if (testPassed) {
          console.log(`✓ PASS (${responseTime}ms)`);
          passed++;
        } else {
          console.log(`✗ FAIL`);
          if (!actionMatch) {
            console.log(`  → Expected action: ${test.expectedAction}, got: ${action}`);
          }
          if (!timeMatch) {
            console.log(`  → Response time: ${responseTime}ms (max: ${test.maxResponseTime}ms)`);
          }
          failed++;
        }

        this.results.push({
          test,
          passed: testPassed,
          actualAction: action,
          responseTime,
        });
      } catch (error) {
        console.log(`✗ ERROR: ${(error as Error).message}`);
        failed++;

        this.results.push({
          test,
          passed: false,
          responseTime: 0,
          error: (error as Error).message,
        });
      }

      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // ================================================================
    // SUMMARY
    // ================================================================
    console.log(`\n${'='.repeat(60)}\n`);
    console.log(`📊 Test Results:\n`);
    console.log(`  Passed: ${passed}/${tests.length}`);
    console.log(`  Failed: ${failed}/${tests.length}`);
    console.log(`  Success Rate: ${((passed / tests.length) * 100).toFixed(1)}%\n`);

    if (failed === 0) {
      console.log(`✅ All tests passed! Applet is responding correctly.\n`);
    } else {
      console.log(`❌ ${failed} test(s) failed. Review output above.\n`);
      process.exit(1);
    }
  }
}

// Parse CLI arguments
function parseArgs(): ValidatorConfig {
  const args = process.argv.slice(2);
  return {
    apiBaseUrl: process.env.API_BASE_URL || 'https://localhost:8080',
    timeout: 5000,
  };
}

// Run validator
const config = parseArgs();
const validator = new AppletValidator(config);
validator.runTests().catch(console.error);
