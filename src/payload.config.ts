import { postgresAdapter } from '@payloadcms/db-postgres'
import { resendAdapter } from '@payloadcms/email-resend'
import sharp from 'sharp'
import path from 'path'
import { buildConfig, PayloadRequest } from 'payload'
import { fileURLToPath } from 'url'

import { Documents } from './collections/Documents'
import { AuditEvents } from './collections/AuditEvents'
import { Calibrations } from './collections/Calibrations'
import { Clients } from './collections/Clients'
import { Media } from './collections/Media'
import { ProductCategories } from './collections/ProductCategories'
import { Products } from './collections/Products'
import { Services } from './collections/Services'
import { Users } from './collections/Users'
import { About } from './globals/About'
import { Contact } from './globals/Contact'
import { Home } from './globals/Home'
import { Privacy } from './globals/Privacy'
import { SiteSettings } from './globals/SiteSettings'
import { plugins } from './plugins'
import { defaultLexical } from '@/fields/defaultLexical'
import { assertProductionEnvironment } from '@/lib/environment'
import { getServerSideURL } from './utilities/getURL'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

assertProductionEnvironment()

export default buildConfig({
  admin: {
    components: {
      beforeLogin: ['@/components/BeforeLogin'],
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
    user: Users.slug,
    livePreview: {
      breakpoints: [
        {
          label: 'Mobile',
          name: 'mobile',
          width: 375,
          height: 667,
        },
        {
          label: 'Tablet',
          name: 'tablet',
          width: 768,
          height: 1024,
        },
        {
          label: 'Desktop',
          name: 'desktop',
          width: 1440,
          height: 900,
        },
      ],
    },
  },
  // This config helps us configure global or default features that the other editors can inherit
  editor: defaultLexical,
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  email: process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL
    ? resendAdapter({
        apiKey: process.env.RESEND_API_KEY,
        defaultFromAddress: process.env.RESEND_FROM_EMAIL,
        defaultFromName: 'UniPress',
      })
    : undefined,
  collections: [Products, ProductCategories, Services, Media, Documents, Clients, Calibrations, AuditEvents, Users],
  cors: [getServerSideURL()].filter(Boolean),
  globals: [SiteSettings, Home, About, Contact, Privacy],
  plugins,
  secret: process.env.PAYLOAD_SECRET,
  sharp,
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  jobs: {
    access: {
      run: ({ req }: { req: PayloadRequest }): boolean => {
        // Allow logged in users to execute this endpoint (default)
        if (req.user) return true

        const secret = process.env.CRON_SECRET
        if (!secret) return false

        // If there is no logged in user, then check
        // for the Vercel Cron secret to be present as an
        // Authorization header:
        const authHeader = req.headers.get('authorization')
        return authHeader === `Bearer ${secret}`
      },
    },
    tasks: [],
  },
})
