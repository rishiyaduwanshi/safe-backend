import { createLogger, format, transports } from "winston";
import dayjs from "dayjs";

const reportLogger = createLogger({
  level: "info",
  format: format.combine(
    format.timestamp({
      format: () => dayjs().format("DD-MM-YYYY HH:mm:ss"),
    }),
    format.printf(({ timestamp, level, message }) => {
      return `[REPORT-SERVICE] ${timestamp} [${level.toUpperCase()}] ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "logs/report.log" }),
  ],
});

export default reportLogger;
