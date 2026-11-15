# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A clickable MVP prototype of TATOOA, a two-sided marketplace that connects tattoo clients with tattoo artists. It is a university project (Group 12: Tomer Barak, Shoham Atias, Shiri Shalal), built from their product spec (PRD). The UI is in Hebrew, right-to-left (`<html lang="he" dir="rtl">`).

The prototype covers the spec's MVP "Must Have" scope: simulating a sketch on a 2D body image, a basic price estimate, and sending a quote request (lead) to artists. It also shows the artist side receiving and handling that lead.

## Build / run

There is no build step, package manager, linter or test suite. Open `index.html` in a browser. The only external dependency is Google Fonts (Heebo). Everything else is vanilla HTML/CSS/JS.

## Files

- `index.html`: all screens as `<section class="screen" data-screen="…">`, the top nav, the 4-step stepper, and the footer.
- `styles.css`: all styling. Colors are CSS custom properties on `:root` (`--ink`, `--paper`, `--card`, `--accent` red, `--gold`, `--ok`, `--warn`, `--muted`, `--line`). Reuse them instead of hard-coding colors.
- `app.js`: one IIFE with these sections: DATA, STATE, HELPERS, LEAD STORAGE, DRAWING, STUDIO, PRICE, ARTISTS, REQUEST, ARTIST INBOX, ROUTER, INIT.
- `README.md`: a short Hebrew description for the team.

## How app.js works

- **Routing:** hash routes `#/home`, `#/studio`, `#/price`, `#/artists`, `#/request`, `#/done`, `#/artist`. `route()` runs the screen's `enter…()` function, toggles `.active` on the section, and updates the nav and stepper. `#/request` needs `S.artistId`, and `#/done` needs `S.lastLeadId`; otherwise they redirect.
- **State:** a single object `S` (body source/kind/tone, cover-up, sketch id, style, position `x`/`y` as 0–1 fractions, `scale` as a fraction of image width, `rot` in degrees, `opacity`, `placement`, `areaCm`, plus price form values and the chosen artist).
- **Simulation canvas** (`#stage`, 800×1000): `compose()` draws the body (`drawCover`), then the sketch with `globalCompositeOperation='multiply'` so ink sits on skin, then the TATOOA watermark (`drawWatermark`). The same function makes share images and lead snapshots.
  - Built-in bodies (`BODIES`) are SVG path strings drawn with `Path2D`, with shading and skin tones (`TONES`). Cover-up mode adds a faded "old tattoo".
  - Built-in sketches (`SKETCHES`) are path data on a 200×200 box, rendered by `renderSketch(def, style)`. The style changes line width and fills (`WIDTH_BY_STYLE`, colors only in the `color` style). Using `Path2D` instead of SVG images keeps the canvas untainted, so `toDataURL` works.
  - Uploaded images are downscaled. Uploaded sketches go through `removeWhite()`.
  - Gestures: one-pointer drag, two-pointer pinch to scale and rotate, mouse wheel to scale, and keyboard (arrows, `+`/`-`, `[`/`]`).
  - Real size in cm = `S.scale × S.areaCm`, where `areaCm` is the user's estimate of how wide the photographed area is.
- **Pricing** (`estimate()`): `mid = max(minimum, (base + area × perCm2[style] × coverage) × placement × complexity × color × coverUp)`, with the range `mid × spread`, rounded to ₪50. All numbers are in `PRICING`. A budget below the low end shows a warning and a suggested smaller size.
- **Matchmaking:** `rankedArtists()` scores the demo `ARTISTS` by style match, budget fit, cover-up specialty and rating. An artist's quote is `max(min, mid × factor)`.
- **Deposit:** `depositOf(q)` = 15% (`PRICING.deposit`). The remaining 85% is paid at the studio.
- **Leads:** `Store` saves them in `localStorage` under `tatooa.leads.v1`, with every access in try/catch and an in-memory fallback. A lead holds the client details, the price details, a watermarked JPEG snapshot (`sim`) and a clean PNG stencil (`stencil`).
- **Artist inbox statuses:** `new` → (`countered` →) `approved` → `booked`, or `declined`. The clean stencil can only be downloaded once the status is `booked` (deposit cleared). That is the spec's watermark lock-in.

## RTL and mobile

- Use logical properties (`margin-inline-start`, `inset-inline-start`); "start" is on the right.
- Canvas text uses `direction='rtl'`.
- There is one breakpoint, `max-width:900px`, where every grid collapses to one column and the sticky stage and price panels become static.
- The canvas has `touch-action:none` so drag and pinch work on phones.
- Watch class names: `.lead` is the inbox lead card, and the home intro paragraph is `.intro`.

## Redesign in progress (Stitch UX/UI)

The team's UX/UI lives in the Stitch project "AI Tattoo Visualizer Platform" (id `1920239853417980523`), which has 8 Hebrew mobile screens. Read them with the Stitch MCP (`list_screens`, `download_file`). The designs use the name "InkSphere / דיותא", but the app is called **TATOOA**, so keep that name.

- `redesign-wip/index.html` is the new markup for those screens. It does **not** have its own `styles.css` or `app.js` yet, so it doesn't run. The root `index.html` is still the working version.
- Design tokens: background `#111319`; surfaces `#0c0e14` / `#191b22` / `#1d1f26` / `#282a30` / `#33353b`; text `#e2e2ea`, muted `#b9cacb`; cyan accent `#00f2fe` (text on it `#00373a`); pink `#ff4a8d`; gold `#ffba38`. Font: Rubik. Icons: Material Symbols Outlined. Layout: mobile-first, fixed top bar with an artist/client toggle, 5-tab bottom bar.
- Screen map:
  - 1 Discovery feed `#/home`
  - 2 Create sketch `#/create` (generator / upload / cover-up)
  - 3 AR camera / body photo `#/scan`
  - 4 Visualizer `#/studio` (sliders, 5-year fading, sharing)
  - 5 Pricing + matchmaking `#/match`
  - 6 Artist profile + booking with deposit `#/artist`
  - 7 CRM dashboard `#/crm`
  - 8 Lead detail `#/lead`
  - plus `#/done` and `#/profile`
- To finish it, write `redesign-wip/styles.css` and `redesign-wip/app.js`. Reuse the logic in the root `app.js` (`Store`, `compose`, `renderSketch`, `builtinBody`, `estimate`, `rankedArtists`, `depositOf`, the gestures), test the flow, then move the files to the root.

## Stitch project for TATOOA

- Project "TATOOA – UX/UI (PRD, Group 12)" (id `5979183669137206924`) has the design system **TATOOA Neon Ink** (`assets/1584944931328499491`): dark, cyan `#00f2fe`, pink `#ff4a8d`, gold `#ffba38`, Rubik, roundness 12.
- Generating screens through the Stitch MCP timed out every time and produced no screens, so the screens are made by hand in the Stitch UI.
- `stitch-prompts.md` holds the 8 copy-ready prompts, one per PRD screen, plus the table of prototype links between screens.

## Content caveat

All artists (names, studios, ratings), the pricing table and its multipliers are **demo placeholders** made up for the prototype. Payments, license verification, health forms and AR/LiDAR are mocked or shown as "coming soon". Don't present them as real. Replace the pricing table when the group has real data (the planned survey of about 50 artists).
