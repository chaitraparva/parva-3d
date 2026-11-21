# Parva Residence — website

React + Vite + GSAP (ScrollTrigger) + Lenis smooth scroll. Scales up to 4K.

## Run it on your computer

1. Install **Node.js 18 or newer** from https://nodejs.org (LTS).
2. Unzip this folder, open a terminal inside it, then run:

```bash
npm run setup     # installs packages + downloads all photos in 4K (one time)
npm run dev       # opens http://localhost:5173
```

Next time, `npm run dev` is enough.

## Make it yours

| What | Where |
|---|---|
| Text, unit types, areas, amenities, distances, phone, email | `src/data/content.js` |
| Photos | Drop your own render into `public/img/` with the same name (e.g. `tower.jpg`, `lobby.jpg`) and it replaces the stock photo automatically. The list of names is in `src/data/images.js`. |
| Colours & fonts | top of `src/styles.css` |
| Sections (order) | `src/App.jsx` |

The stock photos are from Unsplash and free for commercial use (https://unsplash.com/license).
Replace them with Parva's real renders before launch for the best result.

## Publish

```bash
npm run build     # production files go to /dist
```
Upload `/dist` to Vercel, Netlify, Hostinger or any static host.

The enquiry form shows a thank-you message only. Connect it to your email or CRM before launch.
