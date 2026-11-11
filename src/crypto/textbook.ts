// RSA « de manuel », sur de petits nombres, pour la page Comprendre RSA.
//
// Ce code sert uniquement à expliquer et à démontrer une attaque : il n'a ni
// remplissage OAEP, ni protection contre les attaques par canal auxiliaire.
// Les vrais fichiers sont chiffrés par l'API Web Crypto (voir hybrid.ts).

export function mod(a: bigint, m: bigint): bigint {
  const r = a % m;
  return r < 0n ? r + m : r;
}

/** Exponentiation modulaire rapide (carré et multiplication). */
export function modPow(base: bigint, exponent: bigint, modulus: bigint): bigint {
  if (modulus === 1n) return 0n;
  let result = 1n;
  let b = mod(base, modulus);
  let e = exponent;
  while (e > 0n) {
    if (e & 1n) result = (result * b) % modulus;
    e >>= 1n;
    b = (b * b) % modulus;
  }
  return result;
}

export function gcd(a: bigint, b: bigint): bigint {
  let x = a < 0n ? -a : a;
  let y = b < 0n ? -b : b;
  while (y) [x, y] = [y, x % y];
  return x;
}

/** Inverse de a modulo m par l'algorithme d'Euclide étendu. */
export function modInverse(a: bigint, m: bigint): bigint {
  let [oldR, r] = [mod(a, m), m];
  let [oldS, s] = [1n, 0n];
  while (r) {
    const q = oldR / r;
    [oldR, r] = [r, oldR - q * r];
    [oldS, s] = [s, oldS - q * s];
  }
  if (oldR !== 1n) throw new Error("Ces nombres ne sont pas premiers entre eux : pas d'inverse.");
  return mod(oldS, m);
}

const SMALL_PRIMES = [2n, 3n, 5n, 7n, 11n, 13n, 17n, 19n, 23n, 29n, 31n, 37n];

/** Miller-Rabin avec les 12 premières bases : exact pour n < 3,3 x 10^24. */
export function isPrime(n: bigint): boolean {
  if (n < 2n) return false;
  for (const p of SMALL_PRIMES) {
    if (n === p) return true;
    if (n % p === 0n) return false;
  }
  let d = n - 1n;
  let s = 0;
  while ((d & 1n) === 0n) {
    d >>= 1n;
    s++;
  }
  outer: for (const a of SMALL_PRIMES) {
    let x = modPow(a, d, n);
    if (x === 1n || x === n - 1n) continue;
    for (let i = 1; i < s; i++) {
      x = (x * x) % n;
      if (x === n - 1n) continue outer;
    }
    return false;
  }
  return true;
}

function randomBigInt(bits: number): bigint {
  const bytes = crypto.getRandomValues(new Uint8Array(Math.ceil(bits / 8)));
  let n = 0n;
  for (const b of bytes) n = (n << 8n) | BigInt(b);
  return n & ((1n << BigInt(bits)) - 1n);
}

/** Nombre premier aléatoire d'exactement `bits` bits. */
export function randomPrime(bits: number): bigint {
  for (;;) {
    const candidate = randomBigInt(bits) | (1n << BigInt(bits - 1)) | 1n;
    if (isPrime(candidate)) return candidate;
  }
}

export interface ToyKey {
  p: bigint;
  q: bigint;
  n: bigint;
  phi: bigint;
  e: bigint;
  d: bigint;
}

/** Construit une clé à partir de p et q, avec le plus petit e usuel qui convient. */
export function toyKey(p: bigint, q: bigint, preferredE?: bigint): ToyKey {
  if (!isPrime(p) || !isPrime(q)) throw new Error("p et q doivent être premiers.");
  if (p === q) throw new Error("p et q doivent être différents.");
  const n = p * q;
  const phi = (p - 1n) * (q - 1n);
  const candidates = preferredE ? [preferredE] : [65537n, 257n, 17n, 7n, 5n, 3n];
  const e = candidates.find((c) => c < phi && gcd(c, phi) === 1n);
  if (!e) throw new Error("Aucun exposant public ne convient pour ces nombres.");
  return { p, q, n, phi, e, d: modInverse(e, phi) };
}

export const encryptNumber = (m: bigint, k: Pick<ToyKey, "e" | "n">) => modPow(m, k.e, k.n);
export const decryptNumber = (c: bigint, k: Pick<ToyKey, "d" | "n">) => modPow(c, k.d, k.n);

export interface FactorResult {
  p: bigint;
  q: bigint;
  iterations: number;
  ms: number;
}

/** Factorisation par la méthode rho de Pollard : rapide sur un petit n, impossible sur 2048 bits. */
export function factorize(n: bigint): FactorResult {
  const start = performance.now();
  let iterations = 0;
  if (n % 2n === 0n) return { p: 2n, q: n / 2n, iterations: 1, ms: performance.now() - start };
  for (let c = 1n; ; c++) {
    let x = 2n;
    let y = 2n;
    let d = 1n;
    while (d === 1n) {
      x = (x * x + c) % n;
      y = (y * y + c) % n;
      y = (y * y + c) % n;
      d = gcd(x > y ? x - y : y - x, n);
      iterations++;
    }
    if (d !== n) {
      const [p, q] = d < n / d ? [d, n / d] : [n / d, d];
      return { p, q, iterations, ms: performance.now() - start };
    }
  }
}
