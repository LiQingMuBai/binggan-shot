import { describe, expect, it } from "vitest";

import {
  PLAYER_Y,
  advanceGame,
  createPlayingRuntime,
  getSunVisual,
  releaseCharge,
  resolveRecord,
  resolveSunStage,
  setPlayerAim,
} from "@/utils/gameLoop";

describe("gameLoop", () => {
  it("creates a projectile when charge is released", () => {
    const runtime = {
      ...createPlayingRuntime(),
      isCharging: true,
      charge: 64,
    };

    const nextRuntime = releaseCharge(runtime);

    expect(nextRuntime.projectiles).toHaveLength(1);
    expect(nextRuntime.shotsFired).toBe(1);
    expect(nextRuntime.charge).toBe(0);
    expect(nextRuntime.cooldownMs).toBeGreaterThan(0);
  });

  it("fires double arrows when the double-arrow boost is active", () => {
    const runtime = {
      ...createPlayingRuntime(),
      isCharging: true,
      charge: 64,
      doubleArrowMs: 3000,
    };

    const nextRuntime = releaseCharge(runtime);

    expect(nextRuntime.projectiles).toHaveLength(2);
    expect(nextRuntime.shotsFired).toBe(2);
  });

  it("keeps the cloud flight below the sun", () => {
    const runtime = {
      ...createPlayingRuntime(),
      elapsedMs: 1600,
    };

    const nextRuntime = setPlayerAim(runtime, runtime.playerX, 4);
    const sunVisual = getSunVisual(runtime);

    expect(nextRuntime.playerY).toBeGreaterThan(sunVisual.y + sunVisual.radius);
    expect(nextRuntime.playerY).toBeLessThanOrEqual(PLAYER_Y);
  });

  it("advances to victory when a projectile finishes the sun", () => {
    const runtime = createPlayingRuntime();
    const sunVisual = getSunVisual(runtime);
    const nextRuntime = advanceGame(
      {
        ...runtime,
        sunHp: 10,
        sunStage: resolveSunStage(10, runtime.maxSunHp),
        projectiles: [
          {
            id: "finisher",
            x: sunVisual.x,
            y: sunVisual.y,
            vx: 0,
            vy: 0,
            damage: 40,
            radius: 4,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.phase).toBe("victory");
    expect(nextRuntime.sunHp).toBe(0);
    expect(nextRuntime.shotsHit).toBe(1);
  });

  it("spawns collectible fragments when the sun is hit", () => {
    const runtime = createPlayingRuntime();
    const sunVisual = getSunVisual(runtime);
    const nextRuntime = advanceGame(
      {
        ...runtime,
        projectiles: [
          {
            id: "drop-shot",
            x: sunVisual.x,
            y: sunVisual.y,
            vx: 0,
            vy: 0,
            damage: 36,
            radius: 3.2,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.sunDrops.length).toBeGreaterThan(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "impact")).toBe(true);
  });

  it("damages the player when a fireball connects", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        enemyProjectiles: [
          {
            id: "impact",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 3,
            pattern: "fireball",
            monster: "zombie",
            ttlMs: 3000,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 4,
            damage: 18,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.playerHp).toBe(82);
    expect(nextRuntime.hitsTaken).toBe(1);
    expect(nextRuntime.combo).toBe(0);
  });

  it("lets the player arrows destroy monster projectiles", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        projectiles: [
          {
            id: "anti-monster",
            x: 46,
            y: 60,
            vx: 0,
            vy: 0,
            damage: 24,
            radius: 2.2,
          },
        ],
        enemyProjectiles: [
          {
            id: "monster-target",
            x: 46,
            y: 60,
            vx: 0,
            vy: 0,
            radius: 2.6,
            pattern: "fireball",
            monster: "zombie",
            ttlMs: 2000,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 12,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.projectiles).toHaveLength(0);
    expect(nextRuntime.enemyProjectiles).toHaveLength(0);
    expect(nextRuntime.enemyBursts).toHaveLength(1);
    expect(nextRuntime.enemyBursts[0].monster).toBe("zombie");
    expect(nextRuntime.score).toBe(62);
    expect(nextRuntime.scorePopups.some((popup) => popup.label === "破怪 +62")).toBe(true);
  });

  it("grants different score for different monster kills", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        projectiles: [
          {
            id: "anti-creeper",
            x: 40,
            y: 54,
            vx: 0,
            vy: 0,
            damage: 24,
            radius: 2.2,
          },
        ],
        enemyProjectiles: [
          {
            id: "creeper-target",
            x: 40,
            y: 54,
            vx: 0,
            vy: 0,
            radius: 2.8,
            pattern: "fireball",
            monster: "creeper",
            ttlMs: 2000,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 12,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.score).toBe(88);
    expect(nextRuntime.scorePopups.some((popup) => popup.label === "破怪 +88")).toBe(true);
  });

  it("spawns monster projectiles and ultraviolet bolts when the sun attacks", () => {
    const runtime = {
      ...createPlayingRuntime(),
      elapsedMs: 1200,
      sunHp: 180,
      sunStage: 3 as const,
      attackCooldownMs: 0,
    };

    const nextRuntime = advanceGame(runtime, 16);

    expect(nextRuntime.enemyProjectiles.length).toBeGreaterThan(0);
    expect(nextRuntime.enemyProjectiles.every((projectile) => projectile.monster)).toBe(true);
    expect(nextRuntime.enemyProjectiles.some((projectile) => projectile.pattern === "uv")).toBe(true);
    expect(nextRuntime.enemyProjectiles.filter((projectile) => projectile.pattern === "uv")).toHaveLength(2);
  });

  it("clones a monster projectile after 1 second", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        elapsedMs: 1000,
        worldElapsedMs: 1000,
        enemyProjectiles: [
          {
            id: "clone-me",
            x: 42,
            y: 36,
            vx: 26,
            vy: 8,
            radius: 2.2,
            pattern: "fireball",
            monster: "zombie",
            ttlMs: 1800,
            ageMs: 990,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 12,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.enemyProjectiles).toHaveLength(2);
    expect(nextRuntime.enemyProjectiles.some((projectile) => projectile.id.includes("clone"))).toBe(true);
    expect(nextRuntime.enemyProjectiles.filter((projectile) => projectile.hasCloned)).toHaveLength(2);
  });

  it("ricochets monster projectiles off the arena walls", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        enemyProjectiles: [
          {
            id: "bounce-left",
            x: 5.2,
            y: 46,
            vx: -42,
            vy: -36,
            radius: 2.6,
            pattern: "fireball",
            monster: "creeper",
            ttlMs: 3000,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 4,
            damage: 12,
          },
        ],
      },
      32,
    );

    expect(nextRuntime.enemyProjectiles).toHaveLength(1);
    expect(nextRuntime.enemyProjectiles[0].vx).toBeGreaterThan(0);
    expect(nextRuntime.enemyProjectiles[0].ricochetsLeft).toBe(3);
  });

  it("collects sun fragments and grants bonus score", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        sunDrops: [
          {
            id: "loot",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.4,
            value: 88,
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.score).toBe(88);
    expect(nextRuntime.sunDrops).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "loot" && popup.value === 88)).toBe(true);
  });

  it("collects a speed pack and grants movement boost", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        skillPacks: [
          {
            id: "speed-pack",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.8,
            kind: "speed",
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.speedBoostMs).toBeGreaterThan(0);
    expect(nextRuntime.skillPacks).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "buff" && popup.label === "疾风提速")).toBe(true);
  });

  it("collects a double-arrow pack and grants dual-shot boost", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        skillPacks: [
          {
            id: "double-pack",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.8,
            kind: "double",
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.doubleArrowMs).toBeGreaterThan(0);
    expect(nextRuntime.skillPacks).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "buff" && popup.label === "双箭齐发")).toBe(true);
  });

  it("collects a freeze pack and freezes the world for 5 seconds", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        skillPacks: [
          {
            id: "freeze-pack",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.8,
            kind: "freeze",
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.freezeWorldMs).toBeGreaterThanOrEqual(4980);
    expect(nextRuntime.skillPacks).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "buff" && popup.label === "冰封世界")).toBe(true);
  });

  it("collects an ultraman pack and starts support mode", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        skillPacks: [
          {
            id: "ultraman-pack",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.8,
            kind: "ultraman",
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.ultramanAssistMs).toBeGreaterThan(7000);
    expect(nextRuntime.ultramanEntryMs).toBeGreaterThan(900);
    expect(nextRuntime.ultramanShotCooldownMs).toBeGreaterThan(1000);
    expect(nextRuntime.skillPacks).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "buff" && popup.label === "奥特曼支援")).toBe(true);
  });

  it("collects a wukong pack and starts the 10-second guard shield", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        skillPacks: [
          {
            id: "wukong-pack",
            x: runtime.playerX,
            y: PLAYER_Y,
            vx: 0,
            vy: 0,
            radius: 2.8,
            kind: "wukong",
            spin: 0,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.wukongGuardMs).toBeGreaterThanOrEqual(9980);
    expect(nextRuntime.skillPacks).toHaveLength(0);
    expect(nextRuntime.scorePopups.some((popup) => popup.kind === "buff" && popup.label === "悟空护体")).toBe(true);
  });

  it("lets ultraman prioritize monster projectiles before attacking the sun", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        sunHp: 400,
        ultramanAssistMs: 3000,
        ultramanEntryMs: 0,
        ultramanShotCooldownMs: 0,
        enemyProjectiles: [
          {
            id: "monster-shot",
            x: 46,
            y: 34,
            vx: 0,
            vy: 0,
            radius: 2.4,
            pattern: "fireball",
            monster: "zombie",
            ttlMs: 1800,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 12,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.sunHp).toBe(400);
    expect(nextRuntime.enemyProjectiles).toHaveLength(0);
    expect(nextRuntime.ultramanBeam).not.toBeNull();
    expect(nextRuntime.ultramanBeam?.toX).toBe(46);
    expect(nextRuntime.scorePopups.some((popup) => popup.label === "奥特扫清")).toBe(true);
  });

  it("lets ultraman attack the sun after the monsters are cleared", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        sunHp: 400,
        ultramanAssistMs: 3000,
        ultramanEntryMs: 0,
        ultramanShotCooldownMs: 0,
        enemyProjectiles: [],
      },
      16,
    );

    expect(nextRuntime.sunHp).toBeLessThan(400);
    expect(nextRuntime.scorePopups.some((popup) => popup.label === "奥特光线")).toBe(true);
    expect(Math.abs((nextRuntime.ultramanBeam?.toX ?? 0) - getSunVisual(nextRuntime).x)).toBeLessThan(1);
  });

  it("freezes world objects but keeps the player arrows moving", () => {
    const runtime = createPlayingRuntime();
    const sunVisualBefore = getSunVisual(runtime);
    const nextRuntime = advanceGame(
      {
        ...runtime,
        freezeWorldMs: 5000,
        attackCooldownMs: 0,
        projectiles: [
          {
            id: "player-shot",
            x: 42,
            y: 70,
            vx: 6,
            vy: 40,
            damage: 18,
            radius: 1.6,
          },
        ],
        enemyProjectiles: [
          {
            id: "frozen-enemy",
            x: 55,
            y: 34,
            vx: 28,
            vy: 10,
            radius: 2.4,
            pattern: "fireball",
            monster: "zombie",
            ttlMs: 1800,
            ageMs: 1200,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 12,
          },
        ],
        sunDrops: [
          {
            id: "frozen-drop",
            x: 44,
            y: 50,
            vx: 20,
            vy: 14,
            radius: 2.1,
            value: 66,
            spin: 0.4,
          },
        ],
        skillPacks: [
          {
            id: "frozen-pack",
            x: 58,
            y: 46,
            vx: -18,
            vy: 12,
            radius: 2.8,
            kind: "speed",
            spin: 0.3,
          },
        ],
        scorePopups: [
          {
            id: "frozen-popup",
            x: 52,
            y: 42,
            value: 20,
            ttlMs: 760,
            kind: "impact",
            label: "+20",
          },
        ],
      },
      16,
    );
    const sunVisualAfter = getSunVisual(nextRuntime);

    expect(nextRuntime.worldElapsedMs).toBe(runtime.worldElapsedMs);
    expect(sunVisualAfter.x).toBe(sunVisualBefore.x);
    expect(sunVisualAfter.y).toBe(sunVisualBefore.y);
    expect(nextRuntime.projectiles[0].y).toBeLessThan(70);
    expect(nextRuntime.enemyProjectiles[0].x).toBe(55);
    expect(nextRuntime.enemyProjectiles[0].ageMs).toBe(1200);
    expect(nextRuntime.enemyProjectiles).toHaveLength(1);
    expect(nextRuntime.sunDrops[0].x).toBe(44);
    expect(nextRuntime.skillPacks[0].y).toBe(46);
    expect(nextRuntime.scorePopups[0].y).toBe(42);
    expect(nextRuntime.attackCooldownMs).toBe(0);
  });

  it("lets the wukong shield block enemy projectiles around the player", () => {
    const runtime = createPlayingRuntime();
    const nextRuntime = advanceGame(
      {
        ...runtime,
        wukongGuardMs: 10000,
        enemyProjectiles: [
          {
            id: "shield-hit",
            x: runtime.playerX + 2,
            y: runtime.playerY - 2,
            vx: 0,
            vy: 0,
            radius: 2.4,
            pattern: "uv",
            monster: "skeleton",
            ttlMs: 1800,
            ageMs: 0,
            hasCloned: false,
            ricochetsLeft: 5,
            damage: 14,
          },
        ],
      },
      16,
    );

    expect(nextRuntime.playerHp).toBe(100);
    expect(nextRuntime.enemyProjectiles).toHaveLength(0);
    expect(nextRuntime.enemyBursts).toHaveLength(1);
    expect(nextRuntime.enemyBursts[0].variant).toBe("wukong-guard");
    expect(nextRuntime.scorePopups.some((popup) => popup.label === "金箍格挡")).toBe(true);
  });

  it("updates local records from a completed run", () => {
    const record = resolveRecord({
      ...createPlayingRuntime({
        bestScore: 400,
        bestCombo: 3,
        bestTimeMs: 23000,
      }),
      phase: "victory",
      score: 960,
      combo: 9,
      elapsedMs: 18000,
    });

    expect(record.bestScore).toBe(960);
    expect(record.bestCombo).toBe(9);
    expect(record.bestTimeMs).toBe(18000);
  });
});
