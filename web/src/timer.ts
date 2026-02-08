export class QuizTimer {
  private startTime: number | null = null;
  private elapsed = 0;

  start() {
    this.startTime = Date.now();
  }

  stop() {
    if (this.startTime) {
      this.elapsed += Date.now() - this.startTime;
      this.startTime = null;
    }
  }

  reset() {
    this.startTime = null;
    this.elapsed = 0;
  }

  getElapsedMs() {
    if (this.startTime) {
      return this.elapsed + (Date.now() - this.startTime);
    }
    return this.elapsed;
  }

  getElapsedDisplay() {
    const totalSeconds = Math.floor(this.getElapsedMs() / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }
}
