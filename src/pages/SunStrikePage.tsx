import { useEffect } from "react";

import Battlefield from "@/components/game/Battlefield";
import HomeOverlay from "@/components/game/HomeOverlay";
import HudPanel from "@/components/game/HudPanel";
import ResultOverlay from "@/components/game/ResultOverlay";
import { useGameStore } from "@/store/useGameStore";

export default function SunStrikePage() {
  const gameState = useGameStore((state) => state);
  const phase = useGameStore((state) => state.phase);
  const playerX = useGameStore((state) => state.playerX);
  const moveStep = useGameStore((state) => (state.speedBoostMs > 0 ? 5.8 : 3.6));
  const hydrateRecord = useGameStore((state) => state.hydrateRecord);
  const tick = useGameStore((state) => state.tick);
  const aimAt = useGameStore((state) => state.aimAt);
  const startCharge = useGameStore((state) => state.startCharge);
  const stopCharge = useGameStore((state) => state.stopCharge);
  const cancelShotCharge = useGameStore((state) => state.cancelShotCharge);
  const startGame = useGameStore((state) => state.startGame);
  const restartGame = useGameStore((state) => state.restartGame);
  const returnHome = useGameStore((state) => state.returnHome);

  useEffect(() => {
    hydrateRecord();
  }, [hydrateRecord]);

  useEffect(() => {
    if (phase !== "playing") {
      return undefined;
    }

    let animationFrame = 0;
    let lastTimestamp = performance.now();

    const loop = (timestamp: number) => {
      tick(timestamp - lastTimestamp);
      lastTimestamp = timestamp;
      animationFrame = window.requestAnimationFrame(loop);
    };

    animationFrame = window.requestAnimationFrame(loop);

    return () => window.cancelAnimationFrame(animationFrame);
  }, [phase, tick]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (phase !== "playing") {
        return;
      }

      if (event.code === "KeyA" || event.code === "ArrowLeft") {
        event.preventDefault();
        aimAt(playerX - moveStep);
      }

      if (event.code === "KeyD" || event.code === "ArrowRight") {
        event.preventDefault();
        aimAt(playerX + moveStep);
      }

      if (event.code === "Space" || event.code === "KeyS") {
        event.preventDefault();
        startCharge();
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (phase !== "playing") {
        return;
      }

      if (event.code === "Space" || event.code === "KeyS") {
        event.preventDefault();
        stopCharge();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [aimAt, moveStep, phase, playerX, startCharge, stopCharge]);

  const showResult = phase === "victory" || phase === "defeat";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b1325] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(129,184,255,0.08)_0_18%,transparent_18%),linear-gradient(90deg,rgba(255,255,255,0.03)_0_2px,transparent_2px),radial-gradient(circle_at_20%_0%,rgba(255,162,77,0.12),transparent_30%),radial-gradient(circle_at_80%_100%,rgba(61,111,255,0.12),transparent_34%)] [background-size:100%_100%,56px_56px,100%_100%,100%_100%]" />
      <Battlefield
        runtime={gameState}
        onAim={aimAt}
        onChargeStart={startCharge}
        onChargeEnd={stopCharge}
        onChargeCancel={cancelShotCharge}
      />

      {phase === "idle" ? (
        <HomeOverlay
          bestScore={gameState.bestScore}
          bestCombo={gameState.bestCombo}
          bestTimeMs={gameState.bestTimeMs}
          onStart={startGame}
        />
      ) : null}

      {phase !== "idle" ? <HudPanel runtime={gameState} /> : null}

      {showResult ? (
        <ResultOverlay
          phase={phase === "victory" ? "victory" : "defeat"}
          score={gameState.score}
          combo={gameState.combo}
          accuracy={gameState.accuracy}
          elapsedMs={gameState.elapsedMs}
          bestScore={gameState.bestScore}
          onRestart={restartGame}
          onReturnHome={returnHome}
        />
      ) : null}
    </main>
  );
}
