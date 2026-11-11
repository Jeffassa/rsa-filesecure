// Grille 3D des octets (Three.js) : chaque petit bloc est un vrai octet du
// fichier. En clair, le texte laisse voir sa structure (espaces, lettres) ;
// une fois chiffré, il ne reste qu'un bruit uniforme. La bascule suit le
// front de progression réel du chiffrement ou du déchiffrement.

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";

export const COLS = 32;
export const ROWS = 12;
const COUNT = COLS * ROWS;
const FLIP_SECONDS = 0.38;
/** Hauteur maximale d'un bloc : assez basse pour que les rangées ne se masquent pas. */
const HEIGHT_SCALE = 0.55;

export type FieldState = "empty" | "plain" | "cipher";

export interface ByteField3DProps {
  plain: Uint8Array | null;
  cipher: Uint8Array | null;
  target: FieldState;
  /** Position du front de bascule, de 0 à 1. */
  progress: number;
  tone: "violet" | "green";
  reducedMotion: boolean;
}

const EMPTY_COLOR = new THREE.Color("#e6e8f3");
const PLAIN_COLORS = {
  letter: new THREE.Color("#3f4d6b"),
  sign: new THREE.Color("#8a8fa3"),
  space: new THREE.Color("#e3e6f2"),
  binary: new THREE.Color("#b4bacb"),
};
const CIPHER_COLORS = ["#6f59dc", "#997def", "#4a3ba8", "#c3b6f5"].map((c) => new THREE.Color(c));
const FRONT_COLORS = { violet: new THREE.Color("#6f59dc"), green: new THREE.Color("#039f7a") };

function plainLook(b: number | undefined): [THREE.Color, number] {
  if (b === undefined) return [EMPTY_COLOR, 0.08];
  if (b === 0x20 || b === 0x0a || b === 0x0d || b === 0x09 || b === 0) return [PLAIN_COLORS.space, 0.1];
  if ((b >= 0x41 && b <= 0x5a) || (b >= 0x61 && b <= 0x7a) || b >= 0xc0) return [PLAIN_COLORS.letter, 0.5 + (b % 13) / 40];
  if (b >= 0x21 && b <= 0x7e) return [PLAIN_COLORS.sign, 0.34 + (b % 7) / 40];
  return [PLAIN_COLORS.binary, 0.25 + b / 600];
}

function cipherLook(b: number | undefined): [THREE.Color, number] {
  if (b === undefined) return [EMPTY_COLOR, 0.08];
  return [CIPHER_COLORS[b & 3], 0.18 + (b / 255) * 0.95];
}

function look(state: number, i: number, plain: Uint8Array | null, cipher: Uint8Array | null): [THREE.Color, number] {
  if (state === 1) return plainLook(plain?.[i]);
  if (state === 2) return cipherLook(cipher?.[i]);
  return [EMPTY_COLOR, 0.08];
}

const STATE_CODE: Record<FieldState, number> = { empty: 0, plain: 1, cipher: 2 };

function Field({ plain, cipher, target, progress, tone, reducedMotion }: ByteField3DProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const front = useRef<THREE.Mesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const cur = useMemo(() => new Int8Array(COUNT), []);
  const flipFrom = useMemo(() => new Int8Array(COUNT), []);
  const flipStart = useMemo(() => new Float32Array(COUNT).fill(-1), []);
  const jitter = useMemo(() => Float32Array.from({ length: COUNT }, () => Math.random() * 0.14), []);
  const props = useRef({ plain, cipher, target, progress });
  props.current = { plain, cipher, target, progress };

  useLayoutEffect(() => {
    const m = mesh.current;
    if (!m) return;
    for (let i = 0; i < COUNT; i++) m.setColorAt(i, EMPTY_COLOR);
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, []);

  useFrame(({ clock }) => {
    const m = mesh.current;
    if (!m) return;
    const t = clock.getElapsedTime();
    const { plain, cipher, target, progress } = props.current;
    const goal = STATE_CODE[target];
    const frontCol = progress * COLS;

    for (let i = 0; i < COUNT; i++) {
      const col = i % COLS;
      const row = Math.floor(i / COLS);
      if (cur[i] !== goal && flipStart[i] < 0 && col < frontCol) {
        flipFrom[i] = cur[i];
        cur[i] = goal;
        flipStart[i] = reducedMotion ? t - FLIP_SECONDS : t + jitter[i];
      }

      let p = 1;
      if (flipStart[i] >= 0) {
        p = (t - flipStart[i]) / FLIP_SECONDS;
        if (p >= 1) {
          flipStart[i] = -1;
          p = 1;
        } else if (p < 0) p = 0;
      }
      const showing = flipStart[i] >= 0 && p < 0.5 ? flipFrom[i] : cur[i];
      const [c, h] = look(showing, i, plain, cipher);
      const squash = flipStart[i] >= 0 ? Math.abs(Math.cos(Math.PI * p)) : 1;
      const breathe = reducedMotion ? 0 : Math.sin(t * 1.6 + col * 0.35 + row * 0.5) * 0.012;
      const height = Math.max(0.03, h * HEIGHT_SCALE * (0.15 + 0.85 * squash)) + breathe;

      dummy.position.set(col - (COLS - 1) / 2, height / 2, row - (ROWS - 1) / 2);
      dummy.rotation.set(flipStart[i] >= 0 ? p * Math.PI : 0, 0, 0);
      dummy.scale.set(0.8, height, 0.8);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      color.copy(c);
      m.setColorAt(i, color);
    }
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;

    const f = front.current;
    if (f) {
      const visible = progress > 0 && progress < 1;
      f.visible = visible;
      f.position.x = frontCol - COLS / 2;
    }
  });

  return (
    <>
      <instancedMesh args={[undefined, undefined, COUNT]} ref={mesh}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.05} roughness={0.55} />
      </instancedMesh>
      <mesh position={[0, 0.4, 0]} ref={front} visible={false}>
        <boxGeometry args={[0.14, 0.9, ROWS + 0.6]} />
        <meshBasicMaterial color={FRONT_COLORS[tone]} opacity={0.55} transparent />
      </mesh>
    </>
  );
}

function FitCamera() {
  const { camera, size } = useThree();
  useLayoutEffect(() => {
    const cam = camera as THREE.OrthographicCamera;
    cam.zoom = Math.min(size.width / (COLS + 1.5), size.height / (ROWS + 2.2));
    cam.position.set(0, 22, 9);
    cam.lookAt(0, 0, 0);
    cam.updateProjectionMatrix();
  }, [camera, size]);
  return null;
}

export default function ByteField3D(props: ByteField3DProps & { active: boolean }) {
  const { active, ...rest } = props;
  return (
    <Canvas
      camera={{ position: [0, 22, 9], zoom: 18, near: 0.1, far: 200 }}
      dpr={[1, 2]}
      frameloop={active ? "always" : "never"}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      orthographic
    >
      <FitCamera />
      <ambientLight intensity={0.85} />
      <directionalLight intensity={2.1} position={[3, 20, 6]} />
      <directionalLight intensity={0.35} position={[-8, 4, 10]} />
      <Field {...rest} />
    </Canvas>
  );
}
