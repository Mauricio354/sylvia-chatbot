"""
Convert GOOGLE_CALENDAR_MIGRATION.md into a clean printable PDF
suitable for in-person walkthrough with Sylvia.
"""
import re
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    HRFlowable,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
)

ROOT = Path(__file__).parent
SRC = ROOT / "GOOGLE_CALENDAR_MIGRATION.md"
OUT = ROOT / "GOOGLE_CALENDAR_MIGRATION.pdf"


def build_styles():
    base = getSampleStyleSheet()
    nav_blue = colors.HexColor("#1a3a5c")
    accent = colors.HexColor("#e8a87c")
    body_gray = colors.HexColor("#2c2c2c")

    title = ParagraphStyle(
        "Title",
        parent=base["Title"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=nav_blue,
        spaceAfter=8,
        alignment=TA_LEFT,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=base["Normal"],
        fontName="Helvetica",
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#555"),
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    h2 = ParagraphStyle(
        "H2",
        parent=base["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=nav_blue,
        spaceBefore=14,
        spaceAfter=6,
        alignment=TA_LEFT,
        borderPadding=0,
    )
    body = ParagraphStyle(
        "Body",
        parent=base["BodyText"],
        fontName="Helvetica",
        fontSize=10.5,
        leading=15,
        textColor=body_gray,
        spaceAfter=6,
        alignment=TA_LEFT,
    )
    list_item = ParagraphStyle(
        "ListItem",
        parent=body,
        spaceAfter=2,
    )
    sub_list_item = ParagraphStyle(
        "SubListItem",
        parent=body,
        spaceAfter=2,
        leftIndent=14,
    )
    callout = ParagraphStyle(
        "Callout",
        parent=body,
        textColor=nav_blue,
        fontName="Helvetica-Oblique",
        spaceBefore=4,
        spaceAfter=8,
    )
    return {
        "title": title,
        "subtitle": subtitle,
        "h2": h2,
        "body": body,
        "list": list_item,
        "sublist": sub_list_item,
        "callout": callout,
        "accent": accent,
    }


def md_inline_to_html(text: str) -> str:
    """Convert minimal markdown inline syntax to ReportLab HTML."""
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r'<font name="Courier">\1</font>', text)
    return text


def parse_markdown(md_text: str):
    """Yield (kind, payload) tuples for the renderer."""
    lines = md_text.splitlines()
    i = 0
    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        if not stripped:
            yield ("blank", None)
            i += 1
            continue

        if stripped.startswith("# "):
            yield ("title", stripped[2:].strip())
            i += 1
            continue

        if stripped.startswith("## "):
            yield ("h2", stripped[3:].strip())
            i += 1
            continue

        # Numbered list block
        if re.match(r"^\d+\.\s+", stripped):
            items = []
            while i < len(lines) and re.match(r"^\d+\.\s+", lines[i].strip()):
                items.append(re.sub(r"^\d+\.\s+", "", lines[i].strip()))
                # Capture indented sub-bullets
                while (
                    i + 1 < len(lines)
                    and lines[i + 1].startswith("   ")
                    and lines[i + 1].lstrip().startswith("-")
                ):
                    i += 1
                    items[-1] += "\n" + lines[i].strip()
                i += 1
            yield ("ol", items)
            continue

        # Bullet list block (checkbox or dash)
        if stripped.startswith("- "):
            items = []
            while i < len(lines) and lines[i].strip().startswith("- "):
                items.append(lines[i].strip()[2:])
                i += 1
            yield ("ul", items)
            continue

        # Paragraph (could span multiple lines until blank)
        para_lines = [stripped]
        i += 1
        while i < len(lines) and lines[i].strip() and not (
            lines[i].strip().startswith("#")
            or re.match(r"^\d+\.\s+", lines[i].strip())
            or lines[i].strip().startswith("- ")
        ):
            para_lines.append(lines[i].strip())
            i += 1
        yield ("p", " ".join(para_lines))


def render(md_text: str, styles):
    flow = []
    title_done = False
    subtitle_buffered = False

    for kind, payload in parse_markdown(md_text):
        if kind == "title":
            flow.append(Paragraph(md_inline_to_html(payload), styles["title"]))
            flow.append(
                HRFlowable(
                    width="100%",
                    thickness=1.5,
                    color=styles["accent"],
                    spaceBefore=2,
                    spaceAfter=10,
                )
            )
            title_done = True
        elif kind == "h2":
            flow.append(Paragraph(md_inline_to_html(payload), styles["h2"]))
            flow.append(
                HRFlowable(
                    width="40%",
                    thickness=0.6,
                    color=colors.HexColor("#dcdcdc"),
                    spaceBefore=0,
                    spaceAfter=6,
                )
            )
        elif kind == "p":
            style = styles["subtitle"] if title_done and not subtitle_buffered else styles["body"]
            if title_done and not subtitle_buffered:
                subtitle_buffered = True
            flow.append(Paragraph(md_inline_to_html(payload), style))
        elif kind == "ol":
            items = []
            for raw in payload:
                # Handle sub-bullets in items
                if "\n" in raw:
                    main, *subs = raw.split("\n")
                    sub_paras = [
                        Paragraph(md_inline_to_html(s.lstrip("- ").strip()), styles["sublist"])
                        for s in subs
                    ]
                    item_flow = [Paragraph(md_inline_to_html(main), styles["list"])] + sub_paras
                    items.append(ListItem(item_flow, leftIndent=18))
                else:
                    items.append(
                        ListItem(
                            Paragraph(md_inline_to_html(raw), styles["list"]),
                            leftIndent=18,
                        )
                    )
            flow.append(
                ListFlowable(
                    items,
                    bulletType="1",
                    bulletFontName="Helvetica-Bold",
                    bulletFontSize=10.5,
                    leftIndent=20,
                    spaceBefore=2,
                    spaceAfter=8,
                )
            )
        elif kind == "ul":
            items = []
            for raw in payload:
                if raw.startswith("[ ] "):
                    text = "&#9744;  " + md_inline_to_html(raw[4:])
                    items.append(
                        ListItem(
                            Paragraph(text, styles["list"]),
                            leftIndent=10,
                            bulletColor=colors.transparent,
                        )
                    )
                elif raw.startswith("[x] "):
                    text = "&#9745;  " + md_inline_to_html(raw[4:])
                    items.append(
                        ListItem(
                            Paragraph(text, styles["list"]),
                            leftIndent=10,
                            bulletColor=colors.transparent,
                        )
                    )
                else:
                    items.append(
                        ListItem(
                            Paragraph(md_inline_to_html(raw), styles["list"]),
                            leftIndent=14,
                        )
                    )
            # Detect checklist: render without bullets
            is_checklist = all(
                raw.startswith("[ ] ") or raw.startswith("[x] ") for raw in payload
            )
            if is_checklist:
                flow.append(
                    ListFlowable(
                        items,
                        bulletType="bullet",
                        start="",
                        leftIndent=0,
                        spaceBefore=2,
                        spaceAfter=8,
                    )
                )
            else:
                flow.append(
                    ListFlowable(
                        items,
                        bulletType="bullet",
                        bulletColor=styles["accent"],
                        leftIndent=14,
                        spaceBefore=2,
                        spaceAfter=8,
                    )
                )
        elif kind == "blank":
            flow.append(Spacer(1, 4))
    return flow


def main():
    md_text = SRC.read_text(encoding="utf-8")
    styles = build_styles()
    flow = render(md_text, styles)

    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.7 * inch,
        bottomMargin=0.7 * inch,
        title="Google Calendar Migration Guide",
        author="MR Web Solutions",
    )

    def footer(canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8)
        canvas.setFillColor(colors.HexColor("#888"))
        canvas.drawString(
            0.85 * inch,
            0.4 * inch,
            "MR Web Solutions  |  mauricio@mrwebsolutions.ca",
        )
        canvas.drawRightString(
            letter[0] - 0.85 * inch,
            0.4 * inch,
            f"Page {doc.page}",
        )
        canvas.restoreState()

    doc.build(flow, onFirstPage=footer, onLaterPages=footer)
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
