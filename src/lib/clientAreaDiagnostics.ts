type DiagnosticError = {
  name?: string
  code?: string
  digest?: string
  column?: string
  table?: string
  frames?: string[]
  cause?: DiagnosticError
}

// Do not log messages, SQL, parameters, request headers or form data: database
// errors may include credentials and customer data in those properties.
export function summarizeClientAreaError(error: unknown, depth = 0): DiagnosticError {
  if (!error || typeof error !== 'object') return { name: 'UnknownError' }
  const source = error as Record<string, unknown>
  const result: DiagnosticError = {}
  for (const key of ['name', 'code', 'digest', 'column', 'table'] as const) {
    const value = source[key]
    if (typeof value === 'string' && /^[\w.-]{1,100}$/.test(value)) result[key] = value
  }
  if (typeof source.stack === 'string') {
    result.frames = source.stack.split('\n')
      .filter((line) => /^\s+at /.test(line) && !/[?@]|:\/\//.test(line))
      .slice(0, 6)
      .map((line) => line.trim().slice(0, 300))
  }
  if (depth < 3 && source.cause && source.cause !== error) {
    result.cause = summarizeClientAreaError(source.cause, depth + 1)
  }
  return result
}

export function reportClientAreaError(stage: string, error: unknown) {
  console.error('[UniPress client-area]', JSON.stringify({ stage, error: summarizeClientAreaError(error) }))
}

export async function withClientAreaDiagnostics<T>(stage: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    reportClientAreaError(stage, error)
    throw error
  }
}
