/**
 * Security Audit Script for Tripthesia
 * Comprehensive security analysis and vulnerability detection
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

class SecurityAuditor {
  constructor() {
    this.vulnerabilities = [];
    this.warnings = [];
    this.info = [];
    this.projectRoot = process.cwd();
    this.report = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      summary: {},
      vulnerabilities: [],
      warnings: [],
      info: [],
      recommendations: []
    };
  }

  async runFullAudit() {
    console.log('🔒 Starting Tripthesia Security Audit');
    console.log('====================================');

    try {
      // 1. Dependency vulnerabilities
      await this.checkDependencyVulnerabilities();

      // 2. Environment and configuration security
      await this.checkEnvironmentSecurity();

      // 3. Code security analysis
      await this.checkCodeSecurity();

      // 4. API security analysis
      await this.checkAPIEndpointSecurity();

      // 5. Authentication and authorization
      await this.checkAuthSecurity();

      // 6. Data security
      await this.checkDataSecurity();

      // 7. Infrastructure security
      await this.checkInfrastructureSecurity();

      // 8. Generate final report
      this.generateSecurityReport();

      console.log('\n✅ Security audit completed');
      return this.report;

    } catch (error) {
      console.error('❌ Security audit failed:', error);
      throw error;
    }
  }

  async checkDependencyVulnerabilities() {
    console.log('\n🔍 Checking dependency vulnerabilities...');

    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageLockPath = path.join(this.projectRoot, 'package-lock.json');

      if (!fs.existsSync(packageJsonPath)) {
        this.addVulnerability('CRITICAL', 'Missing package.json file', 'DEP-001');
        return;
      }

      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      
      // Check for known vulnerable packages
      const vulnerablePackages = [
        { name: 'lodash', versions: ['<4.17.21'], severity: 'HIGH' },
        { name: 'axios', versions: ['<0.21.2'], severity: 'HIGH' },
        { name: 'jsonwebtoken', versions: ['<8.5.1'], severity: 'CRITICAL' },
        { name: 'express', versions: ['<4.18.2'], severity: 'MEDIUM' },
        { name: 'cors', versions: ['<2.8.5'], severity: 'MEDIUM' }
      ];

      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      for (const [depName, depVersion] of Object.entries(allDeps)) {
        const vuln = vulnerablePackages.find(v => v.name === depName);
        if (vuln) {
          this.addVulnerability(vuln.severity, 
            `Potentially vulnerable package: ${depName}@${depVersion}`, 
            'DEP-002',
            { package: depName, version: depVersion, recommendation: `Update to latest version` }
          );
        }
      }

      // Check for outdated critical packages
      const criticalPackages = ['@clerk/nextjs', 'next', 'react', 'typescript'];
      for (const pkg of criticalPackages) {
        if (allDeps[pkg]) {
          this.addInfo(`Found critical package: ${pkg}@${allDeps[pkg]}`, 'DEP-003');
        }
      }

      console.log('✓ Dependency check completed');

    } catch (error) {
      this.addVulnerability('HIGH', `Failed to check dependencies: ${error.message}`, 'DEP-004');
    }
  }

  async checkEnvironmentSecurity() {
    console.log('\n🌍 Checking environment security...');

    const envFiles = ['.env', '.env.local', '.env.production', '.env.development'];
    const sensitiveKeys = [
      'API_KEY', 'SECRET', 'PASSWORD', 'TOKEN', 'PRIVATE_KEY', 
      'DATABASE_URL', 'CLERK_SECRET_KEY', 'OPENAI_API_KEY'
    ];

    for (const envFile of envFiles) {
      const envPath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(envPath)) {
        try {
          const envContent = fs.readFileSync(envPath, 'utf8');
          const lines = envContent.split('\n');

          // Check for empty or weak secrets
          lines.forEach((line, index) => {
            if (line.trim() && !line.startsWith('#')) {
              const [key, value] = line.split('=');
              
              if (sensitiveKeys.some(sk => key.includes(sk))) {
                if (!value || value.length < 16) {
                  this.addVulnerability('HIGH', 
                    `Weak or empty secret in ${envFile}:${index + 1} - ${key}`, 
                    'ENV-001'
                  );
                }

                // Check for common weak values
                const weakValues = ['password', '123456', 'secret', 'test', 'admin'];
                if (weakValues.some(wv => value?.toLowerCase().includes(wv))) {
                  this.addVulnerability('CRITICAL', 
                    `Weak secret value in ${envFile}:${index + 1} - ${key}`, 
                    'ENV-002'
                  );
                }
              }

              // Check for hardcoded URLs in production
              if (envFile.includes('production') && value?.includes('localhost')) {
                this.addWarning(`Production environment contains localhost URL: ${key}`, 'ENV-003');
              }
            }
          });

          this.addInfo(`Found environment file: ${envFile} (${lines.length} lines)`, 'ENV-004');

        } catch (error) {
          this.addWarning(`Could not read ${envFile}: ${error.message}`, 'ENV-005');
        }
      }
    }

    // Check for missing required environment variables
    const requiredEnvVars = ['DATABASE_URL', 'CLERK_SECRET_KEY', 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY'];
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      this.addVulnerability('HIGH', 
        `Missing required environment variables: ${missingVars.join(', ')}`, 
        'ENV-006'
      );
    }

    console.log('✓ Environment security check completed');
  }

  async checkCodeSecurity() {
    console.log('\n💻 Checking code security...');

    const codePatterns = [
      // SQL Injection patterns
      { pattern: /(\$\{.*\}.*SELECT|SELECT.*\$\{.*\})/gi, severity: 'CRITICAL', description: 'Potential SQL injection vulnerability', code: 'CODE-001' },
      
      // XSS patterns
      { pattern: /dangerouslySetInnerHTML.*\{.*\}/gi, severity: 'HIGH', description: 'Potential XSS vulnerability with dangerouslySetInnerHTML', code: 'CODE-002' },
      
      // Hardcoded credentials
      { pattern: /(password|secret|key|token)\s*[:=]\s*["'][^"']{8,}["']/gi, severity: 'HIGH', description: 'Hardcoded credentials found', code: 'CODE-003' },
      
      // Eval usage
      { pattern: /eval\s*\(/gi, severity: 'CRITICAL', description: 'Use of eval() detected', code: 'CODE-004' },
      
      // Insecure randomness
      { pattern: /Math\.random\(\)/gi, severity: 'MEDIUM', description: 'Insecure randomness - use crypto.randomBytes() instead', code: 'CODE-005' },
      
      // Console.log in production
      { pattern: /console\.(log|debug|info)\s*\(/gi, severity: 'LOW', description: 'Console statements in production code', code: 'CODE-006' },
      
      // Weak encryption
      { pattern: /(MD5|SHA1)/gi, severity: 'MEDIUM', description: 'Weak cryptographic algorithm', code: 'CODE-007' }
    ];

    const scanDirectory = (dir, extensions = ['.js', '.jsx', '.ts', '.tsx']) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory() && !file.startsWith('.') && !['node_modules', '.next'].includes(file)) {
          scanDirectory(filePath, extensions);
        } else if (extensions.some(ext => file.endsWith(ext))) {
          this.scanFile(filePath, codePatterns);
        }
      }
    };

    try {
      scanDirectory(this.projectRoot);
      console.log('✓ Code security scan completed');
    } catch (error) {
      this.addWarning(`Code scan error: ${error.message}`, 'CODE-008');
    }
  }

  scanFile(filePath, patterns) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      patterns.forEach(({ pattern, severity, description, code }) => {
        lines.forEach((line, index) => {
          if (pattern.test(line)) {
            const relativeFilePath = path.relative(this.projectRoot, filePath);
            
            if (severity === 'CRITICAL' || severity === 'HIGH') {
              this.addVulnerability(severity, 
                `${description} in ${relativeFilePath}:${index + 1}`, 
                code,
                { file: relativeFilePath, line: index + 1, content: line.trim() }
              );
            } else {
              this.addWarning(`${description} in ${relativeFilePath}:${index + 1}`, code);
            }
          }
        });
      });
    } catch (error) {
      // Skip files that can't be read
    }
  }

  async checkAPIEndpointSecurity() {
    console.log('\n🌐 Checking API endpoint security...');

    const apiDir = path.join(this.projectRoot, 'app', 'api');
    
    if (!fs.existsSync(apiDir)) {
      this.addWarning('No API directory found', 'API-001');
      return;
    }

    const scanAPIDirectory = (dir) => {
      const files = fs.readdirSync(dir);
      
      for (const file of files) {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
          scanAPIDirectory(filePath);
        } else if (file === 'route.ts' || file === 'route.js') {
          this.analyzeAPIRoute(filePath);
        }
      }
    };

    try {
      scanAPIDirectory(apiDir);
      console.log('✓ API endpoint security check completed');
    } catch (error) {
      this.addWarning(`API scan error: ${error.message}`, 'API-002');
    }
  }

  analyzeAPIRoute(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativeFilePath = path.relative(this.projectRoot, filePath);
      
      // Check for missing authentication
      if (!content.includes('auth') && !content.includes('clerk')) {
        this.addWarning(`API route may lack authentication: ${relativeFilePath}`, 'API-003');
      }
      
      // Check for missing input validation
      if (!content.includes('zod') && !content.includes('validate')) {
        this.addWarning(`API route may lack input validation: ${relativeFilePath}`, 'API-004');
      }
      
      // Check for missing rate limiting
      if (!content.includes('rate') && !content.includes('limit')) {
        this.addInfo(`API route may lack rate limiting: ${relativeFilePath}`, 'API-005');
      }
      
      // Check for proper error handling
      if (!content.includes('try') || !content.includes('catch')) {
        this.addWarning(`API route may lack proper error handling: ${relativeFilePath}`, 'API-006');
      }
      
      // Check for CORS configuration
      if (content.includes('cors') || content.includes('Access-Control-Allow-Origin')) {
        this.addInfo(`CORS configured in: ${relativeFilePath}`, 'API-007');
      }
      
    } catch (error) {
      this.addWarning(`Could not analyze API route ${filePath}: ${error.message}`, 'API-008');
    }
  }

  async checkAuthSecurity() {
    console.log('\n🔐 Checking authentication security...');

    // Check Clerk configuration
    const clerkPublicKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    
    if (!clerkPublicKey || !clerkSecretKey) {
      this.addVulnerability('CRITICAL', 'Missing Clerk authentication keys', 'AUTH-001');
    } else {
      this.addInfo('Clerk authentication properly configured', 'AUTH-002');
    }

    // Check for session security
    const middlewarePath = path.join(this.projectRoot, 'middleware.ts');
    if (fs.existsSync(middlewarePath)) {
      const middlewareContent = fs.readFileSync(middlewarePath, 'utf8');
      
      if (middlewareContent.includes('authMiddleware')) {
        this.addInfo('Authentication middleware detected', 'AUTH-003');
      } else {
        this.addWarning('No authentication middleware found', 'AUTH-004');
      }
    } else {
      this.addWarning('No middleware.ts file found', 'AUTH-005');
    }

    // Check for JWT security (if used)
    if (fs.existsSync(path.join(this.projectRoot, 'package.json'))) {
      const packageJson = JSON.parse(fs.readFileSync(path.join(this.projectRoot, 'package.json'), 'utf8'));
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      if (deps['jsonwebtoken']) {
        this.addInfo('JWT tokens in use - ensure proper secret management', 'AUTH-006');
      }
    }

    console.log('✓ Authentication security check completed');
  }

  async checkDataSecurity() {
    console.log('\n🗄️ Checking data security...');

    // Check database schema
    const schemaPath = path.join(this.projectRoot, 'lib', 'database', 'schema.ts');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf8');
      
      // Check for sensitive data fields
      const sensitiveFields = ['password', 'ssn', 'creditCard', 'bankAccount'];
      sensitiveFields.forEach(field => {
        if (schemaContent.includes(field) && !schemaContent.includes('encrypted')) {
          this.addVulnerability('HIGH', 
            `Sensitive field '${field}' may not be encrypted in database schema`, 
            'DATA-001'
          );
        }
      });
      
      // Check for proper indexing on sensitive fields
      if (schemaContent.includes('email') && schemaContent.includes('unique')) {
        this.addInfo('Email field properly indexed with unique constraint', 'DATA-002');
      }
      
    } else {
      this.addWarning('No database schema file found', 'DATA-003');
    }

    // Check for data validation
    const hasZodValidation = fs.existsSync(path.join(this.projectRoot, 'node_modules', 'zod'));
    if (hasZodValidation) {
      this.addInfo('Zod validation library detected', 'DATA-004');
    } else {
      this.addWarning('No data validation library detected', 'DATA-005');
    }

    console.log('✓ Data security check completed');
  }

  async checkInfrastructureSecurity() {
    console.log('\n🏗️ Checking infrastructure security...');

    // Check Next.js security headers
    const nextConfigPath = path.join(this.projectRoot, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      const configContent = fs.readFileSync(nextConfigPath, 'utf8');
      
      const securityHeaders = ['X-Frame-Options', 'X-Content-Type-Options', 'Content-Security-Policy'];
      securityHeaders.forEach(header => {
        if (configContent.includes(header)) {
          this.addInfo(`Security header configured: ${header}`, 'INFRA-001');
        } else {
          this.addWarning(`Missing security header: ${header}`, 'INFRA-002');
        }
      });
    }

    // Check for HTTPS enforcement
    const layoutPath = path.join(this.projectRoot, 'app', 'layout.tsx');
    if (fs.existsSync(layoutPath)) {
      const layoutContent = fs.readFileSync(layoutPath, 'utf8');
      
      if (layoutContent.includes('https://') || layoutContent.includes('secure')) {
        this.addInfo('HTTPS configuration detected', 'INFRA-003');
      }
    }

    // Check for Vercel security configuration
    const vercelJsonPath = path.join(this.projectRoot, 'vercel.json');
    if (fs.existsSync(vercelJsonPath)) {
      const vercelConfig = JSON.parse(fs.readFileSync(vercelJsonPath, 'utf8'));
      
      if (vercelConfig.headers) {
        this.addInfo('Vercel security headers configured', 'INFRA-004');
      }
    }

    console.log('✓ Infrastructure security check completed');
  }

  addVulnerability(severity, description, code, additionalData = {}) {
    const vuln = {
      id: `${code}-${Date.now()}`,
      severity,
      description,
      code,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    this.vulnerabilities.push(vuln);
    this.report.vulnerabilities.push(vuln);
    
    const icon = severity === 'CRITICAL' ? '🔴' : severity === 'HIGH' ? '🟠' : '🟡';
    console.log(`${icon} ${severity}: ${description} [${code}]`);
  }

  addWarning(description, code, additionalData = {}) {
    const warning = {
      id: `${code}-${Date.now()}`,
      description,
      code,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    this.warnings.push(warning);
    this.report.warnings.push(warning);
    
    console.log(`⚠️ WARNING: ${description} [${code}]`);
  }

  addInfo(description, code, additionalData = {}) {
    const info = {
      id: `${code}-${Date.now()}`,
      description,
      code,
      timestamp: new Date().toISOString(),
      ...additionalData
    };
    
    this.info.push(info);
    this.report.info.push(info);
    
    console.log(`ℹ️ INFO: ${description} [${code}]`);
  }

  generateSecurityReport() {
    const critical = this.vulnerabilities.filter(v => v.severity === 'CRITICAL').length;
    const high = this.vulnerabilities.filter(v => v.severity === 'HIGH').length;
    const medium = this.vulnerabilities.filter(v => v.severity === 'MEDIUM').length;
    const low = this.vulnerabilities.filter(v => v.severity === 'LOW').length;

    this.report.summary = {
      totalVulnerabilities: this.vulnerabilities.length,
      totalWarnings: this.warnings.length,
      totalInfo: this.info.length,
      severityBreakdown: { critical, high, medium, low },
      securityScore: this.calculateSecurityScore(critical, high, medium, low),
      riskLevel: this.calculateRiskLevel(critical, high, medium)
    };

    // Generate recommendations
    this.report.recommendations = this.generateRecommendations();

    // Save report
    const reportPath = path.join(this.projectRoot, 'security-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.report, null, 2));
    
    console.log('\n📊 Security Audit Summary');
    console.log('=========================');
    console.log(`Total Vulnerabilities: ${this.vulnerabilities.length}`);
    console.log(`- Critical: ${critical}`);
    console.log(`- High: ${high}`);
    console.log(`- Medium: ${medium}`);
    console.log(`- Low: ${low}`);
    console.log(`Warnings: ${this.warnings.length}`);
    console.log(`Security Score: ${this.report.summary.securityScore}/100`);
    console.log(`Risk Level: ${this.report.summary.riskLevel}`);
    console.log(`\n📄 Full report saved to: security-report.json`);

    return this.report;
  }

  calculateSecurityScore(critical, high, medium, low) {
    let score = 100;
    score -= critical * 25;  // Critical: -25 points each
    score -= high * 10;      // High: -10 points each
    score -= medium * 5;     // Medium: -5 points each
    score -= low * 2;        // Low: -2 points each
    return Math.max(0, score);
  }

  calculateRiskLevel(critical, high, medium) {
    if (critical > 0) return 'CRITICAL';
    if (high > 2) return 'HIGH';
    if (high > 0 || medium > 5) return 'MEDIUM';
    return 'LOW';
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.vulnerabilities.some(v => v.code.startsWith('DEP-'))) {
      recommendations.push({
        category: 'Dependencies',
        priority: 'HIGH',
        action: 'Update all vulnerable dependencies to their latest secure versions',
        commands: ['npm audit fix', 'npm update']
      });
    }

    if (this.vulnerabilities.some(v => v.code.startsWith('ENV-'))) {
      recommendations.push({
        category: 'Environment',
        priority: 'CRITICAL',
        action: 'Strengthen environment variable security',
        steps: [
          'Generate strong secrets using crypto.randomBytes()',
          'Use environment-specific configurations',
          'Never commit .env files to version control'
        ]
      });
    }

    if (this.vulnerabilities.some(v => v.code.startsWith('CODE-'))) {
      recommendations.push({
        category: 'Code Security',
        priority: 'HIGH',
        action: 'Address code security issues',
        steps: [
          'Remove eval() usage and use safer alternatives',
          'Sanitize all user inputs',
          'Use parameterized queries for database operations',
          'Implement proper error handling'
        ]
      });
    }

    return recommendations;
  }
}

// Main execution
async function runSecurityAudit() {
  const auditor = new SecurityAuditor();
  try {
    await auditor.runFullAudit();
  } catch (error) {
    console.error('Security audit failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runSecurityAudit();
}

module.exports = SecurityAuditor;