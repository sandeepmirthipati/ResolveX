const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 }
const currentLevel = LEVELS[process.env.LOG_LEVEL] ?? LEVELS.info

function write(level, scope, message, meta) {
  if (LEVELS[level] > currentLevel) return
  const entry = {
    time: new Date().toISOString(),
    level,
    scope,
    message,
    ...(meta ? { meta } : {}),
  }
  const line = JSON.stringify(entry)
  if (level === 'error') process.stderr.write(`${line}\n`)
  else process.stdout.write(`${line}\n`)
}

export const logger = {
  error: (scope, message, meta) => write('error', scope, message, meta),
  warn: (scope, message, meta) => write('warn', scope, message, meta),
  info: (scope, message, meta) => write('info', scope, message, meta),
  debug: (scope, message, meta) => write('debug', scope, message, meta),
}
