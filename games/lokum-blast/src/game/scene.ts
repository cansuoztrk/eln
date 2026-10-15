import { Board, Kind, SIZE, type ClearResult } from '../core/board';
import type { Move } from '../core/bot';
import type { Piece } from '../core/pieces';
import type { MoveResult, Session } from '../core/session';
import { t } from '../i18n';
import { audio } from '../services/audio';
import { haptic } from '../services/platform';
import { clamp01, ease, type Banner, type Dying, type Flyer, type Floater, type Particle } from './fx';
import { buildSprites, roundRect, star, type SpriteSet } from './sprites';
import { alpha, shade, type Theme } from './themes';

export type SceneMode = 'play' | 'hammer' | 'bomb' | 'locked';

export interface SceneHooks {
  /** A piece was placed (HUD refresh, quests, autosave). */
  onMove(res: MoveResult): void;
  /** Hammer / bomb booster target chosen. */
  onBoosterTarget(kind: 'hammer' | 'bomb', r: number, c: number): void;
  /** Screen position of a goal icon (for flying collectibles); null if none. */
  goalTarget(goalIndex: number): { x: number; y: number } | null;
  coinTarget(): { x: number; y: number } | null;
  /** A flying collectible reached its HUD target. */
  onCollect(kind: 'goal' | 'coin', index: number): void;
  /** Player interacted (dismisses tutorial hints). */
  onInteract(): void;
}

interface DragState {
  slot: number;
  piece: Piece;
  x: number;
  y: number;
  lift: number;
  grabT: number;
  gr: number;
  gc: number;
  valid: boolean;
  preview: { rows: number[]; cols: number[] };
}

interface ReturnAnim {
  slot: number;
  x: number;
  y: number;
  t: number;
}

const GOLD_GRAD: [string, string] = ['#fff3b0', '#ffb300'];

export class GameScene {
  readonly canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dpr = 1;
  private w = 0;
  private h = 0;
  private theme: Theme;
  private sprites!: SpriteSet;
  session!: Session;
  mode: SceneMode = 'play';

  // layout (CSS px)
  boardX = 0;
  boardY = 0;
  cell = 40;
  private trayY = 0;
  private trayH = 0;
  private slotW = 0;
  private trayCell = 22;

  private drag: DragState | null = null;
  private returning: ReturnAnim[] = [];
  private spawnT: number[] = [1, 1, 1];
  private popT = new Map<number, number>();
  private dying: Dying[] = [];
  private particles: Particle[] = [];
  private floaters: Floater[] = [];
  private banners: Banner[] = [];
  private flyers: Flyer[] = [];
  private flashes: Array<{ rows: number[]; cols: number[]; t: number }> = [];
  private crateHits = new Map<number, number>();
  private shakeT = 0;
  private shakeAmp = 0;
  private time = 0;
  private last = 0;
  private raf = 0;
  private running = false;
  private greyOut = -1;
  private hoverCell = -1;
  private hint: Move | null = null;
  private hintT = 0;
  private bombFx: Array<{ x: number; y: number; t: number }> = [];

  constructor(canvas: HTMLCanvasElement, theme: Theme, private hooks: SceneHooks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.theme = theme;
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMoveEvt);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
  }

  destroy(): void {
    this.stop();
    this.canvas.removeEventListener('pointerdown', this.onDown);
    this.canvas.removeEventListener('pointermove', this.onMoveEvt);
    this.canvas.removeEventListener('pointerup', this.onUp);
    this.canvas.removeEventListener('pointercancel', this.onUp);
  }

  setSession(s: Session): void {
    this.session = s;
    this.drag = null;
    this.returning = [];
    this.dying = [];
    this.particles = [];
    this.floaters = [];
    this.banners = [];
    this.flyers = [];
    this.popT.clear();
    this.greyOut = -1;
    this.mode = 'play';
    this.hint = null;
    this.spawnTray();
  }

  setTheme(theme: Theme): void {
    this.theme = theme;
    this.buildSprites();
  }

  setHint(m: Move | null): void {
    this.hint = m;
    this.hintT = 0;
  }

  // ───────────── layout ─────────────

  resize(topInset: number, bottomInset: number): void {
    this.dpr = Math.min(3, window.devicePixelRatio || 1);
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.canvas.style.width = `${this.w}px`;
    this.canvas.style.height = `${this.h}px`;

    const avail = this.h - topInset - bottomInset;
    const maxBoard = Math.min(this.w - 28, 980);
    // Board gets ~64% of the free height; the tray fills the rest.
    let board = Math.min(maxBoard, avail * 0.64);
    board = Math.floor(board / SIZE) * SIZE;
    this.cell = board / SIZE;
    this.trayCell = Math.round(this.cell * 0.6);
    const gap = Math.max(14, this.cell * 0.35);
    this.trayH = Math.min(this.cell * 4.4, Math.max(this.trayCell * 5 + 12, avail - board - gap - 8));
    const total = board + gap + this.trayH;
    const top = topInset + Math.max(8, (avail - total) * 0.45);
    this.boardX = Math.round((this.w - board) / 2);
    this.boardY = Math.round(top);
    this.trayY = this.boardY + board + gap;
    this.slotW = Math.min(this.w, board + 40) / 3;
    this.buildSprites();
  }

  private buildSprites(): void {
    this.sprites = buildSprites(this.theme, Math.round(this.cell * this.dpr));
  }

  private slotCenter(slot: number): { x: number; y: number } {
    const trayW = this.slotW * 3;
    const x0 = (this.w - trayW) / 2;
    return { x: x0 + this.slotW * (slot + 0.5), y: this.trayY + this.trayH / 2 };
  }

  cellCenter(i: number): { x: number; y: number } {
    const r = Math.floor(i / SIZE);
    const c = i % SIZE;
    return { x: this.boardX + (c + 0.5) * this.cell, y: this.boardY + (r + 0.5) * this.cell };
  }

  // ───────────── loop ─────────────

  start(): void {
    if (this.running) return;
    this.running = true;
    this.last = performance.now();
    const loop = (now: number) => {
      if (!this.running) return;
      const dt = Math.min(0.05, (now - this.last) / 1000);
      this.last = now;
      this.update(dt);
      this.render();
      this.raf = requestAnimationFrame(loop);
    };
    this.raf = requestAnimationFrame(loop);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private update(dt: number): void {
    this.time += dt;
    this.hintT += dt;
    for (let i = 0; i < 3; i++) this.spawnT[i] = Math.min(1, this.spawnT[i] + dt * 3.2);
    for (const [k, v] of this.popT) {
      const nv = v + dt * 5;
      if (nv >= 1) this.popT.delete(k);
      else this.popT.set(k, nv);
    }
    for (const [k, v] of this.crateHits) {
      const nv = v + dt * 4;
      if (nv >= 1) this.crateHits.delete(k);
      else this.crateHits.set(k, nv);
    }
    if (this.drag) this.drag.grabT = Math.min(1, this.drag.grabT + dt * 8);
    this.returning = this.returning.filter((r) => (r.t += dt * 5) < 1);
    this.dying = this.dying.filter((d) => {
      if (d.delay > 0) {
        d.delay -= dt;
        return true;
      }
      d.t += dt / d.dur;
      return d.t < 1;
    });
    this.particles = this.particles.filter((p) => {
      if (p.delay > 0) {
        p.delay -= dt;
        return true;
      }
      p.life += dt;
      p.vy += p.g * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.985;
      p.rot += p.vr * dt;
      return p.life < p.max;
    });
    this.floaters = this.floaters.filter((f) => {
      if (f.delay > 0) {
        f.delay -= dt;
        return true;
      }
      f.t += dt / f.dur;
      return f.t < 1;
    });
    this.banners = this.banners.filter((b) => (b.t += dt / b.dur) < 1);
    this.flyers = this.flyers.filter((f) => {
      if (f.delay > 0) {
        f.delay -= dt;
        return true;
      }
      f.t += dt / f.dur;
      if (f.t >= 1) {
        f.done?.();
        return false;
      }
      return true;
    });
    this.flashes = this.flashes.filter((f) => (f.t += dt * 3) < 1);
    this.bombFx = this.bombFx.filter((b) => (b.t += dt * 2.2) < 1);
    if (this.shakeT > 0) this.shakeT = Math.max(0, this.shakeT - dt);
    if (this.greyOut >= 0) this.greyOut += dt * 1.6;
  }

  // ───────────── rendering ─────────────

  private render(): void {
    const ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, this.w, this.h);
    ctx.save();
    if (this.shakeT > 0) {
      const a = this.shakeAmp * (this.shakeT / 0.35);
      ctx.translate((Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
    }
    this.drawBoard(ctx);
    this.drawFlashes(ctx);
    this.drawPreview(ctx);
    this.drawHint(ctx);
    this.drawDying(ctx);
    this.drawBombFx(ctx);
    this.drawParticles(ctx);
    ctx.restore();
    this.drawTray(ctx);
    this.drawDrag(ctx);
    this.drawFlyers(ctx);
    this.drawFloaters(ctx);
    this.drawBanners(ctx);
  }

  private drawBoard(ctx: CanvasRenderingContext2D): void {
    const s = this.cell * SIZE;
    const pad = Math.max(6, this.cell * 0.16);
    const th = this.theme;
    // outer frame with soft glow
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 24;
    ctx.shadowOffsetY = 8;
    roundRect(ctx, this.boardX - pad, this.boardY - pad, s + pad * 2, s + pad * 2, pad * 1.6);
    ctx.fillStyle = th.boardEdge;
    ctx.fill();
    ctx.restore();
    roundRect(ctx, this.boardX - pad * 0.55, this.boardY - pad * 0.55, s + pad * 1.1, s + pad * 1.1, pad * 1.2);
    ctx.fillStyle = th.board;
    ctx.fill();
    if (this.session.combo.combo >= 2) {
      const pulse = 0.35 + 0.25 * Math.sin(this.time * 6);
      ctx.strokeStyle = alpha(th.accent, pulse);
      ctx.lineWidth = 3;
      roundRect(ctx, this.boardX - pad, this.boardY - pad, s + pad * 2, s + pad * 2, pad * 1.6);
      ctx.stroke();
    }

    const b = this.session.board;
    const cs = this.cell;
    const sp = this.sprites;
    const greyLimit = this.greyOut >= 0 ? this.greyOut * (SIZE + 2) : -1;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const i = r * SIZE + c;
        const x = this.boardX + c * cs;
        const y = this.boardY + r * cs;
        ctx.drawImage(sp.empty, x, y, cs, cs);
        if (!b.isFilled(i)) continue;
        const pop = this.popT.get(i);
        let scale = 1;
        if (pop !== undefined) scale = 0.55 + 0.45 * ease.outBack(pop);
        const hit = this.crateHits.get(i);
        let ox = 0;
        if (hit !== undefined) ox = Math.sin(hit * 30) * (1 - hit) * cs * 0.08;
        const grey = greyLimit >= 0 && SIZE - 1 - r < greyLimit;
        this.drawCell(ctx, b, i, x + ox, y, cs, scale, grey);
      }
    }
  }

  private drawCell(ctx: CanvasRenderingContext2D, b: Board, i: number, x: number, y: number, cs: number, scale: number, grey: boolean): void {
    const sp = this.sprites;
    const k = b.kind[i];
    const size = cs * scale;
    const dx = x + (cs - size) / 2;
    const dy = y + (cs - size) / 2;
    if (grey) {
      ctx.drawImage(sp.grey, dx, dy, size, size);
      return;
    }
    if (k === Kind.Crate) {
      ctx.drawImage(sp.crate[Math.min(2, b.hp[i])], dx, dy, size, size);
      return;
    }
    if (k === Kind.Gold) {
      ctx.drawImage(sp.gold, dx, dy, size, size);
      this.twinkle(ctx, x, y, cs, i);
      return;
    }
    ctx.drawImage(sp.flavors[b.flavor[i]] ?? sp.grey, dx, dy, size, size);
    if (k === Kind.Gem) {
      const bob = Math.sin(this.time * 3 + i) * cs * 0.03;
      ctx.drawImage(sp.gem, dx, dy + bob, size, size);
      this.twinkle(ctx, x, y, cs, i + 17);
    }
  }

  private twinkle(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number, seed: number): void {
    const phase = (this.time * 0.8 + seed * 0.37) % 2.2;
    if (phase > 0.5) return;
    const a = Math.sin((phase / 0.5) * Math.PI);
    ctx.fillStyle = `rgba(255,255,255,${a * 0.95})`;
    star(ctx, x + cs * 0.72, y + cs * 0.28, cs * 0.14 * a + 1);
  }

  private drawFlashes(ctx: CanvasRenderingContext2D): void {
    const cs = this.cell;
    for (const f of this.flashes) {
      const a = (1 - f.t) * 0.55;
      ctx.fillStyle = `rgba(255,255,240,${a})`;
      for (const r of f.rows) ctx.fillRect(this.boardX, this.boardY + r * cs, cs * SIZE, cs);
      for (const c of f.cols) ctx.fillRect(this.boardX + c * cs, this.boardY, cs, cs * SIZE);
    }
  }

  private drawPreview(ctx: CanvasRenderingContext2D): void {
    const d = this.drag;
    const cs = this.cell;
    if (this.mode === 'hammer' || this.mode === 'bomb') {
      ctx.fillStyle = 'rgba(10,5,30,0.35)';
      ctx.fillRect(this.boardX, this.boardY, cs * SIZE, cs * SIZE);
      if (this.hoverCell >= 0) {
        const r = Math.floor(this.hoverCell / SIZE);
        const c = this.hoverCell % SIZE;
        const rad = this.mode === 'bomb' ? 1 : 0;
        const r0 = Math.max(0, r - rad);
        const c0 = Math.max(0, c - rad);
        const r1 = Math.min(SIZE - 1, r + rad);
        const c1 = Math.min(SIZE - 1, c + rad);
        const pulse = 0.6 + 0.4 * Math.sin(this.time * 10);
        ctx.strokeStyle = `rgba(255,220,90,${pulse})`;
        ctx.lineWidth = 3;
        roundRect(ctx, this.boardX + c0 * cs + 2, this.boardY + r0 * cs + 2, (c1 - c0 + 1) * cs - 4, (r1 - r0 + 1) * cs - 4, cs * 0.2);
        ctx.stroke();
      }
      return;
    }
    if (!d || !d.valid) return;
    const sp = this.sprites;
    const flavorSprite = sp.flavors[d.piece.flavor];
    // Lines that will clear take on the piece's flavor — the satisfying "preview".
    if (d.preview.rows.length || d.preview.cols.length) {
      // Repaint the empty slot first so translucent styles (neon, glass) do not blend.
      const take = (x: number, y: number) => {
        ctx.drawImage(sp.empty, x, y, cs, cs);
        ctx.drawImage(flavorSprite, x, y, cs, cs);
      };
      for (const r of d.preview.rows) for (let c = 0; c < SIZE; c++) take(this.boardX + c * cs, this.boardY + r * cs);
      for (const c of d.preview.cols) for (let r = 0; r < SIZE; r++) take(this.boardX + c * cs, this.boardY + r * cs);
      // shimmering highlight on the lines about to pop
      ctx.fillStyle = `rgba(255,255,255,${0.1 + 0.08 * Math.sin(this.time * 12)})`;
      for (const r of d.preview.rows) ctx.fillRect(this.boardX, this.boardY + r * cs, cs * SIZE, cs);
      for (const c of d.preview.cols) ctx.fillRect(this.boardX + c * cs, this.boardY, cs, cs * SIZE);
      ctx.strokeStyle = alpha('#ffffff', 0.5 + 0.3 * Math.sin(this.time * 12));
      ctx.lineWidth = 2.5;
      for (const r of d.preview.rows) {
        roundRect(ctx, this.boardX + 1, this.boardY + r * cs + 1, cs * SIZE - 2, cs - 2, cs * 0.2);
        ctx.stroke();
      }
      for (const c of d.preview.cols) {
        roundRect(ctx, this.boardX + c * cs + 1, this.boardY + 1, cs - 2, cs * SIZE - 2, cs * 0.2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 0.42;
    for (const [dr, dc] of d.piece.shape.cells) {
      ctx.drawImage(flavorSprite, this.boardX + (d.gc + dc) * cs, this.boardY + (d.gr + dr) * cs, cs, cs);
    }
    ctx.globalAlpha = 1;
  }

  private drawHint(ctx: CanvasRenderingContext2D): void {
    const m = this.hint;
    if (!m || this.drag) return;
    const piece = this.session.tray[m.slot];
    if (!piece) return;
    const cs = this.cell;
    // ghost at target
    const pulse = 0.25 + 0.2 * Math.sin(this.hintT * 5);
    ctx.globalAlpha = pulse;
    for (const [dr, dc] of piece.shape.cells) {
      ctx.drawImage(this.sprites.flavors[piece.flavor], this.boardX + (m.c + dc) * cs, this.boardY + (m.r + dr) * cs, cs, cs);
    }
    ctx.globalAlpha = 1;
    // animated hand: slot → target, 1.6s loop
    const loop = (this.hintT % 1.8) / 1.4;
    if (loop > 1) return;
    const from = this.slotCenter(m.slot);
    const to = {
      x: this.boardX + (m.c + piece.shape.w / 2) * cs,
      y: this.boardY + (m.r + piece.shape.h / 2) * cs,
    };
    const k = ease.inOutSine(clamp01(loop));
    const x = from.x + (to.x - from.x) * k;
    const y = from.y + (to.y - from.y) * k;
    this.drawHand(ctx, x + cs * 0.3, y + cs * 0.5, cs);
  }

  private drawHand(ctx: CanvasRenderingContext2D, x: number, y: number, cs: number): void {
    ctx.save();
    ctx.translate(x, y);
    ctx.font = `${Math.round(cs * 1.1)}px system-ui, "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 8;
    ctx.fillText('👆', 0, 0);
    ctx.restore();
  }

  private drawDying(ctx: CanvasRenderingContext2D): void {
    for (const d of this.dying) {
      if (d.delay > 0) {
        ctx.drawImage(d.sprite, d.x - d.size / 2, d.y - d.size / 2, d.size, d.size);
        continue;
      }
      const k = d.t;
      const scale = k < 0.3 ? 1 + 0.25 * (k / 0.3) : 1.25 * (1 - ease.inCubic((k - 0.3) / 0.7));
      const s = d.size * Math.max(0, scale);
      ctx.save();
      ctx.globalAlpha = 1 - clamp01((k - 0.5) / 0.5);
      ctx.translate(d.x, d.y);
      ctx.rotate(d.rot * k);
      ctx.drawImage(d.sprite, -s / 2, -s / 2, s, s);
      if (k < 0.35) {
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = 0.6 * (1 - k / 0.35);
        ctx.drawImage(d.sprite, -s / 2, -s / 2, s, s);
      }
      ctx.restore();
    }
  }

  private drawBombFx(ctx: CanvasRenderingContext2D): void {
    for (const b of this.bombFx) {
      const r = this.cell * (0.5 + 2.2 * ease.outCubic(b.t));
      const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r);
      g.addColorStop(0, `rgba(255,240,200,${0.9 * (1 - b.t)})`);
      g.addColorStop(0.5, `rgba(239,62,91,${0.6 * (1 - b.t)})`);
      g.addColorStop(1, 'rgba(239,62,91,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (p.delay > 0) continue;
      const a = 1 - p.life / p.max;
      ctx.globalAlpha = Math.max(0, a);
      ctx.fillStyle = p.color;
      if (p.kind === 'dot') {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (0.5 + a * 0.5), 0, Math.PI * 2);
        ctx.fill();
      } else if (p.kind === 'star') {
        star(ctx, p.x, p.y, p.size * (0.6 + a * 0.4));
      } else {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const s = p.size * (p.kind === 'chip' ? 1 : 0.5 + a * 0.5);
        ctx.fillRect(-s / 2, -s / 2, s, p.kind === 'chip' ? s * 0.45 : s);
        ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  private pieceFits = [true, true, true];

  private drawTray(ctx: CanvasRenderingContext2D): void {
    const tray = this.session.tray;
    for (let slot = 0; slot < 3; slot++) {
      const p = tray[slot];
      if (!p) continue;
      if (this.drag && this.drag.slot === slot) continue;
      const ret = this.returning.find((r) => r.slot === slot);
      const center = this.slotCenter(slot);
      const k = ease.outBack(this.spawnT[slot]);
      let cx = center.x + (1 - k) * this.slotW * 1.2;
      let cy = center.y;
      let cs = this.trayCell * (0.4 + 0.6 * k);
      if (ret) {
        const e = ease.outCubic(ret.t);
        cx = ret.x + (center.x - ret.x) * e;
        cy = ret.y + (center.y - ret.y) * e;
        cs = this.cell + (this.trayCell - this.cell) * e;
      }
      const fits = this.pieceFits[slot];
      ctx.globalAlpha = fits ? 1 : 0.32;
      this.drawPiece(ctx, p, cx, cy, cs, !fits);
      ctx.globalAlpha = 1;
    }
  }

  private drawPiece(ctx: CanvasRenderingContext2D, p: Piece, cx: number, cy: number, cs: number, grey = false): void {
    const x0 = cx - (p.shape.w * cs) / 2;
    const y0 = cy - (p.shape.h * cs) / 2;
    p.shape.cells.forEach(([r, c], k) => {
      const sprite = grey ? this.sprites.grey : k === p.gold ? this.sprites.gold : this.sprites.flavors[p.flavor];
      ctx.drawImage(sprite, x0 + c * cs, y0 + r * cs, cs, cs);
    });
  }

  private drawDrag(ctx: CanvasRenderingContext2D): void {
    const d = this.drag;
    if (!d) return;
    const k = ease.outCubic(d.grabT);
    const cs = this.trayCell + (this.cell - this.trayCell) * k;
    const cy = d.y - d.lift * k;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.45)';
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 10;
    this.drawPiece(ctx, d.piece, d.x, cy, cs * 1.04);
    ctx.restore();
  }

  private drawFlyers(ctx: CanvasRenderingContext2D): void {
    for (const f of this.flyers) {
      if (f.delay > 0) continue;
      const k = ease.inOutSine(f.t);
      const u = 1 - k;
      const x = u * u * f.x0 + 2 * u * k * f.cx + k * k * f.x1;
      const y = u * u * f.y0 + 2 * u * k * f.cy + k * k * f.y1;
      const s = f.size * (1 - 0.45 * k);
      ctx.drawImage(f.sprite, x - s / 2, y - s / 2, s, s);
    }
  }

  private drawFloaters(ctx: CanvasRenderingContext2D): void {
    for (const f of this.floaters) {
      if (f.delay > 0) continue;
      const k = f.t;
      const y = f.y - this.cell * 1.4 * ease.outCubic(k);
      const scale = k < 0.15 ? ease.outBack(k / 0.15) : 1;
      ctx.save();
      ctx.globalAlpha = 1 - clamp01((k - 0.6) / 0.4);
      ctx.translate(f.x, y);
      ctx.scale(scale, scale);
      ctx.font = `800 ${f.size}px "Baloo 2", system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineWidth = f.size * 0.18;
      ctx.strokeStyle = 'rgba(40,10,60,0.85)';
      ctx.strokeText(f.text, 0, 0);
      ctx.fillStyle = f.color;
      ctx.fillText(f.text, 0, 0);
      ctx.restore();
    }
  }

  private drawBanners(ctx: CanvasRenderingContext2D): void {
    const b = this.banners[this.banners.length - 1];
    if (!b) return;
    const k = b.t;
    const cx = this.boardX + (this.cell * SIZE) / 2;
    const cy = this.boardY + this.cell * SIZE * 0.42;
    const scale = k < 0.18 ? ease.outBack(k / 0.18) : 1 + (k - 0.18) * 0.08;
    const a = 1 - clamp01((k - 0.7) / 0.3);
    const size = Math.round(this.cell * 1.15);
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(cx, cy - k * this.cell * 0.6);
    ctx.scale(scale, scale);
    ctx.rotate(-0.06);
    ctx.font = `800 ${size}px "Baloo 2", system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const g = ctx.createLinearGradient(0, -size / 2, 0, size / 2);
    const [c0, c1] = b.hue === 'pink' ? ['#ffe0ef', '#ff4f9a'] : b.hue === 'mint' ? ['#e6fffb', '#1ccfb8'] : GOLD_GRAD;
    g.addColorStop(0, c0);
    g.addColorStop(1, c1);
    ctx.lineJoin = 'round';
    ctx.lineWidth = size * 0.22;
    ctx.strokeStyle = '#2b0d3d';
    ctx.strokeText(b.text, 0, 0);
    ctx.fillStyle = g;
    ctx.fillText(b.text, 0, 0);
    if (b.sub) {
      const ss = Math.round(size * 0.48);
      ctx.font = `800 ${ss}px "Baloo 2", system-ui, sans-serif`;
      ctx.lineWidth = ss * 0.25;
      ctx.strokeText(b.sub, 0, size * 0.78);
      ctx.fillStyle = '#ffffff';
      ctx.fillText(b.sub, 0, size * 0.78);
    }
    ctx.restore();
  }

  // ───────────── input ─────────────

  private toBoardCell(x: number, y: number): number {
    const c = Math.floor((x - this.boardX) / this.cell);
    const r = Math.floor((y - this.boardY) / this.cell);
    if (r < 0 || c < 0 || r >= SIZE || c >= SIZE) return -1;
    return r * SIZE + c;
  }

  private slotAt(x: number, y: number): number {
    if (y < this.trayY - this.cell * 0.6 || y > this.trayY + this.trayH + this.cell) return -1;
    const trayW = this.slotW * 3;
    const x0 = (this.w - trayW) / 2;
    const s = Math.floor((x - x0) / this.slotW);
    return s >= 0 && s < 3 ? s : -1;
  }

  private onDown = (e: PointerEvent): void => {
    audio.unlock();
    this.hooks.onInteract();
    const x = e.clientX;
    const y = e.clientY;
    if (this.mode === 'locked') return;
    if (this.mode === 'hammer' || this.mode === 'bomb') {
      const i = this.toBoardCell(x, y);
      this.hoverCell = i;
      return;
    }
    const slot = this.slotAt(x, y);
    if (slot < 0) return;
    const piece = this.session.tray[slot];
    if (!piece) return;
    this.canvas.setPointerCapture(e.pointerId);
    const lift = e.pointerType === 'mouse' ? this.cell * 0.4 : this.cell * (1.6 + piece.shape.h * 0.35);
    this.drag = { slot, piece, x, y, lift, grabT: 0, gr: -1, gc: -1, valid: false, preview: { rows: [], cols: [] } };
    this.hint = null;
    audio.pick();
    void haptic('select');
    this.updateDragTarget();
  };

  private onMoveEvt = (e: PointerEvent): void => {
    if (this.mode === 'hammer' || this.mode === 'bomb') {
      this.hoverCell = this.toBoardCell(e.clientX, e.clientY);
      return;
    }
    if (!this.drag) return;
    this.drag.x = e.clientX;
    this.drag.y = e.clientY;
    this.updateDragTarget();
  };

  private onUp = (e: PointerEvent): void => {
    if (this.mode === 'hammer' || this.mode === 'bomb') {
      const i = this.toBoardCell(e.clientX, e.clientY);
      this.hoverCell = -1;
      if (i >= 0) this.hooks.onBoosterTarget(this.mode, Math.floor(i / SIZE), i % SIZE);
      return;
    }
    const d = this.drag;
    if (!d) return;
    this.drag = null;
    if (d.valid) {
      const res = this.session.place(d.slot, d.gr, d.gc);
      if (res) {
        this.afterPlace(res);
        return;
      }
    }
    // Snap back to the tray.
    const cy = d.y - d.lift;
    this.returning.push({ slot: d.slot, x: d.x, y: cy, t: 0 });
    if (this.toBoardCell(d.x, cy) >= 0) {
      audio.invalid();
      void haptic('warning');
    }
  };

  private updateDragTarget(): void {
    const d = this.drag!;
    const cs = this.cell;
    const left = d.x - (d.piece.shape.w * cs) / 2;
    const top = d.y - d.lift - (d.piece.shape.h * cs) / 2;
    const fc = (left - this.boardX) / cs;
    const fr = (top - this.boardY) / cs;
    const rc = Math.round(fc);
    const rr = Math.round(fr);
    // Forgiving snap: try the nearest cells around the exact position.
    let best: [number, number] | null = null;
    let bestDist = 0.85;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        const r = rr + dr;
        const c = rc + dc;
        if (!this.session.board.canPlace(d.piece.shape, r, c)) continue;
        const dist = Math.hypot(r - fr, c - fc);
        if (dist < bestDist) {
          bestDist = dist;
          best = [r, c];
        }
      }
    }
    if (best) {
      if (!d.valid || d.gr !== best[0] || d.gc !== best[1]) {
        d.gr = best[0];
        d.gc = best[1];
        d.valid = true;
        d.preview = this.session.board.previewLines(d.piece.shape, d.gr, d.gc);
        if (d.preview.rows.length || d.preview.cols.length) void haptic('select');
      }
    } else {
      d.valid = false;
      d.preview = { rows: [], cols: [] };
    }
  }

  // ───────────── effects ─────────────

  /** Called after every successful placement. */
  afterPlace(res: MoveResult): void {
    for (const i of res.placed) this.popT.set(i, 0);
    audio.place();
    void haptic('light');
    if (res.clear) this.playClear(res.clear, res, res.placed);
    if (res.newTray) this.spawnTray();
    this.refreshFits();
    this.hooks.onMove(res);
  }

  /** Visuals for a clear (lines, hammer, bomb or revive). */
  playClear(clear: ClearResult, res: MoveResult | null, origin: number[] = []): void {
    const cs = this.cell;
    const sp = this.sprites;
    const lines = clear.rows.length + clear.cols.length;
    let ox = 0;
    let oy = 0;
    if (origin.length) {
      for (const i of origin) {
        const p = this.cellCenter(i);
        ox += p.x;
        oy += p.y;
      }
      ox /= origin.length;
      oy /= origin.length;
    } else if (clear.removed.length) {
      const p = this.cellCenter(clear.removed[0].idx);
      ox = p.x;
      oy = p.y;
    }
    if (lines) this.flashes.push({ rows: clear.rows, cols: clear.cols, t: 0 });

    const goals = this.session.level?.goals ?? [];
    let coinIdx = 0;
    for (const cell of clear.removed) {
      const p = this.cellCenter(cell.idx);
      const dist = Math.hypot(p.x - ox, p.y - oy) / cs;
      const delay = dist * 0.028;
      const sprite = cell.kind === Kind.Crate ? sp.crate[1] : cell.kind === Kind.Gold ? sp.gold : sp.flavors[cell.flavor] ?? sp.grey;
      this.dying.push({ sprite, x: p.x, y: p.y, size: cs, t: 0, delay, dur: 0.42, rot: (Math.random() - 0.5) * 1.2 });
      const color = cell.kind === Kind.Crate ? '#b97a3f' : this.theme.palette[cell.flavor] ?? '#ffffff';
      this.burst(p.x, p.y, color, delay, cell.kind === Kind.Crate);

      // Collectibles fly to their HUD targets.
      goals.forEach((g, gi) => {
        const match =
          (g.type === 'flavor' && cell.flavor === g.flavor && cell.kind !== Kind.Crate) ||
          (g.type === 'gem' && cell.kind === Kind.Gem) ||
          (g.type === 'crate' && cell.kind === Kind.Crate);
        if (!match) return;
        const target = this.hooks.goalTarget(gi);
        if (!target) return;
        const fsprite = g.type === 'gem' ? sp.gem : g.type === 'crate' ? sp.crate[1] : sp.flavors[cell.flavor];
        this.fly(fsprite, p.x, p.y, target.x, target.y, delay + 0.15, cs * 0.8, () => this.hooks.onCollect('goal', gi));
      });
      if (cell.kind === Kind.Gold) {
        const target = this.hooks.coinTarget();
        if (target) {
          this.fly(sp.gold, p.x, p.y, target.x, target.y, delay + 0.1 + coinIdx * 0.06, cs * 0.7, () => {
            audio.coin();
            this.hooks.onCollect('coin', 0);
          });
          coinIdx++;
        }
      }
    }
    for (const i of clear.cratesHit) {
      this.crateHits.set(i, 0);
      const p = this.cellCenter(i);
      this.burst(p.x, p.y, '#b97a3f', 0, true);
    }

    if (res) {
      if (lines) {
        audio.clear(lines, res.combo);
        void haptic(lines >= 3 ? 'heavy' : lines === 2 ? 'medium' : 'light');
      }
      if (res.score.clear + res.score.bonus > 0) {
        this.floaters.push({ text: `+${res.score.clear + res.score.bonus}`, x: ox, y: oy, t: 0, dur: 1.1, size: Math.round(cs * 0.7), color: '#fff6c7', delay: 0.05 });
      }
      const praise = this.praiseFor(res);
      if (praise) {
        this.banners.push(praise);
        if (res.combo >= 2 || lines >= 3) audio.combo(Math.min(5, res.combo + lines - 2));
      }
      if (lines >= 2 || res.boardCleared) {
        this.shake(lines >= 3 ? 9 : 5);
        this.confetti(lines >= 3 ? 40 : 18);
      }
    }
  }

  private praiseFor(res: MoveResult): Banner | null {
    const lines = res.clear ? res.clear.rows.length + res.clear.cols.length : 0;
    const sub = res.combo >= 2 ? t('praise.combo', { n: res.combo }) : undefined;
    if (res.boardCleared) return { text: t('praise.clear'), sub, t: 0, dur: 1.5, hue: 'mint' };
    if (res.clear && res.clear.pureLines > 0) return { text: t('praise.pure'), sub, t: 0, dur: 1.4, hue: 'pink' };
    if (lines >= 2) {
      const key = lines >= 5 ? 'praise.5' : lines === 4 ? 'praise.4' : lines === 3 ? 'praise.3' : 'praise.2';
      return { text: t(key), sub, t: 0, dur: 1.25, hue: 'gold' };
    }
    if (res.combo >= 2) return { text: t('praise.combo', { n: res.combo }), t: 0, dur: 1.1, hue: 'pink' };
    return null;
  }

  private burst(x: number, y: number, color: string, delay: number, wood: boolean): void {
    const n = wood ? 7 : 9;
    for (let k = 0; k < n; k++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 220;
      const sugar = !wood && k % 3 === 0;
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 120,
        life: 0,
        max: 0.55 + Math.random() * 0.45,
        size: wood ? this.cell * 0.22 : sugar ? this.cell * 0.07 : this.cell * (0.12 + Math.random() * 0.12),
        color: wood ? (k % 2 ? '#8a5228' : '#d39a5a') : sugar ? '#ffffff' : k % 4 === 1 ? shade(color, 0.4) : color,
        kind: wood ? 'chip' : sugar ? 'dot' : k % 5 === 0 ? 'star' : 'square',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 14,
        g: 620,
        delay,
      });
    }
  }

  confetti(n: number): void {
    const colors = this.theme.palette;
    const cx = this.boardX + (this.cell * SIZE) / 2;
    const cy = this.boardY + (this.cell * SIZE) * 0.4;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 250 + Math.random() * 420;
      this.particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        life: 0,
        max: 1.2 + Math.random() * 0.8,
        size: this.cell * (0.12 + Math.random() * 0.1),
        color: colors[k % colors.length],
        kind: k % 3 === 0 ? 'star' : 'square',
        rot: Math.random() * 6,
        vr: (Math.random() - 0.5) * 10,
        g: 520,
        delay: Math.random() * 0.15,
      });
    }
  }

  private fly(sprite: CanvasImageSource, x0: number, y0: number, x1: number, y1: number, delay: number, size: number, done?: () => void): void {
    const cx = (x0 + x1) / 2 + (Math.random() - 0.5) * this.cell * 3;
    const cy = Math.min(y0, y1) - this.cell * (1 + Math.random() * 2);
    this.flyers.push({ sprite, x0, y0, x1, y1, cx, cy, t: 0, dur: 0.7 + Math.random() * 0.2, delay, size, done });
  }

  shake(amp: number): void {
    this.shakeT = 0.35;
    this.shakeAmp = amp;
  }

  bombAt(r: number, c: number): void {
    const p = this.cellCenter(r * SIZE + c);
    this.bombFx.push({ x: p.x, y: p.y, t: 0 });
    this.shake(12);
    audio.bomb();
    void haptic('heavy');
  }

  spawnTray(): void {
    this.spawnT = [0, -0.12, -0.24];
    this.refreshFits();
  }

  /** Recomputes which tray pieces still fit (unfit ones are dimmed). */
  refreshFits(): void {
    this.pieceFits = this.session.tray.map((p) => !p || this.session.board.anyFit(p.shape));
  }

  startGreyOut(): void {
    this.greyOut = 0;
  }

  popAll(): void {
    for (let i = 0; i < SIZE * SIZE; i++) if (this.session.board.isFilled(i)) this.popT.set(i, 0);
    this.spawnTray();
  }

  /** Tray rect in CSS px (for tutorial overlays). */
  trayRect(): { x: number; y: number; w: number; h: number } {
    const trayW = this.slotW * 3;
    return { x: (this.w - trayW) / 2, y: this.trayY, w: trayW, h: this.trayH };
  }

  boardRect(): { x: number; y: number; w: number; h: number } {
    return { x: this.boardX, y: this.boardY, w: this.cell * SIZE, h: this.cell * SIZE };
  }

  /** Big celebratory banner from outside (level win etc.). */
  celebrate(text: string): void {
    this.banners.push({ text, t: 0, dur: 1.6, hue: 'gold' });
    this.confetti(60);
  }
}
