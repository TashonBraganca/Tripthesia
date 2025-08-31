/**
 * Load Testing Script for Tripthesia
 * Tests API endpoints under various load conditions
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');

class LoadTester {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
    this.concurrentRequests = 0;
    this.maxConcurrent = 0;
  }

  async request(endpoint, method = 'GET', data = null, headers = {}) {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint, this.baseUrl);
      const options = {
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Tripthesia-LoadTester/1.0',
          ...headers
        },
        timeout: 30000
      };

      if (data && (method === 'POST' || method === 'PUT')) {
        const postData = JSON.stringify(data);
        options.headers['Content-Length'] = Buffer.byteLength(postData);
      }

      const protocol = url.protocol === 'https:' ? https : http;
      const startTime = Date.now();
      
      this.concurrentRequests++;
      this.maxConcurrent = Math.max(this.maxConcurrent, this.concurrentRequests);

      const req = protocol.request(options, (res) => {
        let responseData = '';
        
        res.on('data', chunk => {
          responseData += chunk;
        });
        
        res.on('end', () => {
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          this.concurrentRequests--;
          
          resolve({
            statusCode: res.statusCode,
            duration,
            size: responseData.length,
            headers: res.headers,
            data: responseData
          });
        });
      });

      req.on('error', (error) => {
        this.concurrentRequests--;
        reject({
          error: error.message,
          duration: Date.now() - startTime
        });
      });

      req.on('timeout', () => {
        req.destroy();
        this.concurrentRequests--;
        reject({
          error: 'Request timeout',
          duration: 30000
        });
      });

      if (data && (method === 'POST' || method === 'PUT')) {
        req.write(JSON.stringify(data));
      }
      
      req.end();
    });
  }

  async runSingleTest(testConfig) {
    const { name, endpoint, method = 'GET', data, headers, expectedStatus = 200 } = testConfig;
    
    try {
      const result = await this.request(endpoint, method, data, headers);
      
      const testResult = {
        name,
        endpoint,
        method,
        success: result.statusCode === expectedStatus,
        statusCode: result.statusCode,
        duration: result.duration,
        size: result.size,
        timestamp: new Date().toISOString(),
        error: null
      };

      return testResult;
    } catch (error) {
      return {
        name,
        endpoint,
        method,
        success: false,
        statusCode: null,
        duration: error.duration || 0,
        size: 0,
        timestamp: new Date().toISOString(),
        error: error.error || error.message
      };
    }
  }

  async runLoadTest(testConfig, options = {}) {
    const {
      concurrent = 10,
      duration = 60000, // 1 minute
      rampUp = 5000,     // 5 seconds
      rampDown = 5000    // 5 seconds
    } = options;

    console.log(`\n🚀 Starting load test: ${testConfig.name}`);
    console.log(`📊 Config: ${concurrent} concurrent users, ${duration/1000}s duration`);

    const results = [];
    const startTime = Date.now();
    let activeRequests = 0;
    let totalRequests = 0;
    let completedRequests = 0;

    // Ramp up phase
    const rampUpInterval = rampUp / concurrent;
    
    return new Promise((resolve) => {
      const workers = [];
      
      // Start workers with ramp-up
      for (let i = 0; i < concurrent; i++) {
        setTimeout(() => {
          const worker = this.createWorker(testConfig, results, () => {
            completedRequests++;
          });
          workers.push(worker);
          activeRequests++;
        }, i * rampUpInterval);
      }

      // Monitor progress
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min((elapsed / duration) * 100, 100);
        
        process.stdout.write(`\r⏳ Progress: ${progress.toFixed(1)}% | Active: ${this.concurrentRequests} | Completed: ${completedRequests} | Total: ${totalRequests}`);
        
        if (elapsed >= duration) {
          // Stop all workers
          workers.forEach(worker => worker.stop());
          clearInterval(progressInterval);
          
          // Wait for ramp-down
          setTimeout(() => {
            const stats = this.calculateStats(results);
            console.log('\n✅ Load test completed');
            resolve(stats);
          }, rampDown);
        }
      }, 1000);
    });
  }

  createWorker(testConfig, results, onComplete) {
    let running = true;
    
    const work = async () => {
      while (running) {
        try {
          const result = await this.runSingleTest(testConfig);
          results.push(result);
          onComplete();
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
        } catch (error) {
          results.push({
            ...testConfig,
            success: false,
            error: error.message,
            duration: 0,
            timestamp: new Date().toISOString()
          });
          onComplete();
        }
      }
    };

    work();

    return {
      stop: () => {
        running = false;
      }
    };
  }

  calculateStats(results) {
    if (results.length === 0) return null;

    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    const durations = successes.map(r => r.duration);
    
    durations.sort((a, b) => a - b);

    const percentile = (p) => {
      const index = Math.ceil((p / 100) * durations.length) - 1;
      return durations[index] || 0;
    };

    const stats = {
      totalRequests: results.length,
      successfulRequests: successes.length,
      failedRequests: failures.length,
      successRate: (successes.length / results.length) * 100,
      avgResponseTime: durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0,
      minResponseTime: durations.length > 0 ? Math.min(...durations) : 0,
      maxResponseTime: durations.length > 0 ? Math.max(...durations) : 0,
      p50: percentile(50),
      p90: percentile(90),
      p95: percentile(95),
      p99: percentile(99),
      requestsPerSecond: results.length / (Math.max(...results.map(r => new Date(r.timestamp).getTime())) - Math.min(...results.map(r => new Date(r.timestamp).getTime()))) * 1000,
      maxConcurrent: this.maxConcurrent,
      errors: failures.reduce((acc, f) => {
        acc[f.error || 'Unknown'] = (acc[f.error || 'Unknown'] || 0) + 1;
        return acc;
      }, {})
    };

    return stats;
  }

  generateReport(testName, stats, outputPath) {
    const report = {
      testName,
      timestamp: new Date().toISOString(),
      stats,
      summary: this.generateSummary(stats),
      recommendations: this.generateRecommendations(stats)
    };

    if (outputPath) {
      fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
      console.log(`\n📄 Report saved to: ${outputPath}`);
    }

    return report;
  }

  generateSummary(stats) {
    const performance = stats.p95 < 1000 ? '🟢 Excellent' : 
                      stats.p95 < 2000 ? '🟡 Good' : 
                      stats.p95 < 5000 ? '🟠 Fair' : '🔴 Poor';

    const reliability = stats.successRate > 99.5 ? '🟢 Excellent' :
                       stats.successRate > 99 ? '🟡 Good' :
                       stats.successRate > 95 ? '🟠 Fair' : '🔴 Poor';

    return {
      performance: {
        rating: performance,
        p95ResponseTime: `${stats.p95}ms`
      },
      reliability: {
        rating: reliability,
        successRate: `${stats.successRate.toFixed(2)}%`
      },
      throughput: `${stats.requestsPerSecond.toFixed(2)} req/s`
    };
  }

  generateRecommendations(stats) {
    const recommendations = [];

    if (stats.successRate < 99) {
      recommendations.push({
        level: 'HIGH',
        issue: 'Low success rate',
        suggestion: 'Investigate error patterns and improve error handling'
      });
    }

    if (stats.p95 > 2000) {
      recommendations.push({
        level: 'MEDIUM',
        issue: 'Slow 95th percentile response time',
        suggestion: 'Consider database query optimization, caching, or CDN implementation'
      });
    }

    if (stats.maxResponseTime > 10000) {
      recommendations.push({
        level: 'HIGH',
        issue: 'Very slow maximum response time',
        suggestion: 'Add request timeouts and investigate slow queries'
      });
    }

    if (Object.keys(stats.errors).length > 0) {
      recommendations.push({
        level: 'MEDIUM',
        issue: 'Multiple error types detected',
        suggestion: 'Review error patterns and implement better error handling'
      });
    }

    return recommendations;
  }

  displayResults(stats) {
    console.log('\n📊 Load Test Results:');
    console.log('====================');
    console.log(`Total Requests: ${stats.totalRequests}`);
    console.log(`Successful: ${stats.successfulRequests} (${stats.successRate.toFixed(2)}%)`);
    console.log(`Failed: ${stats.failedRequests}`);
    console.log(`\nResponse Times:`);
    console.log(`  Average: ${stats.avgResponseTime.toFixed(2)}ms`);
    console.log(`  Min: ${stats.minResponseTime}ms`);
    console.log(`  Max: ${stats.maxResponseTime}ms`);
    console.log(`  P50: ${stats.p50}ms`);
    console.log(`  P90: ${stats.p90}ms`);
    console.log(`  P95: ${stats.p95}ms`);
    console.log(`  P99: ${stats.p99}ms`);
    console.log(`\nThroughput: ${stats.requestsPerSecond.toFixed(2)} requests/second`);
    console.log(`Max Concurrent: ${stats.maxConcurrent}`);
    
    if (Object.keys(stats.errors).length > 0) {
      console.log('\n❌ Errors:');
      Object.entries(stats.errors).forEach(([error, count]) => {
        console.log(`  ${error}: ${count}`);
      });
    }
  }
}

// Test configurations
const testConfigs = [
  {
    name: 'Health Check',
    endpoint: '/api/health',
    method: 'GET'
  },
  {
    name: 'Home Page',
    endpoint: '/',
    method: 'GET'
  },
  {
    name: 'Trip Creation Page',
    endpoint: '/new',
    method: 'GET'
  },
  {
    name: 'Flight Search API',
    endpoint: '/api/flights/search',
    method: 'POST',
    data: {
      from: 'NYC',
      to: 'LAX',
      departDate: '2024-09-01',
      returnDate: '2024-09-08',
      passengers: 1
    }
  },
  {
    name: 'AI Trip Generation',
    endpoint: '/api/ai/generate-trip',
    method: 'POST',
    data: {
      destination: 'Paris',
      duration: 5,
      budget: 2000,
      tripType: 'culture'
    }
  }
];

// Main execution
async function runAllTests() {
  const loadTester = new LoadTester();
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const reportDir = path.join(__dirname, 'reports');
  
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }

  console.log('🧪 Starting Tripthesia Load Tests');
  console.log('=================================');

  const allResults = [];

  for (const testConfig of testConfigs) {
    try {
      const stats = await loadTester.runLoadTest(testConfig, {
        concurrent: 5,
        duration: 30000, // 30 seconds for each test
        rampUp: 2000,
        rampDown: 2000
      });

      if (stats) {
        loadTester.displayResults(stats);
        const reportPath = path.join(reportDir, `${testConfig.name.replace(/\s+/g, '_')}_${timestamp}.json`);
        const report = loadTester.generateReport(testConfig.name, stats, reportPath);
        allResults.push(report);
      }

      // Brief pause between tests
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (error) {
      console.error(`❌ Test failed: ${testConfig.name}`, error);
    }
  }

  // Generate summary report
  const summaryPath = path.join(reportDir, `load_test_summary_${timestamp}.json`);
  fs.writeFileSync(summaryPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    tests: allResults,
    overall: {
      totalTests: allResults.length,
      avgSuccessRate: allResults.reduce((sum, r) => sum + r.stats.successRate, 0) / allResults.length,
      avgP95: allResults.reduce((sum, r) => sum + r.stats.p95, 0) / allResults.length
    }
  }, null, 2));

  console.log(`\n📋 Summary report saved to: ${summaryPath}`);
  console.log('\n🎉 All load tests completed!');
}

if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = LoadTester;