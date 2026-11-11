// Texte de la vidéo : sous-titre affiché (caption) et texte prononcé (say).
// `min` : durée minimale du segment en secondes, pour laisser jouer l'animation.
export const SEGMENTS = [
  { id: "title", min: 6.5, caption: "RSA FileSecure : comment un fichier chiffré circule entre deux binômes.", say: "R S A File Secure. Comment un fichier chiffré circule entre deux binômes." },

  { id: "roles", min: 5, caption: "Awa envoie un fichier confidentiel. Koffi le reçoit.", say: "Awa envoie un fichier confidentiel. Koffi le reçoit." },
  { id: "canal", min: 6.5, caption: "Entre eux, un canal non sûr : un tiers peut tout intercepter. Le serveur du site, lui, ne reçoit rien.", say: "Entre eux, un canal non sûr : un tiers peut tout intercepter. Le serveur du site, lui, ne reçoit rien." },

  { id: "keys1", min: 6, caption: "Koffi crée sa paire de clés : le navigateur cherche deux grands nombres premiers, p et q.", say: "Koffi crée sa paire de clés. Le navigateur cherche deux grands nombres premiers, p et q." },
  { id: "keys2", min: 5, caption: "On en déduit le module n, l'exposant public e et l'exposant privé d.", say: "On en déduit le module n, l'exposant public e, et l'exposant privé d." },
  { id: "keys3", min: 4.5, caption: "La paire se sépare : une clé publique à partager, une clé privée à garder.", say: "La paire se sépare : une clé publique à partager, une clé privée à garder." },
  { id: "keys4", min: 5, caption: "La clé privée est enregistrée chiffrée par un mot de passe. Elle ne quitte jamais Koffi.", say: "La clé privée est enregistrée chiffrée par un mot de passe. Elle ne quitte jamais Koffi." },
  { id: "keys5", min: 5, caption: "Dans le site, ces valeurs s'affichent au moment même du calcul.", say: "Dans le site, ces valeurs s'affichent au moment même du calcul." },

  { id: "pub1", min: 6, caption: "Koffi envoie sa clé publique à Awa. Elle peut voyager sans protection : elle ne sert qu'à chiffrer.", say: "Koffi envoie sa clé publique à Awa. Elle peut voyager sans protection : elle ne sert qu'à chiffrer." },
  { id: "pub2", min: 5.5, caption: "Pour éviter qu'un tiers ne la remplace, Awa et Koffi comparent son empreinte à voix haute.", say: "Pour éviter qu'un tiers ne la remplace, Awa et Koffi comparent son empreinte à voix haute." },
  { id: "pub3", min: 4, caption: "Les empreintes sont identiques : la clé est authentique.", say: "Les empreintes sont identiques : la clé est authentique." },

  { id: "enc1", min: 5.5, caption: "Awa chiffre le fichier. D'abord, une clé AES de 256 bits est tirée au hasard, rien que pour ce fichier.", say: "Awa chiffre le fichier. D'abord, une clé A E S de 256 bits est tirée au hasard, rien que pour ce fichier." },
  { id: "enc2", min: 5.5, caption: "Cette clé de session est scellée avec RSA-OAEP et la clé publique de Koffi.", say: "Cette clé de session est scellée avec R S A, O A E P, et la clé publique de Koffi." },
  { id: "enc3", min: 7, caption: "AES-256-GCM chiffre ensuite le contenu par morceaux, chacun avec une étiquette d'intégrité.", say: "A E S 256 G C M chiffre ensuite le contenu par morceaux, chacun avec une étiquette d'intégrité." },
  { id: "enc4", min: 5, caption: "L'en-tête, la clé scellée et le contenu chiffré forment le fichier .rsaenc.", say: "L'en-tête, la clé scellée et le contenu chiffré forment le fichier point R S A E N C." },
  { id: "enc5", min: 6, caption: "Dans le site, ces quatre étapes s'affichent au rythme du vrai calcul.", say: "Dans le site, ces quatre étapes s'affichent au rythme du vrai calcul." },

  { id: "tx1", min: 4.5, caption: "Awa envoie le fichier chiffré, par e-mail ou par clé USB.", say: "Awa envoie le fichier chiffré, par e-mail ou par clé U S B." },
  { id: "tx2", min: 5.5, caption: "Le tiers peut le copier : sans la clé privée de Koffi, il n'y voit qu'un bruit illisible.", say: "Le tiers peut le copier : sans la clé privée de Koffi, il n'y voit qu'un bruit illisible." },
  { id: "tx3", min: 5, caption: "Et s'il modifie un seul octet, l'étiquette d'intégrité le trahira.", say: "Et s'il modifie un seul octet, l'étiquette d'intégrité le trahira." },

  { id: "dec1", min: 5.5, caption: "Koffi ouvre le fichier. L'en-tête indique à quelle clé il est destiné : c'est bien la sienne.", say: "Koffi ouvre le fichier. L'en-tête indique à quelle clé il est destiné : c'est bien la sienne." },
  { id: "dec2", min: 5.5, caption: "Déverrouillée par le mot de passe, la clé privée ouvre la clé de session.", say: "Déverrouillée par le mot de passe, la clé privée ouvre la clé de session." },
  { id: "dec3", min: 6, caption: "AES-GCM déchiffre chaque morceau et vérifie son étiquette.", say: "A E S G C M déchiffre chaque morceau, et vérifie son étiquette." },
  { id: "dec4", min: 5.5, caption: "Enfin, l'empreinte SHA-256 du fichier restauré est comparée à l'originale : elles sont identiques.", say: "Enfin, l'empreinte S H A 256 du fichier restauré est comparée à l'originale : elles sont identiques." },
  { id: "dec5", min: 5.5, caption: "Le fichier est restauré, octet pour octet.", say: "Le fichier est restauré, octet pour octet." },

  { id: "bad1", min: 6, caption: "Si le fichier a été modifié en route, le déchiffrement est refusé : rien n'est restitué.", say: "Si le fichier a été modifié en route, le déchiffrement est refusé : rien n'est restitué." },
  { id: "bad2", min: 4.5, caption: "Il en va de même avec la mauvaise clé ou un fichier tronqué.", say: "Il en va de même avec la mauvaise clé, ou un fichier tronqué." },

  { id: "sum1", min: 7, caption: "En résumé : RSA protège une petite clé, AES protège le fichier.", say: "En résumé : R S A protège une petite clé, A E S protège le fichier." },
  { id: "sum2", min: 8, caption: "Seuls la clé publique et le fichier chiffré voyagent. La clé privée, le mot de passe et la clé de session restent secrets.", say: "Seuls la clé publique et le fichier chiffré voyagent. La clé privée, le mot de passe et la clé de session restent secrets." },

  { id: "end", min: 6.5, caption: "Tout se passe dans le navigateur : aucun fichier n'est envoyé au serveur.", say: "Tout se passe dans le navigateur : aucun fichier n'est envoyé au serveur." },
];
