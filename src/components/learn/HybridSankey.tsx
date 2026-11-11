import { SankeyChart, SankeyLink, SankeyNode, SankeyTooltip } from "@/components/charts/sankey";

// Schéma du chiffrement hybride. Les épaisseurs sont indicatives : en octets
// réels, la clé (32 octets) serait invisible à côté du fichier.
const DATA = {
  nodes: [
    { name: "Fichier original", category: "source" as const },
    { name: "Clé de session AES", category: "source" as const },
    { name: "AES-256-GCM", category: "landing" as const },
    { name: "RSA-OAEP", category: "landing" as const },
    { name: "Fichier .rsaenc", category: "outcome" as const },
  ],
  links: [
    { source: 0, target: 2, value: 60 },
    { source: 1, target: 2, value: 14 },
    { source: 1, target: 3, value: 22 },
    { source: 2, target: 4, value: 74 },
    { source: 3, target: 4, value: 22 },
  ],
};

const COLORS = ["#1f2b40", "#4a6be2", "#6f59dc", "#997def", "#039f7a"];

export function HybridSankey() {
  return (
    <SankeyChart aspectRatio="2.3 / 1" data={DATA} margin={{ top: 16, right: 130, bottom: 16, left: 130 }} nodePadding={28} nodeWidth={14}>
      <SankeyLink getNodeColor={(_, i) => COLORS[i] ?? "#8a8fa3"} strokeOpacity={0.35} />
      <SankeyNode getNodeColor={(_, i) => COLORS[i] ?? "#8a8fa3"} lineCap={4} showValueLabels={false} />
      <SankeyTooltip />
    </SankeyChart>
  );
}
