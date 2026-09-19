import type { GlobalConfig } from 'payload'

import { authenticated } from '@/access/authenticated'
import { revalidateGlobal } from '@/hooks/revalidateContent'

export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Configurações do site',
  access: { read: () => true, update: authenticated },
  hooks: { afterChange: [revalidateGlobal] },
  fields: [
    { name: 'companyName', type: 'text', label: 'Empresa', defaultValue: 'UniPress', required: true },
    { name: 'tagline', type: 'text', label: 'Assinatura', defaultValue: 'Precisão que acompanha sua operação.' },
    { name: 'headerLogo', type: 'relationship', relationTo: 'media', label: 'Logo do cabeçalho' },
    { name: 'footerLogo', type: 'relationship', relationTo: 'media', label: 'Logo do rodapé' },
    {
      name: 'navigation',
      type: 'array',
      label: 'Navegação principal',
      minRows: 1,
      maxRows: 8,
      defaultValue: [
        { label: 'Produtos', url: '/produtos' },
        { label: 'Serviços', url: '/servicos' },
        { label: 'Sobre', url: '/sobre' },
        { label: 'Contato', url: '/contato' },
      ],
      fields: [
        { name: 'label', type: 'text', label: 'Rótulo', required: true },
        { name: 'url', type: 'text', label: 'URL', required: true },
      ],
    },
    { name: 'whatsapp', type: 'text', label: 'WhatsApp' },
    { name: 'phone', type: 'text', label: 'Telefone' },
    { name: 'email', type: 'email', label: 'E-mail' },
    { name: 'address', type: 'textarea', label: 'Endereço' },
    { name: 'businessHours', type: 'text', label: 'Horário de atendimento' },
    { name: 'defaultSeoTitle', type: 'text', label: 'Título SEO padrão', defaultValue: 'UniPress | Manômetros, acessórios e calibração' },
    { name: 'defaultSeoDescription', type: 'textarea', label: 'Descrição SEO padrão', defaultValue: 'Manômetros, acessórios e calibração de pressão rastreável à RBC com atendimento para todo o Brasil.' },
  ],
}
