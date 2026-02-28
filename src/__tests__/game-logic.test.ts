import { describe, it, expect } from 'vitest';

// Test F1 checkpoint logic (extracted from F1Mode)
const CHECKPOINT_COUNT = 4;
const CHECKPOINT_ANGLES: number[] = [];
for (let i = 0; i < CHECKPOINT_COUNT; i++) {
  CHECKPOINT_ANGLES.push((i * Math.PI * 2) / CHECKPOINT_COUNT);
}
const CHECKPOINT_RADIUS = 2.5;
const TRACK_CENTER_RADIUS = 15;

interface CarState {
  x: number;
  z: number;
  angle: number;
  speed: number;
  nextCheckpoint: number;
  penaltyTimer: number;
  onTrack: boolean;
}

function defaultCarState(): CarState {
  return {
    x: TRACK_CENTER_RADIUS,
    z: 0,
    angle: Math.PI / 2,
    speed: 0,
    nextCheckpoint: 1,
    penaltyTimer: 0,
    onTrack: true,
  };
}

function checkCheckpoints(state: CarState): number {
  let lapsCompleted = 0;
  const cpAngle = CHECKPOINT_ANGLES[state.nextCheckpoint];
  const cpX = Math.cos(cpAngle) * TRACK_CENTER_RADIUS;
  const cpZ = Math.sin(cpAngle) * TRACK_CENTER_RADIUS;
  const dx = state.x - cpX;
  const dz = state.z - cpZ;
  const distSq = dx * dx + dz * dz;

  if (distSq < CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
    state.nextCheckpoint++;
    if (state.nextCheckpoint >= CHECKPOINT_COUNT) {
      state.nextCheckpoint = 0;
      lapsCompleted = 1;
    }
  }
  return lapsCompleted;
}

describe('F1 checkpoint logic', () => {
  it('cars should start at nextCheckpoint 1 (not 0) to avoid auto-trigger', () => {
    const car = defaultCarState();
    expect(car.nextCheckpoint).toBe(1);
  });

  it('car at start position should NOT auto-trigger any checkpoint', () => {
    const car = defaultCarState();
    // Car starts at (TRACK_CENTER_RADIUS, 0) which is where checkpoint 0 is
    // Since nextCheckpoint is 1, checkpoint 0 should not be checked
    const laps = checkCheckpoints(car);
    expect(laps).toBe(0);
    expect(car.nextCheckpoint).toBe(1); // unchanged
  });

  it('should trigger checkpoint when car is close enough', () => {
    const car = defaultCarState();
    // Move car near checkpoint 1 (at PI/2 = top of circle)
    const cpAngle = CHECKPOINT_ANGLES[1]; // PI/2
    car.x = Math.cos(cpAngle) * TRACK_CENTER_RADIUS;
    car.z = Math.sin(cpAngle) * TRACK_CENTER_RADIUS;

    const laps = checkCheckpoints(car);
    expect(laps).toBe(0);
    expect(car.nextCheckpoint).toBe(2);
  });

  it('should complete a lap when passing all checkpoints', () => {
    const car = defaultCarState();

    // Pass checkpoints 1, 2, 3
    for (let cp = 1; cp < CHECKPOINT_COUNT; cp++) {
      const cpAngle = CHECKPOINT_ANGLES[cp];
      car.x = Math.cos(cpAngle) * TRACK_CENTER_RADIUS;
      car.z = Math.sin(cpAngle) * TRACK_CENTER_RADIUS;
      const laps = checkCheckpoints(car);
      if (cp < CHECKPOINT_COUNT - 1) {
        expect(laps).toBe(0);
      } else {
        expect(laps).toBe(1); // last checkpoint completes the lap
        expect(car.nextCheckpoint).toBe(0); // wraps to 0
      }
    }
  });

  it('should not allow skipping checkpoints', () => {
    const car = defaultCarState();
    // Car at checkpoint 3 but nextCheckpoint is 1
    const cp3Angle = CHECKPOINT_ANGLES[3];
    car.x = Math.cos(cp3Angle) * TRACK_CENTER_RADIUS;
    car.z = Math.sin(cp3Angle) * TRACK_CENTER_RADIUS;

    const laps = checkCheckpoints(car);
    expect(laps).toBe(0);
    expect(car.nextCheckpoint).toBe(1); // didn't advance
  });
});

// Test PingPong ball serve logic (extracted from PingPongMode)
const BALL_START_SPEED = 8;
const TABLE_Y = 1;
const BALL_RADIUS = 0.15;

interface BallState {
  x: number;
  y: number;
  z: number;
  vx: number;
  vz: number;
  speed: number;
}

function resetBall(serveToward: 'P1' | 'P2' | null = null): BallState {
  let direction: number;
  if (serveToward === 'P1') {
    direction = -1;
  } else if (serveToward === 'P2') {
    direction = 1;
  } else {
    direction = Math.random() < 0.5 ? -1 : 1;
  }
  const zAngle = (Math.random() - 0.5) * 0.8;

  const ballState: BallState = {
    x: 0,
    y: TABLE_Y + 0.15 + BALL_RADIUS,
    z: 0,
    vx: direction * Math.cos(zAngle),
    vz: Math.sin(zAngle),
    speed: BALL_START_SPEED,
  };

  const len = Math.sqrt(ballState.vx ** 2 + ballState.vz ** 2);
  ballState.vx /= len;
  ballState.vz /= len;

  return ballState;
}

describe('PingPong ball serve direction', () => {
  it('serve toward P1 should have negative vx (ball moves left)', () => {
    for (let i = 0; i < 20; i++) {
      const ball = resetBall('P1');
      expect(ball.vx).toBeLessThan(0);
    }
  });

  it('serve toward P2 should have positive vx (ball moves right)', () => {
    for (let i = 0; i < 20; i++) {
      const ball = resetBall('P2');
      expect(ball.vx).toBeGreaterThan(0);
    }
  });

  it('after P2 scores, ball should serve toward P1 (loser)', () => {
    // Simulate: P2 scores → ball goes past P1 side → serve toward P1
    const ball = resetBall('P1');
    expect(ball.vx).toBeLessThan(0); // Ball goes left, toward P1 (the loser)
  });

  it('after P1 scores, ball should serve toward P2 (loser)', () => {
    // Simulate: P1 scores → ball goes past P2 side → serve toward P2
    const ball = resetBall('P2');
    expect(ball.vx).toBeGreaterThan(0); // Ball goes right, toward P2 (the loser)
  });

  it('ball should start at center (x=0)', () => {
    const ball = resetBall('P1');
    expect(ball.x).toBe(0);
    expect(ball.z).toBe(0);
  });

  it('ball direction vector should be normalized', () => {
    for (let i = 0; i < 20; i++) {
      const ball = resetBall(null);
      const len = Math.sqrt(ball.vx ** 2 + ball.vz ** 2);
      expect(len).toBeCloseTo(1, 5);
    }
  });
});

// Test Golf angle normalization (extracted from GolfMode)
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) {
    angle -= 2 * Math.PI;
  }
  while (angle < -Math.PI) {
    angle += 2 * Math.PI;
  }
  return angle;
}

describe('Golf angle normalization', () => {
  it('should keep angles within [-PI, PI]', () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(Math.PI)).toBeCloseTo(Math.PI);
    expect(normalizeAngle(-Math.PI)).toBeCloseTo(-Math.PI);
  });

  it('should wrap angles greater than PI', () => {
    expect(normalizeAngle(Math.PI + 0.5)).toBeCloseTo(-Math.PI + 0.5);
    expect(normalizeAngle(3 * Math.PI)).toBeCloseTo(Math.PI);
  });

  it('should wrap angles less than -PI', () => {
    expect(normalizeAngle(-Math.PI - 0.5)).toBeCloseTo(Math.PI - 0.5);
  });
});
