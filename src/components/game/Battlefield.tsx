import { Keyboard, MoveHorizontal, MousePointer2 } from "lucide-react";
import { useRef } from "react";

import {
  getSunVisual,
  type GameRuntime,
} from "@/utils/gameLoop";

interface BattlefieldProps {
  runtime: GameRuntime;
  onAim: (x: number, y?: number) => void;
  onChargeStart: () => void;
  onChargeEnd: () => void;
  onChargeCancel: () => void;
}

const pixelTrees = [
  { left: 2, bottom: 24, scale: 0.84 },
  { left: 8, bottom: 27, scale: 0.96 },
  { left: 14, bottom: 25, scale: 0.9 },
  { left: 20, bottom: 29, scale: 1.08 },
  { left: 27, bottom: 26, scale: 0.98 },
  { left: 33, bottom: 24, scale: 0.86 },
  { left: 64, bottom: 24, scale: 0.88 },
  { left: 71, bottom: 28, scale: 1.02 },
  { left: 78, bottom: 25, scale: 0.92 },
  { left: 84, bottom: 29, scale: 1.1 },
  { left: 90, bottom: 26, scale: 0.96 },
  { left: 96, bottom: 24, scale: 0.84 },
];

const pixelBushes = [
  { left: 12, bottom: 18, scale: 0.82 },
  { left: 24, bottom: 17, scale: 1.08 },
  { left: 67, bottom: 18, scale: 0.92 },
  { left: 81, bottom: 16, scale: 1.14 },
];

const pixelRocks = [
  { left: 6, bottom: 10, scale: 0.88 },
  { left: 31, bottom: 9, scale: 1.08 },
  { left: 61, bottom: 10, scale: 0.94 },
  { left: 89, bottom: 8, scale: 1.18 },
];

const pixelFlowers = [
  { left: 16, bottom: 10, scale: 0.9, petal: "#ff8dd8" },
  { left: 28, bottom: 9, scale: 0.82, petal: "#ffd86e" },
  { left: 73, bottom: 9, scale: 0.88, petal: "#ffb36b" },
  { left: 84, bottom: 10, scale: 0.96, petal: "#c29bff" },
];

const pixelBirds = [
  { left: 8, top: 17, scale: 1.15, duration: "18s", delay: "-2s" },
  { left: 26, top: 21, scale: 1.25, duration: "24s", delay: "-6s" },
  { left: 46, top: 19, scale: 1.35, duration: "22s", delay: "-10s" },
  { left: 66, top: 15, scale: 1.1, duration: "20s", delay: "-14s" },
  { left: 82, top: 22, scale: 1.2, duration: "23s", delay: "-17s" },
];

const pixelCats = [
  { left: 14, bottom: 8, scale: 1.18, duration: "16s", delay: "-4s" },
  { left: 36, bottom: 7, scale: 1.08, duration: "18s", delay: "-8s" },
  { left: 68, bottom: 8, scale: 1.14, duration: "19s", delay: "-11s" },
  { left: 86, bottom: 7, scale: 1.06, duration: "21s", delay: "-15s" },
];

const pixelSeagulls = [
  { left: 14, top: 10, scale: 1.05, duration: "26s", delay: "-3s" },
  { left: 58, top: 8, scale: 1.12, duration: "28s", delay: "-13s" },
  { left: 84, top: 12, scale: 0.98, duration: "24s", delay: "-18s" },
];

const pixelSheep = [
  { left: 10, bottom: 7, scale: 1.04, duration: "23s", delay: "-5s" },
  { left: 56, bottom: 6, scale: 0.98, duration: "26s", delay: "-12s" },
  { left: 90, bottom: 7, scale: 1.02, duration: "22s", delay: "-17s" },
];

const pixelDeer = [
  { left: 28, bottom: 7, scale: 1.12, duration: "24s", delay: "-9s" },
  { left: 74, bottom: 6, scale: 1.08, duration: "27s", delay: "-15s" },
];

const pixelMonkeys = [
  { left: 22, bottom: 24, scale: 0.94, duration: "18s", delay: "-6s" },
  { left: 79, bottom: 23, scale: 0.9, duration: "20s", delay: "-14s" },
];

function getDecorScale(scale: number) {
  return `scale(calc(${scale} * var(--decor-scale)))`;
}

function getUltramanAnchor(runtime: Pick<GameRuntime, "playerX" | "playerY">) {
  return {
    x: Math.min(28, Math.max(12, runtime.playerX - 17)),
    y: Math.min(76, Math.max(28, runtime.playerY - 10)),
  };
}

function getWukongAnchor(runtime: Pick<GameRuntime, "playerX" | "playerY" | "elapsedMs">) {
  return {
    x: Math.min(92, Math.max(12, runtime.playerX + 10 + Math.sin(runtime.elapsedMs * 0.008) * 1.4)),
    y: Math.min(82, Math.max(18, runtime.playerY - 8 + Math.cos(runtime.elapsedMs * 0.01) * 1.1)),
  };
}

const WUKONG_GUARD_TOTAL_MS = 10000;
const WUKONG_ENTRY_DURATION_MS = 520;

export default function Battlefield({
  runtime,
  onAim,
  onChargeStart,
  onChargeEnd,
  onChargeCancel,
}: BattlefieldProps) {
  const battlefieldRef = useRef<HTMLDivElement>(null);
  const sunVisual = getSunVisual(runtime);
  const canInteract = runtime.phase === "playing";
  const isWorldFrozen = runtime.freezeWorldMs > 0;
  const isSunAngry = runtime.sunStage >= 2;
  const isSunFurious = runtime.sunStage >= 3;
  const ultramanAnchor = getUltramanAnchor(runtime);
  const wukongAnchor = getWukongAnchor(runtime);
  const isUltramanEntering = runtime.ultramanEntryMs > 0;
  const ultramanEntryProgress = isUltramanEntering ? 1 - runtime.ultramanEntryMs / 960 : 1;
  const isWukongGuarding = runtime.wukongGuardMs > 0;
  const wukongGuardProgress = isWukongGuarding ? runtime.wukongGuardMs / WUKONG_GUARD_TOTAL_MS : 0;
  const isWukongEntering = isWukongGuarding && runtime.wukongGuardMs > WUKONG_GUARD_TOTAL_MS - WUKONG_ENTRY_DURATION_MS;
  const wukongEntryProgress = isWukongEntering
    ? Math.min(1, (WUKONG_GUARD_TOTAL_MS - runtime.wukongGuardMs) / WUKONG_ENTRY_DURATION_MS)
    : 1;
  const shakeOffset = runtime.screenShakeMs > 0 ? Math.sin(runtime.elapsedMs / 18) * 4.5 : 0;
  const flashOpacity = runtime.impactMs > 0 ? Math.min(0.45, runtime.impactMs / 480) : 0;
  const bowPull = runtime.isCharging ? 10 + runtime.charge * 0.14 : 5;

  const handlePointerPosition = (clientX: number, clientY: number) => {
    const bounds = battlefieldRef.current?.getBoundingClientRect();

    if (!bounds) {
      return;
    }

    const nextX = ((clientX - bounds.left) / bounds.width) * 100;
    const nextY = ((clientY - bounds.top) / bounds.height) * 100;

    onAim(nextX, nextY);
  };

  return (
    <div
      className="absolute inset-0 p-2 sm:p-3 md:p-5"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.5rem)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 0.5rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.5rem)",
      }}
    >
      <div
        ref={battlefieldRef}
        data-testid="battlefield"
        className="battlefield-stage relative h-full overflow-hidden border-[4px] border-[#1c1008] bg-[#050814] shadow-[0_0_0_4px_rgba(92,58,28,0.45)]"
        style={{
          transform: `translate3d(${shakeOffset}px, 0, 0)`,
          touchAction: "none",
        }}
        onPointerMove={(event) => {
          if (!canInteract) {
            return;
          }

          handlePointerPosition(event.clientX, event.clientY);
        }}
        onPointerDown={(event) => {
          if (!canInteract) {
            return;
          }

          handlePointerPosition(event.clientX, event.clientY);
          onChargeStart();
        }}
        onPointerUp={() => {
          if (!canInteract) {
            return;
          }

          onChargeEnd();
        }}
        onPointerLeave={() => {
          if (!canInteract) {
            return;
          }

          onChargeCancel();
        }}
      >
        <div className="battlefield-sky absolute inset-0" />
        <div className="absolute inset-0 opacity-35 [background-image:linear-gradient(rgba(255,255,255,0.05)_0_2px,transparent_2px),linear-gradient(90deg,rgba(0,0,0,0.08)_0_2px,transparent_2px)] [background-size:48px_48px]" />
        <div className="solar-noise absolute inset-0 opacity-45" />
        <div className="heat-veil absolute inset-x-0 top-0 h-[58%] opacity-75" />
        <div className="battlefield-ground absolute inset-x-0 bottom-0 h-[32%]" />

        <div className="pointer-events-none absolute inset-0 opacity-90">
          {pixelBirds.map((bird, index) => (
            <div
              key={`bird-${index}`}
              className="absolute"
              style={{
                left: `${bird.left}%`,
                top: `${bird.top}%`,
                transform: getDecorScale(bird.scale),
                transformOrigin: "center",
              }}
            >
              <div
                className="pixel-bird relative"
                style={{
                  animationDuration: bird.duration,
                  animationDelay: bird.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-6 w-8">
                  <div className="absolute left-0 top-2 h-2 w-3 bg-[#dfe8f2]" />
                  <div className="absolute left-2 top-1 h-2 w-3 bg-[#f8fafc]" />
                  <div className="absolute right-1 top-2 h-2 w-3 bg-[#c3ceda]" />
                  <div className="absolute left-3 top-3 h-2 w-3 bg-[#7a8793]" />
                  <div className="absolute right-0 top-3 h-[2px] w-2 bg-[#f2b870]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-90">
          {pixelSeagulls.map((bird, index) => (
            <div
              key={`seagull-${index}`}
              className="absolute"
              style={{
                left: `${bird.left}%`,
                top: `${bird.top}%`,
                transform: getDecorScale(bird.scale),
                transformOrigin: "center",
              }}
            >
              <div
                className="pixel-seagull relative"
                style={{
                  animationDuration: bird.duration,
                  animationDelay: bird.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-7 w-10">
                  <div className="absolute left-0 top-3 h-[2px] w-4 bg-[#f8fafc]" />
                  <div className="absolute left-2 top-2 h-[2px] w-5 bg-[#ffffff]" />
                  <div className="absolute right-1 top-3 h-[2px] w-4 bg-[#dce6ef]" />
                  <div className="absolute left-4 top-4 h-[2px] w-2 bg-[#6f7d8b]" />
                  <div className="absolute right-0 top-4 h-[2px] w-2 bg-[#f2c97d]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[20%] h-[24%] opacity-100">
          {pixelTrees.map((tree, index) => (
            <div
              key={`tree-${index}`}
              className="absolute"
              style={{
                left: `${tree.left}%`,
                bottom: `${tree.bottom}%`,
                transform: getDecorScale(tree.scale),
                transformOrigin: "bottom center",
              }}
            >
              <div className="relative h-28 w-24">
                <div className="absolute bottom-0 left-1/2 h-14 w-7 -translate-x-1/2 border-[2px] border-[#2b1508] bg-[#6f4420]" />
                <div className="absolute bottom-0 left-1/2 h-14 w-2 -translate-x-[1.05rem] bg-[#8b5a31]" />
                <div className="absolute bottom-0 right-1/2 h-14 w-2 translate-x-[1.05rem] bg-[#4d2d14]" />
                <div className="absolute bottom-10 left-1/2 h-5 w-3 -translate-x-[1.3rem] bg-[#8b5a31]" />
                <div className="absolute bottom-10 right-1/2 h-5 w-3 translate-x-[1.3rem] bg-[#4d2d14]" />

                <div className="absolute bottom-11 left-0 h-5 w-24 border-[2px] border-[#163111] bg-[#1d4118]" />
                <div className="absolute bottom-16 left-0 h-5 w-24 border-[2px] border-[#163111] bg-[#244e1c]" />
                <div className="absolute bottom-21 left-0 h-5 w-24 border-[2px] border-[#163111] bg-[#2d6122]" />
                <div className="absolute bottom-26 left-1 h-5 w-22 border-[2px] border-[#163111] bg-[#376f28]" />
                <div className="absolute bottom-31 left-2 h-5 w-20 border-[2px] border-[#163111] bg-[#42842f]" />
                <div className="absolute bottom-36 left-4 h-5 w-16 border-[2px] border-[#163111] bg-[#58a33c]" />
                <div className="absolute bottom-16 left-[-0.3rem] h-14 w-5 border-[2px] border-[#163111] bg-[#244e1c]" />
                <div className="absolute bottom-16 right-[-0.3rem] h-14 w-5 border-[2px] border-[#163111] bg-[#244e1c]" />
                <div className="absolute bottom-21 left-[0.2rem] h-10 w-5 border-[2px] border-[#163111] bg-[#2f6624]" />
                <div className="absolute bottom-21 right-[0.2rem] h-10 w-5 border-[2px] border-[#163111] bg-[#2f6624]" />
                <div className="absolute bottom-26 left-[0.7rem] h-8 w-4 border-[2px] border-[#163111] bg-[#3d7b2d]" />
                <div className="absolute bottom-26 right-[0.7rem] h-8 w-4 border-[2px] border-[#163111] bg-[#3d7b2d]" />
                <div className="absolute bottom-18 left-4 h-3 w-5 bg-white/10" />
                <div className="absolute bottom-24 right-4 h-3 w-5 bg-black/10" />
                <div className="absolute bottom-33 left-8 h-2 w-4 bg-white/10" />
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[20%] h-[10%] opacity-95">
          {pixelMonkeys.map((monkey, index) => (
            <div
              key={`monkey-${index}`}
              className="absolute"
              style={{
                left: `${monkey.left}%`,
                bottom: `${monkey.bottom}%`,
                transform: getDecorScale(monkey.scale),
                transformOrigin: "center bottom",
              }}
            >
              <div
                className="pixel-monkey relative"
                style={{
                  animationDuration: monkey.duration,
                  animationDelay: monkey.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-10 w-10">
                  <div className="absolute bottom-2 left-2 h-5 w-5 bg-[#6c4728]" />
                  <div className="absolute bottom-5 left-4 h-3 w-3 bg-[#7d5530]" />
                  <div className="absolute bottom-6 left-5 h-1 w-1 bg-[#f4dfbf]" />
                  <div className="absolute bottom-1 left-1 h-2 w-1 bg-[#6c4728]" />
                  <div className="absolute bottom-1 left-6 h-2 w-1 bg-[#6c4728]" />
                  <div className="absolute bottom-4 right-0 h-1 w-4 bg-[#6c4728]" />
                  <div className="absolute bottom-3 right-3 h-1 w-3 bg-[#6c4728]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[7%] h-[10%] opacity-95">
          {pixelBushes.map((bush, index) => (
            <div
              key={`bush-${index}`}
              className="absolute"
              style={{
                left: `${bush.left}%`,
                bottom: `${bush.bottom}%`,
                transform: getDecorScale(bush.scale),
                transformOrigin: "bottom center",
              }}
            >
              <div className="relative h-10 w-16">
                <div className="absolute bottom-0 left-0 h-4 w-6 border-[2px] border-[#163111] bg-[#2f6a24]" />
                <div className="absolute bottom-1 left-4 h-5 w-6 border-[2px] border-[#163111] bg-[#4d9336]" />
                <div className="absolute bottom-0 right-0 h-4 w-7 border-[2px] border-[#163111] bg-[#397a2b]" />
                <div className="absolute bottom-[1.2rem] left-5 h-3 w-5 border-[2px] border-[#163111] bg-[#67ad4a]" />
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[5%] h-[8%] opacity-95">
          {pixelRocks.map((rock, index) => (
            <div
              key={`rock-${index}`}
              className="absolute"
              style={{
                left: `${rock.left}%`,
                bottom: `${rock.bottom}%`,
                transform: getDecorScale(rock.scale),
                transformOrigin: "bottom center",
              }}
            >
              <div className="relative h-8 w-14">
                <div className="absolute bottom-0 left-0 h-4 w-6 border-[2px] border-[#262626] bg-[#7d858f]" />
                <div className="absolute bottom-0 left-4 h-5 w-5 border-[2px] border-[#262626] bg-[#9aa1aa]" />
                <div className="absolute bottom-0 right-0 h-4 w-6 border-[2px] border-[#262626] bg-[#676f79]" />
                <div className="absolute bottom-3 left-3 h-2 w-3 bg-white/25" />
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[6%] h-[8%] opacity-95">
          {pixelFlowers.map((flower, index) => (
            <div
              key={`flower-${index}`}
              className="absolute"
              style={{
                left: `${flower.left}%`,
                bottom: `${flower.bottom}%`,
                transform: getDecorScale(flower.scale),
                transformOrigin: "bottom center",
              }}
            >
              <div className="relative h-9 w-8">
                <div className="absolute bottom-0 left-1/2 h-5 w-[3px] -translate-x-1/2 bg-[#2d6f27]" />
                <div className="absolute bottom-2 left-[20%] h-2 w-2 bg-[#4f9d39]" />
                <div className="absolute bottom-2 right-[20%] h-2 w-2 bg-[#4f9d39]" />
                <div className="absolute bottom-5 left-1/2 h-2 w-2 -translate-x-1/2 bg-[#fff2b8]" />
                <div className="absolute bottom-6 left-[18%] h-2 w-2" style={{ backgroundColor: flower.petal }} />
                <div className="absolute bottom-6 right-[18%] h-2 w-2" style={{ backgroundColor: flower.petal }} />
                <div className="absolute bottom-4 left-[28%] h-2 w-2" style={{ backgroundColor: flower.petal }} />
                <div className="absolute bottom-4 right-[28%] h-2 w-2" style={{ backgroundColor: flower.petal }} />
              </div>
            </div>
          ))}
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-[4%] h-[10%] opacity-95">
          {pixelSheep.map((sheep, index) => (
            <div
              key={`sheep-${index}`}
              className="absolute"
              style={{
                left: `${sheep.left}%`,
                bottom: `${sheep.bottom}%`,
                transform: getDecorScale(sheep.scale),
                transformOrigin: "center bottom",
              }}
            >
              <div
                className="pixel-sheep relative"
                style={{
                  animationDuration: sheep.duration,
                  animationDelay: sheep.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-9 w-14">
                  <div className="absolute bottom-2 left-3 h-4 w-8 bg-[#f6f3ea]" />
                  <div className="absolute bottom-3 left-1 h-3 w-4 bg-[#d9d2c4]" />
                  <div className="absolute bottom-4 left-5 h-1 w-1 bg-white/70" />
                  <div className="absolute bottom-0 left-4 h-2 w-1 bg-[#4c3a29]" />
                  <div className="absolute bottom-0 left-7 h-2 w-1 bg-[#4c3a29]" />
                  <div className="absolute bottom-0 left-10 h-2 w-1 bg-[#4c3a29]" />
                  <div className="absolute bottom-0 left-12 h-2 w-1 bg-[#4c3a29]" />
                </div>
              </div>
            </div>
          ))}

          {pixelDeer.map((deer, index) => (
            <div
              key={`deer-${index}`}
              className="absolute"
              style={{
                left: `${deer.left}%`,
                bottom: `${deer.bottom}%`,
                transform: getDecorScale(deer.scale),
                transformOrigin: "center bottom",
              }}
            >
              <div
                className="pixel-deer relative"
                style={{
                  animationDuration: deer.duration,
                  animationDelay: deer.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-10 w-16">
                  <div className="absolute bottom-2 left-4 h-4 w-8 bg-[#b97a45]" />
                  <div className="absolute bottom-4 left-1 h-4 w-4 bg-[#c68954]" />
                  <div className="absolute bottom-7 left-2 h-3 w-1 bg-[#f2d4a7]" />
                  <div className="absolute bottom-7 left-4 h-3 w-1 bg-[#f2d4a7]" />
                  <div className="absolute bottom-5 left-8 h-1 w-1 bg-white/30" />
                  <div className="absolute bottom-0 left-5 h-2 w-1 bg-[#6c4728]" />
                  <div className="absolute bottom-0 left-8 h-2 w-1 bg-[#6c4728]" />
                  <div className="absolute bottom-0 left-10 h-2 w-1 bg-[#6c4728]" />
                  <div className="absolute bottom-0 left-13 h-2 w-1 bg-[#6c4728]" />
                </div>
              </div>
            </div>
          ))}

          {pixelCats.map((cat, index) => (
            <div
              key={`cat-${index}`}
              className="absolute"
              style={{
                left: `${cat.left}%`,
                bottom: `${cat.bottom}%`,
                transform: getDecorScale(cat.scale),
                transformOrigin: "center bottom",
              }}
            >
              <div
                className="pixel-cat relative"
                style={{
                  animationDuration: cat.duration,
                  animationDelay: cat.delay,
                  animationPlayState: isWorldFrozen ? "paused" : "running",
                }}
              >
                <div className="relative h-9 w-14">
                  <div className="absolute bottom-1 left-3 h-4 w-8 bg-[#2f3138]" />
                  <div className="absolute bottom-3 left-1 h-4 w-4 bg-[#3d4048]" />
                  <div className="absolute bottom-5 left-1 h-2 w-1 bg-[#3d4048]" />
                  <div className="absolute bottom-5 left-4 h-2 w-1 bg-[#3d4048]" />
                  <div className="absolute bottom-2 left-4 h-1 w-1 bg-[#f5e7d1]" />
                  <div className="absolute bottom-0 left-4 h-2 w-1 bg-[#2f3138]" />
                  <div className="absolute bottom-0 left-8 h-2 w-1 bg-[#2f3138]" />
                  <div className="absolute bottom-0 left-10 h-2 w-1 bg-[#2f3138]" />
                  <div className="absolute bottom-0 left-2 h-2 w-1 bg-[#2f3138]" />
                  <div className="absolute bottom-4 right-0 h-1 w-5 bg-[#2f3138]" />
                  <div className="absolute bottom-5 right-4 h-1 w-3 bg-[#3d4048]" />
                </div>
              </div>
            </div>
          ))}
        </div>

        <div
          className="solar-core absolute aspect-square transition-transform duration-200"
          style={{
            left: `${sunVisual.x}%`,
            top: `${sunVisual.y}%`,
            width: `${sunVisual.radius * 2}%`,
            transform: "translate(-50%, -50%)",
            filter: isWorldFrozen ? "saturate(0.82) brightness(1.08)" : undefined,
          }}
        >
          {isSunAngry ? (
            <>
              <div
                className="solar-uv-ring absolute inset-[-30%]"
                style={{ animationPlayState: isWorldFrozen ? "paused" : "running" }}
              />
              {[0, 60, 120].map((angle) => (
                <div
                  key={`uv-${angle}`}
                  className="solar-uv-beam absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    animationPlayState: isWorldFrozen ? "paused" : "running",
                  }}
                />
              ))}
            </>
          ) : null}
          {isSunFurious ? (
            <>
              {[0, 1, 2, 3, 4, 5].map((flame) => (
                <div
                  key={`flame-${flame}`}
                  className="solar-flame absolute left-1/2 top-1/2"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${flame * 60}deg)`,
                    animationPlayState: isWorldFrozen ? "paused" : "running",
                  }}
                />
              ))}
            </>
          ) : null}
          <div className="absolute inset-[-18%] border-[3px] border-amber-100/20" />
          <div className="absolute inset-[12%] border-[3px] border-white/10" />
          {runtime.sunShieldMs > 0 ? (
            <div
              className="absolute inset-[-30%] border-[3px] border-cyan-200/35 animate-ping"
              style={{ animationPlayState: isWorldFrozen ? "paused" : "running" }}
            />
          ) : null}
          {isWorldFrozen ? (
            <>
              <div className="absolute inset-[-14%] border-[3px] border-sky-100/45 shadow-[0_0_22px_rgba(180,230,255,0.35)]" />
              <div className="absolute inset-[18%] bg-sky-100/12" />
            </>
          ) : null}
          <div className="absolute inset-[24%] bg-white/30 blur-md" />
          <div className="absolute bottom-[18%] left-[18%] h-[18%] w-[24%] bg-[#381500]/45" />
          <div className="absolute right-[18%] top-[28%] h-[16%] w-[18%] bg-[#5c1400]/55" />
        </div>

        {runtime.projectiles.map((projectile) => {
          const arrowScale = Math.max(0.92, projectile.radius * 0.28);
          const glowWidth = 1.1 + arrowScale * 0.9;
          const glowHeight = 3.4 + arrowScale * 1.6;
          const shaftWidth = 0.18 + arrowScale * 0.08;
          const shaftHeight = 2.2 + arrowScale * 1.6;
          const headSize = 0.52 + arrowScale * 0.22;
          const featherSize = 0.42 + arrowScale * 0.18;

          return (
            <div
              key={projectile.id}
              className="absolute"
              style={{
                left: `${projectile.x}%`,
                top: `${projectile.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
            <div
              className="absolute left-1/2 top-1/2 bg-cyan-100/35 blur-md"
                style={{
                  width: `${glowWidth}rem`,
                  height: `${glowHeight}rem`,
                  transform: "translate(-50%, -50%)",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 bg-gradient-to-t from-cyan-200/0 via-cyan-100/65 to-white/95"
                style={{
                  width: `${shaftWidth * 2.6}rem`,
                  height: `${shaftHeight + 1.4}rem`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 18px rgba(190,236,255,0.65)",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 bg-gradient-to-t from-[#785225] via-[#cba968] to-[#fff3c7]"
                style={{
                  width: `${shaftWidth}rem`,
                  height: `${shaftHeight}rem`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 10px rgba(255,231,184,0.45)",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-b-amber-50"
                style={{
                  borderLeftWidth: `${headSize * 0.52}rem`,
                  borderRightWidth: `${headSize * 0.52}rem`,
                  borderBottomWidth: `${headSize}rem`,
                  transform: `translate(-50%, calc(-50% - ${shaftHeight / 2 + headSize * 0.68}rem))`,
                  filter: "drop-shadow(0 0 12px rgba(255,240,186,0.9))",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-t-cyan-100/90"
                style={{
                  borderLeftWidth: `${featherSize * 0.68}rem`,
                  borderRightWidth: `${featherSize * 0.68}rem`,
                  borderTopWidth: `${featherSize}rem`,
                  transform: `translate(calc(-50% - ${featherSize * 0.3}rem), calc(-50% + ${shaftHeight / 2 - 0.02}rem)) rotate(18deg)`,
                  filter: "drop-shadow(0 0 10px rgba(168,229,255,0.78))",
                }}
              />
              <div
                className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-t-cyan-100/90"
                style={{
                  borderLeftWidth: `${featherSize * 0.68}rem`,
                  borderRightWidth: `${featherSize * 0.68}rem`,
                  borderTopWidth: `${featherSize}rem`,
                  transform: `translate(calc(-50% + ${featherSize * 0.3}rem), calc(-50% + ${shaftHeight / 2 - 0.02}rem)) rotate(-18deg)`,
                  filter: "drop-shadow(0 0 10px rgba(168,229,255,0.78))",
                }}
              />
            </div>
          );
        })}

        {runtime.sunDrops.map((drop) => (
          <div
            key={drop.id}
            className="absolute border-[3px] border-amber-50/55 bg-gradient-to-br from-amber-100 via-orange-300 to-red-700 shadow-[0_0_22px_rgba(255,164,77,0.7)]"
            style={{
              left: `${drop.x}%`,
              top: `${drop.y}%`,
              width: `${drop.radius * 1.9}%`,
              height: `${drop.radius * 1.9}%`,
              transform: `translate(-50%, -50%) rotate(${drop.spin}rad)`,
            }}
          >
            <div className="absolute inset-[-20%] bg-orange-300/18 blur-md" />
            <div className="absolute left-1/2 top-1/2 h-[160%] w-[60%] -translate-x-1/2 -translate-y-[10%] bg-gradient-to-b from-amber-100/0 via-orange-300/40 to-red-600/0 blur-[2px]" />
            <div className="absolute inset-[22%] bg-white/70" />
          </div>
        ))}

        {runtime.skillPacks.map((pack) => (
          <div
            key={pack.id}
            className="absolute"
            style={{
              left: `${pack.x}%`,
              top: `${pack.y}%`,
              transform: `translate(-50%, -50%) rotate(${pack.spin}rad)`,
            }}
          >
            <div
              className={`absolute inset-[-18%] blur-md ${
                pack.kind === "speed"
                  ? "bg-cyan-300/25"
                  : pack.kind === "double"
                    ? "bg-fuchsia-300/25"
                    : pack.kind === "freeze"
                      ? "bg-sky-200/30"
                      : pack.kind === "wukong"
                        ? "bg-amber-300/30"
                        : "bg-red-300/30"
              }`}
            />
            <div
              className={`relative flex h-8 w-8 items-center justify-center border-[3px] shadow-[0_0_24px_rgba(255,255,255,0.12)] ${
                pack.kind === "speed"
                  ? "border-cyan-100/55 bg-gradient-to-br from-cyan-100 via-sky-300 to-blue-600"
                  : pack.kind === "double"
                    ? "border-fuchsia-100/55 bg-gradient-to-br from-amber-100 via-fuchsia-300 to-violet-700"
                    : pack.kind === "freeze"
                      ? "border-sky-100/60 bg-gradient-to-br from-white via-sky-200 to-cyan-500"
                      : pack.kind === "wukong"
                        ? "border-amber-100/60 bg-gradient-to-br from-amber-50 via-amber-300 to-orange-600"
                        : "border-red-100/60 bg-gradient-to-br from-white via-stone-200 to-red-500"
              }`}
            >
              <div className="absolute inset-[18%] border-[2px] border-white/25" />
              {pack.kind === "freeze" ? (
                <>
                  <div className="absolute h-[2px] w-4 rounded-full bg-white/95" />
                  <div className="absolute h-4 w-[2px] rounded-full bg-white/95" />
                  <div className="absolute h-[2px] w-4 rotate-45 rounded-full bg-sky-50/90" />
                  <div className="absolute h-[2px] w-4 -rotate-45 rounded-full bg-sky-50/90" />
                </>
              ) : pack.kind === "wukong" ? (
                <>
                  <div className="absolute top-[16%] h-2.5 w-2.5 border-[2px] border-amber-100/70 bg-[#f5d2a1]" />
                  <div className="absolute top-[36%] h-3.5 w-4 border-[2px] border-[#8a2f1c] bg-[#cf4930]" />
                  <div className="absolute bottom-[18%] left-[24%] h-[2px] w-5 rotate-[62deg] bg-[#f5d26f]" />
                  <div className="absolute bottom-[14%] left-[18%] h-[2px] w-6 rotate-[62deg] bg-[#8b5d17]" />
                  <div className="absolute top-[42%] left-[18%] h-[2px] w-2 rotate-[16deg] bg-amber-50/90" />
                  <div className="absolute top-[42%] right-[18%] h-[2px] w-2 -rotate-[16deg] bg-amber-50/90" />
                </>
              ) : pack.kind === "ultraman" ? (
                <>
                  <div className="absolute top-[18%] h-2.5 w-2.5 border-[2px] border-white/70 bg-[#eef2f7]" />
                  <div className="absolute bottom-[16%] h-3.5 w-4 border-[2px] border-white/40 bg-[#d62227]" />
                  <div className="absolute top-[38%] h-[2px] w-5 bg-cyan-100/95" />
                  <div className="absolute bottom-[22%] left-[24%] h-[2px] w-2 rotate-45 bg-white/80" />
                  <div className="absolute bottom-[22%] right-[24%] h-[2px] w-2 -rotate-45 bg-white/80" />
                </>
              ) : (
                <>
                  <div
                    className={`absolute h-[2px] w-4 rounded-full ${
                      pack.kind === "speed" ? "bg-white" : "bg-amber-50"
                    }`}
                  />
                  <div
                    className={`absolute h-4 w-[2px] rounded-full ${
                      pack.kind === "speed" ? "bg-white/85" : "bg-amber-50/85"
                    } ${pack.kind === "double" ? "" : "hidden"}`}
                  />
                </>
              )}
            </div>
          </div>
        ))}

        {runtime.enemyProjectiles.map((projectile) => {
          const monsterSize = projectile.pattern === "pulse" ? 2.8 + projectile.radius * 0.38 : 2.2 + projectile.radius * 0.32;
          const glowSize = monsterSize * (projectile.pattern === "pulse" ? 1.6 : 1.35);
          const isSplitBurst = projectile.id.includes("clone") && projectile.ageMs < 220;
          const burstOpacity = Math.max(0.22, 1 - projectile.ageMs / 220);
          const uvAngle = Math.atan2(projectile.vy, projectile.vx) + Math.PI / 2;

          return (
            <div
              key={projectile.id}
              className="absolute"
              style={{
                left: `${projectile.x}%`,
                top: `${projectile.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {isSplitBurst ? (
                <div
                  className="enemy-split-burst absolute left-1/2 top-1/2"
                  style={{
                    opacity: burstOpacity,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div className="enemy-split-ring" />
                  <div className="enemy-split-core" />
                  {[0, 45, 90, 135].map((angle) => (
                    <div
                      key={`${projectile.id}-burst-${angle}`}
                      className="enemy-split-shard"
                      style={{
                        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                      }}
                    />
                  ))}
                </div>
              ) : null}
              {projectile.pattern === "uv" ? (
                <>
                  <div
                    className="absolute left-1/2 top-1/2 bg-violet-200/40 blur-md"
                    style={{
                      width: "1.1rem",
                      height: "3.8rem",
                      transform: `translate(-50%, -50%) rotate(${uvAngle}rad)`,
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 bg-gradient-to-t from-[#5b1ef1] via-[#b16cff] to-[#f6e4ff]"
                    style={{
                      width: "0.28rem",
                      height: "2.6rem",
                      transform: `translate(-50%, -50%) rotate(${uvAngle}rad)`,
                      boxShadow: "0 0 14px rgba(181,108,255,0.7)",
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-b-violet-50"
                    style={{
                      borderLeftWidth: "0.28rem",
                      borderRightWidth: "0.28rem",
                      borderBottomWidth: "0.72rem",
                      transform: `translate(-50%, calc(-50% - 1.55rem)) rotate(${uvAngle}rad)`,
                      filter: "drop-shadow(0 0 10px rgba(233,217,255,0.95))",
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-t-violet-200/85"
                    style={{
                      borderLeftWidth: "0.24rem",
                      borderRightWidth: "0.24rem",
                      borderTopWidth: "0.56rem",
                      transform: `translate(calc(-50% - 0.14rem), calc(-50% + 1.08rem)) rotate(${uvAngle + 0.34}rad)`,
                    }}
                  />
                  <div
                    className="absolute left-1/2 top-1/2 h-0 w-0 border-l-transparent border-r-transparent border-t-violet-200/85"
                    style={{
                      borderLeftWidth: "0.24rem",
                      borderRightWidth: "0.24rem",
                      borderTopWidth: "0.56rem",
                      transform: `translate(calc(-50% + 0.14rem), calc(-50% + 1.08rem)) rotate(${uvAngle - 0.34}rad)`,
                    }}
                  />
                </>
              ) : null}
              {projectile.pattern !== "uv" ? (
                <>
                  <div
                    className={`absolute blur-sm ${
                      projectile.pattern === "pulse" ? "bg-lime-200/20" : "bg-orange-300/20"
                    }`}
                    style={{
                      width: `${glowSize}rem`,
                      height: `${glowSize}rem`,
                      transform: "translate(-50%, -50%)",
                      left: "50%",
                      top: "50%",
                    }}
                  />
                  <div
                    className={`relative border-[3px] ${
                      projectile.monster === "creeper"
                        ? "border-[#25481f] bg-[#58a33c]"
                        : projectile.monster === "zombie"
                          ? "border-[#355c33] bg-[#69a75e]"
                          : projectile.monster === "skeleton"
                            ? "border-[#7d8792] bg-[#dce5ed]"
                            : projectile.monster === "slime"
                              ? "border-[#4d8d2a] bg-[#8bdd52]"
                              : "border-[#3f2238] bg-[#6a3f63]"
                    }`}
                    style={{
                      width: `${monsterSize}rem`,
                      height: `${monsterSize}rem`,
                      boxShadow:
                        projectile.pattern === "pulse"
                          ? "0 0 20px rgba(153,255,119,0.35)"
                          : "0 0 18px rgba(255,140,76,0.28)",
                    }}
                  >
                    {projectile.monster === "creeper" ? (
                      <>
                        <div className="absolute left-[22%] top-[26%] h-[16%] w-[16%] bg-[#10230e]" />
                        <div className="absolute right-[22%] top-[26%] h-[16%] w-[16%] bg-[#10230e]" />
                        <div className="absolute left-[36%] top-[46%] h-[26%] w-[28%] bg-[#10230e]" />
                        <div className="absolute left-[28%] top-[58%] h-[20%] w-[16%] bg-[#10230e]" />
                        <div className="absolute right-[28%] top-[58%] h-[20%] w-[16%] bg-[#10230e]" />
                      </>
                    ) : null}
                    {projectile.monster === "zombie" ? (
                      <>
                        <div className="absolute left-[20%] top-[24%] h-[14%] w-[16%] bg-[#10230e]" />
                        <div className="absolute right-[20%] top-[24%] h-[14%] w-[16%] bg-[#10230e]" />
                        <div className="absolute left-[26%] top-[54%] h-[10%] w-[48%] bg-[#3c5d91]" />
                      </>
                    ) : null}
                    {projectile.monster === "skeleton" ? (
                      <>
                        <div className="absolute left-[20%] top-[24%] h-[14%] w-[14%] bg-[#49525c]" />
                        <div className="absolute right-[20%] top-[24%] h-[14%] w-[14%] bg-[#49525c]" />
                        <div className="absolute left-[24%] top-[50%] h-[8%] w-[52%] bg-[#7a838d]" />
                        <div className="absolute left-[48%] top-[58%] h-[16%] w-[4%] bg-[#7a838d]" />
                      </>
                    ) : null}
                    {projectile.monster === "slime" ? (
                      <>
                        <div className="absolute inset-[16%] bg-[#b6ff82]/30" />
                        <div className="absolute left-[22%] top-[38%] h-[12%] w-[12%] bg-[#244a13]" />
                        <div className="absolute right-[22%] top-[38%] h-[12%] w-[12%] bg-[#244a13]" />
                        <div className="absolute left-[32%] top-[58%] h-[8%] w-[36%] bg-[#244a13]" />
                      </>
                    ) : null}
                    {projectile.monster === "spider" ? (
                      <>
                        <div className="absolute inset-[20%] bg-[#2a1628]" />
                        <div className="absolute left-[20%] top-[32%] h-[12%] w-[12%] bg-[#f04455]" />
                        <div className="absolute right-[20%] top-[32%] h-[12%] w-[12%] bg-[#f04455]" />
                        <div className="absolute left-[-18%] top-[48%] h-[8%] w-[24%] bg-[#2a1628]" />
                        <div className="absolute right-[-18%] top-[48%] h-[8%] w-[24%] bg-[#2a1628]" />
                      </>
                    ) : null}
                  </div>
                </>
              ) : null}
            </div>
          );
        })}

        {runtime.enemyBursts.map((burst) => {
          const isGuardBurst = burst.variant === "wukong-guard";
          const burstTone = isGuardBurst
            ? { glow: "rgba(255, 211, 94, 0.9)", core: "#fff2a6", shard: "#d79418" }
            : burst.monster === "creeper"
              ? { glow: "rgba(112, 232, 88, 0.7)", core: "#9af77f", shard: "#4d9c36" }
              : burst.monster === "skeleton"
                ? { glow: "rgba(228, 238, 249, 0.78)", core: "#f8fbff", shard: "#aeb9c8" }
                : burst.monster === "slime"
                  ? { glow: "rgba(170, 255, 122, 0.68)", core: "#d5ffb2", shard: "#6bc13d" }
                  : burst.monster === "spider"
                    ? { glow: "rgba(255, 98, 142, 0.68)", core: "#ffbfd2", shard: "#8a365f" }
                    : { glow: "rgba(142, 198, 120, 0.68)", core: "#d7efcc", shard: "#58824f" };
          const burstOpacity = burst.ttlMs / (isGuardBurst ? 360 : 280);

          return (
            <div
              key={burst.id}
              className={`enemy-kill-burst absolute left-0 top-0 ${isGuardBurst ? "enemy-kill-burst-guard" : ""}`}
              style={{
                left: `${burst.x}%`,
                top: `${burst.y}%`,
                opacity: burstOpacity,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="enemy-kill-ring"
                style={{
                  borderColor: burstTone.core,
                  boxShadow: `0 0 14px ${burstTone.glow}, 0 0 28px ${burstTone.glow}`,
                }}
              />
              {isGuardBurst ? (
                <>
                  <div className="enemy-guard-flash" />
                  <div className="enemy-guard-cross" />
                </>
              ) : null}
              <div
                className="enemy-kill-core"
                style={{
                  background: burstTone.core,
                  boxShadow: `0 0 14px ${burstTone.glow}`,
                }}
              />
              {[0, 45, 90, 135].map((angle) => (
                <div
                  key={`${burst.id}-${angle}`}
                  className="enemy-kill-shard"
                  style={{
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                  }}
                >
                  <div
                    className="enemy-kill-shard-bar"
                    style={{
                      background: `linear-gradient(180deg, ${burstTone.core}, ${burstTone.shard}, transparent)`,
                      boxShadow: `0 0 12px ${burstTone.glow}`,
                    }}
                  />
                </div>
              ))}
            </div>
          );
        })}

        {runtime.scorePopups.map((popup) => (
          <div
            key={popup.id}
            className={`pointer-events-none absolute z-[3] -translate-x-1/2 -translate-y-1/2 font-ui uppercase tracking-[0.14em] ${
              popup.kind === "loot"
                ? "voxel-chip bg-amber-100/12 px-3 py-1 text-base text-amber-100 drop-shadow-[0_0_20px_rgba(255,210,114,0.85)] md:text-lg"
                : popup.kind === "buff"
                  ? "voxel-chip bg-cyan-100/12 px-3 py-1 text-sm text-cyan-50 drop-shadow-[0_0_22px_rgba(150,230,255,0.85)] md:text-base"
                  : "text-sm text-cyan-100 drop-shadow-[0_0_16px_rgba(150,230,255,0.7)]"
            }`}
            style={{
              left: `${popup.x}%`,
              top: `${popup.y}%`,
              opacity:
                popup.ttlMs /
                (popup.kind === "loot" ? 1180 : popup.kind === "buff" ? 1350 : 760),
              transform: `translate(-50%, -50%) scale(${
                popup.kind === "loot"
                  ? 1.12 + popup.ttlMs / 5200
                  : popup.kind === "buff"
                    ? 1.16 + popup.ttlMs / 6200
                    : 1 + popup.ttlMs / 7600
              })`,
            }}
          >
            {popup.label}
          </div>
        ))}

        {isWorldFrozen ? (
          <>
            <div className="pointer-events-none absolute inset-0 z-[1] bg-[linear-gradient(180deg,rgba(170,225,255,0.08),rgba(170,225,255,0.02))]" />
            <div className="pointer-events-none absolute right-4 top-4 z-[4] border-[3px] border-sky-100/45 bg-slate-950/45 px-3 py-2 font-pixel text-[0.54rem] uppercase tracking-[0.18em] text-sky-100 shadow-[0_0_18px_rgba(165,225,255,0.28)]">
              冰封世界
            </div>
          </>
        ) : null}

        {runtime.ultramanAssistMs > 0 ? (
          <div
            className="absolute z-[2]"
            style={{
              left: `${ultramanAnchor.x}%`,
              top: `${ultramanAnchor.y}%`,
              transform: `translate(-50%, -50%) scale(var(--player-scale)) translateY(${
                isUltramanEntering ? `${(1 - ultramanEntryProgress) * -6.5}rem` : "0rem"
              })`,
              opacity: runtime.freezeWorldMs > 0 ? 0.92 : 1,
            }}
          >
            <div className="absolute -inset-x-4 -bottom-1 h-3 bg-cyan-200/20 blur-md" />
            {isUltramanEntering ? (
              <>
                <div className="ultraman-entry-column absolute left-1/2 top-1/2 h-[14rem] w-[4.6rem] -translate-x-1/2 -translate-y-[72%]" />
                <div className="ultraman-entry-ring absolute left-1/2 top-[88%] h-12 w-16 -translate-x-1/2 -translate-y-1/2" />
              </>
            ) : null}
            <div className={`relative h-[6.2rem] w-[4.8rem] ${isUltramanEntering ? "ultraman-entry-body" : ""}`}>
              <div className="absolute left-1/2 top-[2%] h-5 w-5 -translate-x-1/2 border-[3px] border-slate-100/75 bg-gradient-to-b from-[#f6f9fc] via-[#d8dde4] to-[#a0a8b3]">
                <div className="absolute left-[18%] top-[36%] h-[2px] w-[2px] bg-cyan-200" />
                <div className="absolute right-[18%] top-[36%] h-[2px] w-[2px] bg-cyan-200" />
                <div className="absolute left-1/2 top-[-0.45rem] h-3 w-[3px] -translate-x-1/2 bg-gradient-to-t from-red-400 to-cyan-100" />
              </div>
              <div className="absolute left-1/2 top-[24%] h-8 w-9 -translate-x-1/2 border-[3px] border-slate-100/55 bg-gradient-to-b from-[#f2f4f7] via-[#c7cdd6] to-[#8a93a2]">
                <div className="absolute inset-x-[18%] top-[22%] h-[2px] bg-cyan-100/90" />
                <div className="absolute left-1/2 top-[42%] h-3.5 w-4 -translate-x-1/2 bg-[#d11c24]" />
              </div>
              <div className="absolute left-[8%] top-[34%] h-2 w-7 origin-right bg-gradient-to-r from-slate-100 to-[#9ca6b4]" style={{ transform: "rotate(-24deg)" }} />
              <div className="absolute right-[8%] top-[34%] h-2 w-7 origin-left bg-gradient-to-r from-slate-100 to-[#9ca6b4]" style={{ transform: "rotate(24deg)" }} />
              <div className="absolute left-[22%] top-[54%] h-8 w-2.5 bg-[#d11c24]" />
              <div className="absolute right-[22%] top-[54%] h-8 w-2.5 bg-[#d11c24]" />
              <div className="absolute left-[18%] top-[61%] h-2.5 w-3.5 border-[2px] border-slate-100/55 bg-[#eef2f7]" />
              <div className="absolute right-[18%] top-[61%] h-2.5 w-3.5 border-[2px] border-slate-100/55 bg-[#eef2f7]" />
            </div>
          </div>
        ) : null}

        {runtime.ultramanBeam ? (
          <div
            className="pointer-events-none absolute z-[3]"
            style={{
              left: `${runtime.ultramanBeam.fromX}%`,
              top: `${runtime.ultramanBeam.fromY}%`,
              width: `${Math.hypot(runtime.ultramanBeam.toX - runtime.ultramanBeam.fromX, runtime.ultramanBeam.toY - runtime.ultramanBeam.fromY)}%`,
              transform: `translateY(-50%) rotate(${Math.atan2(
                runtime.ultramanBeam.toY - runtime.ultramanBeam.fromY,
                runtime.ultramanBeam.toX - runtime.ultramanBeam.fromX,
              )}rad)`,
              transformOrigin: "left center",
              opacity: runtime.ultramanBeam.ttlMs / 220,
            }}
          >
            <div className="absolute left-0 top-1/2 h-7 w-full -translate-y-1/2 bg-cyan-200/45 blur-xl" />
            <div className="absolute left-0 top-1/2 h-4 w-full -translate-y-1/2 bg-cyan-100/65 blur-md" />
            <div className="absolute left-0 top-1/2 h-[10px] w-full -translate-y-1/2 bg-gradient-to-r from-[#87f6ff] via-white to-[#87f6ff]" />
            <div className="absolute left-0 top-1/2 h-[4px] w-full -translate-y-1/2 bg-white" />
            <div className="absolute right-[-0.7rem] top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-cyan-100/90 blur-[3px]" />
            <div className="absolute right-[-0.35rem] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full bg-white" />
          </div>
        ) : null}

        {isWukongGuarding ? (
          <>
            <div
              className="pointer-events-none absolute z-[3]"
              style={{
                left: `${runtime.playerX}%`,
                top: `${runtime.playerY}%`,
                transform: `translate(-50%, -50%) scale(${1 + (1 - wukongGuardProgress) * 0.08})`,
                opacity: 0.78 + wukongGuardProgress * 0.22,
              }}
            >
              <div className="wukong-guard-ring h-[7.2rem] w-[7.2rem]" />
              <div className="wukong-guard-ring-inner absolute left-1/2 top-1/2 h-[5.4rem] w-[5.4rem] -translate-x-1/2 -translate-y-1/2" />
              <div className="wukong-guard-flare absolute left-1/2 top-1/2 h-[8rem] w-[8rem] -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div
              className="absolute z-[3]"
              style={{
                left: `${wukongAnchor.x}%`,
                top: `${wukongAnchor.y}%`,
                transform: `translate(-50%, -50%) scale(var(--player-scale)) translateY(${
                  isWukongEntering ? `${(1 - wukongEntryProgress) * -4.8}rem` : "0rem"
                })`,
              }}
            >
              <div className="absolute -bottom-1 left-1/2 h-3 w-12 -translate-x-1/2 bg-amber-300/20 blur-md" />
              {isWukongEntering ? (
                <>
                  <div className="wukong-entry-column absolute left-1/2 top-1/2 h-[13.6rem] w-[4.8rem] -translate-x-1/2 -translate-y-[74%]" />
                  <div className="wukong-entry-ring absolute left-1/2 top-[87%] h-14 w-[4.9rem] -translate-x-1/2 -translate-y-1/2" />
                </>
              ) : null}
              <div className={`relative h-[5.9rem] w-[5.4rem] ${isWukongEntering ? "wukong-entry-body" : ""}`}>
                <div className="absolute left-1/2 top-[5%] h-4 w-4 -translate-x-1/2 border-[2px] border-amber-100/65 bg-[#f2d09e]">
                  <div className="absolute left-[20%] top-[34%] h-[2px] w-[2px] bg-[#4e2315]" />
                  <div className="absolute right-[20%] top-[34%] h-[2px] w-[2px] bg-[#4e2315]" />
                  <div className="absolute left-1/2 top-[-0.34rem] h-2.5 w-3 -translate-x-1/2 bg-[#d5a24c]" />
                </div>
                <div className="absolute left-1/2 top-[22%] h-9 w-9 -translate-x-1/2 rounded-full bg-amber-200/18 blur-md" />
                <div className="absolute left-1/2 top-[25%] h-7 w-7 -translate-x-1/2 border-[3px] border-[#892e1c] bg-gradient-to-b from-[#f0bc5f] via-[#da5d35] to-[#9b2f1c]" />
                <div className="absolute left-[16%] top-[36%] h-2 w-6 origin-right bg-[#d9b48a]" style={{ transform: "rotate(-28deg)" }} />
                <div className="absolute right-[14%] top-[36%] h-2 w-6 origin-left bg-[#d9b48a]" style={{ transform: "rotate(28deg)" }} />
                <div className="absolute left-[26%] top-[54%] h-8 w-2.5 bg-[#cf4930]" />
                <div className="absolute right-[26%] top-[54%] h-8 w-2.5 bg-[#cf4930]" />
                <div className="wukong-staff absolute left-1/2 top-1/2 h-[6.8rem] w-[0.42rem] -translate-x-1/2 -translate-y-1/2 bg-gradient-to-b from-[#f5d26f] via-[#c58d1c] to-[#8a5a14]">
                  <div className="absolute left-1/2 top-[-0.1rem] h-2 w-[0.7rem] -translate-x-1/2 bg-[#f9e49f]" />
                  <div className="absolute left-1/2 bottom-[-0.1rem] h-2 w-[0.7rem] -translate-x-1/2 bg-[#f9e49f]" />
                </div>
              </div>
            </div>
          </>
        ) : null}

        <div className="absolute inset-x-0 bottom-0 h-[38%] bg-[linear-gradient(180deg,rgba(255,119,51,0)_0%,rgba(255,119,51,0.08)_35%,rgba(255,141,54,0.18)_100%)]" />
        <div className="absolute inset-x-[8%] bottom-[8%] h-[3px] bg-gradient-to-r from-transparent via-amber-100/40 to-transparent" />

        <div
          className="battlefield-player absolute z-[2] transition-transform duration-75"
          style={{
            left: `${runtime.playerX}%`,
            top: `${runtime.playerY}%`,
            transform: `translate(-50%, -50%) scale(${runtime.isCharging ? "calc(var(--player-scale) * 1.03)" : "var(--player-scale)"})`,
          }}
        >
          <div className="absolute -top-12 left-1/2 h-10 w-24 -translate-x-1/2 bg-cyan-200/14 blur-xl" />
          <div className="hero-archer relative h-[7.2rem] w-[6.5rem]">
            <div className="hero-cloud absolute bottom-[0.15rem] left-1/2 h-9 w-26 -translate-x-1/2">
              <div className="absolute bottom-1 left-3 h-4 w-8 border-[2px] border-cyan-100/45 bg-[#eef8ff]" />
              <div className="absolute bottom-0 left-8 h-5 w-10 border-[2px] border-cyan-100/45 bg-[#f8fdff]" />
              <div className="absolute bottom-1 right-3 h-4 w-8 border-[2px] border-cyan-100/45 bg-[#eef8ff]" />
              <div className="absolute bottom-4 left-7 h-4 w-8 border-[2px] border-cyan-100/45 bg-[#ffffff]" />
              <div className="absolute bottom-3 right-7 h-4 w-8 border-[2px] border-cyan-100/45 bg-[#ffffff]" />
              <div className="absolute bottom-2 left-[40%] h-3 w-6 border-[2px] border-cyan-100/40 bg-[#d7f3ff]" />
              <div className="absolute bottom-[-0.1rem] left-5 h-[2px] w-16 bg-cyan-200/45" />
              <div className="absolute bottom-5 left-10 h-2 w-4 bg-white/55" />
            </div>
            <div className="hero-cape absolute left-1/2 top-[24%] h-14 w-12 -translate-x-[30%] bg-gradient-to-b from-red-400/45 via-orange-500/30 to-transparent" />
            <div className="absolute left-1/2 top-[8%] h-5 w-5 -translate-x-1/2 border-[3px] border-amber-100/40 bg-gradient-to-b from-stone-100 via-amber-200 to-orange-400 shadow-[0_0_10px_rgba(255,210,140,0.35)]">
              <div className="absolute left-1/2 top-[-0.4rem] h-3 w-1 -translate-x-1/2 bg-gradient-to-t from-orange-300 to-amber-100" />
              <div className="absolute left-1/2 top-[-0.55rem] h-4 w-4 -translate-x-1/2 border-t-[3px] border-amber-100/60" />
            </div>
            <div className="absolute left-1/2 top-[24%] h-8 w-9 -translate-x-1/2 border-[3px] border-cyan-100/20 bg-gradient-to-b from-slate-200/80 via-slate-500 to-slate-900 shadow-[0_0_18px_rgba(128,189,255,0.15)]">
              <div className="absolute inset-x-[18%] top-[20%] h-2 bg-cyan-100/20" />
              <div className="absolute left-1/2 top-[30%] h-4 w-[2px] -translate-x-1/2 bg-amber-100/45" />
            </div>
            <div className="absolute left-[20%] top-[34%] h-2 w-8 origin-right bg-gradient-to-r from-slate-300 to-slate-700"
              style={{ transform: "rotate(-26deg)" }}
            />
            <div
              className="absolute right-[17%] top-[36%] h-2 w-9 origin-left bg-gradient-to-r from-slate-300 to-slate-700"
              style={{ transform: `rotate(${runtime.isCharging ? -28 : -8}deg)` }}
            />
            <div className="absolute left-[18%] top-[20%] h-14 w-8 border-l-[3px] border-r-[3px] border-amber-100/75"
              style={{ borderTop: "3px solid transparent", borderBottom: "3px solid transparent" }}
            />
            <div
              className="absolute left-[39%] top-[23%] h-[3.5rem] w-px bg-amber-50/80"
              style={{ transform: `skewY(-10deg) translateX(${runtime.isCharging ? -1 : 0}px)` }}
            />
            <div
              className="absolute left-[42%] top-[34%] h-[3px] bg-gradient-to-r from-cyan-100 via-amber-100 to-white shadow-[0_0_12px_rgba(190,236,255,0.75)]"
              style={{ width: `${1.2 + bowPull / 5}rem`, transform: `translateX(-10%) rotate(-6deg)` }}
            >
              <div className="absolute right-[-0.25rem] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rotate-45 border-t-[3px] border-r-[3px] border-amber-100 bg-white/90" />
              <div className="absolute left-[-0.15rem] top-1/2 h-1.5 w-2.5 -translate-y-1/2 bg-cyan-100/60" />
            </div>
            <div className="absolute left-[33%] top-[56%] h-9 w-2 bg-gradient-to-b from-slate-300 to-slate-900"
              style={{ transform: "rotate(10deg)" }}
            />
            <div className="absolute right-[31%] top-[56%] h-9 w-2 bg-gradient-to-b from-slate-300 to-slate-900"
              style={{ transform: "rotate(-8deg)" }}
            />
            <div className="absolute left-[28%] top-[84%] h-2 w-4 bg-amber-100/70 blur-[1px]" />
            <div className="absolute right-[26%] top-[84%] h-2 w-4 bg-amber-100/70 blur-[1px]" />
            <div className="absolute left-1/2 top-[15%] h-16 w-16 -translate-x-1/2 bg-cyan-100/8 blur-xl" hidden={!runtime.isCharging} />
            <div className="absolute inset-x-2 bottom-0 h-1.5 overflow-hidden border-[2px] border-white/10 bg-slate-950/75">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-amber-100 to-orange-300 transition-all"
                style={{ width: `${runtime.charge}%` }}
              />
            </div>
          </div>
        </div>

        <div className="voxel-panel absolute bottom-5 left-5 hidden max-w-sm px-4 py-3 text-xs uppercase tracking-[0.24em] text-stone-300/78 backdrop-blur-sm md:flex md:items-center md:gap-4">
          <span className="inline-flex items-center gap-2">
            <MoveHorizontal className="h-4 w-4" />
            飞行
          </span>
          <span className="inline-flex items-center gap-2">
            <MousePointer2 className="h-4 w-4" />
            拖动筋斗云
          </span>
          <span className="inline-flex items-center gap-2">
            <Keyboard className="h-4 w-4" />
            W / A / D / 方向键
          </span>
          <span className="font-pixel text-[0.54rem] leading-5 text-amber-100">S / 空格发射</span>
        </div>

        <div
          className="voxel-panel pointer-events-none absolute left-1/2 z-[4] flex w-[calc(100%-1rem)] max-w-xs -translate-x-1/2 items-center justify-between gap-2 px-3 py-2 text-[0.58rem] uppercase tracking-[0.18em] text-stone-200/86 md:hidden"
          style={{ bottom: "calc(env(safe-area-inset-bottom, 0px) + 0.55rem)" }}
        >
          <span className="inline-flex items-center gap-1.5">
            <MoveHorizontal className="h-3.5 w-3.5" />
            拖动飞行
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MousePointer2 className="h-3.5 w-3.5" />
            按住蓄力
          </span>
          <span className="font-pixel text-[0.46rem] leading-4 text-amber-100">松开发射</span>
        </div>

        <div
          className="pointer-events-none absolute inset-0 bg-amber-100 transition-opacity duration-150"
          style={{ opacity: flashOpacity }}
        />
      </div>
    </div>
  );
}
