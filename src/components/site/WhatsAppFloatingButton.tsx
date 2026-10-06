import Image from 'next/image'

import { buildWhatsAppOrContactURL } from '@/lib/whatsapp'

export function WhatsAppFloatingButton({ whatsapp }: { whatsapp: string }) {
  const href = buildWhatsAppOrContactURL(whatsapp)
  const opensWhatsApp = href.startsWith('https://')

  return (
    <a
      aria-label="Falar com a UniPress pelo WhatsApp"
      className="whatsapp-floating-button"
      href={href}
      rel={opensWhatsApp ? 'noreferrer' : undefined}
      target={opensWhatsApp ? '_blank' : undefined}
      title="Falar com a UniPress pelo WhatsApp"
    >
      <Image
        alt=""
        aria-hidden="true"
        draggable={false}
        height={80}
        src="/media/whatsapp.png"
        unoptimized
        width={80}
      />
    </a>
  )
}
