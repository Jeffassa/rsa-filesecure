import { describe, expect, it } from "vitest";
import { SELF_TESTS } from "../src/crypto/selftest";

describe("Moteur cryptographique (cas partagés avec la page Tests)", () => {
  for (const t of SELF_TESTS) {
    it(`${t.title} : ${t.expected}`, async () => {
      const detail = await t.run();
      expect(typeof detail).toBe("string");
    });
  }
});
