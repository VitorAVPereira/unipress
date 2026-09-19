import 'dotenv/config'

import config from '@payload-config'
import { getPayload } from 'payload'

import { demoProducts, demoServices } from '@/data/demo'
import { assertDemoSeedAllowed } from '@/lib/demoSeedGuard'

assertDemoSeedAllowed()

const payload = await getPayload({ config })

const richText = (text: string) => ({
  root: {
    type: 'root',
    children: [{ type: 'paragraph', version: 1, children: [{ type: 'text', version: 1, text }] }],
    direction: 'ltr' as const,
    format: '' as const,
    indent: 0,
    version: 1,
  },
})

const categories = [
  { name: 'Manômetros industriais', slug: 'manometros-industriais', family: 'manometro' as const, summary: 'Instrumentos para medição de pressão em processos industriais.', order: 1 },
  { name: 'Manômetros com glicerina', slug: 'manometros-com-glicerina', family: 'manometro' as const, summary: 'Instrumentos para sistemas com vibração e pulsação.', order: 2 },
  { name: 'Sifões', slug: 'sifoes', family: 'acessorio' as const, summary: 'Proteção térmica para instrumentos de pressão.', order: 3 },
  { name: 'Válvulas', slug: 'valvulas', family: 'acessorio' as const, summary: 'Controle e isolamento da linha de pressão.', order: 4 },
]

const categoryIds = new Map<string, number>()
for (const category of categories) {
  const existing = await payload.find({ collection: 'product-categories', where: { slug: { equals: category.slug } }, limit: 1 })
  const document = existing.docs[0] || await payload.create({ collection: 'product-categories', data: category })
  categoryIds.set(category.name, document.id)
}

for (const product of demoProducts) {
  const existing = await payload.find({ collection: 'products', where: { code: { equals: product.code } }, limit: 1, draft: true })
  if (existing.docs.length > 0) continue
  const category = categoryIds.get(product.category)
  if (!category) throw new Error(`Categoria ausente: ${product.category}`)

  await payload.create({
    collection: 'products',
    draft: false,
    context: { disableRevalidate: true },
    data: {
      name: product.name,
      slug: product.slug,
      code: product.code,
      family: product.family,
      category,
      summary: product.summary,
      description: richText(product.description),
      applications: product.applications.map((value) => ({ value })),
      manometerSpecs: product.family === 'manometro' ? {
        pressureRanges: product.pressureRanges?.map((label) => ({ label, unit: label.split(' ').at(-1) || 'bar' })),
        diameters: product.diameters.map((value) => ({ value })),
        accuracyClasses: product.accuracyClasses.map((value) => ({ value })),
        connections: product.connections.map((value) => ({ value })),
        connectionPositions: product.connectionPositions?.map((value) => ({ value })),
        caseMaterials: product.materials.map((value) => ({ value })),
        fillings: product.fillings.map((value) => ({ value })),
        protectionRatings: product.protectionRatings?.map((value) => ({ value })),
      } : undefined,
      accessorySpecs: product.family === 'acessorio' ? {
        type: product.accessoryTypes?.[0],
        connections: product.connections.map((value) => ({ value })),
        materials: product.materials.map((value) => ({ value })),
        compatibility: product.compatibility?.map((value) => ({ value })),
      } : undefined,
      _status: 'published',
    },
  })
}

for (const service of demoServices) {
  const existing = await payload.find({ collection: 'services', where: { slug: { equals: service.slug } }, limit: 1, draft: true })
  if (existing.docs.length > 0) continue
  await payload.create({
    collection: 'services',
    draft: false,
    context: { disableRevalidate: true },
    data: {
      title: service.title,
      slug: service.slug,
      summary: service.summary,
      description: richText(service.description),
      acceptedInstruments: service.instruments.map((name) => ({ name })),
      steps: service.steps.map(([title, description]) => ({ title, description })),
      traceabilityNote: service.traceabilityNote,
      _status: 'published',
    },
  })
}

await payload.updateGlobal({
  slug: 'home',
  draft: false,
  context: { disableRevalidate: true },
  data: {
    eyebrow: 'Instrumentação para todo o Brasil',
    title: 'Manômetros e acessórios com agilidade para sua operação.',
    description: 'Atendimento técnico, disponibilidade sob consulta e calibração de pressão rastreável à RBC para empresas em todo o Brasil.',
    benefits: [
      { title: 'Resposta ágil', description: 'Atendimento direto para encontrar a configuração adequada.' },
      { title: 'Disponibilidade sob consulta', description: 'Acompanhamento comercial claro em cada solicitação.' },
      { title: 'Rastreabilidade', description: 'Calibração de pressão rastreável à RBC.' },
    ],
    _status: 'published',
  },
})

payload.logger.info('Seed demonstrativo UniPress concluído.')
process.exit(0)
