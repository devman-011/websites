# Per-clinic swap list

The template is finished. Hero video, palette, fonts, headlines, services
copy, journey beats, approach copy, metrics bento, FAQ scaffolding, booking
section, footer structure — all done and the same across every clinic.

This file lists **only the things that genuinely differ per clinic** and
that I have to swap in when handing a real clinic their site. Everything
else stays template-default.

The clinic owner answers these via [Clinic_Intake_Form.pdf](Clinic_Intake_Form.pdf).
The PDF is short, no-friction, no specialty picker — I already know the
specialty before I send it.

---

## 1. Brand basics (≈ 5 fields)

| ID | Field | Where it appears |
|----|-------|------------------|
| B1 | Clinic name (full) | curtain · nav brand · footer · `<title>` |
| B2 | Italicised half of name | same — wrapped in `<em>` for the accent colour |
| B3 | Tagline under brand mark | curtain sub · footer brand block (e.g. "NW3 · Since 2011") |
| B4 | Year founded | tagline · footer copyright · founder bio |

## 2. Contact (≈ 6 fields)

| ID | Field | Where it appears |
|----|-------|------------------|
| C1 | Phone — display | nav · footer · FAQ intro · book section · "or call" link |
| C2 | Phone — `tel:` link | every `<a href="tel:…">` |
| C3 | Email | FAQ intro · footer · book bottom note |
| C4 | Address line 1 | nav menu · footer · book bottom note |
| C5 | Address line 2 (district) | same |
| C6 | Address line 3 (city + postcode) | same |

## 3. Hours (≈ 3 fields)

| ID | Field | Where it appears |
|----|-------|------------------|
| HR1 | Weekday hours | footer ("Mon–Fri · 08:00–19:00") |
| HR2 | Weekend hours | footer ("Sat (alt.) · 08:30–14:00") or "Closed" |
| HR3 | Reception closing line | footer right pulse-dot ("Reception answering · closes 19:00") |

## 4. The team — 4 clinicians × 7 fields

For each of the 4 cards in the practitioners section:

| ID per card | Field | Notes |
|-------------|-------|-------|
| D-name | Full name with title | "Dr. Eleanor Faulkner" / "Mr. Theo Drayton" |
| D-role | Role tag | mono caption — e.g. "Clinical Director", "Paediatric Eczema" |
| D-reg | Regulator + number | "GMC · 218 441" / "GDC · 84 117" — specialty-specific |
| D-quals | Postnominals line | "MBBS MRCP(Derm)" |
| D-bio | Bio paragraph | ~3 sentences, ~50 words |
| D-photo | Headshot file | portrait, ~800×1000 px, save as `assets/doctor-N.jpg` |
| D-next | Next-availability label | "Next: Thu 08:30" — can be hard-coded or rotated weekly |

Plus: for each of the 6 service cards in the services grid, the lead
clinician name on the "With Dr. X" line. Defaults to a sensible mapping
(usually clinician 1 covers cards 1–2, 2 covers card 3, 3 covers card 4–5,
4 covers card 6) — only ask the client if they want a different mapping.

## 5. Booking specifics (≈ 4 fields)

| ID | Field | Notes |
|----|-------|-------|
| BK1 | First consultation price | shown in FAQ #2 + book sub-paragraph (e.g. "£185") |
| BK2 | Insurers accepted | shown in FAQ #3 ("Bupa, AXA, Aviva, Vitality, WPA") |
| BK3 | Daily appointment slot times | the slot picker — list of times like `08:30, 09:30, 10:30, …` (in [main.js:282](samples/dermatology/main.js#L282)) |
| BK4 | Closed weekday(s) | slot picker logic in [main.js:289](samples/dermatology/main.js#L289) — default is Sundays only |

## 6. Social proof (≈ 2 fields)

| ID | Field | Notes |
|----|-------|-------|
| Q1 | Patient quote | quote tile in metrics bento — 1–2 sentences, with permission |
| Q2 | Quote attribution | "M. Okafor · patient since 2021" — initial + surname + a fact |

If the clinic can't supply a real quote yet, the template ships with a
plausible default — leave it.

---

## Total swap surface

**~30 fields** + **4 headshot photos**.

Everything else is template-default and stays.

## Workflow when handing a real clinic their site

1. I (developer) already know the specialty → duplicate the matching
   `samples/<specialty>/` folder to `samples/<clinic-slug>/`.
2. Send the client `Clinic_Intake_Form.pdf` (one-pager-ish, ~6 pages).
3. On return, walk top-to-bottom through the IDs above.
4. Use Edit / Grep on the duplicated folder — most swaps are pure
   string replaces (find `Halden Derm`, replace; find `020 7946 8021`,
   replace; etc.).
5. Drop in the 4 headshots at `assets/doctor-1.jpg` … `doctor-4.jpg`.
6. Open in browser, verify curtain lifts and slot picker renders.
