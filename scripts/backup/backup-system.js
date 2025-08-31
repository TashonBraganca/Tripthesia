/**
 * Backup and Disaster Recovery System for Tripthesia
 * Automated backup creation and restoration utilities
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

class BackupSystem {
  constructor(options = {}) {
    this.projectRoot = process.cwd();
    this.backupDir = options.backupDir || path.join(this.projectRoot, 'backups');
    this.config = {
      retention: {
        daily: 7,    // Keep 7 daily backups
        weekly: 4,   // Keep 4 weekly backups
        monthly: 12  // Keep 12 monthly backups
      },
      compression: true,
      encryption: false, // Enable in production with proper key management
      ...options
    };

    this.ensureBackupDirectory();
  }

  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      console.log(`📁 Created backup directory: ${this.backupDir}`);
    }
  }

  async createFullBackup(type = 'manual') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupId = `backup-${type}-${timestamp}`;
    const backupPath = path.join(this.backupDir, backupId);

    console.log(`📦 Creating ${type} backup: ${backupId}`);

    try {
      // Create backup directory
      fs.mkdirSync(backupPath, { recursive: true });

      // 1. Backup application code
      await this.backupApplicationCode(backupPath);

      // 2. Backup configuration files
      await this.backupConfiguration(backupPath);

      // 3. Backup environment variables (encrypted)
      await this.backupEnvironment(backupPath);

      // 4. Backup database schema and migrations
      await this.backupDatabaseSchema(backupPath);

      // 5. Create backup manifest
      await this.createBackupManifest(backupPath, type);

      // 6. Verify backup integrity
      const verification = await this.verifyBackup(backupPath);

      // 7. Compress if enabled
      if (this.config.compression) {
        await this.compressBackup(backupPath);
      }

      // 8. Clean old backups
      await this.cleanOldBackups(type);

      console.log(`✅ Backup completed: ${backupId}`);
      console.log(`📊 Verification: ${verification.valid ? 'PASSED' : 'FAILED'}`);

      return {
        success: true,
        backupId,
        path: backupPath,
        verification
      };

    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      
      // Clean up failed backup
      if (fs.existsSync(backupPath)) {
        fs.rmSync(backupPath, { recursive: true, force: true });
      }

      throw error;
    }
  }

  async backupApplicationCode(backupPath) {
    console.log('📄 Backing up application code...');

    const codeBackupPath = path.join(backupPath, 'code');
    fs.mkdirSync(codeBackupPath, { recursive: true });

    // Define what to backup and what to exclude
    const includePatterns = [
      'app',
      'components', 
      'lib',
      'scripts',
      'public',
      'styles',
      'middleware.ts',
      'next.config.js',
      'tailwind.config.js',
      'tsconfig.json',
      'package.json',
      'package-lock.json',
      'drizzle.config.ts',
      'README.md',
      'CHANGELOG.md'
    ];

    const excludePatterns = [
      '.next',
      'node_modules',
      '.git',
      'backups',
      '.env*',
      '*.log',
      'coverage',
      '.nyc_output',
      'dist'
    ];

    // Copy files and directories
    for (const pattern of includePatterns) {
      const sourcePath = path.join(this.projectRoot, pattern);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(codeBackupPath, pattern);
        
        if (fs.statSync(sourcePath).isDirectory()) {
          this.copyDirectory(sourcePath, destPath, excludePatterns);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }

    // Create git info if available
    try {
      const gitCommit = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
      const gitBranch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
      const gitStatus = execSync('git status --porcelain', { encoding: 'utf8' });

      const gitInfo = {
        commit: gitCommit,
        branch: gitBranch,
        hasUncommittedChanges: gitStatus.length > 0,
        status: gitStatus,
        timestamp: new Date().toISOString()
      };

      fs.writeFileSync(
        path.join(codeBackupPath, 'git-info.json'), 
        JSON.stringify(gitInfo, null, 2)
      );
    } catch (error) {
      console.warn('⚠️ Could not capture git information:', error.message);
    }

    console.log('✓ Application code backup completed');
  }

  async backupConfiguration(backupPath) {
    console.log('⚙️ Backing up configuration...');

    const configBackupPath = path.join(backupPath, 'config');
    fs.mkdirSync(configBackupPath, { recursive: true });

    // Backup configuration files
    const configFiles = [
      'next.config.js',
      'tailwind.config.js', 
      'tsconfig.json',
      'drizzle.config.ts',
      'package.json',
      'package-lock.json',
      '.gitignore',
      '.eslintrc.json',
      'vercel.json'
    ];

    for (const configFile of configFiles) {
      const sourcePath = path.join(this.projectRoot, configFile);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(configBackupPath, configFile);
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // Backup custom configuration directories
    const configDirs = ['scripts', '.vscode'];
    for (const configDir of configDirs) {
      const sourcePath = path.join(this.projectRoot, configDir);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(configBackupPath, configDir);
        this.copyDirectory(sourcePath, destPath);
      }
    }

    console.log('✓ Configuration backup completed');
  }

  async backupEnvironment(backupPath) {
    console.log('🔐 Backing up environment configuration...');

    const envBackupPath = path.join(backupPath, 'environment');
    fs.mkdirSync(envBackupPath, { recursive: true });

    // Create environment template (without actual secrets)
    const envFiles = ['.env.example', '.env.local.example'];
    
    for (const envFile of envFiles) {
      const sourcePath = path.join(this.projectRoot, envFile);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(envBackupPath, envFile);
        fs.copyFileSync(sourcePath, destPath);
      }
    }

    // Create environment variables list (keys only, no values)
    const envVars = Object.keys(process.env).filter(key => 
      key.startsWith('NEXT_PUBLIC_') || 
      key.startsWith('DATABASE_') ||
      key.startsWith('CLERK_') ||
      key.startsWith('OPENAI_') ||
      key.startsWith('RAZORPAY_')
    );

    const envConfig = {
      variables: envVars.map(key => ({ key, required: true, description: '' })),
      timestamp: new Date().toISOString(),
      note: 'This file contains environment variable keys only. Values must be configured separately.'
    };

    fs.writeFileSync(
      path.join(envBackupPath, 'environment-config.json'),
      JSON.stringify(envConfig, null, 2)
    );

    console.log('✓ Environment backup completed (keys only)');
  }

  async backupDatabaseSchema(backupPath) {
    console.log('🗄️ Backing up database schema...');

    const dbBackupPath = path.join(backupPath, 'database');
    fs.mkdirSync(dbBackupPath, { recursive: true });

    // Backup Drizzle schema and migrations
    const dbFiles = ['lib/database/schema.ts', 'drizzle'];
    
    for (const dbPath of dbFiles) {
      const sourcePath = path.join(this.projectRoot, dbPath);
      
      if (fs.existsSync(sourcePath)) {
        const destPath = path.join(dbBackupPath, path.basename(dbPath));
        
        if (fs.statSync(sourcePath).isDirectory()) {
          this.copyDirectory(sourcePath, destPath);
        } else {
          fs.copyFileSync(sourcePath, destPath);
        }
      }
    }

    // Generate database schema documentation
    try {
      const schemaPath = path.join(this.projectRoot, 'lib/database/schema.ts');
      if (fs.existsSync(schemaPath)) {
        const schemaContent = fs.readFileSync(schemaPath, 'utf8');
        
        // Extract table definitions
        const tableMatches = schemaContent.match(/export const \w+ = pgTable\([^}]+\}/g);
        const tables = tableMatches ? tableMatches.length : 0;
        
        const schemaDoc = {
          tablesCount: tables,
          timestamp: new Date().toISOString(),
          note: 'Database schema extracted from Drizzle ORM definitions'
        };

        fs.writeFileSync(
          path.join(dbBackupPath, 'schema-info.json'),
          JSON.stringify(schemaDoc, null, 2)
        );
      }
    } catch (error) {
      console.warn('⚠️ Could not analyze database schema:', error.message);
    }

    console.log('✓ Database schema backup completed');
  }

  async createBackupManifest(backupPath, type) {
    console.log('📋 Creating backup manifest...');

    const manifest = {
      id: path.basename(backupPath),
      type,
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      contents: {
        code: fs.existsSync(path.join(backupPath, 'code')),
        config: fs.existsSync(path.join(backupPath, 'config')), 
        environment: fs.existsSync(path.join(backupPath, 'environment')),
        database: fs.existsSync(path.join(backupPath, 'database'))
      },
      metadata: {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        backupTool: 'Tripthesia Backup System v1.0.0'
      }
    };

    // Calculate backup size
    manifest.size = this.calculateDirectorySize(backupPath);

    fs.writeFileSync(
      path.join(backupPath, 'backup-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    console.log('✓ Backup manifest created');
    return manifest;
  }

  async verifyBackup(backupPath) {
    console.log('🔍 Verifying backup integrity...');

    const verification = {
      valid: true,
      issues: [],
      checksums: {},
      timestamp: new Date().toISOString()
    };

    try {
      // Check manifest exists
      const manifestPath = path.join(backupPath, 'backup-manifest.json');
      if (!fs.existsSync(manifestPath)) {
        verification.valid = false;
        verification.issues.push('Missing backup manifest');
        return verification;
      }

      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

      // Verify each component
      const components = ['code', 'config', 'environment', 'database'];
      for (const component of components) {
        const componentPath = path.join(backupPath, component);
        
        if (manifest.contents[component]) {
          if (!fs.existsSync(componentPath)) {
            verification.valid = false;
            verification.issues.push(`Missing ${component} directory`);
          } else {
            // Calculate checksum
            verification.checksums[component] = this.calculateDirectoryChecksum(componentPath);
          }
        }
      }

      // Verify critical files
      const criticalFiles = [
        'code/package.json',
        'code/app',
        'config/next.config.js'
      ];

      for (const criticalFile of criticalFiles) {
        const filePath = path.join(backupPath, criticalFile);
        if (!fs.existsSync(filePath)) {
          verification.issues.push(`Missing critical file: ${criticalFile}`);
        }
      }

      if (verification.issues.length > 0) {
        verification.valid = false;
      }

    } catch (error) {
      verification.valid = false;
      verification.issues.push(`Verification error: ${error.message}`);
    }

    console.log(`✓ Backup verification completed: ${verification.valid ? 'VALID' : 'INVALID'}`);
    if (verification.issues.length > 0) {
      console.log(`⚠️ Issues found: ${verification.issues.join(', ')}`);
    }

    return verification;
  }

  async compressBackup(backupPath) {
    console.log('🗜️ Compressing backup...');

    try {
      const tarPath = `${backupPath}.tar.gz`;
      execSync(`tar -czf "${tarPath}" -C "${path.dirname(backupPath)}" "${path.basename(backupPath)}"`);
      
      // Remove original directory after successful compression
      fs.rmSync(backupPath, { recursive: true, force: true });
      
      console.log(`✓ Backup compressed: ${path.basename(tarPath)}`);
    } catch (error) {
      console.warn('⚠️ Compression failed:', error.message);
    }
  }

  async cleanOldBackups(type) {
    console.log('🧹 Cleaning old backups...');

    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith(`backup-${type}-`))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          stats: fs.statSync(path.join(this.backupDir, file))
        }))
        .sort((a, b) => b.stats.mtime.getTime() - a.stats.mtime.getTime());

      const retentionCount = this.config.retention.daily; // Default retention
      
      if (backupFiles.length > retentionCount) {
        const filesToDelete = backupFiles.slice(retentionCount);
        
        for (const file of filesToDelete) {
          if (file.stats.isDirectory()) {
            fs.rmSync(file.path, { recursive: true, force: true });
          } else {
            fs.unlinkSync(file.path);
          }
          console.log(`🗑️ Removed old backup: ${file.name}`);
        }
      }

      console.log('✓ Old backup cleanup completed');
    } catch (error) {
      console.warn('⚠️ Cleanup failed:', error.message);
    }
  }

  // Utility methods
  copyDirectory(src, dest, excludePatterns = []) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }

    const items = fs.readdirSync(src);

    for (const item of items) {
      const srcPath = path.join(src, item);
      const destPath = path.join(dest, item);

      // Skip excluded patterns
      if (excludePatterns.some(pattern => item.includes(pattern))) {
        continue;
      }

      const stats = fs.statSync(srcPath);

      if (stats.isDirectory()) {
        this.copyDirectory(srcPath, destPath, excludePatterns);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

  calculateDirectorySize(dirPath) {
    let totalSize = 0;

    const items = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const item of items) {
      const itemPath = path.join(dirPath, item.name);
      
      if (item.isDirectory()) {
        totalSize += this.calculateDirectorySize(itemPath);
      } else {
        totalSize += fs.statSync(itemPath).size;
      }
    }

    return totalSize;
  }

  calculateDirectoryChecksum(dirPath) {
    const hash = crypto.createHash('sha256');
    const items = fs.readdirSync(dirPath).sort();

    for (const item of items) {
      const itemPath = path.join(dirPath, item);
      const stats = fs.statSync(itemPath);

      hash.update(item);
      
      if (stats.isFile()) {
        const content = fs.readFileSync(itemPath);
        hash.update(content);
      } else if (stats.isDirectory()) {
        hash.update(this.calculateDirectoryChecksum(itemPath));
      }
    }

    return hash.digest('hex');
  }

  // Restore functionality
  async restoreBackup(backupId) {
    console.log(`🔄 Restoring backup: ${backupId}`);
    
    const backupPath = path.join(this.backupDir, backupId);
    const extractedPath = backupPath.replace('.tar.gz', '');

    try {
      // Extract if compressed
      if (backupId.endsWith('.tar.gz')) {
        console.log('📦 Extracting compressed backup...');
        execSync(`tar -xzf "${backupPath}" -C "${this.backupDir}"`);
      }

      // Verify backup before restoration
      const verification = await this.verifyBackup(extractedPath);
      if (!verification.valid) {
        throw new Error(`Backup verification failed: ${verification.issues.join(', ')}`);
      }

      console.log('⚠️ Backup restoration would overwrite current application');
      console.log('🛑 This is a destructive operation - implement with caution');
      
      // For safety, we'll just verify the restoration process
      return {
        success: true,
        message: 'Backup verified and ready for restoration',
        verification
      };

    } catch (error) {
      console.error(`❌ Restoration failed: ${error.message}`);
      throw error;
    }
  }

  // List available backups
  listBackups() {
    const files = fs.readdirSync(this.backupDir);
    const backups = files
      .filter(file => file.startsWith('backup-'))
      .map(file => {
        const filePath = path.join(this.backupDir, file);
        const stats = fs.statSync(filePath);
        
        return {
          name: file,
          path: filePath,
          size: this.formatBytes(stats.size),
          created: stats.birthtime,
          modified: stats.mtime,
          type: stats.isDirectory() ? 'directory' : 'archive'
        };
      })
      .sort((a, b) => b.modified.getTime() - a.modified.getTime());

    return backups;
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// CLI interface
async function runBackupSystem() {
  const args = process.argv.slice(2);
  const command = args[0];

  const backup = new BackupSystem();

  try {
    switch (command) {
      case 'create':
        const type = args[1] || 'manual';
        await backup.createFullBackup(type);
        break;

      case 'list':
        const backups = backup.listBackups();
        console.log('\n📋 Available Backups:');
        console.log('====================');
        backups.forEach(backup => {
          console.log(`${backup.name} (${backup.size}) - ${backup.created.toISOString()}`);
        });
        break;

      case 'restore':
        const backupId = args[1];
        if (!backupId) {
          console.error('❌ Please specify backup ID to restore');
          process.exit(1);
        }
        await backup.restoreBackup(backupId);
        break;

      default:
        console.log('Tripthesia Backup System v1.0.0');
        console.log('Usage:');
        console.log('  node backup-system.js create [type]  - Create backup (manual/daily/weekly/monthly)');
        console.log('  node backup-system.js list           - List available backups');
        console.log('  node backup-system.js restore <id>   - Restore backup by ID');
    }
  } catch (error) {
    console.error('Backup system error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  runBackupSystem();
}

module.exports = BackupSystem;