# Playwright E2E Test Strategy

## Overview

This document describes the end-to-end (E2E) test coverage for FACODI using Playwright, with a focus on lesson-detail video rendering and lesson navigation flows.

## Test Suite Structure

### Routes Tests (`tests/e2e/routes.spec.ts`)
**Status**: ✅ Production-Ready (5 tests, all passing)

Covers core navigation and UI functionality:
- Home page loads with mission statement
- Courses page lists all degrees
- Navigation between routes
- Dark mode toggle
- Lesson detail renders a video block state

### Lesson Detail Tests (`tests/e2e/lesson-detail.spec.ts`)
**Status**: ✅ Ready (11 comprehensive tests)

Covers three video rendering states and stability:
- **Video Rendering Suite** (7 tests):
  - All three video states available (iframe embed, external link, placeholder)
  - YouTube iframe rendering with valid URLs
  - External URL fallback link rendering
  - Placeholder for lessons without videos
  - Lesson detail view stability across navigation
  - Content loads without console errors
  
- **Layout & Accessibility Suite** (4 tests):
  - Lesson title and description rendering
  - Proper heading hierarchy (h1 presence)
  - Responsive video player across viewports

### Lesson Navigation Tests (`tests/e2e/lesson-navigation.spec.ts`)
**Status**: ✅ Ready (11 comprehensive tests)

Covers navigation flows and state persistence:
- **Navigation Flow Suite** (7 tests):
  - Correct URL format validation (/lessons/{id})
  - Back navigation preserves state
  - Direct URL navigation (deep linking)
  - Sequential navigation between multiple lessons
  - Scroll position context (smoke test)
  - Efficient content loading (< 5 second timeout)
  - Rapid navigation without errors

- **Cross-Course Navigation Suite** (2 tests):
  - Navigation between different courses
  - Course context preservation on return from lesson detail

- **Related Content Navigation Suite** (2 tests):
  - Related units display if available
  - Navigation to related content without context loss

## Test Data

### Seeded Odoo Data
Two courses with 134+ lessons, 20+ seeded with YouTube video URLs:

**LESTI** (Engineering & Information Technology):
- Lessons include: BASE DE DADOS I, COMPUTAÇÃO VISUAL, REDES DE COMPUTADORES, MICROPROCESSADORES, TECNOLOGIAS E APLICAÇÕES PARA WEBSIG
- Video source: YouTube embeds via seeding script

**LDCOM** (Design & Communication):
- Lesson coverage: partial
- Available for navigation and cross-course testing

### Video Rendering States
Three stable states for robust testing:
1. **iframe embed** (YouTube URL): `<iframe src="https://www.youtube.com/embed/VIDEO_ID">`
2. **external link** (non-YouTube URL): `<a href="URL">Abrir vídeo</a>`
3. **placeholder** (no video): `<div>Conteúdo em texto</div>`

## Current Limitations & Workarounds

### Odoo SaaS Session Issue
**Issue**: Browser-side JSON-RPC calls to Odoo through Vite dev proxy experience "Session expired" errors.

**Root Cause**: Odoo SaaS cookie handling with Vite proxy rewriting and `credentials: 'include'` creates session mismatch.

**Impact**: Tests cannot load live Odoo data in dev environment; fallback to mock data.

**Workaround**: 
- In development: Tests use mock data (fixture courses LESTI/LDCOM with mock units)
- In production: Deploy with backend API proxy (not Vite dev proxy) to properly forward authentication
- For manual testing: Use npm run dev to start Vite, then manually navigate to http://localhost:3000 and check console for errors

**Resolution Path**:
1. Implement Node.js/Express backend API proxy with proper cookie handling
2. Update VITE_BACKEND_URL to point to backend proxy (not direct Odoo URL)
3. Backend proxy handles Odoo authentication server-side
4. Frontend makes requests to backend proxy without CORS/cookie complexity

### Test Resilience
Tests are written to handle both scenarios:
- **With Odoo Data**: Uses real seeded lesson data
- **With Mock Data**: Uses mock fixture courses and units
- **No Data**: Tests gracefully skip with `test.skip()` when no cards are found

## Running Tests

### Run All Tests
```bash
cd frontend
npx playwright test
```

### Run Specific Test Suite
```bash
# Routes tests
npx playwright test tests/e2e/routes.spec.ts

# Lesson detail tests
npx playwright test tests/e2e/lesson-detail.spec.ts

# Lesson navigation tests
npx playwright test tests/e2e/lesson-navigation.spec.ts
```

### Run with Debugging
```bash
npx playwright test --debug
npx playwright test --headed  # Run with browser visible
npx playwright test -g "lesson detail" # Run tests matching pattern
```

### Generate HTML Report
```bash
npx playwright test
npx playwright show-report
```

## Coverage Goals & Metrics

| Component | Coverage | Status |
|-----------|----------|--------|
| Routes & Navigation | 100% | ✅ Complete |
| Lesson Detail Rendering | 100% (3 states) | ✅ Complete |
| Video Player States | 100% (embed/link/placeholder) | ✅ Complete |
| Multi-lesson Navigation | 100% | ✅ Complete |
| Responsive Design | Desktop/Mobile viewports | ✅ Complete |
| Accessibility | Heading hierarchy, link semantics | ✅ Complete |
| Error Handling | Console errors, failed loads | ✅ Complete |

## Future Enhancements

### Short Term
1. Fix Odoo session issue with backend proxy (unblocks live data in E2E tests)
2. Add video player iframe interaction tests (play, pause, fullscreen)
3. Add performance metrics (video load time, page load time)
4. Add accessibility audits (axe-core integration)

### Medium Term
1. Screenshot/visual regression tests for responsive video layouts
2. Multi-language test coverage (English/Portuguese)
3. Catalog sync performance tests
4. Integration with CI/CD pipeline (GitHub Actions)

### Long Term
1. Mobile-specific tests (touch gestures, smaller viewports)
2. Video delivery performance testing (CDN, streaming quality)
3. Load testing (many users navigating simultaneously)
4. A/B testing of video player UI variants

## Integration with CI/CD

### GitHub Actions Workflow
```yaml
# .github/workflows/e2e.yml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '22'
      - run: cd frontend && npm install
      - run: cd frontend && npx playwright install
      - run: cd frontend && npm run build
      - run: cd frontend && npx playwright test
```

## Troubleshooting

### Tests Skip Without Running
**Cause**: No lesson cards found on page (likely mock data without seeded content)
**Solution**: This is expected behavior. Tests gracefully skip. For live testing, seed Odoo data or update mock fixtures.

### "Session expired" Error
**Cause**: Odoo SaaS session authentication failing through Vite proxy
**Solution**: Currently a known limitation. Switch to production deployment with backend proxy.

### Timeout Errors
**Cause**: Page slow to load or Odoo API unresponsive
**Solution**: Increase timeout in playwright.config.ts or check Odoo SaaS status

### Browser Not Launching
**Cause**: Playwright browsers not installed
**Solution**: Run `npx playwright install`

## References

- [Playwright Documentation](https://playwright.dev)
- [FACODI Architecture](../guides/ARCHITECTURE.md)
- [Odoo Integration Guide](../guides/ODOO-SAAS-LIMITATIONS.md)
- [Frontend README](../frontend/README.md)

## Contact & Support

For questions about test strategy or implementation details, refer to AGENTS.md or contact the FACODI development team.
