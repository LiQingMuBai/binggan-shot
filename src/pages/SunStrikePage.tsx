import { Smartphone, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";

import Battlefield from "@/components/game/Battlefield";
import HomeOverlay from "@/components/game/HomeOverlay";
import HudPanel from "@/components/game/HudPanel";
import ResultOverlay from "@/components/game/ResultOverlay";
import { useGameStore } from "@/store/useGameStore";

export default function SunStrikePage() {
  const gameState = useGameStore((state) => state);
  const phase = useGameStore((state) => state.phase);
  const playerX = useGameStore((state) => state.playerX);
  const playerY = useGameStore((state) => state.playerY);
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
  const [showRotateHint, setShowRotateHint] = useState(false);

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
        aimAt(playerX - moveStep, playerY);
      }

      if (event.code === "KeyD" || event.code === "ArrowRight") {
        event.preventDefault();
        aimAt(playerX + moveStep, playerY);
      }

      if (event.code === "KeyW" || event.code === "ArrowUp") {
        event.preventDefault();
        aimAt(playerX, playerY - moveStep);
      }

      if (event.code === "ArrowDown") {
        event.preventDefault();
        aimAt(playerX, playerY + moveStep);
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
  }, [aimAt, moveStep, phase, playerX, playerY, startCharge, stopCharge]);

  useEffect(() => {
    const syncOrientationHint = () => {
      const coarsePointer =
        typeof window.matchMedia === "function"
          ? window.matchMedia("(pointer: coarse)").matches
          : false;
      const isTouchDevice =
        coarsePointer || navigator.maxTouchPoints > 0;
      const isPortrait = window.innerHeight > window.innerWidth;
      const isPhoneWidth = Math.min(window.innerWidth, window.innerHeight) <= 900;

      setShowRotateHint(isTouchDevice && isPortrait && isPhoneWidth);
    };

    syncOrientationHint();
    window.addEventListener("resize", syncOrientationHint);
    window.addEventListener("orientationchange", syncOrientationHint);

    return () => {
      window.removeEventListener("resize", syncOrientationHint);
      window.removeEventListener("orientationchange", syncOrientationHint);
    };
  }, []);

  const showResult = phase === "victory" || phase === "defeat";

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#0b1325] text-stone-100">
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

      {showRotateHint ? (
        <section
          className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/78 px-4 py-6 backdrop-blur-md"
          style={{
            paddingTop: "max(env(safe-area-inset-top, 0px), 1rem)",
            paddingRight: "max(env(safe-area-inset-right, 0px), 1rem)",
            paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)",
            paddingLeft: "max(env(safe-area-inset-left, 0px), 1rem)",
          }}
        >
          <div className="voxel-panel w-full max-w-sm p-5 text-center sm:p-6">
            <div className="mx-auto flex w-fit items-center gap-3 text-amber-100">
              <Smartphone className="h-6 w-6" />
              <RotateCw className="h-5 w-5" />
            </div>
            <h2 className="mt-4 font-pixel text-sm uppercase leading-6 text-stone-100">
              手机横屏优先
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300/86">
              为了让战场、HUD 和触控操作更顺手，建议把手机横过来再开始战斗。
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="voxel-chip bg-cyan-100/10 px-3 py-1 font-pixel text-[0.5rem] uppercase leading-5 text-cyan-100">
                横屏视野更大
              </span>
              <span className="voxel-chip bg-amber-100/10 px-3 py-1 font-pixel text-[0.5rem] uppercase leading-5 text-amber-100">
                触控更稳
              </span>
            </div>
          </div>
        </section>
      ) : null}
    </main>
  );
}
