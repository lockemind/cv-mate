# cv-mate — Claude Context

## What this project is

A personal CV/resume management system for Pedro Amaral. It stores structured career data in YAML and generates a GitHub Pages website plus a downloadable PDF from that data.

The core principle: one source of truth (`_data/`), multiple outputs (web, PDF).

## Project structure

```
_data/               # CV content — edit these to update the CV
  profile.yaml       # Name, contact, summary, languages, interests
  experience.yaml    # Work history (chronological, newest first)
  skills.yaml        # Leadership and engineering skills
  education.yaml     # Degrees and thesis
  certifications.yaml # Certs, workshops, bootcamps, publication

_layouts/cv.html     # Jekyll HTML template (GitHub Pages)
assets/css/cv.css    # Styles — shared by web and PDF
assets/cv.pdf        # Pre-generated PDF — commit this when updated
index.html           # Jekyll entry point (just front matter)

preview.mjs          # Local dev server — node preview.mjs → http://localhost:4000
generate-pdf.mjs     # PDF generator — spins up local server, uses Puppeteer

.github/workflows/deploy.yml  # GitHub Actions: builds Jekyll, deploys to Pages
assorted/            # Raw exported Notion CV files — source material, not used in build
```

## Key commands

```bash
npm run preview   # Local web preview at http://localhost:4000
npm run pdf       # Generate assets/cv.pdf (requires Google Chrome)
```

## How the PDF generation works

`generate-pdf.mjs` spins up the same HTTP server as `preview.mjs` on port 4001, then uses Puppeteer with `emulateMediaType("screen")` to navigate to it and export as PDF. This ensures fonts (Inter via Google Fonts) and styles load exactly as in the browser.

Chrome path defaults to `/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`. Override with `CHROME_PATH` env var if needed.

## How GitHub Pages deployment works

Pushing to `main` triggers `.github/workflows/deploy.yml`, which installs Jekyll on Ubuntu, runs `jekyll build`, and deploys to GitHub Pages via the official Actions. No local Ruby needed.

The live site URL is: `https://<username>.github.io/cv-mate/`

The `baseurl` in `_config.yml` is set to `/cv-mate` to match this.

## Data conventions

- `experience.yaml` — entries ordered newest first. Each entry has `company`, optional `client`, `role`, `start`/`end` (format: `YYYY-MM` or `present`), `summary`, optional `technologies` list, optional `projects` list.
- `certifications.yaml` — `type` field distinguishes `Publication` from other types. The publication is rendered in a separate section on the CV.
- `profile.yaml` — `contact` has `email` and `location` only. Phone number intentionally removed (repo is public).

## What to do when updating the CV

1. Edit the relevant file(s) in `_data/`
2. Run `npm run preview` to check it looks right
3. Run `npm run pdf` to regenerate `assets/cv.pdf`
4. Commit and push — GitHub Actions deploys automatically

## Technology choices and why

- **YAML over JSON** — CV data is hand-edited with long text blocks; YAML is more readable and supports comments
- **Jekyll** — natively supported by GitHub Pages, reads `_data/` YAML directly, zero CI config needed
- **Nunjucks** — used in both `preview.mjs` and `generate-pdf.mjs` for templating; mirrors Jekyll/Liquid syntax closely
- **puppeteer-core over puppeteer** — avoids bundling a separate Chrome download; uses the system Chrome installation
- **`emulateMediaType("screen")`** — makes Puppeteer render the PDF as the browser would, keeping print backgrounds and layout intact
- **Server-based PDF generation** — using a real HTTP server (not `setContent()`) so Google Fonts loads correctly; `setContent()` has no origin and silently fails external font requests
- **Inter font** — loaded via Google Fonts for consistent rendering across browser and PDF
- **Repo is public** — intentional, to enable free GitHub Pages hosting. Phone number removed from all files as a result.
