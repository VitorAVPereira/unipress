# Portal de certificados dos padrões Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Disponibilizar em `/certificados-padroes` os certificados PDF publicados dos padrões UniPress, pesquisáveis por TAG, com histórico, certificado atual e entrega segura por um QR Code permanente.

**Architecture:** Duas coleções Payload privadas separam a identidade do padrão do histórico de PDFs. Hooks transacionais mantêm um único certificado atual publicado por TAG; uma camada server-only produz o modelo público e rotas Next.js controladas entregam arquivos de um Vercel Blob privado sem expor a URL interna.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript 5.7, Payload CMS 3.88, PostgreSQL, Vercel Blob, Vitest, Playwright, `qrcode`, `pdf-lib`, `pdfjs-dist`, `@napi-rs/canvas`, `jsqr` e `sharp`.

**Spec:** `docs/superpowers/specs/2026-10-05-certificados-padroes-design.md`

## Global Constraints

- A URL permanente é `https://www.unipress.com.br/certificados-padroes`; não criar links para ela no menu, rodapé, conteúdo editorial ou sitemap.
- A página é pública, sem login ou token, usa cabeçalho/rodapé normais e define `noindex, nofollow`.
- Nunca consultar nem expor registros da coleção `calibrations`; certificados de clientes permanecem isolados na área autenticada.
- Exibir apenas TAG, certificado atual e PDFs históricos; não mostrar cliente, modelo, série, datas ou validade.
- A busca é local, parcial e exclusivamente pela TAG normalizada, ignorando caixa, acentos, espaços, hífens e pontuação.
- Exibir todas as TAGs públicas em ordem natural `pt-BR`; não adicionar paginação para o volume previsto inferior a 50 TAGs.
- Aceitar somente PDF de até 20 MB e armazená-lo em Blob privado em produção.
- Uma TAG oculta, um rascunho e uma TAG sem PDF publicado devem ser totalmente inacessíveis por página e por rota direta.
- O administrador escolhe o certificado atual; publicar um novo atual desmarca o anterior e remover o atual promove o publicado mais recente.
- O QR Code deve codificar exatamente `https://www.unipress.com.br/certificados-padroes` e ser entregue em PNG, SVG e PDF preto sobre branco.

## Review Focus

- TAG vazia após normalização ou equivalente a outra grafia deve ser rejeitada sem criar histórico fragmentado; coberto na Task 1.
- Publicações concorrentes e hooks recursivos não podem deixar dois atuais publicados; coberto na Task 2.
- Rascunho, TAG oculta, arquivo ausente ou ID inexistente deve retornar `404` sem URL do Blob; coberto na Task 5.
- Falha temporária do Blob deve retornar `503` amigável, sem cache e sem detalhes internos; coberto na Task 5.
- Certificados repetidos no mesmo ano e TAGs com números devem receber rótulos e ordem determinísticos; coberto na Task 3.

---

### Task 1: Domínio, coleções e armazenamento privado

**Files:**
- Create: `src/lib/referenceCertificates.ts`
- Create: `src/hooks/referenceStandards.ts`
- Create: `src/hooks/referenceCertificates.ts`
- Create: `src/collections/ReferenceStandards.ts`
- Create: `src/collections/ReferenceCertificates.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/plugins/index.ts`
- Modify: `src/lib/environment.ts`
- Modify: `.env.example`
- Modify: `.gitignore`
- Modify: `src/payload-types.ts` (generated)
- Test: `tests/int/reference-certificates.int.spec.ts`
- Test: `tests/int/environment.int.spec.ts`
- Test: `tests/int/cms.int.spec.ts`

**Interfaces:**
- Produces: `MAX_REFERENCE_CERTIFICATE_FILE_SIZE = 20 * 1024 * 1024`.
- Produces: `normalizeReferenceTag(value: string): string`.
- Produces: `validateReferenceTag(value: unknown): true | string`.
- Produces: `validateReferenceCertificateYear(value: unknown): true | string`.
- Produces: `validateReferenceCertificateUpload(mimeType: unknown, size: unknown): true | string`.
- Produces: Payload collections `reference-standards` and `reference-certificates`.
- Produces: `prepareReferenceStandard: CollectionBeforeValidateHook` and `validateReferenceCertificateFile: CollectionBeforeValidateHook`.

- [ ] **Step 1: Write the failing domain and configuration tests**

Add tests named `normaliza TAGs para busca e unicidade`, `rejeita TAG vazia depois da normalização`, `aceita somente ano inteiro de quatro dígitos`, `aceita somente PDF de até 20 MB`, `registra as coleções administrativas` and `exige o token dos padrões em produção`. Assert `PI-20`, `PI 20` and `pí.20` normalize to `pi20`; the upload limit accepts exactly 20 MB and rejects 20 MB + 1 byte; both collections are admin-only; the standards Blob uses the prefix `reference-certificates`.

- [ ] **Step 2: Run the focused tests and verify they fail**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates.int.spec.ts tests/int/environment.int.spec.ts tests/int/cms.int.spec.ts`

Expected: FAIL because the domain module and Payload collections do not exist.

- [ ] **Step 3: Implement the pure validation interfaces**

In `src/lib/referenceCertificates.ts`, normalize with Unicode NFD, remove combining marks and all non-alphanumeric characters, then lowercase. Validate a nonempty normalized TAG, a year from 1900 through 9999, MIME `application/pdf`, and file size no greater than 20 MB.

- [ ] **Step 4: Define the two private admin collections**

`ReferenceStandards` has required unique/indexed `tag`, hidden/read-only unique/indexed `searchKey`, `visible` defaulting to `true`, admin group `Certificados dos padrões`, and `prepareReferenceStandard` to trim the display value and derive `searchKey`.

`ReferenceCertificates` is an upload collection with required indexed `standard`, required `year`, `isCurrent` defaulting to `false`, native drafts with autosave disabled, PDF-only uploads, `bulkUpload: false`, `pasteURL: false`, and local `staticDir: 'storage/reference-certificates'`. Its API access is `adminOnly` for every operation.

- [ ] **Step 5: Register storage, collections and production configuration**

Add a third `vercelBlobStorage` instance for `reference-certificates`, private access, random suffix, prefix `reference-certificates`, and client-upload access restricted to `users`. Add `STANDARDS_BLOB_READ_WRITE_TOKEN` to `.env.example`, the production environment gate and tests; ignore `/storage/` in Git; register both collections before `Users` in `payload.config.ts`.

- [ ] **Step 6: Generate Payload types and run the focused tests**

Run: `pnpm generate:types`

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates.int.spec.ts tests/int/environment.int.spec.ts tests/int/cms.int.spec.ts`

Expected: PASS when PostgreSQL is available; if only `cms.int.spec.ts` fails with `ECONNREFUSED`, record the known local database prerequisite and require all non-DB tests to pass.

- [ ] **Step 7: Commit the schema foundation**

```bash
git add .env.example .gitignore src/lib/referenceCertificates.ts src/hooks/referenceStandards.ts src/hooks/referenceCertificates.ts src/collections/ReferenceStandards.ts src/collections/ReferenceCertificates.ts src/payload.config.ts src/plugins/index.ts src/lib/environment.ts src/payload-types.ts tests/int/reference-certificates.int.spec.ts tests/int/environment.int.spec.ts tests/int/cms.int.spec.ts
git commit -m "feat: add reference certificate collections"
```

### Task 2: Ciclo de publicação e certificado atual

**Files:**
- Modify: `src/lib/referenceCertificates.ts`
- Modify: `src/hooks/referenceStandards.ts`
- Modify: `src/hooks/referenceCertificates.ts`
- Modify: `src/collections/ReferenceStandards.ts`
- Modify: `src/collections/ReferenceCertificates.ts`
- Modify: `src/hooks/revalidateContent.ts`
- Test: `tests/int/reference-certificates.int.spec.ts`
- Test: `tests/int/revalidation.int.spec.ts`

**Interfaces:**
- Consumes: `normalizeReferenceTag`, Payload collection slugs and generated Payload types from Task 1.
- Produces: `selectReplacementReferenceCertificate<T extends ReplacementCandidate>(docs: T[]): T | undefined`.
- Produces: `ensurePublishedReferenceCertificateHasCurrent: CollectionBeforeChangeHook`.
- Produces: `syncCurrentReferenceCertificate: CollectionAfterChangeHook`.
- Produces: `promoteReferenceCertificateAfterDelete: CollectionAfterDeleteHook`.
- Produces: `revalidateReferenceCertificates: CollectionAfterChangeHook | CollectionAfterDeleteHook` and corresponding standard hooks.

- [ ] **Step 1: Write failing lifecycle tests with a mocked Payload Local API**

Cover: a draft marked current performs no updates; the first publish without `isCurrent` throws a clear `APIError`; publishing a current certificate unmarks only other published records of the same standard; unpublishing, unchecking or deleting the current promotes the candidate with highest `year` then newest `createdAt`; no replacement is created when none exists; `context.skipReferenceCertificateLifecycle` prevents recursion.

- [ ] **Step 2: Run the lifecycle tests and verify they fail**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates.int.spec.ts tests/int/revalidation.int.spec.ts`

Expected: FAIL because the publication hooks are not implemented.

- [ ] **Step 3: Implement deterministic current selection**

Implement `selectReplacementReferenceCertificate` as a pure function sorting published candidates by `year` descending and `createdAt` descending, with ID as the final stable tie-breaker.

- [ ] **Step 4: Implement publication hooks using the request transaction**

Pass `req` to every `find`/`update`, use `overrideAccess: true`, update with `context: { ...req.context, skipReferenceCertificateLifecycle: true }`, and never react to autosave drafts. When a published current is removed from public eligibility, promote exactly one remaining published PDF for the same standard.

- [ ] **Step 5: Implement precise page revalidation**

Revalidate `/certificados-padroes` after certificate publication status, current flag, file, year, standard TAG or visibility changes and after deletions. Skip revalidation during internal recursive updates and during draft-only changes that cannot affect public output.

- [ ] **Step 6: Run the lifecycle and revalidation tests**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates.int.spec.ts tests/int/revalidation.int.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit lifecycle rules**

```bash
git add src/lib/referenceCertificates.ts src/hooks/referenceStandards.ts src/hooks/referenceCertificates.ts src/collections/ReferenceStandards.ts src/collections/ReferenceCertificates.ts src/hooks/revalidateContent.ts tests/int/reference-certificates.int.spec.ts tests/int/revalidation.int.spec.ts
git commit -m "feat: enforce reference certificate publication rules"
```

### Task 3: Modelo público, rótulos e ordenação

**Files:**
- Create: `src/lib/publicReferenceCertificates.ts`
- Test: `tests/int/public-reference-certificates.int.spec.ts`

**Interfaces:**
- Consumes: `normalizeReferenceTag` and generated `ReferenceStandard`/`ReferenceCertificate` types.
- Produces: `PublicReferenceCertificate { id, year, label, isCurrent, viewHref, downloadHref }`.
- Produces: `PublicReferenceStandard { id, tag, searchKey, current, history }`.
- Produces: `buildPublicReferenceStandards(standards, certificates): PublicReferenceStandard[]`.
- Produces: `getPublicReferenceStandards(): Promise<PublicReferenceStandard[]>`.

- [ ] **Step 1: Write failing mapping/query tests**

Assert: hidden standards disappear; visible standards without published PDFs disappear; draft certificates disappear; two certificates in 2026 receive stable `Certificado 2026 — 1/2` and `2/2`; current appears separately from history; `PAD-2` sorts before `PAD-10`; the returned model contains no `url`, `filename`, client data or Blob metadata.

- [ ] **Step 2: Run the mapping tests and verify they fail**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/public-reference-certificates.int.spec.ts`

Expected: FAIL because the public model module does not exist.

- [ ] **Step 3: Implement the pure public mapper**

Number documents inside each year by ascending `createdAt`; show the current first regardless of year; sort history by year and creation descending; sort standards with `localeCompare('pt-BR', { numeric: true, sensitivity: 'base' })`.

- [ ] **Step 4: Implement the server-only Payload query**

Fetch at most 100 visible standards and 500 published certificates with `overrideAccess: true`, depth sufficient only for the relationship, then pass results to the pure mapper. Catch infrastructure failure and return an empty list while logging only on the server.

- [ ] **Step 5: Run the mapping/query tests**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/public-reference-certificates.int.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit the public model**

```bash
git add src/lib/publicReferenceCertificates.ts tests/int/public-reference-certificates.int.spec.ts
git commit -m "feat: build public reference certificate model"
```

### Task 4: Página pública e pesquisa por TAG

**Files:**
- Create: `src/components/reference-certificates/ReferenceCertificateSearch.tsx`
- Create: `src/app/(frontend)/certificados-padroes/page.tsx`
- Modify: `src/app/(frontend)/globals.css`
- Modify: `next.config.mjs`
- Test: `tests/int/reference-certificates-ui.int.spec.tsx`
- Test: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Consumes: `PublicReferenceStandard[]` and `normalizeReferenceTag`.
- Produces: `ReferenceCertificateSearch({ standards }: { standards: PublicReferenceStandard[] })`.
- Produces: server page metadata with canonical URL and `robots: { index: false, follow: false }`.

- [ ] **Step 1: Write failing component and browser tests**

Test populated and empty renderings, partial normalized search (`pi20` finding `PI-20`), live result count, current emphasis, collapsible history, `Visualizar` and `Baixar` links, keyboard access, and the exact empty-search message. In Playwright assert the page uses the global header/footer, returns `X-Robots-Tag: noindex, nofollow`, is absent from navigation and sitemap, and has no automated WCAG A/AA violations.

- [ ] **Step 2: Run the UI tests and verify they fail**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-ui.int.spec.tsx`

Expected: FAIL because the component and page do not exist.

- [ ] **Step 3: Implement the client search component**

Use `useState` and `useMemo`; compare `normalizeReferenceTag(query)` with `standard.searchKey.includes(queryKey)`. Render every result without pagination, keep semantic headings/buttons/links, and use `<details>` for historical PDFs.

- [ ] **Step 4: Implement the server page and styles**

Fetch through `getPublicReferenceStandards`, render institutional introductory copy, the empty institutional state when needed, and reuse existing `.container`, `.page-hero`, `.button` and focus conventions. Add responsive certificate-specific classes without changing unrelated layouts.

- [ ] **Step 5: Add response-level anti-indexing**

In `next.config.mjs`, add `X-Robots-Tag: noindex, nofollow` for `/certificados-padroes` and `/certificados-padroes/:path*`. Do not modify `robots.ts` with a `Disallow`, and do not add the route to `sitemap.ts`.

- [ ] **Step 6: Run component and browser tests**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-ui.int.spec.tsx`

Run: `pnpm test:e2e -- --grep "certificados dos padrões"`

Expected: PASS with the local Next server and PostgreSQL available.

- [ ] **Step 7: Commit the public page**

```bash
git add src/components/reference-certificates/ReferenceCertificateSearch.tsx 'src/app/(frontend)/certificados-padroes/page.tsx' 'src/app/(frontend)/globals.css' next.config.mjs tests/int/reference-certificates-ui.int.spec.tsx tests/e2e/frontend.e2e.spec.ts
git commit -m "feat: add public reference certificate page"
```

### Task 5: Visualização e download controlados

**Files:**
- Create: `src/lib/referenceCertificateDelivery.ts`
- Create: `src/app/(frontend)/certificados-padroes/[id]/visualizar/route.ts`
- Create: `src/app/(frontend)/certificados-padroes/[id]/baixar/route.ts`
- Test: `tests/int/reference-certificate-delivery.int.spec.ts`

**Interfaces:**
- Produces: `referenceCertificateResponseHeaders(filename: string, disposition: 'inline' | 'attachment'): Headers`.
- Produces: `getDeliverableReferenceCertificate(id: string): Promise<DeliverableReferenceCertificate | null>`.
- Produces: `deliverReferenceCertificate(id: string, disposition: 'inline' | 'attachment'): Promise<Response>`.

- [ ] **Step 1: Write failing delivery tests**

Assert headers sanitize quotes/newlines, disable cache and set `nosniff`; valid published/visible PDF streams inline or as attachment; draft, hidden standard, missing file, wrong MIME and unknown ID return `404`; private Blob URL never appears in body/headers; a thrown Blob transport error logs server-side and returns `503` with `Retry-After` and a generic Portuguese message.

- [ ] **Step 2: Run the delivery tests and verify they fail**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificate-delivery.int.spec.ts`

Expected: FAIL because the delivery module and routes do not exist.

- [ ] **Step 3: Implement server-only authorization and lookup**

Use Payload Local API with `overrideAccess: true`, `_status = published`, related `visible = true`, `mimeType = application/pdf`, nonempty `filename`, and existing `url` or local file. Treat editorial failures as indistinguishable `404` results.

- [ ] **Step 4: Implement private Blob and local streaming**

With `STANDARDS_BLOB_READ_WRITE_TOKEN`, call `@vercel/blob.get(url, { access: 'private', token, useCache: false })`. Without the token outside production, resolve only `path.basename(filename)` beneath `storage/reference-certificates` and reject path traversal. Return `503` only for genuine storage transport failure.

- [ ] **Step 5: Add thin view/download route handlers**

Each handler awaits `context.params.id` and delegates to `deliverReferenceCertificate`; `visualizar` passes `inline`, `baixar` passes `attachment`, and both export `dynamic = 'force-dynamic'`.

- [ ] **Step 6: Run delivery tests**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificate-delivery.int.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit secure delivery**

```bash
git add src/lib/referenceCertificateDelivery.ts 'src/app/(frontend)/certificados-padroes/[id]/visualizar/route.ts' 'src/app/(frontend)/certificados-padroes/[id]/baixar/route.ts' tests/int/reference-certificate-delivery.int.spec.ts
git commit -m "feat: securely deliver reference certificate PDFs"
```

### Task 6: Migration PostgreSQL e validação integrada

**Files:**
- Create: `src/migrations/<timestamp>_certificados_padroes.ts` (generated, then reviewed)
- Create: `src/migrations/<timestamp>_certificados_padroes.json` (generated)
- Modify: `src/migrations/index.ts` (generated)
- Modify: `src/payload-types.ts` (regenerated)
- Test: `tests/int/reference-certificates-db.int.spec.ts`

**Interfaces:**
- Consumes: final collection schemas and lifecycle hooks from Tasks 1–2.
- Produces: reversible PostgreSQL tables, version tables, relationships and indexes for both collections.

- [ ] **Step 1: Write the DB integration test**

Using Payload Local API, create an administrator, one standard and three certificate records with tiny PDF fixtures. Assert normalized uniqueness, draft invisibility, current replacement, promotion after delete, hidden-standard blocking and admin-only collection reads; clean up only records created by the test.

- [ ] **Step 2: Run the DB test and verify it fails before migration**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-db.int.spec.ts`

Expected: FAIL because the database tables are absent, or `ECONNREFUSED` when the local PostgreSQL prerequisite is not running.

- [ ] **Step 3: Generate and review the migration**

Run: `pnpm payload migrate:create certificados_padroes`

Verify the generated migration creates `reference_standards`, `reference_certificates`, the certificate version tables, unique `search_key`, relationships, upload metadata and Payload preference/locked-document relationships. Verify `down` removes only this feature's objects.

- [ ] **Step 4: Regenerate types and apply migrations to the local test database**

Run: `pnpm generate:types`

Run: `pnpm migrate`

Expected: all pending migrations complete once without destructive changes to existing collections.

- [ ] **Step 5: Run the DB test twice**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-db.int.spec.ts`

Run the same command again.

Expected: PASS twice, proving cleanup and idempotent hooks.

- [ ] **Step 6: Commit migration and integration coverage**

```bash
git add src/migrations src/payload-types.ts tests/int/reference-certificates-db.int.spec.ts
git commit -m "feat: migrate reference certificate schema"
```

### Task 7: QR Code permanente em PNG, SVG e PDF

**Files:**
- Create: `src/scripts/generate-reference-certificates-qr.ts`
- Create: `docs/qr-code/certificados-padroes.png`
- Create: `docs/qr-code/certificados-padroes.svg`
- Create: `docs/qr-code/certificados-padroes.pdf`
- Modify: `package.json`
- Modify: `pnpm-lock.yaml`
- Test: `tests/int/reference-certificates-qr.int.spec.ts`

**Interfaces:**
- Produces: `REFERENCE_CERTIFICATES_URL = 'https://www.unipress.com.br/certificados-padroes'`.
- Produces: `generateReferenceCertificatesQR(outputDirectory: string): Promise<void>`.
- Produces: script `pnpm generate:standards-qr`.

- [ ] **Step 1: Add deterministic QR dependencies and failing artifact tests**

Add pinned development dependencies `qrcode`, `@types/qrcode`, `pdf-lib`, `pdfjs-dist`, `@napi-rs/canvas` and `jsqr`. Test that all three files exist, contain a single high-contrast QR with a compliant quiet zone, and decode to the exact permanent URL; render the first PDF page with `pdfjs-dist` and `@napi-rs/canvas` before decoding it with `jsqr`.

- [ ] **Step 2: Run the QR test and verify it fails**

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-qr.int.spec.ts`

Expected: FAIL because the generator and artifacts do not exist.

- [ ] **Step 3: Implement one-source deterministic generation**

Create the QR matrix once with medium error correction and four-module margin. Generate a 2400×2400 PNG through `sharp`, a vector SVG, and a one-page vector PDF through `pdf-lib`; use only black modules on white and no logo or decoration.

- [ ] **Step 4: Generate and validate all artifacts**

Run: `pnpm generate:standards-qr`

Run: `pnpm exec vitest run --config vitest.config.mts tests/int/reference-certificates-qr.int.spec.ts`

Expected: PASS and exact decoded URL in PNG, SVG and rendered PDF.

- [ ] **Step 5: Visually inspect the three outputs**

Open/render each artifact, verify square geometry, white quiet zone, crisp modules and no cropping. Do not distribute the QR until production DNS serves the final route.

- [ ] **Step 6: Commit QR deliverables**

```bash
git add package.json pnpm-lock.yaml src/scripts/generate-reference-certificates-qr.ts tests/int/reference-certificates-qr.int.spec.ts docs/qr-code
git commit -m "feat: generate permanent reference certificate QR"
```

### Task 8: Operação, regressão e entrega

**Files:**
- Modify: `README.md`
- Modify: `tests/e2e/frontend.e2e.spec.ts`
- Modify: any feature file only when a failing acceptance test exposes a defect

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: documented admin/deployment workflow and a release-ready branch.

- [ ] **Step 1: Document the administrator workflow and deployment variables**

Document: create a TAG, upload a draft PDF, select year/current, publish, hide/show a TAG, and expected promotion behavior. Add `STANDARDS_BLOB_READ_WRITE_TOKEN` to Preview/Production setup and state that a redeploy is required after adding it.

- [ ] **Step 2: Extend full browser acceptance coverage**

Cover desktop/mobile search, current/history buttons, absence from menu/sitemap, `noindex`, empty state and accessibility. Keep authenticated client certificate tests unchanged to prove isolation.

- [ ] **Step 3: Run static and integration validation**

Run: `pnpm install --frozen-lockfile`

Run: `pnpm lint`

Run: `pnpm typecheck`

Run: `pnpm test:int`

Expected: PASS. PostgreSQL-dependent suites require the configured local test database.

- [ ] **Step 4: Run end-to-end and production build validation**

Run: `pnpm test:e2e`

Run: `pnpm build`

Expected: PASS; `/certificados-padroes`, view/download routes, existing institutional pages, client login and `/admin` remain operational.

- [ ] **Step 5: Inspect the final diff and secrets**

Run: `git diff --check origin/main...HEAD`

Run: `git status --short`

Search the diff for Blob tokens, database URLs and generated local PDFs; only `.env.example` placeholders and intended QR artifacts may be committed.

- [ ] **Step 6: Commit operational documentation and final test adjustments**

```bash
git add README.md tests/e2e/frontend.e2e.spec.ts
git commit -m "docs: document reference certificate operations"
```

- [ ] **Step 7: Request whole-branch review and prepare deployment handoff**

Review against the spec, then report the exact migration command, required Vercel variable, QR artifact paths and any verification blocked only by unavailable local PostgreSQL. Do not push, deploy, alter DNS or distribute the QR without an explicit follow-up request.
