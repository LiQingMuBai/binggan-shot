import { Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import Battlefield from "@/components/game/Battlefield";
import HomeOverlay from "@/components/game/HomeOverlay";
import HudPanel from "@/components/game/HudPanel";
import ResultOverlay from "@/components/game/ResultOverlay";
import { useGameStore } from "@/store/useGameStore";
import { gameAudio } from "@/utils/audio";

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
  const [audioMuted, setAudioMuted] = useState(gameAudio.isMuted());
  const previousStateRef = useRef(gameState);

  useEffect(() => {
    hydrateRecord();
  }, [hydrateRecord]);

  useEffect(() => {
    return gameAudio.subscribe(setAudioMuted);
  }, []);

  useEffect(() => {
    if (phase === "idle") {
      gameAudio.setMood("idle");
      return;
    }

    if (phase === "victory") {
      gameAudio.setMood("victory");
      return;
    }

    if (phase === "defeat") {
      gameAudio.setMood("defeat");
      return;
    }

    gameAudio.setMood(gameState.sunStage === 3 ? "battle3" : gameState.sunStage === 2 ? "battle2" : "battle1");
  }, [gameState.sunStage, phase]);

  useEffect(() => {
    const previousState = previousStateRef.current;

    if (gameState.shotsFired > previousState.shotsFired) {
      gameAudio.playArrowShot();
    }

    if (gameState.sunHp < previousState.sunHp) {
      gameAudio.playSunHit();
    }

    if (gameState.playerHp < previousState.playerHp) {
      gameAudio.playPlayerHit();
    }

    if (gameState.enemyBursts.length > previousState.enemyBursts.length) {
      gameAudio.playMonsterBurst();
    }

    if (gameState.speedBoostMs > 0 && previousState.speedBoostMs <= 0) {
      gameAudio.playPowerup("speed");
    }

    if (gameState.doubleArrowMs > 0 && previousState.doubleArrowMs <= 0) {
      gameAudio.playPowerup("double");
    }

    if (gameState.freezeWorldMs > 0 && previousState.freezeWorldMs <= 0) {
      gameAudio.playPowerup("freeze");
    }

    if (gameState.ultramanAssistMs > 0 && previousState.ultramanAssistMs <= 0) {
      gameAudio.playPowerup("ultraman");
    }

    if (gameState.wukongGuardMs > 0 && previousState.wukongGuardMs <= 0) {
      gameAudio.playPowerup("wukong");
    }

    if (gameState.phase !== previousState.phase) {
      if (gameState.phase === "victory") {
        gameAudio.playVictory();
      }

      if (gameState.phase === "defeat") {
        gameAudio.playDefeat();
      }
    }

    previousStateRef.current = gameState;
  }, [gameState]);

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

      gameAudio.resume();

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

  const showResult = phase === "victory" || phase === "defeat";
  const handleStartGame = () => {
    gameAudio.resume();
    startGame();
  };
  const handleRestartGame = () => {
    gameAudio.resume();
    restartGame();
  };
  const handleReturnHome = () => {
    returnHome();
  };
  const handleChargeStart = () => {
    gameAudio.resume();
    startCharge();
  };

  return (
    <main className="relative min-h-[100dvh] overflow-x-hidden bg-[#0b1325] text-stone-100">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(129,184,255,0.08)_0_18%,transparent_18%),linear-gradient(90deg,rgba(255,255,255,0.03)_0_2px,transparent_2px),radial-gradient(circle_at_20%_0%,rgba(255,162,77,0.12),transparent_30%),radial-gradient(circle_at_80%_100%,rgba(61,111,255,0.12),transparent_34%)] [background-size:100%_100%,56px_56px,100%_100%,100%_100%]" />
      <button
        type="button"
        onClick={() => {
          gameAudio.resume();
          gameAudio.toggleMute();
        }}
        className="absolute right-2 top-2 z-30 flex h-11 w-11 items-center justify-center border-[3px] border-[#2c1a0f] bg-[rgba(18,10,6,0.88)] text-stone-100 shadow-[0_0_0_3px_rgba(0,0,0,0.18)] transition hover:-translate-y-0.5 sm:right-3 sm:top-3"
        style={{
          marginTop: "env(safe-area-inset-top, 0px)",
          marginRight: "env(safe-area-inset-right, 0px)",
        }}
        aria-label={audioMuted ? "开启音乐音效" : "静音音乐音效"}
      >
        {audioMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </button>
      <Battlefield
        runtime={gameState}
        onAim={aimAt}
        onChargeStart={handleChargeStart}
        onChargeEnd={stopCharge}
        onChargeCancel={cancelShotCharge}
      />

      {phase === "idle" ? (
        <HomeOverlay
          bestScore={gameState.bestScore}
          bestCombo={gameState.bestCombo}
          bestTimeMs={gameState.bestTimeMs}
          onStart={handleStartGame}
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
          onRestart={handleRestartGame}
          onReturnHome={handleReturnHome}
        />
      ) : null}
    </main>
  );
}
