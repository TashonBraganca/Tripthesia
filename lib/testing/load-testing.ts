/**
 * Load Testing System for Production Performance Validation
 * Simulates real user traffic patterns and stress tests
 */

interface LoadTestConfig {
  name: string;
  duration: number; // milliseconds
  concurrency: number; // concurrent users
  rampUpTime: number; // time to reach full concurrency
  endpoints: TestEndpoint[];
  userScenarios: UserScenario[];
}

interface TestEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  weight: number; // probability weight (0-1)
  headers?: Record<string, string>;
  body?: any;
  expectedStatus: number[];
  maxResponseTime: number; // milliseconds
}

interface UserScenario {
  name: string;
  weight: number;
  steps: ScenarioStep[];
}

interface ScenarioStep {
  endpoint: string;
  method: string;
  delay?: number; // think time between requests
  data?: any;
  validation?: (response: Response) => boolean;
}

interface LoadTestResult {
  testName: string;
  startTime: string;
  endTime: string;
  duration: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestsPerSecond: number;
  errors: TestError[];
  endpointStats: Record<string, EndpointStats>;
  resourceUsage: ResourceUsage[];
}

interface TestError {
  endpoint: string;
  error: string;
  timestamp: string;
  responseTime: number;
  statusCode?: number;
}

interface EndpointStats {
  path: string;
  totalRequests: number;
  successCount: number;
  errorCount: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  throughput: number;
}

interface ResourceUsage {
  timestamp: string;
  memoryUsage: number;
  cpuUsage: number;
  activeConnections: number;
}

class LoadTester {
  private activeTests: Map<string, AbortController> = new Map();
  private results: LoadTestResult[] = [];

  // Predefined test configurations
  private getStandardTests(): LoadTestConfig[] {
    return [
      {
        name: 'basic_user_journey',
        duration: 60000, // 1 minute
        concurrency: 10,
        rampUpTime: 10000, // 10 seconds
        endpoints: [
          {
            path: '/',
            method: 'GET',
            weight: 0.3,
            expectedStatus: [200],
            maxResponseTime: 2000,
          },
          {
            path: '/trips',
            method: 'GET',
            weight: 0.25,
            expectedStatus: [200, 302], // 302 if not authenticated
            maxResponseTime: 3000,
          },
          {
            path: '/new',
            method: 'GET',
            weight: 0.2,
            expectedStatus: [200, 302],
            maxResponseTime: 3000,
          },
          {
            path: '/api/health',
            method: 'GET',
            weight: 0.15,
            expectedStatus: [200],
            maxResponseTime: 1000,
          },
          {
            path: '/pricing',
            method: 'GET',
            weight: 0.1,
            expectedStatus: [200],
            maxResponseTime: 2000,
          },
        ],
        userScenarios: [
          {
            name: 'browse_and_create_trip',
            weight: 0.7,
            steps: [
              { endpoint: '/', method: 'GET', delay: 2000 },
              { endpoint: '/trips', method: 'GET', delay: 3000 },
              { endpoint: '/new', method: 'GET', delay: 5000 },
              { endpoint: '/pricing', method: 'GET', delay: 2000 },
            ],
          },
          {
            name: 'quick_health_check',
            weight: 0.3,
            steps: [
              { endpoint: '/api/health', method: 'GET', delay: 1000 },
            ],
          },
        ],
      },
      {
        name: 'api_stress_test',
        duration: 120000, // 2 minutes
        concurrency: 25,
        rampUpTime: 15000, // 15 seconds
        endpoints: [
          {
            path: '/api/transport/search',
            method: 'POST',
            weight: 0.4,
            expectedStatus: [200, 400],
            maxResponseTime: 5000,
            headers: { 'Content-Type': 'application/json' },
            body: {
              from: 'Mumbai',
              to: 'Delhi',
              date: '2025-01-15',
              type: 'flight',
            },
          },
          {
            path: '/api/flights/search',
            method: 'POST',
            weight: 0.3,
            expectedStatus: [200, 400],
            maxResponseTime: 8000,
            headers: { 'Content-Type': 'application/json' },
            body: {
              from: 'BOM',
              to: 'DEL',
              departureDate: '2025-01-15',
              returnDate: '2025-01-20',
              passengers: 1,
            },
          },
          {
            path: '/api/ai/suggestions',
            method: 'POST',
            weight: 0.2,
            expectedStatus: [200, 401, 429], // May require auth or hit rate limits
            maxResponseTime: 10000,
            headers: { 'Content-Type': 'application/json' },
            body: {
              destination: 'Paris',
              interests: ['culture', 'food'],
              budget: 1000,
            },
          },
          {
            path: '/api/health',
            method: 'GET',
            weight: 0.1,
            expectedStatus: [200],
            maxResponseTime: 1000,
          },
        ],
        userScenarios: [
          {
            name: 'search_transport',
            weight: 0.6,
            steps: [
              { endpoint: '/api/transport/search', method: 'POST', delay: 3000 },
              { endpoint: '/api/flights/search', method: 'POST', delay: 5000 },
            ],
          },
          {
            name: 'get_ai_suggestions',
            weight: 0.4,
            steps: [
              { endpoint: '/api/ai/suggestions', method: 'POST', delay: 2000 },
            ],
          },
        ],
      },
      {
        name: 'peak_traffic_simulation',
        duration: 300000, // 5 minutes
        concurrency: 50,
        rampUpTime: 30000, // 30 seconds
        endpoints: [
          {
            path: '/',
            method: 'GET',
            weight: 0.4,
            expectedStatus: [200],
            maxResponseTime: 3000,
          },
          {
            path: '/trips',
            method: 'GET',
            weight: 0.2,
            expectedStatus: [200, 302],
            maxResponseTime: 4000,
          },
          {
            path: '/new',
            method: 'GET',
            weight: 0.15,
            expectedStatus: [200, 302],
            maxResponseTime: 4000,
          },
          {
            path: '/api/transport/search',
            method: 'POST',
            weight: 0.15,
            expectedStatus: [200, 400],
            maxResponseTime: 8000,
            headers: { 'Content-Type': 'application/json' },
            body: { from: 'NYC', to: 'LAX', date: '2025-02-01', type: 'flight' },
          },
          {
            path: '/api/health',
            method: 'GET',
            weight: 0.1,
            expectedStatus: [200],
            maxResponseTime: 2000,
          },
        ],
        userScenarios: [
          {
            name: 'heavy_browsing',
            weight: 0.8,
            steps: [
              { endpoint: '/', method: 'GET', delay: 1000 },
              { endpoint: '/trips', method: 'GET', delay: 2000 },
              { endpoint: '/new', method: 'GET', delay: 3000 },
              { endpoint: '/', method: 'GET', delay: 2000 },
            ],
          },
          {
            name: 'api_heavy_usage',
            weight: 0.2,
            steps: [
              { endpoint: '/api/transport/search', method: 'POST', delay: 1000 },
              { endpoint: '/api/health', method: 'GET', delay: 500 },
              { endpoint: '/api/transport/search', method: 'POST', delay: 2000 },
            ],
          },
        ],
      },
    ];
  }

  async runLoadTest(configName: string): Promise<LoadTestResult> {
    const config = this.getStandardTests().find(t => t.name === configName);
    if (!config) {
      throw new Error(`Load test configuration '${configName}' not found`);
    }

    return this.executeLoadTest(config);
  }

  async runCustomLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    return this.executeLoadTest(config);
  }

  private async executeLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
    const testId = `${config.name}_${Date.now()}`;
    const abortController = new AbortController();
    this.activeTests.set(testId, abortController);

    const result: LoadTestResult = {
      testName: config.name,
      startTime: new Date().toISOString(),
      endTime: '',
      duration: 0,
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestsPerSecond: 0,
      errors: [],
      endpointStats: {},
      resourceUsage: [],
    };

    const startTime = Date.now();
    const endTime = startTime + config.duration;
    const responseTimes: number[] = [];
    
    // Initialize endpoint stats
    config.endpoints.forEach(endpoint => {
      result.endpointStats[endpoint.path] = {
        path: endpoint.path,
        totalRequests: 0,
        successCount: 0,
        errorCount: 0,
        averageResponseTime: 0,
        minResponseTime: Infinity,
        maxResponseTime: 0,
        throughput: 0,
      };
    });

    // Resource monitoring
    const resourceMonitor = setInterval(() => {
      if (typeof process !== 'undefined') {
        const memUsage = process.memoryUsage();
        result.resourceUsage.push({
          timestamp: new Date().toISOString(),
          memoryUsage: memUsage.heapUsed,
          cpuUsage: process.cpuUsage().user + process.cpuUsage().system,
          activeConnections: this.activeTests.size,
        });
      }
    }, 5000);

    try {
      // Create worker promises with ramp-up
      const workers = [];
      const rampUpInterval = config.rampUpTime / config.concurrency;

      for (let i = 0; i < config.concurrency; i++) {
        const delay = i * rampUpInterval;
        
        workers.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              this.runWorker(config, endTime, result, responseTimes, abortController.signal)
                .finally(resolve);
            }, delay);
          })
        );
      }

      // Wait for all workers to complete
      await Promise.all(workers);
      
    } finally {
      clearInterval(resourceMonitor);
      this.activeTests.delete(testId);
    }

    // Calculate final statistics
    const actualDuration = Date.now() - startTime;
    result.endTime = new Date().toISOString();
    result.duration = actualDuration;
    
    if (responseTimes.length > 0) {
      const sortedTimes = responseTimes.sort((a, b) => a - b);
      result.averageResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      result.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
      result.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
      result.requestsPerSecond = result.totalRequests / (actualDuration / 1000);
    }

    // Calculate endpoint throughput
    Object.values(result.endpointStats).forEach(stats => {
      if (stats.totalRequests > 0) {
        stats.throughput = stats.totalRequests / (actualDuration / 1000);
        stats.averageResponseTime = stats.averageResponseTime / stats.totalRequests;
      }
    });

    this.results.push(result);
    return result;
  }

  private async runWorker(
    config: LoadTestConfig,
    endTime: number,
    result: LoadTestResult,
    responseTimes: number[],
    signal: AbortSignal
  ): Promise<void> {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    
    while (Date.now() < endTime && !signal.aborted) {
      // Select random scenario
      const scenario = this.selectRandomScenario(config.userScenarios);
      
      if (scenario) {
        // Execute scenario steps
        for (const step of scenario.steps) {
          if (Date.now() >= endTime || signal.aborted) break;
          
          const endpoint = config.endpoints.find(e => e.path === step.endpoint && e.method === step.method);
          if (!endpoint) continue;

          await this.executeRequest(baseURL, endpoint, result, responseTimes);
          
          // Think time between requests
          if (step.delay && Date.now() < endTime) {
            await new Promise(resolve => setTimeout(resolve, step.delay));
          }
        }
      } else {
        // Fallback to random endpoint selection
        const endpoint = this.selectRandomEndpoint(config.endpoints);
        if (endpoint) {
          await this.executeRequest(baseURL, endpoint, result, responseTimes);
          
          // Random think time
          const thinkTime = Math.random() * 3000 + 1000; // 1-4 seconds
          await new Promise(resolve => setTimeout(resolve, thinkTime));
        }
      }
    }
  }

  private selectRandomScenario(scenarios: UserScenario[]): UserScenario | null {
    const totalWeight = scenarios.reduce((sum, scenario) => sum + scenario.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const scenario of scenarios) {
      random -= scenario.weight;
      if (random <= 0) {
        return scenario;
      }
    }
    
    return scenarios[0] || null;
  }

  private selectRandomEndpoint(endpoints: TestEndpoint[]): TestEndpoint | null {
    const totalWeight = endpoints.reduce((sum, endpoint) => sum + endpoint.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const endpoint of endpoints) {
      random -= endpoint.weight;
      if (random <= 0) {
        return endpoint;
      }
    }
    
    return endpoints[0] || null;
  }

  private async executeRequest(
    baseURL: string,
    endpoint: TestEndpoint,
    result: LoadTestResult,
    responseTimes: number[]
  ): Promise<void> {
    const startTime = Date.now();
    const stats = result.endpointStats[endpoint.path];
    
    try {
      const requestInit: RequestInit = {
        method: endpoint.method,
        headers: {
          'User-Agent': 'Tripthesia-LoadTest/1.0',
          ...endpoint.headers,
        },
        signal: AbortSignal.timeout(endpoint.maxResponseTime + 5000),
      };

      if (endpoint.body && (endpoint.method === 'POST' || endpoint.method === 'PUT')) {
        requestInit.body = JSON.stringify(endpoint.body);
      }

      const response = await fetch(`${baseURL}${endpoint.path}`, requestInit);
      const responseTime = Date.now() - startTime;
      
      result.totalRequests++;
      stats.totalRequests++;
      responseTimes.push(responseTime);
      
      stats.minResponseTime = Math.min(stats.minResponseTime, responseTime);
      stats.maxResponseTime = Math.max(stats.maxResponseTime, responseTime);
      stats.averageResponseTime += responseTime;

      if (endpoint.expectedStatus.includes(response.status)) {
        result.successfulRequests++;
        stats.successCount++;
      } else {
        result.failedRequests++;
        stats.errorCount++;
        result.errors.push({
          endpoint: endpoint.path,
          error: `Unexpected status code: ${response.status}`,
          timestamp: new Date().toISOString(),
          responseTime,
          statusCode: response.status,
        });
      }

      if (responseTime > endpoint.maxResponseTime) {
        result.errors.push({
          endpoint: endpoint.path,
          error: `Response time exceeded: ${responseTime}ms > ${endpoint.maxResponseTime}ms`,
          timestamp: new Date().toISOString(),
          responseTime,
          statusCode: response.status,
        });
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      result.totalRequests++;
      result.failedRequests++;
      stats.totalRequests++;
      stats.errorCount++;
      
      result.errors.push({
        endpoint: endpoint.path,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        responseTime,
      });
    }
  }

  stopLoadTest(testName: string): void {
    Array.from(this.activeTests.entries()).forEach(([testId, controller]) => {
      if (testId.startsWith(testName)) {
        controller.abort();
        this.activeTests.delete(testId);
      }
    });
  }

  stopAllTests(): void {
    Array.from(this.activeTests.entries()).forEach(([testId, controller]) => {
      controller.abort();
    });
    this.activeTests.clear();
  }

  getTestResults(): LoadTestResult[] {
    return [...this.results];
  }

  getRunningTests(): string[] {
    return Array.from(this.activeTests.keys());
  }

  generateReport(results: LoadTestResult[]): string {
    if (results.length === 0) {
      return 'No load test results available.';
    }

    let report = '# Load Test Report\n\n';
    
    for (const result of results) {
      report += `## ${result.testName}\n`;
      report += `- **Duration**: ${(result.duration / 1000).toFixed(2)}s\n`;
      report += `- **Total Requests**: ${result.totalRequests}\n`;
      report += `- **Success Rate**: ${((result.successfulRequests / result.totalRequests) * 100).toFixed(2)}%\n`;
      report += `- **Requests/Second**: ${result.requestsPerSecond.toFixed(2)}\n`;
      report += `- **Average Response Time**: ${result.averageResponseTime.toFixed(2)}ms\n`;
      report += `- **P95 Response Time**: ${result.p95ResponseTime.toFixed(2)}ms\n`;
      report += `- **P99 Response Time**: ${result.p99ResponseTime.toFixed(2)}ms\n`;
      report += `- **Errors**: ${result.errors.length}\n\n`;

      if (result.errors.length > 0) {
        report += '### Top Errors\n';
        const errorSummary: Record<string, number> = {};
        result.errors.forEach(error => {
          const key = `${error.endpoint}: ${error.error}`;
          errorSummary[key] = (errorSummary[key] || 0) + 1;
        });
        
        Object.entries(errorSummary)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 5)
          .forEach(([error, count]) => {
            report += `- ${error} (${count} times)\n`;
          });
        report += '\n';
      }

      report += '### Endpoint Performance\n';
      Object.values(result.endpointStats).forEach(stats => {
        report += `- **${stats.path}**: ${stats.throughput.toFixed(2)} req/s, `;
        report += `${stats.averageResponseTime.toFixed(2)}ms avg, `;
        report += `${((stats.successCount / stats.totalRequests) * 100).toFixed(1)}% success\n`;
      });
      report += '\n';
    }

    return report;
  }
}

// Singleton instance
export const loadTester = new LoadTester();

// CLI interface for running tests
export async function runStandardLoadTests(): Promise<LoadTestResult[]> {
  const tests = ['basic_user_journey', 'api_stress_test', 'peak_traffic_simulation'];
  const results: LoadTestResult[] = [];
  
  console.log('Starting comprehensive load testing...');
  
  for (const testName of tests) {
    console.log(`Running ${testName}...`);
    try {
      const result = await loadTester.runLoadTest(testName);
      results.push(result);
      console.log(`✅ ${testName} completed: ${result.successfulRequests}/${result.totalRequests} requests successful`);
    } catch (error) {
      console.error(`❌ ${testName} failed:`, error);
    }
  }
  
  return results;
}