"""Rapport de TP RSA FileSecure en 20 pages, sur la structure du mémoire ESATIC."""
import sys
from pathlib import Path

from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Cm, Pt

from docx_kit import DARK, Report, smart

HERE = Path(__file__).parent
IMG = HERE / "img"
UML = HERE / "uml"
SHOTS = Path(r"C:\Users\hp\TP-RSA\docs\guide-source\shots")
OUT = Path(sys.argv[1])

r = Report()
d = r.doc
for name, before, after in (("Heading 2", 14, 6), ("Heading 3", 8, 4), ("Heading 4", 6, 3)):
    d.styles[name].paragraph_format.space_before = Pt(before)
    d.styles[name].paragraph_format.space_after = Pt(after)


def banner(title):
    """Titre de partie encadré, en tête de page plutôt que sur une page à part."""
    h = d.add_paragraph(style="Heading 1")
    h.paragraph_format.page_break_before = True
    h.paragraph_format.space_before = Pt(0)
    h.paragraph_format.space_after = Pt(14)
    h.paragraph_format.left_indent = Cm(2.5)
    h.paragraph_format.right_indent = Cm(2.5)
    r.runs(h, title)
    h._p.get_or_add_pPr().append(parse_xml(
        f'<w:pBdr {nsdecls("w")}>' + "".join(
            f'<w:{e} w:val="single" w:sz="18" w:space="6" w:color="{DARK}"/>' for e in ("top", "left", "bottom", "right"))
        + "</w:pBdr>"))


def figure_pair(items):
    """Deux figures côte à côte, chacune avec sa légende numérotée."""
    t = d.add_table(rows=1, cols=len(items))
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    for cell, (path, title, width) in zip(t.rows[0].cells, items):
        r.fig += 1
        cell.width = Cm(8)
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p.paragraph_format.line_spacing = 1.0
        p.add_run().add_picture(str(path), width=Cm(width))
        cap = cell.add_paragraph(style="Caption")
        cap.add_run("Figure ")
        r.field(cap, "SEQ Figure \\* ARABIC", str(r.fig))
        cap.add_run(" : " + smart(title))
    d.add_paragraph().paragraph_format.space_after = Pt(0)


def compact_list(rows, size=11):
    """Tableau sans bordure, pour les sigles."""
    t = d.add_table(rows=len(rows), cols=2)
    for row, (a, b) in zip(t.rows, rows):
        row.cells[0].width, row.cells[1].width = Cm(2.6), Cm(13.4)
        for cell, txt, bold in ((row.cells[0], a, True), (row.cells[1], b, False)):
            p = cell.paragraphs[0]
            p.style = d.styles["Cellule"]
            r.runs(p, txt, size=size)
            for rn in p.runs:
                rn.bold = bold
            p.paragraph_format.space_after = Pt(1)


# =====================================================================================
# COUVERTURE
# =====================================================================================
top = d.add_table(rows=1, cols=2)
top.alignment = WD_TABLE_ALIGNMENT.CENTER
c0, c1 = top.rows[0].cells
c0.width, c1.width = Cm(9), Cm(7)
p0 = c0.paragraphs[0]
p0.alignment = WD_ALIGN_PARAGRAPH.CENTER
run = p0.add_run(smart("Ministère de la Transition Numérique et de l'Innovation Technologique"))
run.bold = True
run.font.name = "Calibri"
run.font.size = Pt(11)
p0.paragraph_format.line_spacing = 1.15
p0._p.get_or_add_pPr().append(parse_xml(
    f'<w:pBdr {nsdecls("w")}><w:bottom w:val="single" w:sz="12" w:space="4" w:color="4472C4"/></w:pBdr>'))
p1 = c1.paragraphs[0]
p1.alignment = WD_ALIGN_PARAGRAPH.RIGHT
p1.paragraph_format.space_before = Pt(14)
p1.add_run("Année académique : 2026-2027").bold = True

logo = d.add_paragraph()
logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
logo.paragraph_format.space_before = Pt(36)
logo.paragraph_format.space_after = Pt(30)
logo.add_run().add_picture(str(IMG / "logo-esatic.jpg"), width=Cm(8.5))
r.p("**RAPPORT DE TRAVAUX PRATIQUES**", align="c", after=2, size=14)
r.p("MODULE : CRYPTOGRAPHIE", align="c", after=24, size=13)
r.framed(size=14, width_cm=15.5, rows=["CONCEPTION ET DÉVELOPPEMENT D'UNE",
                                       "APPLICATION WEB DE CHIFFREMENT DE FICHIERS",
                                       "PAR RSA ENTRE BINÔMES : RSA FILESECURE"])
r.p("", after=18)
r.p("Réalisé par :", align="c", after=2)
r.p("**ASSALÉ N'DAH JEAN-FRANÇOIS**", align="c", after=0)
r.p("**[NOM ET PRÉNOMS DU BINÔME]**", align="c", after=10)
r.p("Remis le : **[date de remise]**", align="c", after=60)
sup = d.add_table(rows=1, cols=2)
sup.alignment = WD_TABLE_ALIGNMENT.CENTER
a, b = sup.rows[0].cells
a.width, b.width = Cm(8), Cm(8)
for cell, rows in ((a, ["**Enseignant du module**", "**[Nom de l'enseignant]**", "Enseignant, ESATIC"]),
                   (b, ["**Application en ligne**", "rsa-filesecure.vercel.app", "Code source : dossier TP-RSA"])):
    for k, txt in enumerate(rows):
        para = cell.paragraphs[0] if k == 0 else cell.add_paragraph()
        r.runs(para, txt)
        para.paragraph_format.space_after = Pt(4)
        if k == 0:
            for rn in para.runs:
                rn.underline = True

# =====================================================================================
# PAGES LIMINAIRES : i à v
# =====================================================================================
r.new_section("lowerRoman", 1)

r.lim("RÉSUMÉ", page_break=False)
r.p("Ce rapport présente RSA FileSecure, une application web réalisée en binôme pour le module de cryptographie. Le sujet demandait de chiffrer des fichiers avec RSA, puis de permettre au binôme de les déchiffrer avec le même algorithme. Comme RSA ne chiffre directement que de petits messages, 318 octets au plus avec une clé de 3072 bits, nous avons retenu un chiffrement hybride : AES-256-GCM chiffre le fichier avec une clé de session aléatoire, et RSA-OAEP chiffre cette clé avec la clé publique du destinataire.")
r.p("Conçue selon le Processus Unifié et modélisée en UML, l'application est développée en TypeScript avec React. Toute la cryptographie passe par l'API Web Crypto du navigateur : aucun fichier, aucune clé et aucun mot de passe ne transite par un serveur. Vingt-deux tests automatisés, dont trois avec OpenSSL, valident son fonctionnement ; un fichier de 100 Mo est chiffré en 0,63 seconde et toute modification est détectée.")
r.p("**Mots-clés :** RSA, OAEP, chiffrement hybride, AES-GCM, API Web Crypto.")
abs_t = r.lim("ABSTRACT", page_break=False)
abs_t.paragraph_format.space_before = Pt(18)
r.p("This report presents RSA FileSecure, a web application built by a pair of students for the cryptography course. The assignment required encrypting files with RSA so that the other member of the pair could decrypt them with the same algorithm. Since RSA can only encrypt small messages directly, at most 318 bytes with a 3072-bit key, we chose hybrid encryption: AES-256-GCM encrypts the file under a random session key, and RSA-OAEP encrypts that key with the recipient's public key.")
r.p("Designed with the Unified Process and modelled in UML, the application is written in TypeScript with React. All cryptography relies on the browser's Web Crypto API, so no file, key or password is ever sent to a server. Twenty-two automated tests, three of them against OpenSSL, validate it; a 100 MB file is encrypted in 0.63 seconds and any modification is detected.")
r.p("**Keywords:** RSA, OAEP, hybrid encryption, AES-GCM, Web Crypto API.")

r.lim("DÉDICACE")
r.p("*À nos parents, pour leur soutien constant tout au long de notre formation.*", align="r", after=10)
t = r.lim("REMERCIEMENTS", page_break=False)
t.paragraph_format.space_before = Pt(18)
r.p("Nous exprimons notre gratitude au **Professeur KONATÉ Adama**, Directeur Général de l'École Supérieure Africaine des Technologies de l'Information et de la Communication (ESATIC), pour la qualité de la formation dispensée ; à **[Nom de l'enseignant]**, enseignant du module de cryptographie, pour ses enseignements et pour un sujet qui nous a obligés à confronter la théorie de RSA à ses usages réels ; enfin à nos camarades de promotion et à nos familles, pour leurs échanges et leurs encouragements.")
t = r.lim("AVANT-PROPOS", page_break=False)
t.paragraph_format.space_before = Pt(18)
r.p("Ce rapport rend compte d'un travail pratique du module de cryptographie de l'ESATIC, réalisé en binôme. Le sujet, volontairement court, laissait ouvertes plusieurs questions : l'échange des clés, la taille des fichiers, la protection de la clé privée et la réaction face à un fichier altéré. Nous avons traité chacune d'elles comme une exigence, afin de produire un outil réellement utilisable, aujourd'hui publié en ligne. Ce travail nous a surtout permis de mesurer l'écart entre un algorithme correct et un système sûr.")

r.lim("LISTE DES SIGLES ET ABRÉVIATIONS")
compact_list([
    ("AES", "Advanced Encryption Standard (norme de chiffrement avancé)"),
    ("API", "Application Programming Interface (interface de programmation applicative)"),
    ("ESATIC", "École Supérieure Africaine des Technologies de l'Information et de la Communication"),
    ("GCM", "Galois/Counter Mode (mode compteur de Galois, chiffrement authentifié)"),
    ("HTTPS", "HyperText Transfer Protocol Secure (protocole de transfert hypertexte sécurisé)"),
    ("IV", "Initialization Vector (vecteur d'initialisation)"),
    ("NIST", "National Institute of Standards and Technology"),
    ("OAEP", "Optimal Asymmetric Encryption Padding (remplissage pour le chiffrement asymétrique)"),
    ("OWASP", "Open Worldwide Application Security Project"),
    ("PBKDF2", "Password-Based Key Derivation Function 2 (dérivation de clé à partir d'un mot de passe)"),
    ("PEM", "Privacy-Enhanced Mail (format texte d'échange de clés)"),
    ("RFC", "Request for Comments (document de normalisation de l'Internet)"),
    ("RSA", "Rivest, Shamir, Adleman (algorithme de chiffrement à clé publique)"),
    ("SHA", "Secure Hash Algorithm (algorithme de hachage sécurisé)"),
    ("UML", "Unified Modeling Language (langage de modélisation unifié)"),
    ("UP", "Unified Process (Processus Unifié)"),
])
t = r.lim("GLOSSAIRE", page_break=False)
t.paragraph_format.space_before = Pt(18)
for g_, t_ in [
    ("Chiffrement hybride", "association d'un chiffrement symétrique, qui protège le fichier, et d'un chiffrement asymétrique, qui protège la clé symétrique."),
    ("Clé de session", "clé AES de 256 bits tirée au hasard pour un seul fichier, puis scellée par RSA."),
    ("Empreinte", "résumé SHA-256 d'une clé publique, affiché en huit groupes de quatre caractères pour être comparé à voix haute."),
    ("Étiquette d'intégrité", "valeur de 16 octets produite par AES-GCM ; elle prouve qu'un bloc chiffré n'a pas été modifié."),
    ("Vecteur d'initialisation", "valeur qui rend unique chaque chiffrement réalisé avec une même clé."),
]:
    para = r.p(f"**{g_}** : {t_}", after=2)
    para.paragraph_format.line_spacing = 1.15

r.lim("LISTE DES TABLEAUX")
r.toc('TOC \\h \\z \\c "Tableau"')
t = r.lim("LISTE DES FIGURES", page_break=False)
t.paragraph_format.space_before = Pt(24)
r.toc('TOC \\h \\z \\c "Figure"')
r.lim("SOMMAIRE")
r.toc('TOC \\o "1-3" \\h \\z \\u')

# =====================================================================================
# CORPS : 1 à 12
# =====================================================================================
r.new_section("decimal", 1)
r.h(1, "INTRODUCTION")
r.p("Rapports, pièces justificatives et données personnelles circulent chaque jour par courrier électronique, par messagerie ou sur des clés USB, sans qu'aucun de ces canaux ne garantisse que seul le destinataire pourra les lire. La cryptographie à clé publique répond à ce besoin, et RSA, publié en 1978 par Rivest, Shamir et Adleman, en reste la référence.")
r.p("Le travail pratique qui nous a été confié s'inscrit dans ce contexte : « Créer un site web permettant de chiffrer des fichiers à l'aide de l'algorithme RSA, puis de permettre à son binôme de les déchiffrer à l'aide du même algorithme. » Or RSA ne chiffre qu'un bloc de quelques centaines d'octets. Comment, dès lors, permettre à deux personnes qui ne partagent aucun secret d'échanger un fichier de taille quelconque, lisible par le seul destinataire, en s'appuyant sur RSA ?")
r.p("Pour y répondre, nous avons conçu RSA FileSecure. Ce rapport présente d'abord le projet et les notions qu'il mobilise, puis la conception du système, et enfin sa mise en œuvre et ses résultats.")

banner("PREMIÈRE PARTIE : GÉNÉRALITÉS")
r.h(2, "CHAPITRE 1 : PRÉSENTATION DU PROJET")
r.h(3, "I. Contexte et concepts clés")
r.p("Le projet est un travail pratique réalisé en binôme, avec un double objectif : comprendre RSA en le mettant en œuvre, et produire un outil réellement utilisable. Le sujet impose deux rôles : Awa, l'expéditrice, chiffre un fichier ; Koffi, le destinataire, est le seul à pouvoir le déchiffrer. Trois notions structurent le travail : le **chiffrement asymétrique**, où une clé publique chiffre et une clé privée déchiffre ; le **chiffrement hybride**, qui confie le fichier à un algorithme symétrique et sa clé à RSA ; l'**empreinte**, résumé court d'une clé publique que l'on compare de vive voix.")
r.h(3, "II. Étude de l'existant")
r.p("Les outils courants de protection de fichiers se répartissent en quatre familles, comparées dans le tableau suivant.")
r.table("Solutions existantes de protection de fichiers",
        ["Solution", "Atouts", "Limites au regard du TP"],
        [["GnuPG (OpenPGP)", "Chiffrement hybride robuste, gestion des clés", "Installation et prise en main techniques"],
         ["OpenSSL", "Boîte à outils complète, référence du domaine", "Chiffrement de fichiers à assembler à la main"],
         ["Archives chiffrées (7-Zip)", "Simple et très répandu", "Mot de passe à transmettre ; pas de RSA"],
         ["Services en ligne", "Aucune installation", "Le fichier quitte l'ordinateur de l'utilisateur"]],
        [4.2, 5.6, 6.2], bold_first_col=True, font_size=10.5)
r.p("Quatre limites en ressortent : **L1**, une prise en main technique ; **L2**, la nécessité de partager un secret ; **L3**, la confiance accordée à un tiers ; **L4**, l'opacité du fonctionnement, qui ne sert pas l'objectif pédagogique du travail.")
r.h(3, "III. Cahier des charges")
r.p("L'objectif général est de concevoir une application web permettant de chiffrer un fichier avec RSA pour son binôme, et à ce binôme de le déchiffrer. Les exigences fonctionnelles sont les suivantes :")
r.bullets(["générer, exporter et sauvegarder des paires de clés RSA, la clé privée étant protégée par un mot de passe ;",
           "échanger les clés publiques et vérifier leur empreinte ;",
           "chiffrer tout fichier jusqu'à 100 Mo et produire un fichier .rsaenc ;",
           "déchiffrer, vérifier l'intégrité et refuser tout fichier altéré ;",
           "expliquer RSA pas à pas et exécuter les tests dans le navigateur."], kind="diamond")
r.p("Sur le plan non fonctionnel, l'application doit n'utiliser que des algorithmes normalisés, n'envoyer aucune donnée sur le réseau, rester utilisable sur téléphone et traiter 100 Mo en moins de deux secondes. Le périmètre exclut la preuve de l'identité de l'expéditeur et l'envoi à plusieurs destinataires.")

r.h(2, "CHAPITRE 2 : NOTIONS DE CRYPTOGRAPHIE MOBILISÉES")
r.h(3, "I. Le chiffrement RSA")
r.p("RSA repose sur la difficulté de factoriser un grand nombre n = p × q, produit de deux nombres premiers secrets. On choisit un exposant public e, en pratique 65537, premier avec φ(n) = (p − 1)(q − 1), puis l'exposant privé d, inverse de e modulo φ(n). La clé publique est le couple (n, e), la clé privée le couple (n, d) :")
r.formula("c = m^{e} mod n          m = c^{d} mod n")
r.p("Avec p = 61 et q = 53, on obtient n = 3233 et, pour e = 17, d = 2753 : le message 65 se chiffre en 2790, qui se déchiffre bien en 65.")
r.h(3, "II. Les limites de RSA et le remplissage OAEP")
r.p("Utilisé seul, RSA est déterministe, malléable et limité à un bloc plus petit que n. Le remplissage OAEP (RFC 8017) le rend probabiliste et rejette tout chiffré modifié, mais réduit encore la place disponible : 318 octets au plus avec une clé de 3072 bits et SHA-256. Chiffrer 100 Mo bloc par bloc demanderait environ 330 000 opérations RSA, soit plus de dix minutes au déchiffrement sur notre machine.")
r.h(3, "III. Le chiffrement hybride et les primitives associées")
r.p("La solution standard, adoptée par OpenPGP, combine les deux familles. Une clé de session AES de 256 bits chiffre le fichier en mode GCM, qui produit pour chaque bloc une étiquette d'intégrité : la moindre modification fait échouer le déchiffrement. RSA-OAEP ne chiffre que cette clé de 32 octets. SHA-256 sert à calculer les empreintes et à vérifier le fichier restauré, et PBKDF2, avec 600 000 itérations comme le recommande l'OWASP, dérive du mot de passe la clé qui protège la clé privée.")

banner("DEUXIÈME PARTIE : ÉTUDE CONCEPTUELLE")
r.h(2, "CHAPITRE 3 : MÉTHODE D'ANALYSE ET DE CONCEPTION")
r.p("Deux familles de méthodes s'offraient à nous : MERISE, systémique et centrée sur les données, et le Processus Unifié, orienté objet, itératif et piloté par les cas d'utilisation (Jacobson, Booch et Rumbaugh, 1999).")
r.table("Comparaison de MERISE et du Processus Unifié",
        ["Critère", "MERISE", "Processus Unifié"],
        [["Paradigme", "Systémique, centré sur les données", "Orienté objet, centré sur l'architecture"],
         ["Élément moteur", "Le modèle de données", "Les cas d'utilisation"],
         ["Cycle de développement", "Séquentiel par niveaux", "Itératif et incrémental"],
         ["Langage de modélisation", "Formalismes propres (MCD, MLD)", "UML, standard unifié"]],
        [4.4, 5.6, 6.0], bold_first_col=True, font_size=10.5)
r.p("Notre application ne comporte aucune base de données, son code TypeScript est organisé en modules et en types, et elle se définit par ce que ses acteurs accomplissent. Nous avons donc retenu le Processus Unifié et le langage UML (OMG, 2017), dont nous utilisons quatre diagrammes : cas d'utilisation, séquence, classes et déploiement.")

r.h(2, "CHAPITRE 4 : MODÉLISATION DU SYSTÈME")
r.h(3, "4.1. Règles de gestion")
r.table("Principales règles de gestion",
        ["N°", "Règle de gestion"],
        [["RG1", "Une clé RSA fait au moins 2048 bits ; 3072 bits est la taille proposée par défaut."],
         ["RG2", "La clé privée est protégée par un mot de passe d'au moins 8 caractères et n'est jamais enregistrée par le navigateur."],
         ["RG3", "Un fichier n'est chiffré que pour une clé publique dont l'empreinte a été vérifiée."],
         ["RG4", "Un fichier à chiffrer ne dépasse pas 100 Mo."],
         ["RG5", "Chaque fichier reçoit une clé de session et un vecteur d'initialisation neufs."],
         ["RG6", "Un fichier .rsaenc n'est déchiffré que s'il est destiné à la clé chargée."],
         ["RG7", "Une seule étiquette d'intégrité invalide entraîne le refus complet du déchiffrement."],
         ["RG8", "Le site n'émet aucune requête réseau après son chargement."]],
        [1.5, 14.5], bold_first_col=True, font_size=10.5)
r.h(3, "4.2. Acteurs et cas d'utilisation")
r.p("L'expéditrice importe la clé publique du destinataire, vérifie son empreinte et chiffre ; le destinataire crée sa paire de clés, la sauvegarde et déchiffre ; l'enseignant consulte les explications et lance les tests. Le chiffrement inclut la vérification de l'empreinte (RG3), et le rechargement de la clé privée étend le déchiffrement lorsqu'aucune clé n'est chargée.")
r.figure(UML / "uml-cas-utilisation.png", "Diagramme de cas d'utilisation global", 13.5)
r.h(3, "4.3. Description textuelle du cas « Chiffrer un fichier »")
r.table("Description textuelle du cas d'utilisation « Chiffrer un fichier »",
        ["Rubrique", "Contenu"],
        [["Acteur", "Expéditrice."],
         ["Préconditions", "La clé publique du destinataire a été importée."],
         ["Scénario nominal", "1. L'expéditrice choisit un fichier (RG4) et la clé du destinataire. 2. Elle marque l'empreinte comme vérifiée (RG3). 3. Le navigateur tire une clé de session (RG5) et la scelle par RSA-OAEP. 4. Il chiffre les métadonnées et le contenu par AES-256-GCM, morceau par morceau. 5. Il assemble le fichier .rsaenc, que l'expéditrice télécharge et envoie."],
         ["Exceptions", "Empreinte non vérifiée : chiffrement bloqué. Fichier de plus de 100 Mo : refus."],
         ["Postconditions", "Un fichier .rsaenc existe ; ni la clé de session ni le fichier clair n'ont quitté le navigateur (RG8)."]],
        [3.4, 12.6], bold_first_col=True, font_size=10.5)
r.h(3, "4.4. Diagramme de séquence du chiffrement")
r.figure(UML / "uml-sequence-chiffrement.png", "Diagramme de séquence du chiffrement d'un fichier", 12.5)
r.p("La clé de session n'existe en clair que dans la mémoire du navigateur, le temps d'être scellée. Le déchiffrement suit le chemin inverse et s'interrompt à la première étiquette invalide (RG7).")
r.h(3, "4.5. Diagramme de classes")
r.p("L'application n'ayant pas de base de données, le diagramme de classes représente les structures manipulées par le moteur cryptographique, telles qu'elles sont typées dans le code TypeScript.")
r.figure(UML / "uml-classes.png", "Diagramme de classes du moteur cryptographique", 14.5)
r.h(3, "4.6. Diagramme de déploiement")
r.figure(UML / "uml-deploiement.png", "Diagramme de déploiement de l'application", 12)
r.p("Le serveur d'hébergement ne fait que livrer les fichiers du site ; les clés et les fichiers restent sur les postes des utilisateurs.")

banner("TROISIÈME PARTIE : RÉSULTATS ET DISCUSSIONS")
r.h(2, "CHAPITRE 5 : MISE EN ŒUVRE DE LA SOLUTION")
r.h(3, "5.1. Environnement de développement")
r.table("Environnement et outils de réalisation",
        ["Élément", "Détail"],
        [["Poste de travail", "Lenovo ThinkPad, Intel Core i7-8565U (4 cœurs, 1,80 GHz), 16 Go de mémoire, SSD de 512 Go"],
         ["Système", "Microsoft Windows 11 Professionnel, navigateur Google Chrome 156"],
         ["Langage et interface", "TypeScript, React, Vite, Tailwind CSS, Motion et Three.js"],
         ["Cryptographie", "API Web Crypto du navigateur, sans bibliothèque cryptographique tierce"],
         ["Tests", "Vitest et Node.js, interopérabilité vérifiée avec OpenSSL"],
         ["Hébergement", "Vercel, en HTTPS"]],
        [3.8, 12.2], bold_first_col=True, font_size=10.5)
r.h(3, "5.2. Architecture technique")
r.p("L'application est une page web unique qui s'exécute entièrement dans le navigateur. L'interface appelle un moteur cryptographique isolé, testé tel quel dans Node.js et dans le navigateur, qui s'appuie sur l'API Web Crypto.")
r.figure(IMG / "architecture.png", "Architecture technique de RSA FileSecure", 13)
r.p("Le fichier est chiffré par morceaux de 1 Mo. Le vecteur d'initialisation de chaque morceau associe un préfixe aléatoire et le numéro du morceau, et chaque morceau authentifie l'en-tête, son numéro et un drapeau « dernier morceau » : modifier l'en-tête, intervertir ou supprimer des morceaux fait échouer le déchiffrement. La structure du fichier figure en annexe.")
r.h(3, "5.3. Sécurité et déploiement")
r.p("Outre le chiffrement lui-même, la clé privée importée est déclarée non exportable, l'empreinte doit être vérifiée avant tout chiffrement, et une politique de sécurité du contenu interdit toute requête réseau. Le site est publié sur Vercel, à l'adresse https://rsa-filesecure.vercel.app, en HTTPS comme l'exige l'API Web Crypto ; les dix-neuf tests de la page « Tests » y passent.")

r.h(2, "CHAPITRE 6 : RÉSULTATS ET DISCUSSION")
r.h(3, "6.1. Présentation de la solution")
r.p("L'application compte sept écrans, aux couleurs de la maquette du binôme. Pendant un chiffrement, le panneau « Ce qui se passe » affiche les étapes réelles du calcul et une grille d'octets qui perd progressivement toute structure.")
r.figure(SHOTS / "12-chiffrer-en-cours.png", "Écran de chiffrement pendant le calcul", 14)
figure_pair([(IMG / "ecran-dechiffrer-etapes.png", "Déchiffrement réussi, empreintes SHA-256 identiques", 6.0),
             (SHOTS / "17-dechiffrer-refus.png", "Refus d'un fichier dont un octet a été modifié", 6.6)])
r.h(3, "6.2. Tests et validation")
r.p("Les vingt-deux tests automatisés passent en 1,65 seconde. Les dix-neuf tests du moteur s'exécutent aussi dans le navigateur, et trois tests vérifient l'interopérabilité avec OpenSSL.")
r.table("Couverture des tests automatisés",
        ["Famille", "Tests", "Objet des vérifications"],
        [["Clés", "6", "Génération, formats PEM, mot de passe, refus des clés privées et des clés de 1024 bits"],
         ["Chiffrement", "5", "Texte, fichier en plusieurs morceaux, fichier vide, aléa, limite de 100 Mo"],
         ["Refus à la lecture", "6", "Octet modifié, autre clé, en-tête falsifié, autre format, troncature, réordonnancement"],
         ["RSA pédagogique", "2", "Exemple p = 61, q = 53 ; factorisation d'une clé de 48 bits"],
         ["Interopérabilité", "3", "Échanges croisés avec OpenSSL"]],
        [3.6, 1.4, 11.0], bold_first_col=True, font_size=10.5)
r.p("Dans Chrome, sur notre poste, une clé de 3072 bits se génère en 0,35 seconde en médiane, et le temps de chiffrement croît linéairement avec la taille du fichier.")
r.figure(IMG / "perf-fichiers.png", "Durée de chiffrement et de déchiffrement selon la taille du fichier", 12.5)
r.h(3, "6.3. Estimation financière")
r.p("L'application ne repose sur aucun service payant : hébergement gratuit, sous-domaine fourni par Vercel, bibliothèques libres et aucun serveur applicatif. Son coût d'exploitation est nul ; le temps de travail du binôme n'est pas valorisé.")
r.h(3, "6.4. Discussion, limites et perspectives")
r.table("Réponse apportée aux limites de l'existant",
        ["Limite", "État", "Justification"],
        [["L1 Prise en main", "Levée", "Interface guidée en français, étapes visibles"],
         ["L2 Secret à partager", "Levée", "Seule la clé publique circule, vérifiée par son empreinte"],
         ["L3 Confiance dans un tiers", "Levée, avec réserve", "Aucune donnée envoyée ; dépend du code servi par l'hébergeur"],
         ["L4 Opacité", "Levée", "Animations au rythme du calcul, page pédagogique, tests en direct"]],
        [4.4, 3.2, 8.4], bold_first_col=True, font_size=10.5)
r.p("L'application ne prouve pas l'identité de l'expéditeur et traite les fichiers en mémoire. Trois évolutions la prolongeraient : une signature RSA-PSS de l'expéditrice, l'envoi à plusieurs destinataires et le chiffrement en flux des gros fichiers.")

r.h(1, "CONCLUSION", page_break=True)
r.p("Ce travail visait à permettre à une expéditrice de chiffrer avec RSA un fichier que seul son binôme pourrait lire, sans secret partagé au préalable. Après l'étude de l'existant et une conception selon le Processus Unifié, nous avons réalisé RSA FileSecure, qui combine RSA-OAEP et AES-256-GCM entièrement dans le navigateur. Publiée en ligne, l'application chiffre 100 Mo en moins d'une seconde, refuse tout fichier altéré et est validée par vingt-deux tests automatisés.")
r.p("Ce projet nous a surtout appris qu'un algorithme correct ne suffit pas à construire un système sûr. La sécurité vient de l'assemblage, du remplissage OAEP à la vérification des empreintes, chaque détail répondant à une attaque connue. La signature des fichiers, qui prouverait l'identité de l'expéditrice, constitue la prochaine étape.")

# =====================================================================================
# PAGES FINALES : bibliographie et annexe, quatrième de couverture
# =====================================================================================
r.new_section("lowerRoman", 1)
r.h(1, "BIBLIOGRAPHIE ET WEBOGRAPHIE")
refs = [
    "Barker, E. (2020). *Recommendation for key management: Part 1 – General* (NIST SP 800-57 Part 1 Rev. 5). NIST.",
    "Dworkin, M. (2007). *Recommendation for block cipher modes of operation: Galois/Counter Mode (GCM) and GMAC* (NIST SP 800-38D). NIST.",
    "Jacobson, I., Booch, G., & Rumbaugh, J. (1999). *The unified software development process*. Addison-Wesley.",
    "Moriarty, K., Kaliski, B., Jonsson, J., & Rusch, A. (2016). *PKCS #1: RSA cryptography specifications version 2.2* (RFC 8017). https://www.rfc-editor.org/rfc/rfc8017",
    "Moriarty, K., Kaliski, B., & Rusch, A. (2017). *PKCS #5: Password-based cryptography specification version 2.1* (RFC 8018). https://www.rfc-editor.org/rfc/rfc8018",
    "National Institute of Standards and Technology. (2001). *Advanced Encryption Standard (AES)* (FIPS 197).",
    "Object Management Group. (2017). *OMG Unified Modeling Language, version 2.5.1*. https://www.omg.org/spec/UML/2.5.1/PDF",
    "OWASP Foundation. (s.d.). *Password storage cheat sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
    "Rivest, R. L., Shamir, A., & Adleman, L. (1978). A method for obtaining digital signatures and public-key cryptosystems. *Communications of the ACM, 21*(2), 120-126.",
    "World Wide Web Consortium. (2017). *Web Cryptography API*. https://www.w3.org/TR/WebCryptoAPI/",
]
for ref in refs:
    para = r.p(ref, align="l", after=5, size=11)
    para.paragraph_format.left_indent = Cm(1)
    para.paragraph_format.first_line_indent = Cm(-1)
    para.paragraph_format.line_spacing = 1.0
ann = r.h(1, "ANNEXE : STRUCTURE DU FICHIER .RSAENC")
ann.paragraph_format.space_before = Pt(20)
r.table("Structure du fichier chiffré .rsaenc",
        ["Position", "Taille", "Contenu"],
        [["0", "6 octets", "« RSAENC » en ASCII : 52 53 41 45 4E 43"],
         ["6", "1 octet", "Version du format : 01"],
         ["7", "4 octets", "Longueur L de l'en-tête JSON"],
         ["11", "L octets", "En-tête : algorithmes, identifiant de la clé du destinataire, clé de session scellée, préfixe d'IV, découpage"],
         ["11 + L", "Reste", "Morceaux chiffrés par AES-GCM, chacun suivi de son étiquette de 16 octets"]],
        [2.2, 2.4, 11.4], font_size=10.5)

back = d.add_paragraph()
back.paragraph_format.page_break_before = True
back.paragraph_format.space_before = Pt(560)
back._p.get_or_add_pPr().append(parse_xml(
    f'<w:pBdr {nsdecls("w")}><w:top w:val="single" w:sz="12" w:space="6" w:color="1F3864"/></w:pBdr>'))
back.alignment = WD_ALIGN_PARAGRAPH.CENTER
r.runs(back, "École Supérieure Africaine des Technologies de l'Information et de la Communication", size=11)
r.p("Zone 3, Km 4 Bd Marseille, 18 BP 1501 Abidjan 18", align="c", size=11, after=0)
r.p("Site web : www.esatic.ci     Courriel : direction.esatic@esatic.ci", align="c", size=11)

OUT.parent.mkdir(parents=True, exist_ok=True)
r.save(OUT)
print("figures", r.fig, "tableaux", r.tab, "->", OUT)
