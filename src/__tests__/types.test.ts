import { describe, it, expect } from 'vitest';
import { MODE_CONFIGS, P1_CONTROLS, P2_CONTROLS, COLORS } from '../types/index';
import type { ModeName, WinnerType, PlayerControls, ModeConfig } from '../types/index';

describe('types and constants', () => {
  describe('MODE_CONFIGS', () => {
    it('should have exactly 5 game modes', () => {
      expect(MODE_CONFIGS).toHaveLength(5);
    });

    it('should contain all expected mode names', () => {
      const names = MODE_CONFIGS.map((c: ModeConfig) => c.name);
      expect(names).toContain('football');
      expect(names).toContain('sumo');
      expect(names).toContain('pingpong');
      expect(names).toContain('golf');
      expect(names).toContain('f1');
    });

    it('each mode should have a positive duration', () => {
      for (const config of MODE_CONFIGS) {
        expect(config.duration).toBeGreaterThan(0);
      }
    });

    it('each mode should have a non-empty displayName', () => {
      for (const config of MODE_CONFIGS) {
        expect(config.displayName.length).toBeGreaterThan(0);
      }
    });

    it('each mode should have a non-empty description', () => {
      for (const config of MODE_CONFIGS) {
        expect(config.description.length).toBeGreaterThan(0);
      }
    });

    it('each mode should have an icon', () => {
      for (const config of MODE_CONFIGS) {
        expect(config.icon.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Player controls', () => {
    it('P1 and P2 controls should not overlap', () => {
      const p1Keys = Object.values(P1_CONTROLS) as string[];
      const p2Keys = Object.values(P2_CONTROLS) as string[];
      for (const key of p1Keys) {
        expect(p2Keys).not.toContain(key);
      }
    });

    it('P1 controls should use WASD + F/G', () => {
      expect(P1_CONTROLS.up).toBe('KeyW');
      expect(P1_CONTROLS.down).toBe('KeyS');
      expect(P1_CONTROLS.left).toBe('KeyA');
      expect(P1_CONTROLS.right).toBe('KeyD');
      expect(P1_CONTROLS.action1).toBe('KeyF');
      expect(P1_CONTROLS.action2).toBe('KeyG');
    });

    it('P2 controls should use Arrow keys + Shift/Enter', () => {
      expect(P2_CONTROLS.up).toBe('ArrowUp');
      expect(P2_CONTROLS.down).toBe('ArrowDown');
      expect(P2_CONTROLS.left).toBe('ArrowLeft');
      expect(P2_CONTROLS.right).toBe('ArrowRight');
      expect(P2_CONTROLS.action1).toBe('ShiftRight');
      expect(P2_CONTROLS.action2).toBe('Enter');
    });

    it('each control set should have all required keys', () => {
      const requiredKeys: Array<keyof PlayerControls> = [
        'up',
        'down',
        'left',
        'right',
        'action1',
        'action2',
      ];
      for (const key of requiredKeys) {
        expect(P1_CONTROLS[key]).toBeDefined();
        expect(P2_CONTROLS[key]).toBeDefined();
      }
    });
  });

  describe('COLORS', () => {
    it('P1 and P2 should have distinct colors', () => {
      expect(COLORS.P1).not.toBe(COLORS.P2);
    });

    it('all color values should be numbers', () => {
      for (const [, value] of Object.entries(COLORS)) {
        expect(typeof value).toBe('number');
      }
    });
  });

  describe('Type consistency', () => {
    it('ModeName type covers all configs', () => {
      const validNames: ModeName[] = ['football', 'sumo', 'pingpong', 'golf', 'f1'];
      for (const config of MODE_CONFIGS) {
        expect(validNames).toContain(config.name);
      }
    });

    it('WinnerType has expected values', () => {
      const winners: WinnerType[] = ['P1', 'P2', 'DRAW'];
      expect(winners).toHaveLength(3);
    });
  });
});
