import { ModeConfig, WinnerType, GameData } from '../types';

export class Overlay {
  private container: HTMLElement;

  public constructor() {
    const el = document.getElementById('ui-overlay');
    if (!el) {
      throw new Error('ui-overlay not found');
    }
    this.container = el;
  }

  public clear(): void {
    this.container.innerHTML = '';
  }

  public showMenu(onStart: () => void): void {
    this.container.innerHTML = `
      <div class="overlay-screen">
        <div class="overlay-title">SPORT FUSION</div>
        <div class="overlay-title" style="font-size:40px;margin-top:-10px;">ARENA 3D</div>
        <div class="overlay-subtitle">5 deportes reinventados en 3 dimensiones</div>
        <button class="overlay-btn" id="start-btn">COMENZAR</button>
        <div style="margin-top:30px;font-size:13px;color:rgba(255,255,255,0.4);letter-spacing:2px;font-family:'Rajdhani',sans-serif;">
          P1: WASD + F/G &nbsp;&nbsp;|&nbsp;&nbsp; P2: FLECHAS + SHIFT/ENTER
        </div>
      </div>
    `;
    const btn = document.getElementById('start-btn');
    if (btn) {
      btn.addEventListener('click', onStart);
    }
  }

  public showModeIntro(config: ModeConfig, modeIndex: number, onReady: () => void): void {
    this.container.innerHTML = `
      <div class="overlay-screen mode-intro">
        <div style="font-size:12px;color:rgba(255,255,255,0.4);letter-spacing:4px;margin-bottom:20px;">
          MODO ${modeIndex + 1} DE 5
        </div>
        <div class="mode-icon">${config.icon}</div>
        <div class="mode-name">${config.displayName}</div>
        <div class="mode-desc">${config.description}</div>
        <div class="mode-desc" style="color:rgba(255,255,255,0.5);">
          ⏱️ ${config.duration} segundos
        </div>
        <div class="mode-controls">
          P1: WASD + F/G &nbsp;&nbsp;|&nbsp;&nbsp; P2: FLECHAS + SHIFT/ENTER
        </div>
      </div>
    `;
    setTimeout(onReady, 4000);
  }

  public showCountdown(num: number): void {
    this.container.innerHTML = `<div class="countdown">${num > 0 ? num : '¡GO!'}</div>`;
  }

  public showHUD(modeName: string): void {
    this.container.innerHTML = `
      <div class="hud">
        <div class="hud-left">
          <div class="hud-label">JUGADOR 1</div>
          <div class="hud-score p1" id="score-p1">0</div>
        </div>
        <div class="hud-center">
          <div class="hud-mode">${modeName}</div>
          <div class="hud-timer" id="timer">60</div>
        </div>
        <div class="hud-right" style="text-align:right;">
          <div class="hud-label">JUGADOR 2</div>
          <div class="hud-score p2" id="score-p2">0</div>
        </div>
      </div>
      <div class="tournament-bar" id="tournament-bar"></div>
    `;
  }

  public updateScore(p1: number, p2: number): void {
    const s1 = document.getElementById('score-p1');
    const s2 = document.getElementById('score-p2');
    if (s1) {
      s1.textContent = String(p1);
    }
    if (s2) {
      s2.textContent = String(p2);
    }
  }

  public updateTimer(seconds: number): void {
    const t = document.getElementById('timer');
    if (t) {
      t.textContent = String(Math.max(0, Math.ceil(seconds)));
    }
  }

  public showF1HUD(modeName: string): void {
    this.container.innerHTML = `
      <div class="hud">
        <div class="hud-left">
          <div class="hud-label">JUGADOR 1</div>
          <div class="hud-score p1" id="score-p1">Vuelta 0/3</div>
          <div class="f1-power p1" id="power-p1"></div>
        </div>
        <div class="hud-center">
          <div class="hud-mode">${modeName}</div>
          <div class="hud-timer" id="timer">120</div>
        </div>
        <div class="hud-right" style="text-align:right;">
          <div class="hud-label">JUGADOR 2</div>
          <div class="hud-score p2" id="score-p2">Vuelta 0/3</div>
          <div class="f1-power p2" id="power-p2"></div>
        </div>
      </div>
      <div class="tournament-bar" id="tournament-bar"></div>
    `;
  }

  public updateF1Laps(p1Laps: number, p2Laps: number, maxLaps: number): void {
    const s1 = document.getElementById('score-p1');
    const s2 = document.getElementById('score-p2');
    if (s1) {
      s1.textContent = `Vuelta ${p1Laps}/${maxLaps}`;
    }
    if (s2) {
      s2.textContent = `Vuelta ${p2Laps}/${maxLaps}`;
    }
  }

  public updateF1Powers(p1Power: string, p2Power: string): void {
    const pw1 = document.getElementById('power-p1');
    const pw2 = document.getElementById('power-p2');
    if (pw1) {
      pw1.textContent = p1Power;
    }
    if (pw2) {
      pw2.textContent = p2Power;
    }
  }

  public showResult(
    winner: WinnerType,
    scoreP1: number,
    scoreP2: number,
    modeName: string,
    onNext: () => void
  ): void {
    const winnerClass = winner === 'P1' ? 'p1' : winner === 'P2' ? 'p2' : 'draw';
    const winnerText =
      winner === 'P1' ? '¡JUGADOR 1 GANA!' : winner === 'P2' ? '¡JUGADOR 2 GANA!' : '¡EMPATE!';
    this.container.innerHTML = `
      <div class="overlay-screen">
        <div style="font-size:14px;color:rgba(255,255,255,0.4);letter-spacing:4px;margin-bottom:20px;">
          ${modeName}
        </div>
        <div class="result-winner ${winnerClass}">${winnerText}</div>
        <div class="result-scores">${scoreP1} — ${scoreP2}</div>
        <button class="overlay-btn" id="next-btn">SIGUIENTE</button>
      </div>
    `;
    const btn = document.getElementById('next-btn');
    if (btn) {
      btn.addEventListener('click', onNext);
    }
  }

  public showFinal(data: GameData, onRestart: () => void): void {
    const champion =
      data.winsP1 > data.winsP2 ? 'JUGADOR 1' : data.winsP2 > data.winsP1 ? 'JUGADOR 2' : 'EMPATE';
    const champClass = data.winsP1 > data.winsP2 ? 'p1' : data.winsP2 > data.winsP1 ? 'p2' : 'draw';
    let resultsHtml = '';
    for (const r of data.results) {
      const w = r.winner === 'P1' ? '🔵 J1' : r.winner === 'P2' ? '🔴 J2' : '🟡 Empate';
      resultsHtml += `${r.mode.toUpperCase()}: ${w} (${r.scoreP1} - ${r.scoreP2})<br/>`;
    }
    this.container.innerHTML = `
      <div class="overlay-screen">
        <div class="final-trophy">🏆</div>
        <div class="final-title">¡${champion} ES EL CAMPEÓN!</div>
        <div class="result-winner ${champClass}" style="font-size:36px;">${data.winsP1} — ${data.winsP2}</div>
        <div class="final-results">${resultsHtml}</div>
        <button class="overlay-btn" id="restart-btn">JUGAR DE NUEVO</button>
      </div>
    `;
    const btn = document.getElementById('restart-btn');
    if (btn) {
      btn.addEventListener('click', onRestart);
    }
  }
}
