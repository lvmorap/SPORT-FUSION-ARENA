import { describe, it, expect } from 'vitest';

// Test F1 checkpoint logic (mirrors F1Mode's checkCheckpoints)
// Checkpoint 0 is at the finish line. Cars start with nextCheckpoint=1.
// After passing all intermediate checkpoints (1..N-1), nextCheckpoint wraps
// to 0 (the finish line). Crossing checkpoint 0 increments laps.
const CHECKPOINT_COUNT = 8;
const CHECKPOINT_RADIUS = 3.8;

interface CarState {
  x: number;
  z: number;
  laps: number;
  nextCheckpoint: number;
}

interface Checkpoint {
  x: number;
  z: number;
}

// Simple evenly-spaced checkpoints for testing
function createCheckpoints(): Checkpoint[] {
  const cps: Checkpoint[] = [];
  for (let i = 0; i < CHECKPOINT_COUNT; i++) {
    const angle = (i / CHECKPOINT_COUNT) * Math.PI * 2;
    cps.push({ x: Math.cos(angle) * 20, z: Math.sin(angle) * 20 });
  }
  return cps;
}

function defaultCarState(): CarState {
  return { x: 0, z: 0, laps: 0, nextCheckpoint: 1 };
}

function checkCheckpoints(state: CarState, checkpoints: Checkpoint[]): void {
  const cp = checkpoints[state.nextCheckpoint];
  const dx = state.x - cp.x;
  const dz = state.z - cp.z;
  const distSq = dx * dx + dz * dz;

  if (distSq < CHECKPOINT_RADIUS * CHECKPOINT_RADIUS) {
    if (state.nextCheckpoint === 0) {
      state.laps++;
      state.nextCheckpoint = 1;
    } else {
      state.nextCheckpoint = (state.nextCheckpoint + 1) % CHECKPOINT_COUNT;
    }
  }
}

describe('F1 checkpoint logic', () => {
  const checkpoints = createCheckpoints();

  it('cars should start at nextCheckpoint 1 (not 0) to avoid auto-trigger at finish line', () => {
    const car = defaultCarState();
    expect(car.nextCheckpoint).toBe(1);
  });

  it('car at finish line (checkpoint 0) should NOT trigger because nextCheckpoint is 1', () => {
    const car = defaultCarState();
    // Move car to checkpoint 0 position
    car.x = checkpoints[0].x;
    car.z = checkpoints[0].z;
    checkCheckpoints(car, checkpoints);
    expect(car.laps).toBe(0);
    expect(car.nextCheckpoint).toBe(1); // unchanged
  });

  it('should trigger checkpoint when car is close enough', () => {
    const car = defaultCarState();
    // Move car to checkpoint 1 position
    car.x = checkpoints[1].x;
    car.z = checkpoints[1].z;
    checkCheckpoints(car, checkpoints);
    expect(car.laps).toBe(0);
    expect(car.nextCheckpoint).toBe(2);
  });

  it('should complete a lap when crossing finish line after all intermediate checkpoints', () => {
    const car = defaultCarState();

    // Pass intermediate checkpoints 1..7
    for (let cp = 1; cp < CHECKPOINT_COUNT; cp++) {
      car.x = checkpoints[cp].x;
      car.z = checkpoints[cp].z;
      checkCheckpoints(car, checkpoints);
    }
    // After passing checkpoint 7, nextCheckpoint should wrap to 0 (finish line)
    expect(car.nextCheckpoint).toBe(0);
    expect(car.laps).toBe(0);

    // Now cross the finish line (checkpoint 0)
    car.x = checkpoints[0].x;
    car.z = checkpoints[0].z;
    checkCheckpoints(car, checkpoints);
    expect(car.laps).toBe(1);
    expect(car.nextCheckpoint).toBe(1); // ready for next lap
  });

  it('should not allow skipping checkpoints', () => {
    const car = defaultCarState();
    // Car at checkpoint 5 but nextCheckpoint is 1
    car.x = checkpoints[5].x;
    car.z = checkpoints[5].z;
    checkCheckpoints(car, checkpoints);
    expect(car.laps).toBe(0);
    expect(car.nextCheckpoint).toBe(1); // didn't advance
  });

  it('should not count a lap if finish line crossed without intermediate checkpoints', () => {
    const car = defaultCarState();
    // Skip straight to checkpoint 0 without passing 1..7
    car.x = checkpoints[0].x;
    car.z = checkpoints[0].z;
    checkCheckpoints(car, checkpoints);
    expect(car.laps).toBe(0);
    expect(car.nextCheckpoint).toBe(1); // still looking for checkpoint 1
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
