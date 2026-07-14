# Certificate Press v2

A one-page web app that puts names — and any other changing details — onto your
own design, and outputs print-ready PDFs. Runs **entirely in the visitor's
browser**: no server, no accounts, no uploads. Fully self-contained (libraries
vendored in `vendor/`), so it has zero external dependencies and works offline.

## What it does

- **Your artwork** — load any design as a PDF (export from Illustrator, Canva,
  Figma…). Certificates, badges, invitations, place cards, letters, tickets.
- **Multiple fields** — Name, Workshop, Date, Seat, ID… each field reads one
  column of your data and is dragged into place on a live proof.
- **Multi-column paste** — paste straight from a spreadsheet (tabs) or CSV;
  optional heading row.
- **Per-field styling** — font (built-in or upload .ttf/.otf), weight, size,
  colour, left/centre/right alignment, and an auto-shrink limit for long values.
- **Real proofing** — page through every row on the preview, jump to the
  longest entry, and get warned about rows that shrink noticeably.
- **Two exports** — one merged PDF (for the printer) or a ZIP of individual
  per-person PDFs (for emailing/distribution), named from the first field.
- **Projects** — save everything (artwork, fonts, data, placements) to a single
  JSON file and reopen it next event.
- **Sample project** — one click loads a working demo to explore.

## Publish on GitHub Pages

1. Put these files at the **root** of a repo (keep `vendor/` beside `index.html`).
2. **Settings → Pages → Build from a branch → main → /(root)**.
3. Share the URL.

`index_v1.html` is the previous single-field version, kept for reference.

## Printing

Output pages match the artwork size (or the override you choose). Print at
**100% / Actual size** — never “fit to page”.

## Under the hood

`pdf.js` renders the proof; `pdf-lib` (+fontkit) embeds fonts and stamps each
row onto a copy of the template page; `JSZip` packs individual files. All
client-side; data never leaves the machine.
