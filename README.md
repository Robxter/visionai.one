# visionai.one — frontend

The public **VISION** website. Static HTML/CSS/JS (no build step), deployed via
GitHub Pages to the custom domain `visionai.one` (see `CNAME`).

> Private repository — not for public distribution.

## Structure

```
index.html              English (root)
es/ · de/ · fr/         Localized pages (Spanish, German, French)
dependencies/css/styles.css   Design system (ink theme, components)
dependencies/css/fonts.css    Self-hosted @font-face (Fraunces + Hanken Grotesk)
dependencies/fonts/           Local woff2 files (latin + latin-ext subsets)
dependencies/js/script.js     Chat widget, lead form, scroll reveal, nav state
assets/                 Logos, favicons, manifest
CNAME                   Custom domain
```

## Paths & fonts

- **Relative paths everywhere.** All asset/page links are relative (e.g.
  `dependencies/...`, `../assets/...`), so the site works opened directly via
  `file://`, from a subpath, or from the domain root on GitHub Pages.
- **Self-hosted fonts.** Fraunces and Hanken Grotesk are bundled in
  `dependencies/fonts/` and declared in `dependencies/css/fonts.css` — no Google
  Fonts CDN dependency, so typography renders even offline or if the CDN is blocked.

## Design

Premium editorial-tech: deep ink canvas with film grain, a single luminous
mint-teal accent, **Fraunces** display serif paired with **Hanken Grotesk**.
Sections map to the company strategy — services/offers, the assistant's
capabilities, the staged roadmap, and a lead-capture contact form.

## Backend connection

`dependencies/js/script.js` talks to the API at `API_BASE` (default
`https://api.visionai.one`):

- `POST /chat` — powers the chat widget (session-aware).
- `POST /lead` — powers the contact form.

If the backend URL changes, update `API_BASE` at the top of `script.js`.

## Local preview

It's static and uses relative paths, so you can simply open `index.html`
directly in a browser. To preview it under a server instead:

```bash
python -m http.server 5500
# then visit http://localhost:5500
```

## Editing copy across languages

The four pages share the same structure; translate the text in place. UI strings
inside the chat widget live in the `I18N` map in `script.js`, keyed by the
`data-lang` attribute on `<html>`.
