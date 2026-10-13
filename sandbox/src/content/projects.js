// Hard-coded, curated projects for Parkington Programs
/**
 * @typedef {Object} Project
 * @property {string} slug
 * @property {string} title
 * @property {string} tagline
 * @property {string[]} users
 * @property {string[]} stack
 * @property {string[]} highlights
 * @property {string[]} body
 * @property {string} [cardImage]
 * @property {string} [heroImage]
 * @property {{ src: string, alt: string, caption?: string }[]} [gallery]
 * @property {string[]} [longform]
 * @property {{ title: string, paragraphs: string[] }[]} [sections]
 * @property {string[]} [nextSteps]
 */

/** @type {Project[]} */
export const projects = [
  {
    slug: 'parkington-programs',
    title: 'Parkington Programs Website',
    tagline: 'My repository of all my projects and ideas related to programming or urban planning or anything else I feel like.',
    users: ['People I want to impress', 'Myself', 'People curious to my creative process'],
    stack: ['Vue 3 + Vite', 'Supabase auth', 'Custom SVG frame engine', 'Tailwind utility layer'],
    cardImage: '/projects/parkington-programs/card.webp',
    heroImage: '/projects/parkington-programs/hero.webp',
    highlights: [
      'Inspired by a combination of old newspapers, old banknotes, and my dissatisfaction with modern web design trends.',
      'The site uses procedurally generated SVG frames that are adaptive to different screen sizes while understanding that the content will be static.',
      'Site developed out of me not wanting to upload my content to GitHub when my projects aren not finished but still wanting to share my ideas with the world.',
    ],
    body: [
      'The way I originally came up with the design was when I was retaking my critical thinking class and I didn\'t want to just redo all the assignments so I asked my teacher if I could create this website and just do a bunch of writing on things that normally I wouldn\'t want to talk about in class and I just really liked the idea of the look of the website and sometimes I have a lot to write, which this website lends itself to showing off.',
      'One of my initial ideas that I liked a lot was using tileable SVGs in order to create ornate designs. I initially just had a tileable border on the left side and a tileable paper texture, which was good start, but changing the design to have a truly all encompassing frame design has been tough.',
      'I did almost no coding on this project other than tweaks, I almost entirely relied on code from AI by using ChatGPT and the Codex add on in VS Code because I just don\'t have the time to learn everything.',
    ],
    nextSteps: [
      'Continue tweaking the frame rendering logic and design.',
      'Add more interactive elements and have more interesting things to see on the page.',
    ],
    gallery: [
      {
        src: '/projects/parkington-programs/1.webp',
        alt: '(Placeholder) Studio layout sketch',
        caption: '(Placeholder) Framed layout mockup.',
      },
      {
        src: '/projects/parkington-programs/2.webp',
        alt: '(Placeholder) Frame engine layers',
        caption: '(Placeholder) Ornament layering reference.',
      },
    ],
    longform: [
      '(Placeholder) Draft space for a deeper walk-through of the site scaffolding and ledger feel.',
      '(Placeholder) Notes about how the frame engine adapts to different page layouts without losing the parchment tone.',
      '(Placeholder) Room for lessons learned from combining static content with ornate chrome.',
    ],
  },
  {
    slug: 'vectorspace',
    title: 'VectorSpace',
    tagline: 'A spatial notebook for embeddings and adjacency experiments.',
    users: ['Urban research teams', 'Data librarians', 'Analysts mapping policy docs to place'],
    stack: ['Python embeddings service', 'Postgres + pgvector', 'Vue 3 interface', 'MapLibre sandbox'],
    cardImage: '/projects/vectorspace/card.webp',
    heroImage: '/projects/vectorspace/hero.webp',
    highlights: [
      'Pipelines that ingest documents, map tiles, and notes into a single vector index.',
      'Adjacency explorer that shows clusters, edge cases, and outliers with quick filters.',
      'Exportable views for workshops so teams can annotate together without raw SQL.',
    ],
    body: [
      'VectorSpace is a workbench for seeing how ideas sit next to each other once they are embedded. It blends text, spatial tiles, and metadata into one canvas.',
      'The goal is to let analysts pivot across tags, bounding boxes, and time without dropping to the command line, while still keeping the codex feel of the studio site.',
      'Outputs are meant for facilitation: clean cards and exports that work on printouts, slides, or lightweight share links.',
    ],
    nextSteps: [
      'GPU-backed batch ingestion and slimmer client bundles for large corpora.',
      'Add scenario presets so facilitators can load a workshop view in one click.',
    ],
    gallery: [
      {
        src: '/projects/vectorspace/1.webp',
        alt: '(Placeholder) Embedding cluster map',
        caption: '(Placeholder) Spatial adjacency spread.',
      },
    ],
  },
  {
    slug: 'euphorate',
    title: 'Euphorate',
    tagline: 'Guided check-ins for teams that need calm, short rituals.',
    users: ['Small orgs and studios', 'Facilitators running workshops', 'Care teams doing weekly calibrations'],
    stack: ['Vue 3 front-end', 'Supabase auth and storage', 'Timed prompt engine', 'Email and SMS hooks'],
    cardImage: '/projects/euphorate/card.webp',
    heroImage: '/projects/euphorate/hero.webp',
    highlights: [
      'Prompt ladders that stay brief: one reflection, one action, one follow-up.',
      'Session templates that can be replayed or remixed without new tooling.',
      'Gentle reminders via email or SMS so teams actually close the loop.',
    ],
    body: [
      'Euphorate is a lightweight ritual kit. It asks teams to take five minutes, answer a focused prompt, and log a single action they will try before the next session.',
      'It keeps the visuals restrained so it can sit next to the studio aesthetic without feeling like a separate product.',
    ],
    nextSteps: [
      'Add facilitator dashboards to see completion without exposing responses.',
      'Tighten the reminder cadence to avoid notification fatigue.',
    ],
  },
  {
    slug: 'stacked-paper-map',
    title: 'Stacked Paper Map (Sandbox)',
    tagline: 'A paper-textured map that stacks tiles, sketches, and notes.',
    users: ['Field researchers', 'Workshop participants', 'Curious citywalkers'],
    stack: ['MapLibre', 'Canvas overlay for doodles', 'Vue 3 controls', 'Custom paper shader'],
    cardImage: '/projects/stacked-paper-map/card.webp',
    heroImage: '/projects/stacked-paper-map/hero.webp',
    highlights: [
      'Stack metaphor with lift shadows so each layer reads like a sheet of paper.',
      'Drop-in overlays for hand-drawn notes, markers, and traced routes.',
      'Keyboard and pen-friendly controls for quick toggles during a walk.',
    ],
    body: [
      'Stacked Paper Map is a sandbox to see if a map can feel like an analog stack of paper. Each layer can be lifted, reordered, or annotated without losing the parchment look.',
      'It is meant for in-the-field use where mouse precision is limited and quick captures matter.',
    ],
    nextSteps: [
      'Improve mobile performance when several canvas layers are active.',
      'Add a print-to-PDF layout that preserves the stacked look.',
    ],
    gallery: [
      {
        src: '/projects/stacked-paper-map/1.webp',
        alt: '(Placeholder) Layer stack mock',
        caption: '(Placeholder) Elevation sketch for paper tiles.',
      },
      {
        src: '/projects/stacked-paper-map/2.webp',
        alt: '(Placeholder) Field doodle overlay',
        caption: '(Placeholder) Quick pen overlay concept.',
      },
    ],
    sections: [
      {
        title: '(Placeholder) Field notes',
        paragraphs: ['(Placeholder) Draft space for on-the-walk observations tied to stacked layers.'],
      },
    ],
  },
  {
    slug: 'city-guesser',
    title: 'City Guesser Game',
    tagline: 'A fast, local-first street guessing game for workshops.',
    users: ['Students', 'Workshop attendees', 'Anyone testing their city sense'],
    stack: ['Vue 3', 'Lightweight API layer', 'Static image packs', 'Scoreboard module'],
    cardImage: '/projects/city-guesser/card.webp',
    heroImage: '/projects/city-guesser/hero.webp',
    highlights: [
      'Snappy rounds with hints that feel like marginalia scribbles instead of loud banners.',
      'Scoreboard that fits into the codex chrome without bright gamified UI.',
      'Content packs stay local so facilitators can swap in their own neighborhoods.',
    ],
    body: [
      'City Guesser Game is a teaching toy: drop a street photo, add two hints, and let people guess the spot. Everything stays lightweight so it can run offline in a room.',
      'The UI keeps the studio framing so the game can sit inside workshops without clashing with other materials.',
    ],
    nextSteps: [
      'Add round presets for different difficulty levels.',
      'Layer in accessibility cues for low-vision players without cluttering the frame.',
    ],
    gallery: [
      {
        src: '/projects/city-guesser/1.webp',
        alt: '(Placeholder) Guessing round card',
        caption: '(Placeholder) Draft layout for a street prompt.',
      },
      {
        src: '/projects/city-guesser/2.webp',
        alt: '(Placeholder) Scoreboard sketch',
        caption: '(Placeholder) Concept for calm scoreboard panel.',
      },
    ],
  },
  {
    slug: 'meal-prep-builder',
    title: 'Meal Prep Website',
    tagline: 'A weekly prep planner that balances budget, time, and macros.',
    users: ['Busy households', 'Students cooking for the week', 'Teams planning shared meals'],
    stack: ['Vue 3', 'Supabase recipes store', 'Planner grid layout', 'Shopping list exporter'],
    cardImage: '/projects/meal-prep-builder/card.webp',
    heroImage: '/projects/meal-prep-builder/hero.webp',
    highlights: [
      'Grid-based planner that keeps prep steps visible while you swap meals.',
      'Auto-generated shopping lists with portion scaling for households.',
      'Recipe cards stay minimal and legible on mobile counters.',
    ],
    body: [
      'Meal Prep Website is a straightforward planner: choose anchor recipes, set portions, and export a list. The interface keeps the same muted palette as the rest of the studio.',
      'It is intentionally quiet so it can live on a tablet in a kitchen without feeling like an app advertisement.',
    ],
    nextSteps: [
      'Hook in pantry tracking so unused items roll into the next week.',
      'Add drag-and-drop to rearrange prep order without losing timers.',
    ],
  },
]

export function getProjectBySlug(slug) {
  return projects.find(project => project.slug === slug)
}
