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
      <svg aria-hidden="true" fill="none" viewBox="0 0 32 32">
        <path d="M27 15.6a11 11 0 0 1-16.1 9.8L5 27l1.6-5.7A11 11 0 1 1 27 15.6Z" />
        <path d="M12.1 9.9c.3-.7.6-.7 1.1-.7h.5c.2 0 .5.1.6.5l1.1 2.5c.1.3.1.6-.1.9l-.8 1c-.2.2-.2.5 0 .8 1 1.8 2.4 3.2 4.2 4.1.3.2.6.1.8-.1l1-1.2c.2-.3.6-.4.9-.2l2.4 1.1c.4.2.6.3.6.6.1.3 0 1.6-.7 2.3-.6.8-1.7 1.2-2.8 1.2-1.3 0-3-.5-5.2-1.8-3.4-2-5.7-5.4-6.4-7.8-.7-2.3.2-3.2.8-3.2Z" />
      </svg>
    </a>
  )
}
