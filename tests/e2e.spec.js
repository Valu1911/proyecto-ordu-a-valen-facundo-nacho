import { test, expect } from '@playwright/test';

test.describe('Segunda Vuelta - E2E User Journey', () => {
  test('Flujo completo: Navegacion, Catalogo, Filtros y Detalle con IA', async ({ page }) => {
    // 1. Visitar Home
    await page.goto('http://localhost:5173');
    await expect(page).toHaveTitle(/Segunda Vuelta/i);

    // Verificar Hero y Titulo
    const heroTitle = page.locator('h1');
    await expect(heroTitle).toContainText('RENOVA TU PLACARD');

    // 2. Navegar al Catalogo
    await page.click('text=EXPLORAR CATALOGO');
    await expect(page).toHaveURL(/.*catalogo/);

    // 3. Verificar que cargan prendas en el catalogo
    const productCards = page.locator('.sv-product-card');
    await expect(productCards.first()).toBeVisible({ timeout: 10000 });

    // 4. Filtrar por estilo Streetwear
    const styleButton = page.locator('button:has-text("STREETWEAR")').first();
    if (await styleButton.isVisible()) {
      await styleButton.click();
    }

    // 5. Entrar al detalle del primer producto
    await productCards.first().click();
    await expect(page).toHaveURL(/.*producto/);

    // 6. Verificar especificaciones de la prenda
    await expect(page.locator('.sv-detail-title')).toBeVisible();
    await expect(page.locator('.sv-detail-swap-cta')).toBeVisible();

    // 7. Verificar seccion de recomendaciones de IA
    const aiSection = page.locator('.sv-detail-ai-section');
    if (await aiSection.isVisible()) {
      await expect(aiSection).toContainText(/MOTOR IA SEGUNDA VUELTA/i);
    }
  });

  test('Autenticacion y Acceso al Placard Propio', async ({ page }) => {
    await page.goto('http://localhost:5173');

    // Abrir Modal de Ingreso
    const loginBtn = page.locator('button:has-text("Ingresar")').first();
    if (await loginBtn.isVisible()) {
      await loginBtn.click();

      // Completar credenciales de Lucas Rodriguez
      await page.fill('input[type="email"]', 'lucas.rodriguez@gmail.com');
      await page.fill('input[type="password"]', 'Pass1234!');
      await page.click('button[type="submit"]:has-text("Iniciar Sesion")');

      // Verificar que el avatar o boton de perfil aparezca
      await expect(page.locator('.sv-header-avatar, .sv-user-avatar')).toBeVisible({ timeout: 6000 });
    }
  });
});
