# Prometheus

Abhinav Nadipelly's portfolio. Plain HTML, CSS and JavaScript, no build step.

Run it locally:

```sh
python3 -m http.server 5173
```

Then open http://localhost:5173.

- `content.js` holds all the text and project data.
- `assets/fig-*.html` are the isometric figures, built from `tools/fig-*.mjs` with the
  [Anatomy](https://github.com/wheresryan22/anatomy) kit (MIT, in `tools/anatomy`). Rebuild one with `node tools/fig-station.mjs`.
- WebGL: `hero-fx.js` (halftone hero), `portrait.js` (ASCII portrait), `globe.js` (three.js globe).
