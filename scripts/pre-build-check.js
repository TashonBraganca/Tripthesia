#!/usr/bin/env node

/**
 * Pre-build validation script for GitHub Actions
 * Catches common build issues before they cause deployment failures
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Running pre-build validation...\n');

let hasErrors = false;
const warnings = [];
const errors = [];

// Check 1: Validate package.json consistency
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Check TypeScript version
  const tsVersion = packageJson.devDependencies?.typescript;
  if (tsVersion && tsVersion.includes('5.4')) {
    warnings.push('TypeScript 5.4+ may cause Next.js 14 compatibility issues');
  }
  
  // Check engines
  if (!packageJson.engines?.node || !packageJson.engines.node.includes('20')) {
    warnings.push('Node.js version should be >= 20 for better compatibility');
  }
  
  // Check packageManager
  if (!packageJson.packageManager || !packageJson.packageManager.includes('pnpm')) {
    warnings.push('packageManager should be set to pnpm for consistency');
  }
  
  console.log('✅ package.json validation passed');
} catch (error) {
  errors.push(`package.json validation failed: ${error.message}`);
  hasErrors = true;
}

// Check 2: Validate environment variables
const requiredEnvVars = [
  'NEXT_PUBLIC_APP_URL',
  'DATABASE_URL', 
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
  'CLERK_SECRET_KEY',
  'OPENAI_API_KEY'
];

const missingEnvVars = [];
requiredEnvVars.forEach(envVar => {
  if (!process.env[envVar]) {
    missingEnvVars.push(envVar);
  }
});

if (missingEnvVars.length > 0) {
  console.log(`⚠️  Missing environment variables: ${missingEnvVars.join(', ')}`);
} else {
  console.log('✅ Environment variables validation passed');
}

// Check 3: Validate Next.js configuration
try {
  const nextConfigPath = 'next.config.js';
  if (fs.existsSync(nextConfigPath)) {
    const nextConfigContent = fs.readFileSync(nextConfigPath, 'utf8');
    
    // Check for common issues
    if (!nextConfigContent.includes('transpilePackages')) {
      warnings.push('next.config.js should include transpilePackages for Framer Motion');
    }
    
    if (!nextConfigContent.includes('serverComponentsExternalPackages')) {
      warnings.push('next.config.js should externalize postgres package');
    }
    
    console.log('✅ Next.js configuration validation passed');
  } else {
    errors.push('next.config.js not found');
    hasErrors = true;
  }
} catch (error) {
  warnings.push(`Next.js config validation issue: ${error.message}`);
}

// Check 4: Validate TypeScript configuration
try {
  const tsConfigPath = 'tsconfig.json';
  if (fs.existsSync(tsConfigPath)) {
    const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));
    
    // Check for strict mode
    if (!tsConfig.compilerOptions?.strict) {
      warnings.push('TypeScript strict mode should be enabled');
    }
    
    // Check for proper module resolution
    if (tsConfig.compilerOptions?.moduleResolution !== 'bundler') {
      warnings.push('TypeScript moduleResolution should be "bundler" for Next.js 14');
    }
    
    console.log('✅ TypeScript configuration validation passed');
  } else {
    errors.push('tsconfig.json not found');
    hasErrors = true;
  }
} catch (error) {
  warnings.push(`TypeScript config validation issue: ${error.message}`);
}

// Check 5: Validate critical files exist
const criticalFiles = [
  'app/layout.tsx',
  'app/page.tsx',
  'middleware.ts',
  'lib/db.ts',
  'lib/redis.ts'
];

const missingFiles = criticalFiles.filter(file => !fs.existsSync(file));
if (missingFiles.length > 0) {
  errors.push(`Missing critical files: ${missingFiles.join(', ')}`);
  hasErrors = true;
} else {
  console.log('✅ Critical files validation passed');
}

// Check 6: Validate API routes
try {
  const apiDir = 'app/api';
  if (fs.existsSync(apiDir)) {
    const apiRoutes = [];
    
    function scanApiRoutes(dir) {
      const items = fs.readdirSync(dir, { withFileTypes: true });
      for (const item of items) {
        const fullPath = path.join(dir, item.name);
        if (item.isDirectory()) {
          scanApiRoutes(fullPath);
        } else if (item.name === 'route.ts') {
          apiRoutes.push(fullPath);
        }
      }
    }
    
    scanApiRoutes(apiDir);
    console.log(`✅ Found ${apiRoutes.length} API routes`);
    
    // Validate each API route has proper error handling
    for (const route of apiRoutes) {
      const content = fs.readFileSync(route, 'utf8');
      if (!content.includes('try') || !content.includes('catch')) {
        warnings.push(`API route ${route} may be missing error handling`);
      }
    }
  } else {
    warnings.push('No API routes directory found');
  }
} catch (error) {
  warnings.push(`API routes validation issue: ${error.message}`);
}

// Report results
console.log('\n📊 Validation Summary:');

if (warnings.length > 0) {
  console.log(`\n⚠️  Warnings (${warnings.length}):`);
  warnings.forEach(warning => console.log(`   - ${warning}`));
}

if (errors.length > 0) {
  console.log(`\n❌ Errors (${errors.length}):`);
  errors.forEach(error => console.log(`   - ${error}`));
}

if (hasErrors) {
  console.log('\n💥 Pre-build validation failed! Please fix errors before deployment.');
  process.exit(1);
} else {
  console.log('\n✅ Pre-build validation passed! Build should succeed.');
  process.exit(0);
}