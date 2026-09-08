# Portfolio dashboard design QA

Date: 2026-09-08
Branch: codex/ana-inspired-portfolio
Source: https://ana.sh/
Implementation: http://127.0.0.1:5191/
Scope: source layout and interaction language, adapted to Jan Faris's portfolio.

## Evidence

- Source desktop truth: docs/ana-reference/captures/source-desktop.jpg
- Implementation desktop: docs/ana-reference/captures/implementation-desktop.jpg
- Source mobile truth: docs/ana-reference/captures/source-mobile.jpg
- Implementation mobile: docs/ana-reference/captures/implementation-mobile.jpg
- Spanish mobile: docs/ana-reference/captures/implementation-mobile-es.jpg
- Desktop viewport and image: 1440 × 1000, 1×, dark theme, home.
- Mobile viewport and image: 390 × 844, 1×, dark theme, home.
- Source and implementation were emitted together in matching browser comparison calls; no density resizing was required.
- Focused live comparisons covered sidebar biography, widget surfaces, map/marker, folder, expanded mobile navigation, project gallery/lightbox, and guide inputs. These were large enough to inspect directly at native density.
- Light theme was inspected through the actual controls. Gallery keyboard navigation, Escape, focus restore, and mobile menu states were exercised.

## Findings and fixes

First pass: blocked for the following P2 issues.

1. Dark map labels were too dim compared with the reference. Lifted the real map's blue-gray contrast without changing geography; removed duplicate baked-in attribution because the widget provides its own visible copyright link. Final desktop capture shows the corrected map.
2. A broad font reset overrode the guide's mobile 16px textarea, risking Safari focus zoom. Reduced selector specificity. Verified computed font-size is 16px with coarse-pointer emulation.
3. Mobile folder and theme ordering left half-empty rows. Corrected their common order. Verified identical top positions at 320px and 390px.
4. Mobile navigation allowed focus behind the overlay. Background is now inert, focus cycles through menu controls, Escape closes it, focus returns to the opener, and resizing beyond the mobile breakpoint closes the overlay.
5. Mobile profile spacing started lower than the reference. Aligned profile padding, icon line boxes, and portrait margin. Final paired mobile captures show matching top-section rhythm.

6. During handoff, browser scroll restoration could offset the entire desktop shell after a viewport change/reload. Anchored the desktop shell to the viewport while retaining normal mobile document flow. Verified the header stays at y=0 after a scrolled reload.

Final pass: no outstanding P0/P1/P2 issues for this local adaptation.

## Required fidelity surfaces

- Fonts/typography: captured PP Mori files are served locally; heading/body hierarchy, compact labels, and wrapping match the source's scale. Jan's longer facts and role copy intentionally wrap differently.
- Spacing/layout: 69px header, 380px desktop sidebar, dense 18-track grid, 6px gaps, card proportions, stacked mobile layout, and folder/theme pairing checked.
- Colors/tokens: dark/light surfaces, purple accent family, thin double outlines, muted text, and native theme transition checked against reference.
- Image quality/assets: source social icons and fonts, existing Jan portrait/project assets, real San Juan maps, and the existing Orbit rendering are used. The Lupa tile uses an icon treatment instead of the unrelated rainy-window image in the previous portfolio. Earlier-portfolio footage is shown only as a demotape project sample.
- Copy/content: Cencora role, prior employers, published-project counts, articles, actual links, bilingual copy, and guide answers derive from repository evidence. No invented live music, fitness, weather, presence, user counts, or backend AI claims.

## Verification

- npm run build: passed.
- npm run lint: passed.
- Browser console warnings/errors: none observed in the checked home, navigation, gallery, and guide flows.
- Widths 320, 390, 768, 1024, 1440: no document or dashboard horizontal overflow; no direct card bounds outside the viewport.
- Coarse pointer: mobile input computes to 16px; carousel controls have expanded hit targets.
- Home / Work / Ship Notes query navigation: passed; 8 project entries and 8 notes present.
- Project carousel arrows / dots / lightbox / thumbnails / keyboard arrows / Escape: passed.
- Theme toggle and persisted preference across fresh tabs: passed.
- Email copy and visible success feedback: passed.
- Guide topic and typed questions in English/Spanish: passed; current Cencora answer and real links confirmed.
- Mobile menu open, Escape close, focus placement, background inertness, navigation close, and desktop-resize close: passed.
- The previous homepage's Playwright suites target that layout; they were not presented as validation of this alternate dashboard. This handoff was verified through the in-app browser.
- No production deployment or remote branch push performed.

## Intentional differences / follow-up polish

- Personal widgets are mapped to Jan's work and context, not Ana's personal data.
- The local guide replaces the reference chat service.
- Existing résumé and article pages retain their established layout.
- More personal photography and current project recordings could enrich a later iteration; no stock people or fabricated product screenshots were substituted.

final result: passed
