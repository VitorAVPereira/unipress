import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { Client } from 'pg'

test.describe('site UniPress', () => {
  test('apresenta a empresa e a navegação principal', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/UniPress/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Manômetros e acessórios')
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver catálogo' })).toBeVisible()
    await expect(page.locator('.hero-visual').locator('.hero-product-image, .gauge').first()).toBeVisible()
  })

  test('não exibe círculos decorativos atrás da imagem principal', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.hero-ring')).toHaveCount(0)
  })

  test('mantém os cards de destaque fora do centro do instrumento', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 })
    await page.goto('/')

    const visual = await page.locator('.hero-visual').boundingBox()
    const topCard = await page.locator('.metric-top').boundingBox()
    const bottomCard = await page.locator('.metric-bottom').boundingBox()

    expect(visual).not.toBeNull()
    expect(topCard).not.toBeNull()
    expect(bottomCard).not.toBeNull()
    expect((topCard!.y - visual!.y) / visual!.height).toBeLessThan(0.12)
    expect((visual!.y + visual!.height - (bottomCard!.y + bottomCard!.height)) / visual!.height)
      .toBeLessThan(0.1)
  })

  test('exibe a imagem da página Sobre somente com borda preta', async ({ page }) => {
    await page.goto('/sobre')

    const visual = page.locator('.about-visual')
    await expect(visual.getByText('UniPress', { exact: true })).toHaveCount(0)

    const styles = await visual.evaluate((element) => {
      const visualStyle = getComputedStyle(element)
      const decorationStyle = getComputedStyle(element, '::before')

      return {
        backgroundColor: visualStyle.backgroundColor,
        borderColor: visualStyle.borderTopColor,
        borderStyle: visualStyle.borderTopStyle,
        borderWidth: visualStyle.borderTopWidth,
        decorationBackground: decorationStyle.backgroundImage,
      }
    })

    expect(styles).toEqual({
      backgroundColor: 'rgb(255, 255, 255)',
      borderColor: 'rgb(17, 18, 20)',
      borderStyle: 'solid',
      borderWidth: '4px',
      decorationBackground: 'none',
    })
  })

  test('apresenta o catálogo em atualização sem produtos demonstrativos', async ({ page }) => {
    await page.goto('/produtos')

    await expect(page.getByRole('heading', { name: 'Catálogo em atualização.' })).toBeVisible()
    await expect(page.getByTestId('product-card')).toHaveCount(0)
    await expect(page.getByRole('searchbox', { name: 'Buscar produtos' })).toHaveCount(0)
  })

  test('mantém a faixa decorativa do catálogo fora do título em telas intermediárias', async ({ page }) => {
    await page.setViewportSize({ width: 1024, height: 768 })
    await page.goto('/produtos')

    const title = await page.getByRole('heading', {
      name: 'Encontre a configuração certa para a sua aplicação.',
    }).boundingBox()

    expect(title).not.toBeNull()
    expect(title!.x + title!.width).toBeLessThan(1024 * 0.82 - 24)
  })

  test('oferece contato direto por WhatsApp sem formulário de e-mail', async ({ page }) => {
    await page.goto('/contato')

    await expect(page.getByRole('heading', { name: 'Atendimento pelo WhatsApp' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Enviar mensagem' })).toHaveCount(0)
    await expect(page.getByRole('link', { name: 'Iniciar conversa' })).toBeVisible()
  })

  test('não cria link quebrado para calibração sem serviço publicado', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('link', { name: /Conhecer o serviço/ })).toHaveAttribute('href', '/contato')
    await page.goto('/servicos')
    await expect(page.getByRole('heading', { name: 'Catálogo de serviços em atualização.' })).toBeVisible()
  })

  test('mantém o menu móvel navegável', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menu = page.getByRole('button', { name: 'Abrir menu' })
    await menu.focus()
    await menu.press('Enter')
    const mobileNavigation = page.getByRole('navigation', { name: 'Menu móvel' })
    await expect(mobileNavigation).toBeVisible()
    await mobileNavigation.getByRole('link', { name: 'Produtos' }).click()
    await expect(page).toHaveURL('/produtos')
    await expect(page.getByRole('navigation', { name: 'Menu móvel' })).toHaveCount(0)
  })

  test('mantém os filtros do catálogo recolhidos no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/produtos')

    const filterButton = page.getByRole('button', { name: /^Abrir filtros/ })
    const search = page.getByRole('searchbox', { name: 'Buscar produtos' })
    test.skip(await search.count() === 0, 'Requer catálogo publicado ou conteúdo demonstrativo habilitado.')
    await expect(filterButton).toBeVisible()
    await expect(search).toBeVisible()
    await expect(page.getByRole('dialog', { name: 'Filtros do catálogo' })).toHaveCount(0)

    const searchBox = await search.boundingBox()
    const filterButtonBox = await filterButton.boundingBox()
    expect(searchBox).not.toBeNull()
    expect(filterButtonBox).not.toBeNull()
    expect(searchBox!.y).toBeLessThan(filterButtonBox!.y)

    await filterButton.click()
    const panel = page.getByRole('dialog', { name: 'Filtros do catálogo' })
    await expect(panel).toBeVisible()
    await expect(panel.getByText('Família')).toBeVisible()
    await expect(panel.getByText('Categoria')).toBeVisible()
  })

  test('não cria rolagem horizontal nas páginas principais no celular', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })

    for (const path of ['/', '/produtos', '/servicos', '/sobre', '/contato']) {
      await page.goto(path)
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        content: document.documentElement.scrollWidth,
      }))
      expect(dimensions.content, `Largura excedente em ${path}`).toBeLessThanOrEqual(dimensions.viewport + 1)
    }
  })

  test('oferece entrada privada sem cadastro público', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Principal' }).first().getByRole('link', { name: 'Área do cliente' }).click()

    await expect(page).toHaveURL('/area-do-cliente/entrar', { timeout: 60_000 })
    await expect(page.getByRole('heading', { level: 1, name: 'Acesse seus certificados' })).toBeVisible({ timeout: 60_000 })
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toHaveCount(0)
    await expect(page.getByText(/recuperação de acesso/i)).toBeVisible()
  })

  test('oferece estado 404 para páginas inexistentes', async ({ page }) => {
    await page.goto('/pagina-inexistente')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/não.*encontrada/i)
  })

  test('mantém a página de certificados dos padrões acessível e não indexada', async ({ page, request }) => {
    const response = await page.goto('/certificados-padroes')

    expect(response?.status()).toBe(200)
    expect(response?.headers()['x-robots-tag']).toBe('noindex, nofollow')
    await expect(page.getByRole('heading', { level: 1, name: 'Certificados dos padrões UniPress.' })).toBeVisible()
    await expect(page.locator('.site-header')).toBeVisible()
    await expect(page.locator('.site-footer')).toBeVisible()
    await expect(page.locator('nav a[href="/certificados-padroes"]')).toHaveCount(0)

    const sitemap = await request.get('/sitemap.xml')
    expect(await sitemap.text()).not.toContain('/certificados-padroes')

    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
    expect(results.violations).toEqual([])
  })

  test('consulta TAGs e acessa certificado atual e histórico no desktop e no celular', async ({ page }) => {
    test.setTimeout(120_000)

    const databaseURL = process.env.DATABASE_URL
    if (!databaseURL) throw new Error('DATABASE_URL é obrigatória para o teste E2E de certificados dos padrões.')

    const database = new Client({ connectionString: databaseURL })
    await database.connect()
    const run = Date.now().toString(36)
    const primaryTag = `E2E-${run}-20`
    const secondaryTag = `E2E-${run}-30`
    const primaryKey = `e2e${run}20`
    const secondaryKey = `e2e${run}30`

    const cleanupFixtures = async () => {
      await database.query(
        `
        DELETE FROM "reference_certificates"
        WHERE "standard_id" IN (
          SELECT "id" FROM "reference_standards" WHERE "search_key" IN ($1, $2)
        )
        `,
        [primaryKey, secondaryKey],
      )
      await database.query('DELETE FROM "reference_standards" WHERE "search_key" IN ($1, $2)', [
        primaryKey,
        secondaryKey,
      ])
    }

    await cleanupFixtures()
    try {
      await page.goto(`/certificados-padroes?estado-vazio=${run}`)
      await expect(page.getByRole('heading', { name: 'Nenhum certificado está disponível.' })).toBeVisible()

      const firstStandard = await database.query<{ id: number }>(
        `
        INSERT INTO "reference_standards" ("tag", "search_key", "visible")
        VALUES ($1, $2, true)
        RETURNING "id"
        `,
        [primaryTag, primaryKey],
      )
      const secondStandard = await database.query<{ id: number }>(
        `
        INSERT INTO "reference_standards" ("tag", "search_key", "visible")
        VALUES ($1, $2, true)
        RETURNING "id"
        `,
        [secondaryTag, secondaryKey],
      )
      const firstID = firstStandard.rows[0].id
      const secondID = secondStandard.rows[0].id

      await database.query(
        `
        INSERT INTO "reference_certificates"
          ("standard_id", "year", "is_current", "_status", "filename", "mime_type", "filesize")
        VALUES
          ($1, 2025, false, 'published', $3, 'application/pdf', 100),
          ($1, 2026, true, 'published', $4, 'application/pdf', 100),
          ($2, 2026, true, 'published', $5, 'application/pdf', 100)
        `,
        [firstID, secondID, `${run}-historico.pdf`, `${run}-atual.pdf`, `${run}-secundario.pdf`],
      )

      await page.setViewportSize({ width: 1280, height: 900 })
      await page.goto(`/certificados-padroes?dados=${run}`)
      const search = page.getByRole('searchbox', { name: 'Pesquisar por TAG' })
      await expect(search).toBeVisible()
      await search.fill(` e2e ${run} 20 `)
      await expect(page.getByRole('heading', { name: primaryTag })).toBeVisible()
      await expect(page.getByRole('heading', { name: secondaryTag })).toHaveCount(0)
      await expect(page.getByText('Certificado atual')).toBeVisible()
      await expect(page.getByRole('link', { name: 'Visualizar Certificado 2026' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Baixar Certificado 2026' })).toBeVisible()

      await page.getByText('Histórico de certificados').click()
      await expect(page.getByRole('link', { name: 'Visualizar Certificado 2025' })).toBeVisible()
      await expect(page.getByRole('link', { name: 'Baixar Certificado 2025' })).toBeVisible()

      await page.setViewportSize({ width: 390, height: 844 })
      await page.goto(`/certificados-padroes?mobile=${run}`)
      await expect(page.getByRole('searchbox', { name: 'Pesquisar por TAG' })).toBeVisible()
      await expect(page.getByRole('heading', { name: primaryTag })).toBeVisible()
      await expect(page.getByRole('heading', { name: secondaryTag })).toBeVisible()
    } finally {
      await cleanupFixtures()
      await database.end()
    }
  })

  test('não apresenta violações automáticas WCAG A/AA nas páginas principais', async ({ page }) => {
    for (const path of ['/', '/produtos', '/servicos', '/sobre', '/contato', '/privacidade', '/area-do-cliente/entrar']) {
      await page.goto(path)
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag22aa']).analyze()
      expect(results.violations, `Violações em ${path}`).toEqual([])
    }
  })

  test('abre o painel administrativo sem cadastro público', async ({ page }) => {
    test.setTimeout(90_000)
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/admin(?:\/(?:login|create-first-user))?/, { timeout: 60_000 })
    await expect(page.locator('body')).toContainText(/Criar|Create|Entrar|Login/i, { timeout: 60_000 })
  })
})
