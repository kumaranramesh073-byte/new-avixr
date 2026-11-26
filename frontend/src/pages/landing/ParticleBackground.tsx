

import { useEffect, useRef } from "react";

// Custom Noise implementation based on Perlin Noise to build dynamic flowfields
class SimpleNoise {
  private p: number[] = new Array(512);

  constructor(seed: number = 69085286) {
    const permutation = Array.from({ length: 256 }, (_, i) => i);
    
    // Seeded random shuffle
    let rand = seed;
    const random = () => {
      const x = Math.sin(rand++) * 10000;
      return x - Math.floor(x);
    };

    for (let i = 255; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      const temp = permutation[i];
      permutation[i] = permutation[j];
      permutation[j] = temp;
    }

    for (let i = 0; i < 256; i++) {
      this.p[i] = permutation[i];
      this.p[256 + i] = permutation[i];
    }
  }

  private fade(t: number) {
    return t * t * t * (t * (t * 6 - 15) + 10);
  }

  private lerp(t: number, a: number, b: number) {
    return a + t * (b - a);
  }

  private grad(hash: number, x: number, y: number, z: number) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  }

  public noise(x: number, y: number, z: number): number {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;

    x -= Math.floor(x);
    y -= Math.floor(y);
    z -= Math.floor(z);

    const u = this.fade(x);
    const v = this.fade(y);
    const w = this.fade(z);

    const A = this.p[X] + Y;
    const AA = this.p[A] + Z;
    const AB = this.p[A + 1] + Z;
    const B = this.p[X + 1] + Y;
    const BA = this.p[B] + Z;
    const BB = this.p[B + 1] + Z;

    return this.lerp(
      w,
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x - 1, y, z)),
        this.lerp(u, this.grad(this.p[AB], x, y - 1, z), this.grad(this.p[BB], x - 1, y - 1, z))
      ),
      this.lerp(
        v,
        this.lerp(u, this.grad(this.p[AA + 1], x, y, z - 1), this.grad(this.p[BA + 1], x - 1, y, z - 1)),
        this.lerp(u, this.grad(this.p[AB + 1], x, y - 1, z - 1), this.grad(this.p[BB + 1], x - 1, y - 1, z - 1))
      )
    );
  }
}

export default function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const seed = 69085286;
    const params = {
      particleCount: 900,
      fieldScale: 26,
      noiseInc: 0.075,
      speed: 0.24,
      drag: 0.955,
      alpha: 0.2, // 20 out of 100 alpha = 0.2
    };

    const noiseGen = new SimpleNoise(seed);
    let z = 0;

    interface Particle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      hue: number;
    }

    const createParticle = (): Particle => {
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: 0,
        vy: 0,
        hue: 200 + Math.random() * 28, // HSB color range 200 to 228
      };
    };

    const particles = Array.from({ length: params.particleCount }, createParticle);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      particles.forEach((pt) => {
        pt.x = ((pt.x % width) + width) % width;
        pt.y = ((pt.y % height) + height) % height;
      });
    };

    window.addEventListener("resize", handleResize);

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      particles.forEach((pt) => {
        const px = pt.x;
        const py = pt.y;

        const noiseVal = noiseGen.noise(
          (px / params.fieldScale) * params.noiseInc,
          (py / params.fieldScale) * params.noiseInc,
          z
        );
        
        // Map noise value to angle
        const angle = (noiseVal + 1) * Math.PI;

        pt.vx = (pt.vx + Math.cos(angle) * params.speed) * params.drag;
        pt.vy = (pt.vy + Math.sin(angle) * params.speed) * params.drag;
        pt.x += pt.vx;
        pt.y += pt.vy;

        // Draw particle flow line
        ctx.strokeStyle = `hsla(${pt.hue}, 70%, 95%, ${params.alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();

        // Screen boundary wrap and reset
        if (pt.x < -40 || pt.x > width + 40 || pt.y < -40 || pt.y > height + 40) {
          pt.x = Math.random() * width;
          pt.y = Math.random() * height;
          pt.vx = 0;
          pt.vy = 0;
        }
      });

      z += 0.0025;
      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 10,
        mixBlendMode: "soft-light",
        opacity: 0.22,
      }}
    />
  );
}
