import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NotFound() {
  return <section className="not-found container"><span>404</span><h1>Esta página saiu da faixa.</h1><p>O endereço pode ter mudado ou o conteúdo ainda não foi publicado.</p><Link className="button button-primary" href="/"><ArrowLeft size={18} /> Voltar ao início</Link></section>
}
