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
}

interface Winner {
  id: string;
  customerName: string;
  advisor: string;
  prizeName: string;
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
    for (let i = 0; i < 300; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: -Math.random() * this.canvas.height * 0.5,
        vx: (Math.random() - 0.5) * 8,
        vy: Math.random() * 4 + 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: Math.random() * 8 + 4,
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

const PRIZE_ICONS = [Crown, Star, Trophy, Gift, Dices];

type DrawMode = 'customer' | 'advisor';

function titleCase(str: string) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

// Slot item height - bigger for desktop projection
const SLOT_ITEM_HEIGHT_MOBILE = 70;
const SLOT_ITEM_HEIGHT_DESKTOP = 120;

export default function LuckyDrawPage() {
  const store = useInvestmentStore();
  const mobileTrackRef = useRef<HTMLDivElement>(null);
  const desktopTrackRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiSystem | null>(null);
  const customerTableRef = useRef<HTMLDivElement>(null);

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

  // Auto scroll
  const [autoScroll, setAutoScroll] = useState(false);

  // Track whether prizes have been initialized from store
  const [localPrizeOverrides, setLocalPrizeOverrides] = useState<Prize[] | null>(null);

  // Derive prizes from store drawPrizes
  const prizes: Prize[] = localPrizeOverrides ?? (Array.isArray(store.drawPrizes) ? store.drawPrizes.map((dp) => ({
    id: dp.id,
    name: dp.name,
    quantity: dp.quantity,
    remaining: dp.quantity,
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

  // Confetti canvas setup
  useEffect(() => {
    if (confettiCanvasRef.current) {
      confettiRef.current = new ConfettiSystem(confettiCanvasRef.current);
    }
    return () => {
      confettiRef.current?.stop();
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

  // Helper: get the correct track ref based on viewport
  const getTrackRef = useCallback(() => {
    if (typeof window === 'undefined') return null;
    return window.innerWidth >= 768 ? desktopTrackRef.current : mobileTrackRef.current;
  }, []);

  // Auto-scroll for customer table (bottom to top)
  useEffect(() => {
    const el = customerTableRef.current;
    if (!el || !autoScroll) return;
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
  }, [autoScroll, allCustomers, wonCustomerIds]);

  useEffect(() => {
    if (!autoScroll && customerTableRef.current) {
      customerTableRef.current.scrollTop = 0;
    }
  }, [autoScroll]);

  // Build track for slot machine
  const buildTrack = useCallback(() => {
    const items = drawItems.map(item => item.name);
    if (items.length === 0) return [];
    const track: string[] = [];
    for (let i = 0; i < 15; i++) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      track.push(...shuffled);
    }
    return track;
  }, [drawItems]);

  // Start spinning
  const startSpin = useCallback(() => {
    if (isSpinning || drawItems.length === 0 || !currentPrize || currentPrize.remaining <= 0) return;

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

    requestAnimationFrame(() => {
      if (!trackEl) return;

      trackEl.innerHTML = '';
      for (const name of track) {
        const div = document.createElement('div');
        div.className = 'slot-item';
        div.textContent = name;
        div.style.cssText = `
          height: ${itemH}px; display: flex; align-items: center; justify-content: center;
          font-size: ${isDesktop ? '48px' : '24px'}; font-weight: 800; color: #d4a843; white-space: nowrap;
          padding: 0 ${isDesktop ? '50px' : '20px'}; text-align: center; letter-spacing: 0.05em;
          text-shadow: 0 0 10px rgba(212,168,67,0.3);
        `;
        trackEl.appendChild(div);
      }

      const totalHeight = track.length * itemH;
      const scrollDistance = totalHeight * 0.7;
      trackEl.style.transition = 'none';
      trackEl.style.transform = 'translateY(0)';
      void trackEl.offsetHeight;
      trackEl.style.transition = 'transform 20s linear';
      trackEl.style.transform = `translateY(-${scrollDistance}px)`;
    });
  }, [isSpinning, drawItems, currentPrize, buildTrack, getTrackRef]);

  // Stop spinning
  const stopSpin = useCallback(() => {
    if (!isSpinning || isStopping) return;
    setIsStopping(true);

    const trackEl = getTrackRef();
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;
    const itemH = isDesktop ? SLOT_ITEM_HEIGHT_DESKTOP : SLOT_ITEM_HEIGHT_MOBILE;

    const winnerItem = drawItems[Math.floor(Math.random() * drawItems.length)];
    const customer = allCustomers.find(c =>
      drawMode === 'customer' ? c.id === winnerItem.id : c.advisor === winnerItem.id
    );

    const winner: Winner = {
      id: winnerItem.id,
      customerName: drawMode === 'customer' ? winnerItem.name : winnerItem.name,
      advisor: customer?.advisor || winnerItem.name,
      prizeName: currentPrize?.name || 'Giải thưởng',
    };

    if (trackEl) {
      const items = trackEl.querySelectorAll('.slot-item');
      const totalItems = items.length;
      let targetIdx = -1;
      for (let i = totalItems - 1; i >= Math.floor(totalItems * 0.3); i--) {
        if (items[i].textContent === winner.customerName) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) {
        for (let i = totalItems - 1; i >= 0; i--) {
          if (items[i].textContent === winner.customerName) {
            targetIdx = i;
            break;
          }
        }
      }
      if (targetIdx !== -1) {
        const centerOffset = targetIdx - 2;
        const targetY = centerOffset * itemH;
        const currentTransform = trackEl.style.transform;
        trackEl.style.transition = 'none';
        trackEl.style.transform = currentTransform;
        void trackEl.offsetHeight;
        trackEl.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        trackEl.style.transform = `translateY(-${targetY}px)`;
      }
    }

    setTimeout(() => {
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
        })) : []);
        return base.map((p, i) =>
          i === currentPrizeIndex ? { ...p, remaining: p.remaining - 1 } : p
        );
      });

      if (confettiRef.current) {
        confettiRef.current.start();
        setTimeout(() => confettiRef.current?.stop(), 5000);
      }
    }, 3500);
  }, [isSpinning, isStopping, drawItems, allCustomers, drawMode, currentPrize, currentPrizeIndex, store.drawPrizes, getTrackRef]);

  // Handle stop button click
  const handleStopClick = useCallback(() => {
    try {
      if (isSpinning && !isStopping) {
        stopSpin();
      }
    } catch (err) {
      console.error('Stop error:', err);
      setIsSpinning(false);
      setIsStopping(false);
    }
  }, [isSpinning, isStopping, stopSpin]);

  // Handle prize button click → select prize AND start spin
  const handlePrizeSpin = useCallback((prizeIndex: number) => {
    if (isSpinning) return;
    const prize = prizes[prizeIndex];
    if (!prize || prize.remaining <= 0) return;
    if (drawItems.length === 0) return;

    setCurrentPrizeIndex(prizeIndex);
    setTimeout(() => {
      startSpin();
    }, 50);
  }, [isSpinning, prizes, drawItems.length, startSpin]);

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
    };
    setEditPrizes(prev => [...prev, newPrize]);
    setNewPrizeName('');
    setNewPrizeQty('1');
  };

  const handleRemovePrize = (id: string) => {
    setEditPrizes(prev => prev.filter(p => p.id !== id));
  };

  const handleSaveSettings = () => {
    store.saveDrawPrizes(editPrizes.map(p => ({ name: p.name, quantity: p.quantity })));
    setLocalPrizeOverrides(editPrizes.map(p => ({ ...p })));
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
      })) : []);
      return base.map(p => ({ ...p, remaining: p.quantity }));
    });
  };

  // LED border component for slot machine
  const LEDBorder = () => (
    <div className="absolute inset-0 pointer-events-none z-20">
      {/* Top LED row */}
      <div className="absolute top-0 left-0 right-0 h-2 flex overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`top-${i}`}
            className="flex-1 led-dot"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      {/* Bottom LED row */}
      <div className="absolute bottom-0 left-0 right-0 h-2 flex overflow-hidden">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={`bot-${i}`}
            className="flex-1 led-dot"
            style={{ animationDelay: `${(40 - i) * 0.08}s` }}
          />
        ))}
      </div>
      {/* Left LED column */}
      <div className="absolute top-0 left-0 bottom-0 w-2 flex flex-col overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`left-${i}`}
            className="flex-1 led-dot-v"
            style={{ animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      {/* Right LED column */}
      <div className="absolute top-0 right-0 bottom-0 w-2 flex flex-col overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={`right-${i}`}
            className="flex-1 led-dot-v"
            style={{ animationDelay: `${(20 - i) * 0.08}s` }}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: '#0a1628' }}>
      {/* Confetti Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[60%] h-[50%] rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(212,168,67,0.06) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(ellipse, rgba(13,90,63,0.08) 0%, transparent 70%)' }} />
      </div>

      {/* === HEADER BAR - Compact === */}
      <div className="flex-shrink-0 relative" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50, #0f2042)', borderBottom: '2px solid rgba(212,168,67,0.4)' }}>
        <div className="relative px-3 py-2 md:px-6 md:py-2.5 flex items-center justify-between">
          <Link href="/" title="Quay lại">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" style={{ color: '#d4a843' }} />
            </motion.button>
          </Link>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-4 h-4 md:w-6 md:h-6" style={{ color: '#f5d870' }} />
            </motion.div>
            <h1 className="text-sm md:text-2xl font-black uppercase tracking-wider" style={{ color: '#f5d870', textShadow: '0 0 20px rgba(212,168,67,0.3)' }}>
              Quay Số May Mắn
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => { setSettingsOpen(true); setSettingsAuthenticated(false); }}
            className="p-2 md:p-1.5 hover:bg-white/5 rounded-lg transition-all"
            title="Cài đặt"
          >
            <Settings className="w-5 h-5" style={{ color: '#d4a843' }} />
          </motion.button>
        </div>
      </div>

      {/* === MOBILE LAYOUT - Compact controller view === */}
      <div className="flex-1 min-h-0 flex flex-col md:hidden">
        {/* Slot machine area - compact for phone control */}
        <div className="flex-shrink-0 flex flex-col items-center px-3 pt-2 pb-1">
          {/* Prize indicator */}
          {currentPrize && (
            <div className="w-full max-w-md flex items-center justify-center gap-1 mb-1">
              <Crown className="w-3.5 h-3.5" style={{ color: '#f5d870' }} />
              <span style={{ color: '#f5d870' }} className="font-bold text-sm">{currentPrize.name}</span>
              <span style={{ color: 'rgba(212,168,67,0.5)' }} className="text-xs">(còn {currentPrize.remaining})</span>
            </div>
          )}

          {/* Slot Machine - compact with LED border */}
          <div
            className={`relative w-full max-w-md rounded-xl overflow-hidden ${canSpin ? 'animate-pulse-shadow' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #0f2042 0%, #162d50 50%, #0f2042 100%)',
              border: '2px solid #d4a843',
              boxShadow: isSpinning
                ? '0 0 40px rgba(212,168,67,0.5), inset 0 0 30px rgba(212,168,67,0.1)'
                : canSpin
                  ? '0 0 25px rgba(212,168,67,0.3), inset 0 0 20px rgba(212,168,67,0.05)'
                  : '0 0 10px rgba(212,168,67,0.1), inset 0 0 10px rgba(212,168,67,0.02)',
            }}
          >
            {/* LED border */}
            <LEDBorder />

            {/* Slot viewport - compact 3 items visible */}
            <div className="relative overflow-hidden" style={{ height: `${SLOT_ITEM_HEIGHT_MOBILE * 3}px` }}>
              {/* Highlight lines */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0 h-10" style={{ background: 'linear-gradient(to bottom, #0f2042, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-10" style={{ background: 'linear-gradient(to top, #0f2042, transparent)' }} />
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: `calc(50% - ${SLOT_ITEM_HEIGHT_MOBILE / 2}px)`,
                    height: `${SLOT_ITEM_HEIGHT_MOBILE}px`,
                    borderTop: '2px solid rgba(212,168,67,0.6)',
                    borderBottom: '2px solid rgba(212,168,67,0.6)',
                    background: 'rgba(13,90,63,0.15)',
                  }}
                />
                <div className="absolute left-1.5 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderLeft: '8px solid #d4a843' }} />
                </div>
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '6px solid transparent', borderBottom: '6px solid transparent', borderRight: '8px solid #d4a843' }} />
                </div>
              </div>

              {/* Placeholder */}
              {!isSpinning && !showResult && (
                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                  <p style={{ color: 'rgba(212,168,67,0.4)' }} className="text-sm font-medium text-center px-4">
                    {prizes.length === 0
                      ? 'Thêm giải thưởng trong Cài đặt'
                      : drawItems.length === 0
                        ? 'Không có người tham gia'
                        : 'Bấm nút giải thưởng để quay'}
                  </p>
                </div>
              )}

              {/* Track */}
              <div ref={mobileTrackRef} className="absolute left-0 right-0 top-0" />
            </div>
          </div>

          {/* STOP BUTTON (mobile) */}
          <AnimatePresence>
            {isSpinning && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center justify-center mt-2 mb-1"
              >
                <motion.button
                  whileTap={{ scale: 0.92 }}
                  onClick={handleStopClick}
                  disabled={isStopping}
                  className="relative"
                  style={{ width: '80px', height: '80px', cursor: 'pointer' }}
                >
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: isStopping
                        ? 'linear-gradient(145deg, #9ca3af, #6b7280)'
                        : 'linear-gradient(145deg, #ef4444, #b91c1c)',
                      boxShadow: isStopping
                        ? '0 4px 0 #4b5563, 0 6px 12px rgba(75, 85, 99, 0.4), inset 0 1px 2px rgba(255,255,255,0.2)'
                        : '0 4px 0 #7f1d1d, 0 8px 16px rgba(127, 29, 29, 0.4), inset 0 1px 2px rgba(255,255,255,0.3)',
                    }}
                  />
                  <div
                    className="absolute rounded-full flex items-center justify-center"
                    style={{
                      top: '3px', left: '3px', right: '3px', bottom: '5px',
                      background: isStopping
                        ? 'radial-gradient(circle at 35% 35%, #e5e7eb 0%, #9ca3af 40%, #6b7280 100%)'
                        : 'radial-gradient(circle at 35% 35%, #fca5a5 0%, #ef4444 40%, #b91c1c 100%)',
                      boxShadow: 'inset 0 -2px 4px rgba(0,0,0,0.15), inset 0 2px 4px rgba(255,255,255,0.4)',
                      border: isStopping
                        ? '2px solid rgba(156, 163, 175, 0.6)'
                        : '2px solid rgba(248, 113, 113, 0.6)',
                    }}
                  >
                    <span
                      className="font-black uppercase tracking-wider leading-tight text-center"
                      style={{
                        color: isStopping ? '#4b5563' : '#7f1d1d',
                        fontSize: '12px',
                        textShadow: '0 1px 2px rgba(255,255,255,0.5)',
                      }}
                    >
                      {isStopping ? 'Đang\ndừng...' : 'DỪNG!'}
                    </span>
                  </div>
                  {!isStopping && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping"
                      style={{ background: 'rgba(239, 68, 68, 0.2)', animationDuration: '1s' }}
                    />
                  )}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Winner result overlay - mobile */}
        <AnimatePresence>
          {showResult && currentWinner && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex-shrink-0 px-3 pb-1"
            >
              <div className="max-w-md mx-auto rounded-xl p-2.5 text-center border-2 shadow-lg"
                style={{ background: 'rgba(15,32,66,0.95)', borderColor: 'rgba(212,168,67,0.6)', backdropFilter: 'blur(8px)' }}>
                <p style={{ color: 'rgba(212,168,67,0.6)' }} className="text-[9px] uppercase tracking-wider mb-0.5">Chúc mừng người trúng giải</p>
                <p className="text-lg font-black" style={{ color: '#f5d870', textShadow: '0 0 15px rgba(212,168,67,0.3)' }}>{currentWinner.customerName}</p>
                {drawMode === 'customer' && currentWinner.advisor && (
                  <p style={{ color: 'rgba(212,168,67,0.5)' }} className="text-[10px] italic">TVV {currentWinner.advisor}</p>
                )}
                <p className="font-semibold text-xs" style={{ color: '#10b981' }}>🏆 {currentWinner.prizeName}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === BOTTOM: Combined Prizes + Customers on mobile === */}
        <div className="flex-1 min-h-0 flex flex-col" style={{ borderTop: '2px solid rgba(212,168,67,0.3)' }}>
          {/* Prize spin buttons - moved here from header */}
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
                    return (
                      <motion.button
                        key={prize.id}
                        whileTap={isAvailable ? { scale: 0.92 } : {}}
                        onClick={() => handlePrizeSpin(idx)}
                        disabled={!isAvailable}
                        className={`flex-shrink-0 flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border ${
                          idx === currentPrizeIndex && isSpinning
                            ? 'animate-pulse'
                            : ''
                        }`}
                        style={{
                          background: idx === currentPrizeIndex && isSpinning
                            ? 'linear-gradient(135deg, #0d5a3f, #0a7a4a)'
                            : prize.remaining <= 0
                              ? 'rgba(15,32,66,0.5)'
                              : 'rgba(22,45,80,0.8)',
                          borderColor: idx === currentPrizeIndex && isSpinning
                            ? '#10b981'
                            : prize.remaining <= 0
                              ? 'rgba(212,168,67,0.1)'
                              : 'rgba(212,168,67,0.4)',
                          color: prize.remaining <= 0 ? 'rgba(212,168,67,0.25)' : '#f5d870',
                          cursor: !isAvailable ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <IconComp className="w-3 h-3" />
                        <span>{prize.name}</span>
                        <span className="text-[9px] px-1 py-0.5 rounded-full"
                          style={{
                            background: prize.remaining <= 0 ? 'rgba(212,168,67,0.1)' : 'rgba(13,90,63,0.4)',
                            color: prize.remaining <= 0 ? 'rgba(212,168,67,0.3)' : '#10b981',
                          }}>
                          {prize.remaining}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Customer list with KH/TVV toggle inside */}
          <div className="flex-1 min-h-0 flex flex-col" style={{ background: 'rgba(10,22,40,0.95)' }}>
            {/* Header with toggle */}
            <div className="flex-shrink-0 flex items-center px-3 py-1.5" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
              <div className="flex-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: '#f5d870' }} />
                <span style={{ color: '#f5d870' }} className="font-extrabold text-xs uppercase">DS Tham Dự</span>
                <span style={{ color: 'rgba(212,168,67,0.6)' }} className="text-[10px]">({allCustomers.length})</span>
              </div>
              {/* KH/TVV toggle inside customer box */}
              <div className="flex gap-0.5 p-0.5 rounded-md" style={{ background: 'rgba(10,22,40,0.6)' }}>
                <button
                  onClick={() => setDrawMode('customer')}
                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
                  style={{
                    background: drawMode === 'customer' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent',
                    color: drawMode === 'customer' ? '#0a1628' : 'rgba(212,168,67,0.5)',
                  }}
                >
                  KH
                </button>
                <button
                  onClick={() => setDrawMode('advisor')}
                  className="px-2 py-0.5 rounded text-[9px] font-bold uppercase transition-all"
                  style={{
                    background: drawMode === 'advisor' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent',
                    color: drawMode === 'advisor' ? '#0a1628' : 'rgba(212,168,67,0.5)',
                  }}
                >
                  TVV
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setAutoScroll(!autoScroll)}
                className="ml-1.5 p-1 rounded-md transition-all"
                style={{
                  background: autoScroll ? 'rgba(13,90,63,0.3)' : 'rgba(212,168,67,0.1)',
                  color: autoScroll ? '#10b981' : 'rgba(212,168,67,0.4)',
                }}
                title={autoScroll ? 'Tắt cuộn' : 'Bật cuộn'}
              >
                {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </motion.button>
            </div>

            {/* Scrollable body */}
            <div ref={customerTableRef} className="flex-1 overflow-y-auto">
              {(autoScroll ? [0, 1] : [0]).map(dup => (
                <div key={dup}>
                  {allCustomers.map((c, idx) => {
                    const isWon = wonCustomerIds.has(c.id);
                    return (
                      <div
                        key={`${c.id}-${dup}`}
                        className="flex items-center px-3 py-1.5 transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(212,168,67,0.08)',
                          background: isWon ? 'rgba(13,90,63,0.1)' : 'transparent',
                          opacity: isWon ? 0.4 : 1,
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] w-5 flex-shrink-0" style={{ color: 'rgba(212,168,67,0.3)' }}>{idx + 1}</span>
                            <span className={`text-sm font-bold truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.3)' : '#f5d870' }}>
                              {titleCase(c.name)}
                            </span>
                          </div>
                          {c.advisor && (
                            <div className="pl-[22px]">
                              <span className="text-[10px] italic" style={{ color: isWon ? 'rgba(212,168,67,0.15)' : 'rgba(212,168,67,0.45)' }}>TVV {titleCase(c.advisor)}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                          {c.investmentFee > 0 && (
                            <span className="text-[10px] font-semibold" style={{ color: isWon ? 'rgba(212,168,67,0.15)' : '#10b981' }}>
                              {c.investmentFee}tr
                            </span>
                          )}
                          <span className={`text-xs font-bold max-w-[120px] truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.2)' : '#d4a843' }}>
                            {c.gift || '—'}
                          </span>
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

      {/* === DESKTOP LAYOUT - Slot Machine TOP (prominent) + Info BOTTOM === */}
      <div className="flex-1 min-h-0 hidden md:flex md:flex-col">

        {/* === TOP: Slot Machine (PROMINENT - takes ~65% height) === */}
        <div className="flex-[1.8] min-h-0 flex flex-col items-center justify-center px-8 py-4 relative">
          {/* Background tech grid */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ opacity: 0.03 }}>
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(rgba(212,168,67,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(212,168,67,0.3) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
            }} />
          </div>

          {/* Decorative glow behind slot machine */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[80%] rounded-full blur-3xl pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(212,168,67,0.08) 0%, transparent 60%)' }} />

          {/* Desktop: show prize name prominently */}
          {currentPrize && (
            <div className="relative flex items-center justify-center gap-3 mb-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Crown className="w-10 h-10" style={{ color: '#f5d870', filter: 'drop-shadow(0 0 10px rgba(212,168,67,0.4))' }} />
              </motion.div>
              <span className="font-extrabold text-3xl md:text-4xl" style={{ color: '#f5d870', textShadow: '0 0 30px rgba(212,168,67,0.3)' }}>{currentPrize.name}</span>
              <span style={{ color: 'rgba(212,168,67,0.5)' }} className="text-xl">(còn {currentPrize.remaining})</span>
            </div>
          )}

          {/* Slot Machine - HUGE for projection with LED border */}
          <div
            className={`relative w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl ${canSpin ? 'animate-pulse-shadow' : ''}`}
            style={{
              background: 'linear-gradient(180deg, #0f2042 0%, #162d50 50%, #0f2042 100%)',
              border: '4px solid #d4a843',
              boxShadow: isSpinning
                ? '0 0 100px rgba(212,168,67,0.4), 0 0 50px rgba(212,168,67,0.2), inset 0 0 60px rgba(212,168,67,0.08)'
                : canSpin
                  ? '0 0 80px rgba(212,168,67,0.3), 0 0 30px rgba(212,168,67,0.1), inset 0 0 50px rgba(212,168,67,0.05)'
                  : '0 0 40px rgba(212,168,67,0.1), inset 0 0 25px rgba(212,168,67,0.02)',
            }}
          >
            {/* LED border animation */}
            <LEDBorder />

            {/* Slot viewport - big for projection */}
            <div className="relative overflow-hidden" style={{ height: `${SLOT_ITEM_HEIGHT_DESKTOP * 3}px` }}>
              {/* Highlight lines */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to bottom, #0f2042, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: 'linear-gradient(to top, #0f2042, transparent)' }} />
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: `calc(50% - ${SLOT_ITEM_HEIGHT_DESKTOP / 2}px)`,
                    height: `${SLOT_ITEM_HEIGHT_DESKTOP}px`,
                    borderTop: '4px solid rgba(212,168,67,0.5)',
                    borderBottom: '4px solid rgba(212,168,67,0.5)',
                    background: 'rgba(13,90,63,0.12)',
                    boxShadow: 'inset 0 0 30px rgba(13,90,63,0.1)',
                  }}
                />
                <div className="absolute left-4 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderLeft: '20px solid #d4a843', filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.6))' }} />
                </div>
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '14px solid transparent', borderBottom: '14px solid transparent', borderRight: '20px solid #d4a843', filter: 'drop-shadow(0 0 8px rgba(212,168,67,0.6))' }} />
                </div>
              </div>

              {/* Placeholder */}
              {!isSpinning && !showResult && (
                <div className="absolute inset-0 flex items-center justify-center z-[5]">
                  <div className="text-center">
                    <Zap className="w-12 h-12 mx-auto mb-3" style={{ color: 'rgba(212,168,67,0.2)' }} />
                    <p style={{ color: 'rgba(212,168,67,0.35)' }} className="text-3xl font-medium">
                      {prizes.length === 0
                        ? 'Thêm giải thưởng trong Cài đặt'
                        : drawItems.length === 0
                          ? 'Không có người tham gia'
                          : 'Nhấn nút giải thưởng để quay số'}
                    </p>
                  </div>
                </div>
              )}

              {/* Track */}
              <div ref={desktopTrackRef} className="absolute left-0 right-0 top-0" />
            </div>
          </div>

          {/* STOP button - desktop, only visible when spinning */}
          <AnimatePresence>
            {isSpinning && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleStopClick}
                disabled={isStopping}
                className="mt-4 px-16 py-4 rounded-2xl font-bold text-2xl uppercase tracking-widest shadow-xl transition-all min-h-[64px] relative"
                style={{
                  background: isStopping
                    ? 'linear-gradient(135deg, #9ca3af, #6b7280, #9ca3af)'
                    : 'linear-gradient(135deg, #ef4444, #f87171, #ef4444)',
                  color: isStopping ? '#4b5563' : '#7f1d1d',
                  border: '3px solid rgba(239, 68, 68, 0.5)',
                  cursor: 'pointer',
                  animation: 'pulse 1.5s infinite',
                }}
              >
                {isStopping ? 'Đang dừng...' : 'Nhấn để dừng!'}
              </motion.button>
            )}
          </AnimatePresence>

          {/* Winner result overlay - desktop */}
          <AnimatePresence>
            {showResult && currentWinner && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.9 }}
                transition={{ type: 'spring', duration: 0.5 }}
                className="absolute inset-0 flex items-center justify-center z-20 bg-black/40 backdrop-blur-sm"
              >
                <div className="rounded-2xl p-8 md:p-10 text-center border-2 shadow-2xl max-w-2xl mx-4"
                  style={{ background: 'rgba(15,32,66,0.95)', borderColor: 'rgba(212,168,67,0.6)' }}>
                  <p style={{ color: 'rgba(212,168,67,0.6)' }} className="text-sm uppercase tracking-wider mb-2">Chúc mừng người trúng giải</p>
                  <p className="text-5xl md:text-6xl font-black mb-2" style={{ color: '#f5d870', textShadow: '0 0 30px rgba(212,168,67,0.4)' }}>{currentWinner.customerName}</p>
                  {drawMode === 'customer' && currentWinner.advisor && (
                    <p style={{ color: 'rgba(212,168,67,0.5)' }} className="text-xl md:text-2xl">TVV: {currentWinner.advisor}</p>
                  )}
                  <p className="font-semibold mt-2 text-2xl md:text-3xl" style={{ color: '#10b981' }}>🏆 {currentWinner.prizeName}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* === BOTTOM: Combined Info Panel - Gift Tiers + Prizes | Customers === */}
        <div className="flex-[1] min-h-0 flex flex-row" style={{ borderTop: '2px solid rgba(212,168,67,0.3)' }}>

          {/* LEFT: Gift Tiers + Prize Buttons (combined) */}
          <div className="w-[30%] min-w-[300px] max-w-[420px] flex flex-col"
            style={{ background: 'rgba(10,22,40,0.95)', borderRight: '1px solid rgba(212,168,67,0.2)' }}>

            {/* Section header */}
            <div className="flex-shrink-0 flex items-center px-3 py-1.5" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
              <Gift className="w-3.5 h-3.5" style={{ color: '#f5d870' }} />
              <span style={{ color: '#f5d870' }} className="font-extrabold text-xs uppercase ml-1.5">Quà Tặng & Giải</span>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-2">
              {/* Gift Tiers */}
              {(Array.isArray(store.giftTiers) ? store.giftTiers : [])
                .sort((a, b) => a.order - b.order)
                .map((tier, idx) => {
                  const tierStyles = [
                    { bg: 'rgba(100,116,139,0.15)', border: 'rgba(100,116,139,0.3)', icon: '🥈', color: '#94a3b8' },
                    { bg: 'rgba(212,168,67,0.1)', border: 'rgba(212,168,67,0.3)', icon: '🥇', color: '#f5d870' },
                    { bg: 'rgba(13,90,63,0.15)', border: 'rgba(13,90,63,0.4)', icon: '💎', color: '#10b981' },
                    { bg: 'rgba(139,92,246,0.15)', border: 'rgba(139,92,246,0.3)', icon: '👑', color: '#a78bfa' },
                  ];
                  const style = tierStyles[idx % tierStyles.length];
                  return (
                    <div
                      key={tier.id}
                      className="rounded-lg px-2.5 py-1.5 flex items-center gap-2"
                      style={{ background: style.bg, border: `1px solid ${style.border}` }}
                    >
                      <span className="text-base flex-shrink-0">{style.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate" style={{ color: style.color }}>{tier.giftName}</p>
                        <p className="text-[10px]" style={{ color: 'rgba(212,168,67,0.35)' }}>
                          {tier.minFee >= 1000000 ? `${(tier.minFee / 1000000).toFixed(0)}tr` : `${(tier.minFee / 1000).toFixed(0)}K`} -
                          {tier.maxFee >= 999999999 ? ' ∞' : tier.maxFee >= 1000000 ? ` ${(tier.maxFee / 1000000).toFixed(0)}tr` : ` ${(tier.maxFee / 1000).toFixed(0)}K`}
                        </p>
                      </div>
                      <span className="text-[10px] font-bold flex-shrink-0" style={{ color: '#10b981' }}>
                        {tier.giftValue >= 1000000 ? `${(tier.giftValue / 1000000).toFixed(1)}tr` : `${(tier.giftValue / 1000).toFixed(0)}K`}
                      </span>
                    </div>
                  );
                })}

              {/* Divider */}
              {(Array.isArray(store.giftTiers) ? store.giftTiers : []).length > 0 && prizes.length > 0 && (
                <div style={{ borderTop: '1px solid rgba(212,168,67,0.15)' }} />
              )}

              {/* Prize Spin Buttons */}
              {prizes.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: 'rgba(212,168,67,0.5)' }}>Giải quay số:</span>
                  {prizes.map((prize, idx) => {
                    const IconComp = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                    const isAvailable = prize.remaining > 0 && !isSpinning;
                    return (
                      <motion.button
                        key={prize.id}
                        whileTap={isAvailable ? { scale: 0.95 } : {}}
                        whileHover={isAvailable ? { scale: 1.02 } : {}}
                        onClick={() => handlePrizeSpin(idx)}
                        disabled={!isAvailable}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-bold transition-all border"
                        style={{
                          background: idx === currentPrizeIndex && isSpinning
                            ? 'linear-gradient(135deg, #0d5a3f, #0a7a4a)'
                            : prize.remaining <= 0
                              ? 'rgba(15,32,66,0.5)'
                              : 'rgba(22,45,80,0.6)',
                          borderColor: idx === currentPrizeIndex && isSpinning
                            ? '#10b981'
                            : prize.remaining <= 0
                              ? 'rgba(212,168,67,0.1)'
                              : 'rgba(212,168,67,0.3)',
                          color: prize.remaining <= 0 ? 'rgba(212,168,67,0.25)' : '#f5d870',
                          cursor: !isAvailable ? 'not-allowed' : 'pointer',
                          boxShadow: idx === currentPrizeIndex && isSpinning ? '0 0 15px rgba(16,185,129,0.3)' : 'none',
                        }}
                      >
                        <IconComp className="w-4 h-4 flex-shrink-0" />
                        <span className="flex-1 text-left">{prize.name}</span>
                        <span className="text-xs px-1.5 py-0.5 rounded-full"
                          style={{
                            background: prize.remaining <= 0 ? 'rgba(212,168,67,0.08)' : 'rgba(13,90,63,0.3)',
                            color: prize.remaining <= 0 ? 'rgba(212,168,67,0.2)' : '#10b981',
                          }}>
                          {prize.remaining}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {prizes.length === 0 && (Array.isArray(store.giftTiers) ? store.giftTiers : []).length === 0 && (
                <p className="text-xs text-center py-4 italic" style={{ color: 'rgba(212,168,67,0.3)' }}>Chưa có dữ liệu</p>
              )}
            </div>
          </div>

          {/* RIGHT: Customer List with KH/TVV toggle inside */}
          <div className="flex-1 min-h-0 flex flex-col" style={{ background: 'rgba(8,16,32,0.95)' }}>
            {/* Customer header with toggle inside */}
            <div className="flex-shrink-0 flex items-center px-3 py-1.5" style={{ background: 'linear-gradient(135deg, #0f2042, #162d50)', borderBottom: '1px solid rgba(212,168,67,0.3)' }}>
              <div className="flex-1 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" style={{ color: '#f5d870' }} />
                <span style={{ color: '#f5d870' }} className="font-extrabold text-xs uppercase">Khách Hàng</span>
                <span style={{ color: 'rgba(212,168,67,0.6)' }} className="text-[10px]">({allCustomers.length})</span>
              </div>
              {/* KH/TVV toggle inside customer section */}
              <div className="flex gap-1 p-0.5 rounded-lg" style={{ background: 'rgba(10,22,40,0.6)' }}>
                <button
                  onClick={() => setDrawMode('customer')}
                  className="px-3 py-1 rounded-md text-xs font-bold uppercase transition-all"
                  style={{
                    background: drawMode === 'customer' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent',
                    color: drawMode === 'customer' ? '#0a1628' : 'rgba(212,168,67,0.5)',
                    boxShadow: drawMode === 'customer' ? '0 0 10px rgba(212,168,67,0.3)' : 'none',
                  }}
                >
                  Khách hàng
                </button>
                <button
                  onClick={() => setDrawMode('advisor')}
                  className="px-3 py-1 rounded-md text-xs font-bold uppercase transition-all"
                  style={{
                    background: drawMode === 'advisor' ? 'linear-gradient(135deg, #d4a843, #c9a227)' : 'transparent',
                    color: drawMode === 'advisor' ? '#0a1628' : 'rgba(212,168,67,0.5)',
                    boxShadow: drawMode === 'advisor' ? '0 0 10px rgba(212,168,67,0.3)' : 'none',
                  }}
                >
                  TVV
                </button>
              </div>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setAutoScroll(!autoScroll)}
                className="ml-2 p-1 rounded-md transition-all"
                style={{
                  background: autoScroll ? 'rgba(13,90,63,0.3)' : 'rgba(212,168,67,0.08)',
                  color: autoScroll ? '#10b981' : 'rgba(212,168,67,0.35)',
                }}
                title={autoScroll ? 'Tắt cuộn' : 'Bật cuộn'}
              >
                {autoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </motion.button>
            </div>

            {/* Scrollable customer list - desktop */}
            <div
              ref={customerTableRef}
              className="flex-1 overflow-y-auto"
              style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a843 transparent' }}
            >
              {(autoScroll ? [0, 1] : [0]).map(dup => (
                <div key={dup}>
                  {allCustomers.map((c, idx) => {
                    const isWon = wonCustomerIds.has(c.id);
                    return (
                      <div
                        key={`${c.id}-${dup}`}
                        className="flex items-center px-3 py-1.5 transition-colors"
                        style={{
                          borderBottom: '1px solid rgba(212,168,67,0.06)',
                          background: isWon ? 'rgba(13,90,63,0.08)' : 'transparent',
                          opacity: isWon ? 0.4 : 1,
                        }}
                      >
                        <span className="font-mono text-[10px] w-5 flex-shrink-0" style={{ color: 'rgba(212,168,67,0.25)' }}>{idx + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1">
                            <span className={`text-xs font-bold truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.25)' : '#f5d870' }}>
                              {titleCase(c.name)}
                            </span>
                            {c.investmentFee > 0 && (
                              <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: isWon ? 'rgba(212,168,67,0.15)' : '#10b981' }}>
                                {c.investmentFee}tr
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            {c.advisor && (
                              <span className="text-[9px] italic" style={{ color: isWon ? 'rgba(212,168,67,0.1)' : 'rgba(212,168,67,0.4)' }}>
                                TVV {titleCase(c.advisor)}
                              </span>
                            )}
                            <span className={`text-[9px] font-bold truncate ${isWon ? 'line-through' : ''}`} style={{ color: isWon ? 'rgba(212,168,67,0.1)' : '#d4a843' }}>
                              {c.gift || ''}
                            </span>
                          </div>
                        </div>
                        {isWon && (
                          <span className="text-[8px] px-1.5 py-0.5 rounded font-bold" style={{ background: 'rgba(13,90,63,0.3)', color: '#10b981' }}>Trúng</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
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
                <button
                  onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                  className="p-1 hover:bg-white/5 rounded-lg transition-colors"
                >
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
                      style={{
                        border: '2px solid rgba(212,168,67,0.3)',
                        background: 'rgba(10,22,40,0.8)',
                        color: '#f5d870',
                      }}
                      autoFocus
                    />
                    {settingsPassword && settingsPassword !== '0969774224' && (
                      <p className="text-xs mt-2" style={{ color: '#ef4444' }}>Mật khẩu không đúng</p>
                    )}
                  </div>
                  <button
                    onClick={handleSettingsAuth}
                    className="px-6 py-2.5 rounded-lg font-bold transition-all shadow-md hover:shadow-lg"
                    style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                  >
                    Xác nhận
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(10,22,40,0.6)' }}>
                    {(['general', 'prizes', 'customers'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        className="flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all"
                        style={{
                          background: settingsTab === tab ? 'linear-gradient(135deg, #0f2042, #162d50)' : 'transparent',
                          color: settingsTab === tab ? '#f5d870' : 'rgba(212,168,67,0.4)',
                          boxShadow: settingsTab === tab ? '0 0 10px rgba(212,168,67,0.15)' : 'none',
                        }}
                      >
                        {tab === 'general' ? 'Chung' : tab === 'prizes' ? 'Giải thưởng' : 'Khách hàng'}
                      </button>
                    ))}
                  </div>

                  {/* General tab */}
                  {settingsTab === 'general' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl space-y-2.5" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                        <h4 className="text-sm font-semibold mb-1" style={{ color: '#d4a843' }}>Thông tin chương trình</h4>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Tiêu đề chương trình</label>
                          <input
                            value={store.eventInfo.name}
                            onChange={(e) => store.saveEventInfo({ name: e.target.value })}
                            placeholder="Nhập tiêu đề chương trình"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Ngày tháng</label>
                          <input
                            value={store.eventInfo.date}
                            onChange={(e) => store.saveEventInfo({ date: e.target.value })}
                            placeholder="VD: 20/03/2025"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-semibold mb-1 block" style={{ color: 'rgba(212,168,67,0.7)' }}>Địa điểm</label>
                          <input
                            value={store.eventInfo.location}
                            onChange={(e) => store.saveEventInfo({ location: e.target.value })}
                            placeholder="VD: TP. Hồ Chí Minh"
                            className="w-full p-2.5 rounded-lg focus:ring-2 outline-none transition-all text-sm"
                            style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                          />
                        </div>
                      </div>
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}>
                        <h4 className="text-sm font-semibold mb-2" style={{ color: '#d4a843' }}>Thống kê</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span style={{ color: 'rgba(212,168,67,0.5)' }}>Tổng khách hàng:</span>
                            <span style={{ color: '#f5d870' }} className="font-bold">{allCustomers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'rgba(212,168,67,0.5)' }}>Tổng TVV:</span>
                            <span style={{ color: '#f5d870' }} className="font-bold">{[...new Set(allCustomers.map(c => c.advisor).filter(Boolean))].length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'rgba(212,168,67,0.5)' }}>Số giải đã trao:</span>
                            <span style={{ color: '#f5d870' }} className="font-bold">{winners.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span style={{ color: 'rgba(212,168,67,0.5)' }}>Còn lại:</span>
                            <span style={{ color: '#10b981' }} className="font-bold">{drawItems.length}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleResetWinners}
                        className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                        style={{ background: 'rgba(239,68,68,0.1)', border: '2px solid rgba(239,68,68,0.3)', color: '#ef4444' }}
                      >
                        Đặt lại toàn bộ kết quả
                      </button>
                    </div>
                  )}

                  {/* Prizes tab */}
                  {settingsTab === 'prizes' && (
                    <div className="space-y-3">
                      {editPrizes.map((prize, idx) => {
                        const IconComp = PRIZE_ICONS[idx % PRIZE_ICONS.length];
                        return (
                          <div
                            key={prize.id}
                            className="p-3 rounded-xl flex items-center gap-2"
                            style={{ background: 'rgba(10,22,40,0.6)', border: '1px solid rgba(212,168,67,0.15)' }}
                          >
                            <IconComp className="w-4 h-4 flex-shrink-0" style={{ color: '#d4a843' }} />
                            <input
                              value={prize.name}
                              onChange={e => {
                                const updated = [...editPrizes];
                                updated[idx] = { ...updated[idx], name: e.target.value };
                                setEditPrizes(updated);
                              }}
                              className="flex-1 p-1.5 rounded-md text-sm outline-none"
                              style={{ border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                            />
                            <input
                              type="number"
                              min={1}
                              value={prize.quantity}
                              onChange={e => handleUpdatePrizeQty(prize.id, parseInt(e.target.value) || 1)}
                              className="w-16 p-1.5 rounded-md text-sm text-center outline-none"
                              style={{ border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                            />
                            <button
                              onClick={() => handleRemovePrize(prize.id)}
                              className="p-1.5 rounded-md transition-colors"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                      <div className="flex gap-2">
                        <input
                          value={newPrizeName}
                          onChange={e => setNewPrizeName(e.target.value)}
                          placeholder="Tên giải"
                          className="flex-1 p-2 rounded-lg text-sm outline-none"
                          style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                        />
                        <input
                          type="number"
                          min={1}
                          value={newPrizeQty}
                          onChange={e => setNewPrizeQty(e.target.value)}
                          className="w-20 p-2 rounded-lg text-sm text-center outline-none"
                          style={{ border: '2px solid rgba(212,168,67,0.2)', background: 'rgba(10,22,40,0.8)', color: '#f5d870' }}
                        />
                        <button
                          onClick={handleAddPrize}
                          className="px-3 py-2 rounded-lg font-bold text-sm transition-colors"
                          style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleSaveSettings}
                        className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all shadow-md hover:shadow-lg"
                        style={{ background: 'linear-gradient(135deg, #0d5a3f, #0a7a4a)', color: '#f5d870' }}
                      >
                        Lưu giải thưởng
                      </button>
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

                  <button
                    onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                    className="w-full py-2.5 rounded-lg font-semibold transition-colors mt-2"
                    style={{ background: 'rgba(212,168,67,0.08)', color: 'rgba(212,168,67,0.5)' }}
                  >
                    Đóng
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
