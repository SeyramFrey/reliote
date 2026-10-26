import { describe, it, expect } from "vitest";
import { readyVerdict, LOOP_CAP } from "./readiness";

describe("readyVerdict", () => {
  it("on reste dans la boucle tant que le cœur n'est pas prêt", () => {
    expect(readyVerdict({ coreReady: false, videoReady: true, elapsed: 1 }).leaveLoop).toBe(false);
  });

  it("on sort dès que le cœur est prêt", () => {
    expect(readyVerdict({ coreReady: true, videoReady: true, elapsed: 0.3 }).leaveLoop).toBe(true);
  });

  // Sans plafond, « ça boucle jusqu'au chargement » devient pire que le
  // minuteur décoratif qu'on voulait éviter.
  it("le plafond de 5 s sort de la boucle même sans signal", () => {
    expect(LOOP_CAP).toBe(5);
    expect(readyVerdict({ coreReady: false, videoReady: false, elapsed: 5 }).leaveLoop).toBe(true);
  });

  it("la vidéo ne fait pas partie du signal « prêt »", () => {
    expect(readyVerdict({ coreReady: true, videoReady: false, elapsed: 1 }).leaveLoop).toBe(true);
  });

  it("vidéo absente : l'acte 4 est sauté, pas d'écran noir", () => {
    expect(readyVerdict({ coreReady: true, videoReady: false, elapsed: 1 }).includeVideoAct).toBe(
      false,
    );
    expect(readyVerdict({ coreReady: true, videoReady: true, elapsed: 1 }).includeVideoAct).toBe(
      true,
    );
  });
});
