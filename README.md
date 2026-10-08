# The Wedding of Hani & Andi — Digital Invitation

Slicing of the design `Hani & Andi-Desktop Preview.ai` (1440 × 8796 px) into a single, responsive,
animated wedding invitation page. Built for the **Kompetensi Test — Front End Developer CT**.

## Stack

| Library | Version | Used for |
|---------|---------|----------|
| HTML5 / CSS3 | — | Markup, layout, animations |
| [Bootstrap](https://getbootstrap.com/docs/4.6/) | 4.6.2 | Grid (`container`/`row`/`col`, `form-row`) for couple, events, RSVP, gift; scrollspy, modal, toast, utilities |
| [jQuery](https://code.jquery.com/jquery-3.4.1.min.js) | 3.4.1 | DOM, events, form logic |
| [AOS](https://michalsnik.github.io/aos/) | 2.3.1 | Scroll reveal animations |
| [Swiper](https://swiperjs.com/) | 11 | Photo gallery slider |
| [Fancybox](https://fancyapps.com/fancybox/3/) | 3.5.7 | Gallery lightbox |

Libraries are loaded from CDN; no build step.

## Run

Open `index.html` directly, or serve the folder (recommended, needed for clipboard API):

```bash
python -m http.server 5500
```
ot
```bash
npx live-server
```

Then visit `http://localhost:5500/?to=Nama%20Tamu` — the `to` parameter fills the guest name on the cover and RSVP.
Add `&demo` to start the countdown from the figures shown in the design (22d 15h 12m 33s); the real date
(19 September 2026) has already passed, so without it the countdown shows 00 and a closing message.

## Structure

```
index.html          page markup (sections: cover, home, quote, wedding, countdown, location,
                    gallery, rsvp, gift, wishes, thanks)
style.css           design tokens, layout, responsive rules, animations
script.js           opening sequence, music, countdown, gallery, RSVP, wishes, gift, nav
assets/
  fonts/            Madina, Baskerville (regular/italic/semibold), Garamond, Helvetica, Operetta (WOFF, latin subset)
  img/              WebP photos & ornaments, SVG ornaments/patterns exported from the .ai file
  audio/            music.mp3 — background song (see "Music")
design-system/      UI/UX Pro Max design-system master (tokens, contrast audit, checklist)
Fonts/, Links/      original assets from the design package
```

## Features & interactions

- **Opening sequence** — aesthetic preloader (monogram reveal, drawn gold ring, load progress) →
  envelope with a wax seal addressed to the guest → seal breaks, flap opens, the card rises out →
  hero entrance (hanging ornament drops in, monogram zooms, title wipes in, florals grow) → scroll animations start.
- **Living decoration** — trees/florals sway gently, hanging ornament sways, monogram floats, gold dust and
  petals drift in the hero (canvas, paused when off-screen), scroll + mouse parallax depth on ornaments.
  The thank-you florals bloom in from the sides, sway and "breathe", follow the mouse, with petals falling.
- **Premium reveals** — script titles "write" in, dividers draw from the centre, arch photos get a gold shine
  and slow Ken Burns, countdown digits flip, gallery photos move with Swiper parallax.
- **Countdown** to Akad Nikah, Sabtu 19 September 2026 13.30 WIB, with **Save to calendar** (Google Calendar link
  and a static `assets/hani-andi.ics` for Apple/Outlook).
- **Location** — "Arahkan ke Lokasi" opens Google Maps.
- **Gallery** — Swiper (1.15 / 2 / 3 slides per view), autoplay with pause/play button, keyboard and
  pagination, Fancybox lightbox with zoom, slideshow, fullscreen and thumbnails. Leaving the lightbox is easy:
  a click/tap on the photo or the backdrop closes it (Fancybox's defaults zoom or only toggle controls), the gold
  close button never auto-hides, swipe up/down and Esc also close, and the browser back button closes it.
- **RSVP** — the design's wording in a tidy step card (01 Konfirmasikan kehadiran…, 02 Pilihan acara yang akan
  dihadiri, 03 Jumlah yang akan hadir with −/+ steppers limited to 1–5, "Kirim? Ya"), validation, loading state,
  toast, then a summary with "Ubah Konfirmasi"; saved in `localStorage` and restored on reload.
- **Wedding Gift** — bank account cards with one-click copy (Clipboard API + fallback).
- **Wedding Wishes** — validated form, drag & drop / click media upload with preview, newest 3 wishes
  inline, "See all messages" modal; text wishes saved in `localStorage`.
- **Navigation** — serif small caps row; on scroll it becomes a floating cream bar with a double gold hairline frame
  and the monogram between the link groups. A thin gold line with a diamond slides to the active section and follows
  hover; on desktop the bar always stays visible. Mobile/tablet: full-width bar with a double gold rule that tucks
  away while scrolling down and returns on scroll up, plus a full-screen framed menu revealed as a circle from the
  button (staggered links, Esc/link closes, focus returns to the button).
  Thin gold scroll-progress line.
- **Music** — background song starts with the "Buka Undangan" click; floating play/pause button with an
  equalizer animation while playing; pauses when the tab is hidden.

## Enhancements beyond the design

The static look of every designed section follows the .ai file. To make the invitation feel less generic,
the extras live in motion and in areas the design does not cover:

- Motion layer only (no layout change): tree sway, parallax, particles, title/divider reveals, flip countdown,
  gallery parallax. Sway and parallax use the individual `rotate` / `translate` CSS properties so they compose with
  the design's flips and the entrance animations without extra wrappers.
- Areas not in the design: preloader, envelope cover, music button, scroll progress, calendar buttons, Gift section.
- **Deliberate deviations (requested):** the RSVP form is arranged as a numbered step card (wording, colours and the
  photo/panel split follow the design); the navbar uses serif small caps with a gold frame and monogram instead of
  the design's plain Helvetica row (same items and order).

## Decisions & notes

- **Source of truth is the .ai file.** Colors, fonts, spacing and assets were measured/extracted from
  `Hani & Andi-Desktop Preview-pdfcompatible.ai` with PyMuPDF: embedded (recolored) florals, lace,
  batik border and monogram were exported as WebP; Bismillah, dividers, side pennants, the Connectied
  logo, icons and the background tiling pattern were exported as SVG. Lace and batik strips were cut
  to seamless repeat tiles.
- **Not in the design, added on request:** cover/preloader, arch-framed bride & groom photos
  (the photos exist in `Links/` but are not placed in the export), the **Gift** section (the nav has
  "GIFT" but the design has no section), background music button.
- **Photos missing from the PDF export** were placed from `Links/`: hotel image (Lokasi), third gallery
  photo, RSVP left panel photo (the design shows a flat olive block — the photo keeps an olive overlay).
- **No backend** — RSVP and wishes are stored in `localStorage` (demo). Uploaded media are previewed and
  attached to the new wish for the current session only (object URLs are not persisted).
  Requests are simulated with a short delay (`fakeRequest` in `script.js`) so loading states are visible.
- **Music** — "You're Still The One" (Shania Twain), trimmed to start at 0:24 of the original, re-encoded to
  128 kbps with a 2 s fade-in and 3 s fade-out so the loop is smooth (`assets/audio/music.mp3`, 3.2 MB).
  Commercial song chosen by the client, used for this test only. The music button hides itself if the file
  cannot be played.
- **Bank account numbers** in the Gift section are placeholders.
- **Fonts** are the files supplied with the design package (commercial fonts, used for this test only).

## Responsive & accessibility

- Breakpoints: ≥1200 (design), 992, 768, 576; checked at 1440, 1024, 768 and 375 px with no horizontal scroll.
- Desktop sizes follow the 1440 px artboard and scale down fluidly (`clamp()` / design-px variables).
- Semantic sections and headings, alt text for photos, decorative ornaments hidden from assistive tech,
  visible focus styles, labelled form fields with inline errors, `inert` page behind the cover (focus moves to
  the hero title after opening), carousel pause control, `prefers-reduced-motion` support (animations, AOS,
  autoplay, parallax and particles disabled).
