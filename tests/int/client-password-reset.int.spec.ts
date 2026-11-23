import { describe, expect, it, vi } from 'vitest'

import { requireActiveClient, trackClientPasswordReset } from '@/hooks/clientLifecycle'

function request() {
  return {
    transactionID: 'reset-transaction',
    payload: { update: vi.fn().mockResolvedValue({}), create: vi.fn().mockResolvedValue({}) },
  }
}

describe('client password reset lifecycle', () => {
  it('activates a pending invitation before the reset login check in the same transaction', async () => {
    const req = request()
    await trackClientPasswordReset({ operation: 'resetPassword', req } as never)
    const user = await requireActiveClient({ user: { id: 42, status: 'pending' }, req } as never)

    expect(user).toMatchObject({ id: 42, status: 'active', inviteDeliveryStatus: 'accepted' })
    expect(req.payload.update).toHaveBeenCalledWith(expect.objectContaining({
      id: 42, data: { status: 'active', inviteDeliveryStatus: 'accepted' }, req,
    }))
    expect(req.payload.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ action: 'client.password-defined' }), req,
    }))
  })

  it.each(['pending', 'inactive'])('blocks ordinary login for %s clients', async (status) => {
    const req = request()
    await expect(requireActiveClient({ user: { id: 42, status }, req } as never)).rejects.toThrow()
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('never reactivates an inactive client through password recovery', async () => {
    const req = request()
    await trackClientPasswordReset({ operation: 'resetPassword', req } as never)
    await expect(requireActiveClient({ user: { id: 42, status: 'inactive' }, req } as never)).rejects.toThrow()
    expect(req.payload.update).not.toHaveBeenCalled()
    expect(req.payload.create).not.toHaveBeenCalled()
  })

  it('allows active clients to reset without rewriting account status', async () => {
    const req = request()
    await trackClientPasswordReset({ operation: 'resetPassword', req } as never)
    await expect(requireActiveClient({ user: { id: 42, status: 'active' }, req } as never)).resolves.toMatchObject({ status: 'active' })
    expect(req.payload.update).not.toHaveBeenCalled()
    expect(req.payload.create).toHaveBeenCalledOnce()
  })

  it('does not carry reset authorization into ordinary login on the same request', async () => {
    const req = request()
    await trackClientPasswordReset({ operation: 'resetPassword', req } as never)
    await trackClientPasswordReset({ operation: 'login', req } as never)
    await expect(requireActiveClient({ user: { id: 42, status: 'pending' }, req } as never)).rejects.toThrow()
    expect(req.payload.update).not.toHaveBeenCalled()
  })

  it('propagates activation failures so Payload can roll back the password transaction', async () => {
    const req = request()
    req.payload.update.mockRejectedValue(new Error('Database unavailable'))
    await trackClientPasswordReset({ operation: 'resetPassword', req } as never)
    await expect(requireActiveClient({ user: { id: 42, status: 'pending' }, req } as never)).rejects.toThrow('Database unavailable')
    expect(req.payload.create).not.toHaveBeenCalled()
  })
})
