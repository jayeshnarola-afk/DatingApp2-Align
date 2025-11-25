import Winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { env } from '../../infrastructure/env'

const transports: Array<Winston.transport> = [];

transports.push(
  new Winston.transports.Console({
    format: Winston.format.combine(
      Winston.format.cli(),
      Winston.format.splat()
    ),
  })
);

export const logger: Winston.Logger = Winston.createLogger({
  level: 'debug',
  levels: Winston.config.npm.levels,
  format: Winston.format.combine(
    Winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss',
    }),
    Winston.format.errors({ stack: true }),
    Winston.format.splat(),
    Winston.format.json()
  ),
  silent: false,
  transports,
})

export const LoggerStream = {
  write: (msg: string): void => {
    logger.info(msg.replace(/(\n)/gm, ''))
  },
}


const transport: DailyRotateFile = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD-HH',
  zippedArchive: true,
  maxSize: '20m',
  maxFiles: '14d'
});

export const loggerFile = Winston.createLogger(
  {
  transports: [
    transport
  ]
}
);





