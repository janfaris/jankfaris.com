type ProjectCopy = {
  category: string
  tagline: string
  description: string
  linkLabel: string
}

export type IslandProject = ProjectCopy & {
  name: string
  image: string
  url: string
  color: string
  number: string
  es?: ProjectCopy
}

export const islandProjects: IslandProject[] = [
  {
    name: 'Wandr', category: 'TRAVEL · WEB APP', tagline: 'A little further.', description: 'Itineraries, flights, and local events in one AI-assisted trip plan.', image: '/demos/wandr.jpg', url: 'https://wandrtravelai.com', linkLabel: 'Explore Wandr', color: '#258cd6', number: '01',
    es: { category: 'VIAJES · APP WEB', tagline: 'Un poco más lejos.', description: 'Itinerarios, vuelos y eventos locales en un plan de viaje asistido por IA.', linkLabel: 'Explorar Wandr' },
  },
  {
    name: 'Janga', category: 'SOCIAL · IOS APP', tagline: 'Find your people.', description: 'Find where to hang out. Built for real connections, and shipped on the App Store.', image: '/demos/janga.jpg', url: 'https://apps.apple.com/us/app/janga/id6744530407', linkLabel: 'View on the App Store', color: '#2b8d84', number: '02',
    es: { category: 'SOCIAL · APP PARA IOS', tagline: 'Encuentra a tu gente.', description: 'Descubre dónde pasarla bien. Creada para conectar con otras personas y publicada en el App Store.', linkLabel: 'Ver en el App Store' },
  },
  {
    name: 'demotape', category: 'DEVELOPER TOOL · OPEN SOURCE', tagline: 'From script to screen.', description: 'An open-source CLI that turns a reusable JSON script into a polished demo video.', image: '/demos/demotape.jpg', url: 'https://github.com/janfaris/demotape', linkLabel: 'Explore on GitHub', color: '#446c9a', number: '03',
    es: { category: 'HERRAMIENTA · CÓDIGO ABIERTO', tagline: 'Del script a la pantalla.', description: 'Un CLI de código abierto que convierte un script JSON reutilizable en un video demo listo para compartir.', linkLabel: 'Explorar en GitHub' },
  },
]
