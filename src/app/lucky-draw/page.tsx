'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, X, Trophy, Users, Gift, Crown, Star, Dices, Diamond,
  Pause, Play, ChevronDown
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
      '#f59e0b', '#fbbf24', '#fcd34d', '#ff6b6b', '#4ecdc4',
      '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c',
      '#e74c3c', '#9b59b6', '#3498db', '#1abc9c', '#e67e22',
      '#fd79a8', '#a29bfe', '#00b894', '#fdcb6e', '#6c5ce7',
    ];
    const shapes: Array<'rect' | 'circle' | 'star'> = ['rect', 'circle', 'star'];
    for (let i = 0; i < 250; i++) {
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

function getPrizeIcon(index: number) {
  const icons = [<Crown key="crown" />, <Star key="star" />, <Trophy key="trophy" />, <Gift key="gift" />, <Dices key="dices" />];
  return icons[index % icons.length];
}

type DrawMode = 'customer' | 'advisor';

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value) + '₫';
}

function titleCase(str: string) {
  if (!str) return '';
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

export default function LuckyDrawPage() {
  const store = useInvestmentStore();
  const trackRef = useRef<HTMLDivElement>(null);
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
  const [autoScroll, setAutoScroll] = useState(true);

  // Track whether prizes have been initialized from store
  const [localPrizeOverrides, setLocalPrizeOverrides] = useState<Prize[] | null>(null);

  // Derive prizes from store gift tiers, with optional local overrides
  const prizes: Prize[] = localPrizeOverrides ?? store.giftTiers.map((tier) => ({
    id: tier.id,
    name: tier.giftName,
    quantity: 1,
    remaining: 1,
  }));

  // Load data
  useEffect(() => {
    store.loadAll();
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

  // Available customers (not won yet)
  const availableCustomers = store.customers.filter(c => !wonCustomerIds.has(c.id));
  const availableAdvisors = [...new Set(availableCustomers.map(c => c.advisor).filter(Boolean))];
  const drawItems = drawMode === 'customer'
    ? availableCustomers.map(c => ({ id: c.id, name: c.name, advisor: c.advisor }))
    : availableAdvisors.map(a => ({ id: a, name: a, advisor: a }));
  const currentPrize = prizes[currentPrizeIndex] || null;
  const canSpin = !isSpinning && drawItems.length > 0 && currentPrize && currentPrize.remaining > 0;

  // Auto-scroll for customer table (bottom to top)
  useEffect(() => {
    const el = customerTableRef.current;
    if (!el || !autoScroll) return;
    let scrollPos = el.scrollHeight; // start at bottom
    el.scrollTop = scrollPos;
    const speed = 0.6;
    let animId: number;
    const scroll = () => {
      scrollPos -= speed;
      if (scrollPos <= 0) {
        scrollPos = el.scrollHeight;
      }
      el.scrollTop = scrollPos;
      animId = requestAnimationFrame(scroll);
    };
    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [autoScroll, store.customers, wonCustomerIds]);

  // Reset scroll position when auto-scroll is turned off
  useEffect(() => {
    if (!autoScroll && customerTableRef.current) {
      customerTableRef.current.scrollTop = 0;
    }
  }, [autoScroll]);

  // Build track for slot machine
  const buildTrack = () => {
    const items = drawItems.map(item => item.name);
    if (items.length === 0) return [];
    const track: string[] = [];
    for (let i = 0; i < 15; i++) {
      const shuffled = [...items].sort(() => Math.random() - 0.5);
      track.push(...shuffled);
    }
    return track;
  };

  // Start spinning
  const startSpin = () => {
    if (isSpinning || drawItems.length === 0 || !currentPrize || currentPrize.remaining <= 0) return;
    setIsSpinning(true);
    setIsStopping(false);
    setShowResult(false);
    setCurrentWinner(null);

    const track = buildTrack();
    if (!trackRef.current || track.length === 0) return;

    // Render track items
    trackRef.current.innerHTML = '';
    for (const name of track) {
      const div = document.createElement('div');
      div.className = 'slot-item';
      div.textContent = name;
      div.style.cssText = `
        height: 80px; display: flex; align-items: center; justify-content: center;
        font-size: 28px; font-weight: 800; color: #78350f; white-space: nowrap;
        padding: 0 30px; text-align: center;
      `;
      trackRef.current.appendChild(div);
    }

    // Animate - fast scroll
    const totalHeight = track.length * 80;
    const scrollDistance = totalHeight * 0.7;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform = 'translateY(0)';
    void trackRef.current.offsetHeight;
    trackRef.current.style.transition = 'transform 20s linear';
    trackRef.current.style.transform = `translateY(-${scrollDistance}px)`;
  };

  // Stop spinning
  const stopSpin = () => {
    if (!isSpinning || isStopping) return;
    setIsStopping(true);

    const winnerItem = drawItems[Math.floor(Math.random() * drawItems.length)];
    const customer = store.customers.find(c =>
      drawMode === 'customer' ? c.id === winnerItem.id : c.advisor === winnerItem.id
    );

    const winner: Winner = {
      id: winnerItem.id,
      customerName: drawMode === 'customer' ? winnerItem.name : winnerItem.name,
      advisor: customer?.advisor || winnerItem.name,
      prizeName: currentPrize?.name || 'Giải thưởng',
    };

    if (trackRef.current) {
      const items = trackRef.current.querySelectorAll('.slot-item');
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
        const targetY = centerOffset * 80;
        const currentTransform = trackRef.current.style.transform;
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform = currentTransform;
        void trackRef.current.offsetHeight;
        trackRef.current.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        trackRef.current.style.transform = `translateY(-${targetY}px)`;
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
        const advisorCustomerIds = store.customers
          .filter(c => c.advisor === winner.id)
          .map(c => c.id);
        setWonCustomerIds(prev => new Set([...prev, ...advisorCustomerIds]));
      }

      setLocalPrizeOverrides(prev => {
        const base = prev ?? store.giftTiers.map((tier) => ({
          id: tier.id,
          name: tier.giftName,
          quantity: 1,
          remaining: 1,
        }));
        return base.map((p, i) =>
          i === currentPrizeIndex ? { ...p, remaining: p.remaining - 1 } : p
        );
      });

      if (confettiRef.current) {
        confettiRef.current.start();
        setTimeout(() => confettiRef.current?.stop(), 5000);
      }
    }, 3500);
  };

  const handleSlotClick = () => {
    if (!isSpinning) {
      startSpin();
    } else if (!isStopping) {
      stopSpin();
    }
  };

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
      const base = prev ?? store.giftTiers.map((tier) => ({
        id: tier.id,
        name: tier.giftName,
        quantity: 1,
        remaining: 1,
      }));
      return base.map(p => ({ ...p, remaining: p.quantity }));
    });
  };

  // Customer rows for the scrolling table (duplicated for seamless loop)
  const allCustomers = store.customers;

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-50 via-amber-50/30 to-orange-50/40">
      {/* Confetti Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* Decorative background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-amber-200/20 to-yellow-100/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-gradient-to-tr from-amber-100/15 to-orange-100/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-gradient-to-tl from-orange-100/10 to-amber-100/10 rounded-full blur-3xl" />
      </div>

      {/* === HEADER BAR === */}
      <div className="flex-shrink-0 relative overflow-hidden rounded-b-2xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 opacity-95" />
        <div className="relative px-4 py-2.5 md:py-3 flex items-center justify-between">
          <Link href="/" title="Quay lại">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="p-1.5 hover:bg-amber-800/10 rounded-lg transition-all"
            >
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-amber-900/70" />
            </motion.button>
          </Link>
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 8, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Diamond className="w-4 h-4 md:w-5 md:h-5 text-amber-900/60" />
            </motion.div>
            <h1 className="text-sm md:text-lg font-black uppercase tracking-wider text-amber-900">
              {store.eventInfo.name || 'Quay Số May Mắn'}
            </h1>
          </div>
          <div className="flex items-center gap-1">
            {/* Auto-scroll toggle */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setAutoScroll(!autoScroll)}
              className={`p-1.5 rounded-lg transition-all ${autoScroll ? 'bg-emerald-500/20 text-emerald-700' : 'hover:bg-amber-800/10 text-amber-900/50'}`}
              title={autoScroll ? 'Tắt cuộn tự động' : 'Bật cuộn tự động'}
            >
              {autoScroll ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setSettingsOpen(true); setSettingsAuthenticated(false); }}
              className="p-1.5 hover:bg-amber-800/10 rounded-lg transition-all"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5 text-amber-900/70" />
            </motion.button>
          </div>
        </div>
        {/* Draw mode + Prize selector row */}
        <div className="relative px-4 pb-2 flex items-center gap-2">
          <div className="flex gap-1 p-1 rounded-lg bg-amber-500/20">
            <button
              onClick={() => setDrawMode('customer')}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                drawMode === 'customer'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 shadow-md'
                  : 'text-amber-800/60 hover:text-amber-800/80'
              }`}
            >
              Khách hàng
            </button>
            <button
              onClick={() => setDrawMode('advisor')}
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase transition-all ${
                drawMode === 'advisor'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 shadow-md'
                  : 'text-amber-800/60 hover:text-amber-800/80'
              }`}
            >
              TVV
            </button>
          </div>
          {/* Prize selector */}
          {prizes.length > 1 && (
            <div className="flex-1 flex items-center gap-1 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
              {prizes.map((prize, idx) => (
                <button
                  key={prize.id}
                  onClick={() => { if (!isSpinning) setCurrentPrizeIndex(idx); }}
                  className={`flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold transition-all border ${
                    idx === currentPrizeIndex
                      ? 'bg-amber-400/30 border-amber-400 text-amber-900'
                      : 'border-amber-300/30 text-amber-800/50 hover:text-amber-800/80'
                  }`}
                >
                  {prize.name} <span className="text-[10px]">({prize.remaining})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === MAIN CONTENT === */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* SLOT MACHINE AREA - top portion */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4 py-2 md:py-4">
          {/* Desktop: show prize name prominently */}
          {currentPrize && (
            <div className="hidden md:flex items-center justify-center gap-3 mb-3">
              <Crown className="w-6 h-6 text-amber-600" />
              <span className="text-amber-800 font-extrabold text-xl md:text-2xl">{currentPrize.name}</span>
              <span className="text-slate-500 text-base">(còn {currentPrize.remaining})</span>
            </div>
          )}

          {/* Mobile: compact prize indicator */}
          {currentPrize && (
            <div className="md:hidden flex items-center justify-center gap-2 mb-1">
              <Crown className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-amber-800 font-bold text-sm">{currentPrize.name}</span>
              <span className="text-slate-500 text-xs">(còn {currentPrize.remaining})</span>
            </div>
          )}

          {/* Slot Machine - larger for desktop/projection */}
          <div
            className={`relative w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl transition-shadow duration-1000 ${
              canSpin ? 'animate-pulse-shadow' : ''
            }`}
            style={{
              background: 'linear-gradient(180deg, #fffbeb 0%, #fef3c7 50%, #fffbeb 100%)',
              border: '3px solid #f59e0b',
              boxShadow: canSpin
                ? '0 0 40px rgba(245, 158, 11, 0.35), inset 0 0 40px rgba(245, 158, 11, 0.06)'
                : '0 0 20px rgba(245, 158, 11, 0.12), inset 0 0 20px rgba(245, 158, 11, 0.03)',
            }}
          >
            {/* Top decoration */}
            <div className="h-2 md:h-3 w-full" style={{ background: 'linear-gradient(90deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)' }} />

            {/* Slot viewport - bigger on desktop */}
            <div className="relative overflow-hidden" style={{ height: 'clamp(200px, 40vh, 400px)' }}>
              {/* Highlight lines */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute top-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to bottom, #fffbeb, transparent)' }} />
                <div className="absolute bottom-0 left-0 right-0 h-20" style={{ background: 'linear-gradient(to top, #fffbeb, transparent)' }} />
                {/* Center highlight */}
                <div
                  className="absolute left-0 right-0"
                  style={{
                    top: 'calc(50% - 40px)',
                    height: '80px',
                    borderTop: '3px solid rgba(245, 158, 11, 0.5)',
                    borderBottom: '3px solid rgba(245, 158, 11, 0.5)',
                    background: 'rgba(245, 158, 11, 0.08)',
                  }}
                />
                {/* Side markers */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderLeft: '14px solid #f59e0b' }} />
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="w-0 h-0" style={{ borderTop: '10px solid transparent', borderBottom: '10px solid transparent', borderRight: '14px solid #f59e0b' }} />
                </div>
              </div>

              {/* Track */}
              <div ref={trackRef} className="absolute left-0 right-0" style={{ top: '0' }}>
                {!isSpinning && !showResult && (
                  <div style={{ height: 'clamp(200px, 40vh, 400px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p className="text-slate-400 text-lg md:text-2xl font-medium">
                      {drawItems.length === 0 ? 'Không có người tham gia' : 'Nhấn để bắt đầu quay số'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom decoration */}
            <div className="h-2 md:h-3 w-full" style={{ background: 'linear-gradient(90deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)' }} />
          </div>

          {/* Spin button */}
          <motion.button
            whileHover={canSpin ? { scale: 1.05 } : {}}
            whileTap={canSpin ? { scale: 0.95 } : {}}
            onClick={handleSlotClick}
            disabled={!canSpin && !isSpinning}
            className={`mt-3 md:mt-4 px-8 md:px-12 py-2.5 md:py-3.5 rounded-xl font-bold text-base md:text-xl uppercase tracking-wider shadow-lg transition-all min-h-[44px] md:min-h-[56px] ${
              canSpin ? 'animate-pulse-glow' : ''
            }`}
            style={{
              background: canSpin || isSpinning
                ? 'linear-gradient(135deg, #f59e0b, #fbbf24, #f59e0b)'
                : '#fef3c7',
              color: canSpin || isSpinning ? '#78350f' : '#d4a843',
              border: '2px solid rgba(245, 158, 11, 0.5)',
              cursor: canSpin || isSpinning ? 'pointer' : 'not-allowed',
            }}
          >
            {isSpinning
              ? (isStopping ? 'Đang dừng...' : 'Nhấn để dừng!')
              : (drawItems.length === 0 ? 'Không có người chơi' : (!currentPrize || currentPrize.remaining <= 0 ? 'Hết giải thưởng' : 'Bắt đầu quay'))
            }
          </motion.button>
        </div>

        {/* Winner result overlay */}
        <AnimatePresence>
          {showResult && currentWinner && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.9 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="flex-shrink-0 px-4 pb-2"
            >
              <div
                className="max-w-3xl mx-auto rounded-xl p-4 md:p-6 text-center bg-white/95 backdrop-blur-sm border-2 border-amber-300 shadow-lg"
              >
                <p className="text-slate-500 text-xs uppercase tracking-wider mb-1">Chúc mừng người trúng giải</p>
                <p className="text-2xl md:text-4xl font-black text-amber-900 mb-1">{currentWinner.customerName}</p>
                {drawMode === 'customer' && currentWinner.advisor && (
                  <p className="text-slate-500 text-sm md:text-base">TVV: {currentWinner.advisor}</p>
                )}
                <p className="text-amber-700 font-semibold mt-1 text-base md:text-lg">🏆 {currentWinner.prizeName}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* === BOTTOM TABLE: Customer & Gift list (1/3 screen on mobile) === */}
        <div className="flex-shrink-0 border-t-2 border-amber-300 bg-white/95 backdrop-blur-sm" style={{ height: '33vh', minHeight: '140px' }}>
          {/* Table header */}
          <div className="bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 flex items-center px-3 md:px-5 py-1.5 md:py-2">
            <div className="flex-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-900" />
              <span className="text-amber-900 font-extrabold text-xs md:text-sm uppercase">Khách Hàng</span>
              <span className="text-amber-900/60 text-[10px] md:text-xs ml-1">({allCustomers.length})</span>
            </div>
            <div className="flex items-center gap-1.5 min-w-[120px] md:min-w-[200px] justify-end">
              <Gift className="w-3.5 h-3.5 md:w-4 md:h-4 text-amber-900" />
              <span className="text-amber-900 font-extrabold text-xs md:text-sm uppercase">Quà Tặng</span>
            </div>
            {/* Auto-scroll toggle for mobile */}
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={() => setAutoScroll(!autoScroll)}
              className={`ml-2 p-1 rounded-md transition-all ${autoScroll ? 'bg-emerald-500/20 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
              title={autoScroll ? 'Tắt cuộn' : 'Bật cuộn'}
            >
              {autoScroll ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
            </motion.button>
          </div>

          {/* Scrollable body */}
          <div
            ref={customerTableRef}
            className="overflow-hidden"
            style={{ height: 'calc(33vh - 36px)', minHeight: '104px' }}
          >
            {/* Duplicate content for seamless loop when auto-scrolling */}
            {[0, 1].map(dup => (
              <div key={dup}>
                {allCustomers.map((c, idx) => {
                  const isWon = wonCustomerIds.has(c.id);
                  return (
                    <div
                      key={`${c.id}-${dup}`}
                      className={`flex items-center px-3 md:px-5 py-1.5 md:py-2 border-b border-amber-100/60 transition-colors ${
                        isWon ? 'bg-amber-50/50 opacity-60' : 'hover:bg-amber-50/40'
                      }`}
                    >
                      <div className="flex-1 flex items-center gap-2 min-w-0">
                        <span className="text-slate-400 font-mono text-[10px] md:text-xs w-6 flex-shrink-0">{idx + 1}</span>
                        <span className={`text-sm md:text-base font-bold truncate ${isWon ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                          {titleCase(c.name)}
                        </span>
                        {c.advisor && (
                          <span className="text-slate-400 text-[10px] md:text-xs truncate hidden md:inline">- {titleCase(c.advisor)}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 min-w-[120px] md:min-w-[200px] justify-end">
                        <span className={`text-xs md:text-sm font-bold truncate ${isWon ? 'text-slate-400 line-through' : 'text-rose-700'}`}>
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

      {/* === SETTINGS MODAL === */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl bg-white border-2 border-amber-200 shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden p-4 flex justify-between items-center bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 rounded-t-2xl">
                <h2 className="text-xl font-bold text-amber-900">Cài đặt Quay Số</h2>
                <button
                  onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                  className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-amber-900" />
                </button>
              </div>

              {!settingsAuthenticated ? (
                <div className="p-6 text-center">
                  <div className="mb-4 p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <Settings className="w-10 h-10 text-amber-500 mx-auto mb-3" />
                    <p className="text-slate-600 text-sm mb-3">Nhập mật khẩu để tiếp tục</p>
                    <input
                      type="password"
                      value={settingsPassword}
                      onChange={e => setSettingsPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSettingsAuth()}
                      placeholder="Mật khẩu"
                      className="w-full p-3 rounded-lg text-center font-mono text-lg tracking-widest outline-none transition-all border-2 border-amber-200 focus:border-amber-400 bg-white text-amber-900"
                      autoFocus
                    />
                    {settingsPassword && settingsPassword !== '0969774224' && (
                      <p className="text-rose-500 text-xs mt-2">Mật khẩu không đúng</p>
                    )}
                  </div>
                  <button
                    onClick={handleSettingsAuth}
                    className="px-6 py-2.5 rounded-lg font-bold transition-all bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 shadow-md hover:shadow-lg"
                  >
                    Xác nhận
                  </button>
                </div>
              ) : (
                <div className="p-5 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-lg bg-amber-100/80">
                    {(['general', 'prizes', 'customers'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                          settingsTab === tab
                            ? 'bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 shadow-md'
                            : 'text-slate-500 hover:text-amber-700'
                        }`}
                      >
                        {tab === 'general' ? 'Chung' : tab === 'prizes' ? 'Giải thưởng' : 'Khách hàng'}
                      </button>
                    ))}
                  </div>

                  {/* General tab */}
                  {settingsTab === 'general' && (
                    <div className="space-y-4">
                      {/* Program title setting */}
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <h4 className="text-amber-800 text-sm font-semibold mb-2">Tiêu đề chương trình</h4>
                        <input
                          value={store.eventInfo.name}
                          onChange={(e) => store.saveEventInfo({ name: e.target.value })}
                          placeholder="Nhập tiêu đề chương trình"
                          className="w-full p-2.5 border-2 border-amber-200 rounded-lg focus:border-amber-400 focus:ring-2 focus:ring-amber-200 outline-none transition-all text-sm"
                        />
                      </div>
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <h4 className="text-amber-800 text-sm font-semibold mb-2">Thống kê</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tổng khách hàng:</span>
                            <span className="text-amber-800 font-bold">{store.customers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Tổng TVV:</span>
                            <span className="text-amber-800 font-bold">{[...new Set(store.customers.map(c => c.advisor).filter(Boolean))].length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Số giải đã trao:</span>
                            <span className="text-amber-800 font-bold">{winners.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Còn lại:</span>
                            <span className="text-emerald-700 font-bold">{drawItems.length}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleResetWinners}
                        className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90 bg-rose-50 border-2 border-rose-200 text-rose-600"
                      >
                        Đặt lại toàn bộ kết quả
                      </button>
                    </div>
                  )}

                  {/* Prizes tab */}
                  {settingsTab === 'prizes' && (
                    <div className="space-y-3">
                      {editPrizes.map((prize, idx) => (
                        <div
                          key={prize.id}
                          className="p-3 rounded-xl flex items-center gap-2 bg-amber-50 border border-amber-200"
                        >
                          <span className="text-amber-600 flex-shrink-0">{getPrizeIcon(idx)}</span>
                          <input
                            value={prize.name}
                            onChange={e => {
                              const updated = [...editPrizes];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setEditPrizes(updated);
                            }}
                            className="flex-1 p-1.5 border border-amber-200 rounded-md text-sm outline-none focus:border-amber-400"
                          />
                          <input
                            type="number"
                            min={1}
                            value={prize.quantity}
                            onChange={e => handleUpdatePrizeQty(prize.id, parseInt(e.target.value) || 1)}
                            className="w-16 p-1.5 border border-amber-200 rounded-md text-sm text-center outline-none focus:border-amber-400"
                          />
                          <button
                            onClick={() => handleRemovePrize(prize.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <div className="flex gap-2">
                        <input
                          value={newPrizeName}
                          onChange={e => setNewPrizeName(e.target.value)}
                          placeholder="Tên giải"
                          className="flex-1 p-2 border-2 border-amber-200 rounded-lg text-sm outline-none focus:border-amber-400"
                        />
                        <input
                          type="number"
                          min={1}
                          value={newPrizeQty}
                          onChange={e => setNewPrizeQty(e.target.value)}
                          className="w-20 p-2 border-2 border-amber-200 rounded-lg text-sm text-center outline-none focus:border-amber-400"
                        />
                        <button
                          onClick={handleAddPrize}
                          className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-sm transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                      <button
                        onClick={handleSaveSettings}
                        className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 text-amber-900 shadow-md hover:shadow-lg"
                      >
                        Lưu giải thưởng
                      </button>
                    </div>
                  )}

                  {/* Customers tab */}
                  {settingsTab === 'customers' && (
                    <div className="space-y-2">
                      <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                        <p className="text-slate-500 text-sm">
                          Quản lý khách hàng từ <Link href="/" className="text-amber-700 underline font-semibold">trang chính</Link>.
                        </p>
                      </div>
                      <div className="max-h-60 overflow-y-auto space-y-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#f59e0b transparent' }}>
                        {store.customers.map(c => (
                          <div key={c.id} className="flex items-center gap-2 px-2 py-1.5 rounded text-xs bg-white border border-amber-100">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wonCustomerIds.has(c.id) ? 'bg-rose-400' : 'bg-emerald-500'}`} />
                            <span className="font-semibold text-slate-700 truncate">{c.name}</span>
                            <span className="text-slate-400 ml-auto text-[10px]">{c.advisor}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                    className="w-full bg-slate-100 hover:bg-slate-200 py-2.5 rounded-lg font-semibold transition-colors mt-2"
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
