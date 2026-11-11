"""Outils de mise en forme du rapport : styles, sections, champs, tableaux, figures, listes."""
import re
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor

BLUE = "2E74B5"
DARK = "1F3864"
FONT = "Times New Roman"


def smart(s):
    s = s.replace("'", "’")
    for a, b in ((" :", " :"), (" ;", " ;"), (" ?", " ?"), (" !", " !"),
                 ("« ", "« "), (" »", " »")):
        s = s.replace(a, b)
    return s


def set_font(run_or_style_font, name=FONT, size=None, bold=None, italic=None, color=None):
    f = run_or_style_font
    f.name = name
    if size is not None:
        f.size = Pt(size)
    if bold is not None:
        f.bold = bold
    if italic is not None:
        f.italic = italic
    if color is not None:
        f.color.rgb = RGBColor.from_string(color)


def force_rfonts(el, name=FONT):
    """Fixe la police sur les quatre jeux de caractères, sans police de thème."""
    rpr = el.get_or_add_rPr()
    rf = rpr.find(qn("w:rFonts"))
    if rf is None:
        rf = OxmlElement("w:rFonts")
        rpr.insert(0, rf)
    for a in list(rf.attrib):
        if "Theme" in a:
            del rf.attrib[a]
    for a in ("w:ascii", "w:hAnsi", "w:cs", "w:eastAsia"):
        rf.set(qn(a), name)


class Report:
    def __init__(self):
        self.doc = Document()
        self.fig = 0
        self.tab = 0
        self._setup()

    # ------------------------------------------------------------ mise en place
    def _setup(self):
        d = self.doc
        s = d.sections[0]
        s.page_width, s.page_height = Cm(21), Cm(29.7)
        s.top_margin = s.bottom_margin = Cm(2.5)
        s.left_margin = s.right_margin = Cm(2.5)
        s.header_distance = Cm(1.25)
        s.footer_distance = Cm(1.1)
        self._border(s)

        st = d.styles
        normal = st["Normal"]
        set_font(normal.font, size=12)
        force_rfonts(normal.element)
        pf = normal.paragraph_format
        pf.line_spacing = 1.5
        pf.space_after = Pt(4)
        pf.space_before = Pt(0)
        pf.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

        def heading(name, size, color="000000", bold=True, underline=False, align=WD_ALIGN_PARAGRAPH.LEFT,
                    before=12, after=6, italic=False):
            h = st[name]
            set_font(h.font, size=size, bold=bold, italic=italic, color=color)
            h.font.underline = underline
            force_rfonts(h.element)
            p = h.paragraph_format
            p.alignment = align
            p.space_before, p.space_after = Pt(before), Pt(after)
            p.keep_with_next = True
            p.line_spacing = 1.15
            return h

        heading("Heading 1", 16, BLUE, underline=True, align=WD_ALIGN_PARAGRAPH.CENTER, before=0, after=18)
        heading("Heading 2", 15, "000000", before=0, after=10)
        heading("Heading 3", 13, "000000", before=12, after=6)
        heading("Heading 4", 12, "000000", before=8, after=4)
        h4 = st["Heading 4"]
        h4.paragraph_format.left_indent = Cm(0.8)

        lim = st.add_style("Titre liminaire", WD_STYLE_TYPE.PARAGRAPH)
        lim.base_style = normal
        set_font(lim.font, size=16, bold=True, color=BLUE)
        lim.font.underline = True
        lp = lim.paragraph_format
        lp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        lp.space_after = Pt(18)
        lp.keep_with_next = True

        cap = st["Caption"]
        set_font(cap.font, size=10.5, bold=False, italic=True, color="44546A")
        force_rfonts(cap.element)
        cp = cap.paragraph_format
        cp.alignment = WD_ALIGN_PARAGRAPH.CENTER
        cp.space_before, cp.space_after = Pt(4), Pt(10)
        cp.line_spacing = 1.0

        code = st.add_style("Code", WD_STYLE_TYPE.PARAGRAPH)
        code.base_style = normal
        set_font(code.font, name="Consolas", size=9.5)
        force_rfonts(code.element, "Consolas")
        cdp = code.paragraph_format
        cdp.alignment = WD_ALIGN_PARAGRAPH.LEFT
        cdp.line_spacing = 1.0
        cdp.space_after = Pt(0)
        cdp.left_indent = Cm(0.4)

        cell = st.add_style("Cellule", WD_STYLE_TYPE.PARAGRAPH)
        cell.base_style = normal
        set_font(cell.font, size=11)
        cl = cell.paragraph_format
        cl.alignment = WD_ALIGN_PARAGRAPH.LEFT
        cl.line_spacing = 1.0
        cl.space_after = Pt(2)

        for i in range(1, 5):
            try:
                t = st[f"TOC {i}"]
            except KeyError:
                t = st.add_style(f"TOC {i}", WD_STYLE_TYPE.PARAGRAPH)
                t.base_style = normal
            set_font(t.font, size=11.5, bold=i <= 2)
            t.paragraph_format.space_after = Pt(2)
            t.paragraph_format.line_spacing = 1.15
            t.paragraph_format.left_indent = Cm(0.5 * (i - 1))
            t.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        self._numbering()

    def _border(self, section):
        sp = section._sectPr
        old = sp.find(qn("w:pgBorders"))
        if old is not None:
            sp.remove(old)
        b = parse_xml(
            f'<w:pgBorders {nsdecls("w")} w:offsetFrom="page">'
            + "".join(f'<w:{e} w:val="thickThinSmallGap" w:sz="24" w:space="24" w:color="{DARK}"/>'
                      for e in ("top", "left", "bottom", "right"))
            + "</w:pgBorders>")
        sp.find(qn("w:pgMar")).addnext(b)

    def _pagenum(self, section, fmt, start):
        sp = section._sectPr
        old = sp.find(qn("w:pgNumType"))
        if old is not None:
            sp.remove(old)
        el = OxmlElement("w:pgNumType")
        el.set(qn("w:fmt"), fmt)
        if start is not None:
            el.set(qn("w:start"), str(start))
        anchor = sp.find(qn("w:pgBorders"))
        (anchor if anchor is not None else sp.find(qn("w:pgMar"))).addnext(el)

    def _numbering(self):
        np_ = self.doc.part.numbering_part.element
        defs = {
            90: ("bullet", "▪", "Arial", 720),
            91: ("bullet", "❖", "Segoe UI Symbol", 720),
            92: ("decimal", "%1.", None, 720),
        }
        first_num = np_.find(qn("w:num"))
        for aid, (fmt, txt, font, ind) in defs.items():
            rpr = f'<w:rPr><w:rFonts w:ascii="{font}" w:hAnsi="{font}" w:hint="default"/></w:rPr>' if font else ""
            x = parse_xml(
                f'<w:abstractNum {nsdecls("w")} w:abstractNumId="{aid}"><w:multiLevelType w:val="singleLevel"/>'
                f'<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="{fmt}"/><w:lvlText w:val="{txt}"/>'
                f'<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="{ind}" w:hanging="360"/></w:pPr>{rpr}</w:lvl></w:abstractNum>')
            if first_num is not None:
                first_num.addprevious(x)
            else:
                np_.append(x)
        self._next_num = 900

    def _new_num(self, abstract):
        np_ = self.doc.part.numbering_part.element
        self._next_num += 1
        nid = self._next_num
        np_.append(parse_xml(
            f'<w:num {nsdecls("w")} w:numId="{nid}"><w:abstractNumId w:val="{abstract}"/>'
            f'<w:lvlOverride w:ilvl="0"><w:startOverride w:val="1"/></w:lvlOverride></w:num>'))
        return nid

    # ------------------------------------------------------------ sections et pieds de page
    def new_section(self, fmt=None, start=None, footer=True, border=True):
        s = self.doc.add_section(WD_SECTION.NEW_PAGE)
        if border:
            self._border(s)
        else:
            old = s._sectPr.find(qn("w:pgBorders"))
            if old is not None:
                s._sectPr.remove(old)
        if fmt:
            self._pagenum(s, fmt, start)
        f = s.footer
        f.is_linked_to_previous = False
        p = f.paragraphs[0]
        for r in list(p.runs):
            r._r.getparent().remove(r._r)
        if footer:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            self.field(p, "PAGE", "1", size=11)
        return s

    # ------------------------------------------------------------ texte
    def runs(self, p, text, size=None, color=None, smart_quotes=True):
        """Texte avec **gras**, *italique* et ^{exposant}."""
        if smart_quotes:
            text = smart(text)
        for part in re.split(r"(\*\*[^*]+\*\*|\*[^*]+\*|\^\{[^}]+\})", text):
            if not part:
                continue
            if part.startswith("**"):
                r = p.add_run(part[2:-2]); r.bold = True
            elif part.startswith("^{"):
                r = p.add_run(part[2:-1]); r.font.superscript = True
            elif part.startswith("*"):
                r = p.add_run(part[1:-1]); r.italic = True
            else:
                r = p.add_run(part)
            if size:
                r.font.size = Pt(size)
            if color:
                r.font.color.rgb = RGBColor.from_string(color)
        return p

    def p(self, text, align=None, style=None, size=None, italic=False, before=None, after=None, color=None, indent=None):
        para = self.doc.add_paragraph(style=style)
        self.runs(para, text, size=size, color=color)
        if italic:
            for r in para.runs:
                r.italic = True
        if align:
            para.alignment = {"c": WD_ALIGN_PARAGRAPH.CENTER, "l": WD_ALIGN_PARAGRAPH.LEFT,
                              "r": WD_ALIGN_PARAGRAPH.RIGHT, "j": WD_ALIGN_PARAGRAPH.JUSTIFY}[align]
        if before is not None:
            para.paragraph_format.space_before = Pt(before)
        if after is not None:
            para.paragraph_format.space_after = Pt(after)
        if indent is not None:
            para.paragraph_format.left_indent = Cm(indent)
        return para

    def h(self, level, text, page_break=False):
        para = self.doc.add_paragraph(style=f"Heading {level}")
        if page_break:
            para.paragraph_format.page_break_before = True
        self.runs(para, text)
        return para

    def sub(self, text):
        """Intertitre « a. ... », hors table des matières."""
        para = self.doc.add_paragraph()
        self.runs(para, text)
        for r in para.runs:
            r.bold = True
            r.italic = True
        para.paragraph_format.keep_with_next = True
        para.paragraph_format.left_indent = Cm(0.8)
        para.paragraph_format.space_before = Pt(4)
        return para

    def lim(self, text, page_break=True):
        para = self.doc.add_paragraph(style="Titre liminaire")
        if page_break:
            para.paragraph_format.page_break_before = True
        self.runs(para, text)
        return para

    def bullets(self, items, kind="square", indent=None):
        nid = self._new_num(90 if kind == "square" else 91)
        for it in items:
            para = self.doc.add_paragraph()
            self.runs(para, it)
            pPr = para._p.get_or_add_pPr()
            pPr.append(parse_xml(f'<w:numPr {nsdecls("w")}><w:ilvl w:val="0"/><w:numId w:val="{nid}"/></w:numPr>'))
            para.paragraph_format.space_after = Pt(2)
            if indent is not None:
                para.paragraph_format.left_indent = Cm(indent)
        return nid

    def numbered(self, items):
        nid = self._new_num(92)
        for it in items:
            para = self.doc.add_paragraph()
            self.runs(para, it)
            pPr = para._p.get_or_add_pPr()
            pPr.append(parse_xml(f'<w:numPr {nsdecls("w")}><w:ilvl w:val="0"/><w:numId w:val="{nid}"/></w:numPr>'))
            para.paragraph_format.space_after = Pt(2)

    def code(self, lines):
        for i, ln in enumerate(lines):
            para = self.doc.add_paragraph(style="Code")
            para.add_run(ln)
            pPr = para._p.get_or_add_pPr()
            pPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="F2F2F2"/>'))
            if i == len(lines) - 1:
                para.paragraph_format.space_after = Pt(8)

    def formula(self, parts):
        para = self.doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        self.runs(para, parts)
        for r in para.runs:
            r.italic = True
            r.font.size = Pt(13)
        return para

    def page_break(self):
        self.doc.add_paragraph().add_run().add_break(WD_BREAK.PAGE)

    # ------------------------------------------------------------ champs
    def field(self, para, instr, result="", size=None, bold=False):
        def run():
            r = para.add_run()
            if size:
                r.font.size = Pt(size)
            r.bold = bold
            return r
        r = run()
        b = OxmlElement("w:fldChar"); b.set(qn("w:fldCharType"), "begin"); b.set(qn("w:dirty"), "true"); r._r.append(b)
        r = run()
        it = OxmlElement("w:instrText"); it.set(qn("xml:space"), "preserve"); it.text = f" {instr} "; r._r.append(it)
        r = run()
        s = OxmlElement("w:fldChar"); s.set(qn("w:fldCharType"), "separate"); r._r.append(s)
        r = run(); r.text = result
        r = run()
        e = OxmlElement("w:fldChar"); e.set(qn("w:fldCharType"), "end"); r._r.append(e)

    def toc(self, instr):
        para = self.doc.add_paragraph()
        para.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.LEFT
        self.field(para, instr, "Table à mettre à jour : clic droit, puis « Mettre à jour les champs ».")

    def caption(self, kind, title):
        para = self.doc.add_paragraph(style="Caption")
        para.add_run(f"{kind} ")
        n = self.fig if kind == "Figure" else self.tab
        self.field(para, f"SEQ {kind} \\* ARABIC", str(n))
        para.add_run(" : " + smart(title))
        if kind == "Tableau":
            para.paragraph_format.keep_with_next = True
        return para

    # ------------------------------------------------------------ figures et tableaux
    def figure(self, path, title, width_cm=15.0):
        self.fig += 1
        para = self.doc.add_paragraph()
        para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        para.paragraph_format.keep_with_next = True
        para.paragraph_format.space_before = Pt(6)
        para.paragraph_format.line_spacing = 1.0
        para.add_run().add_picture(str(path), width=Cm(width_cm))
        self.caption("Figure", title)

    def table(self, title, headers, rows, widths_cm, caption=True, header_fill="FFC000", font_size=11, bold_first_col=False):
        if caption:
            self.tab += 1
            self.caption("Tableau", title)
        t = self.doc.add_table(rows=1 + len(rows), cols=len(headers))
        t.style = self.doc.styles["Table Grid"]
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        t.autofit = False
        tblPr = t._tbl.tblPr
        tblPr.append(parse_xml(
            f'<w:tblCellMar {nsdecls("w")}><w:top w:w="40" w:type="dxa"/><w:left w:w="90" w:type="dxa"/>'
            f'<w:bottom w:w="40" w:type="dxa"/><w:right w:w="90" w:type="dxa"/></w:tblCellMar>'))
        for ci, w in enumerate(widths_cm):
            for row in t.rows:
                row.cells[ci].width = Cm(w)
        for ri, row in enumerate(t.rows):
            vals = headers if ri == 0 else rows[ri - 1]
            if ri == 0:
                trPr = row._tr.get_or_add_trPr()
                trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
            cant = row._tr.get_or_add_trPr()
            cant.append(parse_xml(f'<w:cantSplit {nsdecls("w")}/>'))
            for ci, val in enumerate(vals):
                c = row.cells[ci]
                c.paragraphs[0].style = self.doc.styles["Cellule"]
                items = val if isinstance(val, list) else [val]
                for k, item in enumerate(items):
                    para = c.paragraphs[0] if k == 0 else c.add_paragraph(style="Cellule")
                    self.runs(para, item, size=font_size)
                    if ri == 0 or (bold_first_col and ci == 0):
                        for r in para.runs:
                            r.bold = True
                if ri == 0:
                    tcPr = c._tc.get_or_add_tcPr()
                    tcPr.append(parse_xml(f'<w:shd {nsdecls("w")} w:val="clear" w:color="auto" w:fill="{header_fill}"/>'))
        after = self.doc.add_paragraph()
        after.paragraph_format.space_after = Pt(4)
        after.paragraph_format.line_spacing = 1.0
        return t

    def framed(self, rows, color=DARK, size=13, width_cm=14.5):
        """Cadre d'une seule cellule, pour le titre de la couverture."""
        t = self.doc.add_table(rows=1, cols=1)
        t.alignment = WD_TABLE_ALIGNMENT.CENTER
        c = t.rows[0].cells[0]
        c.width = Cm(width_cm)
        tcPr = c._tc.get_or_add_tcPr()
        tcPr.append(parse_xml(
            f'<w:tcBorders {nsdecls("w")}>' + "".join(
                f'<w:{e} w:val="single" w:sz="18" w:space="0" w:color="{color}"/>' for e in ("top", "left", "bottom", "right"))
            + "</w:tcBorders>"))
        for k, txt in enumerate(rows):
            para = c.paragraphs[0] if k == 0 else c.add_paragraph()
            para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            para.paragraph_format.space_before = Pt(6 if k == 0 else 0)
            para.paragraph_format.space_after = Pt(6 if k == len(rows) - 1 else 0)
            r = para.add_run(smart(txt))
            r.font.size = Pt(size)
            r.font.color.rgb = RGBColor.from_string("2F5496")
        return t

    def part_page(self, title, intro):
        para = self.doc.add_paragraph()
        para.paragraph_format.page_break_before = True
        para.paragraph_format.space_before = Pt(200)
        h = self.doc.add_paragraph(style="Heading 1")
        self.runs(h, title)
        h.paragraph_format.space_after = Pt(14)
        pPr = h._p.get_or_add_pPr()
        pPr.append(parse_xml(
            f'<w:pBdr {nsdecls("w")}>' + "".join(
                f'<w:{e} w:val="single" w:sz="18" w:space="12" w:color="{DARK}"/>' for e in ("top", "left", "bottom", "right"))
            + "</w:pBdr>"))
        h.paragraph_format.left_indent = Cm(2.2)
        h.paragraph_format.right_indent = Cm(2.2)
        i = self.p(intro, align="c", italic=True, before=18)
        i.paragraph_format.left_indent = Cm(2)
        i.paragraph_format.right_indent = Cm(2)

    def save(self, path):
        self.doc.save(str(path))
