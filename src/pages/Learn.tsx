import { motion } from "motion/react";
import type { ReactNode } from "react";
import { PageHeader } from "@/components/kit/misc";
import { HybridSankey } from "@/components/learn/HybridSankey";
import { SimpleBars } from "@/components/learn/SimpleBars";
import { SmallKeyAttack } from "@/components/learn/SmallKeyAttack";
import { ToyRsa } from "@/components/learn/ToyRsa";

// Taille maximale d'un message RSA-OAEP avec SHA-256 : k - 2 x 32 - 2 octets.
const OAEP_MAX = [2048, 3072, 4096].map((bits) => ({ name: `RSA ${bits}`, value: bits / 8 - 2 * 32 - 2 }));

function Section({ n, title, intro, children }: { n: number; title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <motion.section
      className="card p-5 sm:p-7"
      initial={{ opacity: 0, y: 24 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      viewport={{ once: true, margin: "-80px" }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-5 flex items-start gap-4">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-step text-base font-bold text-white">{n}</span>
        <div>
          <h2 className="text-xl font-bold text-ink">{title}</h2>
          <div className="mt-1 max-w-3xl text-[15px] leading-relaxed text-ink-2">{intro}</div>
        </div>
      </div>
      {children}
    </motion.section>
  );
}

const PARAMS = [
  ["Chiffrement de la clé", "RSA-OAEP, SHA-256, exposant 65537", "OAEP rend chaque chiffrement aléatoire et résiste aux attaques par oracle de remplissage."],
  ["Taille de clé RSA", "3072 bits par défaut, 2048 au minimum", "2048 bits reste acceptable ; 3072 bits offre une marge pour les années à venir."],
  ["Chiffrement du fichier", "AES-256-GCM, morceaux d'1 Mo", "Rapide sur de gros fichiers, et chaque morceau porte une étiquette d'intégrité de 16 octets."],
  ["Vecteur d'initialisation", "96 bits : 8 octets aléatoires et un compteur", "Jamais réutilisé avec la même clé, ce qui est indispensable en GCM."],
  ["Données authentifiées", "En-tête, numéro et dernier morceau", "Modifier, réordonner ou tronquer le fichier fait échouer le déchiffrement."],
  ["Protection de la clé privée", "PBKDF2-SHA-256, 600 000 itérations, puis AES-256-GCM", "Deviner le mot de passe coûte cher même à un attaquant équipé."],
  ["Empreinte de clé", "SHA-256 de la clé publique (SPKI)", "À comparer de vive voix pour déjouer l'attaque de l'homme du milieu."],
];

export function LearnPage() {
  return (
    <div className="space-y-6">
      <PageHeader subtitle="Le principe de RSA, pourquoi on l'associe à AES, et pourquoi la taille de clé compte." title="Comprendre RSA" />

      <Section
        intro={
          <>
            RSA repose sur un fait simple : multiplier deux nombres premiers est facile, retrouver ces deux nombres à partir de leur produit est très difficile. Choisissez p et q, et suivez le calcul de la clé.
            Ici les nombres sont minuscules pour être lisibles ; les vraies clés utilisent des nombres de plus de 900 chiffres.
          </>
        }
        n={1}
        title="RSA pas à pas"
      >
        <ToyRsa />
      </Section>

      <Section
        intro={
          <>
            Avec le remplissage OAEP et SHA-256, RSA ne chiffre au plus que quelques centaines d'octets d'un coup. Un PDF de 245 Ko serait découpé en plus de 1 300 blocs, très lentement.
            On chiffre donc le fichier avec AES, et RSA ne protège que la clé AES de 32 octets : c'est le chiffrement hybride.
          </>
        }
        n={2}
        title="Pourquoi RSA ne chiffre pas tout le fichier"
      >
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.5fr]">
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm font-bold text-ink">Taille maximale d'un message RSA-OAEP</p>
            <p className="mb-2 text-xs text-ink-3">k - 2 x 32 - 2 octets, où k est la taille du module</p>
            <SimpleBars color="#6f59dc" data={OAEP_MAX} format={(v) => `${v} octets`} />
          </div>
          <div className="rounded-2xl border border-line bg-white p-4">
            <p className="text-sm font-bold text-ink">Le chiffrement hybride utilisé par le site</p>
            <p className="mb-1 text-xs text-ink-3">Survolez les flux. Épaisseurs indicatives.</p>
            <HybridSankey />
          </div>
        </div>
      </Section>

      <Section
        intro="Si n est trop petit, un attaquant le factorise, retrouve p et q, recalcule d, et lit le message. Essayez sur des clés de 32 à 64 bits."
        n={3}
        title="Attaque d'une clé trop petite"
      >
        <SmallKeyAttack />
      </Section>

      <Section intro="Les choix cryptographiques du site, et la raison de chacun." n={4} title="Les paramètres retenus">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-line border-b text-xs text-ink-3">
                <th className="py-2 pr-4 font-semibold">Élément</th>
                <th className="py-2 pr-4 font-semibold">Choix</th>
                <th className="py-2 font-semibold">Pourquoi</th>
              </tr>
            </thead>
            <tbody>
              {PARAMS.map(([a, b, c], i) => (
                <motion.tr
                  className="border-line border-b align-top last:border-0"
                  initial={{ opacity: 0, x: -8 }}
                  key={a}
                  transition={{ delay: i * 0.05 }}
                  viewport={{ once: true }}
                  whileInView={{ opacity: 1, x: 0 }}
                >
                  <td className="py-3 pr-4 font-semibold text-ink">{a}</td>
                  <td className="py-3 pr-4 font-mono text-[12.5px] text-violet-deep">{b}</td>
                  <td className="py-3 text-ink-2">{c}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
