#!/usr/bin/env tsx

/**
 * Pre-deployment verification script
 * Run this before deploying to catch issues early
 */

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  message: string;
  critical: boolean;
}

const checks: CheckResult[] = [];

function addCheck(name: string, status: 'pass' | 'fail' | 'skip', message: string, critical = false) {
  checks.push({ name, status, message, critical });
  const emoji = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⏭️';
  const prefix = critical ? '[CRITICAL]' : '[INFO]';
  console.log(`${emoji} ${prefix} ${name}: ${message}`);
}

async function runCommand(command: string, args: string[] = []): Promise<{ success: boolean; output: string }> {
  return new Promise((resolve) => {
    const child = spawn(command, args, { 
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true 
    });
    
    let output = '';
    let error = '';
    
    child.stdout?.on('data', (data) => {
      output += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      error += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: output || error,
      });
    });
  });
}

async function checkTypeScript() {
  console.log('🔍 Running TypeScript check...');
  const result = await runCommand('pnpm', ['typecheck']);
  
  if (result.success) {
    addCheck('TypeScript', 'pass', 'No type errors found', true);
  } else {
    addCheck('TypeScript', 'fail', 'Type errors detected', true);
    console.log('TypeScript errors:', result.output);
  }
}

async function checkLinting() {
  console.log('🔍 Running ESLint check...');
  const result = await runCommand('pnpm', ['lint']);
  
  if (result.success) {
    addCheck('ESLint', 'pass', 'No linting errors found', true);
  } else {
    addCheck('ESLint', 'fail', 'Linting errors detected', true);
    console.log('ESLint errors:', result.output);
  }
}

async function checkBuild() {
  console.log('🔍 Running build check...');
  const result = await runCommand('pnpm', ['build']);
  
  if (result.success) {
    addCheck('Build', 'pass', 'Build completed successfully', true);
  } else {
    addCheck('Build', 'fail', 'Build failed', true);
    console.log('Build errors:', result.output);
  }
}

function checkRequiredFiles() {
  console.log('🔍 Checking required files...');
  
  const requiredFiles = [
    'package.json',
    'next.config.js',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'vercel.json',
    'apps/web/app/layout.tsx',
    'apps/web/lib/db.ts',
    'apps/web/lib/auth.ts',
    'infra/schema/index.ts',
  ];
  
  const missingFiles = requiredFiles.filter(file => !existsSync(file));
  
  if (missingFiles.length === 0) {
    addCheck('Required Files', 'pass', 'All required files present', true);
  } else {
    addCheck('Required Files', 'fail', `Missing files: ${missingFiles.join(', ')}`, true);
  }
}

function checkEnvironmentTemplate() {
  console.log('🔍 Checking environment template...');
  
  if (existsSync('.env.example')) {
    const envExample = readFileSync('.env.example', 'utf-8');
    const requiredVars = [
      'DATABASE_URL',
      'CLERK_PUBLISHABLE_KEY',
      'CLERK_SECRET_KEY',
      'ANTHROPIC_API_KEY',
      'NEXT_PUBLIC_MAPBOX_TOKEN',
      'FOURSQUARE_API_KEY',
    ];
    
    const missingVars = requiredVars.filter(envVar => !envExample.includes(envVar));
    
    if (missingVars.length === 0) {
      addCheck('Environment Template', 'pass', 'All required variables documented in .env.example');
    } else {
      addCheck('Environment Template', 'fail', `Missing variables in .env.example: ${missingVars.join(', ')}`);
    }
  } else {
    addCheck('Environment Template', 'fail', '.env.example file missing');
  }
}

function checkPackageJson() {
  console.log('🔍 Checking package.json...');
  
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    
    const requiredScripts = ['build', 'dev', 'lint', 'typecheck'];
    const missingScripts = requiredScripts.filter(script => !packageJson.scripts?.[script]);
    
    if (missingScripts.length === 0) {
      addCheck('Package Scripts', 'pass', 'All required scripts present');
    } else {
      addCheck('Package Scripts', 'fail', `Missing scripts: ${missingScripts.join(', ')}`);
    }
    
    // Check for critical dependencies
    const requiredDeps = ['next', 'react', '@clerk/nextjs', 'drizzle-orm'];
    const missingDeps = requiredDeps.filter(dep => 
      !packageJson.dependencies?.[dep] && !packageJson.devDependencies?.[dep]
    );
    
    if (missingDeps.length === 0) {
      addCheck('Dependencies', 'pass', 'All critical dependencies present');
    } else {
      addCheck('Dependencies', 'fail', `Missing dependencies: ${missingDeps.join(', ')}`, true);
    }
    
  } catch (error) {
    addCheck('Package JSON', 'fail', 'Invalid package.json format', true);
  }
}

function checkVercelConfig() {
  console.log('🔍 Checking Vercel configuration...');
  
  if (existsSync('vercel.json')) {
    try {
      const vercelConfig = JSON.parse(readFileSync('vercel.json', 'utf-8'));
      
      if (vercelConfig.buildCommand && vercelConfig.framework) {
        addCheck('Vercel Config', 'pass', 'Vercel configuration looks good');
      } else {
        addCheck('Vercel Config', 'fail', 'Vercel configuration incomplete');
      }
      
      if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        addCheck('CRON Jobs', 'pass', `${vercelConfig.crons.length} CRON jobs configured`);
      } else {
        addCheck('CRON Jobs', 'skip', 'No CRON jobs configured');
      }
      
    } catch (error) {
      addCheck('Vercel Config', 'fail', 'Invalid vercel.json format');
    }
  } else {
    addCheck('Vercel Config', 'skip', 'No vercel.json found');
  }
}

function checkDocumentation() {
  console.log('🔍 Checking documentation...');
  
  const docFiles = ['README.md', 'CLAUDE.md'];
  const existingDocs = docFiles.filter(file => existsSync(file));
  
  if (existingDocs.length === docFiles.length) {
    addCheck('Documentation', 'pass', 'All documentation files present');
  } else {
    const missing = docFiles.filter(file => !existsSync(file));
    addCheck('Documentation', 'fail', `Missing documentation: ${missing.join(', ')}`);
  }
}

async function main() {
  console.log('🚀 Running pre-deployment checks...\n');
  
  const startTime = Date.now();
  
  // File and configuration checks (fast)
  checkRequiredFiles();
  checkPackageJson();
  checkVercelConfig();
  checkEnvironmentTemplate();
  checkDocumentation();
  
  // Build and code quality checks (slow)
  await checkTypeScript();
  await checkLinting();
  
  // Only run build check if other checks pass
  const criticalFailures = checks.filter(check => check.critical && check.status === 'fail');
  if (criticalFailures.length === 0) {
    await checkBuild();
  } else {
    addCheck('Build', 'skip', 'Skipped due to critical failures', true);
  }
  
  const duration = Date.now() - startTime;
  
  // Summary
  console.log('\n📊 Deployment Readiness Report');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  
  const passed = checks.filter(c => c.status === 'pass').length;
  const failed = checks.filter(c => c.status === 'fail').length;
  const skipped = checks.filter(c => c.status === 'skip').length;
  const criticalFailed = checks.filter(c => c.critical && c.status === 'fail').length;
  
  console.log(`Total Checks: ${checks.length}`);
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏭️  Skipped: ${skipped}`);
  console.log(`🚨 Critical Failures: ${criticalFailed}`);
  console.log(`⏱️  Duration: ${duration}ms`);
  
  if (criticalFailed > 0) {
    console.log('\n🚨 DEPLOYMENT NOT RECOMMENDED');
    console.log('Critical issues must be resolved before deployment.');
    process.exit(1);
  } else if (failed > 0) {
    console.log('\n⚠️  DEPLOYMENT WITH WARNINGS');
    console.log('Consider resolving the failed checks before deployment.');
    process.exit(0);
  } else {
    console.log('\n🎉 READY FOR DEPLOYMENT');
    console.log('All critical checks passed!');
    process.exit(0);
  }
}

// Run the checks
main().catch((error) => {
  console.error('💥 Check script failed:', error);
  process.exit(1);
});