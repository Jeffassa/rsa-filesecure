# RSA FileSecure

TP de cryptographie, réalisé en binôme : un site web qui chiffre des fichiers avec RSA pour qu'un binôme, et lui seul, puisse les déchiffrer.

Tout se passe dans le navigateur. Aucun fichier, aucune clé et aucun mot de passe n'est envoyé sur le réseau.

Site en ligne : https://rsa-filesecure.vercel.app

Le dossier `docs` contient le guide d'utilisation (PDF), la vidéo de présentation et le rapport de projet (Word et PDF), avec les scripts qui les produisent.

## Lancer le site

Prérequis : Node.js 20 ou plus récent.

```bash
npm install
npm run dev
```

Le site s'ouvre sur http://localhost:5173. L'API Web Crypto exige un contexte sécurisé : `localhost` ou HTTPS.

Autres commandes :

| Commande | Rôle |
|---|---|
| `npm test` | Tests automatiques (22 cas, dont l'interopérabilité avec OpenSSL) |
| `npm run build` | Version de production dans `dist/`, à héberger sur n'importe quel serveur statique HTTPS |
| `npm run preview` | Sert la version de production en local |

## Scénario de démonstration à deux

1. **Koffi** (destinataire) ouvre « Clés RSA », crée sa paire de clés, télécharge sa clé publique (`.pem`) et sa clé privée protégée par mot de passe (`.rsakey`).
2. Koffi envoie sa clé publique à **Awa**. Elle l'ajoute dans « Clés RSA ».
3. Les deux lisent l'empreinte de la clé à voix haute. Si elle est identique, Awa coche « empreinte vérifiée ».
4. Awa ouvre « Chiffrer », choisit un fichier et la clé de Koffi, chiffre, puis envoie le fichier `.rsaenc` (e-mail, clé USB).
5. Koffi ouvre « Déchiffrer », dépose le `.rsaenc`, charge son `.rsakey` et son mot de passe, puis déchiffre. Les deux SHA-256 affichés sont identiques.

À montrer aussi : un fichier modifié d'un seul octet, ou chiffré pour une autre clé, est refusé. La page « Tests » rejoue ces cas en direct.

Pour s'entraîner seul, « Clés RSA » propose de s'ajouter soi-même comme destinataire.

## Choix cryptographiques

RSA ne peut chiffrer que quelques centaines d'octets (190 avec une clé de 2048 bits et OAEP SHA-256). Le site utilise donc le chiffrement hybride, standard dans les outils réels :

| Élément | Choix |
|---|---|
| Clé de session | AES-256 aléatoire, neuve pour chaque fichier |
| Chiffrement du fichier | AES-256-GCM, morceaux d'1 Mo, chacun avec une étiquette d'intégrité de 16 octets |
| Protection de la clé de session | RSA-OAEP, SHA-256, exposant 65537, 3072 bits par défaut (2048 minimum) |
| Vecteur d'initialisation | 8 octets aléatoires et un compteur de morceau (96 bits) |
| Données authentifiées | En-tête complet, numéro du morceau, drapeau « dernier morceau » |
| Clé privée exportée | PKCS#8 chiffré par PBKDF2-SHA-256 (600 000 itérations) puis AES-256-GCM |
| Clé publique exportée | PEM, format SPKI, lisible par OpenSSL |
| Empreinte | SHA-256 de la clé publique (SPKI), 32 caractères affichés |

Toutes ces opérations passent par l'API Web Crypto. Le RSA « à la main » (`src/crypto/textbook.ts`) ne sert qu'à la page pédagogique.

## Format du fichier .rsaenc

```
octets 0 à 5    "RSAENC"                préfixe magique
octet  6        0x01                    version du format
octets 7 à 10   L                       longueur de l'en-tête, entier 32 bits gros-boutiste
L octets        en-tête JSON            alg, kid, bits, wrappedKey, ivPrefix, chunkSize, chunks
reste           morceaux AES-GCM        chacun : texte chiffré suivi de l'étiquette de 16 octets
```

La suite chiffrée contient d'abord les métadonnées (nom, type, taille, SHA-256 du fichier), puis le fichier : le nom du fichier n'apparaît donc pas en clair.

## Organisation du code

```
src/
  crypto/        moteur, sans aucune dépendance à l'interface
    keys.ts        génération, PEM, empreintes, clé privée protégée
    hybrid.ts      chiffrement et déchiffrement hybrides
    container.ts   lecture et écriture du format .rsaenc
    textbook.ts    RSA sur petits nombres et attaque par factorisation (pédagogie)
    selftest.ts    cas de test partagés entre Vitest et la page Tests
  pages/         Accueil, Chiffrer, Déchiffrer, Clés RSA, Comprendre RSA, Tests, À propos
  components/    interface : grille 3D des octets (Three.js), étapes animées, graphiques
  lib/pacer.ts   cadence des animations sur la progression réelle du calcul
tests/           tests Vitest, dont l'interopérabilité OpenSSL
```

## Bibliothèques

React, TypeScript, Vite, Tailwind CSS, Motion (animations), Three.js et React Three Fiber (grille 3D), Kokonut UI (zone de dépôt, bouton à maintenir, texte matriciel), Bklit UI (graphiques en barres, Sankey, jauge), Lucide (icônes), Sonner (notifications), Vitest (tests).

## Limites connues

- Le chiffrement ne prouve pas l'identité de l'expéditeur : une signature RSA-PSS serait l'étape suivante.
- Une clé privée ou un mot de passe perdu rend les fichiers irrécupérables.
- La vérification de l'empreinte est la seule défense contre une clé publique substituée.
- Les fichiers sont traités en mémoire : limite de 100 Mo.
- La taille du fichier chiffré révèle approximativement celle de l'original.
