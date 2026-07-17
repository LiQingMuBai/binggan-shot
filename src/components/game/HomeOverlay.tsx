import { Crosshair, Flame, Gauge, Trophy } from "lucide-react";

interface HomeOverlayProps {
  bestScore: number;
  bestCombo: number;
  bestTimeMs: number | null;
  onStart: () => void;
}

function formatTime(bestTimeMs: number | null) {
  if (bestTimeMs === null) {
    return "--";
  }

  return `${(bestTimeMs / 1000).toFixed(1)}s`;
}

export default function HomeOverlay({
  bestScore,
  bestCombo,
  bestTimeMs,
  onStart,
}: HomeOverlayProps) {
  return (
    <section className="absolute inset-0 z-20 overflow-y-auto px-6 py-8">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="voxel-panel p-8 backdrop-blur-sm">
          <p className="font-pixel text-[0.6rem] uppercase leading-6 text-amber-200/80">
            Block Sun Raid
          </p>
          <h1 className="mt-5 max-w-3xl font-pixel text-3xl uppercase leading-[1.2] text-stone-100 md:text-5xl">
            射太阳
          </h1>
          <p className="mt-6 max-w-2xl text-sm leading-7 text-stone-300/82 md:text-base">
            在方块天空下操控后羿，拉弓击穿像素化日核。太阳会随着血量降低进入更狂暴的阶段，
            你只有短暂窗口完成反杀。
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="voxel-card p-4">
              <div className="flex items-center gap-3 text-amber-200">
                <Crosshair className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">操作</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300/86">
                鼠标或触控左右移动，按住蓄力，松开发射。键盘支持
                <span className="text-stone-100"> A / D </span>
                移动，
                <span className="text-stone-100"> S </span>
                或空格发射。
              </p>
            </div>

            <div className="voxel-card p-4">
              <div className="flex items-center gap-3 text-orange-200">
                <Gauge className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">节奏</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300/86">
                太阳会释放火球和日冕脉冲，阶段越高越密集。打出连续命中可快速滚高分。
              </p>
            </div>

            <div className="voxel-card p-4">
              <div className="flex items-center gap-3 text-red-200">
                <Flame className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">目标</span>
              </div>
              <p className="mt-3 text-sm leading-6 text-stone-300/86">
                在生命归零前摧毁太阳，刷新最高分、最大连击和最快通关时间。
              </p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <button
              type="button"
              onClick={onStart}
              className="voxel-button bg-gradient-to-b from-amber-100 to-orange-300 px-8 py-3 font-pixel text-[0.68rem] uppercase leading-5 text-slate-950 transition hover:-translate-y-0.5"
            >
              开始发射
            </button>
            <span className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-400">
              桌面优先 · 单局约 45-90 秒
            </span>
          </div>
        </div>

        <aside className="voxel-panel p-6 backdrop-blur-sm">
          <div className="flex items-center gap-3 text-stone-100">
            <Trophy className="h-5 w-5 text-amber-200" />
            <h2 className="font-pixel text-sm uppercase leading-6">战绩档案</h2>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="voxel-card bg-[linear-gradient(180deg,rgba(255,214,116,0.18),rgba(81,47,14,0.95))] p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-amber-100/72">最高得分</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-amber-50">{bestScore}</p>
            </div>
            <div className="voxel-card p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-300/72">最高连击</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-stone-100">{bestCombo}</p>
            </div>
            <div className="voxel-card p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-300/72">最快通关</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-stone-100">{formatTime(bestTimeMs)}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
