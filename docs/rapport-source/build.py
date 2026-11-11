"""Rapport de TP RSA FileSecure, sur le modèle de structure du mémoire ESATIC."""
import sys
from pathlib import Path

from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import parse_xml
from docx.oxml.ns import nsdecls
from docx.shared import Cm, Pt, RGBColor

from docx_kit import Report, smart

HERE = Path(__file__).parent
IMG = HERE / "img"
UML = HERE / "uml"
SHOTS = Path(r"C:\Users\hp\TP-RSA\docs\guide-source\shots")
OUT = Path(sys.argv[1])

r = Report()
d = r.doc

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
rr = p1.add_run("Année académique : 2026-2027")
rr.bold = True

logo = d.add_paragraph()
logo.alignment = WD_ALIGN_PARAGRAPH.CENTER
logo.paragraph_format.space_before = Pt(36)
logo.paragraph_format.space_after = Pt(30)
logo.add_run().add_picture(str(IMG / "logo-esatic.jpg"), width=Cm(8.5))

r.p("**RAPPORT DE TRAVAUX PRATIQUES**", align="c", after=2, size=14)
r.p("MODULE : CRYPTOGRAPHIE", align="c", after=24, size=13)
r.framed(size=14, width_cm=15.5, rows=[
    "CONCEPTION ET DÉVELOPPEMENT D'UNE",
    "APPLICATION WEB DE CHIFFREMENT DE FICHIERS",
    "PAR RSA ENTRE BINÔMES : RSA FILESECURE",
])
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
# PAGES LIMINAIRES (numérotation romaine)
# =====================================================================================
r.new_section("lowerRoman", 1)

r.lim("RÉSUMÉ", page_break=False)
for t in [
    "Ce rapport présente la conception et le développement de RSA FileSecure, une application web réalisée en binôme dans le cadre du module de cryptographie. Le sujet demandait un site capable de chiffrer des fichiers à l'aide de l'algorithme RSA, puis de permettre au binôme de les déchiffrer avec le même algorithme.",
    "RSA ne chiffre directement que de petits messages : 318 octets au plus avec une clé de 3072 bits et le remplissage OAEP. La solution retenue est donc un chiffrement hybride. Chaque fichier est chiffré par AES-256-GCM avec une clé de session tirée au hasard, et seule cette clé est chiffrée par RSA-OAEP avec la clé publique du destinataire.",
    "La démarche s'est appuyée sur l'étude des outils existants et sur un cahier des charges, puis sur une conception selon le Processus Unifié, modélisée en UML. La réalisation repose sur React et TypeScript. Toute la cryptographie passe par l'API Web Crypto du navigateur, de sorte qu'aucun fichier, aucune clé et aucun mot de passe ne transite par un serveur. L'application est publiée sur la plateforme Vercel.",
    "La validation s'appuie sur vingt-deux tests automatisés, dont trois tests d'interopérabilité avec OpenSSL, et sur des mesures de performance : un fichier de 100 Mo est chiffré en 0,63 seconde. Toute modification d'un fichier chiffré, même d'un seul octet, est détectée et refusée. L'identité de l'expéditeur n'est toutefois pas prouvée ; l'ajout d'une signature RSA-PSS constitue la principale perspective de ce travail.",
]:
    r.p(t)
r.p("**Mots-clés :** RSA, OAEP, chiffrement hybride, AES-GCM, API Web Crypto, application web.", before=6)

r.lim("ABSTRACT")
for t in [
    "This report presents the design and development of RSA FileSecure, a web application built by a pair of students as part of the cryptography course. The assignment required a website able to encrypt files with the RSA algorithm, so that the other member of the pair could decrypt them with the same algorithm.",
    "RSA can only encrypt small messages directly: at most 318 bytes with a 3072-bit key and OAEP padding. The chosen solution is therefore hybrid encryption. Each file is encrypted with AES-256-GCM under a random session key, and only that key is encrypted with RSA-OAEP using the recipient's public key.",
    "The approach started with a review of existing tools and a requirements specification, followed by a design based on the Unified Process and modelled in UML. The implementation relies on React and TypeScript. All cryptographic operations use the browser's Web Crypto API, so no file, key or password is ever sent to a server. The application is deployed on the Vercel platform.",
    "Validation relies on twenty-two automated tests, including three interoperability tests with OpenSSL, and on performance measurements: a 100 MB file is encrypted in 0.63 seconds. Any modification of an encrypted file, even a single byte, is detected and rejected. The sender's identity is not authenticated, however; adding an RSA-PSS signature is the main perspective of this work.",
]:
    r.p(t)
r.p("**Keywords:** RSA, OAEP, hybrid encryption, AES-GCM, Web Crypto API, web application.", before=6)

r.lim("DÉDICACE")
r.p("", before=180)
r.p("*À nos parents, pour leur soutien constant tout au long de notre formation.*", align="r")
r.p("*À nos camarades de promotion, avec qui ces notions ont pris tout leur sens.*", align="r")

r.lim("REMERCIEMENTS")
r.p("Ce travail doit beaucoup aux personnes qui nous ont accompagnés pendant sa réalisation. Nous exprimons notre sincère gratitude à :")
r.bullets([
    "**Professeur KONATÉ Adama**, Directeur Général de l'École Supérieure Africaine des Technologies de l'Information et de la Communication (ESATIC), pour la qualité de la formation dispensée et pour le cadre d'études qu'il maintient au sein de l'école ;",
    "**[Nom de l'enseignant]**, enseignant du module de cryptographie, pour la clarté de ses enseignements et pour un sujet qui nous a obligés à confronter la théorie de RSA à ses usages réels ;",
    "l'ensemble du corps enseignant et du personnel administratif de l'ESATIC, pour leur disponibilité tout au long de l'année.",
], kind="diamond")
r.p("Nous remercions enfin nos camarades de promotion pour les échanges qui ont nourri ce travail, ainsi que nos familles pour leurs encouragements.")

r.lim("AVANT-PROPOS")
for t in [
    "L'École Supérieure Africaine des Technologies de l'Information et de la Communication (ESATIC) forme des ingénieurs et des techniciens supérieurs dans les domaines du numérique, des télécommunications et de la sécurité des systèmes d'information. Ses enseignements associent les cours théoriques à des travaux pratiques qui placent les étudiants face à des problèmes concrets.",
    "C'est dans ce cadre que s'inscrit le présent rapport. Le module de cryptographie nous a confié, en binôme, la réalisation d'un site web capable de chiffrer des fichiers avec RSA, puis de les faire déchiffrer par l'autre membre du binôme. Le sujet, volontairement court, laissait ouvertes de nombreuses questions : l'échange des clés, la taille des fichiers, la protection de la clé privée, la réaction face à un fichier altéré.",
    "Nous avons choisi de traiter chacune de ces questions comme une exigence, afin de produire un outil réellement utilisable et non une démonstration limitée à quelques octets. Au-delà du site lui-même, ce travail a donné lieu à un guide d'utilisation, à une vidéo de présentation et au présent rapport. Il nous a surtout permis de mesurer l'écart entre un algorithme correct et un système sûr.",
]:
    r.p(t)

r.lim("LISTE DES SIGLES ET ABRÉVIATIONS")
sigles = [
    ("AAD", "Additional Authenticated Data (données associées authentifiées)"),
    ("AES", "Advanced Encryption Standard (norme de chiffrement avancé)"),
    ("API", "Application Programming Interface (interface de programmation applicative)"),
    ("CSP", "Content Security Policy (politique de sécurité du contenu)"),
    ("ESATIC", "École Supérieure Africaine des Technologies de l'Information et de la Communication"),
    ("FIPS", "Federal Information Processing Standards (normes fédérales américaines de traitement de l'information)"),
    ("GCM", "Galois/Counter Mode (mode compteur de Galois)"),
    ("HSTS", "HTTP Strict Transport Security (sécurité stricte du transport HTTP)"),
    ("HTTPS", "HyperText Transfer Protocol Secure (protocole de transfert hypertexte sécurisé)"),
    ("IETF", "Internet Engineering Task Force"),
    ("IV", "Initialization Vector (vecteur d'initialisation)"),
    ("JSON", "JavaScript Object Notation (notation d'objets JavaScript)"),
    ("NIST", "National Institute of Standards and Technology"),
    ("OAEP", "Optimal Asymmetric Encryption Padding (remplissage optimal pour le chiffrement asymétrique)"),
    ("OMG", "Object Management Group"),
    ("OWASP", "Open Worldwide Application Security Project"),
    ("PBKDF2", "Password-Based Key Derivation Function 2 (fonction de dérivation de clé à partir d'un mot de passe)"),
    ("PEM", "Privacy-Enhanced Mail (format texte d'échange de clés)"),
    ("PKCS", "Public-Key Cryptography Standards (normes de cryptographie à clé publique)"),
    ("PSS", "Probabilistic Signature Scheme (schéma de signature probabiliste)"),
    ("RFC", "Request for Comments (document de normalisation de l'IETF)"),
    ("RSA", "Rivest, Shamir, Adleman (algorithme de chiffrement à clé publique)"),
    ("SHA", "Secure Hash Algorithm (algorithme de hachage sécurisé)"),
    ("SPKI", "SubjectPublicKeyInfo (structure standard d'une clé publique)"),
    ("SVG", "Scalable Vector Graphics (format d'image vectorielle)"),
    ("TP", "Travaux Pratiques"),
    ("UML", "Unified Modeling Language (langage de modélisation unifié)"),
    ("UP", "Unified Process (Processus Unifié)"),
    ("W3C", "World Wide Web Consortium"),
]
for s_, t_ in sigles:
    para = r.p(f"**{s_}** : {t_}", align="l", after=1)
    para.paragraph_format.line_spacing = 1.25

r.lim("GLOSSAIRE")
gloss = [
    ("Binôme", "équipe de deux étudiants. Dans ce rapport, Awa désigne l'expéditrice et Koffi le destinataire ; ce sont aussi les noms employés dans l'application."),
    ("Chiffrement asymétrique", "système à deux clés liées : l'une, publique, chiffre ; l'autre, privée, déchiffre. RSA en est l'exemple le plus connu."),
    ("Chiffrement hybride", "association d'un chiffrement symétrique rapide, qui protège le fichier, et d'un chiffrement asymétrique, qui protège la clé symétrique."),
    ("Clé de session", "clé AES de 256 bits tirée au hasard pour un seul fichier, puis scellée par RSA. Elle n'est jamais affichée ni enregistrée en clair."),
    ("Clé privée", "moitié secrète d'une paire RSA, seule capable de déchiffrer ce qui a été chiffré avec la clé publique correspondante."),
    ("Clé publique", "moitié partageable d'une paire RSA. Elle peut circuler sans protection, car elle ne permet que de chiffrer."),
    ("Condensat", "résultat d'une fonction de hachage comme SHA-256 : une valeur courte et de taille fixe qui change entièrement au moindre changement de la donnée d'origine."),
    ("Données associées", "informations laissées en clair mais authentifiées par AES-GCM. Les modifier fait échouer le déchiffrement."),
    ("Empreinte", "résumé court d'une clé publique, calculé par SHA-256 et affiché en huit groupes de quatre caractères, pour être comparé à voix haute."),
    ("Étiquette d'intégrité", "valeur de 16 octets produite par AES-GCM pour chaque morceau chiffré ; elle prouve que le morceau n'a pas été modifié."),
    ("Factorisation", "décomposition d'un entier en produit de nombres premiers. Factoriser le module n d'une clé RSA permet d'en retrouver la clé privée."),
    ("Remplissage", "transformation appliquée au message avant le calcul RSA. Le remplissage OAEP le rend aléatoire et résistant aux manipulations."),
    ("Vecteur d'initialisation", "valeur qui rend unique chaque chiffrement réalisé avec une même clé. En mode GCM, il ne doit jamais être réutilisé."),
]
for g_, t_ in gloss:
    r.p(f"**{g_}** : {t_}")

r.lim("LISTE DES TABLEAUX")
r.toc('TOC \\h \\z \\c "Tableau"')
r.lim("LISTE DES FIGURES")
r.toc('TOC \\h \\z \\c "Figure"')
r.lim("SOMMAIRE")
r.toc('TOC \\o "1-3" \\h \\z \\u')

# =====================================================================================
# CORPS DU RAPPORT (numérotation arabe)
# =====================================================================================
r.new_section("decimal", 1)

r.h(1, "INTRODUCTION")
for t in [
    "L'échange de fichiers numériques fait partie du quotidien des étudiants comme des professionnels. Rapports, pièces justificatives et données personnelles circulent par courrier électronique, par messagerie instantanée ou sur des clés USB. Aucun de ces canaux ne garantit à lui seul que seul le destinataire prévu pourra lire le fichier, ni que celui-ci n'aura pas été modifié en route.",
    "La cryptographie à clé publique répond à ce besoin. Proposé en 1977 par Rivest, Shamir et Adleman, puis publié en 1978, l'algorithme RSA permet à une personne de chiffrer un message pour une autre sans qu'elles aient partagé de secret au préalable. Près d'un demi-siècle plus tard, il reste au cœur de nombreux protocoles de sécurité.",
    "C'est dans ce contexte que s'inscrit le travail pratique qui nous a été confié : « Créer un site web permettant de chiffrer des fichiers à l'aide de l'algorithme RSA, puis de permettre à son binôme de les déchiffrer à l'aide du même algorithme. »",
    "Une difficulté apparaît dès la lecture du sujet. RSA ne chiffre qu'un bloc plus petit que sa clé, soit quelques centaines d'octets, alors qu'un fichier en compte souvent des millions. La question qui guide notre travail est donc la suivante : comment permettre à deux personnes qui ne partagent aucun secret d'échanger un fichier de taille quelconque, lisible par le seul destinataire, en s'appuyant sur RSA, et comment rendre ce mécanisme compréhensible ?",
    "Pour y répondre, nous avons conçu RSA FileSecure, une application web qui combine RSA et AES dans un chiffrement hybride, et dont tous les calculs s'effectuent dans le navigateur de l'utilisateur.",
    "Ce rapport s'organise en trois parties. La première présente le projet, son cahier des charges et les notions de cryptographie mobilisées. La deuxième expose la méthode de conception et la modélisation du système. La troisième décrit la mise en œuvre de la solution, puis discute ses résultats, ses limites et ses perspectives.",
]:
    r.p(t)

# ------------------------------------------------------------------ PREMIÈRE PARTIE
r.part_page("PREMIÈRE PARTIE : GÉNÉRALITÉS",
            "Cette première partie pose le cadre du travail. Elle présente le projet et son cahier des charges, puis rappelle les notions de cryptographie sur lesquelles il repose.")

r.h(2, "CHAPITRE 1 : PRÉSENTATION DU PROJET", page_break=True)
r.p("Ce chapitre expose le projet qui nous a été confié : son contexte et ses notions clés, l'analyse des solutions existantes, puis le cahier des charges de l'application attendue.")
r.h(3, "I. Contexte et concepts clés")
r.h(4, "1. Contexte du projet")
r.p("Le projet est un travail pratique du module de cryptographie, réalisé en binôme. Il a un double objectif. Le premier est pédagogique : mettre en œuvre RSA et en comprendre le fonctionnement interne. Le second est fonctionnel : produire un outil que deux personnes peuvent réellement utiliser pour échanger des fichiers confidentiels.")
r.p("Le sujet impose deux rôles. Le premier membre du binôme chiffre un fichier, le second le déchiffre. Cette répartition reproduit la situation la plus courante de la cryptographie à clé publique : une expéditrice, Awa, qui veut transmettre un document confidentiel, et un destinataire, Koffi, qui doit être le seul à pouvoir le lire.")
r.h(4, "2. Concepts clés")
for term, text_ in [
    ("Chiffrement asymétrique", "système à deux clés, l'une publique pour chiffrer, l'autre privée pour déchiffrer."),
    ("Paire de clés RSA", "ensemble formé d'une clé publique (n, e) et d'une clé privée (n, d), produites ensemble par le destinataire."),
    ("Chiffrement hybride", "combinaison d'un chiffrement symétrique pour le fichier et d'un chiffrement asymétrique pour la clé symétrique."),
    ("Empreinte de clé", "résumé court d'une clé publique, comparé de vive voix pour s'assurer que la clé reçue est la bonne."),
    ("Fichier .rsaenc", "format du fichier chiffré produit par l'application, que l'expéditrice transmet au destinataire."),
]:
    r.p(f"**{term}** : {text_}")

r.h(3, "II. Étude de l'existant")
r.h(4, "1. Présentation de l'existant")
r.p("Avant de concevoir notre solution, nous avons examiné les outils couramment utilisés pour protéger un fichier avant de l'envoyer. Ils se répartissent en quatre familles.")
r.p("**GnuPG** est l'implémentation libre de la norme OpenPGP. Il pratique déjà le chiffrement hybride et gère un trousseau de clés publiques. Il s'utilise surtout en ligne de commande, ou à travers des interfaces graphiques à installer.")
r.p("**OpenSSL** est une boîte à outils cryptographique très complète. Elle permet de générer des clés RSA et de chiffrer de petits messages, mais chiffrer un fichier avec RSA suppose d'enchaîner soi-même plusieurs commandes, et son utilitaire de chiffrement symétrique ne propose pas de mode authentifié.")
r.p("**Les archives chiffrées par mot de passe**, comme celles de 7-Zip, reposent sur AES. Le chiffrement est alors symétrique : le mot de passe doit être transmis au destinataire par un autre moyen, ce qui déplace le problème au lieu de le résoudre.")
r.p("**Les services de chiffrement en ligne** sont simples d'emploi, mais beaucoup reçoivent le fichier sur leur serveur avant de le chiffrer. L'utilisateur doit alors faire confiance à un tiers qu'il ne contrôle pas.")
r.h(4, "2. Analyse comparative")
r.p("Le tableau suivant confronte ces solutions aux besoins du travail pratique.")
r.table("Comparaison des solutions existantes",
        ["Solution", "Principe", "Atouts", "Limites au regard du TP"],
        [["GnuPG", "OpenPGP, chiffrement hybride", "Robuste, standard, gestion des clés", "Installation et prise en main techniques"],
         ["OpenSSL", "Boîte à outils en ligne de commande", "Très complet, référence du domaine", "Chiffrement de fichiers à assembler à la main"],
         ["Archives chiffrées", "AES et mot de passe partagé", "Simple, très répandu", "Mot de passe à transmettre ; pas de RSA"],
         ["Services en ligne", "Chiffrement sur un serveur tiers", "Aucune installation", "Le fichier quitte l'ordinateur de l'utilisateur"]],
        [3.0, 4.0, 4.3, 4.7], bold_first_col=True)
r.h(4, "3. Limites de l'existant")
r.p("L'analyse fait ressortir quatre limites au regard de notre sujet :")
r.bullets([
    "**L1 : Prise en main technique.** Les outils les plus sûrs exigent des connaissances en ligne de commande.",
    "**L2 : Échange d'un secret.** Les solutions symétriques imposent de transmettre un mot de passe par un canal sûr.",
    "**L3 : Confiance dans un tiers.** Les services en ligne reçoivent le fichier en clair sur leurs serveurs.",
    "**L4 : Opacité du fonctionnement.** Aucun de ces outils ne montre ce qui se passe pendant le chiffrement, ce qui ne sert pas l'objectif pédagogique du TP.",
])
r.p("Leur niveau de résolution sera évalué au chapitre 6.")

r.h(3, "III. Cahier des charges")
r.h(4, "1. Objectif général et objectifs spécifiques")
r.p("L'objectif général est de concevoir et de développer une application web permettant à une personne de chiffrer un fichier avec RSA pour son binôme, et à ce binôme de le déchiffrer. Il se décline en six objectifs spécifiques :")
r.bullets([
    "générer, exporter et sauvegarder des paires de clés RSA ;",
    "échanger les clés publiques et vérifier leur authenticité ;",
    "chiffrer tout type de fichier, jusqu'à une taille raisonnable ;",
    "déchiffrer le fichier et garantir qu'il n'a pas été modifié ;",
    "ne confier aucune donnée sensible à un serveur ;",
    "rendre chaque étape visible, pour pouvoir l'expliquer pendant la soutenance.",
])
r.h(4, "2. Solution proposée")
r.p("Nous proposons une application web monopage dont tous les calculs cryptographiques s'exécutent dans le navigateur, grâce à l'API Web Crypto. Chaque fichier est chiffré par AES-256-GCM avec une clé de session aléatoire, et seule cette clé est chiffrée par RSA-OAEP avec la clé publique du destinataire. RSA reste ainsi le mécanisme qui décide qui peut lire le fichier.")
r.p("Cette solution répond à chaque limite : une interface guidée en français (L1), un échange qui ne nécessite aucun secret partagé (L2), aucun fichier envoyé à un serveur (L3) et des animations calées sur le calcul réel (L4).")
r.h(4, "3. Exigences fonctionnelles")
r.sub("a. Gestion des clés")
r.bullets(["générer une paire RSA de 2048, 3072 ou 4096 bits ;",
           "exporter la clé publique au format PEM, lisible par OpenSSL ;",
           "sauvegarder la clé privée dans un fichier chiffré par un mot de passe, puis la recharger ;",
           "importer et mémoriser les clés publiques des binômes, avec leur empreinte."], kind="diamond")
r.sub("b. Chiffrement")
r.bullets(["chiffrer tout type de fichier jusqu'à 100 Mo pour un destinataire choisi ;",
           "exiger la vérification de l'empreinte du destinataire avant de chiffrer ;",
           "produire un fichier .rsaenc téléchargeable."], kind="diamond")
r.sub("c. Déchiffrement")
r.bullets(["indiquer à quelle clé un fichier .rsaenc est destiné, avant toute opération ;",
           "restituer le fichier d'origine, avec son nom, et vérifier son intégrité ;",
           "refuser tout fichier modifié, tronqué ou destiné à une autre clé, avec un message clair."], kind="diamond")
r.sub("d. Démonstration et vérification")
r.bullets(["expliquer RSA pas à pas sur de petits nombres ;",
           "montrer qu'une clé trop courte se casse par factorisation ;",
           "exécuter les tests du moteur cryptographique dans le navigateur."], kind="diamond")
r.h(4, "4. Exigences non fonctionnelles")
r.p("Les principales exigences de qualité figurent dans le tableau suivant.")
r.table("Principales exigences non fonctionnelles",
        ["Catégorie", "Exigence"],
        [["Sécurité", "Algorithmes normalisés uniquement ; clés RSA d'au moins 2048 bits ; chiffrement authentifié"],
         ["Confidentialité", "Aucun fichier, aucune clé et aucun mot de passe envoyés sur le réseau"],
         ["Performance", "Génération d'une clé de 3072 bits en moins d'une seconde ; fichier de 100 Mo traité en moins de deux secondes"],
         ["Ergonomie", "Interface en français, utilisable sur ordinateur et sur téléphone ; messages d'erreur compréhensibles"],
         ["Interopérabilité", "Clés aux formats standards (PEM, SPKI, PKCS #8), compatibles avec OpenSSL"],
         ["Maintenabilité", "Moteur cryptographique isolé de l'interface et couvert par des tests automatisés"]],
        [3.8, 12.2], bold_first_col=True)
r.h(4, "5. Contraintes et délimitation du périmètre")
r.p("**5.1. Contraintes technologiques.** L'API Web Crypto n'est disponible que dans un contexte sécurisé : le site doit être servi en HTTPS ou depuis l'adresse locale de l'ordinateur. Les fichiers sont traités en mémoire, ce qui impose une limite de taille.")
r.p("**5.2. Contraintes de réalisation.** Le travail a été mené par un binôme, dans le temps imparti au module, ce qui a imposé de concentrer l'effort sur le cœur cryptographique et sur sa vérification.")
r.p("**5.3. Délimitation du périmètre.** L'application ne prouve pas l'identité de l'expéditeur, ne gère qu'un destinataire par fichier et ne propose pas de stockage en ligne : la transmission du fichier chiffré reste à la charge des utilisateurs.")

r.h(2, "CHAPITRE 2 : NOTIONS DE CRYPTOGRAPHIE MOBILISÉES", page_break=True)
r.p("Ce chapitre rappelle le fonctionnement de RSA, explique pourquoi il ne s'utilise pas seul, puis présente les autres primitives qu'emploie notre solution.")
r.h(3, "I. Le chiffrement RSA")
r.h(4, "1. Principe")
r.p("RSA est un chiffrement asymétrique : une clé publique chiffre, une clé privée déchiffre. Sa sécurité repose sur la difficulté de factoriser un grand nombre n, produit de deux nombres premiers secrets. Connaître n ne permet pas, en pratique, de retrouver ses deux facteurs lorsqu'il compte plusieurs milliers de bits.")
r.h(4, "2. Génération des clés")
r.p("La génération d'une paire de clés suit quatre étapes :")
r.numbered(["choisir deux grands nombres premiers distincts p et q ;",
            "calculer n = p × q et φ(n) = (p − 1)(q − 1) ;",
            "choisir un exposant public e premier avec φ(n), en pratique 65537 ;",
            "calculer l'exposant privé d, inverse de e modulo φ(n)."])
r.p("La clé publique est le couple (n, e) ; la clé privée est le couple (n, d).")
r.h(4, "3. Chiffrement et déchiffrement")
r.p("Un message m, vu comme un entier inférieur à n, se chiffre et se déchiffre par une simple exponentiation modulaire :")
r.formula("c = m^{e} mod n          m = c^{d} mod n")
r.h(4, "4. Exemple numérique")
r.p("Avec p = 61 et q = 53, on obtient n = 3233 et φ(n) = 3120. Pour e = 17, l'inverse modulaire vaut d = 2753, car 17 × 2753 = 46 801 = 15 × 3120 + 1. Le message 65 se chiffre en 2790, et 2790 élevé à la puissance 2753 modulo 3233 redonne bien 65. Cet exemple est rejoué dans la page « Comprendre RSA » de l'application et vérifié par les tests automatiques.")

r.h(3, "II. Les limites de RSA utilisé seul")
r.h(4, "1. Les faiblesses du RSA « de manuel »")
r.p("Utilisé tel quel, RSA pose trois problèmes. Il est déterministe : un même message donne toujours le même chiffré, ce qui permet de tester des hypothèses. Il est malléable : multiplier un chiffré par s^{e} revient à multiplier le message clair par s. Enfin, il ne chiffre qu'un bloc plus petit que n.")
r.h(4, "2. Le remplissage OAEP")
r.p("Le remplissage OAEP, normalisé par PKCS #1 version 2.2 (RFC 8017), corrige les deux premiers points. Il mélange le message avec une valeur aléatoire à l'aide d'une fonction de hachage, ici SHA-256. Le chiffrement devient probabiliste, et toute modification du chiffré est rejetée au déchiffrement. Ce remplissage réduit encore la place disponible : le message ne peut dépasser k − 66 octets, où k est la taille de n en octets.")
r.table("Taille maximale d'un message RSA-OAEP avec SHA-256",
        ["Taille de clé", "Taille de n", "Message maximal"],
        [["2048 bits", "256 octets", "190 octets"], ["3072 bits", "384 octets", "318 octets"], ["4096 bits", "512 octets", "446 octets"]],
        [5.3, 5.3, 5.4])
r.h(4, "3. Le coût d'un chiffrement bloc par bloc")
r.p("Chiffrer un fichier de 100 Mo par blocs RSA demanderait environ 330 000 opérations. Au déchiffrement, chacune coûte près de 2 millisecondes avec une clé de 3072 bits sur notre machine, soit plus de dix minutes au total. Le chiffrement hybride ramène cette durée à moins d'une seconde.")
r.h(3, "III. Le chiffrement hybride")
r.p("La solution standard consiste à combiner les deux familles de chiffrement. Une clé symétrique aléatoire, la clé de session, chiffre le fichier. RSA-OAEP ne chiffre que cette clé de 32 octets, avec la clé publique du destinataire. C'est le principe adopté par OpenPGP et par S/MIME.")
r.p("RSA reste ainsi le mécanisme qui décide qui peut lire le fichier : sans la clé privée de Koffi, la clé de session est inaccessible, et le fichier avec elle. Le sujet, « chiffrer et déchiffrer à l'aide de RSA », est donc respecté, sans ses limites de taille et de vitesse.")
r.h(3, "IV. AES-256-GCM")
r.p("AES, normalisé par la publication FIPS 197, chiffre des blocs de 128 bits ; nous l'utilisons avec une clé de 256 bits. Le mode GCM, décrit par la publication NIST SP 800-38D, en fait un chiffrement authentifié : en plus du chiffré, il produit une étiquette de 128 bits calculée sur le chiffré et sur des données associées laissées en clair. Au déchiffrement, la moindre modification fait échouer la vérification et rien n'est restitué.")
r.p("GCM impose une règle stricte : ne jamais réutiliser un même couple de clé et de vecteur d'initialisation. Le chapitre 5 explique comment notre format la respecte.")
r.h(3, "V. SHA-256 et PBKDF2")
r.p("SHA-256, défini par la publication FIPS 180-4, produit un condensat de 256 bits. Nous l'utilisons à trois endroits : dans le remplissage OAEP, pour calculer l'empreinte d'une clé publique et pour vérifier le fichier restauré.")
r.p("PBKDF2, décrit par la RFC 8018, transforme un mot de passe en clé de chiffrement en répétant un calcul de hachage. Nous l'appliquons avec 600 000 itérations de HMAC-SHA-256, la valeur recommandée par l'OWASP. Chaque essai de mot de passe coûte ainsi environ 0,44 seconde dans le navigateur, ce qui freine fortement une attaque par dictionnaire.")

# ------------------------------------------------------------------ DEUXIÈME PARTIE
r.part_page("DEUXIÈME PARTIE : ÉTUDE CONCEPTUELLE",
            "Cette deuxième partie justifie la méthode de conception retenue, puis modélise le système à l'aide du langage UML.")

r.h(2, "CHAPITRE 3 : MÉTHODE D'ANALYSE ET DE CONCEPTION", page_break=True)
r.p("Concevoir un système fiable suppose de s'appuyer sur une démarche éprouvée. Ce chapitre compare les deux principales approches, justifie notre choix et présente le langage de modélisation associé.")
r.h(3, "I. Comparaison des méthodes d'analyse et de conception")
r.p("Deux familles de méthodes structurent l'ingénierie des systèmes d'information : les méthodes systémiques, dont MERISE est la plus représentative, et les méthodes orientées objet, incarnées par le Processus Unifié.")
r.h(4, "1. La méthode MERISE")
r.p("MERISE est une méthode née dans les années 1970 et largement diffusée dans l'espace francophone. Elle sépare les données des traitements et modélise par niveaux (conceptuel, logique, physique), ce qui convient aux systèmes de gestion bâtis autour d'une base de données stable.")
r.h(4, "2. Le Processus Unifié")
r.p("Le Processus Unifié est une démarche orientée objet, itérative et incrémentale, pilotée par les cas d'utilisation et centrée sur l'architecture (Jacobson, Booch et Rumbaugh, 1999). Découpé en quatre phases (lancement, élaboration, construction, transition), il s'appuie sur le langage UML.")
r.h(4, "3. Synthèse comparative")
r.p("Le tableau suivant confronte les deux approches au regard des besoins de notre projet.")
r.table("Comparaison de MERISE et du Processus Unifié",
        ["Critère", "MERISE", "Processus Unifié"],
        [["Paradigme", "Systémique, centré sur les données", "Orienté objet, centré sur l'architecture"],
         ["Élément moteur", "Le modèle de données", "Les cas d'utilisation"],
         ["Cycle de développement", "Séquentiel par niveaux", "Itératif et incrémental"],
         ["Langage de modélisation", "Formalismes propres (MCD, MLD, MPD)", "UML, standard unifié"],
         ["Adéquation à une application sans base de données", "Faible", "Forte"],
         ["Prise en compte du changement", "Faible en cours de projet", "Élevée, grâce aux itérations"]],
        [5.2, 5.4, 5.4], bold_first_col=True)
r.h(4, "4. Choix et justification")
r.p("Nous avons retenu le Processus Unifié, associé au langage UML, pour trois raisons. Notre application ne repose sur aucune base de données : MERISE, centrée sur le modèle de données, y trouverait peu de prise. Le code, écrit en TypeScript, est organisé en modules et en types, ce qui correspond au paradigme objet. Enfin, l'application se définit avant tout par ce que ses acteurs peuvent accomplir : chiffrer, déchiffrer, gérer des clés. Un pilotage par les cas d'utilisation épouse cette réalité.")
r.h(3, "II. Le langage de modélisation UML")
r.p("Le langage de modélisation unifié (Unified Modeling Language, UML) est un langage graphique normalisé par l'Object Management Group (OMG, 2017). Il propose des diagrammes structurels, qui décrivent l'organisation statique du système, et des diagrammes comportementaux, qui en décrivent la dynamique.")
r.figure(UML / "uml-hierarchie.png", "Hiérarchie des diagrammes UML", 14.5)
r.p("Parmi les treize diagrammes qu'offre UML, nous en avons retenu quatre :")
r.bullets(["le diagramme de cas d'utilisation, pour exprimer les besoins fonctionnels ;",
           "le diagramme de séquence, pour décrire le déroulement des échanges ;",
           "le diagramme de classes, pour représenter la structure des données manipulées ;",
           "le diagramme de déploiement, pour situer les composants sur l'infrastructure."])
r.p("Ces diagrammes, réalisés au format vectoriel SVG à partir du code de l'application, sont présentés au chapitre suivant.")

r.h(2, "CHAPITRE 4 : MODÉLISATION DU SYSTÈME", page_break=True)
r.p("Ce chapitre formalise les règles de gestion et les acteurs, puis modélise le système à l'aide des diagrammes UML retenus.")
r.h(3, "4.1. Règles de gestion")
r.p("L'analyse des besoins et du code a permis de dégager quatorze règles de gestion, réparties en trois domaines.")
r.sub("a. Gestion des clés")
r.table("Règles de gestion de l'application",
        ["N°", "Règle de gestion"],
        [["RG1", "Une paire de clés RSA fait 2048, 3072 ou 4096 bits ; 3072 bits est la taille proposée par défaut."],
         ["RG2", "Une clé publique de moins de 2048 bits est refusée."],
         ["RG3", "Un fichier contenant une clé privée est refusé lorsqu'une clé publique est attendue, avec un avertissement."],
         ["RG4", "Le mot de passe qui protège une clé privée compte au moins 8 caractères."],
         ["RG5", "La clé privée n'est jamais enregistrée par le navigateur ; seules les clés publiques des binômes le sont."]],
        [1.6, 14.4], bold_first_col=True)
r.sub("b. Chiffrement et déchiffrement")
r.table("", ["N°", "Règle de gestion"],
        [["RG6", "Un fichier n'est chiffré que pour une clé publique dont l'empreinte a été marquée comme vérifiée."],
         ["RG7", "Un fichier à chiffrer ne dépasse pas 100 Mo."],
         ["RG8", "Chaque fichier reçoit une clé de session et un préfixe de vecteur d'initialisation neufs."],
         ["RG9", "Le nom, le type, la taille et le condensat SHA-256 du fichier sont chiffrés avec son contenu."],
         ["RG10", "Un fichier .rsaenc n'est déchiffré que si l'identifiant de clé de son en-tête correspond à la clé chargée."],
         ["RG11", "Une seule étiquette d'intégrité invalide entraîne le refus complet ; aucune donnée partielle n'est restituée."],
         ["RG12", "Le fichier restauré n'est remis que si son condensat SHA-256 égale celui enregistré au chiffrement."]],
        [1.6, 14.4], caption=False, bold_first_col=True)
r.sub("c. Sécurité de l'application")
r.table("", ["N°", "Règle de gestion"],
        [["RG13", "Après son chargement, le site n'émet aucune requête réseau."],
         ["RG14", "Toute erreur produit un code stable et un message en français, sans détail technique exploitable."]],
        [1.6, 14.4], caption=False, bold_first_col=True)

r.h(3, "4.2. Identification des acteurs")
r.p("Le système met en jeu des acteurs humains et des systèmes externes.")
r.table("Acteurs du système",
        ["Acteur", "Nature", "Rôle vis-à-vis du système"],
        [["Expéditrice (Awa)", "Humain", "Importe la clé publique du destinataire, vérifie son empreinte et chiffre le fichier."],
         ["Destinataire (Koffi)", "Humain", "Crée sa paire de clés, diffuse sa clé publique, garde sa clé privée et déchiffre."],
         ["Enseignant", "Humain", "Consulte les explications pédagogiques et exécute les tests en direct."],
         ["Hébergeur (Vercel)", "Système externe", "Distribue les fichiers du site en HTTPS ; ne reçoit aucune donnée des utilisateurs."],
         ["Canal de transmission", "Système externe", "E-mail, messagerie ou clé USB : transporte la clé publique et le fichier chiffré."]],
        [4.0, 3.2, 8.8], bold_first_col=True)

r.h(3, "4.3. Diagrammes de cas d'utilisation")
r.h(4, "4.3.1. Définition")
r.p("Les diagrammes de cas d'utilisation représentent les services que le système doit rendre et les acteurs qui interagissent avec lui (Object Management Group, 2017). La relation « include » incorpore obligatoirement un autre cas, tandis que la relation « extend » ajoute un comportement conditionnel.")
r.h(4, "4.3.2. Diagramme de cas d'utilisation global")
r.figure(UML / "uml-cas-utilisation.png", "Diagramme de cas d'utilisation global de l'application", 15.5)
r.p("Le chiffrement inclut obligatoirement la vérification de l'empreinte (RG6). Le rechargement de la clé privée étend le déchiffrement : il n'intervient que lorsqu'aucune clé n'est chargée dans l'onglet, par exemple après sa fermeture (RG5).")

r.h(3, "4.4. Description textuelle des cas d'utilisation")
r.p("Trois scénarios importants sont détaillés ci-dessous.")
r.table("Description textuelle du cas d'utilisation « Générer une paire de clés »",
        ["Rubrique", "Contenu"],
        [["Description", "Créer une paire de clés RSA et en sauvegarder les deux moitiés."],
         ["Acteur", "Destinataire."],
         ["Préconditions", "Le site est ouvert en HTTPS ou en local."],
         ["Scénario nominal", "1. Le destinataire saisit son nom et choisit une taille de clé (RG1). 2. Le navigateur génère la paire et affiche p, q, n, e et d, secrets masqués. 3. L'application calcule l'empreinte. 4. Le destinataire télécharge sa clé publique au format PEM. 5. Il choisit un mot de passe (RG4) et télécharge sa clé privée protégée."],
         ["Scénarios alternatifs", "A1. Le destinataire s'ajoute lui-même comme destinataire pour s'entraîner seul."],
         ["Scénarios d'exception", "E1. Mot de passe trop court ou confirmation différente : téléchargement refusé (RG4)."],
         ["Postconditions", "La clé publique peut être diffusée ; la clé privée existe uniquement dans le fichier protégé et dans la mémoire de l'onglet (RG5)."]],
        [3.6, 12.4], bold_first_col=True)
r.table("Description textuelle du cas d'utilisation « Chiffrer un fichier »",
        ["Rubrique", "Contenu"],
        [["Description", "Produire un fichier .rsaenc lisible par le seul destinataire."],
         ["Acteur", "Expéditrice."],
         ["Préconditions", "La clé publique du destinataire a été importée."],
         ["Scénario nominal", "1. L'expéditrice choisit un fichier (RG7) et la clé du destinataire. 2. Elle compare l'empreinte avec le destinataire et la marque comme vérifiée (RG6). 3. Le navigateur tire une clé de session (RG8) et la scelle par RSA-OAEP. 4. Il chiffre les métadonnées et le contenu par AES-256-GCM, morceau par morceau (RG9). 5. Il assemble le fichier .rsaenc, que l'expéditrice télécharge et envoie."],
         ["Scénarios alternatifs", "A1. Le destinataire est l'expéditrice elle-même : le fichier peut être ouvert directement dans l'écran de déchiffrement."],
         ["Scénarios d'exception", "E1. Empreinte non vérifiée : chiffrement bloqué (RG6). E2. Fichier de plus de 100 Mo : refus (RG7)."],
         ["Postconditions", "Un fichier .rsaenc existe ; ni la clé de session ni le fichier clair n'ont quitté le navigateur (RG13)."]],
        [3.6, 12.4], bold_first_col=True)
r.table("Description textuelle du cas d'utilisation « Déchiffrer un fichier »",
        ["Rubrique", "Contenu"],
        [["Description", "Restituer le fichier d'origine à partir d'un fichier .rsaenc."],
         ["Acteur", "Destinataire."],
         ["Préconditions", "Le destinataire dispose du fichier .rsaenc, de sa clé privée et de son mot de passe."],
         ["Scénario nominal", "1. Le destinataire dépose le fichier .rsaenc. 2. L'application lit l'en-tête et vérifie qu'il est destiné à sa clé (RG10). 3. La clé privée est déverrouillée par le mot de passe. 4. Elle ouvre la clé de session par RSA-OAEP. 5. AES-GCM déchiffre chaque morceau et contrôle son étiquette. 6. Le condensat SHA-256 est comparé à l'original (RG12) et le fichier est restitué avec son nom."],
         ["Scénarios alternatifs", "A1. Aucune clé n'est chargée : le destinataire recharge son fichier .rsakey (extension du cas)."],
         ["Scénarios d'exception", "E1. Fichier destiné à une autre clé : refus (RG10). E2. Mot de passe incorrect : clé non déverrouillée. E3. Fichier modifié, tronqué ou réordonné : refus complet (RG11)."],
         ["Postconditions", "Le fichier restauré est identique à l'original, octet pour octet, ou aucune donnée n'est restituée."]],
        [3.6, 12.4], bold_first_col=True)

r.h(3, "4.5. Diagrammes de séquence")
r.h(4, "4.5.1. Chiffrement d'un fichier")
r.p("Le diagramme suivant décrit les échanges entre l'expéditrice, l'interface, le moteur cryptographique et l'API Web Crypto du navigateur pendant un chiffrement.")
r.figure(UML / "uml-sequence-chiffrement.png", "Diagramme de séquence du chiffrement d'un fichier", 15.5)
r.p("La clé de session n'existe en clair que dans la mémoire du navigateur, le temps d'être scellée ; le moteur l'efface dès qu'elle n'est plus utile. L'interface reçoit l'avancement réel du calcul, morceau par morceau, et ne l'anticipe jamais.")
r.h(4, "4.5.2. Déchiffrement d'un fichier")
r.figure(UML / "uml-sequence-dechiffrement.png", "Diagramme de séquence du déchiffrement d'un fichier", 15.5)
r.p("Le déchiffrement suit le chemin inverse. Le fragment « alt » montre qu'une seule étiquette invalide suffit à interrompre le traitement : le destinataire ne reçoit jamais un fichier partiellement altéré.")

r.h(3, "4.6. Diagramme de classes")
r.p("L'application ne comporte pas de base de données. Le diagramme de classes représente donc les structures de données manipulées par le moteur cryptographique, telles qu'elles sont typées dans le code TypeScript.")
r.figure(UML / "uml-classes.png", "Diagramme de classes du moteur cryptographique", 16)
r.p("Une identité (Identity) et une clé de binôme (Contact) partagent les attributs d'une clé publique (PublicKeyInfo). Le fichier .rsakey (PrivateKeyFile) protège une identité ; l'en-tête d'un fichier chiffré (ContainerHeader) désigne la clé publique de son destinataire par son identifiant. Les erreurs (FileSecureError) portent un code stable, exploité par l'interface et par les tests.")

r.h(3, "4.7. Diagramme de déploiement")
r.figure(UML / "uml-deploiement.png", "Diagramme de déploiement de l'application", 15.5)
r.p("Le serveur d'hébergement ne fait que livrer les fichiers du site. Tout le reste s'exécute sur les postes des utilisateurs : la clé privée reste dans la mémoire de l'onglet, les clés publiques des binômes dans le stockage local du navigateur, et les fichiers chiffrés circulent par le canal choisi par le binôme.")

# ------------------------------------------------------------------ TROISIÈME PARTIE
r.part_page("TROISIÈME PARTIE : RÉSULTATS ET DISCUSSIONS",
            "Cette dernière partie décrit la mise en œuvre de la solution, puis présente et discute ses résultats.")

r.h(2, "CHAPITRE 5 : MISE EN ŒUVRE DE LA SOLUTION", page_break=True)
r.p("Ce chapitre décrit l'environnement de réalisation, l'architecture mise en place, les dispositifs de sécurité qui la protègent et son déploiement en ligne.")
r.h(3, "5.1. Environnement de développement")
r.p("La réalisation s'est déroulée sur le poste de travail décrit dans le tableau suivant.")
r.table("Caractéristiques du poste de développement",
        ["Élément", "Caractéristique"],
        [["Machine", "Ordinateur portable Lenovo ThinkPad"],
         ["Processeur", "Intel Core i7-8565U (4 cœurs, 8 threads, 1,80 GHz)"],
         ["Mémoire vive", "16 Go"],
         ["Stockage", "SSD de 512 Go"],
         ["Système d'exploitation", "Microsoft Windows 11 Professionnel"],
         ["Navigateur de test", "Google Chrome 156"]],
        [5.0, 11.0], bold_first_col=True)
r.p("Les outils employés sont présentés ci-dessous selon leur rôle dans le projet.")
r.table("Outils et technologies de réalisation",
        ["Outil / technologie", "Rôle dans le projet"],
        [["TypeScript", "Langage de tout le code, interface et moteur cryptographique"],
         ["React", "Construction de l'interface en composants"],
         ["Vite", "Serveur de développement et compilation du site"],
         ["API Web Crypto", "RSA-OAEP, AES-GCM, SHA-256 et PBKDF2, en code natif du navigateur"],
         ["Tailwind CSS", "Mise en forme, à partir de la maquette du binôme"],
         ["Motion et Three.js", "Animations des étapes et grille d'octets en trois dimensions"],
         ["Vitest et Node.js", "Tests automatisés et interopérabilité OpenSSL"],
         ["Vercel", "Hébergement du site compilé en HTTPS"]],
        [5.0, 11.0], bold_first_col=True)
r.p("Tous ces composants sont gratuits pour un usage comme le nôtre, ce qui ne préjuge pas des coûts d'une éventuelle mise en production à grande échelle.")

r.h(3, "5.2. Architecture technique")
r.p("Le site est une application monopage qui s'exécute entièrement dans le navigateur. Le serveur se contente de livrer des fichiers statiques : une page HTML, du JavaScript et des feuilles de style. Le code est organisé en trois couches : l'interface ne manipule jamais directement de matériel cryptographique, elle appelle le moteur cryptographique, qui s'appuie lui-même sur l'API Web Crypto.")
r.figure(IMG / "architecture.png", "Architecture technique de RSA FileSecure", 15.5)
r.p("Le moteur cryptographique est isolé dans son propre dossier et ne dépend d'aucun élément d'interface. Il est ainsi testé tel quel dans Node.js comme dans le navigateur.")
r.table("Modules du moteur cryptographique",
        ["Module", "Lignes", "Responsabilité"],
        [["encoding.ts", "103", "Conversions Base64, hexadécimal et PEM ; calcul des empreintes"],
         ["errors.ts", "38", "Erreurs typées, avec un code stable et un message en français"],
         ["keys.ts", "280", "Génération, export et import des clés ; protection de la clé privée"],
         ["container.ts", "91", "Lecture et écriture de l'en-tête du format .rsaenc"],
         ["hybrid.ts", "272", "Chiffrement et déchiffrement hybrides, morceau par morceau"],
         ["textbook.ts", "140", "RSA programmé à la main, réservé à la page pédagogique"],
         ["selftest.ts", "300", "Dix-neuf cas de test partagés entre Node.js et le navigateur"]],
        [3.4, 2.0, 10.6], bold_first_col=True)
r.h(4, "5.2.1. Déroulement d'un échange")
r.p("La figure suivante résume la circulation des données entre les deux membres du binôme.")
r.figure(IMG / "echange.png", "Déroulement d'un échange entre l'expéditrice et le destinataire", 14.5)
r.p("La clé privée du destinataire, son mot de passe et la clé de session ne quittent jamais les navigateurs. Le tiers qui écoute le canal ne voit passer qu'une clé publique, qui ne sert qu'à chiffrer, et un fichier qu'il ne peut ni lire ni modifier sans que cela se voie.")
r.h(4, "5.2.2. Format du fichier chiffré")
r.p("Le fichier .rsaenc commence par les six caractères « RSAENC », un octet de version et la longueur de l'en-tête. Viennent ensuite l'en-tête, au format JSON, puis les morceaux chiffrés. L'en-tête indique les algorithmes, l'identifiant de la clé du destinataire, la clé de session scellée, le préfixe des vecteurs d'initialisation et le découpage en morceaux. Sa structure exacte figure en annexe 2.")
r.p("Le fichier est chiffré par morceaux de 1 Mo. Trois précautions rendent ce découpage sûr :")
r.bullets(["le vecteur d'initialisation de chaque morceau associe un préfixe aléatoire de 8 octets et le numéro du morceau, si bien qu'il ne se répète jamais pour une même clé ;",
           "chaque morceau authentifie, comme données associées, l'en-tête complet et son propre numéro, ce qui interdit de modifier l'en-tête ou d'intervertir deux morceaux ;",
           "un drapeau « dernier morceau » est lui aussi authentifié, ce qui rend toute troncature détectable."])
r.p("Le tableau suivant récapitule les choix cryptographiques et leur justification.")
r.table("Choix cryptographiques retenus",
        ["Élément", "Choix retenu", "Justification"],
        [["Chiffrement de la clé de session", "RSA-OAEP avec SHA-256, e = 65537", "Remplissage probabiliste ; PKCS #1 v1.5 écarté à cause de l'attaque de Bleichenbacher (1998)"],
         ["Taille de clé RSA", "3072 bits par défaut, 2048 au minimum", "128 bits de sécurité pour 3072 bits, 112 pour 2048 (NIST SP 800-57)"],
         ["Chiffrement du fichier", "AES-256-GCM", "Confidentialité et intégrité en une seule opération"],
         ["Découpage", "Morceaux de 1 Mo", "Mémoire maîtrisée et avancement réel affichable"],
         ["Protection de la clé privée", "PBKDF2-SHA-256, 600 000 itérations, puis AES-256-GCM", "Valeur recommandée par l'OWASP"],
         ["Empreinte de clé", "32 premiers caractères du SHA-256 de la clé publique", "128 bits, lisibles à voix haute en 8 groupes de 4"]],
        [4.2, 5.4, 6.4], bold_first_col=True)
r.h(4, "5.2.3. Affichage au rythme du calcul")
r.p("Les animations de l'application ne sont pas décoratives. Un module dédié reçoit l'avancement réel du calcul, et l'affichage ne le devance jamais : une étape n'apparaît terminée que lorsqu'elle l'est effectivement. En mode démonstration, chaque étape reste de plus visible au moins 950 millisecondes, le temps de la commenter. Une minuterie de secours garantit que l'affichage progresse même lorsque la fenêtre est masquée.")

r.h(3, "5.3. Sécurité de la solution")
r.p("Les mécanismes de sécurité couvrent quatre besoins : protéger la confidentialité du fichier, détecter toute modification, protéger la clé privée et empêcher toute fuite vers un serveur.")
r.table("Mécanismes de sécurité de l'application",
        ["Mécanisme", "Rôle", "Où il s'applique"],
        [["RSA-OAEP 3072 bits", "Seul le destinataire peut ouvrir la clé de session", "En-tête du fichier .rsaenc"],
         ["AES-256-GCM", "Confidentialité et intégrité du contenu", "Chaque morceau de 1 Mo"],
         ["Données associées authentifiées", "En-tête, numéro et dernier morceau protégés", "Chaque morceau"],
         ["Condensat SHA-256 final", "Fichier restauré identique à l'original", "Fin du déchiffrement"],
         ["PBKDF2 et AES-GCM", "Clé privée inutilisable sans le mot de passe", "Fichier .rsakey"],
         ["Clé importée non exportable", "Même le code de la page ne peut relire la clé privée", "Mémoire de l'onglet"],
         ["Vérification de l'empreinte", "Parade à la substitution de la clé publique", "Écran de chiffrement"],
         ["Politique de sécurité du contenu", "Aucune requête réseau après le chargement (connect-src 'none')", "Version publiée du site"],
         ["En-têtes HTTP de sécurité", "HSTS, interdiction d'intégrer le site dans un cadre", "Hébergement Vercel"]],
        [4.6, 6.4, 5.0], bold_first_col=True)

r.h(3, "5.4. Déploiement de la solution")
r.p("Le site est publié sur la plateforme Vercel, à l'adresse https://rsa-filesecure.vercel.app. Vercel installe les dépendances, compile le projet et diffuse le résultat en HTTPS, condition indispensable au fonctionnement de l'API Web Crypto.")
r.p("Le déploiement se fait depuis le dossier du projet avec la commande « npx vercel deploy --prod ». Seules les sources sont transmises ; la documentation, les fichiers d'environnement et les éventuels fichiers de clés sont exclus du téléversement. Après la mise en ligne, nous avons vérifié la présence de la politique de sécurité et des en-têtes HTTP, puis exécuté avec succès les dix-neuf tests de la page « Tests » sur le site public.")

r.h(2, "CHAPITRE 6 : RÉSULTATS ET DISCUSSION", page_break=True)
r.p("Ce chapitre présente l'application obtenue, les tests et les mesures réalisés, une estimation des coûts, puis discute les résultats au regard des limites relevées au chapitre 1.")
r.h(3, "6.1. Présentation de la solution")
r.p("L'application compte sept écrans : Accueil, Chiffrer, Déchiffrer, Clés RSA, Comprendre RSA, Tests et À propos. Les couleurs reprennent la maquette du binôme : une barre latérale bleu nuit, le violet pour chiffrer et le vert pour déchiffrer. Les captures suivantes ont été réalisées pendant un véritable échange entre deux sessions de navigateur.")
r.sub("❖ La page d'accueil")
r.p("Elle présente les deux actions principales, l'accès aux clés et un schéma animé de l'échange en cinq étapes.")
r.figure(SHOTS / "01-accueil.png", "Page d'accueil de l'application", 15)
r.sub("❖ La gestion des clés")
r.p("Pendant la génération, le navigateur cherche deux grands nombres premiers ; le site affiche ensuite les valeurs calculées, secrets masqués, puis la carte de la clé avec son empreinte.")
r.figure(SHOTS / "05-cles-calcul.png", "Valeurs calculées lors de la génération d'une clé", 14)
r.figure(SHOTS / "06-cles-identite.png", "Carte de la clé et empreinte à lire à voix haute", 14)
r.sub("❖ Le chiffrement d'un fichier")
r.p("Le panneau « Ce qui se passe » affiche les quatre étapes réelles et une grille représentant les 384 premiers octets du fichier, qui perd progressivement toute structure.")
r.figure(SHOTS / "12-chiffrer-en-cours.png", "Écran de chiffrement pendant le calcul", 15.5)
r.figure(SHOTS / "13-chiffrer-termine.png", "Fichier chiffré prêt à être téléchargé", 9)
r.sub("❖ Le déchiffrement d'un fichier")
r.p("Le chemin inverse s'affiche en vert. Les empreintes SHA-256 de l'original et du fichier obtenu s'affichent l'une sous l'autre.")
r.figure(IMG / "ecran-dechiffrer-etapes.png", "Étapes du déchiffrement et fichier restauré", 9)
r.sub("❖ Le refus d'un fichier modifié")
r.figure(SHOTS / "17-dechiffrer-refus.png", "Refus d'un fichier dont un octet a été modifié", 9)
r.sub("❖ La page « Comprendre RSA »")
r.p("Elle rejoue RSA sur de petits nombres, explique la limite de taille de RSA et montre la factorisation d'une clé trop courte.")
r.figure(SHOTS / "19-comprendre-rsa.png", "RSA pas à pas avec p = 61 et q = 53", 14)
r.sub("❖ La page « Tests »")
r.figure(SHOTS / "21-tests.png", "Exécution des dix-neuf tests dans le navigateur", 15)

r.h(3, "6.2. Tests et validation")
r.sub("La couverture automatisée")
r.p("Les vingt-deux tests automatisés passent en 1,65 seconde. Dix-neuf d'entre eux vérifient le moteur cryptographique ; ils sont écrits une seule fois et exécutés à deux endroits, par Vitest dans Node.js et par la page « Tests » dans le navigateur. Le tableau suivant en donne la répartition ; la liste complète figure en annexe 1.")
r.table("Couverture des tests automatisés",
        ["Famille", "Tests", "Objet principal des vérifications"],
        [["Clés", "6", "Génération, export et import PEM, mot de passe correct et incorrect, clé privée refusée, clé de 1024 bits refusée"],
         ["Chiffrement", "5", "Texte, fichier de 300 Ko en plusieurs morceaux, fichier vide, deux chiffrements différents, refus au-delà de 100 Mo"],
         ["Refus à la lecture", "6", "Octet modifié, clé d'une autre personne, en-tête falsifié, autre format, fichier tronqué, morceaux intervertis"],
         ["RSA pédagogique", "2", "Exemple p = 61, q = 53 ; clé de 48 bits cassée par factorisation"],
         ["Interopérabilité", "3", "Échanges croisés avec OpenSSL"],
         ["**Total**", "**22**", ""]],
        [3.6, 1.6, 10.8], bold_first_col=True)
r.p("Le test « Un octet modifié n'importe où » altère successivement un octet de l'en-tête, de la clé scellée, du contenu et de la dernière étiquette : les quatre modifications sont refusées.")
r.sub("L'interopérabilité avec OpenSSL")
r.p("Trois tests s'appuient sur le module crypto de Node.js, qui repose sur OpenSSL. OpenSSL lit notre clé publique et chiffre pour elle ; il ouvre la clé de session scellée dans un vrai fichier .rsaenc ; enfin, une paire de 3072 bits générée par OpenSSL fonctionne de bout en bout dans notre moteur. Nos formats sont donc standards, et non une construction propre au projet.")
r.sub("Les mesures de performance")
r.p("Les mesures ont été prises dans Chrome 156 sur le poste décrit au tableau 10. Elles portent sur le calcul seul : ni la lecture du fichier sur le disque, ni les animations ne sont comptées.")
r.figure(IMG / "perf-cles.png", "Durée de génération d'une paire de clés selon sa taille", 15.5)
r.p("La génération varie d'un essai à l'autre, car le navigateur tire des nombres au hasard jusqu'à en trouver deux premiers. Même dans le pire des 21 essais, une clé de 3072 bits est prête en moins de 0,75 seconde.")
r.figure(IMG / "perf-fichiers.png", "Durée de chiffrement et de déchiffrement selon la taille du fichier", 15.5)
r.p("Le temps croît linéairement avec la taille du fichier. Pour 100 Mo, le chiffrement prend 0,63 seconde et le déchiffrement 0,73 seconde, soit environ 160 et 140 Mo par seconde. Le fichier chiffré ne grossit que de 894 octets pour un fichier de 1 Ko et de 2 501 octets pour 100 Mo.")
r.sub("Les vérifications manuelles")
r.p("Nous avons rejoué le scénario complet entre deux sessions de navigateur indépendantes, vérifié la version publiée avec sa politique de sécurité, et contrôlé l'affichage sur un écran de téléphone de 375 pixels de large.")

r.h(3, "6.3. Estimation financière")
r.p("L'application ne repose sur aucun service payant. Le tableau suivant récapitule les postes de coût de la solution telle qu'elle est déployée.")
r.table("Estimation du coût de la solution",
        ["Désignation", "Choix retenu", "Coût (FCFA)"],
        [["Hébergement", "Vercel, offre gratuite", "0"],
         ["Nom de domaine", "Sous-domaine rsa-filesecure.vercel.app", "0"],
         ["Licences logicielles", "Bibliothèques libres", "0"],
         ["Serveur applicatif et base de données", "Aucun : tout s'exécute dans le navigateur", "0"],
         ["**Coût d'exploitation**", "", "**0**"]],
        [5.4, 7.6, 3.0], bold_first_col=True)
r.p("Le temps de travail du binôme et l'usage de matériel déjà disponible ne sont pas valorisés ici. Une mise en production à grande échelle exigerait en revanche un nom de domaine propre, un audit de sécurité et un hébergement sous contrat.")

r.h(3, "6.4. Discussion")
r.p("Le tableau suivant confronte chacune des quatre limites relevées au chapitre 1 au résultat obtenu.")
r.table("Réponse apportée aux limites de l'existant",
        ["Limite", "État", "Justification"],
        [["L1 Prise en main technique", "Levée", "Interface guidée en français, étapes visibles, messages d'erreur explicites"],
         ["L2 Échange d'un secret", "Levée", "Seule la clé publique circule ; son authenticité est vérifiée par l'empreinte"],
         ["L3 Confiance dans un tiers", "Levée, avec une réserve", "Aucune donnée envoyée au serveur ; la sécurité dépend toutefois du code qu'il distribue"],
         ["L4 Opacité du fonctionnement", "Levée", "Animations au rythme du calcul, page « Comprendre RSA », tests exécutés en direct"]],
        [4.4, 3.2, 8.4], bold_first_col=True)
r.p("Trois limites sont levées et la troisième l'est avec une réserve. L'apport le plus net concerne L2 : l'échange ne nécessite plus aucun secret partagé, ce qui est précisément ce que permet RSA.")

r.h(3, "6.5. Évaluation des résultats, limites et perspectives")
r.p("Le projet a abouti à une application web opérationnelle et publiée en ligne. Ses principaux résultats sont les suivants :")
r.bullets(["génération, export, sauvegarde protégée et rechargement des paires de clés RSA ;",
           "échange des clés publiques avec vérification des empreintes ;",
           "chiffrement hybride de tout fichier jusqu'à 100 Mo, en moins d'une seconde ;",
           "déchiffrement avec contrôle complet de l'intégrité et refus de tout fichier altéré ;",
           "pages pédagogiques et tests exécutables devant le jury."])
r.p("Les principales limites sont connues. L'application ne prouve pas l'identité de l'expéditeur : toute personne qui possède la clé publique de Koffi peut lui envoyer un fichier valide. La sécurité dépend du code distribué par l'hébergeur. Le fichier chiffré laisse deviner la taille de l'original et l'identifiant de la clé du destinataire. Enfin, le fichier est traité en mémoire, d'où la limite de 100 Mo, et PBKDF2 ralentit une attaque par dictionnaire sans l'empêcher.")
r.p("Plusieurs évolutions prolongeraient naturellement ce travail :")
r.bullets(["faire signer chaque fichier par l'expéditrice avec sa propre clé privée (RSA-PSS), pour prouver son identité ;",
           "accepter plusieurs destinataires, en scellant la même clé de session pour chaque clé publique ;",
           "chiffrer en flux, ce que le format par morceaux permet déjà, pour lever la limite de 100 Mo ;",
           "remplacer PBKDF2 par Argon2, compilé en WebAssembly, plus résistant aux attaques sur carte graphique ;",
           "vérifier les empreintes en scannant un code QR, plus rapide et plus sûr que la lecture à voix haute."])

r.h(1, "CONCLUSION", page_break=True)
for t in [
    "Ce travail a porté sur la conception et le développement d'une application web de chiffrement de fichiers par RSA entre deux membres d'un binôme. Il visait à permettre à une expéditrice de chiffrer un fichier que seul son destinataire pourrait lire, sans qu'ils aient à partager le moindre secret.",
    "Notre démarche a consisté à étudier les outils existants et à rédiger un cahier des charges, puis à mener la conception selon le Processus Unifié en la modélisant en UML. La réalisation s'est appuyée sur un chiffrement hybride, RSA-OAEP pour la clé de session et AES-256-GCM pour le contenu, entièrement exécuté dans le navigateur grâce à l'API Web Crypto.",
    "Ces travaux ont abouti à RSA FileSecure, une application publiée en ligne qui génère et protège les clés, chiffre des fichiers de 100 Mo en moins d'une seconde et refuse tout fichier altéré. Vingt-deux tests automatisés, dont trois tests d'interopérabilité avec OpenSSL, en vérifient le fonctionnement.",
    "Il ressort de ce travail qu'un algorithme correct ne suffit pas à construire un système sûr. RSA de manuel est mathématiquement juste, mais inutilisable tel quel. La sécurité vient de l'assemblage : le remplissage OAEP, le mode authentifié, l'unicité des vecteurs d'initialisation, les données associées et la vérification des empreintes. Chacun de ces détails répond à une attaque connue. Les travaux à venir porteront en priorité sur la signature des fichiers, qui permettrait au destinataire de s'assurer de l'identité de l'expéditrice.",
]:
    r.p(t)

# =====================================================================================
# PAGES FINALES (numérotation romaine, reprise par Word)
# =====================================================================================
r.new_section("lowerRoman", 1)
r.h(1, "BIBLIOGRAPHIE ET WEBOGRAPHIE")
refs = [
    "Barker, E. (2020). *Recommendation for key management: Part 1 – General* (NIST SP 800-57 Part 1 Rev. 5). National Institute of Standards and Technology. https://csrc.nist.gov/pubs/sp/800/57/pt1/r5/final",
    "Bellare, M., & Rogaway, P. (1995). Optimal asymmetric encryption. In *Advances in Cryptology, EUROCRYPT '94* (Lecture Notes in Computer Science, vol. 950). Springer.",
    "Bleichenbacher, D. (1998). Chosen ciphertext attacks against protocols based on the RSA encryption standard PKCS #1. In *Advances in Cryptology, CRYPTO '98* (Lecture Notes in Computer Science, vol. 1462). Springer.",
    "Dworkin, M. (2007). *Recommendation for block cipher modes of operation: Galois/Counter Mode (GCM) and GMAC* (NIST SP 800-38D). National Institute of Standards and Technology. https://csrc.nist.gov/pubs/sp/800/38/d/final",
    "Jacobson, I., Booch, G., & Rumbaugh, J. (1999). *The unified software development process*. Addison-Wesley.",
    "Josefsson, S., & Leonard, S. (2015). *Textual encodings of PKIX, PKCS, and CMS structures* (RFC 7468). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc7468",
    "Kaliski, B. (2008). *Public-Key Cryptography Standards (PKCS) #8: Private-key information syntax specification version 1.2* (RFC 5208). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc5208",
    "Moriarty, K., Kaliski, B., Jonsson, J., & Rusch, A. (2016). *PKCS #1: RSA cryptography specifications version 2.2* (RFC 8017). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc8017",
    "Moriarty, K., Kaliski, B., & Rusch, A. (2017). *PKCS #5: Password-based cryptography specification version 2.1* (RFC 8018). Internet Engineering Task Force. https://www.rfc-editor.org/rfc/rfc8018",
    "National Institute of Standards and Technology. (2001). *Advanced Encryption Standard (AES)* (FIPS 197). https://csrc.nist.gov/pubs/fips/197/final",
    "National Institute of Standards and Technology. (2015). *Secure Hash Standard (SHS)* (FIPS 180-4). https://csrc.nist.gov/pubs/fips/180-4/upd1/final",
    "Object Management Group. (2017). *OMG Unified Modeling Language (OMG UML), version 2.5.1*. https://www.omg.org/spec/UML/2.5.1/PDF",
    "OWASP Foundation. (s.d.). *Password storage cheat sheet*. https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html",
    "Rivest, R. L., Shamir, A., & Adleman, L. (1978). A method for obtaining digital signatures and public-key cryptosystems. *Communications of the ACM, 21*(2), 120-126.",
    "Tardieu, H., Rochfeld, A., & Colletti, R. (1986). *La méthode Merise : Principes et outils* (2ᵉ éd.). Éditions d'Organisation.",
    "Vercel. (s.d.). *Vercel documentation*. https://vercel.com/docs",
    "Wikipedia. (s.d.). *RSA numbers*. https://en.wikipedia.org/wiki/RSA_numbers",
    "World Wide Web Consortium. (2017). *Web Cryptography API* (Recommandation du W3C). https://www.w3.org/TR/WebCryptoAPI/",
]
for ref in refs:
    para = r.p(ref, align="l", after=8)
    para.paragraph_format.left_indent = Cm(1)
    para.paragraph_format.first_line_indent = Cm(-1)
    para.paragraph_format.line_spacing = 1.15
r.p("**Mémoire consulté**", before=8)
para = r.p("Assalé, N. J.-F. (2026). *Conception et développement d'une passerelle transactionnelle multicanale pour l'orchestration et le routage des transactions initiées depuis des TPE Android* (Mémoire de fin de cycle pour l'obtention de la licence en Systèmes informatiques et génie logiciel). École Supérieure Africaine des Technologies de l'Information et de la Communication.", align="l")
para.paragraph_format.left_indent = Cm(1)
para.paragraph_format.first_line_indent = Cm(-1)
para.paragraph_format.line_spacing = 1.15

r.h(1, "ANNEXES", page_break=True)
r.h(2, "ANNEXE 1 : LISTE COMPLÈTE DES TESTS")
tests = [
    ("1", "Génération d'une paire RSA", "Deux clés RSA-OAEP de 2048 bits, empreinte SHA-256 de 64 caractères"),
    ("2", "Clé publique : export puis import PEM", "Même empreinte et même nom après l'aller-retour"),
    ("3", "Clé privée protégée : bon mot de passe", "La clé relue déchiffre ce qui a été chiffré pour elle"),
    ("4", "Clé privée protégée : mauvais mot de passe", "Refus"),
    ("5", "Chiffrer puis déchiffrer un texte", "Contenu et SHA-256 identiques"),
    ("6", "Fichier binaire de 300 Ko en plusieurs morceaux", "Fichier identique octet par octet"),
    ("7", "Fichier vide", "Chiffré et restauré sans erreur"),
    ("8", "Un octet modifié n'importe où", "Refus dans l'en-tête, la clé scellée, le contenu et l'étiquette"),
    ("9", "Déchiffrer avec la clé d'une autre personne", "Refus"),
    ("10", "Mauvaise clé, même en falsifiant l'en-tête", "Refus : la clé de session ne s'ouvre pas"),
    ("11", "Fichier qui n'est pas un .rsaenc", "Message « fichier non reconnu »"),
    ("12", "Fichier tronqué", "Refus"),
    ("13", "Morceaux chiffrés intervertis", "Refus"),
    ("14", "Deux chiffrements du même fichier", "Résultats différents : clé de session et IV neufs"),
    ("15", "Clé privée importée à la place d'une clé publique", "Refus avec avertissement"),
    ("16", "Clé de 1024 bits", "Refus : trop faible"),
    ("17", "Fichier au-delà de 100 Mo", "Refus clair, sans plantage"),
    ("18", "RSA à la main : p = 61, q = 53", "n = 3233, d = 2753, 65 chiffré en 2790 puis retrouvé"),
    ("19", "Attaque d'une clé de 48 bits", "n factorisé, clé privée retrouvée"),
    ("20", "OpenSSL chiffre pour notre clé publique PEM", "Web Crypto déchiffre le message"),
    ("21", "OpenSSL ouvre la clé de session d'un .rsaenc", "Clé de session de 32 octets retrouvée"),
    ("22", "Paire OpenSSL de 3072 bits dans notre moteur", "Fichier chiffré puis restauré à l'identique"),
]
r.table("Liste complète des tests automatisés", ["N°", "Test", "Résultat attendu"], [list(t) for t in tests],
        [1.2, 7.4, 7.4], font_size=10.5)

r.h(2, "ANNEXE 2 : STRUCTURE DU FICHIER .RSAENC", page_break=True)
r.table("Structure du fichier .rsaenc",
        ["Position", "Taille", "Contenu"],
        [["0", "6 octets", "« RSAENC » en ASCII : 52 53 41 45 4E 43"],
         ["6", "1 octet", "Version du format : 01"],
         ["7", "4 octets", "Longueur L de l'en-tête JSON, entier gros-boutiste"],
         ["11", "L octets", "En-tête JSON : alg, kid, bits, wrappedKey, ivPrefix, chunkSize, chunks"],
         ["11 + L", "Reste", "Morceaux chiffrés par AES-GCM, chacun suivi de son étiquette de 16 octets"]],
        [2.4, 2.6, 11.0])
r.p("Avant chiffrement, la suite découpée en morceaux contient la longueur des métadonnées sur 4 octets, les métadonnées JSON (nom, type, taille et condensat SHA-256), puis le fichier. Pour le morceau numéro i, le vecteur d'initialisation vaut le préfixe aléatoire de 8 octets suivi de i sur 4 octets ; les données associées valent les 11 + L premiers octets du fichier, suivis de i et d'un octet qui vaut 1 pour le dernier morceau, 0 sinon.")
r.p("Voici l'en-tête réel d'un fichier chiffré pour une clé de 3072 bits, la clé scellée étant raccourcie :")
r.code(['{',
        '  "alg": { "key": "RSA-OAEP-256", "data": "AES-256-GCM" },',
        '  "kid": "48c86ea712c8313e26c18dfaedeb93d33deb1fbabbecdf75d6ea121c8b36b62a",',
        '  "bits": 3072,',
        '  "wrappedKey": "IhqSoxG8lHXLW1txCRVimoEQWpAW6Jsj...BStalUdaYQz1QvTy1mAmDyOR9pJwDsqvkSwhPeuZ/YtCQ",',
        '  "ivPrefix": "qnd4XIHabzk=",',
        '  "chunkSize": 1048576,',
        '  "chunks": 1',
        '}'])

r.h(2, "ANNEXE 3 : FICHIER DE CLÉ PRIVÉE .RSAKEY")
r.table("Champs du fichier de clé privée .rsakey",
        ["Champ", "Contenu"],
        [["format, version", "rsa-filesecure-private-key, version 1"],
         ["avertissement", "Rappel en clair : ne jamais partager ce fichier"],
         ["name, bits, createdAt", "Nom du propriétaire, taille de la clé, date de création"],
         ["kid", "Condensat SHA-256 de la clé publique, en hexadécimal"],
         ["publicKey", "Clé publique SPKI en Base64, pour afficher l'empreinte avant le mot de passe"],
         ["kdf", "PBKDF2, SHA-256, 600 000 itérations, sel aléatoire de 16 octets"],
         ["cipher", "AES-GCM, vecteur d'initialisation aléatoire de 12 octets"],
         ["data", "Clé privée PKCS #8 chiffrée, suivie de son étiquette ; données associées : kid"]],
        [4.4, 11.6], bold_first_col=True)
r.p("Pour une clé de 3072 bits, le fichier occupe 3 536 caractères. Le kid étant authentifié avec le chiffré, on ne peut pas recoller ce bloc sur une autre clé publique.")

r.h(2, "ANNEXE 4 : VÉRIFICATION AVEC OPENSSL", page_break=True)
r.p("Ces commandes, valables avec OpenSSL 3, permettent de contrôler nos fichiers sans passer par le site. La première affiche la taille et le module de la clé publique ; les deux suivantes chiffrent un secret pour le destinataire, puis le déchiffrent avec une clé privée PKCS #8 en clair, que seuls les tests automatiques produisent.")
r.code(["openssl pkey -pubin -in cle_publique_koffi.pem -text -noout", "",
        "openssl pkeyutl -encrypt -pubin -inkey cle_publique_koffi.pem \\",
        "  -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 \\",
        "  -pkeyopt rsa_mgf1_md:sha256 -in secret.bin -out secret.enc", "",
        "openssl pkeyutl -decrypt -inkey cle_privee_koffi.pem \\",
        "  -pkeyopt rsa_padding_mode:oaep -pkeyopt rsa_oaep_md:sha256 \\",
        "  -pkeyopt rsa_mgf1_md:sha256 -in secret.enc -out secret_retrouve.bin"])

r.h(2, "ANNEXE 5 : AUTRES ÉCRANS DE L'APPLICATION", page_break=True)
r.figure(SHOTS / "07-cles-publique.png", "Clé publique au format PEM, prête à être partagée", 11)
r.figure(SHOTS / "08-cles-privee.png", "Sauvegarde de la clé privée protégée par mot de passe", 11)
r.figure(SHOTS / "09-binome-ajoute.png", "Clé publique d'un binôme ajoutée, empreinte à vérifier", 13)
r.figure(SHOTS / "18-cle-recharger.png", "Rechargement d'une clé privée à partir du fichier .rsakey", 11)
r.figure(SHOTS / "20-attaque.png", "Factorisation d'une clé de 64 bits sur la page « Comprendre RSA »", 13)
r.figure(SHOTS / "22-telephone.png", "Affichage de l'application sur téléphone", 5.5)

r.h(2, "ANNEXE 6 : TECHNOLOGIES ET VERSIONS UTILISÉES", page_break=True)
r.p("Cette annexe précise les versions des technologies employées, regroupées selon leur rôle dans l'application.")
r.table("Technologies et versions utilisées",
        ["Technologie", "Version", "Rôle"],
        [["TypeScript", "7.0", "Langage du projet"],
         ["React", "19.3", "Interface en composants"],
         ["Vite", "8.3", "Compilation et serveur de développement"],
         ["Tailwind CSS", "4.3", "Mise en forme"],
         ["Motion", "14.2", "Animations des étapes"],
         ["Three.js", "0.186", "Grille d'octets en trois dimensions"],
         ["Kokonut UI et Bklit UI", "Registres de composants", "Zone de dépôt de fichiers, texte animé, jauges"],
         ["Vitest", "4.1", "Tests automatisés"],
         ["Node.js", "25.2", "Exécution des tests et de la compilation"],
         ["Vercel CLI", "65", "Déploiement du site"]],
        [5.2, 3.6, 7.2], bold_first_col=True)

r.h(1, "TABLE DES MATIÈRES", page_break=True)
r.toc('TOC \\o "1-4" \\h \\z \\u')

# quatrième de couverture
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
