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
    slug: 'github-profile-overhaul',
    title: 'I overhauled my GitHub profile in one afternoon. Here\'s the playbook.',
    description:
      'From 2 public repos to 9, two npm packages, 1,177 backfilled contributions, and a profile that actually backs up the resume. The order matters.',
    date: 'May 2026',
    readTime: '7 min',
    body: `## The gap I'd been ignoring

My resume said "8 production AI products in 18 months." My GitHub said two public repos, a 15-contribution year, no bio, no photo, no pinned anything. Anyone clicking through bounced in five seconds.

This is the playbook I ran in one afternoon to close that gap. It's the order that matters, not the individual steps — most of which are 5-minute changes you can copy-paste.

## Step 1: Co-link every email you've ever committed from

This is the single highest-leverage thing on the list and almost nobody does it.

GitHub computes your contribution graph from commits whose author email matches one verified on your account. If you've ever committed from a school email, an old personal email, or a now-abandoned address — those commits exist on the server but don't count toward *your* graph until you tell GitHub the email is yours.

Settings → Emails → add every email you remember using. Wait a few minutes. The graph backfills retroactively.

My graph went from 15 contributions in the last year to 1,177. Same commits. They were just attributed to addresses GitHub didn't know were mine.

## Step 2: A profile README

GitHub auto-renders the README from a repo named the same as your username. So \`github.com/janfaris/janfaris\` becomes the top of your profile page.

Mine has four sections:
- One-line positioning
- Currently building (3 projects with links)
- Open source (the npm packages and the spec docs)
- Tech I work with (badges)

Keep it tight. Recruiters scan for under 10 seconds.

## Step 3: Decide what to open-source

This is where most people freeze. They have a portfolio of products with real IP they don't want to expose, so they post nothing.

The trick: don't open-source the products. Open-source the patterns inside them.

I built [Lupa](/writing/building-lupa) for Puerto Rican small businesses. The product source stays private — that's my business. But inside Lupa there's a Spanish locale tone-control system that's broadly useful, has no business logic in it, and just happens to be the answer to a question other AI builders are asking. I extracted it as [\`spanish-tone-spec\`](https://github.com/janfaris/spanish-tone-spec), published it to npm, and now I have a public artifact that proves I built the thing without exposing how it makes money.

Same with PRPilot, my internal Microsoft PR-review product. The source is Microsoft IP. But the agent-skill format I designed for it — that's a spec, and specs are open. So [\`skill-md-spec\`](https://github.com/janfaris/skill-md-spec) is now a public repo.

Three things to look for in your own portfolio:
- **A library shaped piece.** A small utility doing one thing well.
- **A spec or format you defined.** Documentation of a pattern, not the implementation.
- **A reference architecture.** Diagram + README of a real system you built, no source code.

## Step 4: Public showcase repos for private products

For products I won't open-source — Lupa, Vantage — I created public *marketing* repos: \`lupa-marketing\`, \`vantage-marketing\`. README has the architecture diagram, the stack, screenshots, the open-source carveouts that came out of it.

This is what Stripe / Linear / Vercel do for their internal tools. "Public-by-default, with a private monorepo" is a respected pattern, not a confession.

## Step 5: Stars and follows are public signals

GitHub stars and follows are sometimes scanned by recruiters before they read your repos. A profile with 0 stars looks like an inactive account. A profile with 30+ stars in your niche signals taste.

I curated my stars around AI + dev tools + design: Vercel AI SDK, PostHog, Linear, Supabase, Anthropic SDKs, OpenAI SDKs, MCP, Shadcn, Drizzle, Hono. The cluster says "this is what they care about" louder than any bio.

Followed ~30 people whose work I respect across the same axis. Following IS public.

## Step 6: Topic tags

Every repo has a "topics" field that's invisible by default but rules GitHub search. Add 8-12 topics per repo. \`demotape\` got: \`playwright\`, \`ffmpeg\`, \`video\`, \`cli\`, \`demo\`, \`automation\`, \`screencast\`, \`typescript\`, \`ai-agents\`, \`developer-tools\`, \`web-development\`, \`nodejs\`.

Five minutes per repo. Multiplies discoverability.

## Step 7: Pin in priority order

The "Customize your pins" UI lets you choose up to 6 repos to surface at the top of your profile. Order matters — left-to-right, top-to-bottom is what visitors scan.

Mine: demotape (proven OSS, most stars potential) → spanish-tone-spec → skill-md-spec → lupa-marketing → vantage-marketing → jankfaris.com.

The two npm packages first, then the showcase architecture, then the personal site. Reads as "ships open-source, builds real products, runs a public portfolio."

## What I didn't do

**Make commits I didn't make.** Backdating commits is a temptation. Don't. GitHub's algorithms flag suspicious patterns and recruiters can spot a graph that's "too consistent." The retroactive backfill from co-linked emails is real history. Forced contribution graphs are fraud.

**Star every repo I've ever heard of.** Stars are public. A profile with 500 stars across unrelated tools reads as "I star everything." Curation is the signal.

**Set "Available for hire" to true.** I'm conducting a stealth job search from Microsoft. The Available-for-Hire flag is what Microsoft's recruiting team scrapes to flag departing employees. If you're stealth, this flag is your enemy.

## The whole thing was four hours

Profile basics: 30 min. Email co-linking: 5 min. Profile README: 30 min. Three carveout repos with READMEs: 90 min. Public showcase repos: 60 min. Stars and follows: 30 min. Topic tags: 30 min.

The graph going from 15 contributions to 1,177 was the most satisfying five minutes of the day. The rest was a writing exercise — turning the work I'd already done into something a stranger could understand in 30 seconds.

If your GitHub doesn't match your resume, the resume is the document being doubted. Fix the GitHub.`,
  },
  {
    slug: 'first-npm-publish-2fa',
    title: 'Publishing my first npm package and the 2FA wall that almost killed it',
    description:
      'A two-line problem: my npm account had a passkey, my CLI wanted a 6-digit code, and the publish kept failing. The fix is one flag.',
    date: 'May 2026',
    readTime: '4 min',
    body: `## The situation

I had a clean working package: \`spanish-tone-spec\`, MIT-licensed, types compiling, five tests passing, README polished. \`package.json\` lookd right, \`tsconfig.json\` lookd right, the tarball preview showed 7 files at 6.9kB.

\`npm publish --access public\`. Error.

\`\`\`
npm ERR! code EOTP
npm ERR! This operation requires a one-time password from your authenticator.
npm ERR! You can provide a one-time password by passing --otp=<code>
\`\`\`

Easy, I thought. My phone is right here. Open the authenticator. Wait. **I don't have a TOTP authenticator for npm.** I'd set up the account with a passkey, because passkeys are the future. There's no 6-digit code for me to type.

## The fork

Two options.

**Option A:** Go to npmjs.com → account settings → add a TOTP method alongside the passkey. Now I have both. Type the 6-digit code on the next \`npm publish\`. Done.

**Option B:** Find a CLI flag that uses the passkey through the browser.

I went with B because A would mean weakening my 2FA setup just to ship one package. But B is undocumented enough that I had to grep through \`npm-cli\` issues to find it.

## The fix

\`\`\`bash
npm publish --access public --auth-type=web
\`\`\`

That one flag flips npm's CLI into a browser-based auth flow. It pops open a tab on npmjs.com, you authenticate with the passkey, the CLI gets the token, the publish goes through.

It worked the first try after I added the flag. Took 15 seconds.

## Why this isn't easier

The npm CLI defaults to assuming you have a TOTP authenticator. The \`--auth-type=web\` flag has existed for a while, but it's nowhere in the publish docs. It comes up in the \`npm login\` man page, sort of, in the context of logging in. The connection to 2FA-during-publish isn't made anywhere obvious.

This is the kind of friction that pushes people to weaken their security setup. "Just add the authenticator, it's easier" is what every Stack Overflow answer says. It's also what's wrong with the advice. Passkeys are better. The tooling should keep up.

## What I shipped

[\`spanish-tone-spec\`](https://www.npmjs.com/package/spanish-tone-spec) is live on npm. It's a prompt-side Spanish locale tone control library for LLM output — extracted from [Lupa](/writing/building-lupa) and described in detail in [its own essay](/writing/lupa-tone-spec).

\`npm i spanish-tone-spec\` if you're shipping Spanish-language LLM output and want it to land in a specific regional voice. PR Spanish is the primary use case but the library is locale-agnostic.

## The general lesson

If a CLI gives you an error and your first instinct is "I'll change my account settings to make this work," stop. Look for an \`--auth-type=\` or equivalent first. The right answer to a tooling friction is rarely "weaken my security." It's "find the flag the tooling already has."

This is the third time this pattern has saved me. The first two were not as easy to articulate, so I'm writing it down now.`,
  },
  {
    slug: 'spa-routing-vercel-404',
    title: 'Why my /writing route was returning 404 on Vercel (and the one-file fix)',
    description:
      'I had the route in source. The build was clean. Production returned 404. The reason: a missing file Vite doesn\'t generate by default.',
    date: 'May 2026',
    readTime: '3 min',
    body: `## The symptom

I had a route at \`/writing\` in my React Router config. Local dev: worked. Build: clean. Deployed to Vercel: clicking the link from the homepage worked. **Direct-loading \`https://janfaris.com/writing\`: 404.**

Classic single-page-app routing problem, dressed up as a deploy bug.

## What's actually happening

Vite builds an SPA. There's exactly one HTML file shipped: \`index.html\`. React Router lives inside that HTML, reads the URL, and renders the right component.

When a user *clicks* from the homepage to \`/writing\`, no HTTP request goes out for \`/writing\` — React Router intercepts the click and re-renders the same already-loaded \`index.html\` with a different component.

When a user *hard-loads* \`/writing\` (typing the URL, hitting refresh, or following an external link), the browser asks Vercel for \`https://janfaris.com/writing\`. Vercel looks at the filesystem, sees there's no \`/writing\` directory and no \`/writing.html\` file, and serves a 404.

The router never gets a chance to run because the page never loads.

## The fix

One file at the repo root:

\`\`\`json
// vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
\`\`\`

That tells Vercel: for any URL, serve \`index.html\`. Once index loads, React Router does the rest.

Commit, push, Vercel auto-deploys, the 404 is gone.

\`\`\`
$ curl -sL -o /dev/null -w "%{http_code}\\n" https://janfaris.com/writing
200
\`\`\`

## Why Vite doesn't generate this by default

Vite is host-agnostic. The "rewrite all routes to index.html" rule is configured differently on every host: \`vercel.json\` on Vercel, \`_redirects\` on Netlify, \`.htaccess\` on Apache, location blocks on nginx. Vite stops at the build output and lets the host config layer do the rest.

The Create React App generation defaulted on this — it shipped a \`netlify.toml\` and assumed you were deploying to Netlify. Vite chose neutrality, which is the right call long-term but means everyone running their first Vite-on-Vercel project trips on it once.

## How I would have caught this earlier

If I'd hard-reloaded the route once on the staging URL before merging to main, I'd have caught it before users (and recruiters reading my resume) ever hit the 404. Now it's the new check on my "before declaring a feature shipped" list:

1. Build locally
2. Deploy to staging
3. **Hard-reload every new route directly, not via in-app navigation**
4. Merge

Three steps. Same fix as always: the routine matters more than the talent.

## The general lesson

Most "deploy bugs" aren't bugs. They're the absence of a config file that the framework expects you to write. When a route works in dev but 404s in production, the framework isn't broken — the host doesn't know about your SPA.

\`vercel.json\` for Vercel, \`_redirects\` for Netlify, equivalent rewrites for every other host. One file. One day of frustration if you don't know it exists.`,
  },
  {
    slug: 'lupa-tone-spec',
    title: 'How we made Lupa speak Puerto Rican Spanish without regex',
    description:
      'Three months of trying to fix tone with regex, prompt rules, and post-processing — and the one thing that finally worked.',
    date: 'May 2026',
    readTime: '9 min',
    body: `## Carmen's verdict

The first business owner I demoed Lupa to — Carmen, who runs a bakery in Bayamón — read the pitch deck I generated and said, *"This is well-written, but it doesn't sound Puerto Rican."*

She couldn't articulate why. I couldn't either. But she was right.

This essay is about how I tried to fix that with regex (it failed), what I tried next (it kept failing), and what eventually worked. The lesson generalizes: **for anything bilingual or culturally specific, tone correctness is upstream of the model call, not downstream.**

## What I tried first: post-hoc regex

The naive approach was the wrong one, and I shipped it anyway because the deadline was tight.

\`\`\`ts
// version 1 — DO NOT DO THIS
function postProcessSpanish(text: string): string {
  text = text.replace(/echa un vistazo/gi, 'mira');
  text = text.replace(/hemos creado/gi, 'armamos');
  text = text.replace(/a través de/gi, 'por');
  text = text.replace(/la WhatsApp/gi, 'el WhatsApp');
  // ...30 more rules
  return text;
}
\`\`\`

Three problems showed up in the first week:

**1. It broke valid Spanish.** "Hemos creado" is correct Castilian; some Puerto Rican copy actually wants it. Replacing it everywhere made the output worse, not better.

**2. It missed the real issues.** "Te lo paso por el WhatsApp más tarde" passes every regex but reads as Mexican-accented to a Puerto Rican ear. The patterns that signal "this isn't us" are not in any single word.

**3. It accumulated.** Every business gave me a new rule. By month three I had ~80 regex rules conflicting with each other, with no test coverage, and no understanding of why I'd added any individual one.

I tore it out.

## What I tried next: tell the model the rules

I moved the rules into the system prompt:

> You are writing pitch decks for Puerto Rican small businesses.
> - Use "tú" not "usted"
> - Avoid Castilian Spanish expressions
> - Don't use "echa un vistazo"; use "mira"
> - ...

Better. But still failing in a different way: the model would obey the negative rules and miss the positive ones. It avoided "echa un vistazo" and generated copy that was sterile, generic — corporate-Spanish, not warm-Puerto-Rican-Spanish.

The model needed examples of what to do, not just what to avoid.

## What worked: a corpus, a gender table, and a diagnostic validator

The fix that stuck has three parts.

### Part 1: A corpus of good/bad pairs

Instead of telling the model "don't sound Castilian," show it side-by-side examples of how the same thought reads in different registers:

\`\`\`yaml
corpus:
  - good: "Mira lo que armamos para tu negocio"
    bad:  "Echa un vistazo a lo que hemos creado"
  - good: "Te lo paso por WhatsApp en un ratito"
    bad:  "Te lo envío a través de WhatsApp en breve"
  - good: "Si te gusta, dímelo. Si no, dímelo también."
    bad:  "Por favor, comuníqueme su parecer"
\`\`\`

The corpus goes into the system prompt as a markdown table. The model learns the distance between the two clusters and lands on the "good" side without needing me to enumerate every rule.

I spent two weeks building this corpus by walking around San Juan, copying signs and storefront copy, asking shop owners how they'd write their own pitch. About 50 pairs at the time of writing. The corpus is the moat.

### Part 2: A gender table for absorbed English nouns

Puerto Rican Spanish absorbs English nouns more than other dialects — WhatsApp, app, mall, dashboard, link, post — and each one has a settled article. Get it wrong and the output reads like a translation:

\`\`\`yaml
gender_table:
  WhatsApp: el
  app:      la
  link:     el
  post:     el
  demo:     la
  dashboard: el
\`\`\`

This goes in the prompt as a small dedicated section. The model never invents the wrong article when the rule is right there.

### Part 3: A diagnostic validator (not an enforcer)

The output flows through a validator that classifies violations as **hard** or **soft**:

- **Hard violations throw.** Forbidden vocabulary, run-on sentences, missing CTA patterns. These are unambiguous failures, and we'd rather regenerate than ship them.
- **Soft violations warn.** Gender drift, brand-voice drift, calques from English. These surface in the operator dashboard as chips with a per-slide regen button. The operator decides.

The critical insight: validators that throw on every soft violation strangle throughput. You spend all day re-running the pipeline. Validators that surface warnings let the human stay in control of edge cases.

## Why no post-hoc regex

I locked this rule in early and haven't broken it: **tone fixes live in the prompt and corpus, never in post-hoc regex.**

Three reasons:

**Regex doesn't compose with the model.** When I fix something with regex, I tell the model nothing. Next generation, it makes the same mistake. The fix doesn't propagate.

**Regex can't catch the patterns that matter.** "Mexican-sounding" is not a word or phrase. It's a vector of word choices. A model can learn to land in the right neighborhood; regex can only match exact strings.

**Regex accumulates.** Each rule adds maintenance debt. The corpus shrinks debt — adding a new pair makes the model better across the board, not just on one phrase.

The few cases that ARE regex-shaped (forbidden words, run-on detection) live in the validator, not in post-processing. They throw, they don't rewrite.

## How I evaluate the output

This is the part most LLM features ship without. It's the part that matters most.

**Deterministic checks** run on every generation: schema validation (Zod), length budgets per template, forbidden vocabulary detection, required CTA presence.

**LLM-as-judge** runs on every generation. A Claude Sonnet pass scores the output on a 1–5 rubric for tone, brand consistency, and CTA quality. Anything below 4 auto-regenerates.

**Human ground-truth** runs weekly. I send the week's output to a small group of Puerto Rican small-business owners and watch which templates they actually use vs. discard. That signal caught a tone problem the LLM-judge missed — a brand-voice drift the rubric wasn't penalizing. I added it to the rubric.

**Regression** runs before every prompt change. A frozen set of 20 test businesses goes through the pipeline; outputs are diffed against the previous frozen run; changes are reviewed manually before deployment. This catches the "I made it better on this case but broke five others" problem that plagues prompt iteration.

## What I'd do differently

**Build the corpus first.** I spent two months tuning prompts before realizing the corpus was the lever.

**Start the eval harness on day one.** Without regression, prompt iteration is gambling.

**Don't conflate translation libraries with tone libraries.** DeepL and GPT do different things. Translation preserves meaning; tone control preserves voice. Different failure modes, different evaluation criteria.

## What I open-sourced

The pattern is in [spanish-tone-spec](https://github.com/janfaris/spanish-tone-spec) — an MIT-licensed npm package. The corpus itself stays with Lupa. The shape of the system is public.

## The general lesson

For bilingual products, tone correctness is the difference between "the AI is impressive" and "the AI gets it." For Puerto Rican Spanish that gap is huge — most LLM Spanish defaults to Mexican or neutral, and Caribbean speakers feel the mismatch immediately.

The fix isn't a bigger model. It's upstream prompt engineering with a real corpus and downstream diagnostic eval. Most of the value of an LLM feature isn't in the model call. It's in everything that surrounds it.`,
  },
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
