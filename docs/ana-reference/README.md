# ana.sh reference capture

Captured 2026-09-08 from https://ana.sh/ using Codex's in-app browser.
This branch is a local portfolio adaptation for Jan Faris; it is not a deployment.

## Observed design

- Desktop: 1440 × 1000 CSS pixels at 1×. Header 69px; profile sidebar 380px.
- Dashboard: 18 tracks, 6px gutters, 8px outer padding, 80px minimum row tracks.
- Card surfaces: near-black #131316/#1a1a1e, #27272a borders, inset secondary outlines, 8–12px radii.
- Purple accents: #7a5af8 / #9b8afb. PP Mori regular, medium, semibold.
- Mobile: 390 × 844 at 1×, full-width profile followed by stacked widgets, two small folder/theme tiles, overlay menu.
- Interactions inspected: light/dark switch, carousel navigation, stacked photo transitions, portfolio navigation, gallery lightbox, mobile menu, chat input affordance.

## Adaptation

- Ana's biography, photos, employment, location, listening, fitness, and social data are replaced by Jan's existing public portfolio context.
- Presence becomes current Cencora employment; weather becomes a real San Juan clock.
- Fitness becomes the existing rotating Orbit component.
- Clothing becomes project previews; music becomes the Lupa workbench.
- The chat is a deterministic portfolio guide, explicitly labeled as answering from portfolio content, with no model API or external backend.
- The source's clipped desktop blog copy is intentionally kept readable in this version.
- Existing article, résumé, and readiness routes remain available.

## Assets

- PP Mori regular/medium/semibold WOFF2 and GitHub/Instagram icons were captured from the reference's page asset inventory and saved locally in public/dashboard.
- The source stylesheet is retained as source.css for design evidence, not imported by the application.
- Jan's portrait, JF mark, project previews, and tool logos come from the existing repository.
- LinkedIn glyph: Material Design Icons, via https://api.iconify.design/mdi/linkedin.svg.
- Other UI glyphs: lucide-react.
- San Juan maps: real OpenStreetMap tiles with local light/dark treatments; see public/dashboard/map-attribution.txt. No location lookup or remote tile request runs in the prototype.
- No source assets are hotlinked. The reference's personal photos and project work are not shipped in the application.

## Captures

See captures/source-desktop.jpg, source-mobile.jpg, implementation-desktop.jpg,
implementation-mobile.jpg, and implementation-mobile-es.jpg.
