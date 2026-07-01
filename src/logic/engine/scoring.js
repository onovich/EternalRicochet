export class ComboState {
  constructor(config) {
    this.config = config;
    this.reset();
  }

  reset() {
    this.killCount = 0;
    this.multiplier = 1;
  }

  recordKill(baseScore) {
    this.killCount += 1;
    this.multiplier = Math.min(
      this.config.maxMultiplier,
      1 + (this.killCount - 1) * this.config.multiplierStep,
    );

    return {
      baseScore,
      killCount: this.killCount,
      multiplier: this.multiplier,
      points: baseScore * this.multiplier,
    };
  }

  getHudState() {
    return {
      killCount: this.killCount,
      multiplier: this.multiplier,
      visible: this.killCount >= this.config.visibleKillCount,
    };
  }
}

