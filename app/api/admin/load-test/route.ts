/**
 * Load Testing Administration API Endpoint
 * Manages load testing operations
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { loadTester, runStandardLoadTests } from '@/lib/testing/load-testing';

// Only allow admin users to run load tests
async function checkAdminAccess(request: NextRequest) {
  const { userId } = auth();
  
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const isAdmin = process.env.ADMIN_USER_ID === userId || 
                 process.env.NODE_ENV === 'development';
  
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return null;
}

async function GET(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    switch (action) {
      case 'status':
        return NextResponse.json({
          success: true,
          data: {
            runningTests: loadTester.getRunningTests(),
            recentResults: loadTester.getTestResults().slice(-5),
          }
        });
      
      case 'results':
        const results = loadTester.getTestResults();
        return NextResponse.json({
          success: true,
          data: {
            results,
            report: loadTester.generateReport(results),
          }
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action. Use ?action=status or ?action=results' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Load test status error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch load test status' },
      { status: 500 }
    );
  }
}

async function POST(request: NextRequest) {
  const accessError = await checkAdminAccess(request);
  if (accessError) return accessError;

  try {
    const { action, config } = await request.json();

    switch (action) {
      case 'run_standard_tests':
        // Run standard load tests asynchronously
        runStandardLoadTests()
          .then((results) => {
            console.log('Standard load tests completed:', results.length, 'tests');
          })
          .catch((error) => {
            console.error('Standard load tests failed:', error);
          });
        
        return NextResponse.json({
          success: true,
          message: 'Standard load tests started. Check status for progress.'
        });
      
      case 'run_test':
        if (!config.name) {
          return NextResponse.json(
            { error: 'Test configuration name required' },
            { status: 400 }
          );
        }
        
        // Run specific test asynchronously
        loadTester.runLoadTest(config.name)
          .then((result) => {
            console.log(`Load test ${config.name} completed:`, result.requestsPerSecond, 'req/s');
          })
          .catch((error) => {
            console.error(`Load test ${config.name} failed:`, error);
          });
        
        return NextResponse.json({
          success: true,
          message: `Load test '${config.name}' started. Check status for progress.`
        });
      
      case 'run_custom_test':
        if (!config) {
          return NextResponse.json(
            { error: 'Test configuration required' },
            { status: 400 }
          );
        }
        
        // Validate config
        if (!config.name || !config.duration || !config.concurrency || !config.endpoints) {
          return NextResponse.json(
            { error: 'Invalid test configuration. Required: name, duration, concurrency, endpoints' },
            { status: 400 }
          );
        }
        
        // Run custom test asynchronously
        loadTester.runCustomLoadTest(config)
          .then((result) => {
            console.log(`Custom load test completed:`, result.requestsPerSecond, 'req/s');
          })
          .catch((error) => {
            console.error('Custom load test failed:', error);
          });
        
        return NextResponse.json({
          success: true,
          message: 'Custom load test started. Check status for progress.'
        });
      
      case 'stop_test':
        if (!config.name) {
          return NextResponse.json(
            { error: 'Test name required' },
            { status: 400 }
          );
        }
        
        loadTester.stopLoadTest(config.name);
        
        return NextResponse.json({
          success: true,
          message: `Test '${config.name}' stopped.`
        });
      
      case 'stop_all_tests':
        loadTester.stopAllTests();
        
        return NextResponse.json({
          success: true,
          message: 'All tests stopped.'
        });
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Load test action error:', error);
    return NextResponse.json(
      { error: 'Failed to perform load test action' },
      { status: 500 }
    );
  }
}

export { GET, POST };