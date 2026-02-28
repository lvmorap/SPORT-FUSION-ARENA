export class InputManager {
  private keys: Map<string, boolean> = new Map();
  private justPressed: Map<string, boolean> = new Map();

  public constructor() {
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      if (!this.keys.get(e.code)) {
        this.justPressed.set(e.code, true);
      }
      this.keys.set(e.code, true);
      e.preventDefault();
    });
    window.addEventListener('keyup', (e: KeyboardEvent) => {
      this.keys.set(e.code, false);
      e.preventDefault();
    });
  }

  public isDown(code: string): boolean {
    return this.keys.get(code) === true;
  }

  public wasPressed(code: string): boolean {
    return this.justPressed.get(code) === true;
  }

  public clearJustPressed(): void {
    this.justPressed.clear();
  }

  public reset(): void {
    this.keys.clear();
    this.justPressed.clear();
  }
}
