/**
 * High-performance 2D Particle System with Object Pooling
 * Used for Answer feedback, Combos, Celebrations, and Ambient Geometry
 */

export interface Particle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
  shape: 'circle' | 'star' | 'confetti' | 'diamond';
  rotation: number;
  vRot: number;
  gravity: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private poolSize = 300;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private animFrameId: number | null = null;
  private lastTime = 0;

  constructor() {
    for (let i = 0; i < this.poolSize; i++) {
      this.particles.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        size: 4,
        color: '#f59e0b',
        alpha: 1,
        decay: 0.02,
        shape: 'circle',
        rotation: 0,
        vRot: 0,
        gravity: 0,
      });
    }
  }

  public attachCanvas(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.startLoop();
  }

  public detach(): void {
    if (this.animFrameId !== null) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.canvas = null;
    this.ctx = null;
  }

  private getFreeParticle(): Particle | null {
    for (let i = 0; i < this.particles.length; i++) {
      if (!this.particles[i].active) {
        return this.particles[i];
      }
    }
    return null;
  }

  public emitCorrectBurst(x: number, y: number): void {
    const colors = ['#10b981', '#34d399', '#6ee7b7', '#fde047', '#f59e0b', '#ffffff'];
    const count = 35;
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
      const speed = 2.5 + Math.random() * 5.5;

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 3.5 + Math.random() * 4.5;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.decay = 0.016 + Math.random() * 0.02;
      p.shape = Math.random() > 0.4 ? 'star' : 'diamond';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 8;
      p.gravity = 0.12;
    }
  }

  public emitComboSparkle(x: number, y: number, combo: number): void {
    const colors = ['#f59e0b', '#fde047', '#ef4444', '#ec4899', '#38bdf8'];
    const count = Math.min(45, 15 + combo * 5);
    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;

      p.active = true;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed - 1.5;
      p.size = 4 + Math.random() * 4;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.decay = 0.02 + Math.random() * 0.025;
      p.shape = 'star';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 10;
      p.gravity = 0.08;
    }
  }

  public emitCelebrationConfetti(): void {
    if (!this.canvas) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const colors = ['#f59e0b', '#10b981', '#38bdf8', '#a855f7', '#ec4899', '#fde047', '#ffffff'];
    const count = 70;

    for (let i = 0; i < count; i++) {
      const p = this.getFreeParticle();
      if (!p) break;

      const startLeft = Math.random() > 0.5;
      p.active = true;
      p.x = startLeft ? 0 : w;
      p.y = h * (0.3 + Math.random() * 0.5);
      const angle = startLeft
        ? -Math.PI / 4 + (Math.random() - 0.5) * 0.6
        : (-3 * Math.PI) / 4 + (Math.random() - 0.5) * 0.6;
      const speed = 6 + Math.random() * 9;

      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.size = 6 + Math.random() * 6;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.alpha = 1;
      p.decay = 0.008 + Math.random() * 0.012;
      p.shape = 'confetti';
      p.rotation = Math.random() * Math.PI * 2;
      p.vRot = (Math.random() - 0.5) * 6;
      p.gravity = 0.16;
    }
  }

  private startLoop(): void {
    if (this.animFrameId !== null) return;
    this.lastTime = performance.now();

    const loop = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.05);
      this.lastTime = currentTime;

      this.update(deltaTime);
      this.render();

      this.animFrameId = requestAnimationFrame(loop);
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  private update(dt: number): void {
    const scale = dt * 60; // 60 FPS normalizer
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      p.x += p.vx * scale;
      p.y += p.vy * scale;
      p.vy += p.gravity * scale;
      p.rotation += p.vRot * dt;
      p.alpha -= p.decay * scale;

      if (p.alpha <= 0) {
        p.active = false;
      }
    }
  }

  private render(): void {
    if (!this.ctx || !this.canvas) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (!p.active) continue;

      this.ctx.save();
      this.ctx.globalAlpha = Math.max(0, p.alpha);
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);
      this.ctx.fillStyle = p.color;

      if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        this.ctx.fill();
      } else if (p.shape === 'confetti') {
        this.ctx.fillRect(-p.size, -p.size * 0.5, p.size * 2, p.size);
      } else if (p.shape === 'diamond') {
        this.ctx.beginPath();
        this.ctx.moveTo(0, -p.size);
        this.ctx.lineTo(p.size, 0);
        this.ctx.lineTo(0, p.size);
        this.ctx.lineTo(-p.size, 0);
        this.ctx.closePath();
        this.ctx.fill();
      } else if (p.shape === 'star') {
        this.drawStar(this.ctx, 0, 0, 5, p.size * 1.3, p.size * 0.6);
      }

      this.ctx.restore();
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number
  ): void {
    let rot = (Math.PI / 2) * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;

      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }
}

export const particleSystem = new ParticleSystem();
