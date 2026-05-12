import type { Post } from './posts'

export const postsEs: Post[] = [
  {
    slug: 'lupa-tone-spec',
    title: 'Cómo logramos que Lupa hable español puertorriqueño sin regex',
    description:
      'Tres meses tratando de arreglar el tono con regex, reglas en el prompt y post-procesamiento — y lo único que realmente funcionó.',
    date: 'Mayo 2026',
    readTime: '9 min',
    body: `## El veredicto de Carmen

La primera dueña de negocio a la que le enseñé Lupa fue Carmen, que tiene una panadería en Bayamón. Leyó el pitch que generé y me dijo: *"Está bien escrito, pero no suena puertorriqueño."*

No lo podía articular. Yo tampoco. Pero tenía razón.

Este ensayo es sobre cómo traté de arreglar eso con regex (falló), qué intenté después (siguió fallando), y lo que finalmente funcionó. La lección se generaliza: **para cualquier producto bilingüe o culturalmente específico, el control de tono va antes de la llamada al modelo, no después.**

## Lo que intenté primero: regex post-hoc

El acercamiento más obvio fue el incorrecto, y lo embarqué de todos modos porque tenía el deadline encima.

\`\`\`ts
// versión 1 — NO HAGAS ESTO
function postProcessSpanish(text: string): string {
  text = text.replace(/echa un vistazo/gi, 'mira');
  text = text.replace(/hemos creado/gi, 'armamos');
  text = text.replace(/a través de/gi, 'por');
  text = text.replace(/la WhatsApp/gi, 'el WhatsApp');
  // ...30 reglas más
  return text;
}
\`\`\`

Tres problemas se asomaron la primera semana:

**1. Rompía español que sí estaba bien.** "Hemos creado" es castellano correcto; algunos pitches puertorriqueños sí lo quieren. Reemplazarlo en todos lados hacía el output peor, no mejor.

**2. No cogía los problemas reales.** "Te lo paso por el WhatsApp más tarde" pasa todas las regex pero suena mexicano al oído puertorriqueño. Los patrones que dicen "esto no somos nosotros" no están en ninguna palabra específica.

**3. Se acumulaba.** Cada negocio me daba una regla nueva. Al tercer mes tenía como 80 reglas regex peleándose entre ellas, sin pruebas, y sin entender por qué había añadido ninguna en particular.

Lo borré completo.

## Lo que intenté después: decirle las reglas al modelo

Moví las reglas al system prompt:

> Escribes pitches para pequeños negocios puertorriqueños.
> - Usa "tú" no "usted"
> - Evita expresiones del castellano peninsular
> - No uses "echa un vistazo"; usa "mira"
> - ...

Mejor. Pero seguía fallando de otra manera: el modelo obedecía las reglas negativas y se le escapaban las positivas. Evitaba "echa un vistazo" y generaba copy estéril, genérico — español corporativo, no español puertorriqueño cálido.

El modelo necesitaba ejemplos de qué hacer, no solo qué evitar.

## Lo que funcionó: un corpus, una tabla de género, y un validador diagnóstico

La solución que pegó tiene tres partes.

### Parte 1: Un corpus de pares bueno/malo

En vez de decirle al modelo "no suenes castellano," enséñale ejemplos lado a lado de cómo se lee la misma idea en registros diferentes:

\`\`\`yaml
corpus:
  - good: "Mira lo que armamos para tu negocio"
    bad:  "Echa un vistazo a lo que hemos creado"
  - good: "Te lo paso por WhatsApp en un ratito"
    bad:  "Te lo envío a través de WhatsApp en breve"
  - good: "Si te gusta, dímelo. Si no, dímelo también."
    bad:  "Por favor, comuníqueme su parecer"
\`\`\`

El corpus entra al system prompt como una tabla en markdown. El modelo aprende la distancia entre los dos clusters y aterriza en el lado "good" sin necesidad de que yo enumere cada regla.

Pasé dos semanas armando este corpus caminando por San Juan, copiando rótulos de tiendas, preguntándole a dueños cómo ellos mismos escribirían su pitch. Como 50 pares al día de hoy. El corpus es el foso.

### Parte 2: Una tabla de género para sustantivos absorbidos del inglés

El español puertorriqueño absorbe sustantivos del inglés más que otros dialectos — WhatsApp, app, mall, dashboard, link, post — y cada uno tiene un artículo fijo. Si te equivocas, el output se lee como una traducción:

\`\`\`yaml
gender_table:
  WhatsApp: el
  app:      la
  link:     el
  post:     el
  demo:     la
  dashboard: el
\`\`\`

Esto va en el prompt como una sección pequeña dedicada. El modelo nunca inventa el artículo equivocado cuando la regla está ahí escrita.

### Parte 3: Un validador diagnóstico (no un enforcer)

El output pasa por un validador que clasifica las violaciones como **duras** o **suaves**:

- **Las duras tiran error.** Vocabulario prohibido, oraciones run-on, falta de patrones de CTA requeridos. Son fallos inequívocos y preferimos regenerar antes que embarcarlos.
- **Las suaves advierten.** Drift de género, drift de voz de marca, calcos del inglés. Salen en el dashboard del operador como chips con un botón de regen por slide. El operador decide.

La idea clave: validadores que tiran error en cada violación suave ahogan el throughput. Te pasas el día corriendo el pipeline. Validadores que muestran advertencias dejan al humano en control de los edge cases.

## Por qué nada de regex post-hoc

Esta regla la fijé temprano y no la he roto: **los arreglos de tono viven en el prompt y el corpus, nunca en regex post-hoc.**

Tres razones:

**Regex no compone con el modelo.** Cuando arreglo algo con regex, no le digo nada al modelo. La próxima generación, comete el mismo error. El arreglo no se propaga.

**Regex no puede capturar los patrones que importan.** "Sonar mexicano" no es una palabra o frase. Es un vector de elecciones de palabras. Un modelo puede aprender a aterrizar en el vecindario correcto; regex solo puede hacer match exacto.

**Regex se acumula.** Cada regla añade deuda de mantenimiento. El corpus reduce deuda — añadir un par nuevo mejora el modelo en general, no solo en una frase.

Los pocos casos que SÍ tienen forma de regex (palabras prohibidas, detección de run-ons) viven en el validador, no en post-procesamiento. Tiran error, no reescriben.

## Cómo evalúo el output

Esta es la parte que la mayoría de features con LLM embarcan sin. Es la parte que más importa.

**Chequeos deterministas** corren en cada generación: validación de esquema (Zod), presupuestos de largo por template, detección de vocabulario prohibido, presencia de CTA requerido.

**LLM como juez** corre en cada generación. Un pase con Claude Sonnet califica el output en una rúbrica 1–5 para tono, consistencia de marca, y calidad del CTA. Cualquier cosa bajo 4 se regenera automáticamente.

**Verdad humana** corre semanalmente. Le mando el output de la semana a un grupo pequeño de dueños de negocio puertorriqueños y veo cuáles templates usan vs descartan. Esa señal cogió un problema de tono que el LLM-juez no veía — un drift de voz de marca que la rúbrica no estaba penalizando. Lo añadí a la rúbrica.

**Regresión** corre antes de cada cambio al prompt. Un set congelado de 20 negocios de prueba pasa por el pipeline; los outputs se comparan con el último set congelado; los cambios se revisan a mano antes de embarcar. Esto coge el problema clásico de "lo mejoré en este caso pero rompí otros cinco" que persigue toda iteración de prompts.

## Lo que haría diferente

**Construir el corpus primero.** Pasé dos meses tuneando prompts antes de darme cuenta de que el corpus era la palanca.

**Empezar el harness de evaluación el día uno.** Sin regresión, iterar prompts es apostar.

**No confundir librerías de traducción con librerías de tono.** DeepL y GPT hacen cosas diferentes. La traducción preserva significado; el control de tono preserva voz. Diferentes modos de falla, diferentes criterios de evaluación.

## Lo que liberé como open source

El patrón está en [spanish-tone-spec](https://github.com/janfaris/spanish-tone-spec) — un paquete npm bajo licencia MIT. El corpus en sí se queda con Lupa. La forma del sistema es pública.

## La lección general

Para productos bilingües, la corrección de tono es la diferencia entre "la AI es impresionante" y "la AI entiende." Para el español puertorriqueño esa brecha es enorme — la mayor parte del español que sale de un LLM aterriza en mexicano o neutral, y los hablantes caribeños sentimos el mismatch inmediatamente.

El arreglo no es un modelo más grande. Es prompt engineering upstream con un corpus real y evaluación diagnóstica downstream. La mayor parte del valor de una feature con LLM no está en la llamada al modelo. Está en todo lo que la rodea.`,
  },
]

export function getPostEs(slug: string): Post | undefined {
  return postsEs.find((p) => p.slug === slug)
}
