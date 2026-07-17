export type GamePhase = "idle" | "playing" | "victory" | "defeat";
export type SunStage = 1 | 2 | 3;
export type EnemyPattern = "fireball" | "pulse";
export type EnemyMonsterKind = "creeper" | "zombie" | "skeleton" | "slime" | "spider";
export type PowerupKind = "speed" | "double";

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
  ricochetsLeft: number;
  damage: number;
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

export interface LocalRecord {
  bestScore: number;
  bestCombo: number;
  bestTimeMs: number | null;
}

export interface GameRuntime extends LocalRecord {
  phase: GamePhase;
  elapsedMs: number;
  playerX: number;
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
  sunDrops: SunDropState[];
  skillPacks: SkillPackState[];
  scorePopups: ScorePopupState[];
  speedBoostMs: number;
  doubleArrowMs: number;
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
const PROJECTILE_START_Y = 82;
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

export function getSunVisual(runtime: Pick<GameRuntime, "elapsedMs" | "sunStage">): SunVisual {
  const speed = 0.00078 + runtime.sunStage * 0.00018;
  const amplitude = 12 + runtime.sunStage * 3.5;

  return {
    x: 50 + Math.sin(runtime.elapsedMs * speed) * amplitude,
    y: 17 + Math.cos(runtime.elapsedMs * 0.0009) * 1.8,
    radius: 9.5 - (runtime.sunStage - 1) * 0.7,
  };
}

export function createIdleRuntime(record: LocalRecord = DEFAULT_RECORD): GameRuntime {
  return {
    ...record,
    phase: "idle",
    elapsedMs: 0,
    playerX: 50,
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
    sunDrops: [],
    skillPacks: [],
    scorePopups: [],
    speedBoostMs: 0,
    doubleArrowMs: 0,
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

export function setPlayerAim(runtime: GameRuntime, x: number): GameRuntime {
  return {
    ...runtime,
    playerX: clamp(x, 8, 92),
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
    y: PROJECTILE_START_Y,
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
    return 1250;
  }

  if (stage === 2) {
    return 980;
  }

  return 760;
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
  return {
    id: options.id,
    x: round(options.x),
    y: round(options.y),
    vx: round(Math.cos(options.angleRad) * options.speed),
    vy: round(Math.sin(options.angleRad) * options.speed),
    radius: round(options.radius),
    pattern: options.pattern,
    monster: options.monster,
    ttlMs: options.pattern === "pulse" ? 4600 : 4000 + runtime.sunStage * 260,
    ricochetsLeft: options.pattern === "pulse" ? 8 : 6 + runtime.sunStage,
    damage: options.damage,
  };
}

function createEnemyVolley(runtime: GameRuntime): EnemyProjectileState[] {
  const sunVisual = getSunVisual(runtime);
  const spreadSeed = Math.sin(runtime.elapsedMs / 190 + runtime.sunStage * 1.7);
  const baseAngle = Math.atan2(PLAYER_Y - sunVisual.y, runtime.playerX - sunVisual.x);
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
    speed: 28 + runtime.sunStage * 4.4,
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
    speed: 24 + runtime.sunStage * 4.2,
    radius: 1.8 + runtime.sunStage * 0.35,
    pattern: runtime.sunStage === 3 ? "pulse" : "fireball",
    monster: runtime.sunStage === 3 ? "slime" : runtime.sunStage === 2 ? "spider" : "creeper",
    damage: runtime.sunStage === 3 ? 18 : 9,
  });

  return [primary, side];
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
  const kind: PowerupKind = kindRoll > 0.5 ? "double" : "speed";

  return [
    {
      id: `skill-${runtime.elapsedMs}-${kind}`,
      x: round(impactX + (kind === "double" ? 2.4 : -2.2)),
      y: round(impactY + 1.4),
      vx: round((runtime.playerX - impactX) * 0.08 + (kind === "double" ? 8 : -8)),
      vy: round(16 + runtime.sunStage * 4.2),
      radius: 2.8,
      kind,
      spin: round(kind === "double" ? 0.9 : -0.7),
    },
  ];
}

export function advanceGame(runtime: GameRuntime, deltaMs: number): GameRuntime {
  if (runtime.phase !== "playing") {
    return runtime;
  }

  const stepMs = clamp(deltaMs, 8, 32);
  const elapsedMs = runtime.elapsedMs + stepMs;
  const cooldownMs = Math.max(0, runtime.cooldownMs - stepMs);
  const charge = runtime.isCharging
    ? clamp(runtime.charge + stepMs * CHARGE_PER_MS, 0, 100)
    : runtime.charge;

  const nextState: GameRuntime = {
    ...runtime,
    elapsedMs,
    cooldownMs,
    charge,
    sunShieldMs: Math.max(0, runtime.sunShieldMs - stepMs),
    impactMs: Math.max(0, runtime.impactMs - stepMs),
    screenShakeMs: Math.max(0, runtime.screenShakeMs - stepMs),
    speedBoostMs: Math.max(0, runtime.speedBoostMs - stepMs),
    doubleArrowMs: Math.max(0, runtime.doubleArrowMs - stepMs),
    attackCooldownMs: runtime.attackCooldownMs - stepMs,
    accuracy: updateAccuracy(runtime.shotsFired, runtime.shotsHit),
  };

  const currentSunVisual = getSunVisual(nextState);
  const remainingProjectiles: ProjectileState[] = [];
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
      y: popup.y - (popup.kind === "loot" ? 7.2 : 5.4) * (stepMs / 1000),
      ttlMs: popup.ttlMs - stepMs,
    };

    if (movedPopup.ttlMs > 0) {
      scorePopups.push(movedPopup);
    }
  });

  nextState.projectiles.forEach((projectile) => {
    const movedProjectile = {
      ...projectile,
      x: projectile.x + (projectile.vx * stepMs) / 1000,
      y: projectile.y - (projectile.vy * stepMs) / 1000,
    };

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
  nextState.sunHp = sunHp;
  nextState.score = score;
  nextState.combo = combo;
  nextState.shotsHit = shotsHit;

  const remainingSunDrops: SunDropState[] = [];
  nextState.sunDrops.forEach((drop) => {
    const movedDrop = {
      ...drop,
      x: drop.x + ((drop.vx + (nextState.playerX - drop.x) * 0.2) * stepMs) / 1000,
      y: drop.y + (drop.vy * stepMs) / 1000,
      spin: drop.spin + stepMs * 0.014,
    };

    const collected =
      getProjectileDistance(movedDrop.x, movedDrop.y, nextState.playerX, PLAYER_Y) <=
      PLAYER_RADIUS + movedDrop.radius + 2;

    if (collected) {
      nextState.score += movedDrop.value;
      scorePopups.push(createScorePopup(nextState.playerX, PLAYER_Y - 5.4, movedDrop.value, "loot"));
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
      x: pack.x + ((pack.vx + (nextState.playerX - pack.x) * 0.18) * stepMs) / 1000,
      y: pack.y + (pack.vy * stepMs) / 1000,
      spin: pack.spin + stepMs * 0.01,
    };

    const collected =
      getProjectileDistance(movedPack.x, movedPack.y, nextState.playerX, PLAYER_Y) <=
      PLAYER_RADIUS + movedPack.radius + 2.4;

    if (collected) {
      if (movedPack.kind === "speed") {
        nextState.speedBoostMs = Math.max(nextState.speedBoostMs, 6200);
        scorePopups.push(createScorePopup(nextState.playerX, PLAYER_Y - 8, 0, "buff", "疾风提速"));
        message = "吃到疾风技能包，移动更快。";
      } else {
        nextState.doubleArrowMs = Math.max(nextState.doubleArrowMs, 6200);
        scorePopups.push(createScorePopup(nextState.playerX, PLAYER_Y - 8, 0, "buff", "双箭齐发"));
        message = "吃到双箭技能包，下一轮改为双箭。";
      }
      return;
    }

    if (movedPack.y < STAGE_HEIGHT + 8) {
      remainingSkillPacks.push(movedPack);
    }
  });

  nextState.skillPacks = remainingSkillPacks;

  const resolvedStage = resolveSunStage(sunHp, nextState.maxSunHp);

  if (resolvedStage !== nextState.sunStage) {
    nextState.sunStage = resolvedStage;
    nextState.sunShieldMs = 920;
    nextState.screenShakeMs = 320;
    nextState.impactMs = 260;
    nextState.score += resolvedStage * 120;
    nextState.message = STAGE_MESSAGES[resolvedStage];
    nextState.attackCooldownMs = Math.min(nextState.attackCooldownMs, 200);
    stageChanged = true;
  }

  if (nextState.attackCooldownMs <= 0) {
    nextState.enemyProjectiles = [
      ...nextState.enemyProjectiles,
      ...createEnemyVolley(nextState),
    ];
    nextState.attackCooldownMs = getAttackInterval(nextState.sunStage);
    message = nextState.sunStage === 3 ? "阿凡提放出四散反弹的怪物潮。" : "阿凡提吐出会乱撞的怪物。";
  }

  const remainingEnemyProjectiles: EnemyProjectileState[] = [];
  let playerHp = nextState.playerHp;
  let hitsTaken = nextState.hitsTaken;

  nextState.enemyProjectiles.forEach((projectile) => {
    const movedProjectile = {
      ...projectile,
      x: projectile.x + (projectile.vx * stepMs) / 1000,
      y: projectile.y + (projectile.vy * stepMs) / 1000,
      ttlMs: projectile.ttlMs - stepMs,
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
      getProjectileDistance(reflectedProjectile.x, reflectedProjectile.y, nextState.playerX, PLAYER_Y) <=
      PLAYER_RADIUS + reflectedProjectile.radius + (reflectedProjectile.pattern === "pulse" ? 3.5 : 0);

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
