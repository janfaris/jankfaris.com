import { useState } from 'react'
import type { Post } from './posts'
import { formatNoteNumber } from './posts'

const siteUrl = 'https://jankfaris.com'

const shareCopy = {
  en: {
    eyebrow: 'Pass it forward',
    title: 'Share this Ship Note',
    body: 'Useful ideas get better when they travel.',
    linkedin: 'LinkedIn',
    x: 'X',
    copyLink: 'Copy link',
    copyPost: 'Copy launch post',
    linkCopied: 'Tracked link copied.',
    postCopied: 'Launch post copied.',
    copyError: 'Copy failed. Use the browser address bar instead.',
  },
  es: {
    eyebrow: 'Pásalo',
    title: 'Comparte esta Ship Note',
    body: 'Las ideas útiles mejoran cuando se comparten.',
    linkedin: 'LinkedIn',
    x: 'X',
    copyLink: 'Copiar enlace',
    copyPost: 'Copiar publicación',
    linkCopied: 'Enlace con tracking copiado.',
    postCopied: 'Publicación copiada.',
    copyError: 'No se pudo copiar. Usa la barra del navegador.',
  },
} as const

type ShareLanguage = keyof typeof shareCopy

function getTrackedUrl(post: Post, lang: ShareLanguage, source: string) {
  const path = lang === 'es' ? `/es/writing/${post.slug}` : `/writing/${post.slug}`
  const url = new URL(path, siteUrl)
  url.searchParams.set('utm_source', source)
  url.searchParams.set('utm_medium', source === 'copy_link' ? 'referral' : 'social')
  url.searchParams.set('utm_campaign', `ship_note_${formatNoteNumber(post.noteNumber)}`)
  return url.toString()
}

export function ShipNoteShare({ post, lang }: { post: Post; lang: ShareLanguage }) {
  const labels = shareCopy[lang]
  const [feedback, setFeedback] = useState('')
  const linkedInUrl = getTrackedUrl(post, lang, 'linkedin')
  const xUrl = getTrackedUrl(post, lang, 'x')
  const copiedUrl = getTrackedUrl(post, lang, 'copy_link')
  const xIntent = new URL('https://twitter.com/intent/tweet')
  xIntent.searchParams.set('text', post.socialHook)
  xIntent.searchParams.set('url', xUrl)

  const launchPost = [
    post.socialHook,
    '',
    post.description,
    '',
    getTrackedUrl(post, lang, 'launch_post'),
    '',
    '#ProductEngineering #BuildingInPublic',
  ].join('\n')

  async function copyText(value: string, successMessage: string) {
    if (!navigator.clipboard) {
      setFeedback(labels.copyError)
      return
    }

    try {
      await navigator.clipboard.writeText(value)
      setFeedback(successMessage)
    } catch {
      setFeedback(labels.copyError)
    }
  }

  return (
    <section className="ship-share" aria-labelledby="ship-share-title">
      <div className="ship-share-copy">
        <span className="ship-share-eyebrow">{labels.eyebrow}</span>
        <h2 id="ship-share-title">{labels.title}</h2>
        <p>{labels.body}</p>
      </div>
      <div>
        <div className="ship-share-actions">
          <a
            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(linkedInUrl)}`}
            target="_blank"
            rel="noreferrer"
          >
            {labels.linkedin}
          </a>
          <a href={xIntent.toString()} target="_blank" rel="noreferrer">
            {labels.x}
          </a>
          <button type="button" onClick={() => copyText(copiedUrl, labels.linkCopied)}>
            {labels.copyLink}
          </button>
          <button
            type="button"
            className="ship-share-primary"
            onClick={() => copyText(launchPost, labels.postCopied)}
          >
            {labels.copyPost}
          </button>
        </div>
        <p className="ship-share-feedback" aria-live="polite">{feedback}</p>
      </div>
    </section>
  )
}
