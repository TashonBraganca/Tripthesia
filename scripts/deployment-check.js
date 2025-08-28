#!/usr/bin/env node

/**
 * Deployment Safety Check Script
 * Validates the application for production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Running Deployment Safety Check...\n');

const checks = [];

// Check 1: Verify all required files exist
console.log('📁 Checking required files...');
const requiredFiles = [
  'next.config.js',
  'middleware.ts',
  'app/layout.tsx',
  'app/page.tsx',
  'lib/db.ts',
  'lib/redis.ts',
  'package.json',
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(process.cwd(), file));
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  checks.push({ name: `File: ${file}`, passed: exists });
});

// Check 2: Verify package.json scripts
console.log('\n📦 Checking package.json scripts...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredScripts = ['build', 'start', 'dev'];

requiredScripts.forEach(script => {
  const exists = packageJson.scripts && packageJson.scripts[script];
  console.log(`   ${exists ? '✅' : '❌'} ${script} script`);
  checks.push({ name: `Script: ${script}`, passed: !!exists });
});

// Check 3: Verify environment file structure
console.log('\n🔐 Checking environment configuration...');
const envFiles = ['.env.example', '.env.build'];

envFiles.forEach(file => {
  const exists = fs.existsSync(file);
  console.log(`   ${exists ? '✅' : '❌'} ${file}`);
  checks.push({ name: `Env file: ${file}`, passed: exists });
});

// Check 4: Verify API routes structure
console.log('\n🛠️ Checking API routes...');
const apiDir = 'app/api';
if (fs.existsSync(apiDir)) {
  const apiRoutes = fs.readdirSync(apiDir, { recursive: true })
    .filter(file => file.endsWith('route.ts'));
  
  console.log(`   ✅ Found ${apiRoutes.length} API routes:`);
  apiRoutes.forEach(route => {
    console.log(`      - ${route}`);
  });
  checks.push({ name: 'API routes exist', passed: apiRoutes.length > 0 });
} else {
  console.log('   ❌ API directory not found');
  checks.push({ name: 'API routes exist', passed: false });
}

// Check 5: Verify critical dependencies
console.log('\n📚 Checking critical dependencies...');
const criticalDeps = [
  '@clerk/nextjs',
  'next',
  'react',
  'drizzle-orm',
  '@upstash/redis',
  'framer-motion',
];

criticalDeps.forEach(dep => {
  const exists = packageJson.dependencies && packageJson.dependencies[dep];
  console.log(`   ${exists ? '✅' : '❌'} ${dep}`);
  checks.push({ name: `Dependency: ${dep}`, passed: !!exists });
});

// Check 6: Verify build configuration
console.log('\n⚙️ Checking build configuration...');
const nextConfigExists = fs.existsSync('next.config.js');
console.log(`   ${nextConfigExists ? '✅' : '❌'} next.config.js`);
checks.push({ name: 'Next.js config', passed: nextConfigExists });

if (nextConfigExists) {
  try {
    const nextConfig = require('./next.config.js');
    const hasTranspilePackages = nextConfig.transpilePackages && nextConfig.transpilePackages.includes('framer-motion');
    console.log(`   ${hasTranspilePackages ? '✅' : '❌'} Framer Motion transpile config`);
    checks.push({ name: 'Framer Motion config', passed: hasTranspilePackages });
  } catch (error) {
    console.log(`   ❌ Error reading next.config.js: ${error.message}`);
    checks.push({ name: 'Next.js config readable', passed: false });
  }
}

// Summary
console.log('\n📊 Summary:');
const passed = checks.filter(c => c.passed).length;
const total = checks.length;
const percentage = Math.round((passed / total) * 100);

console.log(`   ✅ Passed: ${passed}/${total} (${percentage}%)`);

if (passed === total) {
  console.log('\n🎉 All checks passed! Application is ready for deployment.');
  process.exit(0);
} else {
  console.log('\n⚠️  Some checks failed. Please fix the issues above before deploying.');
  console.log('\nFailed checks:');
  checks.filter(c => !c.passed).forEach(check => {
    console.log(`   ❌ ${check.name}`);
  });
  process.exit(1);
}