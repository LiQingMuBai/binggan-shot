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
    <section
      className="absolute inset-0 z-20 overflow-y-auto px-3 py-4 sm:px-6 sm:py-8"
      style={{
        paddingTop: "max(env(safe-area-inset-top, 0px), 1rem)",
        paddingRight: "max(env(safe-area-inset-right, 0px), 1rem)",
        paddingBottom: "max(env(safe-area-inset-bottom, 0px), 1rem)",
        paddingLeft: "max(env(safe-area-inset-left, 0px), 1rem)",
      }}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-4 sm:gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        <div className="voxel-panel p-4 backdrop-blur-sm sm:p-8">
          <p className="font-pixel text-[0.6rem] uppercase leading-6 text-amber-200/80">
            Biscuit vs Afanti
          </p>
          <h1 className="mt-4 max-w-3xl font-pixel text-2xl uppercase leading-[1.25] text-stone-100 sm:mt-5 sm:text-3xl md:text-5xl">
            饼干大战阿凡提
          </h1>
          <p className="mt-4 max-w-2xl text-xs leading-6 text-stone-300/82 sm:mt-6 sm:text-sm sm:leading-7 md:text-base">
            在方块天空下操控傻猫饼干，拉弓压制像素化的阿凡提。阿凡提会随着血量降低进入更狂暴的阶段，
            你只有短暂窗口完成反杀。
          </p>

          <div className="mt-6 grid gap-3 sm:mt-8 sm:gap-4 md:grid-cols-3">
            <div className="voxel-card p-4 sm:p-4">
              <div className="flex items-center gap-3 text-amber-200">
                <Crosshair className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">操作</span>
              </div>
              <p className="mt-3 text-xs leading-6 text-stone-300/86 sm:text-sm">
                鼠标或触控拖动筋斗云飞行，按住蓄力，松开发射。键盘支持
                <span className="text-stone-100"> W / A / D / 方向键 </span>
                飞行，
                <span className="text-stone-100"> S </span>
                或空格发射。
              </p>
            </div>

            <div className="voxel-card p-4">
              <div className="flex items-center gap-3 text-orange-200">
                <Gauge className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">节奏</span>
              </div>
              <p className="mt-3 text-xs leading-6 text-stone-300/86 sm:text-sm">
                阿凡提会释放火球和日冕脉冲，阶段越高越密集。掉落的技能包包含疾风、双箭和 5 秒冰封世界。
              </p>
            </div>

            <div className="voxel-card p-4">
              <div className="flex items-center gap-3 text-red-200">
                <Flame className="h-4 w-4" />
                <span className="font-pixel text-[0.58rem] uppercase leading-5">目标</span>
              </div>
              <p className="mt-3 text-xs leading-6 text-stone-300/86 sm:text-sm">
                在生命归零前击败阿凡提，刷新最高分、最大连击和最快通关时间。
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
            <button
              type="button"
              onClick={onStart}
              className="voxel-button w-full bg-gradient-to-b from-amber-100 to-orange-300 px-8 py-3 font-pixel text-[0.68rem] uppercase leading-5 text-slate-950 transition hover:-translate-y-0.5 sm:w-auto"
            >
              开始发射
            </button>
            <div className="flex flex-wrap gap-2">
              <span className="voxel-chip bg-cyan-100/10 px-3 py-1 font-pixel text-[0.5rem] uppercase leading-5 text-cyan-100">
                手机触控可玩
              </span>
              <span className="voxel-chip bg-amber-100/10 px-3 py-1 font-pixel text-[0.5rem] uppercase leading-5 text-amber-100">
                建议横屏
              </span>
              <span className="font-pixel text-[0.52rem] uppercase leading-5 text-stone-400">
                单局约 45-90 秒
              </span>
            </div>
          </div>
        </div>

        <aside className="voxel-panel p-4 backdrop-blur-sm sm:p-6">
          <div className="flex items-center gap-3 text-stone-100">
            <Trophy className="h-5 w-5 text-amber-200" />
            <h2 className="font-pixel text-sm uppercase leading-6">战绩档案</h2>
          </div>

          <div className="mt-4 grid gap-3 sm:mt-6 sm:gap-4">
            <div className="voxel-card bg-[linear-gradient(180deg,rgba(255,214,116,0.18),rgba(81,47,14,0.95))] p-4 sm:p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-amber-100/72">最高得分</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-amber-50">{bestScore}</p>
            </div>
            <div className="voxel-card p-4 sm:p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-300/72">最高连击</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-stone-100">{bestCombo}</p>
            </div>
            <div className="voxel-card p-4 sm:p-5">
              <p className="font-pixel text-[0.56rem] uppercase leading-5 text-stone-300/72">最快通关</p>
              <p className="mt-3 font-pixel text-lg leading-7 text-stone-100">{formatTime(bestTimeMs)}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
