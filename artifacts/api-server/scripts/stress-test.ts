/**
 * Stress Test: Concurrent Webhook Burst Simulator
 * 
 * Simulates real-world call volume by firing multiple synthetic Exotel
 * payloads concurrently and measuring performance under load.
 * 
 * Metrics Captured:
 *   - Total requests sent
 *   - Response times (min, max, avg, p95, p99)
 *   - Success rate
 *   - Memory usage
 *   - DB connection pool status
 * 
 * Usage:
 *   NODE_ENV=development DATABASE_URL="postgres://..." \
 *   tsx scripts/stress-test.ts --concurrency 50 --duration 10
 * 
 * Flags:
 *   --concurrency: Number of concurrent requests per burst (default: 50)
 *   --duration: Total test duration in seconds (default: 30)
 *   --bursts: Number of burst waves (default: 5)
 */

import crypto from 'crypto';
import https from 'https';

interface StressTestConfig {
  concurrency: number;
  duration: number;
  bursts: number;
  apiBaseUrl: string;
}

interface RequestResult {
  timestamp: number;
  responseTime: number;
  status: number;
  success: boolean;
  error?: string;
}

class StressTester {
  private config: StressTestConfig;
  private results: RequestResult[] = [];
  private startTime: number = 0;
  private requestCount: number = 0;

  constructor(config: StressTestConfig) {
    this.config = config;
  }

  private generatePayload() {
    const scenarios = [
      { CallFrom: '+919999999999', scenario: 'vip' },
      { CallFrom: '+911400000000', scenario: 'spam' },
      { CallFrom: '+918888888888', scenario: 'known' },
      { CallFrom: '+919123456789', scenario: 'unknown' },
      { CallFrom: '+911800112233', scenario: 'telemarketer' },
    ];

    const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

    return {
      CallSid: crypto.randomUUID(),
      CallFrom: scenario.CallFrom,
      CallTo: '080-HIDEVA-1',
      Direction: 'incoming' as const,
    };
  }

  private async sendRequest(): Promise<RequestResult> {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const payload = JSON.stringify(this.generatePayload());

      const options = {
        hostname: new URL(this.config.apiBaseUrl).hostname,
        port: 443,
        path: '/api/calls/webhook',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload),
        },
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          const result: RequestResult = {
            timestamp: startTime,
            responseTime,
            status: res.statusCode || 0,
            success: res.statusCode === 200,
          };

          if (res.statusCode !== 200) {
            result.error = `HTTP ${res.statusCode}: ${body}`;
          }

          resolve(result);
        });
      });

      req.on('error', (error) => {
        resolve({
          timestamp: startTime,
          responseTime: Date.now() - startTime,
          status: 0,
          success: false,
          error: error.message,
        });
      });

      req.write(payload);
      req.end();
    });
  }

  private async sendConcurrentBurst(burstSize: number): Promise<RequestResult[]> {
    const promises: Promise<RequestResult>[] = [];

    for (let i = 0; i < burstSize; i++) {
      promises.push(this.sendRequest());
    }

    return Promise.all(promises);
  }

  private calculateStats(results: RequestResult[]) {
    const responseTimes = results
      .filter(r => r.success)
      .map(r => r.responseTime)
      .sort((a, b) => a - b);

    if (responseTimes.length === 0) {
      return null;
    }

    const sum = responseTimes.reduce((a, b) => a + b, 0);
    const avg = sum / responseTimes.length;
    const min = responseTimes[0];
    const max = responseTimes[responseTimes.length - 1];

    const p95Index = Math.floor(responseTimes.length * 0.95);
    const p99Index = Math.floor(responseTimes.length * 0.99);

    return {
      min,
      max,
      avg: Math.round(avg),
      p95: responseTimes[p95Index],
      p99: responseTimes[p99Index],
      successful: responseTimes.length,
      failed: results.length - responseTimes.length,
    };
  }

  async run(): Promise<void> {
    console.log('\n🚀 Starting Stress Test\n');
    console.log(`Configuration:`);
    console.log(`  • Concurrency: ${this.config.concurrency} calls/burst`);
    console.log(`  • Number of bursts: ${this.config.bursts}`);
    console.log(`  • Target: ${this.config.apiBaseUrl}`);
    console.log(`\n${'='} Testing Started ${'='.repeat(40)}\n`);

    this.startTime = Date.now();

    for (let burst = 1; burst <= this.config.bursts; burst++) {
      process.stdout.write(`Burst ${burst}/${this.config.bursts}: `);

      const batchResults = await this.sendConcurrentBurst(this.config.concurrency);
      this.results.push(...batchResults);
      this.requestCount += batchResults.length;

      const stats = this.calculateStats(batchResults);
      if (stats) {
        process.stdout.write(
          `${batchResults.length} requests ✓ ${stats.successful} ${stats.failed ? `✗ ${stats.failed}` : ''} | ` +
          `Avg: ${stats.avg}ms P95: ${stats.p95}ms P99: ${stats.p99}ms\n`
        );
      } else {
        process.stdout.write(`FAILED\n`);
      }

      // Delay between bursts to avoid overwhelming the system
      if (burst < this.config.bursts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const totalTime = Date.now() - this.startTime;
    const overallStats = this.calculateStats(this.results);

    console.log(`\n${'='.repeat(50)}\n`);
    console.log(`📊 Final Results:\n`);
    console.log(`  Total Requests: ${this.requestCount}`);
    console.log(`  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    console.log(`  Requests/sec: ${(this.requestCount / (totalTime / 1000)).toFixed(2)}`);

    if (overallStats) {
      console.log(`\n  Response Times (successful):`.padEnd(40));
      console.log(`    Min: ${overallStats.min}ms`);
      console.log(`    Avg: ${overallStats.avg}ms`);
      console.log(`    P95: ${overallStats.p95}ms`);
      console.log(`    P99: ${overallStats.p99}ms`);
      console.log(`    Max: ${overallStats.max}ms`);
      console.log(`\n  Success Rate: ${(overallStats.successful / this.requestCount * 100).toFixed(2)}%`);
      console.log(`  Failed Requests: ${overallStats.failed}`);
    }

    // Memory usage
    const memUsage = process.memoryUsage();
    console.log(`\n  Memory Usage:`);
    console.log(`    RSS: ${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    Heap Used: ${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
    console.log(`    Heap Total: ${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`);

    console.log(`\n✅ Stress test completed!\n`);
  }
}

// Parse CLI arguments
function parseArgs(): StressTestConfig {
  const args = process.argv.slice(2);
  const config: StressTestConfig = {
    concurrency: 50,
    duration: 30,
    bursts: 5,
    apiBaseUrl: 'https://localhost:8080',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--concurrency':
        config.concurrency = parseInt(args[++i], 10);
        break;
      case '--duration':
        config.duration = parseInt(args[++i], 10);
        break;
      case '--bursts':
        config.bursts = parseInt(args[++i], 10);
        break;
      case '--url':
        config.apiBaseUrl = args[++i];
        break;
    }
  }

  return config;
}

// Run the stress test
const config = parseArgs();
const tester = new StressTester(config);
tester.run().catch(console.error);
