import morgan from 'morgan';
import fs from 'fs';
import path from 'path';
import dayjs from 'dayjs';
import { fileURLToPath } from 'url';
import { Request } from 'express';

const __filename = fileURLToPath(import.meta.url);
const logDir = path.resolve('logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const accessLogStream = fs.createWriteStream(path.join(logDir, 'app.log'), {
  flags: 'a',
});

morgan.token('ist-date', () => {
  return dayjs().format('DD-MM-YYYY hh:mm:ss A');
});

morgan.token('user', (req: Request) => {
  return (req as any).user ? (req as any).user.id : 'Guest';
});

morgan.token('ip', (req: Request) => {
  return req.ip || req.headers['x-forwarded-for'] || (req.connection as any).remoteAddress;
});

const customMorganFormat =
  '[:ist-date] :method :url :status :response-time ms - :res[content-length] :ip :user';

const httpLogger = morgan(customMorganFormat, { stream: accessLogStream });

export default httpLogger;
