# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A clickable MVP prototype of TATOOA, a two-sided marketplace that connects tattoo clients with tattoo artists. It is a university project (Group 12: Tomer Barak, Shoham Atias, Shiri Shalal), built from their product spec in `PRD.md`. The UI is in Hebrew, right-to-left (`<html lang="he" dir="rtl">`).

The prototype covers the spec's MVP "Must Have" scope: simulating a sketch on a 2D body image, a basic price estimate, and sending a quote request (lead) to artists. It also shows the artist side receiving and handling that lead.

## Product spec (PRD)

`PRD.md` is the source of truth for product decisions. Read the relevant section before adding or changing a feature. This is a summary of what the code must respect.

- **Product:** a two-sided marketplace. Clients (B2C) use it free (freemium). Artists (B2B) join free, and the platform takes a **15% commission that is also the appointment deposit**. The client pays the other 85% at the studio. There is an optional artist subscription (calendar, lead filtering, promotion, deposit clearing).
- **Scope (PRD §4):**
  - **Must Have:** 2D sketch simulation on a photo, a basic price estimate, and sending a lead to artists.
  - **Nice to Have:** LiDAR/video mapping, skin-tone analysis, and the 5-year fading calculator. Show these as "coming soon" unless asked to build them.
  - **Out of Scope for MVP:** a full calendar CRM, in-app deposit clearing and automated license verification. The prototype only mocks them.
  - **Contradiction in the PRD:** in-app deposit clearing is Out of Scope (§4), but it is also the lock-in mechanism (§2, §7). The prototype simulates it. Never add real payment processing.
- **Product rules the UI must keep:**
  - The client never pays more than the tattoo price. The deposit is part of the price, not a fee on top (§7, Platform Leakage).
  - **Watermark lock-in:** sketches and simulations carry the TATOOA watermark until the deposit is cleared. Only then does the artist get the clean stencil.
  - **Tattoo Insurance** (free touch-ups) applies only to bookings made through the platform.
  - **Legal:** legal-age (18+) confirmation, a medical disclaimer (the simulation is not a medical commitment and doesn't replace advice on ink allergies or scars), and an IP notice (AI sketches based on references are for inspiration only).
  - **Privacy:** any future body video or photo flow must blur intimate areas and treat body images as sensitive data.
- **User journeys (§5.2, §5.3), mapped to the screens:**
  - **Client:** style and inspiration (prompt, references, cover-up scan) → body photo or scan → simulation (skin-tone ink, fading) → social share → price estimate with a budget check → 3–5 matched local artists → booking request and deposit. In the root app that is `#/studio` → `#/price` → `#/artists` → `#/request` → `#/done`. In the redesign it is `#/create` → `#/scan` → `#/studio` → `#/match` → `#/artist`.
  - **Artist:** verified profile (portfolio, specialty, area, ratings) → a lead arrives as a "client portfolio" (simulation, size, style, skin tone, budget) → approve, counter or decline → health declaration before the visit and aftercare after it. In the root app that is `#/artist`. In the redesign it is `#/crm` → `#/lead`.
- **User stories (§5.1), to use as manual test scenarios:**
  1. A first-timer uploads a forearm photo and places a flower sketch to check its size and placement.
  2. A cover-up client overlays sketches on an old tattoo to see if it is fully covered and doesn't look like a black blob.
  3. An artist gets a lead that already has the placement, size and budget, and filters it against their own prices.
- **Pricing (§6):** for the pilot, the prices come from manually collected price lists and a survey of about 50 artists. Later they come from an ML-updated database with anomaly detection. The engine warns when a budget is unrealistic.
- **Pilot KPIs (§8)**, the funnel to instrument if analytics are added:
  - Try-On rate (finished simulations ÷ users): 40%
  - Lead rate (leads ÷ simulations): 15%
  - Booking rate (deposits ÷ leads): 5%
  - K-Factor from social shares: 1.1
- **Risks (§7):** cold start (free trial for top artists, the watermarked simulator as a viral tool), platform leakage, IP, regulation and medical liability, and simulation realism (build an early PoC of the distortion on different body parts and collect artist feedback).

## Build / run

There is no build step, package manager, linter or test suite. Open `index.html` in a browser. The only external dependency is Google Fonts (Heebo). Everything else is vanilla HTML/CSS/JS.

## Files

- `index.html`: all screens as `<section class="screen" data-screen="…">`, the top nav, the 4-step stepper, and the footer.
- `styles.css`: all styling, in the "Atelier" look (see below). Colors, radius and fonts are CSS custom properties on `:root` (`--ink`, `--paper`, `--paper-2`, `--card`, `--accent` oxblood red, `--ok`, `--warn`, `--muted`, `--line`, `--serif`, `--display`). Reuse them instead of hard-coding values. `--gold` is a legacy name that now equals the accent.
- `app.js`: one IIFE with these sections: DATA, STATE, HELPERS, LEAD STORAGE, DRAWING, STUDIO, PRICE, ARTISTS, REQUEST, ARTIST INBOX, ROUTER, INIT.
- `README.md`: a short Hebrew description for the team.
- `PRD.md`: the group's full product spec, in English.

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

## "Atelier" design (branch `feature/ux-redesign`)

The root app now follows the team's newer UX/UI screens (7 PNGs, kept outside the repo). It is a light editorial look, not the dark neon Stitch direction below.

- **Look:** off-white paper (`--paper`), ink black, oxblood red accent (`--accent`), sharp corners (`--radius:2px`), serif Hebrew headings (`Frank Ruhl Libre`), condensed Latin wordmark and numerals (`Bebas Neue`, `--display`), body in `Heebo`. Small tracked-out English labels (`.eyebrow`, `.mini-label`) sit above headings. Black primary buttons that turn red on hover, red `.btn.accent` for promos.
- **Screens:** home (hero, 4-step `.flow`, `.callout`, clients/artists cards), studio, price, artists, request, done, artist inbox, plus two static pages with no JS: `#/cover` (Cover-Up how-to) and `#/process` (4 steps, `.pillars`, FAQ with `<details>`). The router already handles any `.screen[data-screen]`, and the header `data-nav` links mark the active page.
- **Photos:** the design uses black-and-white photography that is not in the repo. Placeholders (`.ph`) mark where photos go, and the hero canvas is greyscaled with CSS. Don't invent people or studio facts.
- **Copy:** the design mock-ups contain made-up claims (years of experience, precision in mm, ISO sterility standards, a named founder). They were **not** copied. Facts on the pages come from `PRD.md` (15% deposit, 85% in the studio, 3-5 artists, free simulation). Keep it that way.
- **Gotchas:** `.card.done` (not `.done`) is the confirmation card, because the stepper also gets a `done` class. The router focuses each screen's `h1` (`tabindex="-1"`), so its outline is hidden.
- **Not built from the design:** the 3D / anatomical studio, "calibration engine" panels, match-percentage rings and AR/LiDAR widgets. They map to features that are "coming soon" in the PRD.

## Older redesign (Stitch dark UI), superseded by the Atelier design


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
