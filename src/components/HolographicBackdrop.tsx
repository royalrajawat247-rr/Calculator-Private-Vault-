import React, { useEffect, useRef } from 'react';
import type { ThemeMode } from '../types/vault';

interface HolographicBackdropProps {
  theme: ThemeMode;
}

interface DustParticle {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftPhase: number;
  driftAmp: number;
  alpha: number;
  hue: 'gold' | 'purple' | 'blue';
}

interface CrystalOrb {
  xFrac: number;
  yFrac: number;
  radius: number;
  phase: number;
  sprite: HTMLCanvasElement;
}

interface ForestLeaf {
  x: number;
  y: number;
  size: number;
  fallSpeed: number;
  swayPhase: number;
  swayAmp: number;
  spin: number;
  spinSpeed: number;
  tiltPhase: number;
  tone: 'emerald' | 'lime' | 'gold';
  alpha: number;
}

interface ForestFirefly {
  x: number;
  y: number;
  r: number;
  speedY: number;
  driftPhase: number;
  pulsePhase: number;
  tone: 'gold' | 'emerald';
}

interface RingDef {
  radiusScale: number;
  tiltX: number;
  tiltY: number;
  spinZ: number;
  color: string;
  haloColor: string;
  lineWidth: number;
  segments: number;
  dash: number[];
}

const TARGET_FPS = 30;
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS;
const MAX_DPR = 1.25;

function createOrbSprite(radius: number, innerColor: string): HTMLCanvasElement {
  const size = Math.ceil(radius * 2);
  const sprite = document.createElement('canvas');
  sprite.width = size;
  sprite.height = size;
  const sctx = sprite.getContext('2d');
  if (sctx) {
    const grad = sctx.createRadialGradient(radius, radius, 0, radius, radius, radius);
    grad.addColorStop(0, innerColor);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, size, size);
  }
  return sprite;
}

function buildStaticBackdrop(
  theme: ThemeMode,
  width: number,
  height: number,
  dpr: number
): HTMLCanvasElement {
  const offscreen = document.createElement('canvas');
  offscreen.width = Math.max(1, Math.floor(width * dpr));
  offscreen.height = Math.max(1, Math.floor(height * dpr));
  const octx = offscreen.getContext('2d', { alpha: false });
  if (!octx) return offscreen;

  octx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (theme === 'cosmic') {
    octx.fillStyle = '#090D16';
    octx.fillRect(0, 0, width, height);

    const cx = width * 0.5;
    const cy = height * 0.46;
    const baseSize = Math.min(width, height);

    const goldHalo = octx.createRadialGradient(
      cx - baseSize * 0.14,
      cy - baseSize * 0.1,
      10,
      cx - baseSize * 0.14,
      cy - baseSize * 0.1,
      baseSize * 0.55
    );
    goldHalo.addColorStop(0, 'rgba(245, 158, 11, 0.13)');
    goldHalo.addColorStop(1, 'rgba(9, 13, 22, 0)');
    octx.fillStyle = goldHalo;
    octx.fillRect(0, 0, width, height);

    const purpleHalo = octx.createRadialGradient(
      cx + baseSize * 0.16,
      cy + baseSize * 0.12,
      10,
      cx + baseSize * 0.16,
      cy + baseSize * 0.12,
      baseSize * 0.6
    );
    purpleHalo.addColorStop(0, 'rgba(168, 85, 247, 0.15)');
    purpleHalo.addColorStop(1, 'rgba(9, 13, 22, 0)');
    octx.fillStyle = purpleHalo;
    octx.fillRect(0, 0, width, height);
  } else if (theme === 'emerald') {
    const forestGrad = octx.createLinearGradient(0, 0, 0, height);
    forestGrad.addColorStop(0, '#03130D');
    forestGrad.addColorStop(0.5, '#051E15');
    forestGrad.addColorStop(1, '#02100B');
    octx.fillStyle = forestGrad;
    octx.fillRect(0, 0, width, height);

    const canopyGlow = octx.createRadialGradient(
      width * 0.5,
      height * 0.25,
      20,
      width * 0.5,
      height * 0.35,
      Math.max(width, height) * 0.65
    );
    canopyGlow.addColorStop(0, 'rgba(16, 185, 129, 0.16)');
    canopyGlow.addColorStop(0.6, 'rgba(5, 150, 105, 0.06)');
    canopyGlow.addColorStop(1, 'rgba(2, 16, 11, 0)');
    octx.fillStyle = canopyGlow;
    octx.fillRect(0, 0, width, height);
  } else {
    const bgGrad = octx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#F8FAFC');
    bgGrad.addColorStop(0.55, '#FFFFFF');
    bgGrad.addColorStop(1, '#EFF6FF');
    octx.fillStyle = bgGrad;
    octx.fillRect(0, 0, width, height);
  }

  return offscreen;
}

export const HolographicBackdrop: React.FC<HolographicBackdropProps> = ({ theme }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const themeRef = useRef<ThemeMode>(theme);
  const triggerRedrawRef = useRef<(() => void) | null>(null);
  themeRef.current = theme;

  useEffect(() => {
    triggerRedrawRef.current?.();
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const motionQuery =
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-reduced-motion: reduce)')
        : null;
    let prefersReducedMotion = Boolean(motionQuery?.matches);

    let width = window.innerWidth;
    let height = window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    let staticCache: Partial<Record<ThemeMode, HTMLCanvasElement>> = {};

    const getCachedBackground = (activeTheme: ThemeMode): HTMLCanvasElement => {
      let cached = staticCache[activeTheme];
      if (!cached) {
        cached = buildStaticBackdrop(activeTheme, width, height, dpr);
        staticCache[activeTheme] = cached;
      }
      return cached;
    };

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      staticCache = {};
    };

    resize();

    // Ultra-light particle & leaf budgets tuned for 30 FPS mobile battery efficiency
    const cosmicParticles: DustParticle[] = Array.from({ length: 14 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.3 + Math.random() * 1.9,
      speedY: 16 + Math.random() * 24, // px/sec
      driftPhase: Math.random() * Math.PI * 2,
      driftAmp: 10 + Math.random() * 16,
      alpha: 0.45 + Math.random() * 0.45,
      hue: i % 3 === 0 ? 'gold' : i % 3 === 1 ? 'purple' : 'blue',
    }));

    const lightOrbs: CrystalOrb[] = [
      {
        xFrac: 0.2,
        yFrac: 0.22,
        radius: 175,
        phase: 0.4,
        sprite: createOrbSprite(175, 'rgba(37, 99, 235, 0.16)'),
      },
      {
        xFrac: 0.8,
        yFrac: 0.3,
        radius: 160,
        phase: 1.7,
        sprite: createOrbSprite(160, 'rgba(245, 158, 11, 0.15)'),
      },
      {
        xFrac: 0.48,
        yFrac: 0.74,
        radius: 190,
        phase: 3.1,
        sprite: createOrbSprite(190, 'rgba(56, 189, 248, 0.14)'),
      },
    ];

    const leaves: ForestLeaf[] = Array.from({ length: 12 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: 7.5 + Math.random() * 8.5,
      fallSpeed: 24 + Math.random() * 26, // px/sec
      swayPhase: Math.random() * Math.PI * 2,
      swayAmp: 18 + Math.random() * 22,
      spin: Math.random() * Math.PI * 2,
      spinSpeed: (Math.random() - 0.5) * 1.1, // rad/sec
      tiltPhase: Math.random() * Math.PI * 2,
      tone: i % 4 === 0 ? 'gold' : i % 2 === 0 ? 'emerald' : 'lime',
      alpha: 0.52 + Math.random() * 0.38,
    }));

    const fireflies: ForestFirefly[] = Array.from({ length: 10 }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.6 + Math.random() * 1.8,
      speedY: 11 + Math.random() * 16,
      driftPhase: Math.random() * Math.PI * 2,
      pulsePhase: Math.random() * Math.PI * 2,
      tone: i % 2 === 0 ? 'gold' : 'emerald',
    }));

    const darkRings: RingDef[] = [
      {
        radiusScale: 0.35,
        tiltX: 0.95,
        tiltY: 0.35,
        spinZ: 0.24,
        color: 'rgba(245, 185, 66, 0.54)',
        haloColor: 'rgba(245, 185, 66, 0.14)',
        lineWidth: 1.75,
        segments: 36,
        dash: [],
      },
      {
        radiusScale: 0.45,
        tiltX: -0.65,
        tiltY: 0.85,
        spinZ: -0.17,
        color: 'rgba(168, 85, 247, 0.52)',
        haloColor: 'rgba(168, 85, 247, 0.14)',
        lineWidth: 1.6,
        segments: 36,
        dash: [10, 6],
      },
      {
        radiusScale: 0.26,
        tiltX: 0.45,
        tiltY: -0.92,
        spinZ: 0.32,
        color: 'rgba(251, 191, 36, 0.4)',
        haloColor: 'rgba(139, 92, 246, 0.11)',
        lineWidth: 1.25,
        segments: 30,
        dash: [4, 6],
      },
    ];

    const draw3DRing = (
      ring: RingDef,
      timeSec: number,
      cx: number,
      cy: number,
      baseSize: number
    ) => {
      const r = baseSize * ring.radiusScale;
      const rx = ring.tiltX + Math.sin(timeSec * 0.25) * 0.18;
      const ry = ring.tiltY + timeSec * ring.spinZ * 0.55;
      const rz = timeSec * ring.spinZ;

      const cosX = Math.cos(rx);
      const sinX = Math.sin(rx);
      const cosY = Math.cos(ry);
      const sinY = Math.sin(ry);
      const cosZ = Math.cos(rz);
      const sinZ = Math.sin(rz);
      const fov = 560;

      ctx.save();
      ctx.beginPath();
      for (let i = 0; i <= ring.segments; i++) {
        const theta = (i / ring.segments) * Math.PI * 2;
        const x0 = Math.cos(theta) * r;
        const y0 = Math.sin(theta) * r;

        const x1 = x0 * cosZ - y0 * sinZ;
        const y1 = x0 * sinZ + y0 * cosZ;

        const y2 = y1 * cosX;
        const z2 = y1 * sinX;

        const x3 = x1 * cosY + z2 * sinY;
        const z3 = -x1 * sinY + z2 * cosY;

        const scale = fov / (fov + z3 + 120);
        const px = cx + x3 * scale;
        const py = cy + y2 * scale;

        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.setLineDash(ring.dash);

      // Soft outer halo stroke (replaces expensive shadowBlur)
      ctx.strokeStyle = ring.haloColor;
      ctx.lineWidth = ring.lineWidth * 4;
      ctx.stroke();

      // Crisp inner ring stroke
      ctx.strokeStyle = ring.color;
      ctx.lineWidth = ring.lineWidth;
      ctx.stroke();
      ctx.restore();
    };

    const drawGlowingLeaf = (leaf: ForestLeaf, timeSec: number) => {
      const fold = 0.55 + 0.45 * Math.cos(timeSec * 1.6 + leaf.tiltPhase);
      ctx.save();
      ctx.translate(leaf.x, leaf.y);
      ctx.rotate(leaf.spin);
      ctx.scale(1, Math.max(0.35, fold));

      const fillColor =
        leaf.tone === 'gold'
          ? `rgba(250, 204, 21, ${leaf.alpha * 0.78})`
          : leaf.tone === 'lime'
            ? `rgba(74, 222, 128, ${leaf.alpha * 0.72})`
            : `rgba(16, 185, 129, ${leaf.alpha * 0.8})`;

      const s = leaf.size;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.72, -s * 0.35, s * 0.68, s * 0.45, 0, s);
      ctx.bezierCurveTo(-s * 0.68, s * 0.45, -s * 0.72, -s * 0.35, 0, -s);
      ctx.closePath();
      ctx.fillStyle = fillColor;
      ctx.fill();

      // Subtle central leaf vein
      ctx.beginPath();
      ctx.moveTo(0, -s * 0.85);
      ctx.lineTo(0, s * 0.92);
      ctx.strokeStyle = `rgba(236, 253, 245, ${leaf.alpha * 0.42})`;
      ctx.lineWidth = 0.8;
      ctx.stroke();

      ctx.restore();
    };

    let rafId = 0;
    let simTimeSec = 0;
    let lastDrawMs = 0;
    let lastTickMs = performance.now();

    const drawFrame = (dtSec: number) => {
      const activeTheme = themeRef.current;
      const timeSec = prefersReducedMotion ? 0 : simTimeSec;

      // Single fast hardware blit of pre-rendered static backdrop gradient
      const bg = getCachedBackground(activeTheme);
      ctx.drawImage(bg, 0, 0, width, height);

      if (activeTheme === 'cosmic') {
        const cx = width * 0.5;
        const cy = height * 0.46;
        const baseSize = Math.min(width, height);

        for (const ring of darkRings) {
          draw3DRing(ring, timeSec, cx, cy, baseSize);
        }

        for (const p of cosmicParticles) {
          if (!prefersReducedMotion && dtSec > 0) {
            p.y -= p.speedY * dtSec;
            p.x += Math.sin(timeSec * 0.9 + p.driftPhase) * p.driftAmp * dtSec;
            if (p.y < -8) {
              p.y = height + 8;
              p.x = Math.random() * width;
            }
            if (p.x < -8) p.x = width + 8;
            if (p.x > width + 8) p.x = -8;
          }

          const twinkle = 0.6 + 0.4 * Math.sin(timeSec * 2.2 + p.driftPhase);
          const alpha = p.alpha * twinkle;
          const haloFill =
            p.hue === 'gold'
              ? `rgba(251, 191, 36, ${alpha * 0.22})`
              : p.hue === 'purple'
                ? `rgba(192, 132, 252, ${alpha * 0.22})`
                : `rgba(147, 197, 253, ${alpha * 0.2})`;
          const coreFill =
            p.hue === 'gold'
              ? `rgba(251, 191, 36, ${alpha})`
              : p.hue === 'purple'
                ? `rgba(192, 132, 252, ${alpha})`
                : `rgba(147, 197, 253, ${alpha * 0.88})`;

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r * 2.6, 0, Math.PI * 2);
          ctx.fillStyle = haloFill;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = coreFill;
          ctx.fill();
        }
      } else if (activeTheme === 'emerald') {
        for (const leaf of leaves) {
          if (!prefersReducedMotion && dtSec > 0) {
            leaf.y += leaf.fallSpeed * dtSec;
            leaf.x += (Math.sin(timeSec * 1.15 + leaf.swayPhase) * leaf.swayAmp + 9) * dtSec;
            leaf.spin += leaf.spinSpeed * dtSec;
            if (leaf.y > height + 20) {
              leaf.y = -20;
              leaf.x = Math.random() * width;
            }
            if (leaf.x > width + 20) leaf.x = -20;
            if (leaf.x < -20) leaf.x = width + 20;
          }
          drawGlowingLeaf(leaf, timeSec);
        }

        for (const ff of fireflies) {
          if (!prefersReducedMotion && dtSec > 0) {
            ff.y += ff.speedY * dtSec;
            ff.x += Math.sin(timeSec * 1.4 + ff.driftPhase) * 20 * dtSec;
            if (ff.y > height + 10) {
              ff.y = -10;
              ff.x = Math.random() * width;
            }
            if (ff.x < -10) ff.x = width + 10;
            if (ff.x > width + 10) ff.x = -10;
          }

          const pulse = 0.45 + 0.55 * Math.sin(timeSec * 2.8 + ff.pulsePhase);
          const haloFill =
            ff.tone === 'gold'
              ? `rgba(250, 204, 21, ${pulse * 0.24})`
              : `rgba(52, 211, 153, ${pulse * 0.24})`;
          const coreFill =
            ff.tone === 'gold'
              ? `rgba(250, 204, 21, ${pulse * 0.92})`
              : `rgba(52, 211, 153, ${pulse * 0.92})`;

          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.r * 3, 0, Math.PI * 2);
          ctx.fillStyle = haloFill;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(ff.x, ff.y, ff.r, 0, Math.PI * 2);
          ctx.fillStyle = coreFill;
          ctx.fill();
        }
      } else {
        for (const orb of lightOrbs) {
          const ox =
            width *
            (orb.xFrac + (prefersReducedMotion ? 0 : Math.sin(timeSec * 0.35 + orb.phase) * 0.065));
          const oy =
            height *
            (orb.yFrac + (prefersReducedMotion ? 0 : Math.cos(timeSec * 0.28 + orb.phase) * 0.055));

          ctx.drawImage(orb.sprite, ox - orb.radius, oy - orb.radius);
        }
      }
    };

    const stopLoop = () => {
      if (rafId !== 0) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }
    };

    const tick = (now: number) => {
      if (document.hidden || prefersReducedMotion) {
        rafId = 0;
        return;
      }

      const elapsedSinceDraw = now - lastDrawMs;
      if (elapsedSinceDraw >= FRAME_INTERVAL_MS - 1) {
        const dtSec = Math.min(0.066, Math.max(0, (now - lastTickMs) * 0.001));
        simTimeSec += dtSec;
        lastTickMs = now;
        lastDrawMs = now - (elapsedSinceDraw % FRAME_INTERVAL_MS);
        drawFrame(dtSec);
      }

      rafId = window.requestAnimationFrame(tick);
    };

    const startLoop = () => {
      stopLoop();
      const now = performance.now();
      lastTickMs = now;
      lastDrawMs = now;
      drawFrame(0);
      if (!prefersReducedMotion && !document.hidden) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    triggerRedrawRef.current = () => {
      drawFrame(0);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopLoop();
      } else {
        startLoop();
      }
    };

    const handleResize = () => {
      resize();
      drawFrame(0);
    };

    const handleMotionChange = (e: MediaQueryListEvent) => {
      prefersReducedMotion = e.matches;
      if (prefersReducedMotion) {
        stopLoop();
        drawFrame(0);
      } else if (!document.hidden) {
        startLoop();
      }
    };

    startLoop();

    window.addEventListener('resize', handleResize, { passive: true });
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', stopLoop);
    window.addEventListener('pageshow', handleVisibilityChange);
    motionQuery?.addEventListener('change', handleMotionChange);

    return () => {
      stopLoop();
      triggerRedrawRef.current = null;
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', stopLoop);
      window.removeEventListener('pageshow', handleVisibilityChange);
      motionQuery?.removeEventListener('change', handleMotionChange);
      staticCache = {};
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 z-0 pointer-events-none overflow-hidden select-none"
    >
      <canvas ref={canvasRef} className="block h-full w-full transform-gpu will-change-transform" />
    </div>
  );
};
