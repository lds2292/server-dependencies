import winston from 'winston'

const { combine, timestamp, printf, colorize, errors } = winston.format

const logFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
  const stackStr = stack ? `\n${stack}` : ''
  return `[${timestamp}] ${level.toUpperCase().padEnd(5)} ${message}${metaStr}${stackStr}`
})

const logger = winston.createLogger({
  level: 'info',
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
        errors({ stack: true }),
        logFormat,
        colorize({ all: true }),
      ),
    }),
  ],
})

export default logger
