/**
 * A Puerto Rican night, synthesised live: a chorus of coquís (the frog's
 * two-note "co-quí" call) over slow surf. Nothing is downloaded, and it only
 * starts from an explicit button press.
 */
type Frog = { co: number; qui: number; pan: number; level: number; next: number }

function surfBuffer(context: AudioContext) {
  const length = context.sampleRate * 4
  const buffer = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    let last = 0
    for (let i = 0; i < length; i++) {
      last = (last + .02 * (Math.random() * 2 - 1)) / 1.02
      data[i] = last * 3.2
    }
    // Crossfade the loop seam so the surf never clicks.
    const fade = context.sampleRate * .25
    for (let i = 0; i < fade; i++) {
      const mix = i / fade
      data[length - fade + i] = data[length - fade + i] * (1 - mix) + data[i] * mix
    }
  }
  return buffer
}

function reverbImpulse(context: AudioContext, seconds = 2.4) {
  const length = Math.floor(context.sampleRate * seconds)
  const buffer = context.createBuffer(2, length, context.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2)
  }
  return buffer
}

export function createNightSound() {
  let context: AudioContext | null = null
  let master: GainNode | null = null
  let scheduler = 0
  let closing = 0
  const frogs: Frog[] = Array.from({ length: 8 }, (_, i) => ({
    co: 1040 + Math.random() * 280,
    qui: 1860 + Math.random() * 520,
    pan: Math.random() * 1.7 - .85,
    level: i < 3 ? .05 + Math.random() * .04 : .012 + Math.random() * .02,
    next: 0,
  }))

  const tone = (ctx: AudioContext, out: AudioNode, from: number, to: number, start: number, length: number, level: number) => {
    const osc = ctx.createOscillator()
    const overtone = ctx.createOscillator()
    const envelope = ctx.createGain()
    const overtoneLevel = ctx.createGain()
    osc.type = 'sine'
    overtone.type = 'sine'
    osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(to, start + length)
    overtone.frequency.setValueAtTime(from * 2, start)
    overtone.frequency.exponentialRampToValueAtTime(to * 2, start + length)
    overtoneLevel.gain.value = .12
    envelope.gain.setValueAtTime(.0001, start)
    envelope.gain.exponentialRampToValueAtTime(level, start + .014)
    envelope.gain.setValueAtTime(level, start + length * .55)
    envelope.gain.exponentialRampToValueAtTime(.0001, start + length)
    osc.connect(envelope)
    overtone.connect(overtoneLevel).connect(envelope)
    envelope.connect(out)
    osc.start(start)
    overtone.start(start)
    osc.stop(start + length + .03)
    overtone.stop(start + length + .03)
  }

  const call = (ctx: AudioContext, out: AudioNode, frog: Frog, at: number) => {
    const pan = ctx.createStereoPanner()
    pan.pan.value = frog.pan
    pan.connect(out)
    tone(ctx, pan, frog.co, frog.co * .985, at, .1, frog.level)
    tone(ctx, pan, frog.qui * .93, frog.qui * 1.05, at + .135, .17, frog.level * .92)
    window.setTimeout(() => pan.disconnect(), (at - ctx.currentTime + .6) * 1000)
  }

  const suspendWhenHidden = () => {
    if (!context || closing) return
    if (document.hidden) void context.suspend()
    else void context.resume()
  }

  return {
    get running() { return context !== null && !closing },
    async start() {
      if (context && !closing) return
      if (closing) {
        window.clearTimeout(closing)
        closing = 0
        void context?.close()
      }
      const ctx = new AudioContext()
      context = ctx
      master = ctx.createGain()
      master.gain.value = 0
      master.connect(ctx.destination)

      const reverb = ctx.createConvolver()
      reverb.buffer = reverbImpulse(ctx)
      const wet = ctx.createGain()
      wet.gain.value = .5
      reverb.connect(wet).connect(master)
      const dry = ctx.createGain()
      dry.gain.value = .75
      dry.connect(master)
      const voices = ctx.createGain()
      voices.connect(dry)
      voices.connect(reverb)

      const surf = ctx.createBufferSource()
      surf.buffer = surfBuffer(ctx)
      surf.loop = true
      const lowpass = ctx.createBiquadFilter()
      lowpass.type = 'lowpass'
      lowpass.frequency.value = 480
      const swell = ctx.createGain()
      swell.gain.value = .15
      const lfo = ctx.createOscillator()
      lfo.frequency.value = .085
      const lfoDepth = ctx.createGain()
      lfoDepth.gain.value = .09
      lfo.connect(lfoDepth).connect(swell.gain)
      surf.connect(lowpass).connect(swell).connect(master)
      surf.start()
      lfo.start()

      await ctx.resume()
      master.gain.setTargetAtTime(.8, ctx.currentTime, .6)
      frogs.forEach(frog => { frog.next = ctx.currentTime + .4 + Math.random() * 2.2 })
      scheduler = window.setInterval(() => {
        if (ctx.state !== 'running') return
        const horizon = ctx.currentTime + .5
        for (const frog of frogs) {
          while (frog.next < horizon) {
            call(ctx, voices, frog, Math.max(frog.next, ctx.currentTime + .02))
            frog.next += 1.3 + Math.random() * 2.8
          }
        }
      }, 200)
      document.addEventListener('visibilitychange', suspendWhenHidden)
    },
    stop() {
      if (!context || !master || closing) return
      const ctx = context
      window.clearInterval(scheduler)
      document.removeEventListener('visibilitychange', suspendWhenHidden)
      master.gain.setTargetAtTime(0, ctx.currentTime, .18)
      closing = window.setTimeout(() => {
        void ctx.close()
        if (context === ctx) { context = null; master = null }
        closing = 0
      }, 900)
    },
  }
}
