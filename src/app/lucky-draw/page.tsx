'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Settings, Plus, Trash2, X, Trophy, Users, Gift, Crown, Star, Dices
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
    rotationSpeed: number; opacity: number;
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
    const colors = ['#d4a843', '#f5d870', '#ffe066', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f9ca24', '#f0932b', '#eb4d4b', '#6ab04c'];
    for (let i = 0; i < 200; i++) {
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
      this.ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      this.ctx.restore();
    }
    if (alive) {
      this.animFrame = requestAnimationFrame(this.animate);
    } else {
      this.stop();
    }
  };
}

// Default prize icons
const prizeIcons: Record<number, React.ReactNode> = {};

function getPrizeIcon(index: number) {
  const icons = [<Crown key="crown" />, <Star key="star" />, <Trophy key="trophy" />, <Gift key="gift" />, <Dices key="dices" />];
  return icons[index % icons.length];
}

// Draw mode
type DrawMode = 'customer' | 'advisor';

export default function LuckyDrawPage() {
  const store = useInvestmentStore();
  const trackRef = useRef<HTMLDivElement>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef<ConfettiSystem | null>(null);
  const customerListRef = useRef<HTMLDivElement>(null);

  // State
  // prizes is now derived from localPrizeOverrides / store.giftTiers (see below)
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

  // Auto scroll for customer list
  const [scrollPaused, setScrollPaused] = useState(false);

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

  // Auto-scroll customer list
  useEffect(() => {
    const el = customerListRef.current;
    if (!el || scrollPaused) return;
    let scrollPos = 0;
    const speed = 0.5;
    let animId: number;
    const scroll = () => {
      scrollPos += speed;
      if (scrollPos >= el.scrollHeight - el.clientHeight) {
        scrollPos = 0;
      }
      el.scrollTop = scrollPos;
      animId = requestAnimationFrame(scroll);
    };
    animId = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(animId);
  }, [scrollPaused, store.customers]);

  // Available customers (not won yet)
  const availableCustomers = store.customers.filter(c => !wonCustomerIds.has(c.id));

  // Available advisors (unique advisors with at least one unwon customer)
  const availableAdvisors = [...new Set(availableCustomers.map(c => c.advisor).filter(Boolean))];

  // Draw items based on mode
  const drawItems = drawMode === 'customer'
    ? availableCustomers.map(c => ({ id: c.id, name: c.name, advisor: c.advisor }))
    : availableAdvisors.map(a => ({ id: a, name: a, advisor: a }));

  // Current prize
  const currentPrize = prizes[currentPrizeIndex] || null;

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
        height: 60px; display: flex; align-items: center; justify-content: center;
        font-size: 20px; font-weight: 700; color: #e8d5a3; white-space: nowrap;
        padding: 0 20px; text-align: center;
      `;
      trackRef.current.appendChild(div);
    }

    // Animate - fast scroll
    const totalHeight = track.length * 60;
    const scrollDistance = totalHeight * 0.7;
    trackRef.current.style.transition = 'none';
    trackRef.current.style.transform = 'translateY(0)';
    // Force reflow
    void trackRef.current.offsetHeight;
    trackRef.current.style.transition = 'transform 20s linear';
    trackRef.current.style.transform = `translateY(-${scrollDistance}px)`;
  };

  // Stop spinning
  const stopSpin = () => {
    if (!isSpinning || isStopping) return;
    setIsStopping(true);

    // Pick a random winner
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

    // Find the winner's name in the track
    if (trackRef.current) {
      const items = trackRef.current.querySelectorAll('.slot-item');
      const totalItems = items.length;

      // Find a suitable index near the end portion
      let targetIdx = -1;
      for (let i = totalItems - 1; i >= Math.floor(totalItems * 0.3); i--) {
        if (items[i].textContent === winner.customerName) {
          targetIdx = i;
          break;
        }
      }

      if (targetIdx === -1) {
        // If not found, find any occurrence in the latter half
        for (let i = totalItems - 1; i >= 0; i--) {
          if (items[i].textContent === winner.customerName) {
            targetIdx = i;
            break;
          }
        }
      }

      if (targetIdx !== -1) {
        // Center position (2 items visible above center = targetIdx - 2)
        const centerOffset = targetIdx - 2;
        const targetY = centerOffset * 60;

        // Clear current transition and set new one for smooth landing
        const currentTransform = trackRef.current.style.transform;
        trackRef.current.style.transition = 'none';
        trackRef.current.style.transform = currentTransform;
        void trackRef.current.offsetHeight;

        trackRef.current.style.transition = 'transform 3s cubic-bezier(0.1, 0.7, 0.1, 1)';
        trackRef.current.style.transform = `translateY(-${targetY}px)`;
      }
    }

    // After animation settles
    setTimeout(() => {
      setCurrentWinner(winner);
      setShowResult(true);
      setIsSpinning(false);
      setIsStopping(false);

      // Add to winners
      setWinners(prev => [...prev, winner]);

      // Mark as won
      if (drawMode === 'customer') {
        setWonCustomerIds(prev => new Set([...prev, winner.id]));
      } else {
        // Mark all customers of this advisor as won
        const advisorCustomerIds = store.customers
          .filter(c => c.advisor === winner.id)
          .map(c => c.id);
        setWonCustomerIds(prev => new Set([...prev, ...advisorCustomerIds]));
      }

      // Decrease prize quantity
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

      // Confetti!
      if (confettiRef.current) {
        confettiRef.current.start();
        setTimeout(() => confettiRef.current?.stop(), 5000);
      }
    }, 3500);
  };

  // Click handler for the slot machine
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

  const canSpin = !isSpinning && drawItems.length > 0 && currentPrize && currentPrize.remaining > 0;

  return (
    <div className="h-screen flex overflow-hidden" style={{ background: '#0f1b30' }}>
      {/* Confetti Canvas */}
      <canvas
        ref={confettiCanvasRef}
        className="fixed inset-0 pointer-events-none z-50"
        style={{ width: '100vw', height: '100vh' }}
      />

      {/* === SIDEBAR === */}
      <div className="flex-shrink-0 flex flex-col border-r border-amber-900/30" style={{ width: '310px', background: 'linear-gradient(180deg, #0d1629 0%, #0f1b30 100%)' }}>
        {/* Back button + Title */}
        <div className="p-4 border-b border-amber-900/30">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/" title="Quay lại">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="p-1.5 hover:bg-amber-800/20 rounded-lg transition-all"
              >
                <ArrowLeft className="w-4 h-4 text-amber-400/70" />
              </motion.button>
            </Link>
            <h1
              className="text-xl font-black uppercase tracking-wider flex-1 text-center"
              style={{
                background: 'linear-gradient(135deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Quay Số May Mắn
            </h1>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => { setSettingsOpen(true); setSettingsAuthenticated(false); }}
              className="p-1.5 hover:bg-amber-800/20 rounded-lg transition-all"
              title="Cài đặt"
            >
              <Settings className="w-4 h-4 text-amber-400/70" />
            </motion.button>
          </div>

          {/* Draw mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(212, 168, 67, 0.1)' }}>
            <button
              onClick={() => setDrawMode('customer')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                drawMode === 'customer'
                  ? 'text-amber-900 shadow-md'
                  : 'text-amber-400/60 hover:text-amber-400/80'
              }`}
              style={drawMode === 'customer' ? { background: 'linear-gradient(135deg, #d4a843, #f5d870)' } : {}}
            >
              Khách hàng
            </button>
            <button
              onClick={() => setDrawMode('advisor')}
              className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                drawMode === 'advisor'
                  ? 'text-amber-900 shadow-md'
                  : 'text-amber-400/60 hover:text-amber-400/80'
              }`}
              style={drawMode === 'advisor' ? { background: 'linear-gradient(135deg, #d4a843, #f5d870)' } : {}}
            >
              TVV
            </button>
          </div>
        </div>

        {/* Prize List */}
        <div className="p-4 border-b border-amber-900/30">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5" /> Giải thưởng
          </h3>
          <div className="space-y-1 max-h-40 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a843 transparent' }}>
            {prizes.length === 0 ? (
              <p className="text-amber-400/40 text-xs italic text-center py-2">Chưa có giải thưởng</p>
            ) : (
              prizes.map((prize, idx) => (
                <motion.div
                  key={prize.id}
                  onClick={() => { if (!isSpinning) setCurrentPrizeIndex(idx); }}
                  className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg cursor-pointer transition-all ${
                    idx === currentPrizeIndex
                      ? 'bg-amber-400/15 border border-amber-400/30'
                      : 'hover:bg-amber-400/5 border border-transparent'
                  }`}
                >
                  <span className="text-amber-400/80 flex-shrink-0">{getPrizeIcon(idx)}</span>
                  <span className={`text-sm font-semibold flex-1 truncate ${idx === currentPrizeIndex ? 'text-amber-300' : 'text-amber-400/70'}`}>
                    {prize.name}
                  </span>
                  <span className={`text-xs font-mono px-1.5 py-0.5 rounded ${
                    prize.remaining > 0
                      ? 'bg-emerald-400/15 text-emerald-400'
                      : 'bg-red-400/15 text-red-400'
                  }`}>
                    {prize.remaining}/{prize.quantity}
                  </span>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Customer/Advisor List */}
        <div className="p-4 flex-1 min-h-0 flex flex-col">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> {drawMode === 'customer' ? 'Khách hàng' : 'Tư vấn viên'}
          </h3>
          <div className="flex items-center gap-3 mb-2 text-xs">
            <span className="text-amber-400/60">
              Tổng: <span className="text-amber-300 font-bold">{drawMode === 'customer' ? store.customers.length : [...new Set(store.customers.map(c => c.advisor).filter(Boolean))].length}</span>
            </span>
            <span className="text-amber-400/60">
              Còn: <span className="text-emerald-400 font-bold">{drawItems.length}</span>
            </span>
          </div>
          <div
            ref={customerListRef}
            onMouseEnter={() => setScrollPaused(true)}
            onMouseLeave={() => setScrollPaused(false)}
            className="flex-1 min-h-0 overflow-y-auto space-y-0.5 pr-1"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a843 transparent' }}
          >
            {drawItems.length === 0 ? (
              <p className="text-amber-400/40 text-xs italic text-center py-4">Không có người tham gia</p>
            ) : (
              drawItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2 px-2 py-1 rounded text-xs hover:bg-amber-400/5 transition-colors">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/60 flex-shrink-0" />
                  <span className="text-amber-200/80 truncate font-medium">{item.name}</span>
                  {drawMode === 'customer' && item.advisor && (
                    <span className="text-amber-400/40 ml-auto truncate text-[10px]">{item.advisor}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Winner Count */}
        <div className="p-3 border-t border-amber-900/30 text-center">
          <span className="text-amber-400/60 text-xs">Đã trao giải: </span>
          <span className="text-amber-300 font-bold text-sm">{winners.length}</span>
        </div>
      </div>

      {/* === MAIN AREA === */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ background: 'radial-gradient(ellipse at center, #162544 0%, #0f1b30 70%)' }}>
        {/* Title */}
        <div className="text-center pt-6 pb-4 flex-shrink-0">
          <h2
            className="text-3xl md:text-4xl font-black uppercase tracking-wider"
            style={{
              background: 'linear-gradient(135deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: 'none',
            }}
          >
            Chương Trình Quay Số
          </h2>
          {currentPrize && (
            <div className="mt-2 flex items-center justify-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 font-bold text-lg">{currentPrize.name}</span>
              <span className="text-amber-400/50 text-sm">(còn {currentPrize.remaining})</span>
            </div>
          )}
        </div>

        {/* Slot Machine */}
        <div className="flex-1 flex flex-col items-center justify-center min-h-0 px-4">
          <div
            className="relative w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
            style={{
              background: 'linear-gradient(180deg, #1a2d4a 0%, #0f1b30 100%)',
              border: '2px solid rgba(212, 168, 67, 0.3)',
              boxShadow: '0 0 60px rgba(212, 168, 67, 0.1), inset 0 0 60px rgba(0,0,0,0.3)',
            }}
          >
            {/* Top decoration */}
            <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)' }} />

            {/* Slot viewport */}
            <div className="relative overflow-hidden" style={{ height: '300px' }}>
              {/* Highlight lines */}
              <div className="absolute inset-0 pointer-events-none z-10">
                {/* Top fade */}
                <div className="absolute top-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to bottom, #0f1b30, transparent)' }} />
                {/* Bottom fade */}
                <div className="absolute bottom-0 left-0 right-0 h-16" style={{ background: 'linear-gradient(to top, #0f1b30, transparent)' }} />
                {/* Center highlight */}
                <div
                  className="absolute left-0 right-0 h-[60px]"
                  style={{ top: '120px', borderTop: '2px solid rgba(212, 168, 67, 0.5)', borderBottom: '2px solid rgba(212, 168, 67, 0.5)', background: 'rgba(212, 168, 67, 0.05)' }}
                />
                {/* Side markers */}
                <div className="absolute left-2 top-[120px] flex flex-col items-center" style={{ height: '60px' }}>
                  <div className="flex-1 flex items-center">
                    <div className="w-0 h-0" style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderLeft: '10px solid #d4a843' }} />
                  </div>
                </div>
                <div className="absolute right-2 top-[120px] flex flex-col items-center" style={{ height: '60px' }}>
                  <div className="flex-1 flex items-center">
                    <div className="w-0 h-0" style={{ borderTop: '8px solid transparent', borderBottom: '8px solid transparent', borderRight: '10px solid #d4a843' }} />
                  </div>
                </div>
              </div>

              {/* Track */}
              <div ref={trackRef} className="absolute left-0 right-0" style={{ top: '0' }}>
                {/* Slot items will be dynamically inserted here */}
                {!isSpinning && !showResult && (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p className="text-amber-400/40 text-lg font-medium">
                      {drawItems.length === 0 ? 'Không có người tham gia' : 'Nhấn để bắt đầu quay số'}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom decoration */}
            <div className="h-2 w-full" style={{ background: 'linear-gradient(90deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)' }} />
          </div>

          {/* Spin button */}
          <motion.button
            whileHover={canSpin ? { scale: 1.05 } : {}}
            whileTap={canSpin ? { scale: 0.95 } : {}}
            onClick={handleSlotClick}
            disabled={!canSpin && !isSpinning}
            className="mt-6 px-8 py-3 rounded-xl font-bold text-lg uppercase tracking-wider shadow-lg transition-all"
            style={{
              background: canSpin || isSpinning
                ? 'linear-gradient(135deg, #d4a843, #f5d870, #ffe066)'
                : 'rgba(212, 168, 67, 0.15)',
              color: canSpin || isSpinning ? '#0f1b30' : 'rgba(212, 168, 67, 0.4)',
              border: '2px solid rgba(212, 168, 67, 0.3)',
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
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex-shrink-0 px-4 pb-4"
            >
              <div
                className="max-w-xl mx-auto rounded-xl p-4 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(212, 168, 67, 0.15), rgba(245, 216, 112, 0.1))',
                  border: '1px solid rgba(212, 168, 67, 0.3)',
                }}
              >
                <p className="text-amber-400/60 text-xs uppercase tracking-wider mb-1">Chúc mừng người trúng giải</p>
                <p className="text-2xl font-black text-amber-300 mb-1">{currentWinner.customerName}</p>
                {drawMode === 'customer' && currentWinner.advisor && (
                  <p className="text-amber-400/50 text-sm">TVV: {currentWinner.advisor}</p>
                )}
                <p className="text-amber-400 font-semibold mt-1">🏆 {currentWinner.prizeName}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Winners List */}
        {winners.length > 0 && (
          <div className="flex-shrink-0 px-4 pb-4">
            <div
              className="max-w-xl mx-auto rounded-xl p-3 max-h-32 overflow-y-auto"
              style={{
                background: 'rgba(15, 27, 48, 0.8)',
                border: '1px solid rgba(212, 168, 67, 0.15)',
                scrollbarWidth: 'thin',
                scrollbarColor: '#d4a843 transparent',
              }}
            >
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400/60 mb-2 flex items-center gap-1.5">
                <Trophy className="w-3 h-3" /> Kết quả ({winners.length})
              </h4>
              <div className="space-y-1">
                {winners.map((w, idx) => (
                  <div key={`${w.id}-${idx}`} className="flex items-center gap-2 text-xs">
                    <span className="text-amber-400/50 font-mono w-5">#{idx + 1}</span>
                    <span className="text-amber-200/80 font-semibold">{w.customerName}</span>
                    <span className="text-amber-400/40">—</span>
                    <span className="text-amber-300/70">{w.prizeName}</span>
                    {drawMode === 'customer' && w.advisor && (
                      <>
                        <span className="text-amber-400/40">—</span>
                        <span className="text-amber-400/40">{w.advisor}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* === SETTINGS MODAL === */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="w-full max-w-lg max-h-[85vh] overflow-auto rounded-2xl"
              style={{ background: '#1a2d4a', border: '2px solid rgba(212, 168, 67, 0.3)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="relative overflow-hidden p-4 flex justify-between items-center" style={{ background: 'linear-gradient(90deg, #d4a843, #f5d870, #ffe066, #f5d870, #d4a843)' }}>
                <h2 className="text-xl font-bold text-amber-900">Cài đặt Quay Số</h2>
                <button
                  onClick={() => { setSettingsOpen(false); setSettingsAuthenticated(false); }}
                  className="p-1 hover:bg-black/10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-amber-900" />
                </button>
              </div>

              {!settingsAuthenticated ? (
                /* Password screen */
                <div className="p-6 text-center">
                  <div className="mb-4 p-4 rounded-xl" style={{ background: 'rgba(212, 168, 67, 0.1)', border: '1px solid rgba(212, 168, 67, 0.2)' }}>
                    <Settings className="w-10 h-10 text-amber-400/60 mx-auto mb-3" />
                    <p className="text-amber-300/80 text-sm mb-3">Nhập mật khẩu để tiếp tục</p>
                    <input
                      type="password"
                      value={settingsPassword}
                      onChange={e => setSettingsPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSettingsAuth()}
                      placeholder="Mật khẩu"
                      className="w-full p-3 rounded-lg text-center font-mono text-lg tracking-widest outline-none transition-all"
                      style={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        border: '2px solid rgba(212, 168, 67, 0.3)',
                        color: '#f5d870',
                      }}
                      autoFocus
                    />
                    {settingsPassword && settingsPassword !== '0969774224' && (
                      <p className="text-red-400 text-xs mt-2">Mật khẩu không đúng</p>
                    )}
                  </div>
                  <button
                    onClick={handleSettingsAuth}
                    className="px-6 py-2.5 rounded-lg font-bold transition-all"
                    style={{ background: 'linear-gradient(135deg, #d4a843, #f5d870)', color: '#0f1b30' }}
                  >
                    Xác nhận
                  </button>
                </div>
              ) : (
                /* Authenticated settings */
                <div className="p-5 space-y-4">
                  {/* Tabs */}
                  <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'rgba(212, 168, 67, 0.1)' }}>
                    {(['general', 'prizes', 'customers'] as const).map(tab => (
                      <button
                        key={tab}
                        onClick={() => setSettingsTab(tab)}
                        className={`flex-1 px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                          settingsTab === tab
                            ? 'text-amber-900 shadow-md'
                            : 'text-amber-400/60 hover:text-amber-400/80'
                        }`}
                        style={settingsTab === tab ? { background: 'linear-gradient(135deg, #d4a843, #f5d870)' } : {}}
                      >
                        {tab === 'general' ? 'Chung' : tab === 'prizes' ? 'Giải thưởng' : 'Khách hàng'}
                      </button>
                    ))}
                  </div>

                  {/* General tab */}
                  {settingsTab === 'general' && (
                    <div className="space-y-4">
                      <div className="p-3 rounded-xl" style={{ background: 'rgba(212, 168, 67, 0.08)', border: '1px solid rgba(212, 168, 67, 0.15)' }}>
                        <h4 className="text-amber-300/80 text-sm font-semibold mb-2">Thống kê</h4>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-amber-400/60">Tổng khách hàng:</span>
                            <span className="text-amber-300 font-bold">{store.customers.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-400/60">Tổng TVV:</span>
                            <span className="text-amber-300 font-bold">{[...new Set(store.customers.map(c => c.advisor).filter(Boolean))].length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-400/60">Số giải đã trao:</span>
                            <span className="text-amber-300 font-bold">{winners.length}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-amber-400/60">Còn lại:</span>
                            <span className="text-emerald-400 font-bold">{drawItems.length}</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleResetWinners}
                        className="w-full px-4 py-2.5 rounded-lg font-bold text-sm transition-all hover:opacity-90"
                        style={{ background: 'rgba(239, 68, 68, 0.2)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444' }}
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
                          className="p-3 rounded-xl flex items-center gap-2"
                          style={{ background: 'rgba(212, 168, 67, 0.08)', border: '1px solid rgba(212, 168, 67, 0.15)' }}
                        >
                          <span className="text-amber-400/60 flex-shrink-0">{getPrizeIcon(idx)}</span>
                          <input
                            value={prize.name}
                            onChange={e => {
                              const updated = [...editPrizes];
                              updated[idx] = { ...updated[idx], name: e.target.value };
                              setEditPrizes(updated);
                            }}
                            className="flex-1 px-2 py-1 rounded text-sm outline-none"
                            style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212, 168, 67, 0.2)', color: '#f5d870' }}
                          />
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleUpdatePrizeQty(prize.id, Math.max(0, prize.quantity - 1))}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all"
                              style={{ background: 'rgba(212, 168, 67, 0.15)', color: '#d4a843' }}
                            >
                              -
                            </button>
                            <span className="text-amber-300 font-bold text-sm w-6 text-center">{prize.quantity}</span>
                            <button
                              onClick={() => handleUpdatePrizeQty(prize.id, prize.quantity + 1)}
                              className="w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all"
                              style={{ background: 'rgba(212, 168, 67, 0.15)', color: '#d4a843' }}
                            >
                              +
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemovePrize(prize.id)}
                            className="p-1 rounded transition-all hover:opacity-80"
                            style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                      <div
                        className="p-3 rounded-xl flex items-center gap-2"
                        style={{ background: 'rgba(212, 168, 67, 0.05)', border: '1px dashed rgba(212, 168, 67, 0.3)' }}
                      >
                        <Plus className="w-4 h-4 text-amber-400/50" />
                        <input
                          value={newPrizeName}
                          onChange={e => setNewPrizeName(e.target.value)}
                          placeholder="Tên giải thưởng"
                          className="flex-1 px-2 py-1 rounded text-sm outline-none"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212, 168, 67, 0.2)', color: '#f5d870' }}
                        />
                        <input
                          type="number"
                          value={newPrizeQty}
                          onChange={e => setNewPrizeQty(e.target.value)}
                          min="1"
                          className="w-14 px-2 py-1 rounded text-sm text-center outline-none"
                          style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(212, 168, 67, 0.2)', color: '#f5d870' }}
                        />
                        <button
                          onClick={handleAddPrize}
                          className="px-3 py-1 rounded-lg text-xs font-bold transition-all"
                          style={{ background: 'linear-gradient(135deg, #d4a843, #f5d870)', color: '#0f1b30' }}
                        >
                          Thêm
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Customers tab */}
                  {settingsTab === 'customers' && (
                    <div className="space-y-2 max-h-64 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4a843 transparent' }}>
                      <p className="text-amber-400/50 text-xs italic mb-2">
                        Danh sách khách hàng từ hệ thống chính. Sẽ không hiển thị khách hàng đã trúng giải.
                      </p>
                      {store.customers.map(c => (
                        <div
                          key={c.id}
                          className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs"
                          style={{
                            background: wonCustomerIds.has(c.id) ? 'rgba(239, 68, 68, 0.1)' : 'rgba(212, 168, 67, 0.05)',
                            border: `1px solid ${wonCustomerIds.has(c.id) ? 'rgba(239, 68, 68, 0.2)' : 'rgba(212, 168, 67, 0.1)'}`,
                          }}
                        >
                          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${wonCustomerIds.has(c.id) ? 'bg-red-400/60' : 'bg-emerald-400/60'}`} />
                          <span className={`${wonCustomerIds.has(c.id) ? 'text-red-400/60 line-through' : 'text-amber-200/80'} font-medium truncate`}>{c.name}</span>
                          <span className="text-amber-400/40 ml-auto truncate">{c.advisor}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Save button */}
                  <button
                    onClick={handleSaveSettings}
                    className="w-full py-2.5 rounded-lg font-bold transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #d4a843, #f5d870)', color: '#0f1b30' }}
                  >
                    Lưu & Đóng
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
