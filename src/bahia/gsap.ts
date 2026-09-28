import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)
// The iOS toolbar resizing the viewport must not trigger a full re-measure mid-scroll.
ScrollTrigger.config({ ignoreMobileResize: true })

export { gsap, ScrollTrigger }
