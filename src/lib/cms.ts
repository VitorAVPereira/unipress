import config from '@payload-config'
import { getPayload } from 'payload'

import { demoProducts, demoServices } from '@/data/demo'
import type { CatalogProduct } from '@/lib/catalog'
import type { About, Contact, Home, Media, Privacy, Product, Service, SiteSetting } from '@/payload-types'

type ContentOptions = { draft?: boolean }
type PublicImage = { url: string; alt: string; updatedAt: string }

export type PublicProduct = CatalogProduct & {
  slug: string
  description: string
  specifications: [string, string][]
  image?: PublicImage
  images: PublicImage[]
  technicalDocumentUrl?: string
  seoTitle?: string
  seoDescription?: string
  seoImage?: PublicImage
  demo?: boolean
}

export type PublicService = {
  id: string
  slug: string
  title: string
  summary: string
  description: string
  instruments: string[]
  steps: [string, string][]
  traceabilityNote: string
  image?: PublicImage
  seoTitle?: string
  seoDescription?: string
  seoImage?: PublicImage
  demo?: boolean
}

export type PublicInstitutionalContent = {
  title: string
  intro?: string
  description?: string
  content: string
  image?: PublicImage
  updatedAtLabel?: string
}

export const defaultSettings = {
  companyName: 'UniPress',
  tagline: 'Precisão que acompanha sua operação.',
  headerLogo: null,
  footerLogo: null,
  navigation: [
    { label: 'Produtos', url: '/produtos' },
    { label: 'Serviços', url: '/servicos' },
    { label: 'Sobre', url: '/sobre' },
    { label: 'Contato', url: '/contato' },
  ],
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || (process.env.NODE_ENV !== 'production' ? '5500000000000' : ''),
  phone: '',
  email: '',
  address: '',
  businessHours: 'Segunda a sexta, em horário comercial',
  defaultSeoTitle: 'UniPress | Manômetros, acessórios e calibração',
  defaultSeoDescription: 'Manômetros, acessórios e calibração de pressão rastreável à RBC com atendimento para todo o Brasil.',
} satisfies Omit<SiteSetting, 'id'>

export const defaultHome = {
  eyebrow: 'Instrumentação para todo o Brasil',
  title: 'Manômetros e acessórios com agilidade para sua operação.',
  description: 'Atendimento técnico, disponibilidade sob consulta e calibração de pressão rastreável à RBC para empresas em todo o Brasil.',
  heroImage: null,
  heroProofOne: 'Atendimento nacional',
  heroProofTwo: 'Consulta técnica',
  heroProofThree: 'Sem venda online',
  manometersImage: null,
  accessoriesImage: null,
  benefits: [
    { title: 'Resposta ágil', description: 'Atendimento direto para localizar a solução adequada sem perder tempo.' },
    { title: 'Disponibilidade sob consulta', description: 'Informações comerciais claras e acompanhamento em cada solicitação.' },
    { title: 'Rastreabilidade', description: 'Calibração de pressão rastreável à RBC para apoiar a confiança metrológica.' },
  ],
} satisfies Partial<Home>

const defaultAbout: PublicInstitutionalContent = {
  title: 'Precisão, agilidade e parceria técnica.',
  intro: 'Instrumentação de pressão para apoiar operações que não podem parar.',
  content: 'A UniPress atua no fornecimento de manômetros e acessórios para empresas de diferentes segmentos industriais. Nosso atendimento aproxima a necessidade técnica da disponibilidade comercial, com comunicação direta em cada etapa. Também realizamos calibração de pressão em laboratório, com rastreabilidade à Rede Brasileira de Calibração, recebendo instrumentos enviados de todo o país.',
}

const defaultContact: PublicInstitutionalContent = {
  title: 'Vamos entender a sua necessidade.',
  description: 'Consulte disponibilidade, especificações ou serviços de calibração.',
  content: '',
}

const defaultPrivacy: PublicInstitutionalContent = {
  title: 'Política de Privacidade',
  content: 'Esta versão inicial descreve o tratamento realizado pelo formulário de contato. O texto deve ser revisado pela UniPress antes da publicação em produção.\n\nDados coletados: o formulário pode receber nome, empresa, e-mail, telefone, assunto e mensagem. Esses dados são utilizados exclusivamente para responder à solicitação enviada.\n\nEnvio e retenção: as mensagens são encaminhadas ao e-mail comercial da UniPress pelo provedor transacional configurado. O site não mantém uma base própria de leads.\n\nProteção contra abuso: o formulário utiliza mecanismos de prevenção contra envios automatizados. Dados técnicos mínimos podem ser processados pelos provedores de infraestrutura para segurança e entrega.\n\nSeus direitos: o titular pode solicitar confirmação, correção ou exclusão dos seus dados pelos canais apresentados na página de contato.\n\nCookies e métricas: o lançamento não utiliza analytics nem cookies não essenciais.',
}

const allowDemo = process.env.NODE_ENV !== 'production' || process.env.ALLOW_DEMO_CONTENT === 'true'

function list(values?: { value: string }[] | null) {
  return values?.map((item) => item.value).filter(Boolean) || []
}

function imageFrom(value: number | Media | null | undefined) {
  return typeof value === 'object' && value?.url
    ? { url: value.url, alt: value.alt, updatedAt: value.updatedAt }
    : undefined
}

export function richTextToPlainText(value: unknown): string {
  if (!value || typeof value !== 'object') return ''
  const node = value as { text?: unknown; children?: unknown[]; root?: unknown }
  if (typeof node.text === 'string') return node.text
  if (node.root) return richTextToPlainText(node.root)
  return node.children?.map(richTextToPlainText).filter(Boolean).join(' ') || ''
}

function mapProduct(product: Product): PublicProduct {
  const manometer = product.manometerSpecs
  const accessory = product.accessorySpecs
  const category = typeof product.category === 'object' ? product.category.name : 'Produtos'
  const caseMaterials = list(manometer?.caseMaterials)
  const accessoryMaterials = list(accessory?.materials)
  const gallery = product.gallery?.find((item): item is Media => typeof item === 'object')
  const images = product.gallery?.map((item) => imageFrom(item)).filter((item): item is PublicImage => Boolean(item)) || []
  const document = typeof product.technicalDocument === 'object' ? product.technicalDocument : undefined
  const specifications: [string, string][] = []

  const addSpec = (label: string, values: string[]) => {
    if (values.length > 0) specifications.push([label, values.join(', ')])
  }
  addSpec('Faixas de pressão', manometer?.pressureRanges?.map((item) => item.label) || [])
  addSpec('Diâmetros', list(manometer?.diameters))
  addSpec('Classe de precisão', list(manometer?.accuracyClasses))
  addSpec('Conexões', list(manometer?.connections).concat(list(accessory?.connections)))
  addSpec('Material', caseMaterials.concat(accessoryMaterials))
  addSpec('Enchimento', list(manometer?.fillings))
  if (accessory?.maximumPressure) specifications.push(['Pressão máxima', accessory.maximumPressure])

  return {
    id: String(product.id),
    slug: product.slug,
    name: product.name,
    code: product.code,
    summary: product.summary,
    description: richTextToPlainText(product.description),
    family: product.family,
    category,
    applications: list(product.applications),
    diameters: list(manometer?.diameters),
    accuracyClasses: list(manometer?.accuracyClasses),
    connections: list(manometer?.connections).concat(list(accessory?.connections)),
    materials: caseMaterials.concat(accessoryMaterials),
    fillings: list(manometer?.fillings),
    connectionPositions: list(manometer?.connectionPositions),
    protectionRatings: list(manometer?.protectionRatings),
    accessoryTypes: accessory?.type ? [accessory.type] : [],
    compatibility: list(accessory?.compatibility),
    pressureRanges: manometer?.pressureRanges?.map((item) => item.label) || [],
    pressureUnits: [...new Set(manometer?.pressureRanges?.map((item) => item.unit).filter(Boolean) || [])],
    specifications,
    image: imageFrom(gallery),
    images,
    technicalDocumentUrl: document?.url || undefined,
    seoTitle: product.seo?.title || undefined,
    seoDescription: product.seo?.description || undefined,
    seoImage: imageFrom(product.seo?.image),
  }
}

function mapService(service: Service): PublicService {
  return {
    id: String(service.id),
    slug: service.slug,
    title: service.title,
    summary: service.summary,
    description: richTextToPlainText(service.description),
    instruments: service.acceptedInstruments?.map((item) => item.name) || [],
    steps: service.steps?.map((item) => [item.title, item.description]) || [],
    traceabilityNote: service.traceabilityNote || 'Calibração rastreável à Rede Brasileira de Calibração (RBC).',
    image: imageFrom(service.image),
    seoTitle: service.seo?.title || undefined,
    seoDescription: service.seo?.description || undefined,
    seoImage: imageFrom(service.seo?.image),
  }
}

async function payloadClient() {
  return getPayload({ config })
}

export async function getSiteSettings() {
  try {
    const payload = await payloadClient()
    const settings = await payload.findGlobal({ slug: 'site-settings', depth: 1 })
    return { ...defaultSettings, ...settings }
  } catch {
    return defaultSettings
  }
}

export async function getHomeContent({ draft = false }: ContentOptions = {}) {
  try {
    const payload = await payloadClient()
    const home = await payload.findGlobal({ slug: 'home', draft, depth: 1, overrideAccess: draft })
    return { ...defaultHome, ...home }
  } catch {
    return defaultHome
  }
}

export async function getAboutContent({ draft = false }: ContentOptions = {}): Promise<PublicInstitutionalContent> {
  try {
    const payload = await payloadClient()
    const about = (await payload.findGlobal({ slug: 'about', draft, depth: 1, overrideAccess: draft })) as About
    return {
      title: about.title || defaultAbout.title,
      intro: about.intro || defaultAbout.intro,
      content: richTextToPlainText(about.content) || defaultAbout.content,
      image: imageFrom(about.image),
    }
  } catch {
    return defaultAbout
  }
}

export async function getContactContent({ draft = false }: ContentOptions = {}): Promise<PublicInstitutionalContent> {
  try {
    const payload = await payloadClient()
    const contact = (await payload.findGlobal({ slug: 'contact', draft, overrideAccess: draft })) as Contact
    return {
      title: contact.title || defaultContact.title,
      description: contact.description || defaultContact.description,
      content: '',
    }
  } catch {
    return defaultContact
  }
}

export async function getPrivacyContent({ draft = false }: ContentOptions = {}): Promise<PublicInstitutionalContent> {
  try {
    const payload = await payloadClient()
    const privacy = (await payload.findGlobal({ slug: 'privacy', draft, overrideAccess: draft })) as Privacy
    return {
      title: privacy.title || defaultPrivacy.title,
      content: richTextToPlainText(privacy.content) || defaultPrivacy.content,
      updatedAtLabel: privacy.updatedAtLabel || undefined,
    }
  } catch {
    return defaultPrivacy
  }
}

export async function getProducts({ draft = false }: ContentOptions = {}): Promise<PublicProduct[]> {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'products',
      depth: 2,
      draft,
      limit: 100,
      overrideAccess: draft,
      sort: 'name',
      where: draft ? undefined : { _status: { equals: 'published' } },
    })
    if (result.docs.length > 0) return result.docs.map(mapProduct)
  } catch {
    // The public site remains useful in local preview while infrastructure is being configured.
  }
  return allowDemo ? demoProducts : []
}

function decodeSlug(slug: string) {
  try {
    return decodeURIComponent(slug)
  } catch {
    return slug
  }
}

export async function getProductBySlug(slug: string, options: ContentOptions = {}) {
  const decodedSlug = decodeSlug(slug)
  return (await getProducts(options)).find((product) => product.slug === decodedSlug)
}

export async function getServices({ draft = false }: ContentOptions = {}): Promise<PublicService[]> {
  try {
    const payload = await payloadClient()
    const result = await payload.find({
      collection: 'services',
      depth: 2,
      draft,
      limit: 50,
      overrideAccess: draft,
      sort: 'title',
      where: draft ? undefined : { _status: { equals: 'published' } },
    })
    if (result.docs.length > 0) return result.docs.map(mapService)
  } catch {
    // See getProducts: demo data is local-only unless explicitly enabled.
  }
  return allowDemo ? demoServices : []
}

export async function getServiceBySlug(slug: string, options: ContentOptions = {}) {
  const decodedSlug = decodeSlug(slug)
  return (await getServices(options)).find((service) => service.slug === decodedSlug)
}
