import { afterEach, describe, expect, it, vi } from 'vitest'

import { summarizeClientAreaError, withClientAreaDiagnostics } from '@/lib/clientAreaDiagnostics'
import { onRequestError } from '@/instrumentation'

describe('client area diagnostics', () => {
  afterEach(() => vi.restoreAllMocks())

  it('preserves database error codes without logging SQL, parameters or credentials', () => {
    const cause = Object.assign(new Error('password=secret'), { code: '42703', column: 'prefix', table: 'calibrations' })
    const error = Object.assign(new Error('Failed query: select private data', { cause }), {
      params: ['customer@example.com'], digest: '2889923209',
      stack: 'Error: token=secret\n    at query (/app/db.js:10:2)\n    at https://host/reset?token=secret',
    })
    const summary = summarizeClientAreaError(error)
    expect(summary).toMatchObject({ digest: '2889923209', cause: { code: '42703', column: 'prefix' } })
    expect(summary.frames).toEqual(['at query (/app/db.js:10:2)'])
    expect(JSON.stringify(summary)).not.toMatch(/secret|customer@|select private/)
  })

  it('logs the failing stage and preserves the original exception', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    const error = new Error('private data')
    await expect(withClientAreaDiagnostics('calibrations.list', async () => { throw error })).rejects.toBe(error)
    expect(log).toHaveBeenCalledWith('[UniPress client-area]', expect.stringContaining('calibrations.list'))
  })

  it('does not log successful calls', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await expect(withClientAreaDiagnostics('calibrations.total', async () => ({ totalDocs: 0 }))).resolves.toEqual({ totalDocs: 0 })
    expect(log).not.toHaveBeenCalled()
  })

  it('captures render errors without logging reset tokens or cookies', async () => {
    const log = vi.spyOn(console, 'error').mockImplementation(() => {})
    await onRequestError(new Error('failure'), {
      path: '/area-do-cliente/redefinir-senha?token=secret', method: 'GET', headers: { cookie: 'private-cookie' },
    }, { routerKind: 'App Router', routePath: '/area-do-cliente/redefinir-senha', routeType: 'render', revalidateReason: undefined })
    expect(log).toHaveBeenCalledOnce()
    expect(JSON.stringify(log.mock.calls)).not.toMatch(/secret|private-cookie/)
  })
})
