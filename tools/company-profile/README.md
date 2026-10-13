# Company profile PDF

Source for `rr-teen-set-solution-company-profile.pdf` (repo root), the 8-page A4 brochure linked from
`company-profile.html`. The PDF is generated from `brochure.html`; edit the HTML, rebuild, commit both.

## Rebuild

```sh
cd tools/company-profile
npm install                      # puppeteer-core
CHROME_PATH=/path/to/chrome node build.js      # -> build/profile-raw.pdf  (add HEADLESS=shell for chrome-headless-shell)
pip install pypdf                # and qpdf must be on PATH
python3 finish.py                # -> ../../rr-teen-set-solution-company-profile.pdf (metadata + fast web view)
```

`build.js` stops with an error if any page's content overflows its A4 box, so nothing is clipped silently.

## Before you publish a new version

1. **Facts**: every statement comes from `knowledge.json` (the chatbot's source of truth) or the website. If a
   fact changes there, change it here too. The document deliberately lists **no prices** (they go stale in a PDF).
2. Update the date ("October 2026") on page 8 and in `finish.py` / `company-profile.html` (`Updated`, size, `datePublished`).
3. Re-render the cover for the download page: `pdftoppm -r 150 -f 1 -l 1 -png ...` then save as
   `images/company-profile-cover.webp` and `.jpg` (560 px wide).
4. Photos in `img/` are resized copies of real project photos from `images/` (`project-0xx.jpg`). Do not use the
   generic stock-style images (`roofing-sheet-installation-workers`, `steel-shed-foundation-construction`,
   `tin-shed-roof-repair-before-after`) in a document that presents work as ours.
5. The QR code (`img/qr-book-visit.svg`) points to `/book-site-visit.html`. Re-scan a printout after any change.

## Files

- `brochure.html` — the document (print CSS, `@page` A4, one `.page` per sheet)
- `fonts/` — Bebas Neue and Nunito (same families as the website), SIL Open Font License, licences included
- `img/` — logo, photos (compressed) and the QR code
- `build.js`, `finish.py` — build scripts
