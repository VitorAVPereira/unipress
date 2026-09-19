import type { Access, AccessArgs } from 'payload'

type PortalUser = {
  collection?: string
  id?: number | string
  status?: string
}

function getPortalUser(user: unknown): PortalUser | null {
  return user && typeof user === 'object' ? (user as PortalUser) : null
}

export const adminOnly = ({ req }: AccessArgs): boolean => getPortalUser(req.user)?.collection === 'users'

export const clientsReadAccess: Access = ({ req }) => {
  const user = getPortalUser(req.user)
  if (user?.collection === 'users') return true
  if (user?.collection !== 'clients' || user.status !== 'active' || user.id == null) return false

  return { id: { equals: user.id } }
}

export const calibrationsReadAccess: Access = ({ req }) => {
  const user = getPortalUser(req.user)
  if (user?.collection === 'users') return true
  if (user?.collection !== 'clients' || user.status !== 'active' || user.id == null) return false

  return { client: { equals: user.id } }
}
