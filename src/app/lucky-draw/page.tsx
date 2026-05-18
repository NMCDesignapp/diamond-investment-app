'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, X, Trophy, Users, Gift, Crown, Star, Dices, Diamond,
  Pause, Play, Plus, Trash2, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useInvestmentStore } from '@/lib/investment-store';

// Types
interface Prize {
  id: string;
  name: string;
  quantity: number;
  remaining: number;
  gift: string;
}

interface Winner {
  id: string;
  customerName: string;
  advisor: string;
  prizeName: string;
  gift: string;
}

// Confetti particle system
class ConfettiSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private particles: Array<{
    x: number; y: number; vx: number; vy: number;
    color: string; size: number; rotation: number;
    rotationSpeed: number; opacity: number; shape: 'rect' | 'circle' | 'star';
  }> = [];
  private animFrame: number = 0;
  private running = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  start() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
    this.running = true;
    const colors = [
      '#d4a843', '#f5d870', '#ffe066', '#ff6b6b', '#4ecdc4',
      '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#0d5a3f',
      '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#e67e22',
      '#fd79a8', '#a29bfe', '#10b981', '#fdcb6e', '#6c5ce7',
    ];
    const shapes: Array<'rect' | 'circle' | 'star'> = ['rect', 'circle', 'star'];
    for (let i = 0; i < 500; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -Math.random() * this.canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 12,
        vy: Math.random() * 6 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 12 + 4,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
      });
    }
    this.animate();
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.particles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawStar(cx: number, cy: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3;
    let x = cx;
    let y = cy;
    const step = Math.PI / spikes;
    this.ctx.beginPath();
    this.ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      x = cx + Math.cos(rot) * outerRadius;
      y = cy + Math.sin(rot) * outerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      this.ctx.lineTo(x, y);
      rot += step;
    }
    this.ctx.lineTo(cx, cy - outerRadius);
    this.ctx.closePath();
    this.ctx.fill();
  }

  private animate = () => {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    let alive = false;
    for (const p of this.particles) {
      p.x += p.vx;
      p.vy += 0.1;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      if (p.y > this.canvas.height) {
        p.opacity -= 0.02;
      }
      if (p.opacity <= 0) continue;
      alive = true;
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.opacity;
      this.ctx.fillStyle = p.color;
      if (p.shape === 'rect') {
        this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      } else if (p.shape === 'circle') {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
        this.ctx.fill();
      } else {
        this.drawStar(0, 0, 5, p.size / 2, p.size / 4);
      }
      this.ctx.restore();
    }
    if (alive) {
      this.animFrame = requestAnimationFrame(this.animate);
    } else {
      this.stop();
    }
  };
}

// Firework ray animation system for background
class FireworkSystem {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private rays: Array<{
    x: number; y: number; angle: number;
    length: number; speed: number; opacity: number;
    opacityDir: number; width: number; hue: number;
    life: number; maxLife: number;
  }> = [];
  private animFrame: number = 0;
  private running = false;
  private centerX: number = 0;
  private centerY: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
  }

  start() {
    this.canvas.width = this.canvas.offsetWidth;
    this.canvas.height = this.canvas.offsetHeight;
    this.centerX = this.canvas.width / 2;
    this.centerY = this.canvas.height * 0.45;
    this.running = true;
    this.rays = [];
    for (let i = 0; i < 80; i++) {
      this.rays.push(this.createRay());
    }
    this.animate();
  }

  private createRay() {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.random() * 40;
    return {
      x: this.centerX + Math.cos(angle) * dist,
      y: this.centerY + Math.sin(angle) * dist,
      angle: angle + (Math.random() - 0.5) * 0.3,
      length: 30 + Math.random() * 120,
      speed: 0.4 + Math.random() * 1.5,
      opacity: 0.04 + Math.random() * 0.12,
      opacityDir: (Math.random() > 0.5 ? 1 : -1) * 0.003,
      width: 1 + Math.random() * 2.5,
      hue: Math.random() > 0.6 ? 45 : Math.random() > 0.3 ? 160 : 30, // gold, teal, or warm
      life: 0,
      maxLife: 200 + Math.random() * 400,
    };
  }

  stop() {
    this.running = false;
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.rays = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private animate = () => {
    if (!this.running) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const r of this.rays) {
      r.x += Math.cos(r.angle) * r.speed;
      r.y += Math.sin(r.angle) * r.speed;
      r.life++;
      r.opacity += r.opacityDir;
      if (r.opacity > 0.15 || r.opacity < 0.02) r.opacityDir *= -1;
      // Reset if out of bounds or life exceeded
      if (r.x < -80 || r.x > this.canvas.width + 80 || r.y < -80 || r.y > this.canvas.height + 80 || r.life > r.maxLife) {
        Object.assign(r, this.createRay());
      }
      const endX = r.x + Math.cos(r.angle) * r.length;
      const endY = r.y + Math.sin(r.angle) * r.length;
      const gradient = this.ctx.createLinearGradient(r.x, r.y, endX, endY);
      if (r.hue === 45) {
        gradient.addColorStop(0, `rgba(255, 224, 138, ${r.opacity})`);
        gradient.addColorStop(1, `rgba(255, 224, 138, 0)`);
      } else if (r.hue === 160) {
        gradient.addColorStop(0, `rgba(52, 211, 153, ${r.opacity * 0.5})`);
        gradient.addColorStop(1, `rgba(52, 211, 153, 0)`);
      } else {
        gradient.addColorStop(0, `rgba(232, 184, 74, ${r.opacity * 0.7})`);
        gradient.addColorStop(1, `rgba(232, 184, 74, 0)`);
      }
      this.ctx.beginPath();
      this.ctx.moveTo(r.x, r.y);
      this.ctx.lineTo(endX, endY);
      this.ctx.strokeStyle = gradient;
      this.ctx.lineWidth = r.width;
      this.ctx.lineCap = 'round';
      this.ctx.stroke();
    }
    this.animFrame = requestAnimationFrame(this.animate);
  };
}

const PRIZE_ICONS = [Crown, Star, Trophy, Gift, Dices];

type DrawMode = 'customer' | 'advisor';

function titleCase(str: string) {
  if (!str) return '';
  return str.split(/\s+/).map(word => {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
}

// Slot item height - bigger for desktop projection
const SLOT_ITEM_HEIGHT_MOBILE = 56;
const SLOT_ITEM_HEIGHT_DESKTOP = 100;

// LED strip component - runs around in circles
function CircularLEDStrip() {
  return (
    <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden rounded-2xl">
      {/* Top LED row - chase left to right */}
      <div className="absolute top-0 left-0 right-0 h-2.5 flex overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className="flex-1 led-dot"
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        ))}
      </div>
      {/* Bottom LED row - chase right to left */}
      <div className="absolute bottom-0 left-0 right-0 h-2.5 flex overflow-hidden">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={`bot-${i}`}
            className="flex-1 led-dot"
            style={{ animationDelay: `${(60 - i) * 0.06}s` }}
          />
        ))}
      </div>
      {/* Left LED column - chase top to bottom */}
      <div className="absolute top-2.5 left-0 bottom-2.5 w-2.5 flex flex-col overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="flex-1 led-dot-v"
            style={{ animationDelay: `${(60 + i) * 0.06}s` }}
          />
        ))}
      </div>
      {/* Right LED column - chase bottom to top */}
      <div className="absolute top-2.5 right-0 bottom-2.5 w-2.5 flex flex-col overflow-hidden">
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="flex-1 led-dot-v"
            style={{ animationDelay: `${(110 - i) * 0.06}s` }}
          />
        ))}
      </div>
      {/* Corner glow dots */}
      {[
        { top: 0, left: 0 },
        { top: 0, right: 0 },
        { bottom: 0, left: 0 },
        { bottom: 0, right: 0 },
      ].map((pos, i) => (
        <div
          key={`corner-${i}`}
          className="absolute w-3 h-3 led-corner"
          style={{ ...pos, animationDelay: `${i * 0.8}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

export default function LuckyDrawPage() {
  const store = useInvestmentStore();
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiSystem | null>(null);
  const fireworkCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireworkRef = useRef<FireworkSystem | null>(null);
  const customerTableRef = useRef<HTMLDivElement>(null);
  const winnerTableRef = useRef<HTMLDivElement>(null);

  // State
  const [currentPrizeIndex, setCurrentPrizeIndex] = useState(0);
  const [drawMode, setDrawMode] = useState<DrawMode>('customer');
  const [winners, setWinners] = useState<Winner[]>([]);
  const [wonCustomerIds, setWonCustomerIds] = useState<Set<string>>(new Set());
  const [isSpinning, setIsSpinning] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [currentWinner, setCurrentWinner] = useState<Winner | null>(null);
  const [showResult, setShowResult] = useState(false);

  // Settings modal
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPassword, setSettingsPassword] = useState('');
  const [settingsAuthenticated, setSettingsAuthenticated] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'general' | 'prizes' | 'customers'>('general');
  const [editPrizes, setEditPrizes] = useState<Prize[]>([]);
  const [newPrizeName, setNewPrizeName] = useState('');
  const [newPrizeQty, setNewPrizeQty] = useState('1');
  const [newPrizeGift, setNewPrizeGift] = useState('');

  // Auto scroll - always on by default
  const [autoScroll, setAutoScroll] = useState(true);
  const [winnerAutoScroll, setWinnerAutoScroll] = useState(true);

  // Track whether prizes have been initialized from store
  const [localPrizeOverrides, setLocalPrizeOverrides] = useState<Prize[] | null>(null);

  // BUG 3 FIX: Ref for currentPrizeIndex to avoid stale closure
  const currentPrizeIndexRef = useRef(0);
  useEffect(() => { currentPrizeIndexRef.current = currentPrizeIndex; }, [currentPrizeIndex]);

  // JS-based slot animation refs (for smooth deceleration)
  const animFrameRef = useRef<number>(0);
  const spinSpeedRef = useRef(0);
  const spinPosRef = useRef(0);
  const isDecelRef = useRef(false);
  const pendingWinnerRef = useRef<Winner | null>(null);
  const onStoppedRef = useRef<(() => void) | null>(null);

  // Lucky draw event info (separate from registration page)
  const [luckyDrawEventForm, setLuckyDrawEventForm] = useState({
    name: '',
    date: '',
    location: '',
  });

  // Derive prizes from store drawPrizes
  const prizes: Prize[] = localPrizeOverrides ?? (Array.isArray(store.drawPrizes) ? store.drawPrizes.map((dp) => ({
    id: dp.id,
    name: dp.name,
    quantity: dp.quantity,
    remaining: dp.quantity,
    gift: dp.gift || '',
  })) : []);

  // Load data + auto-sync (with strict mode guard)
  const hasLoaded = useRef(false);
  useEffect(() => {
    if (!hasLoaded.current) {
      hasLoaded.current = true;
      store.loadAll();
    }
    const interval = setInterval(() => {
      store.loadAll();
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Auto-advance to next available prize when current prize is exhausted
  useEffect(() => {
    if (isSpinning) return; // Don't change prize while spinning
    const currentPrize = prizes[currentPrizeIndex];
    if (currentPrize && currentPrize.remaining <= 0) {
      // Find next prize with remaining > 0
      const nextIdx = prizes.findIndex(p => p.remaining > 0);
      if (nextIdx !== -1 && nextIdx !== currentPrizeIndex) {
        setCurrentPrizeIndex(nextIdx);
      }
    }
  }, [prizes, currentPrizeIndex, isSpinning]);

  // Confetti canvas setup
  useEffect(() => {
    if (confettiCanvasRef.current) {
      confettiRef.current = new ConfettiSystem(confettiCanvasRef.current);
    }
    return () => {
      confettiRef.current?.stop();
    };
  }, []);

  // Bubble canvas setup
  useEffect(() => {
    if (fireworkCanvasRef.current) {
      fireworkRef.current = new FireworkSystem(fireworkCanvasRef.current);
      fireworkRef.current.start();
    }
    return () => {
      fireworkRef.current?.stop();
    };
  }, []);

  // Deduplicate customers by id
  const allCustomers = (() => {
    const seen = new Set<string>();
    return (Array.isArray(store.customers) ? store.customers : []).filter(c => {
      if (seen.has(c.id)) return false;
      seen.add(c.id);
      return true;
    });
  })();

  // Available customers (not won yet)
  const availableCustomers = allCustomers.filter(c => !wonCustomerIds.has(c.id));
  const availableAdvisors = [...new Set(availableCustomers.map(c => c.advisor).filter(Boolean))];
  const drawItems = drawMode === 'customer'
    ? availableCustomers.map(c => ({ id: c.id, name: c.name, advisor: c.advisor }))
    : availableAdvisors.map(a => ({ id: a, name: a, advisor: a }));
  const currentPrize = prizes[currentPrizeIndex] || null;
  const canSpin = !isSpinning && drawItems.length > 0 && currentPrize && currentPrize.remaining > 0;
  const canStart = !isSpinning && currentPrizeIndex >= 0 && drawItems.length > 0 && currentPrize && currentPrize.remaining > 0;

  // Helper: get the correct track ref based on viewport
  const getTrackRef = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.innerWidth >= 768 ? desktopTrackRef.current : mobileTrackRef.current;
  }, []);

  // Auto-scroll for customer table - ALWAYS ON, bottom to top, continuous loop
  useEffect(() => {
    const el = customerTableRef.current;
    if (!el) return;
    // Small delay to ensure DOM is populated
    const timer = setTimeout(() => {
      let scrollPos = el.scrollHeight;
      el.scrollTop = scrollPos;
      const speed = 0.5;
      let animId: number;
      const scroll = () => {
        scrollPos -= speed;
        if (scrollPos <= 0) {
          scrollPos = el.scrollHeight / 2;
        }
        el.scrollTop = scrollPos;
        animId = requestAnimationFrame(scroll);
      };
      animId = requestAnimationFrame(scroll);
      // Store cleanup function
      (el as any)._scrollCleanup = () => cancelAnimationFrame(animId);
    }, 100);
    return () => {
      clearTimeout(timer);
      if ((el as any)._scrollCleanup) (el as any)._scrollCleanup();
    };
  }, [allCustomers.length, wonCustomerIds.size]);

  // BUG 4 FIX: Auto-scroll for winner table (bottom to top)
  useEffect(() => {
    const el = winnerTableRef.current;
    if (!el || !winnerAutoScroll) return;
    let scrollPos = el.scrollHeight;
    el.scrollTop = scrollPos;
    const speed = 0.5;
    let animId: number;
    const scroll = () => {
      scrollPos -= speed;
      if (scrollPos <= 0) {
        scrollPos = el.scrollHeight / 2;
      }
      el.scrollTop = scrollPos;
      animId = requestAnimationFrame(scroll);
    };
    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [winnerAutoScroll, winners]);

  useEffect(() => {
    if (!winnerAutoScroll && winnerTableRef.current) {
      winnerTableRef.current.scrollTop = 0;
    }
  }, [winnerAutoScroll]);

  // Build track for slot machine
  const buildTrack = useCallback(() => {
    const items = drawItems.map(item => item.name);
    if (items.length === 0) return [];
    const track: string[] = [];
    for (let i = 0; i < 50; i++) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      track.push(...shuffled);
    }
    return track;
  }, [drawItems]);

  // Start spin with JS animation for smooth speed control
  const startSpin = useCallback(() => {
    const prizeIdx = currentPrizeIndexRef.current;
    const prize = prizes[prizeIdx];
    if (isSpinning || drawItems.length === 0 || !prize || prize.remaining <= 0) return;

    const trackEl = getTrackRef();
    if (!trackEl) return;

    setIsSpinning(true);
    setIsStopping(false);
    setShowResult(false);
    setCurrentWinner(null);

    const track = buildTrack();
    if (track.length === 0) return;

    const isDesktop = window.innerWidth >= 768;
    const itemH = isDesktop ? SLOT_ITEM_HEIGHT_DESKTOP : SLOT_ITEM_HEIGHT_MOBILE;
    const viewportH = itemH * 5;

    // Populate DOM
    requestAnimationFrame(() => {
      if (!trackEl) return;

      trackEl.innerHTML = '';
      for (const name of track) {
        const div = document.createElement('div');
        div.className = 'slot-item';
        div.textContent = name;
        div.style.cssText = `
          height: ${itemH}px; display: flex; align-items: center; justify-content: center;
          font-size: ${isDesktop ? '48px' : '24px'}; font-weight: 800; color: ${isDesktop ? '#ffe08a' : '#d4a843'}; white-space: nowrap;
          padding: 0 ${isDesktop ? '50px' : '20px'}; text-align: center; letter-spacing: 0.05em;
          text-shadow: 0 0 10px ${isDesktop ? 'rgba(255,224,138,0.3)' : 'rgba(212,168,67,0.3)'};
        `;
        trackEl.appendChild(div);
      }

      // Reset animation state - start FAST
      spinPosRef.current = 0;
      spinSpeedRef.current = itemH * 0.8; // Fast start speed
      isDecelRef.current = false;
      pendingWinnerRef.current = null;
      onStoppedRef.current = null;
      trackEl.style.transition = 'none';
      trackEl.style.transform = 'translateY(0)';

      const totalHeight = track.length * itemH;
      const maxPos = totalHeight - viewportH;

      const animate = () => {
        // Deceleration phase
        if (isDecelRef.current) {
          spinSpeedRef.current *= 0.975; // Gradual slowdown (~2.5% per frame)
          
          if (spinSpeedRef.current < 0.8) {
            // Nearly stopped - find winner and snap
            const items = trackEl!.querySelectorAll('.slot-item');
            const totalItems = items.length;
            const currentIdx = Math.floor(spinPosRef.current / itemH);
            let targetIdx = -1;
            // Find winner name ahead of current position (at least 2 items ahead)
            for (let i = currentIdx + 2; i < totalItems; i++) {
              if (items[i].textContent === pendingWinnerRef.current?.customerName) {
                targetIdx = i;
                break;
              }
            }
            if (targetIdx === -1) {
              // Search from beginning if close to end
              for (let i = 0; i < Math.min(currentIdx + 2, totalItems); i++) {
                if (items[i].textContent === pendingWinnerRef.current?.customerName) {
                  targetIdx = i;
                  break;
                }
              }
            }
            if (targetIdx === -1) targetIdx = Math.min(currentIdx + 5, totalItems - 3);
            const targetY = (targetIdx - 2) * itemH;
            // Final smooth transition to winner - slow ease-out
            trackEl!.style.transition = 'transform 3s cubic-bezier(0.0, 0.5, 0.1, 1)';
            trackEl!.style.transform = `translateY(-${targetY}px)`;
            // Trigger callback after final transition
            if (onStoppedRef.current) {
              setTimeout(onStoppedRef.current, 3200);
            }
            return; // Stop animation loop
          }
        }

        // Normal spinning (or decelerating)
        spinPosRef.current += spinSpeedRef.current;
        
        // When wrapping during normal spin, reset seamlessly
        // During deceleration, DON'T wrap - just keep going (track is long enough)
        if (!isDecelRef.current && spinPosRef.current > maxPos) {
          spinPosRef.current = spinPosRef.current % itemH; // Reset near top to loop
        }
        
        // Safety: if position goes beyond track during decel, clamp
        if (isDecelRef.current && spinPosRef.current > maxPos) {
          spinPosRef.current = maxPos;
        }
        
        trackEl!.style.transform = `translateY(-${spinPosRef.current}px)`;
        animFrameRef.current = requestAnimationFrame(animate);
      };

      animFrameRef.current = requestAnimationFrame(animate);
    });
  }, [isSpinning, drawItems, prizes, buildTrack, getTrackRef]);

  // Stop spin - gradual deceleration, then land on winner
  const stopSpin = useCallback(() => {
    if (!isSpinning || isStopping) return;
    setIsStopping(true);

    const prizeIdx = currentPrizeIndexRef.current;
    const prize = prizes[prizeIdx];

    // Pick a random winner
    const winnerItem = drawItems[Math.floor(Math.random() * drawItems.length)];
    const customer = allCustomers.find(c =>
      drawMode === 'customer' ? c.id === winnerItem.id : c.advisor === winnerItem.id
    );

    const winner: Winner = {
      id: winnerItem.id,
      customerName: drawMode === 'customer' ? winnerItem.name : winnerItem.name,
      advisor: customer?.advisor || winnerItem.name,
      prizeName: prize?.name || 'Giải thưởng',
      gift: prize?.gift || '',
    };

    // Set up deceleration - the animation loop will handle the gradual slowdown
    pendingWinnerRef.current = winner;
    isDecelRef.current = true;

    // Set up callback for when animation fully stops
    onStoppedRef.current = () => {
      setCurrentWinner(winner);
      setShowResult(true);
      setIsSpinning(false);
      setIsStopping(false);
      setWinners(prev => [...prev, winner]);

      if (drawMode === 'customer') {
        setWonCustomerIds(prev => new Set([...prev, winner.id]));
      } else {
        const advisorCustomerIds = allCustomers
          .filter(c => c.advisor === winner.id)
          .map(c => c.id);
        setWonCustomerIds(prev => new Set([...prev, ...advisorCustomerIds]));
      }

      setLocalPrizeOverrides(prev => {
        const base = prev ?? (Array.isArray(store.drawPrizes) ? store.drawPrizes.map((dp) => ({
          id: dp.id,
          name: dp.name,
          quantity: dp.quantity,
          remaining: dp.quantity,
          gift: dp.gift || '',
        })) : []);
        return base.map((p, i) =>
          i === prizeIdx ? { ...p, remaining: p.remaining - 1 } : p
        );
      });

      // Start confetti celebration
      if (confettiRef.current) {
        confettiRef.current.start();
        setTimeout(() => confettiRef.current?.stop(), 8000);
      }

      // Auto-dismiss winner popup after 6 seconds
      setTimeout(() => {
        setShowResult(false);
      }, 6000);
    };
  }, [isSpinning, isStopping, drawItems, allCustomers, drawMode, prizes, store.drawPrizes, getTrackRef]);

  // Handle stop button click
  const handleStopClick = useCallback(() => {
    try {
      if (isSpinning && !isStopping) {
        stopSpin();
      }
    } catch (err) {
      console.error('Stop error:', err);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setIsSpinning(false);
      setIsStopping(false);
    }
  }, [isSpinning, isStopping, stopSpin]);

  // Spacebar key to start/stop spinning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        if (isSpinning && !isStopping) {
          stopSpin();
        } else if (canStart && !isSpinning) {
          startSpin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSpinning, isStopping, canStart, startSpin, stopSpin]);

  // BUG 1 FIX: handleSelectPrize - only selects, does NOT start spin
  const handleSelectPrize = useCallback((prizeIndex: number) => {
    if (isSpinning) return;
    const prize = prizes[prizeIndex];
    if (!prize || prize.remaining <= 0) return;
    setCurrentPrizeIndex(prizeIndex);
  }, [isSpinning, prizes]);

  // Settings handlers
  const handleSettingsAuth = () => {
    if (settingsPassword === '0969774224') {
      setSettingsAuthenticated(true);
      setEditPrizes([...prizes]);
    }
  };

  const handleAddPrize = () => {
    if (!newPrizeName.trim()) return;
    const newPrize: Prize = {
      id: `prize-${Date.now()}`,
      name: newPrizeName.trim(),
      quantity: parseInt(newPrizeQty) || 1,
      remaining: parseInt(newPrizeQty) || 1,
      gift: newPrizeGift.trim(),
    };
    setEditPrizes(prev => [...prev, newPrize]);
    setNewPrizeName('');
    setNewPrizeQty('1');
    setNewPrizeGift('');
  };

  const handleRemovePrize = (id: string) => {
    setEditPrizes(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveSettings = () => {
    store.saveDrawPrizes(editPrizes.map(p => ({ name: p.name, quantity: p.quantity, gift: p.gift })));
    setLocalPrizeOverrides(editPrizes.map(p => ({ ...p })));
    // Save lucky draw event info
    store.saveLuckyDrawEvent(luckyDrawEventForm);
    setSettingsOpen(false);
    setSettingsAuthenticated(false);
    setSettingsPassword('');
  };

  const handleUpdatePrizeQty = (id: string, qty: number) => {
    setEditPrizes(prev => prev.map(p =>
      p.id === id ? { ...p, quantity: qty, remaining: qty } : p
    ));
  };

  const handleResetWinners = () => {
    setWonCustomerIds(new Set());
    setWinners([]);
    setLocalPrizeOverrides(prev => {
      const base = prev ?? (Array.isArray(store.drawPrizes) ? store.drawPrizes.map((dp) => ({
        id: dp.id,
        name: dp.name,
        quantity: dp.quantity,
        remaining: dp.quantity,
        gift: dp.gift || '',
      })) : []);
      return base.map(p => ({ ...p, remaining: p.quantity }));
    });
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Confetti Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* === MOBILE LAYOUT - Compact controller view === */}
      <div className="flex-1 min-h-0 flex flex-col md:hidden">
        {/* Header for mobile */}
        <div className="flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50, #0f2042)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>
          <div className="relative px-3 py-2 flex items-center">
            <Link href="/" title="Quay lại">
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                className="p-1.5 hover:bg-white/5 rounded-lg transition-all z-10">
                <ArrowLeft className="w-4 h-4" style={{ color: '#d4a843' }} />
              </motion.button>
            </Link>
            {/* Title absolutely centered */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-2">
                <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                  <Diamond className="w-4 h-4" style={{ color: '#f5d870' }} />
                </motion.div>
                <h1 className="text-sm font-black uppercase tracking-wider" style={{ color: '#f5d870', textShadow: '0 0 20px rgba(212,168,67,0.3)' }}>
                  Quay Số May Mắn
                </h1>
              </div>
            </div>
            <div className="flex-1" />
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSettingsOpen(true);
                setSettingsAuthenticated(false);
                setLuckyDrawEventForm({
                  name: store.luckyDrawEvent?.name || '',
                  date: store.luckyDrawEvent?.date || '',
                  location: store.luckyDrawEvent?.location || '',
                });
              }}
              className="p-2 hover:bg-white/5 rounded-lg transition-all z-10" title="Cài đặt">
              <Settings className="w-5 h-5" style={{ color: '#d4a843' }} />
            </motion.button>
          </div>
        </div>

        {/* Slot machine area - compact for phone control */}
        <div className="flex-shrink-0 flex flex-col items-center px-3 pt-2 pb-1">
          {currentPrize && (
            <div className="w-full max-w-md flex items-center justify-center gap-1 mb-1">
              <Crown className="w-3.5 h-3.5" style={{ color: '#f5d870' }} />
              <span style={{ color: '#f5d870' }} className="font-bold text-sm">{currentPrize.name}</span>
              {currentPrize.gift && <span style={{ color: '#10b981' }} className="text-xs">- {currentPrize.gift}</span>}
              <span style={{ color: 'rgba(212,168,67,0.5)' }} className="text-xs">(còn {currentPrize.remaining})</span>
            </div>
          )}

          {/* Slot Machine */}
          <div className={`relative w-full max-w-md rounded-xl overflow-hidden ${canSpin || canStart ? 'animate-pulse-shadow' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #0f2042 0%, #162d50 50%, #0f2042 100%)',
              boxShadow: isSpinning ? '0 0 40px rgba(212,168,67,0.5), inset 0 0 30px rgba(212,168,67,0.1)' : canSpin || canStart ? '0 0 25px rgba(212,168,67,0.3), inset 0 0 20px rgba(212,168,67,0.05)' : '0 0 10px rgba(212,168,67,0.1), inset 0 0 10px rgba(212,168,67,0.02)',
            }}>
            <CircularLEDStrip />
            <div className="relative overflow-hidden" style={{ height: `${SLOT_ITEM_HEIGHT_MOBILE * 5}px` }}>
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0" style={{ height: `${SLOT_ITEM_HEIGHT_MOBILE * 2}px`, background: 'linear-gradient(to bottom, rgba(15,32,66,1) 0%, rgba(15,32,66,0.95) 30%, rgba(15,32,66,0.7) 60%, rgba(15,32,66,0.3) 85%, transparent 100%)' }} />
                <div className="absolute bottom-0 left-0 right-0" style={{ height: `${SLOT_ITEM_HEIGHT_MOBILE * 2}px`, background: 'linear-gradient(to top, rgba(15,32,66,1) 0%, rgba(15,32,66,0.95) 30%, rgba(15,32,66,0.7) 60%, rgba(15,32,66,0.3) 85%, transparent 100%)' }} />
                <div className="absolute left-0 right-0" style={{ top: `calc(50% - ${SLOT_ITEM_HEIGHT_MOBILE / 2}px)`, height: `${SLOT_ITEM_HEIGHT_MOBILE}px`, borderTop: '2px solid rgba(212,168,67,0.6)', borderBottom: '2px solid rgba(212,168,67,0.6)', background: 'rgba(13,90,63,0.15)' }} />
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2"><div className="w-0 h-0" style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '8px solid #d4a843' }} /></div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2"><div className="w-0 h-0" style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid #d4a843' }} /></div>
              </div>
              {!isSpinning && !showResult && (
                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                  <p style={{ color: 'rgba(212,168,67,0.4)' }} className="text-sm font-medium text-center px-4">
                    {prizes.length === 0 ? 'Thêm giải thưởng trong Cài đặt' : drawItems.length === 0 ? 'Không có người tham gia' : 'Chọn giải → Bấm QUAY'}
                  </p>
                </div>
              )}
              <div ref={mobileTrackRef} className="absolute left-0 right-0 top-0" />
            </div>
          </div>

          {/* START BUTTON (mobile) - BUG 1 FIX */}
          <AnimatePresence>
            {canStart && !isSpinning && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center mt-2 mb-1">
                <motion.button whileTap={{ scale: 0.92 }} onClick={startSpin}
                  className="relative" style={{ width: '80px', height: '80px', cursor: 'pointer' }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: 'linear-gradient(145deg, #10b981, #059669)',
                    boxShadow: '0 4px 0 #065f46, 0 8px 16px rgba(6, 95, 70, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                  }} />
                  <div className="absolute rounded-full flex items-center justify-center" style={{
                    top: '3px', left: '3px', right: '3px', bottom: '5px',
                    background: 'radial-gradient(circle at 35% 35%, #6ee7b7 0%, #10b981 40%, #059669 100%)',
                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)',
                    border: '2px solid rgba(110, 231, 183, 0.6)',
                  }}>
                    <span className="font-black uppercase tracking-wider leading-tight text-center" style={{ color: '#065f46', fontSize: '14px', textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>
                      QUAY!
                    </span>
                  </div>
                  <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(16, 185, 129, 0.2)', animationDuration: '1s' }} />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* STOP BUTTON (mobile) */}
          <AnimatePresence>
            {isSpinning && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center mt-2 mb-1">
                <motion.button whileTap={{ scale: 0.92 }} onClick={handleStopClick} disabled={isStopping}
                  className="relative" style={{ width: '80px', height: '80px', cursor: 'pointer' }}>
                  <div className="absolute inset-0 rounded-full" style={{
                    background: isStopping ? 'linear-gradient(145deg, #9ca3af, #6b7280)' : 'linear-gradient(145deg, #ef4444, #b91c1c)',
                    boxShadow: isStopping ? '0 4px 0 #4b5563, 0 6px 12px rgba(75, 85, 99, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)' : '0 4px 0 #7f1d1d, 0 8px 16px rgba(127, 29, 29, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                  }} />
                  <div className="absolute rounded-full flex items-center justify-center" style={{
                    top: '3px', left: '3px', right: '3px', bottom: '5px',
                    background: isStopping ? 'radial-gradient(circle at 35% 35%, #e5e7eb 0%, #9ca3af 40%, #6b7280 100%)' : 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 40%, #b91c1c 100%)',
                    boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)',
                    border: isStopping ? '2px solid rgba(156, 163, 175, 0.6)' : '2px solid rgba(248, 113, 113, 0.6)',
                  }}>
                    <span className="font-black uppercase tracking-wider leading-tight text-center" style={{ color: isStopping ? '#4b5563' : '#7f1d1d', fontSize: '12px', textShadow: '0 1px 2px rgba(255,255,255,0.5)' }}>
                      {isStopping ? 'Đang\ndừng...' : 'DỪNG!'}
                    </span>
                  </div>
                  {!isStopping && <div className="absolute inset-0 rounded-full animate-ping" style={{ background: 'rgba(239, 68, 68, 0.2)', animationDuration: '1s' }} />}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Winner result overlay - mobile - MUCH BIGGER */}
        <AnimatePresence>
          {showResult && currentWinner && (
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.4 }}
              className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
              <div className="w-[90vw] max-w-lg rounded-3xl p-6 text-center relative overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #0f2042, #162d50, #0f2042)',
                  boxShadow: '0 0 80px rgba(255,224,138,0.5), 0 0 200px rgba(255,224,138,0.15), inset 0 0 60px rgba(255,224,138,0.08)',
                  border: '3px solid rgba(255,224,138,0.5)',
                }}>
                {/* LED strip around winner popup */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                  <div className="absolute top-0 left-0 right-0 h-2 flex overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={`wt-${i}`} className="flex-1 led-dot" style={{ animationDelay: `${i * 0.05}s` }} />
                    ))}
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 h-2 flex overflow-hidden">
                    {Array.from({ length: 40 }).map((_, i) => (
                      <div key={`wb-${i}`} className="flex-1 led-dot" style={{ animationDelay: `${(40 - i) * 0.05}s` }} />
                    ))}
                  </div>
                </div>
                {/* Trophy icon */}
                <motion.div animate={{ rotate: [0, -10, 10, -10, 0], scale: [1, 1.2, 1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-3">
                  <Trophy className="w-16 h-16 mx-auto" style={{ color: '#ffe08a', filter: 'drop-shadow(0 0 15px rgba(255,224,138,0.5))' }} />
                </motion.div>
                <p className="text-lg uppercase tracking-widest mb-2 font-bold" style={{ color: 'rgba(232,184,74,0.7)' }}>🎉 Chúc Mừng 🎉</p>
                <p className="text-4xl font-black mb-2 animate-neon-pulse" style={{ color: '#ffe08a', textShadow: '0 0 30px rgba(255,224,138,0.5), 0 0 60px rgba(255,224,138,0.2)' }}>
                  {currentWinner.customerName}
                </p>
                {drawMode === 'customer' && currentWinner.advisor && <p className="text-lg mb-1" style={{ color: 'rgba(232,184,74,0.6)' }}>TVV: {currentWinner.advisor}</p>}
                <div className="mt-3 py-2 px-4 rounded-xl inline-block" style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}>
                  <p className="text-xl font-bold" style={{ color: '#34d399' }}>{currentWinner.prizeName}</p>
                </div>
                {currentWinner.gift && <p className="text-lg mt-2" style={{ color: '#ffe08a' }}>🎁 {currentWinner.gift}</p>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* BOTTOM: Combined Prizes + Customers on mobile */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ borderTop: '2px solid rgba(212,168,67,0.3)' }}>
          {/* Prize select buttons - BUG 1 FIX: now only selects */}
          <div className="flex-shrink-0" style={{ background: 'rgba(15,32,66,0.9)', borderBottom: '1px solid rgba(212,168,67,0.2)' }}>
            <div className="flex items-center gap-1.5 px-2 py-1.5">
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: '#d4a843' }}>Giải:</span>
              {prizes.length === 0 ? (
                <span style={{ color: 'rgba(212,168,67,0.4)' }} className="text-xs">Chưa có giải</span>
              ) : (
                <div className="flex gap-1 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
                  {prizes.map((prize, idx) => {
                    const IconComp = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                    const isAvailable = prize.remaining > 0 && !isSpinning;
                    const isSelected = idx === currentPrizeIndex;
                    return (
                      <motion.button key={prize.id} whileTap={isAvailable ? { scale: 0.92 } : {}}
                        onClick={() => handleSelectPrize(idx)} disabled={!isAvailable}
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${isSelected ? 'animate-pulse' : ''}`}
                        style={{
                          background: isSelected ? 'linear-gradient(135deg, #0d5a3f, #0a7a4a)' : prize.remaining <= 0 ? 'rgba(15,32,66,0.5)' : 'rgba(22,45,80,0.8)',
                          borderColor: isSelected ? '#10b981' : prize.remaining <= 0 ? 'rgba(212,168,67,0.1)' : 'rgba(212,168,67,0.4)',
                          color: prize.remaining <= 0 ? 'rgba(212,168,67,0.25)' : '#f5d870',
                          cursor: !isAvailable ? 'not-allowed' : 'pointer',
                        }}>
                        <IconComp className="w-3 h-3" />
                        <span>{prize.name}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded-full" style={{ background: prize.remaining <= 0 ? 'rgba(212,168,67,0.1)' : 'rgba(13,90,63,0.4)', color: prize.remaining <= 0 ? 'rgba(212,168,67,0.3)' : '#10b981' }}>{prize.remaining}</span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Customer list */}
          <div className="flex-1 min-h-0 flex flex-col" style={{ background: 'rgba(10,22,40,0.95)' }}>
            <div className="flex-shrink-0 flex items-center px-3 py-1.5" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
              <div className="flex-1 flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: '#f5d870' }} />
                <span style={{ color: '#f5d870' }} className="font-extrabold text-sm uppercase">DS Tham Dự</span>
                <span style={{ color: 'rgba(212,168,67,0.6)' }} className="text-xs">({allCustomers.length})</span>
              </div>
              <div className="flex gap-0.5 p-0.5 rounded-md" style={{ background: 'rgba(10,22,40,0.6)' }}>
                <button onClick={() => setDrawMode('customer')} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
                  style={{ background: drawMode === 'customer' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent', color: drawMode === 'customer' ? '#0a1628' : 'rgba(212,168,67,0.5)' }}>KH</button>
                <button onClick={() => setDrawMode('advisor')} className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
                  style={{ background: drawMode === 'advisor' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent', color: drawMode === 'advisor' ? '#0a1628' : 'rgba(212,168,67,0.5)' }}>TVV</button>
              </div>
            </div>
            <div ref={customerTableRef} className="flex-1 overflow-y-auto">
              {[0, 1].map(dup => (
                <div key={dup}>
                  {allCustomers.map((c, idx) => {
                    const isWon = wonCustomerIds.has(c.id);
                    return (
                      <div key={`${c.id}-${dup}`} className="flex items-center px-3 py-2 transition-colors"
                        style={{ borderBottom: '1px solid rgba(212,168,67,0.08)', background: isWon ? 'rgba(13,90,63,0.1)' : 'transparent', opacity: isWon ? 0.4 : 1 }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs w-6 flex-shrink-0" style={{ color: 'rgba(212,168,67,0.3)' }}>{idx + 1}</span>
                            <span className={`text-base font-bold truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.3)' : '#f5d870' }}>{titleCase(c.name)}</span>
                          </div>
                          {c.advisor && <div className="pl-[28px]"><span className="text-xs italic" style={{ color: isWon ? 'rgba(212,168,67,0.15)' : 'rgba(212,168,67,0.5)' }}>TVV {titleCase(c.advisor)}</span></div>}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                          {c.investmentFee > 0 && <span className="text-xs font-semibold" style={{ color: isWon ? 'rgba(212,168,67,0.15)' : '#10b981' }}>{c.investmentFee}tr</span>}
                          <span className={`text-sm font-bold max-w-[140px] truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.2)' : '#d4a843' }}>{c.gift || '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/* === DESKTOP LAYOUT - REDESIGNED === */}
      {/* Left: continuous sidebar (Customer 2/3 + Prize 1/3, no title cutting) */}
      {/* Right: Title + Slot Machine + Winner List + Bubble BG */}
      {/* ================================================================ */}
      <div className="flex-1 min-h-0 hidden md:flex md:flex-row">

        {/* === LEFT SIDEBAR: Continuous from top to bottom === */}
        {/* Customer 2/3, Prize+Gift 1/3 — no title/header cutting across */}
        <div className="w-[22%] min-w-[280px] max-w-[380px] flex flex-col" style={{ background: 'rgba(12,24,48,0.95)', borderRight: '2px solid rgba(232,184,74,0.35)' }}>

          {/* CUSTOMERS section — 2/3 height */}
          <div className="flex-[2] min-h-0 flex flex-col">
            <div className="flex-shrink-0 flex items-center px-3 py-2" style={{ background: 'linear-gradient(135deg, #142a52, #1c3a6e)', borderBottom: '1px solid rgba(232,184,74,0.35)' }}>
              <Users className="w-4 h-4" style={{ color: '#ffe08a' }} />
              <span style={{ color: '#ffe08a' }} className="font-extrabold text-sm uppercase ml-1.5">Khách Hàng</span>
              <span style={{ color: 'rgba(232,184,74,0.6)' }} className="text-xs ml-1">({allCustomers.length})</span>
              <div className="ml-auto flex gap-0.5 p-0.5 rounded" style={{ background: 'rgba(15,34,64,0.6)' }}>
                <button onClick={() => setDrawMode('customer')} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all"
                  style={{ background: drawMode === 'customer' ? 'linear-gradient(135deg, #e8b84a, #c9a227)' : 'transparent', color: drawMode === 'customer' ? '#0f2240' : 'rgba(232,184,74,0.5)' }}>KH</button>
                <button onClick={() => setDrawMode('advisor')} className="px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-all"
                  style={{ background: drawMode === 'advisor' ? 'linear-gradient(135deg, #e8b84a, #c9a227)' : 'transparent', color: drawMode === 'advisor' ? '#0f2240' : 'rgba(232,184,74,0.5)' }}>TVV</button>
              </div>
            </div>
            <div ref={customerTableRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e8b84a transparent', fontFamily: 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif' }}>
              {[0, 1].map(dup => (
                <div key={dup}>
                  {allCustomers.map((c, idx) => {
                    const isWon = wonCustomerIds.has(c.id);
                    return (
                      <div key={`${c.id}-${dup}`} className="flex items-center px-3 py-2 transition-colors"
                        style={{ borderBottom: '1px solid rgba(232,184,74,0.08)', background: isWon ? 'rgba(52,211,153,0.06)' : 'transparent', opacity: isWon ? 0.4 : 1 }}>
                        <span className="font-mono text-xs w-6 flex-shrink-0" style={{ color: 'rgba(232,184,74,0.3)' }}>{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <span className={`text-sm font-bold truncate block ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(232,184,74,0.25)' : '#ffe08a' }}>{titleCase(c.name)}</span>
                          {c.advisor && <span className="text-[11px] italic block" style={{ color: isWon ? 'rgba(232,184,74,0.12)' : 'rgba(232,184,74,0.5)' }}>TVV {titleCase(c.advisor)}</span>}
                        </div>
                        {isWon && <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(52,211,153,0.2)', color: '#34d399' }}>Trúng</span>}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* PRIZE + GIFT section — 1/3 height — only "Giải X - Tên quà" format */}
          <div className="flex-[1] min-h-0 flex flex-col" style={{ borderTop: '1px solid rgba(232,184,74,0.25)' }}>
            <div className="flex-shrink-0 flex items-center px-3 py-2" style={{ background: 'linear-gradient(135deg, #142a52, #1c3a6e)', borderBottom: '1px solid rgba(232,184,74,0.35)' }}>
              <Gift className="w-4 h-4" style={{ color: '#ffe08a' }} />
              <span style={{ color: '#ffe08a' }} className="font-extrabold text-sm uppercase ml-1.5">Giải & Quà</span>
            </div>
            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1" style={{ fontFamily: 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif' }}>
              {prizes.length > 0 && prizes.map((prize, idx) => {
                const IconComp = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                const isAvailable = prize.remaining > 0 && !isSpinning;
                const isSelected = idx === currentPrizeIndex;
                return (
                  <motion.button
                    key={prize.id}
                    whileTap={isAvailable ? { scale: 0.95 } : {}}
                    whileHover={isAvailable ? { scale: 1.02 } : {}}
                    onClick={() => handleSelectPrize(idx)}
                    disabled={!isAvailable}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all"
                    style={{
                      background: isSelected
                        ? 'linear-gradient(135deg, #0d5a3f, #0a7a4a)'
                        : prize.remaining <= 0
                          ? 'rgba(20,42,82,0.5)'
                          : 'rgba(28,58,110,0.6)',
                      border: isSelected
                        ? '1px solid #34d399'
                        : prize.remaining <= 0
                          ? '1px solid rgba(232,184,74,0.12)'
                          : '1px solid rgba(232,184,74,0.35)',
                      color: prize.remaining <= 0 ? 'rgba(232,184,74,0.25)' : '#ffe08a',
                      cursor: !isAvailable ? 'not-allowed' : 'pointer',
                      boxShadow: isSelected ? '0 0 15px rgba(52,211,153,0.3)' : 'none',
                    }}
                  >
                    <IconComp className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-left">
                      {prize.name}
                      {prize.gift && <span className="text-xs ml-1" style={{ color: '#34d399' }}>- {prize.gift}</span>}
                    </span>
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: prize.remaining <= 0 ? 'rgba(232,184,74,0.08)' : 'rgba(52,211,153,0.2)',
                        color: prize.remaining <= 0 ? 'rgba(232,184,74,0.2)' : '#34d399',
                      }}>
                      {prize.remaining}
                    </span>
                  </motion.button>
                );
              })}
              {prizes.length === 0 && (
                <p className="text-xs text-center py-4 italic" style={{ color: 'rgba(232,184,74,0.3)' }}>Chưa có giải. Thêm trong Cài đặt</p>
              )}
            </div>
          </div>
        </div>

        {/* === RIGHT: Title + Slot Machine + Winner List + Bubble BG === */}
        <div className="flex-1 min-h-0 flex flex-col relative" style={{ background: '#0f2240' }}>

          {/* Bubble canvas background */}
          <canvas
            ref={fireworkCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-0"
          />

          {/* Background glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] rounded-full blur-3xl pointer-events-none z-0"
            style={{ background: 'radial-gradient(ellipse, rgba(255,224,138,0.1) 0%, transparent 60%)' }} />

          {/* Title bar — aligned with slot machine area, NOT cutting sidebar */}
          <div className="flex-shrink-0 relative z-10 px-8 pt-4 pb-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" title="Quay lại">
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  className="p-1.5 hover:bg-white/5 rounded-lg transition-all">
                  <ArrowLeft className="w-5 h-5" style={{ color: '#e8b84a' }} />
                </motion.button>
              </Link>
              <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}>
                <Diamond className="w-8 h-8" style={{ color: '#ffe08a' }} />
              </motion.div>
              <h1 className="text-4xl font-black uppercase tracking-wider animate-neon-pulse" style={{ color: '#ffe08a' }}>
                {store.luckyDrawEvent?.name || 'Quay Số May Mắn'}
              </h1>
            </div>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
              onClick={() => {
                setSettingsOpen(true);
                setSettingsAuthenticated(false);
                setLuckyDrawEventForm({
                  name: store.luckyDrawEvent?.name || '',
                  date: store.luckyDrawEvent?.date || '',
                  location: store.luckyDrawEvent?.location || '',
                });
              }}
              className="p-2 hover:bg-white/5 rounded-lg transition-all" title="Cài đặt">
              <Settings className="w-6 h-6" style={{ color: '#e8b84a' }} />
            </motion.button>
          </div>

          {/* Slot Machine — takes majority of the right side, moved down slightly */}
          <div className="flex-[7] min-h-0 relative z-10 px-8 pt-6 pb-2 flex flex-col justify-center">
            {/* Prize indicator */}
            {currentPrize && (
              <div className="flex items-center justify-center gap-3 mb-2">
                <Crown className="w-8 h-8" style={{ color: '#ffe08a' }} />
                <span className="font-extrabold text-2xl" style={{ color: '#ffe08a' }}>{currentPrize.name}</span>
                {currentPrize.gift && <span className="text-lg" style={{ color: '#34d399' }}>🎁 {currentPrize.gift}</span>}
                <span className="text-lg" style={{ color: 'rgba(232,184,74,0.5)' }}>(còn {currentPrize.remaining})</span>
              </div>
            )}

            <div className={`relative w-full max-w-6xl mx-auto rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-1000 ${canSpin || canStart ? 'animate-pulse-shadow' : ''}`}
              style={{
                background: 'linear-gradient(180deg, #142a52 0%, #1c3a6e 30%, #1c3a6e 70%, #142a52 100%)',
                boxShadow: isSpinning ? '0 0 100px rgba(255,224,138,0.6), inset 0 0 60px rgba(255,224,138,0.1)' : canSpin || canStart ? '0 0 80px rgba(255,224,138,0.45), inset 0 0 60px rgba(255,224,138,0.08)' : '0 0 40px rgba(255,224,138,0.2), inset 0 0 30px rgba(255,224,138,0.04)',
                border: '2px solid rgba(255,224,138,0.3)',
              }}>
              {/* LED strip running around in circles */}
              <CircularLEDStrip />
              {/* LED circle dots around slot machine */}
              <div className="absolute inset-0 pointer-events-none z-20">
                {/* Circle of LED dots around the border */}
                {Array.from({ length: 36 }).map((_, i) => {
                  const angle = (i / 36) * Math.PI * 2 - Math.PI / 2;
                  const rx = 50;
                  const ry = 50;
                  const x = 50 + rx * Math.cos(angle);
                  const y = 50 + ry * Math.sin(angle);
                  return (
                    <div
                      key={`circ-led-${i}`}
                      className="absolute w-2.5 h-2.5 rounded-full led-corner"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transform: 'translate(-50%, -50%)',
                        animationDelay: `${i * 0.09}s`,
                        background: 'rgba(255,224,138,0.3)',
                      }}
                    />
                  );
                })}
              </div>

              {/* Slot viewport - 5 items visible */}
              <div className="relative overflow-hidden" style={{ height: `${SLOT_ITEM_HEIGHT_DESKTOP * 5}px` }}>
                <div className="absolute inset-0 pointer-events-none z-10">
                  <div className="absolute top-0 left-0 right-0" style={{ height: `${SLOT_ITEM_HEIGHT_DESKTOP * 2}px`, background: 'linear-gradient(to bottom, rgba(20,42,82,1) 0%, rgba(20,42,82,0.95) 30%, rgba(20,42,82,0.7) 60%, rgba(20,42,82,0.3) 85%, transparent 100%)' }} />
                  <div className="absolute bottom-0 left-0 right-0" style={{ height: `${SLOT_ITEM_HEIGHT_DESKTOP * 2}px`, background: 'linear-gradient(to top, rgba(20,42,82,1) 0%, rgba(20,42,82,0.95) 30%, rgba(20,42,82,0.7) 60%, rgba(20,42,82,0.3) 85%, transparent 100%)' }} />
                  <div className="absolute left-0 right-0" style={{ top: `calc(50% - ${SLOT_ITEM_HEIGHT_DESKTOP / 2}px)`, height: `${SLOT_ITEM_HEIGHT_DESKTOP}px`, borderTop: '3px solid rgba(255,224,138,0.7)', borderBottom: '3px solid rgba(255,224,138,0.7)', background: 'rgba(255,224,138,0.12)' }} />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2"><div className="w-0 h-0" style={{ borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderLeft: '28px solid #ffe08a' }} /></div>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="w-0 h-0" style={{ borderTop: '20px solid transparent', borderBottom: '20px solid transparent', borderRight: '28px solid #ffe08a' }} /></div>
                </div>
                {!isSpinning && !showResult && (
                  <div className="absolute inset-0 flex items-center justify-center z-[5]">
                    <p className="text-3xl font-medium" style={{ color: 'rgba(255,224,138,0.4)' }}>
                      {prizes.length === 0 ? 'Thêm giải thưởng trong Cài đặt' : drawItems.length === 0 ? 'Không có người tham gia' : 'Chọn giải bên trái → Bấm QUAY'}
                    </p>
                  </div>
                )}
                <div ref={desktopTrackRef} className="absolute left-0 right-0 top-0" />
              </div>
            </div>

            {/* START / STOP buttons below slot machine - desktop */}
            <div className="flex items-center justify-center gap-4 mt-4">
              {/* START button - BUG 1 FIX */}
              <AnimatePresence>
                {canStart && !isSpinning && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={startSpin}
                    className="relative px-12 py-4 rounded-2xl font-black text-2xl uppercase tracking-wider"
                    style={{
                      background: 'linear-gradient(145deg, #10b981, #059669)',
                      boxShadow: '0 6px 0 #065f46, 0 10px 20px rgba(6, 95, 70, 0.4), inset 0 1px 3px rgba(255,255,255,0.3)',
                      color: '#ecfdf5',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      border: '2px solid rgba(110, 231, 183, 0.5)',
                      cursor: 'pointer',
                    }}
                  >
                    <Zap className="w-6 h-6 inline mr-2" />
                    QUAY!
                  </motion.button>
                )}
              </AnimatePresence>

              {/* STOP button */}
              <AnimatePresence>
                {isSpinning && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStopClick}
                    disabled={isStopping}
                    className="relative px-12 py-4 rounded-2xl font-black text-2xl uppercase tracking-wider"
                    style={{
                      background: isStopping ? 'linear-gradient(145deg, #9ca3af, #6b7280)' : 'linear-gradient(145deg, #ef4444, #b91c1c)',
                      boxShadow: isStopping ? '0 6px 0 #4b5563, 0 10px 20px rgba(75, 85, 99, 0.4)' : '0 6px 0 #7f1d1d, 0 10px 20px rgba(127, 29, 29, 0.4)',
                      color: '#fef2f2',
                      textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      border: isStopping ? '2px solid rgba(156, 163, 175, 0.5)' : '2px solid rgba(248, 113, 113, 0.5)',
                      cursor: isStopping ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isStopping ? 'Đang dừng...' : 'DỪNG!'}
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Winner list below slot machine — compact, dark transparent bg */}
          <div className="flex-[2.5] min-h-0 flex flex-col relative z-10 px-8 pb-4">
            {/* BUG 5 FIX: Centered title with divider and auto-scroll toggle */}
            <div className="flex-shrink-0 flex items-center justify-center py-2">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,224,138,0.2)' }} />
              <span style={{ color: '#ffe08a' }} className="font-extrabold text-3xl uppercase mx-3">DS Khách Hàng Trúng Giải</span>
              <span style={{ color: 'rgba(232,184,74,0.5)' }} className="text-2xl">({winners.length})</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,224,138,0.2)' }} />
              {/* BUG 4 FIX: Auto-scroll toggle for winner list */}
              <motion.button whileTap={{ scale: 0.9 }} onClick={() => setWinnerAutoScroll(!winnerAutoScroll)} className="ml-2 p-1 rounded transition-all"
                style={{ background: winnerAutoScroll ? 'rgba(52,211,153,0.2)' : 'rgba(232,184,74,0.1)', color: winnerAutoScroll ? '#34d399' : 'rgba(232,184,74,0.4)' }}
                title={winnerAutoScroll ? 'Tắt cuộn' : 'Bật cuộn'}>
                {winnerAutoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </motion.button>
            </div>
            <div ref={winnerTableRef} className="flex-1 min-h-0 overflow-y-auto rounded-lg" style={{ background: 'rgba(0,0,0,0.4)', scrollbarWidth: 'thin', scrollbarColor: '#e8b84a transparent', fontFamily: 'var(--font-roboto-condensed), "Roboto Condensed", sans-serif' }}>
              {winners.length === 0 ? (
                <div className="flex items-center justify-center py-3">
                  <p className="text-2xl italic" style={{ color: 'rgba(255,224,138,0.2)' }}>Chưa có người trúng giải</p>
                </div>
              ) : (
                (winnerAutoScroll ? [0, 1] : [0]).map(dup => (
                  <div key={dup}>
                    {[...winners].reverse().map((winner, idx) => {
                      const isLatest = idx === 0 && showResult;
                      return (
                        <div
                          key={`${winner.id}-${idx}-${dup}`}
                          className="flex items-center px-4 py-2.5 transition-all"
                          style={{
                            background: isLatest ? 'rgba(255,224,138,0.1)' : 'transparent',
                            borderBottom: '1px solid rgba(255,224,138,0.06)',
                          }}
                        >
                          <span className="font-mono text-2xl w-10 flex-shrink-0 font-bold" style={{ color: isLatest ? '#ffe08a' : 'rgba(232,184,74,0.25)' }}>{winners.length - idx}</span>
                          <span className="text-2xl font-bold truncate" style={{ color: isLatest ? '#ffe08a' : 'rgba(232,184,74,0.6)' }}>{titleCase(winner.customerName)}</span>
                          <span className="mx-3 text-2xl" style={{ color: 'rgba(255,224,138,0.15)' }}>—</span>
                          <span className="text-xl font-semibold" style={{ color: isLatest ? '#ffe08a' : '#34d399' }}>{winner.prizeName}</span>
                          {winner.gift && <span className="text-xl ml-3" style={{ color: 'rgba(232,184,74,0.5)' }}>🎁 {winner.gift}</span>}
                        </div>
                      );
                    })}
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Winner popup — FULL SCREEN celebration */}
          <AnimatePresence>
            {showResult && currentWinner && (
              <motion.div
                initial={{ opacity: 0, scale: 0.4 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.4 }}
                transition={{ type: 'spring', duration: 0.7, bounce: 0.3 }}
                className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none"
                style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)' }}
              >
                <div className="w-[80vw] max-w-4xl rounded-3xl p-10 text-center relative overflow-hidden" style={{
                  background: 'linear-gradient(135deg, #0f2042, #162d50, #0f2042)',
                  boxShadow: '0 0 100px rgba(255,224,138,0.6), 0 0 250px rgba(255,224,138,0.15), inset 0 0 80px rgba(255,224,138,0.08)',
                  border: '3px solid rgba(255,224,138,0.5)',
                }}>
                  {/* LED strip around winner popup */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-3xl">
                    <div className="absolute top-0 left-0 right-0 h-3 flex overflow-hidden">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <div key={`wt-${i}`} className="flex-1 led-dot" style={{ animationDelay: `${i * 0.04}s` }} />
                      ))}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 h-3 flex overflow-hidden">
                      {Array.from({ length: 60 }).map((_, i) => (
                        <div key={`wb-${i}`} className="flex-1 led-dot" style={{ animationDelay: `${(60 - i) * 0.04}s` }} />
                      ))}
                    </div>
                    <div className="absolute top-3 left-0 bottom-3 w-3 flex flex-col overflow-hidden">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={`wl-${i}`} className="flex-1 led-dot-v" style={{ animationDelay: `${(60 + i) * 0.04}s` }} />
                      ))}
                    </div>
                    <div className="absolute top-3 right-0 bottom-3 w-3 flex flex-col overflow-hidden">
                      {Array.from({ length: 25 }).map((_, i) => (
                        <div key={`wr-${i}`} className="flex-1 led-dot-v" style={{ animationDelay: `${(95 - i) * 0.04}s` }} />
                      ))}
                    </div>
                  </div>
                  {/* Trophy icon animated */}
                  <motion.div animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1, 1.2, 1, 1.1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    className="mb-4">
                    <Trophy className="w-24 h-24 mx-auto" style={{ color: '#ffe08a', filter: 'drop-shadow(0 0 20px rgba(255,224,138,0.6))' }} />
                  </motion.div>
                  <p className="text-2xl uppercase tracking-widest mb-3 font-bold" style={{ color: 'rgba(232,184,74,0.7)' }}>🎉 Chúc Mừng Người Trúng Giải 🎉</p>
                  <p className="text-7xl font-black mb-3 animate-neon-pulse" style={{ color: '#ffe08a', textShadow: '0 0 40px rgba(255,224,138,0.5), 0 0 80px rgba(255,224,138,0.2)' }}>{currentWinner.customerName}</p>
                  {drawMode === 'customer' && currentWinner.advisor && <p className="text-3xl mb-2" style={{ color: 'rgba(232,184,74,0.6)' }}>TVV: {currentWinner.advisor}</p>}
                  <div className="mt-4 py-3 px-8 rounded-2xl inline-block" style={{ background: 'rgba(52,211,153,0.15)', border: '2px solid rgba(52,211,153,0.3)' }}>
                    <p className="text-4xl font-bold" style={{ color: '#34d399' }}>{currentWinner.prizeName}</p>
                  </div>
                  {currentWinner.gift && <p className="text-3xl mt-3" style={{ color: '#ffe08a' }}>🎁 {currentWinner.gift}</p>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* === SETTINGS MODAL === */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl shadow-2xl"
              style={{ background: '#0f2042', border: '2px solid rgba(212,168,67,0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden p-4 flex justify-between items-center"
                style={{ background: 'linear-gradient(135deg, #0a1628, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
                <h2 className="text-xl font-bold" style={{ color: '#f5d870' }}>Cài đặt Quay Số</h2>
                <button onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }} className="p-1 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-6 h-6" style={{ color: '#d4a843' }} />
                </button>
              </div>

              {!settingsAuthenticated ? (
                <div className="p-6 text-center">
                  <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(10,22,40,0.8)', border: '1px solid rgba(212,168,67,0.2)' }}>
                    <Settings className="w-10 h-10 mx-auto mb-3" style={{ color: '#d4a843' }} />
                    <p className="text-sm mb-3" style={{ color: 'rgba(212,168,67,0.6)' }}>Nhập mật khẩu để tiếp tục</p>
                    <input
                      type="password"
                      value={settingsPassword}
                      onChange={e => setSettingsPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSettingsAuth()}
                      placeholder="Mật khẩu"
                      className="w-full p-3 rounded-lg text-center font-mono text-lg tracking-widest outline-none transition-all"
                      style={{ border: '2px solid rgba(212,168,67,0.3)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                      autoFocus
                    />
                    {settingsPassword && settingsPassword !== '0969774224' && <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Mật khẩu không đúng</p>}
                  </div>
                  <button onClick={handleSettingsAuth} className="px-6 py-2.5 rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}>Xác nhận</button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(10,22,40,0.6)' }}>
                    {(['general', 'prizes', 'customers'] as const).map(tab => (
                      <button key={tab} onClick={() => setSettingsTab(tab)}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all"
                        style={{ background: settingsTab === tab ? 'linear-gradient(135deg, #0f2042, #162d50)' : 'transparent', color: settingsTab === tab ? '#f5d870' : 'rgba(212,168,67,0.4)', boxShadow: settingsTab === tab ? '0 0 10px rgba(212,168,67,0.15)' : 'none' }}>
                        {tab === 'general' ? 'Chung' : tab === 'prizes' ? 'Giải thưởng' : 'Khách hàng'}
                      </button>
                    ))}
                  </div>

                  {/* General tab - BUG 7 FIX: Uses luckyDrawEventForm (separate from registration) */}
                  {settingsTab === 'general' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: '#d4a843' }}>Thông tin chương trình quay số</h4>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Tiêu đề chương trình</label>
                          <input value={luckyDrawEventForm.name} onChange={(e) => setLuckyDrawEventForm({ ...luckyDrawEventForm, name: e.target.value })} placeholder="Nhập tiêu đề chương trình"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Ngày tháng</label>
                          <input value={luckyDrawEventForm.date} onChange={(e) => setLuckyDrawEventForm({ ...luckyDrawEventForm, date: e.target.value })} placeholder="VD: 20/03/2025"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Địa điểm</label>
                          <input value={luckyDrawEventForm.location} onChange={(e) => setLuckyDrawEventForm({ ...luckyDrawEventForm, location: e.target.value })} placeholder="VD: TP. Hồ Chí Minh"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                        </div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: '#d4a843' }}>Thống kê</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between"><span style={{ color: 'rgba(212,168,67,0.5)' }}>Tổng khách hàng:</span><span style={{ color: '#f5d870' }} className="font-bold">{allCustomers.length}</span></div>
                          <div className="flex justify-between"><span style={{ color: 'rgba(212,168,67,0.5)' }}>Tổng TVV:</span><span style={{ color: '#f5d870' }} className="font-bold">{[...new Set(allCustomers.map(c => c.advisor).filter(Boolean))].length}</span></div>
                          <div className="flex justify-between"><span style={{ color: 'rgba(212,168,67,0.5)' }}>Số giải đã trao:</span><span style={{ color: '#f5d870' }} className="font-bold">{winners.length}</span></div>
                          <div className="flex justify-between"><span style={{ color: 'rgba(212,168,67,0.5)' }}>Còn lại:</span><span style={{ color: '#10b981' }} className="font-bold">{drawItems.length}</span></div>
                        </div>
                      </div>
                      <button onClick={handleResetWinners} className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>Đặt lại toàn bộ kết quả</button>
                    </div>
                  )}

                  {/* Prizes tab - BUG 6 FIX: includes gift field */}
                  {settingsTab === 'prizes' && (
                    <div className="space-y-3">
                      {editPrizes.map((prize, idx) => {
                        const IconComp = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                        return (
                          <div key={prize.id} className="p-3 rounded-xl space-y-2"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                            <div className="flex items-center gap-2">
                              <IconComp className="w-4 h-4 flex-shrink-0" style={{ color: '#d4a843' }} />
                              <input value={prize.name} onChange={e => { const updated = [...editPrizes]; updated[idx] = { ...updated[idx], name: e.target.value }; setEditPrizes(updated); }}
                                className="flex-1 p-1.5 rounded-md text-sm outline-none"
                                style={{ border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                              <input type="number" min={1} value={prize.quantity} onChange={e => handleUpdatePrizeQty(prize.id, parseInt(e.target.value) || 1)}
                                className="w-16 p-1.5 rounded-md text-sm text-center outline-none"
                                style={{ border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                              <button onClick={() => handleRemovePrize(prize.id)} className="p-1.5 rounded-md transition-colors" style={{ color: '#ef4444' }}>
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="flex items-center gap-2 pl-6">
                              <Gift className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#10b981' }} />
                              <input value={prize.gift} onChange={e => { const updated = [...editPrizes]; updated[idx] = { ...updated[idx], gift: e.target.value }; setEditPrizes(updated); }}
                                placeholder="Quà tặng (VD: Tivi, Vàng...)"
                                className="flex-1 p-1.5 rounded-md text-sm outline-none"
                                style={{ border: '1px solid rgba(52,211,153,0.2)', background: 'rgba(10,22,40,0.8)', color: '#34d399' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input value={newPrizeName} onChange={e => setNewPrizeName(e.target.value)} placeholder="Tên giải"
                            className="flex-1 p-2 rounded-lg text-sm outline-none"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                          <input type="number" min={1} value={newPrizeQty} onChange={e => setNewPrizeQty(e.target.value)}
                            className="w-20 p-2 rounded-lg text-sm text-center outline-none"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }} />
                          <button onClick={handleAddPrize} className="px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                            style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}>
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex gap-2 pl-1">
                          <Gift className="w-4 h-4 flex-shrink-0 mt-2" style={{ color: '#10b981' }} />
                          <input value={newPrizeGift} onChange={e => setNewPrizeGift(e.target.value)} placeholder="Quà tặng (VD: Tivi, Vàng...)"
                            className="flex-1 p-2 rounded-lg text-sm outline-none"
                            style={{ border: '2px solid rgba(52,211,153,0.2)', background: 'rgba(10,22,40,0.8)', color: '#34d399' }} />
                        </div>
                      </div>
                      <button onClick={handleSaveSettings} className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}>Lưu giải thưởng</button>
                    </div>
                  )}

                  {/* Customers tab */}
                  {settingsTab === 'customers' && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                        <p className="text-sm" style={{ color: 'rgba(212,168,67,0.5)' }}>
                          Quản lý khách hàng từ <Link href="/" style={{ color: '#10b981' }} className="underline font-semibold">trang chính</Link>.
                        </p>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a843 transparent' }}>
                        {allCustomers.map(c => (
                          <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs"
                            style={{ background: 'rgba(10,22,40,0.5)', border: '1px solid rgba(212,168,67,0.08)' }}>
                            <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ background: wonCustomerIds.has(c.id) ? '#ef4444' : '#10b981' }} />
                            <span className="font-semibold truncate" style={{ color: '#f5d870' }}>{c.name}</span>
                            <span className="ml-auto text-[10px]" style={{ color: 'rgba(212,168,67,0.35)' }}>{c.advisor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                    className="w-full py-2.5 rounded-lg font-semibold transition-colors mt-2"
                    style={{ background: 'rgba(212,168,67,0.08)', color: 'rgba(212,168,67,0.5)' }}>Đóng</button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
