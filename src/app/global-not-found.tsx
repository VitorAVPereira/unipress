import type { Metadata } from 'next'
import Link from 'next/link'

import './(frontend)/globals.css'

export const metadata: Metadata = {
  title: 'Página não encontrada | UniPress',
  description: 'O endereço solicitado não foi encontrado.',
}

export default function GlobalNotFound() {
  return (
    <html lang="pt-BR">
      <body>
        <main>
          <section className="not-found container">
            <span>404</span>
            <h1>Esta página não foi encontrada.</h1>
            <p>O endereço pode ter mudado ou o conteúdo ainda não foi publicado.</p>
            <Link className="button button-primary" href="/">Voltar ao início</Link>
          </section>
        </main>
      </body>
    </html>
  )
}
