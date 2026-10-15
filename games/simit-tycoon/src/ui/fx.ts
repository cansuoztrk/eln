/**
 * Effects layer: a full-screen canvas for coin bursts and confetti, plus
 * DOM floaters for "+12.3K" texts. Everything is pooled and capped so a
 * late-game screen with ten stands finishing cycles stays at 60 fps.
 */
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  size: number;
  color: string;
  kind: 'coin' | 'confetti' | 'spark';
  rot: number;
  vr: number;
  g: number;
  /** Fly towards a target instead of falling. */
  tx?: number;
  ty?: number;
}

const MAX = 260;
const COLORS = ['#ffd23f', '#ff7aa2', '#3fc1b0', '#e8892e', '#7b61ff', '#ffffff'];

class Fx {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private parts: Particle[] = [];
  private dpr = 1;
  private running = false;
  private last = 0;

  attach(canvas: HTMLCanvasElement): void {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    const resize = () => {
      this.dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(window.innerWidth * this.dpr);
      canvas.height = Math.round(window.innerHeight * this.dpr);
    };
    resize();
    window.addEventListener('resize', resize);
  }

  private push(p: Particle): void {
    if (this.parts.length >= MAX) this.parts.shift();
    this.parts.push(p);
    if (!this.running) {
      this.running = true;
      this.last = performance.now();
      requestAnimationFrame((t) => this.frame(t));
    }
  }

  /** Coins burst from (x, y) and fly to (tx, ty) — e.g. the cash counter. */
  coins(x: number, y: number, tx: number, ty: number, n = 5): void {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = 140 + Math.random() * 180;
      this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.75 + Math.random() * 0.25, size: 7 + Math.random() * 3, color: '#ffd23f', kind: 'coin', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 10, g: 0, tx, ty });
    }
  }

  confetti(x: number, y: number, n = 60, spread = 1): void {
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6 * spread;
      const sp = 260 + Math.random() * 360;
      this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 1.4 + Math.random() * 0.8, size: 5 + Math.random() * 5, color: COLORS[k % COLORS.length], kind: 'confetti', rot: Math.random() * 6, vr: (Math.random() - 0.5) * 14, g: 620 });
    }
  }

  sparks(x: number, y: number, n = 14, color = '#fff6c7'): void {
    for (let k = 0; k < n; k++) {
      const a = (k / n) * Math.PI * 2;
      const sp = 90 + Math.random() * 90;
      this.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: 0.5 + Math.random() * 0.2, size: 2.5 + Math.random() * 2, color, kind: 'spark', rot: 0, vr: 0, g: 0 });
    }
  }

  private frame(now: number): void {
    const ctx = this.ctx;
    const c = this.canvas;
    if (!ctx || !c) return;
    const dt = Math.min(0.05, (now - this.last) / 1000);
    this.last = now;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, c.width, c.height);
    const alive: Particle[] = [];
    for (const p of this.parts) {
      p.life += dt;
      const k = p.life / p.max;
      if (k >= 1) continue;
      alive.push(p);
      if (p.tx !== undefined && p.ty !== undefined && k > 0.3) {
        // Home in on the target with increasing pull.
        const pull = Math.min(1, (k - 0.3) / 0.7);
        p.x += (p.tx - p.x) * pull * 0.22;
        p.y += (p.ty - p.y) * pull * 0.22;
        p.vx *= 0.9;
        p.vy *= 0.9;
      }
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const alpha = p.kind === 'confetti' ? Math.min(1, (1 - k) * 2.5) : p.kind === 'spark' ? 1 - k : 1;
      ctx.globalAlpha = alpha;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      if (p.kind === 'coin') {
        const w = p.size * Math.abs(Math.cos(p.rot * 1.5)) + 1.5;
        ctx.fillStyle = '#c47a00';
        ctx.beginPath();
        ctx.ellipse(0, 1.2, w, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd23f';
        ctx.beginPath();
        ctx.ellipse(0, 0, w, p.size, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff3b0';
        ctx.beginPath();
        ctx.ellipse(-w * 0.3, -p.size * 0.35, w * 0.3, p.size * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'confetti') {
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
    ctx.globalAlpha = 1;
    this.parts = alive;
    if (alive.length) requestAnimationFrame((t) => this.frame(t));
    else {
      ctx.clearRect(0, 0, c.width, c.height);
      this.running = false;
    }
  }
}

export const fx = new Fx();

const floatPool: HTMLElement[] = [];
let floatLayer: HTMLElement | null = null;

/** Floating "+12.3K" text at a screen position. */
export function floatText(text: string, x: number, y: number, kind: 'cash' | 'gold' | 'big' = 'cash'): void {
  if (!floatLayer) {
    floatLayer = document.createElement('div');
    floatLayer.className = 'floaters';
    document.getElementById('app')!.append(floatLayer);
  }
  if (floatLayer.childElementCount > 24) return;
  const el = floatPool.pop() ?? document.createElement('div');
  el.className = `floater floater-${kind}`;
  el.textContent = text;
  el.style.left = `${x}px`;
  el.style.top = `${y}px`;
  floatLayer.append(el);
  setTimeout(() => {
    el.remove();
    floatPool.push(el);
  }, 950);
}
