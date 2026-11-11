import { AlertTriangle, Boxes, FileLock2, GraduationCap, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/kit/misc";

const FORMAT = [
  { bytes: "6", label: "RSAENC", note: "préfixe magique", color: "#1f2b40" },
  { bytes: "1", label: "01", note: "version", color: "#5b6178" },
  { bytes: "4", label: "L", note: "longueur de l'en-tête", color: "#8a8fa3" },
  { bytes: "L", label: "en-tête JSON", note: "algorithmes, empreinte du destinataire, clé AES scellée par RSA, préfixe d'IV, morceaux", color: "#6f59dc" },
  { bytes: "...", label: "morceaux AES-GCM", note: "métadonnées et fichier chiffrés, 16 octets d'étiquette par morceau", color: "#c3b6f5" },
];

const LIMITS = [
  "Le chiffrement ne prouve pas qui a envoyé le fichier : n'importe qui ayant la clé publique de Koffi peut lui écrire. Une signature RSA-PSS ajouterait cette garantie.",
  "Si la clé privée ou son mot de passe sont perdus, les fichiers chiffrés pour elle sont irrécupérables. C'est voulu.",
  "La protection repose sur la vérification de l'empreinte : une clé publique substituée par un tiers ne se détecte qu'ainsi.",
  "Le fichier est traité entièrement en mémoire : la taille est limitée à 100 Mo.",
  "La taille du fichier chiffré laisse deviner celle de l'original.",
];

const STACK = [
  ["Web Crypto API", "RSA-OAEP, AES-GCM, PBKDF2, SHA-256, aléa sûr"],
  ["React, TypeScript, Vite", "interface et compilation"],
  ["Tailwind CSS", "mise en forme"],
  ["Motion", "animations et transitions"],
  ["Three.js", "grille 3D des octets"],
  ["Kokonut UI", "zone de dépôt, bouton à maintenir, texte matriciel"],
  ["Bklit UI", "graphiques : barres, Sankey, jauge"],
  ["Vitest", "tests automatiques, dont l'interopérabilité avec OpenSSL"],
];

function Block({ icon, title, children, delay = 0 }: { icon: ReactNode; title: string; children: ReactNode; delay?: number }) {
  return (
    <motion.section
      className="card p-5 sm:p-6"
      initial={{ opacity: 0, y: 18 }}
      transition={{ delay, duration: 0.45 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <h2 className="mb-4 flex items-center gap-2.5 text-lg font-bold text-ink">
        <span className="flex size-9 items-center justify-center rounded-xl bg-blue-soft text-blue">{icon}</span>
        {title}
      </h2>
      {children}
    </motion.section>
  );
}

export function AboutPage() {
  return (
    <div className="space-y-6">
      <PageHeader subtitle="TP de cryptographie, réalisé en binôme." title="À propos" />

      <Block icon={<GraduationCap className="size-4.5" />} title="Le projet">
        <p className="max-w-3xl text-[15px] leading-relaxed text-ink-2">
          RSA FileSecure permet à deux personnes d'échanger des fichiers confidentiels. Le destinataire crée une paire de clés RSA et partage sa clé publique ;
          l'expéditeur chiffre un fichier avec cette clé ; seul le destinataire, avec sa clé privée, peut le déchiffrer. Tout le calcul a lieu dans le navigateur :
          aucun fichier ni aucune clé n'est envoyé à un serveur.
        </p>
      </Block>

      <Block delay={0.05} icon={<FileLock2 className="size-4.5" />} title="Format du fichier .rsaenc">
        <div className="flex h-12 overflow-hidden rounded-xl">
          {FORMAT.map((f, i) => (
            <motion.div
              className="flex items-center justify-center px-2 font-mono text-[11px] font-medium text-white"
              initial={{ flexGrow: 0, opacity: 0 }}
              key={f.label}
              style={{ background: f.color, flexBasis: 0 }}
              transition={{ delay: 0.2 + i * 0.15, duration: 0.5 }}
              viewport={{ once: true }}
              whileInView={{ flexGrow: [1, 1, 1, 3, 5][i], opacity: 1 }}
            >
              <span className="truncate">{f.label}</span>
            </motion.div>
          ))}
        </div>
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {FORMAT.map((f) => (
            <li className="flex gap-3 text-sm" key={f.label}>
              <span className="mt-1 size-3 shrink-0 rounded" style={{ background: f.color }} />
              <span>
                <span className="font-mono font-semibold text-ink">{f.label}</span>
                <span className="text-ink-3"> ({f.bytes} octet{f.bytes === "1" ? "" : "s"})</span>
                <span className="block text-ink-2">{f.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </Block>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Block delay={0.1} icon={<AlertTriangle className="size-4.5" />} title="Limites connues">
          <ul className="space-y-2.5 text-sm leading-relaxed text-ink-2">
            {LIMITS.map((l) => (
              <li className="flex gap-2.5" key={l}>
                <span className="mt-2 size-1.5 shrink-0 rounded-full bg-warning" />
                {l}
              </li>
            ))}
          </ul>
        </Block>
        <Block delay={0.15} icon={<Boxes className="size-4.5" />} title="Technologies">
          <dl className="space-y-2 text-sm">
            {STACK.map(([k, v]) => (
              <div className="flex gap-3" key={k}>
                <dt className="w-40 shrink-0 font-semibold text-ink">{k}</dt>
                <dd className="text-ink-2">{v}</dd>
              </div>
            ))}
          </dl>
        </Block>
      </div>

      <Block delay={0.2} icon={<ShieldCheck className="size-4.5" />} title="Ce que le site ne fait jamais">
        <ul className="grid gap-2 text-sm text-ink-2 sm:grid-cols-2">
          <li>Envoyer un fichier, une clé ou un mot de passe sur le réseau.</li>
          <li>Enregistrer la clé privée dans le navigateur.</li>
          <li>Afficher la clé de session AES ou la clé privée en entier.</li>
          <li>Réutiliser une clé de session ou un vecteur d'initialisation.</li>
        </ul>
      </Block>
    </div>
  );
}
