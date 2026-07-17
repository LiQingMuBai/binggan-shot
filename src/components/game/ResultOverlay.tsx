import { RotateCcw, Trophy } from "lucide-react";

import { type GamePhase } from "@/utils/gameLoop";

interface ResultOverlayProps {
  phase: Extract<GamePhase, "victory" | "defeat">;
  score: number;
  combo: number;
  accuracy: number;
  elapsedMs: number;
  bestScore: number;
  onRestart: () => void;
  onReturnHome: () => void;
}

function formatTime(elapsedMs: number) {
  return `${(elapsedMs / 1000).toFixed(1)}s`;
}

export default function ResultOverlay({
  phase,
  score,
  combo,
  accuracy,
  elapsedMs,
  bestScore,
  onRestart,
  onReturnHome,
}: ResultOverlayProps) {
  const isVictory = phase === "victory";

  return (
    <section className="absolute inset-0 z-30 flex items-center justify-center bg-slate-950/45 px-6 py-8 backdrop-blur-md">
      <div className="voxel-panel w-full max-w-2xl p-7">
        <p className="font-pixel text-[0.58rem] uppercase leading-5 text-stone-400">
          {isVictory ? "Biscuit vs Afanti" : "Biscuit Down"}
        </p>
        <h2 className="mt-4 font-pixel text-xl uppercase leading-8 text-stone-100 md:text-2xl">
          {isVictory ? "饼干大战阿凡提" : "傻猫饼干倒下了"}
        </h2>
        <p className="mt-4 text-base leading-7 text-stone-300/82">
          {isVictory
            ? "你用极限火力完成了对阿凡提的终结打击。"
            : "阿凡提的热压打穿了防线，但这轮数据已经足够傻猫饼干下一次反杀。"}
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-4">
          <div className="voxel-card p-4">
            <p className="font-pixel text-[0.52rem] uppercase leading-5 text-stone-400">得分</p>
            <p className="mt-2 font-pixel text-sm leading-7 text-stone-100">{score}</p>
          </div>
          <div className="voxel-card p-4">
            <p className="font-pixel text-[0.52rem] uppercase leading-5 text-stone-400">连击</p>
            <p className="mt-2 font-pixel text-sm leading-7 text-stone-100">{combo}</p>
          </div>
          <div className="voxel-card p-4">
            <p className="font-pixel text-[0.52rem] uppercase leading-5 text-stone-400">命中率</p>
            <p className="mt-2 font-pixel text-sm leading-7 text-stone-100">{accuracy}%</p>
          </div>
          <div className="voxel-card p-4">
            <p className="font-pixel text-[0.52rem] uppercase leading-5 text-stone-400">用时</p>
            <p className="mt-2 font-pixel text-sm leading-7 text-stone-100">{formatTime(elapsedMs)}</p>
          </div>
        </div>

        <div className="voxel-card mt-6 flex items-center gap-3 bg-amber-300/10 px-4 py-3 text-sm text-amber-50">
          <Trophy className="h-4 w-4" />
          <span>当前最高分 {bestScore}</span>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-4">
          <button
            type="button"
            onClick={onRestart}
            className="voxel-button inline-flex items-center gap-2 bg-gradient-to-b from-amber-100 to-orange-300 px-6 py-3 font-pixel text-[0.62rem] uppercase leading-5 text-slate-950 transition hover:-translate-y-0.5"
          >
            <RotateCcw className="h-4 w-4" />
            再来一局
          </button>
          <button
            type="button"
            onClick={onReturnHome}
            className="voxel-button bg-gradient-to-b from-stone-300 to-stone-500 px-6 py-3 font-pixel text-[0.62rem] uppercase leading-5 text-slate-950 transition hover:-translate-y-0.5"
          >
            返回主页
          </button>
        </div>
      </div>
    </section>
  );
}
