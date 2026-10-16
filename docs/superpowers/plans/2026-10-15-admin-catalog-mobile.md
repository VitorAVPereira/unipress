# UniPress Admin, Catalog, and Mobile Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make service content and imagery editable, add safe dynamic product families and drag-and-drop product ordering, and fix the mobile menu, catalog filters, and responsive proportions.

**Architecture:** Payload remains the source of truth. A new product-family collection and services-page global feed normalized public models in `src/lib/cms.ts`; native Payload ordering supplies catalog order. Focused client components own the stateful mobile menu and filter drawer, while server pages remain responsible for content loading.

**Tech Stack:** Next.js 16.3, React 19.2, Payload CMS 3.88, PostgreSQL, TypeScript 5.7, Vitest 4, Testing Library, Playwright 1.58, CSS.

**Spec:** `docs/superpowers/specs/2026-10-15-admin-catalog-mobile-design.md`

## Global Constraints

- Preserve the content and visual presentation of the home page.
- Preserve the existing presentation of product cards and product detail pages.
- Keep the current manometer and accessory technical fields; new families use the generic profile by default.
- Block deletion of a family while any product or category references it.
- Use Payload's native drag-and-drop ordering; do not add a second numeric product-order field.
- Keep catalog filters represented in the URL.
- Use the existing RBC emblem when a service has no image.
- Do not include unrelated untracked files already present in the repository in any commit.

## Review Focus

- A renamed family must appear under its new name without rewriting every product; Task 2 tests relationship-based mapping.
- A family referenced only by a category must still be protected from deletion; Task 2 tests products and categories separately.
- Existing products without a native order key must remain visible and gain a stable order on first reorder; Task 3 tests fallback and native ordering.
- A service whose media record exists but has no usable URL must render the RBC fallback; Task 1 tests both missing media and missing URL.
- Directly loading a filtered mobile catalog URL must show the active count while keeping the filter panel initially closed; Task 5 tests URL hydration.

---

### Task 1: Editable services page and service hero image

**Files:**
- Create: `src/globals/ServicesPage.ts`
- Create: `src/components/services/ServiceHeroVisual.tsx`
- Modify: `src/payload.config.ts`
- Modify: `src/hooks/revalidateContent.ts`
- Modify: `src/lib/cms.ts`
- Modify: `src/app/(frontend)/servicos/page.tsx`
- Modify: `src/app/(frontend)/servicos/[slug]/page.tsx`
- Modify: `src/app/(frontend)/globals.css`
- Modify: `tests/int/cms.int.spec.ts`
- Create: `tests/int/services.int.spec.tsx`

**Interfaces:**
- Produces: `getServicesPageContent({ draft? }): Promise<PublicServicesPageContent>` with `eyebrow`, `title`, and `description` strings.
- Produces: `ServiceHeroVisual({ image?: { url: string; alt: string } })`, rendering an image or `.calibration-emblem` fallback.

- [ ] **Step 1: Write failing CMS and component tests**

Add assertions that `services-page` is a registered global with `eyebrow`, `title`, and `description`; `ServiceHeroVisual` renders the supplied alt text; absent image or blank URL renders `RBC`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/cms.int.spec.ts tests/int/services.int.spec.tsx`

Expected: FAIL because the global, getter, and component do not exist.

- [ ] **Step 3: Implement the CMS global and normalized fallback getter**

Create `ServicesPage` with the exact current copy as defaults, drafts/autosave, preview for `/servicos`, authenticated updates, and `revalidateGlobal`. Register it in `payload.config.ts`. In `cms.ts`, define `defaultServicesPage`, `PublicServicesPageContent`, and `getServicesPageContent` following the existing institutional-global error fallback pattern.

- [ ] **Step 4: Render editable copy and service media**

Load `getServicesPageContent()` in `/servicos`. Create `ServiceHeroVisual` with Next `Image` using `fill`, responsive `sizes`, and the media alt; replace the hard-coded emblem in the service detail hero while preserving it as fallback. Add `.service-hero-image` styles for contained responsive media.

- [ ] **Step 5: Extend cache revalidation**

Add `'services-page': ['/servicos']` to global paths. Keep existing service hooks, which already invalidate each changed service detail path.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `pnpm vitest run --config vitest.config.mts tests/int/cms.int.spec.ts tests/int/services.int.spec.tsx`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/globals/ServicesPage.ts src/components/services/ServiceHeroVisual.tsx src/payload.config.ts src/hooks/revalidateContent.ts src/lib/cms.ts "src/app/(frontend)/servicos/page.tsx" "src/app/(frontend)/servicos/[slug]/page.tsx" "src/app/(frontend)/globals.css" tests/int/cms.int.spec.ts tests/int/services.int.spec.tsx
git commit -m "feat: make service page content and image editable"
```

### Task 2: Dynamic product families with protected deletion

**Files:**
- Create: `src/collections/ProductFamilies.ts`
- Create: `src/hooks/preventDeletingProductFamily.ts`
- Create: `src/components/admin/ProductFamilyField.tsx`
- Modify: `src/collections/Products.ts`
- Modify: `src/collections/ProductCategories.ts`
- Modify: `src/payload.config.ts`
- Modify: `src/app/(payload)/admin/importMap.js`
- Modify: `tests/int/cms.int.spec.ts`
- Create: `tests/int/product-families.int.spec.ts`

**Interfaces:**
- Produces: collection slug `product-families` with `name`, `slug`, and `technicalProfile: 'manometro' | 'acessorio' | 'generico'`.
- Produces: `preventDeletingProductFamily: CollectionBeforeDeleteHook` that counts references in `products` and `product-categories` and throws `APIError` when either count is nonzero.
- Produces: product/category `family` as required relationships to `product-families`.
- Produces: hidden product `familyProfile` synchronized by `ProductFamilyField` and server hook so the existing specialized field conditions remain responsive and authoritative.

- [ ] **Step 1: Write failing schema and deletion-guard tests**

Assert the new collection is registered; product and category family fields are required relationships; profiles contain exactly the three specified values; the deletion hook rejects product-only and category-only references and allows an unused family.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/cms.int.spec.ts tests/int/product-families.int.spec.ts`

Expected: FAIL because the collection and hook do not exist and family fields are fixed selects.

- [ ] **Step 3: Implement the family collection and guard**

Create the collection with authenticated writes, public reads, unique indexed slug, default `generico` profile, and the before-delete hook. Use `payload.count` with `where: { family: { equals: id } }` for both referencing collections and return an actionable Portuguese error.

- [ ] **Step 4: Convert relationships while preserving specialized editors**

Change both family selects to required relationships. Add a hidden `familyProfile` product field and a small admin relationship field component that mirrors the chosen family's profile into form state; enforce the same value in a server `beforeValidate` hook. Keep `manometerSpecs` and `accessorySpecs` conditions tied to `familyProfile`.

- [ ] **Step 5: Register admin imports and collection**

Register `ProductFamilies` before categories/products and regenerate the admin import map with `pnpm generate:importmap`.

- [ ] **Step 6: Run tests and verify GREEN**

Run: `pnpm vitest run --config vitest.config.mts tests/int/cms.int.spec.ts tests/int/product-families.int.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add src/collections/ProductFamilies.ts src/hooks/preventDeletingProductFamily.ts src/components/admin/ProductFamilyField.tsx src/collections/Products.ts src/collections/ProductCategories.ts src/payload.config.ts "src/app/(payload)/admin/importMap.js" tests/int/cms.int.spec.ts tests/int/product-families.int.spec.ts
git commit -m "feat: manage product families in Payload"
```

### Task 3: Product ordering and public catalog family mapping

**Files:**
- Modify: `src/collections/Products.ts`
- Modify: `src/lib/catalog.ts`
- Modify: `src/lib/cms.ts`
- Modify: `src/components/products/ProductCard.tsx`
- Modify: `src/components/products/CatalogClient.tsx`
- Modify: `tests/int/catalog.int.spec.ts`
- Create: `tests/int/catalog-cms.int.spec.ts`

**Interfaces:**
- Produces: `CatalogProduct.family` as `{ slug: string; name: string; technicalProfile: CatalogTechnicalProfile }`.
- Produces: `getProducts()` ordered by Payload's `_order` key and mapped to public family objects.
- Consumes: `product-families` relationship and `familyProfile` from Task 2.

- [ ] **Step 1: Write failing mapping and order-preservation tests**

Test that filtering compares `product.family.slug`, family options display `family.name`, renamed family objects map without product rewrites, and `filterProducts` preserves input order. Add a CMS configuration assertion that products are `orderable: true`.

- [ ] **Step 2: Run focused tests and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/catalog.int.spec.ts tests/int/catalog-cms.int.spec.ts`

Expected: FAIL because family is a fixed string and the collection is not orderable.

- [ ] **Step 3: Enable native order and map family objects**

Set `orderable: true` on `Products`. Update public catalog types and `mapProduct` to normalize populated families; use a neutral `{ slug: 'produtos', name: 'Produtos', technicalProfile: 'generico' }` fallback for missing relationships. Query with `sort: '_order'` and retain deterministic name fallback for legacy rows without a key.

- [ ] **Step 4: Update existing UI consumers without changing presentation**

Use the family name in `ProductCard`; make the family facet value the slug and label it from the mapped family object. Do not change card markup or styling beyond these values.

- [ ] **Step 5: Run tests and verify GREEN**

Run: `pnpm vitest run --config vitest.config.mts tests/int/catalog.int.spec.ts tests/int/catalog-cms.int.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/collections/Products.ts src/lib/catalog.ts src/lib/cms.ts src/components/products/ProductCard.tsx src/components/products/CatalogClient.tsx tests/int/catalog.int.spec.ts tests/int/catalog-cms.int.spec.ts
git commit -m "feat: order products and map dynamic families"
```

### Task 4: Database migration and generated Payload artifacts

**Files:**
- Create: `src/migrations/<timestamp>_services_families_product_order.ts`
- Create: `src/migrations/<timestamp>_services_families_product_order.json`
- Modify: `src/migrations/index.ts`
- Modify: `src/payload-types.ts`
- Modify: `src/app/(payload)/admin/importMap.js`
- Create: `tests/int/migration-shape.int.spec.ts`

**Interfaces:**
- Consumes: final Payload schema from Tasks 1–3.
- Produces: initial family rows for `manometro` and `acessorio`, migrated product/category relationships, services-page storage, family-profile storage, and order keys.

- [ ] **Step 1: Write a failing migration-shape test**

Assert the migration index includes one new migration whose SQL creates the new family/global structures, inserts both legacy families, maps both legacy scalar values before dropping them, and has a down migration that restores the two legacy values.

- [ ] **Step 2: Run the focused test and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/migration-shape.int.spec.ts`

Expected: FAIL because the migration is absent.

- [ ] **Step 3: Generate and harden the migration**

Run `pnpm payload migrate:create services_families_product_order`, inspect generated SQL, then add explicit data migration statements in safe order: create structures, seed/find initial families, backfill relationship/profile/order values, add required constraints, and only then drop legacy scalar columns. Make the down path restore `manometro`/`acessorio`; reject down migration if a generic family cannot be represented without data loss.

- [ ] **Step 4: Regenerate types and import map**

Run: `pnpm generate:types` and `pnpm generate:importmap`.

- [ ] **Step 5: Run migration and type tests**

Run: `pnpm vitest run --config vitest.config.mts tests/int/migration-shape.int.spec.ts tests/int/cms.int.spec.ts tests/int/product-families.int.spec.ts tests/int/catalog-cms.int.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/migrations src/payload-types.ts "src/app/(payload)/admin/importMap.js" tests/int/migration-shape.int.spec.ts
git commit -m "feat: migrate services families and product order"
```

### Task 5: Controlled accessible mobile menu

**Files:**
- Create: `src/components/site/MobileMenu.tsx`
- Modify: `src/components/site/SiteHeader.tsx`
- Modify: `src/app/(frontend)/globals.css`
- Create: `tests/int/mobile-menu.int.spec.tsx`
- Modify: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Produces: `MobileMenu({ links, whatsappURL })`, with `aria-expanded`, Escape handling, and close-on-link-click behavior.
- Consumes: normalized navigation tuples and WhatsApp URL from `SiteHeader`.

- [ ] **Step 1: Write failing interaction tests**

Test initial closed state, click-to-open, Escape-to-close, internal link close, and WhatsApp link close. Extend the existing Playwright mobile-menu case to assert the panel is no longer visible after navigation.

- [ ] **Step 2: Run component test and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/mobile-menu.int.spec.tsx`

Expected: FAIL because `MobileMenu` does not exist.

- [ ] **Step 3: Implement the client component**

Use a button rather than uncontrolled `details`, local boolean state, `aria-controls`, `aria-expanded`, `aria-label` switching between “Abrir menu” and “Fechar menu”, and a document key handler for Escape. Keep `SiteHeader` a server component by delegating only the interactive menu.

- [ ] **Step 4: Update styles and verify GREEN**

Replace summary selectors with button/panel selectors while preserving dimensions and visual identity.

Run: `pnpm vitest run --config vitest.config.mts tests/int/mobile-menu.int.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/site/MobileMenu.tsx src/components/site/SiteHeader.tsx "src/app/(frontend)/globals.css" tests/int/mobile-menu.int.spec.tsx tests/e2e/frontend.e2e.spec.ts
git commit -m "fix: close mobile menu after navigation"
```

### Task 6: Mobile catalog filter drawer and proportional layouts

**Files:**
- Create: `src/components/products/MobileFilterPanel.tsx`
- Modify: `src/components/products/CatalogClient.tsx`
- Modify: `src/app/(frontend)/globals.css`
- Create: `tests/int/mobile-filters.int.spec.tsx`
- Modify: `tests/e2e/frontend.e2e.spec.ts`

**Interfaces:**
- Produces: `MobileFilterPanel({ activeCount, children, onApply, onClear })` with closed initial state and accessible dialog/panel semantics.
- Consumes: catalog filters and `update(next: CatalogFilters)` from `CatalogClient`.

- [ ] **Step 1: Write failing mobile filter tests**

Test closed initial state, open button text, active count from a prefiltered URL, explicit close, apply close, and clear. Add Playwright assertions at 390×844 that products/search appear before any expanded filter list and all facets remain reachable after opening.

- [ ] **Step 2: Run component tests and verify RED**

Run: `pnpm vitest run --config vitest.config.mts tests/int/mobile-filters.int.spec.tsx`

Expected: FAIL because the mobile panel does not exist and filters render expanded.

- [ ] **Step 3: Implement the panel without changing desktop behavior**

Extract the shared filter fieldsets once and render them inside the mobile panel below 800 px and the existing sticky aside above 800 px. Count selected facet values, excluding search text. “Aplicar filtros” closes the panel without changing URL semantics; “Limpar filtros” calls `update({})` and closes it.

- [ ] **Step 4: Apply targeted responsive corrections**

At 800 px and 560 px, remove the always-visible filter grid; constrain hero headings with `clamp`, eliminate transforms that overflow the viewport, reduce section/card padding, make service imagery and detail visuals use aspect ratios, and keep all interactive controls at least 44 px high. Do not change desktop selectors unless needed to share base styles.

- [ ] **Step 5: Run component tests and verify GREEN**

Run: `pnpm vitest run --config vitest.config.mts tests/int/mobile-filters.int.spec.tsx tests/int/catalog.int.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add src/components/products/MobileFilterPanel.tsx src/components/products/CatalogClient.tsx "src/app/(frontend)/globals.css" tests/int/mobile-filters.int.spec.tsx tests/e2e/frontend.e2e.spec.ts
git commit -m "fix: improve mobile catalog filters and layout"
```

### Task 7: Full verification and release readiness

**Files:**
- Modify if required by failures: only files already listed in Tasks 1–6

**Interfaces:**
- Consumes: all completed tasks.
- Produces: verified application and documented migration requirement.

- [ ] **Step 1: Run the full integration suite**

Run: `pnpm test:int`

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Run static checks**

Run: `pnpm lint` and `pnpm typecheck`.

Expected: both exit 0 with no new warnings or errors.

- [ ] **Step 3: Run browser tests**

Run: `pnpm test:e2e`.

Expected: all tests PASS, including service fallback, menu closing, filter drawer, and WCAG A/AA checks.

- [ ] **Step 4: Run the production build**

Run: `pnpm build`.

Expected: exit 0.

- [ ] **Step 5: Inspect responsive screenshots**

Capture `/`, `/produtos`, `/servicos`, and one populated `/servicos/[slug]` at 390×844, 768×1024, and 1440×900. Confirm no horizontal overflow, clipped content, oversized empty areas, or permanently expanded mobile filters.

- [ ] **Step 6: Verify the final diff and commit any test-driven corrections**

Run: `git diff --check` and `git status --short`.

Expected: no whitespace errors; unrelated pre-existing untracked files remain unstaged.

```bash
git add <only files corrected during verification>
git commit -m "test: verify admin catalog and mobile improvements"
```
