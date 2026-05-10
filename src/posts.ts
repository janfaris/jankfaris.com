export interface Post {
  slug: string
  title: string
  description: string
  date: string
  readTime: string
  body: string // markdown-lite (paragraphs separated by blank lines, supports ## headings, > quotes, `code`, **bold**, *italic*, - lists)
}

export const posts: Post[] = [
  {
    slug: 'building-lupa',
    title: 'Building Lupa: A 7-day AI sales tool for Puerto Rico',
    description:
      'How I built an AI sales assistant that finds local businesses, audits their websites, and auto-generates a Spanish demo site per lead — in one week with Gemini 3, Next.js 16, and Supabase.',
    date: 'February 2026',
    readTime: '6 min',
    body: `## The pitch I kept losing

For two years I watched local Puerto Rico businesses — barbershops, restaurants, dental clinics — lose to mainland competitors with worse services but better websites. The pitch is obvious: "your site is hurting you." But every time I tried to sell that pitch, I lost. Owners couldn't picture it.

I needed a tool that would let them *see* what their business could look like, before the call.

## The core loop

Lupa is built around four steps: Discover → Scan → Mock → Pitch.

**Discover.** Given a category and a municipality (e.g. *Barbershops in Ponce*), Lupa uses Gemini 3 Flash with Google Maps + Search grounding to return ~20 verified local businesses with phone, address, Place ID, photos, and reviews. URLs are verified in parallel to kill hallucinations.

**Scan.** For each lead, Lupa runs PageSpeed Insights + URL context analysis through Gemini, computes a fixability score (0–10), flags SSL / mobile / meta / schema issues, and writes a sales call script grounded in competitor intel.

**Mock.** Picks one of seven design templates, generates culturally specific Spanish copy via Gemini with a structured schema, pulls real photos from Google Places, and renders a live Next.js page at \`/demo/[slug]\`.

**Pitch.** One-click WhatsApp message with the demo URL. View tracking via \`sendBeacon\` so I know before the call whether the owner opened it.

## The Gemini + Maps grounding bet

The hardest part wasn't the UI — it was making sure Lupa never invented a business that didn't exist. Gemini 3 with Google Maps grounding turned out to be uncannily good. Every business it returns has a real Place ID, real photos, real reviews. The hallucination problem evaporated.

The trick was structuring the prompt around verifiable identifiers. I ask Gemini to return a Place ID first, and only then to populate the rest. Anything without a valid Place ID gets dropped before it ever reaches the UI.

## Spanish-first as a moat

Every AI tool ships English first and adds Spanish as an afterthought. Lupa flipped that. The prospect-facing copy, the demo sites, the WhatsApp messages — all generated in Puerto Rican Spanish register from day one. This isn't translation; it's authorship in the voice owners actually use.

That single decision is the moat. Mainland tools can't replicate it without rebuilding the entire copy layer.

## What I'd do differently

I shipped Lupa in a week using Cursor + Claude. Looking back, the two things I'd change:

1. **Start with the demo template gallery.** I built the discovery pipeline first and the templates last. Wrong order — the templates are the actual product.
2. **Track the WhatsApp open before the demo open.** I instrumented demo views first. Turns out WhatsApp opens are a stronger leading indicator.

## What's next

Lupa is now an internal sales tool I use every week. Next phase: open the discovery layer to other PR sales teams, and add automated follow-up sequences when a demo gets viewed but no call is booked.

If you're building for Puerto Rico — or any underserved Spanish-language market — and want to compare notes, my email is in the footer.`,
  },
  {
    slug: 'shipping-demotape',
    title: 'Shipping demotape: from script to npm in a weekend',
    description:
      'I was sick of re-recording demo videos every time my UI changed. So I extracted the recording infra from Vantage, generalized it, and shipped it as an npm package.',
    date: 'January 2026',
    readTime: '4 min',
    body: `## The problem nobody talks about

Every founder shipping a B2B product re-records their demo video at least once a month. UI changes, copy changes, a button moves — back to OBS, back to clean takes, back to manual edits. The 20th time I did this for Vantage, I snapped.

I had Playwright already automating end-to-end tests. Why was I re-recording demos by hand?

## The extraction

The recording infra inside Vantage was already working. I had two scripts — \`record-demo.mjs\` (landscape for landing pages) and \`record-story.mjs\` (vertical for Instagram). The hard parts were already solved:

- Auth-aware recording (Supabase magic links, cookie injection)
- Skeleton-free segments (waits for content, trims loading states)
- FFmpeg post-processing (text overlays, format conversion)
- Smooth scroll choreography

What I needed to do was generalize. Pull out every Vantage-specific reference. Build a JSON config schema. Wrap it in a CLI.

## The config bet

The whole UX hinges on one decision: **the user defines their video in JSON, not code**.

\`\`\`json
{
  "baseUrl": "https://my-app.com",
  "segments": [
    { "name": "hero", "path": "/", "scroll": { "distance": 600 } },
    { "name": "dashboard", "path": "/dash", "dwellMs": 3000 }
  ]
}
\`\`\`

That's a working video. Add auth, overlays, multi-format, custom viewports — all opt-in. The 80% case is six lines of JSON.

## What it does that nothing else does

- **Auth-aware**: Supabase, NextAuth, raw cookies, localStorage
- **Skeleton-free**: trims loading states per-segment
- **Multi-format**: landscape and vertical from one config
- **CI/CD native**: runs headlessly, can update videos on every deploy

Supademo and Arcade are screenshot-stitching products. Screen Studio is a manual macOS tool. demotape is the only one that's actually a config-in / video-out pipeline.

## Lessons from publishing to npm for the first time

1. **The bin field matters more than you think.** \`"bin": { "demotape": "./bin/demotape.mjs" }\` is what makes \`npx demotape\` work. Get it wrong and the whole DX breaks.
2. **Zod for config validation is non-negotiable.** Users will pass garbage. Fail loud, fail early, fail with line numbers.
3. **Test the published package, not the local one.** I published v0.1.0 with a path bug because I was always testing the linked dev version.

## What's next

v0.2 will add:
- Click and hover actions in segments (so you can record interactive flows)
- A GitHub Action so videos auto-update on every deploy
- A \`demotape init\` wizard that scaffolds a config from a live URL

If you've shipped a demo video this month and hated it, try \`npx demotape init\` and tell me what's missing.`,
  },
  {
    slug: 'ai-products-puerto-rico',
    title: 'Why I build AI products for Puerto Rico',
    description:
      'A note on local moats, Spanish-first markets, and why being from somewhere is an unfair advantage every founder underrates.',
    date: 'December 2025',
    readTime: '3 min',
    body: `## The thesis

Every AI tool today is built for English-speaking, US-mainland users. The rest of the world gets translated table scraps. Puerto Rico — 3 million people, US payment infrastructure, Spanish-first culture, ignored by both LATAM and US founders — is the perfect testbed for a different kind of AI product: one that's built native, not localized.

## Local context is a moat

When I built Lupa, I didn't have to research Puerto Rican Spanish register. I grew up in it. I know the difference between *cafre* and *natural*, between *brego* and *resuelvo*. A founder in San Francisco can't fake that. A translator can't fake that. Neither can GPT, on its own — it needs me prompting it.

That's a moat. Small, but real, and stackable.

## Spanish-first is bigger than people think

There are 600 million Spanish speakers globally. A meaningful chunk are professionals, founders, designers, marketers, operators — people who *want* to use AI tools but get served products that feel translated. Build something that feels native and you skip past the localization tax.

usableai is my bet on this thesis at a content level. Lupa is the bet at a product level.

## Why I stay in Puerto Rico

A few reasons:
- The cost of testing things is lower
- The pool of underserved problems is deeper
- The talent density is rising fast (more founders ship from here every year)
- The cultural specificity travels — what works for PR Spanish often works for Caribbean and US Latino markets too

## What I'm not saying

I'm not saying every PR-focused product is a billion-dollar opportunity. I'm saying every PR-focused product has a structural advantage that mainland-built competitors can't easily replicate. That's enough to compound on.

If you're building for an "ignored" market — anywhere — the same logic applies. Local context, native voice, deep specificity. Pick one and go.`,
  },
]

export function getPost(slug: string): Post | undefined {
  return posts.find((p) => p.slug === slug)
}
