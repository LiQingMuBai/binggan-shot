import { create } from "zustand";

import {
  advanceGame,
  beginCharge,
  cancelCharge,
  createIdleRuntime,
  createPlayingRuntime,
  loadRecord,
  releaseCharge,
  resolveRecord,
  saveRecord,
  setPlayerAim,
  type GameRuntime,
  type LocalRecord,
} from "@/utils/gameLoop";

interface GameStore extends GameRuntime {
  hydrateRecord: () => void;
  startGame: () => void;
  restartGame: () => void;
  returnHome: () => void;
  tick: (deltaMs: number) => void;
  aimAt: (x: number) => void;
  startCharge: () => void;
  stopCharge: () => void;
  cancelShotCharge: () => void;
}

function pickRecord(state: Pick<GameRuntime, "bestScore" | "bestCombo" | "bestTimeMs">): LocalRecord {
  return {
    bestScore: state.bestScore,
    bestCombo: state.bestCombo,
    bestTimeMs: state.bestTimeMs,
  };
}

const initialRecord = loadRecord();

export const useGameStore = create<GameStore>((set, get) => ({
  ...createIdleRuntime(initialRecord),
  hydrateRecord: () => {
    const record = loadRecord();
    set({
      bestScore: record.bestScore,
      bestCombo: record.bestCombo,
      bestTimeMs: record.bestTimeMs,
    });
  },
  startGame: () => {
    set(createPlayingRuntime(pickRecord(get())));
  },
  restartGame: () => {
    set(createPlayingRuntime(pickRecord(get())));
  },
  returnHome: () => {
    set(createIdleRuntime(pickRecord(get())));
  },
  tick: (deltaMs) => {
    const currentState = get();

    if (currentState.phase !== "playing") {
      return;
    }

    const nextRuntime = advanceGame(currentState, deltaMs);

    if (nextRuntime.phase === "victory" || nextRuntime.phase === "defeat") {
      const nextRecord = resolveRecord(nextRuntime);
      saveRecord(nextRecord);
      set({
        ...nextRuntime,
        ...nextRecord,
      });
      return;
    }

    set(nextRuntime);
  },
  aimAt: (x) => {
    set(setPlayerAim(get(), x));
  },
  startCharge: () => {
    set(beginCharge(get()));
  },
  stopCharge: () => {
    set(releaseCharge(get()));
  },
  cancelShotCharge: () => {
    set(cancelCharge(get()));
  },
}));
