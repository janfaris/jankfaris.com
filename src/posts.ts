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
    slug: 'resend-supabase-tracked-email',
    title: 'Resend + Supabase: making every email a tracked API call',
    description:
      'How I wrapped Resend so every send lands in the same Supabase observability table as my Gemini, OpenAI, and Google Places calls — and why "email as a tracked API" changed how I think about transactional infra.',
    date: 'May 2026',
    readTime: '7 min',
    body: `## The realization

I was looking at my Lupa cost dashboard one morning when something annoyed me. I could see exactly how much I'd spent on Gemini 3 Flash that week, broken down by operation. I could see Google Places billing per route. I could see GPT Image 2 per generated image, with the model+size SKU and the source URL it was priced from.

I could not see email.

Email was the one outbound call in the whole product that wasn't accounted for. Resend was *cheap*, so I'd never bothered. But the asymmetry bugged me: every other expensive thing I did was a row in Supabase, and email — the thing that actually reaches my customers — was a fire-and-forget.

That morning I refactored it. Now every \`resend.emails.send()\` in Lupa is a tracked event in the same \`api_usage_events\` table as everything else. Same dashboard. Same daily report. Same observability surface. This essay is about why, how, and what I learned.

## The pattern

The whole thing is about 30 lines. Here's the shape:

\`\`\`ts
// lib/email.ts
import { Resend } from "resend";
import { trackApiUsage } from "./api-usage";

type ResendEmailPayload = Parameters<Resend["emails"]["send"]>[0];

let _resend: Resend | undefined;
function getResend(): Resend {
  if (!_resend) {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) throw new Error("RESEND_API_KEY is not set");
    _resend = new Resend(key);
  }
  return _resend;
}

async function sendTrackedEmail(
  operation: string,
  toEmail: string,
  payload: ResendEmailPayload,
): Promise<string | null> {
  let status = "ok";
  let resendId: string | null = null;
  try {
    const { data, error } = await getResend().emails.send(payload);
    if (error) throw new Error(error.message ?? JSON.stringify(error));
    resendId = data?.id ?? null;
    return resendId;
  } catch (err) {
    status = "error";
    throw err;
  } finally {
    await trackApiUsage({
      provider: "resend",
      operation,
      route: \`lib/email.\${operation}\`,
      quantity: 1,
      unit: "email",
      status,
      metadata: {
        toDomain: toEmail.split("@")[1]?.toLowerCase() ?? null,
        subject: typeof payload.subject === "string"
          ? payload.subject.slice(0, 120)
          : null,
        resendId,
      },
    });
  }
}
\`\`\`

Three things going on:

**Lazy singleton.** The Resend client is created on first call, not at module load. This matters more than it looks — at module load you don't always have env vars (Next.js build, edge runtime). Lazy init keeps \`RESEND_API_KEY\` errors deferred until you actually try to send, which means a missing key fails the cron job, not the build.

**Try / catch / finally writing to Supabase.** The send happens inside try. The error path re-throws so the caller still knows it failed. The finally block writes a row to \`api_usage_events\` regardless of outcome — including on failure, with \`status: "error"\`. Failed sends become visible in the same dashboard as successful ones.

**No PII in the tracking row.** The recipient email is split — I keep only the domain (\`@gmail.com\`, \`@bylupa.com\`) — and the subject is truncated to 120 chars. The full address never lands in the analytics table. Resend keeps the actual recipient in its own dashboard; I keep the metadata I need for cost and deliverability reporting.

That \`resendId\` going back into the metadata column is the killer feature. It's the join key between my analytics view and Resend's dashboard. When something goes wrong, I can grep my Supabase logs for the operation, get the Resend ID, and jump to Resend's UI for the delivery trace.

## What trackApiUsage actually does

The \`trackApiUsage\` function on the other side of that call is a thin writer over a Supabase table:

\`\`\`sql
create table api_usage_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,        -- 'resend', 'gemini', 'google_places', 'openai'
  operation text not null,        -- 'monthly_report', 'text_search', 'image_generation'
  sku text,
  model text,
  unit text not null,             -- 'email', 'request', 'token', 'image'
  quantity numeric not null,
  estimated_cost_usd numeric,
  status text not null,           -- 'ok' | 'error'
  route text,
  metadata jsonb,
  created_at timestamptz default now()
);
\`\`\`

Every API call in the system writes to this one table. Gemini text generation writes \`provider: 'gemini', unit: 'token'\`. Google Places writes \`provider: 'google_places', unit: 'request'\`. Resend writes \`provider: 'resend', unit: 'email'\`.

A separate \`provider_price_rules\` table holds the cost per unit by provider+operation+SKU+model, plus the free-tier monthly allowance and a source URL pointing at the official pricing page. \`trackApiUsage\` joins to it to fill \`estimated_cost_usd\` on the way in. Resend's free tier (3,000 emails/month at the time of writing) gets modeled exactly like Google Places' free quota — same schema, same dashboard treatment.

That's the unification I wanted. Cost-per-customer rolls up across email and every other API. When Lupa generates a demo site, I can see the total marginal cost — including the activation confirmation email — in a single row.

## The daily report (which is itself sent via Resend)

The funny part of the build was the daily ops report. Every morning I get an email summarizing the previous 24 hours of API spend across every provider. It tells me the total estimated cost, the day-over-day delta, the per-provider breakdown, the top operations, and the top spending leads.

The email itself goes out through the same \`sendTrackedEmail\` wrapper. Which means Resend reports on its own usage inside the email it sends to report on everything else's usage. The recursion is satisfying.

\`\`\`ts
await sendTrackedEmail("api_usage_daily_report", toEmail, {
  from: "Lupa <hola@bylupa.com>",
  to: toEmail,
  subject,
  html,
});
\`\`\`

When that send happens, it writes a row with \`operation: "api_usage_daily_report"\`. So the next day's report includes a single Resend event for "delivering yesterday's report." It's a tiny line item, but it's there, and it's correct, and the fact that it's correct is what tells me the whole tracking system is wired right.

## Why I keep emails in HTML tables, not React Email

I love React Email. I use it elsewhere. For Lupa, I write the templates as raw HTML tables.

Two reasons:

**Gmail strips most CSS from \`<div>\`s.** Anyone who's shipped customer-facing email has hit this. Modern CSS in modern Gmail still falls back to table-layout for reliability. React Email handles this for you most of the time, but I had enough edge cases — Outlook desktop, Apple Mail dark mode, Gmail mobile clipping — that I wanted the layout in my hands.

**The template is the brand surface for Lupa.** The header has a Georgia-serif italic glyph (◉) followed by the wordmark. The subject banner uses Lupa's signature terracotta on cream. The footer signs "Hecho en Puerto Rico." This isn't a generic transactional template — it's a brand artifact, and treating it like a hand-tuned HTML document instead of a component tree feels right for the role it plays.

This is *not* a recommendation. For most products, React Email is the right answer and the time savings are real. For Lupa specifically, the brand investment pays back in trust signals that mainland tools don't replicate.

## What I'd build next

I haven't shipped these yet, but the wrapper is ready for them:

**Bounce + complaint hooks.** Resend's webhooks land in a Supabase function, and a bounce event updates the recipient's profile so the next sender check skips them. Same observability table — \`provider: "resend", operation: "bounce"\` — so my dashboard sees deliverability rot the day it starts.

**Per-customer email caps.** I'd rather throttle a misbehaving template than spam someone. The \`api_usage_events\` table already has the data: count \`provider='resend' and metadata->>'toDomain'='x'\` over a window, refuse to send if it exceeds threshold.

**A "last-send" indicator on the customer admin view.** The Resend message ID is already in my table. Three lines of UI and an internal user can click to see the actual delivery, the actual open, the actual click — without ever leaving the admin.

## The general lesson

Most products track email as a feature, not as a cost. That's a mistake. Email is one of the few outbound calls you make every customer is guaranteed to see, and treating it like a tracked API — with the same observability surface as your AI calls and your database queries — pays back in three ways:

1. You see when delivery rates drift before users tell you.
2. You see the marginal cost of every customer interaction in one row.
3. You build the habit, early, of treating "external service calls" as a uniform category, not a per-vendor zoo.

Resend earned its way to default in my stack by making the SDK so unobtrusive that wrapping it doesn't cost anything. The API is small, the SDK is correct, and the only thing you ever have to think about is your own product. That's the right shape for infrastructure: it shows up when you call it, and disappears when you don't.

For me, the wrap was 30 lines. For Lupa, it was the difference between "we send some emails" and "email is part of the product, the dashboard, and the budget." That difference is what makes Resend the first integration I reach for now, every time a new product needs to talk to a human.`,
  },
  {
    slug: 'dont-patch-fix-prompt',
    title: "Don't patch the output. Fix the prompt.",
    description:
      'Lessons from shipping an AI pull-request reviewer to 7 repos at Microsoft. Why diagnostic validators beat post-hoc regex, why the eval set is the product, and why trust compounds in both directions.',
    date: 'May 2026',
    readTime: '8 min',
    body: `*Lessons from shipping an AI pull-request reviewer to 7 repos at Microsoft.*

Last summer I almost killed my own product.

I'd been working on PRPilot for a few months — an AI pull-request reviewer running on Claude Opus 4.7's 1M-token context, with retrieval over the diff and the linked issues. The pilot team was small. Three repos. Twenty engineers. The reviews were good enough that people stopped joking about turning it off.

Then someone on a fourth team installed it on a repo I'd never seen. The PR was 4,000 lines. The bot left 23 comments. Eleven of them were wrong.

The fix in front of me was obvious. Write a regex. Strip every comment that matched certain shapes — "consider extracting this into a function," "this could be more idiomatic," anything that smelled like advice the model couldn't justify. The team would stop muting the bot. Trust restored. Ship by Friday.

I didn't do it. And I want to write about why, because I think it's the most important thing I've learned shipping AI products: **the reviewer that earns trust is the one whose author has stronger taste than the model.**

If you patch the output, you don't have stronger taste. You have a softer ceiling on a model that keeps producing bad work, and your patches are getting between your users and the truth about what your system actually does.

## The seductive wrong path

Every team I've watched ship an AI reviewer eventually faces the same fork.

The model is too noisy. Devs are complaining. There's pressure to ship a fix this week.

The fast fix is always a post-processor. Sometimes it's a regex. Sometimes it's a second LLM call to classify whether the first comment was useful. Sometimes it's a denylist of phrases. Whatever shape it takes, the pattern is the same: leave the prompt alone, mask the bad outputs on the way out.

It works. For about a week.

Then the model gets confidently wrong in a new way your filter doesn't catch. You add another rule. Two weeks later, three more rules. Six months in, your reviewer is a Rube Goldberg machine of regex and second-pass LLM judges, none of you remembers why each rule exists, and the underlying prompt has been frozen in amber since the day you stopped trusting it.

The worst part isn't the technical debt. It's that you've quietly stopped learning from your users. Every false positive your filter catches is signal you never wrote down. The prompt that's actually producing your outputs is getting worse and worse, and you don't know, because the layer above it is silently making the model look smarter than it is.

This is the version of PRPilot that would have shipped by Friday. It's also the version that would have lost adoption within a quarter, because models change, prompts that worked yesterday produce different outputs tomorrow, and a brittle post-processor pipeline becomes a tax you pay every time you want to upgrade the model.

## Diagnostic validators, not regex

The principle I locked in instead, and now apply to every AI pipeline I build:

> Validators tell you when the prompt is wrong. They never patch the output.

A diagnostic validator runs after the model produces its result. If something is off — wrong tone, missing field, a class of error you've seen before — it raises a flag. It doesn't rewrite. It doesn't strip. It surfaces the failure to you, the author, and to the user, as a labeled diagnostic.

In PRPilot's case, the validators check for things like:

- Comments that don't cite a specific line.
- Suggestions that contradict the code style elsewhere in the same repo.
- "Consider X" comments where X has no clear win condition.
- Comments that repeat verbatim across unrelated PRs — a sign the model is pattern-matching, not reading.

When a validator fires, two things happen. The comment gets flagged in the bot's UI with a short label — *unjustified suggestion*, *style mismatch* — and the failure lands in a log that I read every Monday morning. I don't auto-strip. I don't auto-fix. I read.

That weekly read is the whole product. It's the loop that turns user pain into prompt improvements, which turn into a model that does the right thing on its own, which means the next user gets a better experience without anyone having to push code.

By the time PRPilot was scoring 5.0/5.0 on the internal evaluation rubric, the validators were firing on less than one percent of comments. Not because I was filtering harder. Because the prompt had eaten every lesson the validators had ever surfaced.

## The eval set is the product

The other belief I built PRPilot on, less original but harder to actually follow:

**Your eval set is the product. Everything else is decoration.**

I spent more time on the ground-truth set than on the prompt. The eval is a few hundred carefully-chosen pull requests, each one labeled with what a good reviewer would say, what a bad reviewer would say, and what an annoying-but-not-wrong reviewer would say. Each PR was picked because it represents a class of code the bot needs to be useful on — small refactors, infra config changes, large feature merges, security-sensitive paths, generated code, generated-by-the-bot code.

A few rules I follow about evals:

1. **The eval set should fit in your head.** Mine is small enough that I can name the categories without checking. If it's bigger than that, you're optimizing for a benchmark instead of a product.
2. **Each entry should be actively painful to lose.** If you can delete an eval without flinching, it shouldn't have been in the eval.
3. **Update the eval before the prompt.** When a user reports a bad review, the first commit is to the eval, not the prompt. The eval is the contract. The prompt is the implementation.
4. **Run the eval before every prompt change.** Including the ones you're sure about.

The 5.0/5.0 score isn't the point. The point is that I knew exactly which classes of PR the bot was strong on, which it was weak on, and which I had no eval coverage for. The score is just the receipt.

## Trust compounds, and so does its absence

PRPilot now runs across more than seven repos in the org. Almost none of them were sold. Three were installed by teams who saw the bot leave a useful comment on a PR they were reviewing, and DM'd me to ask how to enable it.

This is the part nobody talks about with AI products. **Trust compounds.** Once a team trusts the bot, every comment after that gets the benefit of the doubt. Devs read carefully, take suggestions seriously, push back when they disagree instead of muting.

The reverse compounds even faster. One bad week and a team stops reading. They don't tell you. They just stop. You don't get a churn signal — you get silence, and you discover the silence three months later when someone asks why the bot still posts to a repo nobody has touched in twelve weeks.

The only way I know to make trust compound in the right direction is to be willing to ship slower than the model. Better to post one useful comment than five comments where one is useful. Better to be quiet on a PR you don't understand than to guess. Better to surface *I don't have context on this file* than to fabricate context.

These are all prompt-level decisions. Not post-processor decisions. Not eval decisions. Just choices about what the model should do when it isn't sure.

## What I'd tell someone shipping their first AI reviewer

Three things, in order of how much they matter:

1. **Treat the prompt as the source of truth.** If the model is producing the wrong thing, the right fix is upstream of the model's output. Validators that surface failure are good. Code that masks failure is debt.
2. **Spend two weeks building an eval set before you spend two days iterating on the prompt.** You will be tempted to skip this step. Every engineer I know has skipped it. The ones who go back and build it later all wish they hadn't waited.
3. **Read every flagged comment yourself for the first three months.** Not a dashboard. Not a summary. Read the actual model output and the actual user reaction. You are training your own taste, which is the upper bound on how good your product can ever be.

If you do those three things, the rest is just work. Latency, retrieval, model routing, integrations — all of it falls into place when you have a sharp prompt, a tight eval, and the receipts to know which is which.

## The general lesson

Most of what made PRPilot land where so many internal AI tools fail wasn't technical. It was a willingness to slow down at the moment everyone wanted me to ship a patch, and to insist that the way to make the bot trustworthy was to make the prompt deserve trust — not to dress up its outputs after the fact.

Quality is the product. The reviewer that earns trust is the one whose author has stronger taste than the model.

Everything else is decoration.`,
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
