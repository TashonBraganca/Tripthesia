/**
 * Structured logging system with different levels and contexts
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  enableRemote: boolean;
  context?: string;
}

class Logger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private readonly MAX_BUFFER_SIZE = 1000;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      enableRemote: false,
      ...config,
    };

    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    if (envLevel && envLevel in LogLevel) {
      this.config.level = LogLevel[envLevel as keyof typeof LogLevel];
    }

    // Enable file logging in production
    if (process.env.NODE_ENV === 'production') {
      this.config.enableFile = true;
    }

    // Buffer cleanup
    if (typeof setInterval !== 'undefined') {
      setInterval(() => this.flushBuffer(), 30000); // Flush every 30 seconds
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.config.level;
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): LogEntry {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      context: this.config.context,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } : undefined,
    };
  }

  private formatConsoleMessage(entry: LogEntry): string {
    const levelName = LogLevel[entry.level];
    const context = entry.context ? `[${entry.context}]` : '';
    const timestamp = entry.timestamp.split('T')[1].split('.')[0]; // HH:MM:SS
    
    let message = `${timestamp} ${levelName.padEnd(5)} ${context} ${entry.message}`;
    
    if (entry.metadata && Object.keys(entry.metadata).length > 0) {
      message += ` | ${JSON.stringify(entry.metadata)}`;
    }
    
    if (entry.error) {
      message += `\n  Error: ${entry.error.message}`;
      if (entry.error.stack && this.config.level >= LogLevel.DEBUG) {
        message += `\n  Stack: ${entry.error.stack}`;
      }
    }
    
    return message;
  }

  private outputToConsole(entry: LogEntry) {
    if (!this.config.enableConsole) return;

    const message = this.formatConsoleMessage(entry);
    
    switch (entry.level) {
      case LogLevel.ERROR:
        console.error(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.DEBUG:
      case LogLevel.TRACE:
        console.log(message);
        break;
    }
  }

  private log(
    level: LogLevel,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ) {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, metadata, error);
    
    // Add to buffer
    this.buffer.push(entry);
    if (this.buffer.length > this.MAX_BUFFER_SIZE) {
      this.buffer = this.buffer.slice(-this.MAX_BUFFER_SIZE);
    }

    // Console output
    this.outputToConsole(entry);
  }

  error(message: string, error?: Error, metadata?: Record<string, any>) {
    this.log(LogLevel.ERROR, message, metadata, error);
  }

  warn(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  trace(message: string, metadata?: Record<string, any>) {
    this.log(LogLevel.TRACE, message, metadata);
  }

  // Create child logger with additional context
  child(context: string): Logger {
    const childContext = this.config.context ? 
      `${this.config.context}:${context}` : context;
    
    return new Logger({
      ...this.config,
      context: childContext,
    });
  }

  // Get recent log entries
  getRecentLogs(count: number = 100, level?: LogLevel): LogEntry[] {
    let logs = this.buffer;
    
    if (level !== undefined) {
      logs = logs.filter(entry => entry.level <= level);
    }
    
    return logs.slice(-count);
  }

  // Flush buffer (for file/remote logging)
  private flushBuffer() {
    if (this.buffer.length === 0) return;

    // In a real implementation, you might send logs to a service like:
    // - CloudWatch
    // - Datadog
    // - LogRocket
    // - Custom logging service
    
    // For now, we just keep the buffer size manageable
    if (this.buffer.length > this.MAX_BUFFER_SIZE * 2) {
      this.buffer = this.buffer.slice(-this.MAX_BUFFER_SIZE);
    }
  }

  // Get log statistics
  getStats(timeWindow: number = 3600000): {
    total: number;
    byLevel: Record<string, number>;
    errorRate: number;
  } {
    const cutoff = Date.now() - timeWindow;
    const recentLogs = this.buffer.filter(
      entry => new Date(entry.timestamp).getTime() > cutoff
    );
    
    const byLevel: Record<string, number> = {};
    let errorCount = 0;
    
    for (const entry of recentLogs) {
      const levelName = LogLevel[entry.level];
      byLevel[levelName] = (byLevel[levelName] || 0) + 1;
      
      if (entry.level === LogLevel.ERROR) {
        errorCount++;
      }
    }
    
    return {
      total: recentLogs.length,
      byLevel,
      errorRate: recentLogs.length > 0 ? (errorCount / recentLogs.length) * 100 : 0,
    };
  }
}

// Request-scoped logger utility
export function createRequestLogger(requestId: string, userId?: string): Logger {
  const logger = new Logger({
    context: `req-${requestId.slice(-8)}`,
  });
  
  // Create wrapper methods instead of accessing private method
  const originalError = logger.error.bind(logger);
  const originalWarn = logger.warn.bind(logger);
  const originalInfo = logger.info.bind(logger);
  const originalDebug = logger.debug.bind(logger);
  
  logger.error = (message: string, error?: Error, metadata?: Record<string, any>) => {
    originalError(message, error, { requestId, userId, ...metadata });
  };
  
  logger.warn = (message: string, metadata?: Record<string, any>) => {
    originalWarn(message, { requestId, userId, ...metadata });
  };
  
  logger.info = (message: string, metadata?: Record<string, any>) => {
    originalInfo(message, { requestId, userId, ...metadata });
  };
  
  logger.debug = (message: string, metadata?: Record<string, any>) => {
    originalDebug(message, { requestId, userId, ...metadata });
  };
  
  return logger;
}

// Performance logging utility
export function logPerformance(
  operation: string,
  duration: number,
  metadata?: Record<string, any>
) {
  const logger = new Logger({ context: 'performance' });
  
  const level = duration > 5000 ? LogLevel.WARN : 
               duration > 1000 ? LogLevel.INFO : LogLevel.DEBUG;
  
  if (level === LogLevel.WARN) {
    logger.warn(`${operation} completed`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  } else if (level === LogLevel.INFO) {
    logger.info(`${operation} completed`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  } else {
    logger.debug(`${operation} completed`, {
      duration: `${duration}ms`,
      ...metadata,
    });
  }
}

// Global logger instances
export const logger = new Logger();
export const apiLogger = new Logger({ context: 'api' });
export const dbLogger = new Logger({ context: 'database' });
export const cacheLogger = new Logger({ context: 'cache' });
export const authLogger = new Logger({ context: 'auth' });

// Error boundary logger
export function logError(
  error: Error,
  context: string,
  metadata?: Record<string, any>
) {
  const errorLogger = new Logger({ context });
  errorLogger.error(`Unhandled error in ${context}`, error, metadata);
}

// Async operation logger wrapper
export function withLogging<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  operationName: string,
  context?: string
) {
  const operationLogger = new Logger({ context });
  
  return async function(this: any, ...args: T): Promise<R> {
    const startTime = Date.now();
    
    operationLogger.debug(`Starting ${operationName}`);
    
    try {
      const result = await operation(...args);
      const duration = Date.now() - startTime;
      
      operationLogger.info(`Completed ${operationName}`, { duration: `${duration}ms` });
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      operationLogger.error(
        `Failed ${operationName}`, 
        error instanceof Error ? error : new Error(String(error)),
        { duration: `${duration}ms` }
      );
      
      throw error;
    }
  };
}