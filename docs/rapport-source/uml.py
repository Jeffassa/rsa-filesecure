"""Diagrammes UML du rapport, écrits en SVG d'après le code de RSA FileSecure."""
import sys
from pathlib import Path

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)

INK = "#1b1f2a"
LINE = "#2f3a56"
FILL = "#f3f6fc"
ACCENT = "#1f4e9c"
ACCENT_FILL = "#dbe6f7"
FONT = "Arial, Helvetica, sans-serif"


def esc(s):
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")


def svg(w, h, body):
    defs = f"""<defs>
<marker id="open" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="10" markerHeight="10" orient="auto-start-reverse"><path d="M1 1L11 6L1 11" fill="none" stroke="{LINE}" stroke-width="1.4"/></marker>
<marker id="full" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse"><path d="M1 1L11 6L1 11z" fill="{LINE}"/></marker>
<marker id="tri" viewBox="0 0 16 16" refX="15" refY="8" markerWidth="14" markerHeight="14" orient="auto-start-reverse"><path d="M1 1L15 8L1 15z" fill="#fff" stroke="{LINE}" stroke-width="1.3"/></marker>
<marker id="diam" viewBox="0 0 20 12" refX="1" refY="6" markerWidth="16" markerHeight="10" orient="auto-start-reverse"><path d="M1 6L10 1L19 6L10 11z" fill="{LINE}"/></marker>
</defs>"""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}" '
            f'font-family="{FONT}" font-size="13" fill="{INK}">{defs}<rect width="{w}" height="{h}" fill="#fff"/>{body}</svg>')


def text(x, y, s, size=13, anchor="middle", weight="normal", style="normal", fill=INK):
    return (f'<text x="{x}" y="{y}" font-size="{size}" text-anchor="{anchor}" font-weight="{weight}" '
            f'font-style="{style}" fill="{fill}">{esc(s)}</text>')


def lines(x, y, rows, size=13, anchor="middle", gap=16, **kw):
    return "".join(text(x, y + i * gap, r, size, anchor, **kw) for i, r in enumerate(rows))


def box(x, y, w, h, fill=FILL, stroke=LINE, sw=1.3, rx=6):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}"/>'


def path(d, marker_end=None, dash=False, sw=1.3, marker_start=None, color=LINE):
    m = f' marker-end="url(#{marker_end})"' if marker_end else ""
    ms = f' marker-start="url(#{marker_start})"' if marker_start else ""
    da = ' stroke-dasharray="6 4"' if dash else ""
    return f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw}"{m}{ms}{da}/>'


def actor(x, y, label):
    # x, y : centre de la tête
    s = (f'<circle cx="{x}" cy="{y}" r="11" fill="#fff" stroke="{LINE}" stroke-width="1.5"/>'
         f'<path d="M{x} {y+11}V{y+44}M{x-20} {y+24}H{x+20}M{x} {y+44}L{x-16} {y+70}M{x} {y+44}L{x+16} {y+70}" '
         f'fill="none" stroke="{LINE}" stroke-width="1.5"/>')
    rows = label if isinstance(label, list) else [label]
    return s + lines(x, y + 90, rows, 13, weight="bold")


def usecase(cx, cy, rows, w=220, h=54, hl=False):
    f = ACCENT_FILL if hl else FILL
    s = ACCENT if hl else LINE
    e = f'<ellipse cx="{cx}" cy="{cy}" rx="{w/2}" ry="{h/2}" fill="{f}" stroke="{s}" stroke-width="{1.8 if hl else 1.3}"/>'
    rows = rows if isinstance(rows, list) else [rows]
    y0 = cy + 5 - (len(rows) - 1) * 8
    return e + lines(cx, y0, rows, 13)


# ---------------------------------------------------------------- 1. hiérarchie UML
def hierarchy():
    b = []
    w, h = 980, 560
    b.append(box(370, 20, 240, 44, fill="#fff", sw=1.6))
    b.append(text(490, 47, "Diagrammes UML", 15, weight="bold"))
    b.append(box(40, 110, 300, 44))
    b.append(text(190, 137, "Diagrammes structurels", 14, weight="bold"))
    b.append(box(560, 110, 320, 44))
    b.append(text(720, 137, "Diagrammes comportementaux", 14, weight="bold"))
    b.append(path("M490 64V88H190V110"))
    b.append(path("M490 88H720V110"))
    left = ["Diagramme de classes", "Diagramme d'objets", "Diagramme de composants",
            "Diagramme de déploiement", "Diagramme de paquetages", "Diagramme de structure composite"]
    keep = {"Diagramme de classes", "Diagramme de déploiement", "Diagramme de cas d'utilisation",
            "Diagramme de séquence"}
    spine = 70
    for i, name in enumerate(left):
        y = 180 + i * 52
        hl = name in keep
        b.append(path(f"M{spine} {y - 52 + 26 if i else 154}V{y + 17}H100"))
        b.append(box(100, y, 270, 34, fill=ACCENT_FILL if hl else "#fff", stroke=ACCENT if hl else LINE, sw=1.8 if hl else 1.2))
        b.append(text(235, y + 22, name, 13, weight="bold" if hl else "normal"))
    right = ["Diagramme de cas d'utilisation", "Diagramme d'activité", "Diagramme d'états-transitions"]
    spine2 = 590
    for i, name in enumerate(right):
        y = 180 + i * 52
        hl = name in keep
        b.append(path(f"M{spine2} {y - 52 + 26 if i else 154}V{y + 17}H620"))
        b.append(box(620, y, 290, 34, fill=ACCENT_FILL if hl else "#fff", stroke=ACCENT if hl else LINE, sw=1.8 if hl else 1.2))
        b.append(text(765, y + 22, name, 13, weight="bold" if hl else "normal"))
    y = 180 + 3 * 52
    b.append(path(f"M{spine2} {y - 26}V{y + 17}H620"))
    b.append(box(620, y, 290, 34))
    b.append(text(765, y + 22, "Diagrammes d'interaction", 13, weight="bold"))
    inter = ["Diagramme de séquence", "Diagramme de communication", "Vue globale d'interaction", "Diagramme de temps"]
    spine3 = 650
    for i, name in enumerate(inter):
        yy = y + 52 + i * 46
        hl = name in keep
        b.append(path(f"M{spine3} {yy - 46 + 23 if i else y + 34}V{yy + 15}H680"))
        b.append(box(680, yy, 250, 30, fill=ACCENT_FILL if hl else "#fff", stroke=ACCENT if hl else LINE, sw=1.8 if hl else 1.2))
        b.append(text(805, yy + 20, name, 12.5, weight="bold" if hl else "normal"))
    b.append(box(40, 500, 26, 18, fill=ACCENT_FILL, stroke=ACCENT, sw=1.8, rx=3))
    b.append(text(76, 514, "Diagrammes retenus dans ce rapport", 13, anchor="start"))
    return svg(w, h, "".join(b))


# ---------------------------------------------------------------- 2. cas d'utilisation
def usecases():
    b = []
    w, h = 1060, 660
    b.append(box(250, 20, 600, 620, fill="#fff", sw=1.6, rx=4))
    b.append(text(550, 46, "Système RSA FileSecure (navigateur)", 15, weight="bold"))
    uc = {
        "import": (430, 110, ["Importer la clé publique", "d'un binôme"]),
        "chiffrer": (430, 210, "Chiffrer un fichier"),
        "verif": (700, 210, ["Vérifier l'empreinte", "de la clé"]),
        "generer": (430, 320, "Générer une paire de clés"),
        "exporter": (430, 395, "Exporter la clé publique"),
        "sauver": (430, 470, ["Sauvegarder la clé privée", "protégée"]),
        "dechiffrer": (430, 570, "Déchiffrer un fichier"),
        "recharger": (700, 570, ["Recharger sa", "clé privée"]),
        "comprendre": (700, 345, ["Comprendre RSA", "pas à pas"]),
        "tests": (700, 445, ["Exécuter les tests", "automatiques"]),
    }
    hl = {"chiffrer", "dechiffrer"}
    for k, (cx, cy, rows) in uc.items():
        b.append(usecase(cx, cy, rows, w=230 if k in ("import", "sauver", "generer", "exporter", "dechiffrer", "chiffrer") else 200, hl=k in hl))
    # acteurs
    b.append(actor(120, 120, ["Expéditrice", "(Awa)"]))
    b.append(actor(120, 400, ["Destinataire", "(Koffi)"]))
    b.append(actor(960, 340, "Enseignant"))
    # associations expéditrice
    b.append(path("M142 150L316 115"))
    b.append(path("M142 160L316 205"))
    # destinataire
    for y in (320, 395, 470, 570):
        b.append(path(f"M142 {440}L316 {y}"))
    # enseignant
    b.append(path("M938 372L800 348"))
    b.append(path("M938 382L800 440"))
    # include / extend
    b.append(path("M545 210H598", marker_end="open", dash=True))
    b.append(text(572, 200, "«include»", 11.5, style="italic"))
    b.append(path("M598 570H547", marker_end="open", dash=True))
    b.append(text(572, 560, "«extend»", 11.5, style="italic"))
    b.append(text(700, 612, "si aucune clé n'est chargée", 11.5, style="italic", fill="#4a5168"))
    return svg(w, h, "".join(b))


# ---------------------------------------------------------------- 3 et 4. séquences
def sequence(title_parts, steps, height):
    names, xs = title_parts
    b = []
    w = 1000
    for name, x in zip(names, xs):
        if name.startswith("@"):
            b.append(actor(x, 26, name[1:]))
        else:
            rows = name.split("|")
            b.append(box(x - 95, 28, 190, 48, fill=FILL))
            b.append(lines(x, 48 if len(rows) == 2 else 57, rows, 13, weight="bold", gap=15))
        b.append(path(f"M{x} {130}V{height - 20}", dash=True, sw=1))
    for st in steps:
        kind = st[0]
        if kind in ("msg", "ret"):
            _, a, c, y, label = st
            xa, xc = xs[a], xs[c]
            d = 1 if xc > xa else -1
            b.append(path(f"M{xa} {y}H{xc - d * 2}", marker_end="full" if kind == "msg" else "open", dash=kind == "ret"))
            b.append(text((xa + xc) / 2, y - 7, label, 12.5))
        elif kind == "self":
            _, a, y, label = st
            x = xs[a]
            b.append(path(f"M{x} {y}H{x + 40}V{y + 22}H{x + 2}", marker_end="full"))
            b.append(text(x + 48, y + 15, label, 12.5, anchor="start"))
        elif kind == "frame":
            _, x0, y0, x1, y1, tag, cond = st
            b.append(f'<rect x="{x0}" y="{y0}" width="{x1 - x0}" height="{y1 - y0}" fill="none" stroke="{LINE}" stroke-width="1.2"/>')
            tw = 14 + 7.5 * len(tag)
            b.append(f'<path d="M{x0} {y0}H{x0 + tw}V{y0 + 14}L{x0 + tw - 8} {y0 + 22}H{x0}z" fill="{FILL}" stroke="{LINE}" stroke-width="1.2"/>')
            b.append(text(x0 + 7, y0 + 16, tag, 12.5, anchor="start", weight="bold"))
            b.append(text(x0 + tw + 10, y0 + 16, cond, 12.5, anchor="start", style="italic"))
        elif kind == "sep":
            _, x0, y, x1, cond = st
            b.append(path(f"M{x0} {y}H{x1}", dash=True, sw=1))
            b.append(text(x0 + 10, y + 16, cond, 12.5, anchor="start", style="italic"))
    return svg(w, height, "".join(b))


def seq_encrypt():
    names = ["@Awa", "Interface|(page Chiffrer)", "Moteur|cryptographique", "API Web Crypto|du navigateur"]
    xs = [80, 330, 600, 870]
    s = [
        ("msg", 0, 1, 170, "choisir le fichier et le destinataire"),
        ("msg", 0, 1, 210, "confirmer l'empreinte vérifiée"),
        ("msg", 0, 1, 250, "cliquer sur « Chiffrer »"),
        ("msg", 1, 2, 290, "encryptFile(fichier, clé publique)"),
        ("msg", 2, 3, 330, "generateKey(AES-256-GCM)"),
        ("ret", 3, 2, 362, "clé de session (32 octets)"),
        ("msg", 2, 3, 402, "encrypt(RSA-OAEP, clé de session)"),
        ("ret", 3, 2, 434, "clé scellée (384 octets)"),
        ("msg", 2, 3, 474, "digest(SHA-256, fichier)"),
        ("ret", 3, 2, 506, "condensat du fichier"),
        ("frame", 470, 530, 960, 680, "loop", "[pour chaque morceau d'1 Mo]"),
        ("msg", 2, 3, 580, "encrypt(AES-GCM, IV i, données associées)"),
        ("ret", 3, 2, 612, "morceau chiffré et étiquette"),
        ("ret", 2, 1, 652, "avancement réel"),
        ("self", 2, 700, "assembler le fichier .rsaenc"),
        ("ret", 2, 1, 760, "fichier .rsaenc"),
        ("ret", 1, 0, 800, "étapes terminées, bouton « Télécharger »"),
    ]
    return sequence((names, xs), s, 840)


def seq_decrypt():
    names = ["@Koffi", "Interface|(page Déchiffrer)", "Moteur|cryptographique", "API Web Crypto|du navigateur"]
    xs = [80, 330, 600, 870]
    s = [
        ("msg", 0, 1, 170, "déposer le fichier .rsaenc"),
        ("msg", 1, 2, 210, "parseContainer(octets)"),
        ("ret", 2, 1, 242, "en-tête : destinataire, algorithmes"),
        ("msg", 0, 1, 282, "charger le .rsakey, saisir le mot de passe"),
        ("msg", 1, 2, 322, "importProtectedPrivateKey(fichier, mot de passe)"),
        ("msg", 2, 3, 362, "deriveKey(PBKDF2, 600 000 itérations)"),
        ("msg", 2, 3, 402, "decrypt(AES-GCM, clé PKCS #8 chiffrée)"),
        ("ret", 3, 2, 434, "clé privée, non exportable"),
        ("msg", 1, 2, 474, "decryptFile(octets, clé privée)"),
        ("msg", 2, 3, 514, "decrypt(RSA-OAEP, clé scellée)"),
        ("ret", 3, 2, 546, "clé de session"),
        ("frame", 470, 570, 960, 680, "loop", "[pour chaque morceau]"),
        ("msg", 2, 3, 620, "decrypt(AES-GCM, IV i, données associées)"),
        ("ret", 3, 2, 652, "morceau clair, ou échec de l'étiquette"),
        ("frame", 200, 700, 960, 900, "alt", "[une étiquette est invalide]"),
        ("ret", 2, 1, 750, "refus : fichier modifié, rien n'est restitué"),
        ("sep", 200, 775, 960, "[sinon]"),
        ("msg", 2, 3, 820, "digest(SHA-256, fichier restauré)"),
        ("ret", 2, 1, 868, "fichier d'origine, SHA-256 identique"),
        ("ret", 1, 0, 940, "télécharger le fichier d'origine"),
    ]
    return sequence((names, xs), s, 980)


# ---------------------------------------------------------------- 5. classes
def klass(x, y, w, name, attrs, stereo=None):
    hh = 44 if stereo else 30
    h = hh + 10 + 17 * len(attrs)
    s = box(x, y, w, h, fill="#fff", rx=2)
    s += f'<rect x="{x}" y="{y}" width="{w}" height="{hh}" fill="{FILL}" stroke="{LINE}" stroke-width="1.3"/>'
    if stereo:
        s += text(x + w / 2, y + 16, f"«{stereo}»", 11.5, style="italic")
        s += text(x + w / 2, y + 34, name, 14, weight="bold")
    else:
        s += text(x + w / 2, y + 20, name, 14, weight="bold")
    for i, a in enumerate(attrs):
        s += (f'<text x="{x + 10}" y="{y + hh + 20 + 17 * i}" font-size="12" font-family="Consolas, monospace" '
              f'fill="{INK}">{esc(a)}</text>')
    return s, h


def classes():
    b = []
    w, h = 1010, 640
    parts = [
        (20, 30, 240, "PrivateKeyFile", ["format : string", "version : 1", "name : string", "bits : number", "kid : string",
                                          "publicKey : Base64", "kdf : PBKDF2", "cipher : AES-GCM", "data : Base64"], "fichier .rsakey"),
        (385, 30, 250, "PublicKeyInfo", ["name : string", "bits : number", "spki : octets", "publicKey : CryptoKey",
                                         "kid : string", "fingerprint : string"], None),
        (750, 30, 240, "ContainerHeader", ["alg : RSA-OAEP-256, AES-256-GCM", "kid : string", "bits : number",
                                           "wrappedKey : Base64", "ivPrefix : Base64", "chunkSize : number", "chunks : number"], "en-tête .rsaenc"),
        (230, 300, 230, "Identity", ["privateKey : CryptoKey", "createdAt : string", "exportable : boolean"], None),
        (510, 300, 220, "Contact", ["pem : string", "verified : boolean", "addedAt : string"], None),
        (790, 300, 200, "FileMeta", ["name : string", "type : string", "size : number", "sha256 : string"], None),
        (20, 470, 230, "FileSecureError", ["code : ErrorCode", "message : string"], None),
        (520, 480, 220, "EncryptResult", ["parts : octets[]", "size : number", "header : ContainerHeader", "meta : FileMeta",
                                          "layout : répartition"], None),
        (790, 480, 200, "DecryptResult", ["data : octets", "meta : FileMeta", "sha256 : string", "header : ContainerHeader"], None),
    ]
    for x, y, ww, name, attrs, st in parts:
        s, _ = klass(x, y, ww, name, attrs, st)
        b.append(s)
    # généralisations
    b.append(path("M345 300L470 174", marker_end="tri"))
    b.append(path("M620 300L545 174", marker_end="tri"))
    # PrivateKeyFile protège Identity
    b.append(path("M150 237V345H228", marker_end="open"))
    b.append(text(184, 337, "protège", 12, style="italic"))
    b.append(text(212, 362, "1", 12))
    # ContainerHeader destiné à PublicKeyInfo
    b.append(path("M750 110H637", marker_end="open"))
    b.append(text(694, 101, "destiné à", 12, style="italic"))
    b.append(text(650, 126, "1", 12))
    # EncryptResult compose header et meta
    b.append(path("M740 505H762V205", marker_start="diam", marker_end="open"))
    b.append(text(772, 260, "1", 12, anchor="start"))
    b.append(path("M715 480V440H860V410", marker_start="diam", marker_end="open"))
    b.append(text(868, 428, "1", 12, anchor="start"))
    # DecryptResult vers FileMeta et ContainerHeader
    b.append(path("M930 480V410", marker_end="open"))
    b.append(path("M990 520H1002V160H992", marker_end="open"))
    b.append(text(232, 590, "levée par le moteur avec un code stable", 12, style="italic", fill="#4a5168"))
    b.append(text(232, 606, "(WRONG_KEY, TAMPERED, INTEGRITY...)", 12, style="italic", fill="#4a5168"))
    return svg(w, h, "".join(b))


# ---------------------------------------------------------------- 6. déploiement
def node(x, y, w, h, stereo, name):
    d = 14
    s = (f'<path d="M{x} {y}L{x + d} {y - d}H{x + w + d}V{y + h - d}L{x + w} {y + h}" fill="#e9eef8" stroke="{LINE}" stroke-width="1.3"/>'
         f'<path d="M{x + w} {y}L{x + w + d} {y - d}" stroke="{LINE}" stroke-width="1.3"/>')
    s += box(x, y, w, h, fill="#fff", rx=0)
    s += text(x + w / 2, y + 20, f"«{stereo}»", 11.5, style="italic")
    s += text(x + w / 2, y + 38, name, 14, weight="bold")
    return s


def comp(x, y, w, stereo, rows):
    h = 26 + 16 * len(rows)
    s = box(x, y, w, h, fill=FILL, rx=3)
    s += text(x + w / 2, y + 16, f"«{stereo}»", 11, style="italic")
    s += lines(x + w / 2, y + 33, rows, 12.5, weight="bold")
    return s, h


def deployment():
    b = []
    w, h = 1000, 600
    for x, name in ((20, "Poste de l'expéditrice"), (640, "Poste du destinataire")):
        b.append(node(x, 40, 330, 280, "device", name))
        b.append(text(x + 165, 56 + 16, "", 1))
        s, _ = comp(x + 20, 100, 290, "artifact", ["Application RSA FileSecure", "(interface et moteur cryptographique)"])
        b.append(s)
        s, _ = comp(x + 20, 172, 290, "composant", ["API Web Crypto du navigateur"])
        b.append(s)
        s, _ = comp(x + 20, 228, 135, "stockage", ["Stockage local"])
        b.append(s)
        s, _ = comp(x + 175, 228, 135, "mémoire", ["Clé privée"])
        b.append(s)
    b.append(node(300, 400, 400, 150, "environnement d'exécution", "Vercel, réseau de diffusion"))
    s, _ = comp(330, 460, 340, "artifact", ["Site compilé (dist) : index.html,", "JavaScript et CSS"])
    b.append(s)
    b.append(path("M185 320V470H298", marker_end="open", marker_start="open"))
    b.append(path("M805 320V470H702", marker_end="open", marker_start="open"))
    b.append(text(190, 400, "HTTPS", 12.5, anchor="start", weight="bold"))
    b.append(text(190, 416, "chargement du site", 12, anchor="start", style="italic"))
    b.append(text(810, 400, "HTTPS", 12.5, anchor="start", weight="bold"))
    b.append(text(810, 416, "chargement du site", 12, anchor="start", style="italic"))
    b.append(path("M350 180H640", marker_end="open", marker_start="open", dash=True))
    b.append(text(495, 168, "canal non sûr : e-mail, clé USB", 12.5, weight="bold"))
    b.append(text(495, 200, "clé publique .pem, fichier .rsaenc", 12, style="italic"))
    return svg(w, h, "".join(b))


for name, fn in [("uml-hierarchie", hierarchy), ("uml-cas-utilisation", usecases), ("uml-sequence-chiffrement", seq_encrypt),
                 ("uml-sequence-dechiffrement", seq_decrypt), ("uml-classes", classes), ("uml-deploiement", deployment)]:
    (OUT / f"{name}.svg").write_text(fn(), encoding="utf-8")
    print(name)
