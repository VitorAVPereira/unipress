import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('site UniPress', () => {
  test('apresenta a empresa e a navegação principal', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle(/UniPress/)
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Manômetros e acessórios')
    await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Ver catálogo' })).toBeVisible()
    await expect(page.locator('.hero-product-image')).toBeVisible()
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

  test('filtra o catálogo e persiste a busca na URL', async ({ page }) => {
    await page.goto('/produtos')

    expect(await page.getByTestId('product-card').count()).toBeGreaterThan(1)
    await page.getByRole('searchbox', { name: 'Buscar produtos' }).fill('inox')

    await expect(page).toHaveURL(/q=inox/)
    await expect(page.getByTestId('product-card')).toHaveCount(1)
    await expect(page.getByText('Manômetro Industrial Inox')).toBeVisible()
  })

  test('abre a ficha do produto com consulta por WhatsApp', async ({ page }) => {
    await page.goto('/produtos')
    await page.getByRole('link', { name: 'Manômetro Industrial Inox', exact: true }).click()

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Manômetro Industrial Inox')
    const href = await page.getByRole('link', { name: /Consultar no WhatsApp/ }).getAttribute('href')
    expect(href === '/contato' || href?.includes('UP-MI100-DEMO')).toBe(true)
  })

  test('oferece calibração de pressão sem alegar acreditação própria', async ({ page }) => {
    await page.goto('/servicos/calibracao-de-pressao')

    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Calibração de Pressão')
    await expect(page.getByText(/rastreável à Rede Brasileira de Calibração/)).toBeVisible()
    await expect(page.getByText(/laboratório acreditado/i)).toHaveCount(0)
  })

  test('mantém o menu móvel navegável', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    const menu = page.locator('summary[aria-label="Abrir menu"]')
    await menu.focus()
    await menu.press('Enter')
    await expect(page.getByRole('navigation', { name: 'Principal' }).last()).toBeVisible()
    await page.getByRole('navigation', { name: 'Principal' }).last().getByRole('link', { name: 'Produtos' }).click()
    await expect(page).toHaveURL('/produtos')
  })

  test('oferece entrada privada sem cadastro público', async ({ page }) => {
    await page.goto('/')
    await page.getByRole('navigation', { name: 'Principal' }).first().getByRole('link', { name: 'Área do cliente' }).click()

    await expect(page).toHaveURL('/area-do-cliente/entrar')
    await expect(page.getByRole('heading', { level: 1, name: 'Acesse seus certificados' })).toBeVisible()
    await expect(page.getByLabel('E-mail')).toBeVisible()
    await expect(page.getByLabel('Senha')).toBeVisible()
    await expect(page.getByRole('link', { name: 'Esqueci minha senha' })).toBeVisible()
  })

  test('mantém os filtros após recarregar e oferece estado 404', async ({ page }) => {
    await page.goto('/produtos?q=inox&familia=manometro')
    await expect(page.getByRole('searchbox', { name: 'Buscar produtos' })).toHaveValue('inox')
    await page.reload()
    await expect(page.getByTestId('product-card')).toHaveCount(1)

    await page.goto('/pagina-inexistente')
    await expect(page.getByRole('heading', { level: 1 })).toContainText(/não.*encontrada/i)
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
