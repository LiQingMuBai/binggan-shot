import { act } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import SunStrikePage from "@/pages/SunStrikePage";
import { useGameStore } from "@/store/useGameStore";
import { createIdleRuntime } from "@/utils/gameLoop";

describe("SunStrikePage", () => {
  beforeEach(() => {
    window.localStorage.clear();

    act(() => {
      useGameStore.setState(createIdleRuntime());
    });
  });

  it("starts the game from the home overlay", () => {
    render(<SunStrikePage />);

    const startButton = screen.getByRole("button", { name: "开始发射" });

    fireEvent.click(startButton);

    expect(screen.queryByRole("button", { name: "开始发射" })).not.toBeInTheDocument();
    expect(screen.getByText("阿凡提")).toBeInTheDocument();
    expect(screen.getByTestId("battlefield")).toBeInTheDocument();
  });

  it("supports charging with the S key", () => {
    render(<SunStrikePage />);

    fireEvent.click(screen.getByRole("button", { name: "开始发射" }));
    fireEvent.keyDown(window, { code: "KeyS" });

    expect(screen.getByText("蓄能中")).toBeInTheDocument();

    fireEvent.keyUp(window, { code: "KeyS" });

    expect(screen.queryByText("蓄能中")).not.toBeInTheDocument();
  });
});
