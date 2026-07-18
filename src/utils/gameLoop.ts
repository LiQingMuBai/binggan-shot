export type GamePhase = "idle" | "playing" | "victory" | "defeat";
export type SunStage = 1 | 2 | 3;
export type EnemyPattern = "fireball" | "pulse" | "uv";
export type EnemyMonsterKind = "creeper" | "zombie" | "skeleton" | "slime" | "spider";
export type PowerupKind = "speed" | "double" | "freeze" | "ultraman" | "wukong";

export interface ProjectileState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  radius: number;
}

export interface EnemyProjectileState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  pattern: EnemyPattern;
  monster: EnemyMonsterKind;
  ttlMs: number;
  ageMs: number;
  hasCloned: boolean;
  ricochetsLeft: number;
  damage: number;
}

export interface EnemyBurstState {
  id: string;
  x: number;
  y: number;
  ttlMs: number;
  monster: EnemyMonsterKind;
  variant: "enemy" | "wukong-guard";
}

export interface SunDropState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  value: number;
  spin: number;
}

export interface SkillPackState {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  kind: PowerupKind;
  spin: number;
}

export interface ScorePopupState {
  id: string;
  x: number;
  y: number;
  value: number;
  ttlMs: number;
  kind: "impact" | "loot" | "buff";
  label: string;
}

export interface UltramanBeamState {
  ttlMs: number;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
}

export interface LocalRecord {
  bestScore: number;
  bestCombo: number;
  bestTimeMs: number | null;
}

export interface GameRuntime extends LocalRecord {
  phase: GamePhase;
  elapsedMs: number;
  worldElapsedMs: number;
  playerX: number;
  playerY: number;
  playerHp: number;
  charge: number;
  isCharging: boolean;
  cooldownMs: number;
  sunHp: number;
  maxSunHp: number;
  sunStage: SunStage;
  sunShieldMs: number;
  projectiles: ProjectileState[];
  enemyProjectiles: EnemyProjectileState[];
  enemyBursts: EnemyBurstState[];
  sunDrops: SunDropState[];
  skillPacks: SkillPackState[];
  scorePopups: ScorePopupState[];
  speedBoostMs: number;
  doubleArrowMs: number;
  freezeWorldMs: number;
  ultramanAssistMs: number;
  wukongGuardMs: number;
  ultramanEntryMs: number;
  ultramanShotCooldownMs: number;
  ultramanBeam: UltramanBeamState | null;
  attackCooldownMs: number;
  score: number;
  combo: number;
  shotsFired: number;
  shotsHit: number;
  hitsTaken: number;
  accuracy: number;
  impactMs: number;
  screenShakeMs: number;
  message: string;
}

export interface SunVisual {
  x: number;
  y: number;
  radius: number;
}

export const STORAGE_KEY = "sun-strike-record";
export const STAGE_WIDTH = 100;
export const STAGE_HEIGHT = 100;
export const PLAYER_Y = 89;
export const PLAYER_RADIUS = 4.4;

const MAX_SUN_HP = 920;
const CHARGE_PER_MS = 0.082;
const BUFF_DURATION_MS = 6200;
const FREEZE_WORLD_DURATION_MS = 5000;
const ENEMY_CLONE_DELAY_MS = 1000;
const ULTRAMAN_ASSIST_DURATION_MS = 7800;
const ULTRAMAN_SHOT_INTERVAL_MS = 360;
const ULTRAMAN_ENTRY_DURATION_MS = 960;
const WUKONG_GUARD_DURATION_MS = 10000;
const WUKONG_GUARD_RADIUS = PLAYER_RADIUS + 6.8;
const DEFAULT_RECORD: LocalRecord = {
  bestScore: 0,
  bestCombo: 0,
  bestTimeMs: null,
};

const STAGE_MESSAGES: Record<SunStage, string> = {
  1: "对准阿凡提，稳住节奏。",
  2: "日冕暴走，火力加剧。",
  3: "终焉之相，别让阿凡提先开口。",
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}

function getPlayerCeilingY(runtime: Pick<GameRuntime, "worldElapsedMs" | "sunStage">) {
  const sunVisual = getSunVisual(runtime);

  return clamp(round(sunVisual.y + sunVisual.radius + 7.2), 26, PLAYER_Y - 10);
}

function getProjectileStartY(playerY: number) {
  return round(Math.max(12, playerY - 7));
}

function getUltramanAnchor(runtime: Pick<GameRuntime, "playerX" | "playerY">) {
  return {
    x: clamp(round(runtime.playerX - 17), 12, 28),
    y: clamp(round(runtime.playerY - 10), 28, 76),
  };
}

function getEnemyDefeatScore(monster: EnemyMonsterKind) {
  if (monster === "creeper") {
    return 88;
  }

  if (monster === "skeleton") {
    return 74;
  }

  if (monster === "spider") {
    return 68;
  }

  if (monster === "slime") {
    return 56;
  }

  return 62;
}

export function loadRecord(): LocalRecord {
  if (typeof window === "undefined") {
    return DEFAULT_RECORD;
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);

    if (!rawValue) {
      return DEFAULT_RECORD;
    }

    const parsedValue = JSON.parse(rawValue) as Partial<LocalRecord>;

    return {
      bestScore: Number(parsedValue.bestScore) || 0,
      bestCombo: Number(parsedValue.bestCombo) || 0,
      bestTimeMs:
        typeof parsedValue.bestTimeMs === "number" ? parsedValue.bestTimeMs : null,
    };
  } catch {
    return DEFAULT_RECORD;
  }
}

export function saveRecord(record: LocalRecord) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
}

export function resolveSunStage(sunHp: number, maxSunHp: number): SunStage {
  const ratio = sunHp / maxSunHp;

  if (ratio > 0.66) {
    return 1;
  }

  if (ratio > 0.32) {
    return 2;
  }

  return 3;
}

export function getSunVisual(runtime: Pick<GameRuntime, "worldElapsedMs" | "sunStage">): SunVisual {
  const speed = 0.00078 + runtime.sunStage * 0.00018;
  const amplitude = 12 + runtime.sunStage * 3.5;

  return {
    x: 50 + Math.sin(runtime.worldElapsedMs * speed) * amplitude,
    y: 17 + Math.cos(runtime.worldElapsedMs * 0.0009) * 1.8,
    radius: 5.6 - (runtime.sunStage - 1) * 0.45,
  };
}

export function createIdleRuntime(record: LocalRecord = DEFAULT_RECORD): GameRuntime {
  return {
    ...record,
    phase: "idle",
    elapsedMs: 0,
    worldElapsedMs: 0,
    playerX: 50,
    playerY: PLAYER_Y,
    playerHp: 100,
    charge: 0,
    isCharging: false,
    cooldownMs: 0,
    sunHp: MAX_SUN_HP,
    maxSunHp: MAX_SUN_HP,
    sunStage: 1,
    sunShieldMs: 0,
    projectiles: [],
    enemyProjectiles: [],
    enemyBursts: [],
    sunDrops: [],
    skillPacks: [],
    scorePopups: [],
    speedBoostMs: 0,
    doubleArrowMs: 0,
    freezeWorldMs: 0,
    ultramanAssistMs: 0,
    wukongGuardMs: 0,
    ultramanEntryMs: 0,
    ultramanShotCooldownMs: 0,
    ultramanBeam: null,
    attackCooldownMs: 1200,
    score: 0,
    combo: 0,
    shotsFired: 0,
    shotsHit: 0,
    hitsTaken: 0,
    accuracy: 0,
    impactMs: 0,
    screenShakeMs: 0,
    message: "瞄准阿凡提，准备发射。",
  };
}

export function createPlayingRuntime(record: LocalRecord = DEFAULT_RECORD): GameRuntime {
  return {
    ...createIdleRuntime(record),
    phase: "playing",
  };
}

export function beginCharge(runtime: GameRuntime): GameRuntime {
  if (runtime.phase !== "playing" || runtime.cooldownMs > 0) {
    return runtime;
  }

  return {
    ...runtime,
    isCharging: true,
    message: runtime.charge > 0 ? runtime.message : "蓄能中，找准窗口。",
  };
}

export function cancelCharge(runtime: GameRuntime): GameRuntime {
  if (!runtime.isCharging) {
    return runtime;
  }

  return {
    ...runtime,
    isCharging: false,
    charge: 0,
    message: "蓄能已取消，继续周旋。",
  };
}

export function setPlayerAim(runtime: GameRuntime, x: number, y = runtime.playerY): GameRuntime {
  const ceilingY = getPlayerCeilingY(runtime);

  return {
    ...runtime,
    playerX: clamp(x, 8, 92),
    playerY: clamp(y, ceilingY, PLAYER_Y),
  };
}

export function releaseCharge(runtime: GameRuntime): GameRuntime {
  if (runtime.phase !== "playing") {
    return runtime;
  }

  if (!runtime.isCharging && runtime.charge <= 0) {
    return runtime;
  }

  if (runtime.cooldownMs > 0) {
    return {
      ...runtime,
      isCharging: false,
      charge: 0,
    };
  }

  const charge = Math.max(runtime.charge, 12);
  const isDoubleArrowActive = runtime.doubleArrowMs > 0;
  const arrowOffsets = isDoubleArrowActive ? [-1.6, 1.6] : [0];
  const projectiles = arrowOffsets.map((offset, index) => ({
    id: `shot-${runtime.elapsedMs}-${runtime.shotsFired + index + 1}`,
    x: runtime.playerX + offset,
    y: getProjectileStartY(runtime.playerY),
    vx: round(offset * 4.8),
    vy: 66 + charge * 0.26,
    damage: round(16 + charge * 0.72),
    radius: round(1.2 + charge * 0.03),
  }));

  return {
    ...runtime,
    charge: 0,
    isCharging: false,
    cooldownMs: 180,
    shotsFired: runtime.shotsFired + projectiles.length,
    projectiles: [...runtime.projectiles, ...projectiles],
    message: isDoubleArrowActive
      ? "双箭齐发，压制阿凡提。"
      : charge > 70
        ? "满蓄力直击日冕。"
        : "箭矢已发射。",
  };
}

function getAttackInterval(stage: SunStage) {
  if (stage === 1) {
    return 1780;
  }

  if (stage === 2) {
    return 1480;
  }

  return 1180;
}

function createEnemyProjectile(
  runtime: GameRuntime,
  options: {
    id: string;
    x: number;
    y: number;
    angleRad: number;
    speed: number;
    radius: number;
    pattern: EnemyPattern;
    monster: EnemyMonsterKind;
    damage: number;
  },
): EnemyProjectileState {
  const isUvBolt = options.pattern === "uv";

  return {
    id: options.id,
    x: round(options.x),
    y: round(options.y),
    vx: round(Math.cos(options.angleRad) * options.speed),
    vy: round(Math.sin(options.angleRad) * options.speed),
    radius: round(options.radius),
    pattern: options.pattern,
    monster: options.monster,
    ttlMs: isUvBolt ? 2200 + runtime.sunStage * 120 : options.pattern === "pulse" ? 4600 : 4000 + runtime.sunStage * 260,
    ageMs: 0,
    hasCloned: isUvBolt,
    ricochetsLeft: isUvBolt ? 0 : options.pattern === "pulse" ? 8 : 6 + runtime.sunStage,
    damage: options.damage,
  };
}

function createClonedEnemyProjectile(
  runtime: Pick<GameRuntime, "elapsedMs">,
  projectile: EnemyProjectileState,
): EnemyProjectileState {
  const speed = Math.hypot(projectile.vx, projectile.vy);
  const baseAngle = Math.atan2(projectile.vy, projectile.vx);
  const cloneOffset = projectile.pattern === "pulse" ? 0.52 : 0.34;
  const directionSign = Math.sin(runtime.elapsedMs * 0.013 + projectile.x * 0.17 + projectile.y * 0.11) >= 0 ? 1 : -1;
  const cloneAngle = baseAngle + cloneOffset * directionSign;

  return {
    ...projectile,
    id: `${projectile.id}-clone-${runtime.elapsedMs}`,
    vx: round(Math.cos(cloneAngle) * speed),
    vy: round(Math.sin(cloneAngle) * speed),
    ttlMs: Math.max(900, projectile.ttlMs),
    ageMs: 0,
    hasCloned: true,
    ricochetsLeft: Math.max(1, projectile.ricochetsLeft - 1),
  };
}

function createEnemyVolley(runtime: GameRuntime): EnemyProjectileState[] {
  const sunVisual = getSunVisual(runtime);
  const spreadSeed = Math.sin(runtime.elapsedMs / 190 + runtime.sunStage * 1.7);
  const baseAngle = Math.atan2(runtime.playerY - sunVisual.y, runtime.playerX - sunVisual.x);
  const angleCycle = Math.floor(runtime.elapsedMs / 420) % 4;
  const primaryOffsets = [-0.42, 0.42, -2.08, 2.08];
  const sideOffsets = [1.2, -1.2, 2.34, -2.34];
  const primaryMonster: EnemyMonsterKind =
    runtime.sunStage === 1 ? "zombie" : runtime.sunStage === 2 ? "skeleton" : "creeper";
  const primaryAngle = baseAngle + primaryOffsets[angleCycle] + spreadSeed * 0.18;

  const primary = createEnemyProjectile(runtime, {
    id: `fireball-${runtime.elapsedMs}`,
    x: sunVisual.x + Math.cos(primaryAngle) * (sunVisual.radius * 0.48),
    y: sunVisual.y + Math.sin(primaryAngle) * (sunVisual.radius * 0.48),
    angleRad: primaryAngle,
    speed: 18 + runtime.sunStage * 3.1,
    radius: 2 + runtime.sunStage * 0.45,
    pattern: "fireball",
    monster: primaryMonster,
    damage: 10 + runtime.sunStage * 4,
  });

  if (runtime.sunStage === 1) {
    return [primary];
  }

  const sideAngle = baseAngle + sideOffsets[angleCycle] - spreadSeed * 0.22;
  const side = createEnemyProjectile(runtime, {
    id: `side-${runtime.elapsedMs}`,
    x: sunVisual.x + Math.cos(sideAngle) * (sunVisual.radius * 0.56),
    y: sunVisual.y + Math.sin(sideAngle) * (sunVisual.radius * 0.56),
    angleRad: sideAngle,
    speed: 15 + runtime.sunStage * 2.8,
    radius: 1.8 + runtime.sunStage * 0.35,
    pattern: runtime.sunStage === 3 ? "pulse" : "fireball",
    monster: runtime.sunStage === 3 ? "slime" : runtime.sunStage === 2 ? "spider" : "creeper",
    damage: runtime.sunStage === 3 ? 18 : 9,
  });

  const uvOffsets = runtime.sunStage === 3 ? [-0.16, 0.16] : [0];
  const uvBolts = uvOffsets.map((offset, index) => {
    const uvAngle = baseAngle + offset + spreadSeed * 0.06;

    return createEnemyProjectile(runtime, {
      id: `uv-${runtime.elapsedMs}-${index}`,
      x: sunVisual.x + Math.cos(uvAngle) * (sunVisual.radius * 0.62),
      y: sunVisual.y + Math.sin(uvAngle) * (sunVisual.radius * 0.62),
      angleRad: uvAngle,
      speed: 28 + runtime.sunStage * 2.3,
      radius: 1.4 + runtime.sunStage * 0.14,
      pattern: "uv",
      monster: "spider",
      damage: 8 + runtime.sunStage * 3,
    });
  });

  return [primary, side, ...uvBolts];
}

function getProjectileDistance(aX: number, aY: number, bX: number, bY: number) {
  return Math.hypot(aX - bX, aY - bY);
}

function updateAccuracy(shotsFired: number, shotsHit: number) {
  if (shotsFired <= 0) {
    return 0;
  }

  return Math.round((shotsHit / shotsFired) * 100);
}

function seededUnit(seed: number) {
  const noise = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return noise - Math.floor(noise);
}

export function resolveRecord(runtime: GameRuntime): LocalRecord {
  return {
    bestScore: Math.max(runtime.bestScore, runtime.score),
    bestCombo: Math.max(runtime.bestCombo, runtime.combo),
    bestTimeMs:
      runtime.phase === "victory"
        ? runtime.bestTimeMs === null
          ? runtime.elapsedMs
          : Math.min(runtime.bestTimeMs, runtime.elapsedMs)
        : runtime.bestTimeMs,
  };
}

function createScorePopup(
  x: number,
  y: number,
  value: number,
  kind: ScorePopupState["kind"],
  label?: string,
): ScorePopupState {
  return {
    id: `score-${kind}-${x}-${y}-${value}-${Date.now()}`,
    x: round(x),
    y: round(y),
    value,
    ttlMs: kind === "loot" ? 1180 : kind === "buff" ? 1350 : 760,
    kind,
    label: label ?? (kind === "loot" ? `熔核 +${value}` : `+${value}`),
  };
}

function createSunDrops(
  runtime: GameRuntime,
  impactX: number,
  impactY: number,
  damage: number,
): SunDropState[] {
  const baseCount = runtime.sunStage === 1 ? 1 : 2;
  const extraCount = damage > 58 ? 1 : 0;
  const totalCount = Math.min(3, baseCount + extraCount);
  const homeBias = (runtime.playerX - impactX) * 0.12;

  return Array.from({ length: totalCount }, (_, index) => {
    const spread = (index - (totalCount - 1) / 2) * 7;
    const pulse = Math.sin((runtime.elapsedMs + index * 33) * 0.02) * 1.8;
    const value = Math.round(24 + runtime.sunStage * 14 + damage * 0.56 + index * 6);

    return {
      id: `drop-${runtime.elapsedMs}-${index}`,
      x: round(impactX + spread * 0.24),
      y: round(impactY + 1.2 + index * 0.4),
      vx: round(homeBias + spread + pulse),
      vy: round(18 + runtime.sunStage * 4.6 + index * 1.8),
      radius: round(1.9 + runtime.sunStage * 0.28),
      value,
      spin: round(index * 0.8 + pulse),
    };
  });
}

function createSkillPack(
  runtime: GameRuntime,
  impactX: number,
  impactY: number,
  damage: number,
): SkillPackState[] {
  const dropChance = 0.28 + (runtime.sunStage - 1) * 0.08 + (damage > 60 ? 0.06 : 0);
  const roll = seededUnit(runtime.elapsedMs + runtime.shotsHit * 17 + impactX * 13 + impactY * 7);

  if (roll > dropChance) {
    return [];
  }

  const kindRoll = seededUnit(runtime.elapsedMs + runtime.combo * 29 + damage * 11);
  const kind: PowerupKind =
    kindRoll > 0.46
      ? "wukong"
      : kindRoll > 0.32
        ? "ultraman"
        : kindRoll > 0.2
          ? "double"
          : kindRoll > 0.1
            ? "speed"
            : "freeze";
  const spawnOffsetX =
    kind === "double" ? 2.4 : kind === "speed" ? -2.2 : kind === "ultraman" ? 1.2 : kind === "wukong" ? -1.2 : 0;
  const launchVx =
    kind === "double"
      ? 8
      : kind === "speed"
        ? -8
        : kind === "ultraman"
          ? 4.5
          : kind === "wukong"
            ? -4.2
            : (runtime.playerX - impactX) * 0.15;
  const spin =
    kind === "double" ? 0.9 : kind === "speed" ? -0.7 : kind === "ultraman" ? 0.22 : kind === "wukong" ? 0.6 : 0.42;

  return [
    {
      id: `skill-${runtime.elapsedMs}-${kind}`,
      x: round(impactX + spawnOffsetX),
      y: round(impactY + 1.4),
      vx: round((runtime.playerX - impactX) * 0.08 + launchVx),
      vy: round(16 + runtime.sunStage * 4.2),
      radius: 2.8,
      kind,
      spin: round(spin),
    },
  ];
}

export function advanceGame(runtime: GameRuntime, deltaMs: number): GameRuntime {
  if (runtime.phase !== "playing") {
    return runtime;
  }

  const stepMs = clamp(deltaMs, 8, 32);
  const elapsedMs = runtime.elapsedMs + stepMs;
  const frozenStepMs = Math.min(runtime.freezeWorldMs, stepMs);
  const activeWorldStepMs = stepMs - frozenStepMs;
  const worldElapsedMs = runtime.worldElapsedMs + activeWorldStepMs;
  const cooldownMs = Math.max(0, runtime.cooldownMs - stepMs);
  const charge = runtime.isCharging
    ? clamp(runtime.charge + stepMs * CHARGE_PER_MS, 0, 100)
    : runtime.charge;

  const nextState: GameRuntime = {
    ...runtime,
    elapsedMs,
    worldElapsedMs,
    cooldownMs,
    charge,
    playerY: clamp(runtime.playerY, getPlayerCeilingY({ worldElapsedMs, sunStage: runtime.sunStage }), PLAYER_Y),
    sunShieldMs: Math.max(0, runtime.sunShieldMs - activeWorldStepMs),
    impactMs: Math.max(0, runtime.impactMs - stepMs),
    screenShakeMs: Math.max(0, runtime.screenShakeMs - stepMs),
    speedBoostMs: Math.max(0, runtime.speedBoostMs - stepMs),
    doubleArrowMs: Math.max(0, runtime.doubleArrowMs - stepMs),
    freezeWorldMs: Math.max(0, runtime.freezeWorldMs - stepMs),
    ultramanAssistMs: Math.max(0, runtime.ultramanAssistMs - stepMs),
    wukongGuardMs: Math.max(0, runtime.wukongGuardMs - stepMs),
    ultramanEntryMs: Math.max(0, runtime.ultramanEntryMs - activeWorldStepMs),
    ultramanShotCooldownMs: Math.max(0, runtime.ultramanShotCooldownMs - activeWorldStepMs),
    ultramanBeam:
      runtime.ultramanBeam && runtime.ultramanBeam.ttlMs - activeWorldStepMs > 0
        ? {
            ...runtime.ultramanBeam,
            ttlMs: runtime.ultramanBeam.ttlMs - activeWorldStepMs,
          }
        : null,
    attackCooldownMs: runtime.attackCooldownMs - activeWorldStepMs,
    accuracy: updateAccuracy(runtime.shotsFired, runtime.shotsHit),
  };

  const currentSunVisual = getSunVisual(nextState);
  const remainingProjectiles: ProjectileState[] = [];
  let enemyProjectilesAfterArrowHits = [...nextState.enemyProjectiles];
  const enemyBursts: EnemyBurstState[] = [];
  let sunHp = nextState.sunHp;
  let score = nextState.score;
  let combo = nextState.combo;
  let shotsHit = nextState.shotsHit;
  let stageChanged = false;
  let message = nextState.message;
  const scorePopups: ScorePopupState[] = [];

  nextState.scorePopups.forEach((popup) => {
    const movedPopup = {
      ...popup,
      y: popup.y - (popup.kind === "loot" ? 7.2 : 5.4) * (activeWorldStepMs / 1000),
      ttlMs: popup.ttlMs - activeWorldStepMs,
    };

    if (movedPopup.ttlMs > 0) {
      scorePopups.push(movedPopup);
    }
  });

  nextState.enemyBursts.forEach((burst) => {
    const movedBurst = {
      ...burst,
      ttlMs: burst.ttlMs - stepMs,
    };

    if (movedBurst.ttlMs > 0) {
      enemyBursts.push(movedBurst);
    }
  });

  nextState.projectiles.forEach((projectile) => {
    const movedProjectile = {
      ...projectile,
      x: projectile.x + (projectile.vx * stepMs) / 1000,
      y: projectile.y - (projectile.vy * stepMs) / 1000,
    };

    const enemyHitIndex = enemyProjectilesAfterArrowHits.findIndex(
      (enemyProjectile) =>
        getProjectileDistance(movedProjectile.x, movedProjectile.y, enemyProjectile.x, enemyProjectile.y) <=
        movedProjectile.radius + enemyProjectile.radius + 0.8,
    );

    if (enemyHitIndex >= 0) {
      const [destroyedEnemyProjectile] = enemyProjectilesAfterArrowHits.splice(enemyHitIndex, 1);

      if (destroyedEnemyProjectile) {
        combo += 1;
        shotsHit += 1;
        const interceptScore = getEnemyDefeatScore(destroyedEnemyProjectile.monster);
        score += interceptScore;
        enemyBursts.push({
          id: `enemy-burst-${destroyedEnemyProjectile.id}-${elapsedMs}`,
          x: destroyedEnemyProjectile.x,
          y: destroyedEnemyProjectile.y,
          ttlMs: 280,
          monster: destroyedEnemyProjectile.monster,
          variant: "enemy",
        });
        scorePopups.push(
          createScorePopup(
            destroyedEnemyProjectile.x,
            destroyedEnemyProjectile.y,
            interceptScore,
            "impact",
            `破怪 +${interceptScore}`,
          ),
        );
        message = combo > 4 ? `连击 ${combo}，箭矢击碎怪物。` : "箭矢击碎怪物。";
      }
      return;
    }

    const collided =
      nextState.sunShieldMs <= 0 &&
      getProjectileDistance(movedProjectile.x, movedProjectile.y, currentSunVisual.x, currentSunVisual.y) <=
        currentSunVisual.radius + movedProjectile.radius;

    if (collided) {
      sunHp = Math.max(0, sunHp - movedProjectile.damage);
      combo += 1;
      shotsHit += 1;
      const impactScore = Math.round(movedProjectile.damage * 7 + combo * 4);
      score += impactScore;
      nextState.sunDrops.push(
        ...createSunDrops(nextState, movedProjectile.x, movedProjectile.y, movedProjectile.damage),
      );
      nextState.skillPacks.push(
        ...createSkillPack(nextState, movedProjectile.x, movedProjectile.y, movedProjectile.damage),
      );
      scorePopups.push(createScorePopup(movedProjectile.x, movedProjectile.y, impactScore, "impact"));
      message = combo > 5 ? `连击 ${combo}，熔核碎片正在坠落。` : "命中阿凡提，阿凡提吐出碎片。";
      return;
    }

    if (movedProjectile.y > -10) {
      remainingProjectiles.push(movedProjectile);
    } else {
      combo = Math.max(0, combo - 1);
    }
  });

  nextState.projectiles = remainingProjectiles;
  nextState.enemyProjectiles = enemyProjectilesAfterArrowHits;
  nextState.enemyBursts = enemyBursts;
  nextState.sunHp = sunHp;
  nextState.score = score;
  nextState.combo = combo;
  nextState.shotsHit = shotsHit;

  const remainingSunDrops: SunDropState[] = [];
  nextState.sunDrops.forEach((drop) => {
    const movedDrop = {
      ...drop,
      x: drop.x + ((drop.vx + (nextState.playerX - drop.x) * 0.2) * activeWorldStepMs) / 1000,
      y: drop.y + (drop.vy * activeWorldStepMs) / 1000,
      spin: drop.spin + activeWorldStepMs * 0.014,
    };

    const collected =
      getProjectileDistance(movedDrop.x, movedDrop.y, nextState.playerX, nextState.playerY) <=
      PLAYER_RADIUS + movedDrop.radius + 2;

    if (collected) {
      nextState.score += movedDrop.value;
      scorePopups.push(
        createScorePopup(nextState.playerX, nextState.playerY - 5.4, movedDrop.value, "loot"),
      );
      message = `回收熔核碎片 +${movedDrop.value}`;
      return;
    }

    if (movedDrop.y < STAGE_HEIGHT + 8) {
      remainingSunDrops.push(movedDrop);
    }
  });

  nextState.sunDrops = remainingSunDrops;

  const remainingSkillPacks: SkillPackState[] = [];
  nextState.skillPacks.forEach((pack) => {
    const movedPack = {
      ...pack,
      x: pack.x + ((pack.vx + (nextState.playerX - pack.x) * 0.18) * activeWorldStepMs) / 1000,
      y: pack.y + (pack.vy * activeWorldStepMs) / 1000,
      spin: pack.spin + activeWorldStepMs * 0.01,
    };

    const collected =
      getProjectileDistance(movedPack.x, movedPack.y, nextState.playerX, nextState.playerY) <=
      PLAYER_RADIUS + movedPack.radius + 2.4;

    if (collected) {
      if (movedPack.kind === "speed") {
        nextState.speedBoostMs = Math.max(nextState.speedBoostMs, BUFF_DURATION_MS);
        scorePopups.push(
          createScorePopup(nextState.playerX, nextState.playerY - 8, 0, "buff", "疾风提速"),
        );
        message = "吃到疾风技能包，移动更快。";
      } else if (movedPack.kind === "double") {
        nextState.doubleArrowMs = Math.max(nextState.doubleArrowMs, BUFF_DURATION_MS);
        scorePopups.push(
          createScorePopup(nextState.playerX, nextState.playerY - 8, 0, "buff", "双箭齐发"),
        );
        message = "吃到双箭技能包，下一轮改为双箭。";
      } else if (movedPack.kind === "ultraman") {
        nextState.ultramanAssistMs = Math.max(nextState.ultramanAssistMs, ULTRAMAN_ASSIST_DURATION_MS);
        nextState.ultramanEntryMs = ULTRAMAN_ENTRY_DURATION_MS;
        nextState.ultramanShotCooldownMs = ULTRAMAN_ENTRY_DURATION_MS + 120;
        scorePopups.push(
          createScorePopup(nextState.playerX, nextState.playerY - 8, 0, "buff", "奥特曼支援"),
        );
        message = "吃到奥特曼技能包，奥特曼降临战场支援。";
      } else if (movedPack.kind === "wukong") {
        nextState.wukongGuardMs = Math.max(nextState.wukongGuardMs, WUKONG_GUARD_DURATION_MS);
        scorePopups.push(
          createScorePopup(nextState.playerX, nextState.playerY - 8, 0, "buff", "悟空护体"),
        );
        message = "吃到孙悟空技能包，金箍棒护罩守住傻猫饼干 10 秒。";
      } else {
        nextState.freezeWorldMs = Math.max(nextState.freezeWorldMs, FREEZE_WORLD_DURATION_MS);
        scorePopups.push(
          createScorePopup(nextState.playerX, nextState.playerY - 8, 0, "buff", "冰封世界"),
        );
        message = "吃到冰冻技能包，阿凡提的世界被冻结 5 秒。";
      }
      return;
    }

    if (movedPack.y < STAGE_HEIGHT + 8) {
      remainingSkillPacks.push(movedPack);
    }
  });

  nextState.skillPacks = remainingSkillPacks;

  if (nextState.ultramanAssistMs > 0 && activeWorldStepMs > 0 && nextState.ultramanShotCooldownMs <= 0) {
    const ultramanAnchor = getUltramanAnchor(nextState);
    let beamTargetX = currentSunVisual.x;
    let beamTargetY = currentSunVisual.y;

    if (nextState.enemyProjectiles.length > 0) {
      let nearestIndex = 0;
      let nearestDistance = Number.POSITIVE_INFINITY;

      nextState.enemyProjectiles.forEach((projectile, index) => {
        const distance = getProjectileDistance(ultramanAnchor.x, ultramanAnchor.y, projectile.x, projectile.y);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          nearestIndex = index;
        }
      });

      const [destroyedProjectile] = nextState.enemyProjectiles.splice(nearestIndex, 1);

      if (destroyedProjectile) {
        beamTargetX = destroyedProjectile.x;
        beamTargetY = destroyedProjectile.y;
        nextState.score += 42;
        scorePopups.push(createScorePopup(destroyedProjectile.x, destroyedProjectile.y, 42, "impact", "奥特扫清"));
        message = "奥特曼优先锁定怪物，先清场再压阿凡提。";
      }
    } else {
      const ultramanDamage = nextState.sunStage === 3 ? 18 : 14;
      sunHp = Math.max(0, sunHp - ultramanDamage);
      nextState.sunHp = sunHp;
      scorePopups.push(
        createScorePopup(currentSunVisual.x, currentSunVisual.y, ultramanDamage * 6, "impact", "奥特光线"),
      );
      message = "奥特曼清场完成，斯派修姆光线直击阿凡提。";
    }

    nextState.ultramanShotCooldownMs = ULTRAMAN_SHOT_INTERVAL_MS;
    nextState.ultramanBeam = {
      ttlMs: 220,
      fromX: ultramanAnchor.x,
      fromY: ultramanAnchor.y,
      toX: beamTargetX,
      toY: beamTargetY,
    };
  }

  const resolvedStage = resolveSunStage(sunHp, nextState.maxSunHp);

  if (resolvedStage !== nextState.sunStage) {
    nextState.sunStage = resolvedStage;
    nextState.playerY = clamp(nextState.playerY, getPlayerCeilingY(nextState), PLAYER_Y);
    nextState.sunShieldMs = 920;
    nextState.screenShakeMs = 320;
    nextState.impactMs = 260;
    nextState.score += resolvedStage * 120;
    nextState.message = STAGE_MESSAGES[resolvedStage];
    nextState.attackCooldownMs = Math.min(nextState.attackCooldownMs, 200);
    stageChanged = true;
  }

  if (activeWorldStepMs > 0 && nextState.attackCooldownMs <= 0) {
    nextState.enemyProjectiles = [
      ...nextState.enemyProjectiles,
      ...createEnemyVolley(nextState),
    ];
    nextState.attackCooldownMs = getAttackInterval(nextState.sunStage);
    message =
      nextState.sunStage === 3
        ? "阿凡提放出反弹怪物潮，并夹带双重紫外线箭。"
        : "阿凡提吐出怪物，同时射出紫外线箭。";
  }

  const remainingEnemyProjectiles: EnemyProjectileState[] = [];
  let playerHp = nextState.playerHp;
  let hitsTaken = nextState.hitsTaken;

  nextState.enemyProjectiles.forEach((projectile) => {
    const movedProjectile = {
      ...projectile,
      x: projectile.x + (projectile.vx * activeWorldStepMs) / 1000,
      y: projectile.y + (projectile.vy * activeWorldStepMs) / 1000,
      ttlMs: projectile.ttlMs - activeWorldStepMs,
      ageMs: projectile.ageMs + activeWorldStepMs,
    };

    if (movedProjectile.ttlMs <= 0) {
      return;
    }

    const minX = 5 + movedProjectile.radius * 0.45;
    const maxX = STAGE_WIDTH - 5 - movedProjectile.radius * 0.45;
    const minY = 7 + movedProjectile.radius * 0.45;
    const maxY = STAGE_HEIGHT - 6 - movedProjectile.radius * 0.45;
    let reflectedProjectile = movedProjectile;
    let ricocheted = false;

    if (reflectedProjectile.x <= minX || reflectedProjectile.x >= maxX) {
      reflectedProjectile = {
        ...reflectedProjectile,
        x: clamp(reflectedProjectile.x, minX, maxX),
        vx: round(-reflectedProjectile.vx * 0.98),
        ricochetsLeft: reflectedProjectile.ricochetsLeft - 1,
      };
      ricocheted = true;
    }

    if (reflectedProjectile.y <= minY || reflectedProjectile.y >= maxY) {
      reflectedProjectile = {
        ...reflectedProjectile,
        y: clamp(reflectedProjectile.y, minY, maxY),
        vy: round(-reflectedProjectile.vy * 0.98),
        ricochetsLeft: reflectedProjectile.ricochetsLeft - 1,
      };
      ricocheted = true;
    }

    if (reflectedProjectile.ricochetsLeft < 0) {
      return;
    }

    const hitPlayer =
      getProjectileDistance(reflectedProjectile.x, reflectedProjectile.y, nextState.playerX, nextState.playerY) <=
      PLAYER_RADIUS + reflectedProjectile.radius + (reflectedProjectile.pattern === "pulse" ? 3.5 : 0);

    const blockedByWukong =
      nextState.wukongGuardMs > 0 &&
      getProjectileDistance(reflectedProjectile.x, reflectedProjectile.y, nextState.playerX, nextState.playerY) <=
        WUKONG_GUARD_RADIUS + reflectedProjectile.radius + (reflectedProjectile.pattern === "pulse" ? 1.4 : 0);

    if (blockedByWukong) {
      enemyBursts.push({
        id: `enemy-burst-guard-${reflectedProjectile.id}-${elapsedMs}`,
        x: reflectedProjectile.x,
        y: reflectedProjectile.y,
        ttlMs: 360,
        monster: reflectedProjectile.monster,
        variant: "wukong-guard",
      });
      scorePopups.push(
        createScorePopup(reflectedProjectile.x, reflectedProjectile.y, 0, "buff", "金箍格挡"),
      );
      message = "孙悟空挥动金箍棒，360 度护罩震碎来袭怪物。";
      return;
    }

    if (hitPlayer) {
      playerHp = Math.max(0, playerHp - reflectedProjectile.damage);
      hitsTaken += 1;
      nextState.combo = 0;
      nextState.screenShakeMs = 320;
      nextState.impactMs = 220;
      message =
        reflectedProjectile.pattern === "pulse"
          ? "反弹怪潮撞上傻猫饼干，立刻换位。"
          : "乱窜怪物擦中傻猫饼干，别停。";
      return;
    }

    if (ricocheted && reflectedProjectile.pattern === "pulse") {
      message = "怪物在四周反弹，注意它们的回弹路线。";
    }

    const shouldClone =
      activeWorldStepMs > 0 &&
      !reflectedProjectile.hasCloned &&
      reflectedProjectile.ageMs >= ENEMY_CLONE_DELAY_MS &&
      reflectedProjectile.ttlMs > 0;

    if (shouldClone) {
      remainingEnemyProjectiles.push(
        createClonedEnemyProjectile(nextState, reflectedProjectile),
      );
      reflectedProjectile = {
        ...reflectedProjectile,
        hasCloned: true,
      };
      message = "阿凡提的怪物在 1 秒后完成分裂。";
    }

    if (reflectedProjectile.ttlMs > 0) {
      remainingEnemyProjectiles.push(reflectedProjectile);
    }
  });

  nextState.enemyProjectiles = remainingEnemyProjectiles;
  nextState.playerHp = playerHp;
  nextState.hitsTaken = hitsTaken;
  nextState.accuracy = updateAccuracy(nextState.shotsFired, nextState.shotsHit);
  nextState.scorePopups = scorePopups;

  if (!stageChanged) {
    nextState.message = message;
  }

  if (nextState.sunHp <= 0) {
    nextState.phase = "victory";
    nextState.impactMs = 520;
    nextState.screenShakeMs = 600;
    nextState.message = "阿凡提倒下，战斗结束。";
    nextState.accuracy = updateAccuracy(nextState.shotsFired, nextState.shotsHit);
    return nextState;
  }

  if (nextState.playerHp <= 0) {
    nextState.phase = "defeat";
    nextState.message = "傻猫饼干过热倒下，再试一次。";
    nextState.accuracy = updateAccuracy(nextState.shotsFired, nextState.shotsHit);
  }

  return nextState;
}
