import { deliverReferenceCertificate } from '@/lib/referenceCertificateDelivery'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: Request,
  context: RouteContext<'/certificados-padroes/[id]/baixar'>,
) {
  const { id } = await context.params
  return deliverReferenceCertificate(id, 'attachment')
}
