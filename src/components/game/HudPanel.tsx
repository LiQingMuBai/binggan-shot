import { Heart, Radar, ShieldAlert, Zap } from "lucide-react";

import { type GameRuntime } from "@/utils/gameLoop";

interface HudPanelProps {
  runtime: GameRuntime;
}

function formatTime(milliseconds: number) {
  return `${(milliseconds / 1000).toFixed(1)}s`;
}

export default function HudPanel({ runtime }: HudPanelProps) {
  const hpPercentage = Math.max(0, runtime.playerHp);
  const bossPercentage = Math.max(0, (runtime.sunHp / runtime.maxSunHp) * 100);
  const speedBoostSeconds = (runtime.speedBoostMs / 1000).toFixed(1);
  const doubleArrowSeconds = (runtime.doubleArrowMs / 1000).toFixed(1);

  return (
    <div
      className="pointer-events-none absolute inset-x-0 top-0 z-10 px-2 pb-2 pt-2 sm:px-4 sm:pb-4 md:px-6 md:pb-6"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 0.5rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 0.5rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 0.5rem)",
      }}
    >
      <div className="grid gap-2 sm:gap-4 lg:grid-cols-[1fr_auto]">
        <div className="voxel-panel p-3 backdrop-blur-sm sm:p-4">
          <div className="grid gap-3 md:grid-cols-[1fr_1fr_1.2fr] md:gap-4">
            <div>
              <div className="flex items-center gap-2 text-stone-200">
                <Heart className="h-4 w-4 text-red-300" />
                <span className="font-pixel text-[0.56rem] uppercase leading-5">生命</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-rose-300 via-orange-300 to-amber-200 transition-all"
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-300/80 sm:text-sm">{runtime.playerHp} / 100</p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-stone-200">
                <Zap className="h-4 w-4 text-amber-200" />
                <span className="font-pixel text-[0.56rem] uppercase leading-5">蓄力</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-amber-200 to-orange-300 transition-all"
                  style={{ width: `${runtime.charge}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-stone-300/80 sm:text-sm">
                {runtime.isCharging ? "蓄能中" : runtime.cooldownMs > 0 ? "冷却中" : "可开火"}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-2 text-stone-200">
                <ShieldAlert className="h-4 w-4 text-orange-200" />
                <span className="font-pixel text-[0.56rem] uppercase leading-5">阿凡提</span>
              </div>
              <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/8">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-fuchsia-300 via-orange-300 to-amber-100 transition-all"
                  style={{ width: `${bossPercentage}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-stone-300/80 sm:text-sm">
                <span>阶段 {runtime.sunStage}</span>
                <span>{Math.round(runtime.sunHp)} / {runtime.maxSunHp}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="voxel-panel px-3 py-3 backdrop-blur-sm sm:px-4 sm:py-5">
          <div className="grid gap-3 text-left sm:text-right">
            <div>
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-400">得分</p>
              <p className="mt-2 font-pixel text-lg leading-7 text-stone-100">{runtime.score}</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs text-stone-300/80 sm:gap-4 sm:text-sm">
              <div>
                <p className="font-pixel text-[0.5rem] uppercase leading-5 text-stone-400">连击</p>
                <p className="mt-1 font-pixel text-xs leading-6 text-amber-100">{runtime.combo}</p>
              </div>
              <div>
                <p className="font-pixel text-[0.5rem] uppercase leading-5 text-stone-400">命中</p>
                <p className="mt-1 font-pixel text-xs leading-6 text-stone-100">{runtime.accuracy}%</p>
              </div>
              <div>
                <p className="font-pixel text-[0.5rem] uppercase leading-5 text-stone-400">用时</p>
                <p className="mt-1 font-pixel text-xs leading-6 text-stone-100">{formatTime(runtime.elapsedMs)}</p>
              </div>
            </div>
            <div className="flex items-center justify-start gap-2 text-[0.65rem] uppercase tracking-[0.16em] text-stone-400 sm:justify-end sm:text-xs sm:tracking-[0.24em]">
              <Radar className="h-3.5 w-3.5" />
              <span className="text-left sm:text-right">{runtime.message}</span>
            </div>
            {runtime.speedBoostMs > 0 || runtime.doubleArrowMs > 0 ? (
              <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
                {runtime.speedBoostMs > 0 ? (
                  <span className="voxel-chip bg-cyan-100/10 px-3 py-1 font-pixel text-[0.48rem] uppercase leading-5 text-cyan-100">
                    疾风 {speedBoostSeconds}s
                  </span>
                ) : null}
                {runtime.doubleArrowMs > 0 ? (
                  <span className="voxel-chip bg-fuchsia-100/10 px-3 py-1 font-pixel text-[0.48rem] uppercase leading-5 text-fuchsia-100">
                    双箭 {doubleArrowSeconds}s
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
