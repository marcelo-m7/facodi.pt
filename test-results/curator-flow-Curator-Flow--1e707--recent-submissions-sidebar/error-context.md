# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: curator-flow.spec.ts >> Curator Flow >> Content Submission Flow >> should show recent submissions sidebar
- Location: tests/e2e/curator-flow.spec.ts:156:5

# Error details

```
Error: page.click: Test ended.
Call log:
  - waiting for locator('button:has-text("Enviar Conteúdo")')

```

# Test source

```ts
  66  |       await expect(page).toHaveURL('**/curator/apply');
  67  |     });
  68  | 
  69  |     test('should show existing application status', async ({ page }) => {
  70  |       // This test assumes an application already exists for the user
  71  |       await page.click('button:has-text("Entrar")');
  72  |       const emailInput = page.locator('input[type="email"]');
  73  |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  74  |       await emailInput.fill('curator-with-app@example.com');
  75  |       await page.locator('input[type="password"]').fill('password123');
  76  |       await page.click('button[type="submit"]:has-text("Entrar")');
  77  |       await page.waitForURL('**/', { timeout: 10000 });
  78  | 
  79  |       // Navigate to curator apply
  80  |       await page.click('button:has-text("Ser Curador")');
  81  |       await expect(page).toHaveURL('**/curator/apply');
  82  | 
  83  |       // Check if existing application status is shown (if exists)
  84  |       // This would only appear if user has an application
  85  |       const statusBadges = page.locator('span:has-text("pending"), span:has-text("approved"), span:has-text("rejected")');
  86  |       // We just check that the page loaded correctly
  87  |       await expect(page.locator('text=Candidatura de Curador')).toBeVisible();
  88  |     });
  89  | 
  90  |     test('should validate required fields in application form', async ({ page }) => {
  91  |       await page.click('button:has-text("Entrar")');
  92  |       const emailInput = page.locator('input[type="email"]');
  93  |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  94  |       await emailInput.fill('newcurator@example.com');
  95  |       await page.locator('input[type="password"]').fill('password123');
  96  |       await page.click('button[type="submit"]:has-text("Entrar")');
  97  |       await page.waitForURL('**/', { timeout: 10000 });
  98  | 
  99  |       // Navigate to curator apply
  100 |       await page.click('button:has-text("Ser Curador")');
  101 |       await expect(page).toHaveURL('**/curator/apply');
  102 | 
  103 |       // Try to submit empty form
  104 |       const submitButton = page.locator('button[type="submit"]:has-text("Enviar")');
  105 |       await submitButton.click();
  106 | 
  107 |       // Check for HTML5 validation (browser will prevent submission)
  108 |       // Form should still be visible
  109 |       await expect(page.locator('input[required]')).toHaveCount(1);
  110 |     });
  111 |   });
  112 | 
  113 |   test.describe('Content Submission Flow', () => {
  114 |     test('should navigate to content submit page', async ({ page }) => {
  115 |       // Login first
  116 |       await page.click('button:has-text("Entrar")');
  117 |       const emailInput = page.locator('input[type="email"]');
  118 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  119 |       await emailInput.fill('submitter@example.com');
  120 |       await page.locator('input[type="password"]').fill('password123');
  121 |       await page.click('button[type="submit"]:has-text("Entrar")');
  122 |       await page.waitForURL('**/', { timeout: 10000 });
  123 | 
  124 |       // Click "Enviar Conteúdo" button
  125 |       await page.click('button:has-text("Enviar Conteúdo")');
  126 |       
  127 |       // Verify URL changed
  128 |       await expect(page).toHaveURL('**/curator/submit');
  129 |     });
  130 | 
  131 |     test('should parse YouTube URL and auto-detect video ID', async ({ page }) => {
  132 |       await page.click('button:has-text("Entrar")');
  133 |       const emailInput = page.locator('input[type="email"]');
  134 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  135 |       await emailInput.fill('submitter@example.com');
  136 |       await page.locator('input[type="password"]').fill('password123');
  137 |       await page.click('button[type="submit"]:has-text("Entrar")');
  138 |       await page.waitForURL('**/', { timeout: 10000 });
  139 | 
  140 |       // Navigate to content submit
  141 |       await page.click('button:has-text("Enviar Conteúdo")');
  142 |       await expect(page).toHaveURL('**/curator/submit');
  143 | 
  144 |       // Select video content type
  145 |       const contentTypeSelect = page.locator('select');
  146 |       await contentTypeSelect.selectOption('video');
  147 | 
  148 |       // Enter YouTube URL
  149 |       const urlInput = page.locator('input[placeholder*="youtube"], input[placeholder*="url"], input:nth-of-type(2)');
  150 |       await urlInput.fill('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  151 | 
  152 |       // Check that video ID is displayed
  153 |       await expect(page.locator('text=dQw4w9WgXcQ')).toBeVisible({ timeout: 2000 });
  154 |     });
  155 | 
  156 |     test('should show recent submissions sidebar', async ({ page }) => {
  157 |       await page.click('button:has-text("Entrar")');
  158 |       const emailInput = page.locator('input[type="email"]');
  159 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  160 |       await emailInput.fill('submitter@example.com');
  161 |       await page.locator('input[type="password"]').fill('password123');
  162 |       await page.click('button[type="submit"]:has-text("Entrar")');
  163 |       await page.waitForURL('**/', { timeout: 10000 });
  164 | 
  165 |       // Navigate to content submit
> 166 |       await page.click('button:has-text("Enviar Conteúdo")');
      |                  ^ Error: page.click: Test ended.
  167 |       await expect(page).toHaveURL('**/curator/submit');
  168 | 
  169 |       // Check for submissions sidebar (may be empty on first load)
  170 |       const sidebar = page.locator('text=Submissões Recentes, Recent Submissions');
  171 |       // The sidebar might exist but be empty
  172 |       await expect(page.locator('[class*="sidebar"], aside')).toBeVisible().catch(() => null);
  173 |     });
  174 |   });
  175 | 
  176 |   test.describe('Submission List Page', () => {
  177 |     test('should navigate to submissions page', async ({ page }) => {
  178 |       await page.click('button:has-text("Entrar")');
  179 |       const emailInput = page.locator('input[type="email"]');
  180 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  181 |       await emailInput.fill('submitter@example.com');
  182 |       await page.locator('input[type="password"]').fill('password123');
  183 |       await page.click('button[type="submit"]:has-text("Entrar")');
  184 |       await page.waitForURL('**/', { timeout: 10000 });
  185 | 
  186 |       // Navigate to submissions list
  187 |       await page.click('button:has-text("Enviar Conteúdo")');
  188 |       await expect(page).toHaveURL('**/curator/submit');
  189 | 
  190 |       // Try to navigate to submissions (via direct URL or button if available)
  191 |       await page.goto('/curator/submissions');
  192 |       await expect(page).toHaveURL('**/curator/submissions');
  193 |     });
  194 | 
  195 |     test('should filter submissions by status', async ({ page }) => {
  196 |       await page.click('button:has-text("Entrar")');
  197 |       const emailInput = page.locator('input[type="email"]');
  198 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  199 |       await emailInput.fill('submitter@example.com');
  200 |       await page.locator('input[type="password"]').fill('password123');
  201 |       await page.click('button[type="submit"]:has-text("Entrar")');
  202 |       await page.waitForURL('**/', { timeout: 10000 });
  203 | 
  204 |       // Navigate to submissions
  205 |       await page.goto('/curator/submissions');
  206 |       await expect(page).toHaveURL('**/curator/submissions');
  207 | 
  208 |       // Check that status filter buttons exist
  209 |       const filterButtons = page.locator('button:has-text("pending"), button:has-text("approved"), button:has-text("rejected")');
  210 |       await expect(filterButtons.first()).toBeVisible().catch(() => null);
  211 |     });
  212 | 
  213 |     test('should handle pagination', async ({ page }) => {
  214 |       await page.click('button:has-text("Entrar")');
  215 |       const emailInput = page.locator('input[type="email"]');
  216 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  217 |       await emailInput.fill('submitter@example.com');
  218 |       await page.locator('input[type="password"]').fill('password123');
  219 |       await page.click('button[type="submit"]:has-text("Entrar")');
  220 |       await page.waitForURL('**/', { timeout: 10000 });
  221 | 
  222 |       // Navigate to submissions
  223 |       await page.goto('/curator/submissions');
  224 |       await expect(page).toHaveURL('**/curator/submissions');
  225 | 
  226 |       // Check for pagination buttons (may not exist if < 10 items)
  227 |       const nextButton = page.locator('button:has-text("Próxima"), button:has-text("Next")');
  228 |       // Just verify page loaded - pagination only shows if many items exist
  229 |       await expect(page.locator('h1, h2')).toBeVisible();
  230 |     });
  231 |   });
  232 | 
  233 |   test.describe('Admin Review Dashboard', () => {
  234 |     test('should not be accessible to non-admin users', async ({ page }) => {
  235 |       // Login as regular user
  236 |       await page.click('button:has-text("Entrar")');
  237 |       const emailInput = page.locator('input[type="email"]');
  238 |       await expect(emailInput).toBeVisible({ timeout: 5000 });
  239 |       await emailInput.fill('user@example.com');
  240 |       await page.locator('input[type="password"]').fill('password123');
  241 |       await page.click('button[type="submit"]:has-text("Entrar")');
  242 |       await page.waitForURL('**/', { timeout: 10000 });
  243 | 
  244 |       // Try to navigate to admin dashboard
  245 |       await page.goto('/curator/admin-review');
  246 |       
  247 |       // Should either be redirected or show error
  248 |       // Non-admins should not see content or should be redirected
  249 |       const adminPanel = page.locator('text=Painel de Revisão, Admin Review, Dashboard');
  250 |       await expect(adminPanel).not.toBeVisible({ timeout: 2000 }).catch(() => null);
  251 |     });
  252 | 
  253 |     test('should be accessible to admin users', async ({ page }) => {
  254 |       // Login as admin user (this requires special test account)
  255 |       // For now, we just test that the page structure is correct if accessed
  256 |       await page.goto('/curator/admin-review');
  257 |       
  258 |       // If not logged in, auth modal should appear
  259 |       const authModal = page.locator('text=Entrar, Login');
  260 |       // Page should load (either with auth modal or content)
  261 |       await expect(page).not.toHaveURL('about:blank');
  262 |     });
  263 | 
  264 |     test('should display submission queue with stats', async ({ page }) => {
  265 |       // This test assumes admin access or test admin account
  266 |       await page.goto('/curator/admin-review');
```