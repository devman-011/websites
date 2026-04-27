#!/usr/bin/env python3
"""
Generate Clinic_Intake_Form.pdf — a short, low-friction questionnaire.

The template (palette, fonts, hero video, headlines, services copy,
journey beats, approach copy, metrics, FAQ scaffolding, booking
section, footer) is finished. This form only asks for the things that
genuinely differ per clinic: brand name, contact, hours, the 4
clinicians, a few booking specifics, one optional quote.

~6 pages. ~15 minutes to fill in.
"""

from pathlib import Path
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle,
    KeepTogether,
)


OUT = Path(__file__).resolve().parent / "Clinic_Intake_Form.pdf"

INK = colors.HexColor("#1A1614")
MUTE = colors.HexColor("#6F5F50")
RULE = colors.HexColor("#C9C0B3")
ACCENT = colors.HexColor("#C77A5C")


# ----------------------------- styles -----------------------------

def build_styles():
    base = getSampleStyleSheet()
    s = {}
    s["title"] = ParagraphStyle(
        "title", parent=base["Title"],
        fontName="Times-Roman", fontSize=34, leading=38,
        textColor=INK, spaceAfter=4, alignment=TA_LEFT,
    )
    s["subtitle"] = ParagraphStyle(
        "subtitle", parent=base["Normal"],
        fontName="Times-Italic", fontSize=14, leading=18,
        textColor=MUTE, spaceAfter=18,
    )
    s["section"] = ParagraphStyle(
        "section", parent=base["Heading1"],
        fontName="Times-Bold", fontSize=18, leading=22,
        textColor=INK, spaceBefore=8, spaceAfter=2,
    )
    s["section_eyebrow"] = ParagraphStyle(
        "eyebrow", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=7.5, leading=10,
        textColor=ACCENT, spaceBefore=6, spaceAfter=4,
    )
    s["section_intro"] = ParagraphStyle(
        "section_intro", parent=base["Normal"],
        fontName="Times-Italic", fontSize=10.5, leading=14.5,
        textColor=MUTE, spaceAfter=10,
    )
    s["q_label"] = ParagraphStyle(
        "q_label", parent=base["Normal"],
        fontName="Helvetica-Bold", fontSize=10.5, leading=13,
        textColor=INK, spaceBefore=2, spaceAfter=1,
    )
    s["q_help"] = ParagraphStyle(
        "q_help", parent=base["Normal"],
        fontName="Times-Italic", fontSize=8.8, leading=11,
        textColor=MUTE, spaceAfter=3,
    )
    s["body"] = ParagraphStyle(
        "body", parent=base["Normal"],
        fontName="Helvetica", fontSize=10, leading=14,
        textColor=INK, spaceAfter=4,
    )
    s["instruction"] = ParagraphStyle(
        "instruction", parent=base["Normal"],
        fontName="Helvetica", fontSize=10.5, leading=15,
        textColor=INK, spaceAfter=8,
    )
    return s


# ----------------------------- helpers -----------------------------

PAGE_W, PAGE_H = A4
MARGIN_L, MARGIN_R = 22 * mm, 22 * mm
MARGIN_T, MARGIN_B = 22 * mm, 18 * mm
CONTENT_W = PAGE_W - MARGIN_L - MARGIN_R


def short_field(label, help_text=None, lines=1):
    flow = [Paragraph(label, STYLES["q_label"])]
    if help_text:
        flow.append(Paragraph(help_text, STYLES["q_help"]))
    for _ in range(lines):
        flow.append(_rule(width=CONTENT_W, gap_before=8, gap_after=4))
    flow.append(Spacer(1, 4))
    return KeepTogether(flow)


def long_field(label, help_text=None, lines=4):
    return short_field(label, help_text, lines=lines)


def _rule(width, gap_before=6, gap_after=4):
    t = Table([[" "]], colWidths=[width], rowHeights=[gap_before + gap_after])
    t.setStyle(TableStyle([
        ("LINEBELOW", (0, 0), (-1, -1), 0.4, RULE),
        ("LEFTPADDING", (0, 0), (-1, -1), 0),
        ("RIGHTPADDING", (0, 0), (-1, -1), 0),
        ("TOPPADDING", (0, 0), (-1, -1), 0),
        ("BOTTOMPADDING", (0, 0), (-1, -1), gap_after),
    ]))
    return t


def section_header(eyebrow, title, intro=None):
    flow = [
        Spacer(1, 6),
        Paragraph(eyebrow.upper(), STYLES["section_eyebrow"]),
        Paragraph(title, STYLES["section"]),
    ]
    if intro:
        flow.append(Paragraph(intro, STYLES["section_intro"]))
    flow.append(Spacer(1, 2))
    return flow


# ----------------------------- page chrome -----------------------------

def on_page(canvas, doc):
    canvas.saveState()
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(MARGIN_L, PAGE_H - MARGIN_T + 8 * mm,
                PAGE_W - MARGIN_R, PAGE_H - MARGIN_T + 8 * mm)
    canvas.setFont("Helvetica-Bold", 7.5)
    canvas.setFillColor(MUTE)
    canvas.drawString(MARGIN_L, PAGE_H - MARGIN_T + 11 * mm,
                      "CLINIC INTAKE FORM")
    canvas.setFont("Helvetica", 8.5)
    canvas.drawRightString(PAGE_W - MARGIN_R, MARGIN_B - 8 * mm,
                           f"{doc.page}")
    canvas.drawString(MARGIN_L, MARGIN_B - 8 * mm,
                      "Confidential")
    canvas.restoreState()


# ----------------------------- content -----------------------------

def build_story():
    story = []

    # ============== COVER ==============
    story.append(Spacer(1, 30 * mm))
    story.append(Paragraph("A few quick", STYLES["title"]))
    story.append(Paragraph("questions.", STYLES["title"]))
    story.append(Spacer(1, 10))
    story.append(Paragraph(
        "Just enough to make the site yours.",
        STYLES["subtitle"]))
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "The site is already designed and built — the words, photos, "
        "video, colours, layout, animations, the lot. All we need now "
        "are the things that change clinic to clinic: your name, your "
        "team, your phone number, your hours.",
        STYLES["instruction"]))
    story.append(Paragraph(
        "Should take about <b>15 minutes</b>. Skip anything you don't "
        "have to hand — we'll fill in the rest with sensible defaults "
        "and you can swap them later.",
        STYLES["body"]))
    story.append(Spacer(1, 14))
    story.append(Paragraph(
        "<b>Have ready:</b> headshots of every clinician (any phone "
        "photo of them in a clean shirt is fine — we'll touch up), and "
        "an idea of your daily appointment slots.",
        STYLES["body"]))
    story.append(PageBreak())

    # ============== 1. THE BASICS ==============
    story += section_header(
        "Page 1",
        "The clinic",
        "Name, location, how people reach you.")
    story.append(short_field(
        "Clinic name",
        "How it appears on the door. e.g. <i>Halden Derm</i>, "
        "<i>Branch &amp; Blume</i>, <i>The Marylebone Eye Clinic</i>."))
    story.append(short_field(
        "Year founded",
        "Used in the \"Since 2011\" line under the logo."))
    story.append(short_field(
        "Reception phone number",
        "How patients ring you. e.g. \"020 7946 8021\"."))
    story.append(short_field(
        "Email address",
        "e.g. \"hello@haldenderm.com\"."))
    story.append(short_field(
        "Street address — line 1",
        "Number and street. e.g. \"14 Rosecroft Lane\"."))
    story.append(short_field(
        "Street address — line 2",
        "Borough or district. e.g. \"Hampstead\"."))
    story.append(short_field(
        "Street address — line 3",
        "City and postcode. e.g. \"London NW3\"."))

    story.append(PageBreak())

    # ============== 2. HOURS ==============
    story += section_header(
        "Page 2",
        "Hours",
        "When the clinic is open. Two lines on the website footer.")
    story.append(short_field(
        "Weekday hours",
        "e.g. \"Mon–Fri · 08:00–19:00\"."))
    story.append(short_field(
        "Weekend hours",
        "e.g. \"Sat (alt.) · 08:30–14:00\". Write \"Closed\" if you don't "
        "open weekends."))
    story.append(short_field(
        "Daily appointment slot times",
        "List the slots you usually offer in a day, e.g. \"08:30, 09:30, "
        "10:30, 11:30, 13:00, 14:00, 15:00, 16:00, 17:00\". The booking "
        "widget shows these as buttons.", lines=2))
    story.append(short_field(
        "Closed days",
        "e.g. \"Sundays\" or \"Sundays &amp; Mondays\"."))

    story.append(PageBreak())

    # ============== 3. THE TEAM ==============
    story += section_header(
        "Pages 3–6",
        "The team — four clinicians",
        "The site shows four clinicians in a staggered grid. For each, "
        "we need name, role, regulator number, qualifications, a short "
        "bio, and a headshot photo (any decent phone photo is fine).")

    for n in range(1, 5):
        story.append(Spacer(1, 6))
        story.append(Paragraph(
            f"<b>Clinician {n}</b>", STYLES["section"]))
        story.append(short_field(
            "Full name with title",
            "e.g. \"Dr. Eleanor Faulkner\". UK surgeons sometimes use "
            "\"Mr.\" or \"Ms.\" instead — write whichever they go by."))
        story.append(short_field(
            "Role / focus (one short line)",
            "e.g. \"Clinical Director\", \"Paediatric Eczema\", "
            "\"Cataract surgery lead\"."))
        story.append(short_field(
            "Regulator number",
            "e.g. \"GMC · 218 441\", \"GDC · 84 117\"."))
        story.append(short_field(
            "Qualifications (the letters after the name)",
            "e.g. \"MBBS MRCP(Derm)\", \"BDS MFDS RCSEd\"."))
        story.append(long_field(
            "Bio (~3 sentences)",
            "Where they trained, how long they've been with the practice, "
            "and one human detail (a teaching role, a special interest, "
            "where they grew up).", lines=4))
        story.append(short_field(
            "Headshot — file you'll send",
            "Portrait orientation. A phone photo against a plain wall is "
            "fine — we'll match the colour treatment to the others."))
        story.append(PageBreak())

    # ============== 4. BOOKING DETAILS ==============
    story += section_header(
        "Page 7",
        "Booking specifics",
        "Two short things that vary clinic-to-clinic and show up on the "
        "FAQ + booking section.")
    story.append(short_field(
        "First consultation price",
        "Shown on the FAQ and the booking section. e.g. \"£185\". "
        "Leave blank if you'd rather not list a price publicly — we'll "
        "say \"Price on consultation\"."))
    story.append(short_field(
        "Insurers you're recognised by",
        "Comma-separated. e.g. \"Bupa, AXA Health, Aviva, Vitality, WPA\". "
        "Skip if private-pay only."))

    story.append(PageBreak())

    # ============== 5. PATIENT QUOTE (OPTIONAL) ==============
    story += section_header(
        "Page 8 (optional)",
        "A patient quote",
        "The site shows one short patient testimonial in the metrics "
        "section. Skip if you don't have one to hand — the template "
        "ships with a tasteful placeholder.")
    story.append(long_field(
        "Quote (one or two sentences, in the patient's own words)",
        "Always with their permission to publish. Anonymising to "
        "initial + surname is fine.", lines=4))
    story.append(short_field(
        "Attribution",
        "e.g. \"M. Okafor · patient since 2021\"."))

    story.append(PageBreak())

    # ============== 6. SIGN-OFF ==============
    story += section_header(
        "Last page",
        "That's it.",
        "Send this back as a scanned PDF or photographed pages, with "
        "the four headshots attached. We aim to have your site live "
        "within five working days.")
    story.append(Paragraph(
        "<b>Send back to:</b> [your email here]",
        STYLES["body"]))
    story.append(Spacer(1, 14))
    story.append(short_field("Filled in by"))
    story.append(short_field("Date"))

    return story


# ----------------------------- run -----------------------------

STYLES = build_styles()


def main():
    doc = SimpleDocTemplate(
        str(OUT), pagesize=A4,
        leftMargin=MARGIN_L, rightMargin=MARGIN_R,
        topMargin=MARGIN_T, bottomMargin=MARGIN_B,
        title="Clinic Intake Form",
        author="Clinic Template",
    )
    doc.build(build_story(), onFirstPage=on_page, onLaterPages=on_page)
    size_kb = OUT.stat().st_size / 1024
    print(f"[OK] {OUT.name} ({size_kb:.1f} KB)")


if __name__ == "__main__":
    main()
