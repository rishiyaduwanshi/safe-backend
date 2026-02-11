// Handle uncaught exceptions
process.on('uncaughtException', (err: Error): void => {
  console.error('💥 UNCAUGHT EXCEPTION! Shutting down...');
  console.error(`${err.name}: ${err.message}`);
  console.error(err.stack);
  process.exit(1);
});

import { config } from './config/index';
import app from './src/app';
import dayjs from 'dayjs';
import './db/connectDb';
import { Server } from 'http';

const PORT: number = config.PORT || 5440;

// ANSI color codes
const Colors = {
  CYAN: '\x1b[36m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  RED: '\x1b[31m',
  RESET: '\x1b[0m',
} as const;

const server: Server = app.listen(PORT, (): void => {
  const now: string = dayjs().format('DD-MM-YYYY HH:mm:ss A');
  console.log(
    `${Colors.YELLOW}[${now}]${Colors.RESET} ` +
    `${Colors.GREEN}Server is running${Colors.RESET} in ` +
    `${Colors.CYAN}${config.NODE_ENV}${Colors.RESET} mode at ` +
    `${Colors.CYAN}${config.APP_URL}${Colors.RESET}`
  );
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: Error | unknown, _promise: Promise<unknown>): void => {
  console.error('💥 UNHANDLED REJECTION! Shutting down...');
  
  if (reason instanceof Error) {
    console.error(`${reason.name}: ${reason.message}`);
    console.error(reason.stack);
  } else {
    console.error(reason);
  }

  server.close((): void => {
    process.exit(1);
  });
});

// Handle SIGINT (Ctrl+C)
process.on('SIGINT', (): void => {
  console.log('\n SIGINT received. Shutting down gracefully...');
  server.close((): void => {
    console.log('✅ Process terminated gracefully!');
    process.exit(0);
  });
});

// Handle SIGTERM
process.on('SIGTERM', (): void => {
  console.log(' SIGTERM received. Shutting down gracefully...');
  server.close((): void => {
    console.log('✅ Process terminated gracefully!');
    process.exit(0);
  });
});
