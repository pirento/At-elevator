# A T Elevator — Corporate Website

Single-page corporate website for **A T Elevator**, Lucknow — *a venture of Venturecore Solutions Private Limited*.

Built with **HTML5, CSS3 and vanilla JavaScript only**. No frameworks, no build step. Fonts load from Google Fonts (Manrope + Inter); icons are an inline SVG sprite inside `index.html`, so they work offline.

## Project structure

```
A-T-Elevator/
├── index.html          All 13 sections + icon sprite + modal + lightbox
├── css/style.css       Design tokens, components, sections, responsive rules
├── js/script.js        All interactions (no dependencies)
├── preview.html        Single-file preview (everything embedded) — share this one file
├── assets/
│   ├── images/         Logo, brochure images and brochure page thumbnails
│   ├── brochure/A-T-Elevator-Brochure.pdf
│   └── icons/favicon.png
├── tools/build_preview.py   Rebuilds preview.html after you edit the site
└── README.md
```

## Run locally with VS Code Live Server

1. Unzip the folder and open it in VS Code: **File → Open Folder… → A-T-Elevator**.
2. Install the **Live Server** extension (by Ritwick Dey) from the Extensions panel (`Ctrl+Shift+X`).
3. Right-click `index.html` → **Open with Live Server** (or click **Go Live** in the status bar).
4. The site opens at `http://127.0.0.1:5500/index.html` and reloads on every save.

Opening `index.html` by double-clicking also works, but Live Server is recommended.

## What's included

| Feature | Where |
|---|---|
| Navbar: transparent → white on scroll, active-section highlight, **Elevators mega menu** (hover, click or keyboard), mobile drawer | `script.js` → Navbar, Mega menu, Mobile menu |
| Hero shaft drawing: floor display and lift car move together | `script.js` → Hero |
| **Services explorer** — tabbed panels (arrow keys work) | `script.js` → Services explorer |
| Elevator cards and mega-menu items → details modal → "Enquire" pre-fills the form | `ELEVATORS` object in `script.js` |
| **Door viewer** — pick any of 9 doors, enlarge in a lightbox (arrows, swipe, Esc) | `script.js` → Door viewer |
| Indicative shaft-size table, AMC comparison table | HTML tables in Technology and AMC sections |
| Enquiry form with validation, loading state → Email + WhatsApp | `script.js` → Enquiry form |
| Download Brochure buttons with loading/confirmation toast | `.js-brochure` links + `script.js` → Brochure download |
| Scroll progress, back-to-top, scroll reveal (respects *reduce motion*), skip link | `script.js` / `style.css` |

## Design system (v3)

Defined as tokens at the top of `css/style.css`:

- **Colour:** navy for structure, one accent (electric blue `#2186F3`) for actions and state, a cool off-white surface, hairline borders. No gradient text, no glass effects.
- **Type:** Manrope for headings (hero 56px max, section titles 40px max), Inter for body. Uppercase labels at 12.5px.
- **Shape:** 8px radius on controls, 12px on large surfaces. Shadows only on floating layers (menus, modal).
- **Motion:** short fades; movement only where it explains something (lift car, MRL diagram, menus, tabs).
- **Layouts:** each section has its own composition — split hero, capabilities strip, asymmetric About with fact sheet, tabbed services, product grid, door viewer, dark machines comparison, safety datasheet, AMC comparison table, tiled "Why", brochure band, contact.

## Brochure

The PDF lives at `assets/brochure/A-T-Elevator-Brochure.pdf`. Every button with class `js-brochure` downloads it. To update the brochure, replace that file with the same name (and update the "8 pages · 2.4 MB" text in `index.html` if it changes).

## Preview file

`preview.html` is the whole website in one file (CSS, JS, images and the brochure embedded, ~4.4 MB). Send it on WhatsApp/email; it opens in any browser, even offline (fonts and map need internet).

After editing the site, rebuild it with:

```
python3 tools/build_preview.py
```

## Enquiry form — how it works (no database)

This is a frontend-only site. **Nothing is stored.** When the visitor clicks **Request a Callback**:

1. Fields are validated (name, Indian 10-digit mobile, optional email, city, building type, elevator type, floors).
2. A formatted message is built and WhatsApp opens (`wa.me`) addressed to **+91 87950 02145** (Aman Tiwari).
3. The visitor presses *Send* in WhatsApp.

**Email:** at the same time, every enquiry (all fields + time + page) is emailed to **amantiwariies@gmail.com** through [FormSubmit](https://formsubmit.co) — free, no account, no backend.

- **One-time activation:** the very first enquiry from the live site sends an *"Activate Form"* email to that inbox. Click it once; from then on every enquiry arrives as an email (check Spam/Promotions the first time).
- To change the address, edit `ENQUIRY_EMAIL` at the top of `js/script.js` (and activate again).
- Activation needs the site opened from a real web address (Vercel/Netlify/hosting), not a `file://` double-click.

To change the receiving number, edit `WHATSAPP_NUMBER` at the top of `js/script.js` (country code, no `+`).

### Connecting a backend (optional, later)

In `js/script.js`, find the `BACKEND HOOK` comment inside the form submit handler and add:

```js
fetch("https://your-api.example.com/enquiries", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(d)
});
```

Options: a small Node/Express API, a serverless function (Vercel/Netlify), or a form service such as Formspree / Google Apps Script. Validate again on the server.

## Replacing the photos

The product photos come from the brochure and are low resolution. To replace them:

1. Generate or shoot new photos. `tools/photo_prompts.txt` has a ready prompt for each of the 22 photos (Nano Banana Pro, 2K, aspect ratio given per photo).
2. Name each file exactly as listed (e.g. `hero-elevator.png`), put them in one folder.
3. Run `python3 tools/install_photos.py <that-folder>` — it resizes them, saves them as JPEG under the right names and keeps the old ones in `assets/images/_previous/`.
4. Run `python3 tools/build_preview.py` to refresh `preview.html`.

## Before going live — please check

- **Map location:** the map uses a Google Maps search for "Omaxe LIG Tower 2, Arjunganj, Lucknow 226002". Open Google Maps, find the exact office pin, choose **Share → Embed a map**, and paste that `src` into the `<iframe>` in the Contact section. Update the *Get Directions* link the same way.
- **Images:** all product images come from the brochure and are low resolution (~200–360 px). They are displayed near their natural size, but for a sharper site replace them with high-resolution photos **using the same file names** in `assets/images/` — no code changes needed. The most visible ones are `hero-elevator.jpg`, `passenger-elevator.jpg` and `home-elevator.jpg`.
- **Logo:** `logo.png` is the official logo with its white background made transparent and whitespace trimmed — proportions and design unchanged. On the dark footer it sits on a white plate so the navy lettering stays visible.
- **Safety features** are presented as brochure-listed features; the section states that availability depends on model and configuration.
- **AMC plans:** no prices are shown. The Comprehensive vs Non-Comprehensive descriptions follow the usual industry meaning — confirm they match your actual contract terms.
- **Shaft-size table:** "Car inside" and "Speed" columns from the brochure were left out because they contain typos/blank cells (e.g. `100x950`, `1 1`). Add them back once corrected.

## Content rules followed

No testimonials, client names, certifications, licences, OEM partnerships, years of experience or project statistics have been added.

---

© Venturecore Solutions Private Limited · CIN U63121UP2023PTC188021
