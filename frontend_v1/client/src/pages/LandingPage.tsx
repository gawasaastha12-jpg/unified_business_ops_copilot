import { motion, AnimatePresence, useInView } from "framer-motion";
import { useState, useEffect, useRef, forwardRef } from "react";
import { Mail, Twitter, FileText, Slack, ChevronDown } from "lucide-react";

const PlaneIcon = ({ className = "" }: { className?: string }) => (
  <svg 
    className={className} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2.5" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M17.8 19.2 16 11l3.5-3.5a2.1 2.1 0 1 0-3-3L13 8 4.8 6.2c-.5-.1-1 .1-1.3.5l-.3.3c-.4.4-.4 1.1 0 1.5L9 12l-4 4H3l-1 1v2l1 1h2l1-1v-2l4-4 3.7 5.7c.4.4 1.1.4 1.5 0l.3-.3c.4-.3.6-.8.5-1.3Z" />
  </svg>
);

interface RunwayButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function RunwayButton({ onClick, children, className = "" }: RunwayButtonProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const planeVariants = {
    initial: { x: -45, y: -8, scale: 1.4, opacity: 0, rotate: 15 },
    hover: { 
      x: [ -45, 10, 55, 260 ], 
      y: [ -8, 0, 0, 0 ], 
      scale: [ 1.4, 0.9, 0.9, 0.9 ], 
      opacity: [ 0, 1, 1, 0 ],
      rotate: [ 15, 0, 0, 0 ],
      transition: {
        duration: 1.6,
        times: [0, 0.35, 0.8, 1.0],
        ease: "easeOut",
        repeat: Infinity,
        repeatDelay: 0.6
      }
    }
  };

  return (
    <motion.button
      whileHover="hover"
      initial="initial"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative px-12 py-4 bg-gradient-to-r from-violet-600 to-blue-500 text-white font-extrabold uppercase tracking-wider text-xs rounded-full shadow-[0_12px_32px_rgba(139,92,246,0.35)] hover:shadow-[0_16px_48px_rgba(139,92,246,0.55)] transition-all cursor-pointer overflow-hidden group select-none ${className}`}
    >
      <style>{`
        @keyframes runway-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-20px); }
        }
      `}</style>

      {/* Runway Background Overlay */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center overflow-hidden pointer-events-none">
          {/* Runway edge lines */}
          <div className="absolute inset-x-0 top-1.5 h-[1px] bg-slate-700/50" />
          <div className="absolute inset-x-0 bottom-1.5 h-[1px] bg-slate-700/50" />
          
          {/* Moving centerline lights */}
          <div 
            className="w-[200%] h-[2px] absolute top-1/2 -translate-y-1/2"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #eab308, #eab308 10px, transparent 10px, transparent 20px)',
              animation: 'runway-move 0.6s linear infinite'
            }}
          />
        </div>
      )}

      {/* Text Container */}
      <span className="relative z-10 block transition-transform duration-300 group-hover:translate-x-3 text-center">
        {children}
      </span>

      {/* Airplane */}
      {!prefersReducedMotion && (
        <motion.div
          variants={planeVariants}
          className="absolute z-20 top-1/2 -translate-y-1/2 left-0 pointer-events-none text-white"
          style={{ originY: "50%" }}
        >
          <PlaneIcon className="w-4 h-4 transform rotate-45" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Section 1: Hero (CRED-style Typography & Glow Mesh)
function Section1Hero({ onCTAClick }: { onCTAClick: () => void }) {
  const dotVariants = {
    animate: (i: number) => ({
      x: [0, Math.random() * 20 - 10, 0],
      y: [0, Math.random() * 20 - 10, 0],
      transition: {
        duration: 4 + Math.random() * 4,
        repeat: Infinity,
        repeatType: "mirror" as const,
      },
    }),
  };

  const lineVariants = {
    animate: {
      opacity: [0.1, 0.3, 0.1],
      transition: {
        duration: 3,
        repeat: Infinity,
        repeatType: "mirror" as const,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-transparent">
      {/* Glow mesh blobs */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-blue-500/10 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-500/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 text-center px-6 max-w-5xl">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-xs font-black uppercase tracking-[0.4em] text-blue-400 mb-6 drop-shadow-md"
        >
          The future of ops is here
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black mb-8 tracking-tighter bg-gradient-to-b from-white via-gray-100 to-gray-400 bg-clip-text text-transparent uppercase leading-[0.9] drop-shadow-[0_10px_30px_rgba(0,0,0,0.85)]"
        >
          Business Ops <br />
          <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text">Copilot</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-16 font-extralight tracking-wide leading-relaxed drop-shadow-md"
        >
          One AI agent pipeline to ingest, route, understand, and resolve events across Customer Care, Social Channels, and Financial Ledgers.
        </motion.p>

        <RunwayButton onClick={onCTAClick}>
          See what's possible
        </RunwayButton>
      </div>

      {/* Scroll indicator */}
      <motion.div
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2 cursor-pointer"
        onClick={onCTAClick}
      >
        <ChevronDown className="w-5 h-5 text-gray-500 hover:text-white transition-colors" />
      </motion.div>
    </section>
  );
}

// Helper card config
const tools = [
  { name: "Support Inbox", icon: "📧", color: "from-sky-400 to-cyan-300" },
  { name: "Twitter/X", icon: "𝕏", color: "from-violet-400 to-pink-400" },
  { name: "Spreadsheet", icon: "📊", color: "from-emerald-400 to-lime-300" },
  { name: "Slack", icon: "💬", color: "from-slate-400 to-gray-400" },
];const toolIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "Support Inbox": Mail,
  "Twitter/X": Twitter,
  "Spreadsheet": FileText,
  "Slack": Slack,
};

const toolImages = {
  "Support Inbox": "/inbox_icon.png",
  "Twitter/X": "/twitter_icon.png",
  "Spreadsheet": "/spreadsheet_icon.png",
  "Slack": "/slack_icon.png",
};

// Section 2: The Problem
const generateBubblePool = () => {
  const pool = [];
  const cardCoords = [
    { x: 20, y: 15 }, // P0
    { x: 80, y: 15 }, // P1
    { x: 20, y: 75 }, // P2
    { x: 80, y: 75 }  // P3
  ];

  for (let i = 0; i < 40; i++) {
    const progress = i / 40;
    const startTime = 100 + 1700 * Math.pow(progress, 2) + Math.random() * 100;
    const duration = 800 - 550 * progress + Math.random() * 100;
    
    const pStart = Math.floor(Math.random() * 4);
    let pEnd = Math.floor(Math.random() * 4);
    while (pEnd === pStart) {
      pEnd = Math.floor(Math.random() * 4);
    }
    
    pool.push({
      id: i,
      pStart,
      pEnd,
      startTime,
      duration,
      startX: cardCoords[pStart].x,
      startY: cardCoords[pStart].y,
      endX: cardCoords[pEnd].x,
      endY: cardCoords[pEnd].y,
    });
  }
  
  return pool;
};

function Section2Problem({ isActive }: { isActive: boolean }) {
  const cardVariants = {
    hidden: (i: number) => {
      const positions = [
        { x: -120, y: -120 },
        { x: 120, y: -120 },
        { x: -120, y: 120 },
        { x: 120, y: 120 },
      ];
      return { opacity: 0, ...positions[i] };
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { type: "spring", stiffness: 100, damping: 18 },
    },
  };

  const badgeVariants = {
    animate: {
      scale: [1, 1.25, 1],
      opacity: [1, 0.5, 1],
      transition: { duration: 1.5, repeat: Infinity },
    },
  };

  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [chaosState, setChaosState] = useState<'idle' | 'building' | 'frozen'>('idle');
  const [bubbles, setBubbles] = useState<Array<{ id: number; x: number; y: number; opacity: number }>>([]);
  const [badgeCounts, setBadgeCounts] = useState<number[]>([1, 1, 1, 1]);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { once: true, amount: 0.3 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    if (!isInView || prefersReducedMotion) return;
    
    setChaosState('building');
    const bubblePool = generateBubblePool();
    const startTime = performance.now();
    let cycleStartTime = performance.now();
    let animFrameId: number;

    const tick = () => {
      const now = performance.now();
      let elapsed = now - cycleStartTime;
      if (elapsed >= 2000) {
        cycleStartTime = now;
        elapsed = 0;
      }

      // Update bubbles
      const updatedBubbles = bubblePool.map(b => {
        if (elapsed < b.startTime) {
          return { id: b.id, x: b.startX, y: b.startY, opacity: 0 };
        }
        const t = (elapsed - b.startTime) / b.duration;
        if (t > 1) {
          return { id: b.id, x: b.endX, y: b.endY, opacity: 0 };
        }
        
        const x = b.startX + (b.endX - b.startX) * t;
        const y = b.startY + (b.endY - b.startY) * t;
        const opacity = Math.sin(t * Math.PI) * 0.75;
        return { id: b.id, x, y, opacity };
      });
      setBubbles(updatedBubbles);

      // Continuous flickering badge counts (flickers from 3 to 9+ representing activity streams)
      const newCounts = [0, 1, 2, 3].map((_, i) => {
        const base = Math.floor((now - startTime) / 300 + i * 2) % 7 + 3;
        const jitter = Math.random() > 0.65 ? 1 : 0;
        return Math.min(9, base + jitter);
      });
      setBadgeCounts(newCounts);

      animFrameId = requestAnimationFrame(tick);
    };

    animFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameId);
  }, [isInView, prefersReducedMotion]);

  return (
    <section ref={sectionRef} className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 py-20 relative overflow-hidden">
      {/* Background glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-red-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Tool cards container */}
      <div className="relative w-full max-w-2xl h-96 mb-20">
        <AnimatePresence>
          {isActive && tools.map((tool, i) => {
            return (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute w-32 h-32 flex flex-col items-center justify-center cursor-pointer"
                style={{
                  left: ["calc(20% - 64px)", "calc(80% - 64px)", "calc(20% - 64px)", "calc(80% - 64px)"][i],
                  top: ["calc(15% - 64px)", "calc(15% - 64px)", "calc(75% - 64px)", "calc(75% - 64px)"][i],
                }}
              >
                {/* Card shape - Shares layoutId with Section 3 */}
                <motion.div
                  layoutId={`card-shape-${i}`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-24 h-24 bg-gray-900/70 backdrop-blur-xl border border-white/15 rounded-[28px] shadow-2xl flex items-center justify-center relative group hover:border-white/25 transition-colors duration-300 overflow-hidden"
                >
                  <img 
                    src={toolImages[tool.name as keyof typeof toolImages]} 
                    alt={tool.name}
                    className="w-full h-full object-cover rounded-[26px] transition-transform duration-300 group-hover:scale-105"
                  />
                  {prefersReducedMotion || chaosState === 'idle' ? (
                    <motion.div
                      variants={badgeVariants}
                      animate="animate"
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full border-2 border-gray-950 shadow-md"
                    />
                  ) : (
                    <div className="absolute -top-2.5 -right-2.5 min-w-[20px] h-[20px] px-1 bg-red-500 rounded-full border-2 border-gray-950 flex items-center justify-center text-[9px] font-black text-white shadow-lg shadow-red-500/40 z-10 animate-[pulse_1.5s_infinite]">
                      {badgeCounts[i] >= 9 ? "9+" : `${badgeCounts[i]}`}
                    </div>
                  )}
                </motion.div>
                
                {/* Label - Unmounts independently using AnimatePresence */}
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs uppercase tracking-widest font-black text-gray-300 mt-3.5 text-center pointer-events-none drop-shadow-md"
                >
                  {tool.name}
                </motion.span>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Flying chaos bubbles */}
        {!prefersReducedMotion && bubbles.map(b => (
          <div
            key={b.id}
            className="absolute w-3 h-3 bg-red-500 rounded-full border border-gray-950 flex items-center justify-center pointer-events-none shadow-md shadow-red-500/30"
            style={{
              left: `${b.x}%`,
              top: `${b.y}%`,
              opacity: b.opacity,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="w-1 h-1 bg-white rounded-full" />
          </div>
        ))}
      </div>

      {/* Overlay text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center max-w-3xl"
      >
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-[0.95] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
          Your tools <span className="text-red-500">don't talk</span> to each other
        </h2>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true, amount: 0.3 }}
          className="text-lg text-gray-300 font-extralight tracking-widest uppercase drop-shadow-md"
        >
          Every signal gets lost between inboxes, spreadsheets, and feeds.
        </motion.p>
      </motion.div>
    </section>
  );
}

// Section 3: The Shift (Shared Element Convergence)
const Section3Shift = forwardRef<HTMLDivElement, { isActive: boolean }>(({ isActive }, ref) => {
  const [centerPulse, setCenterPulse] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || !isActive) return;
    
    const triggerBump = () => {
      setCenterPulse(true);
      const timer = window.setTimeout(() => setCenterPulse(false), 300);
      timers.push(timer);
    };

    const timers: number[] = [];
    const runCycle = () => {
      timers.push(window.setTimeout(() => triggerBump(), 1500));
      timers.push(window.setTimeout(() => triggerBump(), 2250));
      timers.push(window.setTimeout(() => triggerBump(), 3000));
      timers.push(window.setTimeout(() => triggerBump(), 3750));
    };

    runCycle();
    const intervalId = window.setInterval(runCycle, 3000);

    return () => {
      clearInterval(intervalId);
      timers.forEach(t => clearTimeout(t));
    };
  }, [isActive, prefersReducedMotion]);

  const convergenceVariants = {
    hidden: { opacity: 0, x: 0, y: 0, scale: 0.5 },
    visible: (i: number) => {
      const positions = [
        { x: -160, y: -110 },
        { x: 160, y: -110 },
        { x: -160, y: 110 },
        { x: 160, y: 110 },
      ];
      return {
        opacity: 1,
        scale: 1,
        ...positions[i],
        transition: { type: "spring", stiffness: 80, damping: 15 }
      };
    }
  };

  const nodeVariants = {
    hidden: { scale: 0.5, opacity: 0 },
    visible: {
      scale: 1,
      opacity: 1,
      transition: { type: "spring", stiffness: 100, damping: 15, delay: 0.4 },
    },
  };

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 py-20 relative overflow-hidden"
    >
      {/* Background glow mesh */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/5 blur-[150px] rounded-full pointer-events-none" />

      {/* Converging cards container */}
      <div className="relative w-full max-w-2xl h-80 mb-20 flex items-center justify-center">
        
        {/* SVG background lines & listening pulses */}
        <svg viewBox="0 0 640 320" className="absolute inset-0 w-full h-full pointer-events-none z-0">
          <line x1="160" y1="50" x2="320" y2="160" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" />
          <line x1="480" y1="50" x2="320" y2="160" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" />
          <line x1="160" y1="270" x2="320" y2="160" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" />
          <line x1="480" y1="270" x2="320" y2="160" stroke="rgba(99, 102, 241, 0.2)" strokeWidth="1" />

          {isActive && !prefersReducedMotion && (
            <>
              <motion.circle
                r="4"
                fill="#a855f7"
                animate={{ cx: [160, 320], cy: [50, 160], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "linear" }}
              />
              <motion.circle
                r="4"
                fill="#3b82f6"
                animate={{ cx: [480, 320], cy: [50, 160], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "linear", delay: 0.75 }}
              />
              <motion.circle
                r="4"
                fill="#10b981"
                animate={{ cx: [160, 320], cy: [270, 160], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "linear", delay: 1.5 }}
              />
              <motion.circle
                r="4"
                fill="#6366f1"
                animate={{ cx: [480, 320], cy: [270, 160], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "linear", delay: 2.25 }}
              />
            </>
          )}
        </svg>

        {/* Central glowing converged node */}
        <motion.div
          variants={nodeVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          animate={!prefersReducedMotion && centerPulse ? { scale: 1.12, filter: "brightness(1.4) saturate(1.2)" } : { scale: 1, filter: "brightness(1) saturate(1)" }}
          transition={{ type: "spring", stiffness: 300, damping: 12 }}
          className="absolute w-24 h-24 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 rounded-full shadow-2xl z-10 flex items-center justify-center cursor-pointer"
          style={{
            boxShadow: !prefersReducedMotion && centerPulse 
              ? "0 0 80px rgba(139, 92, 246, 0.6), 0 0 120px rgba(59, 130, 246, 0.5)" 
              : "0 0 60px rgba(59, 130, 246, 0.4), 0 0 100px rgba(168, 85, 247, 0.3)",
          }}
        >
          <span className="text-xl font-black text-white uppercase tracking-wider">One</span>
          
          {/* Radar expand circle (ping) */}
          {isActive && !prefersReducedMotion && (
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-indigo-500/40 pointer-events-none"
              animate={{ scale: [1, 2.4], opacity: [0.6, 0] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
            />
          )}
        </motion.div>

        {/* Converged items mapping */}
        <AnimatePresence>
          {isActive && tools.map((tool, i) => {
            return (
              <motion.div
                key={i}
                custom={i}
                variants={convergenceVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="absolute w-32 h-32 flex items-center justify-center"
                style={{
                  left: "calc(50% - 64px)",
                  top: "calc(50% - 64px)",
                }}
              >
                {/* Shared card shape converged to center, NO LABELS are rendered to prevent overlapping */}
                <motion.div
                  layoutId={`card-shape-${i}`}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="w-20 h-20 bg-gray-900/70 backdrop-blur-xl border border-white/12 rounded-[24px] shadow-xl flex items-center justify-center overflow-hidden group hover:border-white/20 transition-colors duration-300"
                >
                  <img 
                    src={toolImages[tool.name as keyof typeof toolImages]} 
                    alt={tool.name}
                    className="w-full h-full object-cover rounded-[22px] transition-transform duration-300 group-hover:scale-105"
                  />
                </motion.div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: prefersReducedMotion ? 0.3 : 3.5 }}
        viewport={{ once: true, amount: 0.3 }}
        className="text-center max-w-3xl"
      >
        <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6 uppercase tracking-tight leading-[0.95] drop-shadow-[0_8px_24px_rgba(0,0,0,0.8)]">
          What if <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">one engine</span> heard everything?
        </h2>
        <p className="text-lg text-gray-300 font-extralight tracking-widest uppercase drop-shadow-md">
          That's what we built.
        </p>
      </motion.div>
    </motion.section>
  );
});

Section3Shift.displayName = "Section3Shift";

// Section 4: Architecture Reveal
const tooltipsConfig: Record<string, { text: string; left: string; top: string }> = {
  router: { text: "Classifies domain and urgency for every incoming event", left: "50%", top: "8%" },
  agent_0: { text: "Drafts RAG-grounded replies from a real FAQ base", left: "20%", top: "29%" },
  agent_1: { text: "Classifies risk and drafts brand-safe responses", left: "40%", top: "29%" },
  agent_2: { text: "Rule-based anomaly detection on transactions", left: "60%", top: "29%" },
  agent_3: { text: "Routes fallback notifications and handles manual interventions", left: "80%", top: "29%" },
  shared_data: { text: "One queryable store for every event across domains", left: "50%", top: "52%" },
  dashboard: { text: "Real-time visualization and human approval", left: "50%", top: "72%" },
};

function Section4Architecture() {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(sectionRef, { amount: 0.3 });

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const isPathActive = (id: string) => {
    if (!hoveredNode) return true;
    if (hoveredNode === 'router') return id === 'router';
    if (hoveredNode === 'shared_data') {
      return id === 'shared_data' || id.startsWith('agent_') || id.startsWith('line_agent_to_shared_data_') || id.startsWith('line_router_to_agent_') || id === 'router';
    }
    if (hoveredNode === 'dashboard') return true;
    
    if (hoveredNode.startsWith('agent_')) {
      const index = hoveredNode.split('_')[1];
      return id === 'router' || 
             id === `line_router_to_agent_${index}` || 
             id === `agent_${index}` || 
             id === `line_agent_to_shared_data_${index}` || 
             id === 'shared_data' || 
             id === 'line_shared_data_to_dashboard' || 
             id === 'dashboard';
    }
    return true;
  };

  return (
    <motion.section
      ref={sectionRef}
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 py-20 relative overflow-hidden"
    >
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-purple-500/5 blur-[150px] rounded-full pointer-events-none" />

      <h2 className="text-4xl md:text-5xl font-black text-white mb-16 text-center uppercase tracking-tight">
        The Autonomous Engine
      </h2>

      <div className="w-full max-w-xl relative">
        {/* Tooltip Overlay */}
        {hoveredNode && tooltipsConfig[hoveredNode] && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="absolute z-20 bg-gray-900/95 border border-indigo-500/30 text-white text-[11px] px-3.5 py-2 rounded-2xl shadow-xl max-w-[200px] text-center pointer-events-none backdrop-blur-md"
            style={{
              left: tooltipsConfig[hoveredNode].left,
              top: tooltipsConfig[hoveredNode].top,
              transform: 'translate(-50%, -130%)',
            }}
          >
            {tooltipsConfig[hoveredNode].text}
          </motion.div>
        )}

        <svg viewBox="0 0 400 500" className="w-full h-auto overflow-visible">
          {/* Lines from Router to agents */}
          {[0, 1, 2, 3].map((i) => (
            <motion.line
              key={`line-${i}`}
              x1="200"
              y1="65"
              x2={80 + i * 80}
              y2="120"
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              animate={{ opacity: hoveredNode === null ? 0.4 : isPathActive(`line_router_to_agent_${i}`) ? 0.8 : 0.15 }}
            />
          ))}

          {/* Lines to Shared Store */}
          {[0, 1, 2, 3].map((i) => (
            <motion.line
              key={`line-store-${i}`}
              x1={80 + i * 80}
              y1="165"
              x2="200"
              y2="240"
              stroke="rgba(99, 102, 241, 0.4)"
              strokeWidth="1.5"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.6, delay: 0.6 + i * 0.1 }}
              animate={{ opacity: hoveredNode === null ? 0.4 : isPathActive(`line_agent_to_shared_data_${i}`) ? 0.8 : 0.15 }}
            />
          ))}

          {/* Line to Dashboard */}
          <motion.line
            x1="200"
            y1="280"
            x2="200"
            y2="340"
            stroke="rgba(99, 102, 241, 0.4)"
            strokeWidth="1.5"
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 1 }}
            animate={{ opacity: hoveredNode === null ? 0.4 : isPathActive('line_shared_data_to_dashboard') ? 0.8 : 0.15 }}
          />

          {/* Continuous looping packets */}
          {isInView && !prefersReducedMotion && [0, 1, 2, 3].map((i) => (
            <motion.circle
              key={`packet-${i}`}
              r="2.5"
              fill="#a855f7"
              animate={{
                cx: [200, 80 + i * 80, 80 + i * 80, 200, 200, 200],
                cy: [65, 120, 165, 240, 280, 340],
                opacity: hoveredNode === null ? 0.8 : isPathActive(`agent_${i}`) ? 1.0 : 0.15,
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "linear",
                delay: i * 0.87,
              }}
              style={{ originX: 0.5, originY: 0.5 }}
            />
          ))}

          {/* Router node */}
          <motion.circle
            cx="200"
            cy="40"
            r="25"
            fill="url(#gradient1)"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5 }}
            onMouseEnter={() => setHoveredNode('router')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            animate={{ 
              opacity: hoveredNode === null ? 1 : isPathActive('router') ? 1 : 0.25,
              scale: hoveredNode === 'router' ? 1.1 : 1
            }}
          />
          <motion.text
            x="200"
            y="45"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1"
            className="uppercase pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            animate={{ opacity: hoveredNode === null ? 1 : isPathActive('router') ? 1 : 0.25 }}
          >
            Router
          </motion.text>

          {/* Agent nodes */}
          {[0, 1, 2, 3].map((i) => (
            <motion.circle
              key={`agent-${i}`}
              cx={80 + i * 80}
              cy="145"
              r="20"
              fill={["#0ea5e9", "#8b5cf6", "#10b981", "#64748b"][i]}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
              onMouseEnter={() => setHoveredNode(`agent_${i}`)}
              onMouseLeave={() => setHoveredNode(null)}
              className="cursor-pointer"
              animate={{ 
                opacity: hoveredNode === null ? 1 : isPathActive(`agent_${i}`) ? 1 : 0.25,
                scale: hoveredNode === `agent_${i}` ? 1.1 : 1
              }}
            />
          ))}

          {/* Shared Store node */}
          <motion.rect
            x="145"
            y="240"
            width="110"
            height="40"
            rx="20"
            fill="url(#gradient2)"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            onMouseEnter={() => setHoveredNode('shared_data')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            animate={{ 
              opacity: hoveredNode === null ? 1 : isPathActive('shared_data') ? 1 : 0.25,
              scale: hoveredNode === 'shared_data' ? 1.05 : 1
            }}
          />
          <motion.text
            x="200"
            y="264"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1"
            className="uppercase pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 1 }}
            animate={{ opacity: hoveredNode === null ? 1 : isPathActive('shared_data') ? 1 : 0.25 }}
          >
            Shared Data
          </motion.text>

          {/* Dashboard node */}
          <motion.rect
            x="145"
            y="340"
            width="110"
            height="40"
            rx="20"
            fill="url(#gradient3)"
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 1.2 }}
            onMouseEnter={() => setHoveredNode('dashboard')}
            onMouseLeave={() => setHoveredNode(null)}
            className="cursor-pointer"
            animate={{ 
              opacity: hoveredNode === null ? 1 : isPathActive('dashboard') ? 1 : 0.25,
              scale: hoveredNode === 'dashboard' ? 1.05 : 1
            }}
          />
          <motion.text
            x="200"
            y="364"
            textAnchor="middle"
            fill="white"
            fontSize="10"
            fontWeight="900"
            letterSpacing="1"
            className="uppercase pointer-events-none"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.5, delay: 1.4 }}
            animate={{ opacity: hoveredNode === null ? 1 : isPathActive('dashboard') ? 1 : 0.25 }}
          >
            Dashboard
          </motion.text>

          {/* Gradients */}
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
            <linearGradient id="gradient3" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
        </svg>
      </div>
    </motion.section>
  );
}

// Section 5: Live Proof Teaser (CRED-style Side-by-Side Visual)
function Section5Teaser({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.3 }}
      className="min-h-screen flex flex-col items-center justify-center bg-transparent px-6 py-24 relative overflow-hidden"
    >
      {/* Background glow blob */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-indigo-500/5 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
        {/* Left column: Confident Headline and Giant Stats */}
        <div className="lg:col-span-5 text-left space-y-8">
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tight leading-[0.95]">
            See it catch a real <br />
            <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-500 bg-clip-text text-transparent">cross-domain pattern</span> <br />
            in seconds.
          </h2>

          <p className="text-gray-400 font-extralight text-base leading-relaxed">
            The Management Agent reads every channel and surfaces correlated signals as one insight.
          </p>

          <div className="pt-4 flex items-center gap-6">
            <div className="space-y-1">
              <span className="text-8xl md:text-[10rem] font-black tracking-tighter text-white leading-none block">3</span>
              <span className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-600 block">
                signals connected in one digest
              </span>
            </div>
          </div>
        </div>

        {/* Right column: Browser Mockup holding the real Screenshot */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 80, damping: 15 }}
            viewport={{ once: true, amount: 0.3 }}
            className="w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative group hover:border-white/20 transition-all duration-300"
          >
            {/* browser frame chrome */}
            <div className="bg-white/[0.04] px-4 py-3 flex items-center justify-between border-b border-white/5">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>
              <div className="text-[10px] font-mono text-gray-500 select-none">
                ops-copilot.internal/digest
              </div>
              <div className="w-12" /> {/* spacer */}
            </div>

            {/* The actual live screenshot embed */}
            <div className="bg-gray-950 p-4 aspect-[16/10] overflow-hidden flex items-center justify-center relative">
              <img 
                src="/digest_screenshot.png" 
                alt="Management Digest Panel" 
                className="w-full h-full object-cover object-top rounded-lg border border-white/5 shadow-2xl group-hover:scale-[1.01] transition-transform duration-500"
                onError={(e) => {
                  // Fallback if image doesn't exist yet
                  e.currentTarget.style.display = 'none';
                  const fallbackDiv = e.currentTarget.parentElement?.querySelector('.screenshot-fallback') as HTMLDivElement;
                  if (fallbackDiv) fallbackDiv.style.display = 'flex';
                }}
              />

              {/* Fallback graphic if image is missing */}
              <div className="screenshot-fallback hidden absolute inset-0 flex-col items-center justify-center bg-gradient-to-br from-gray-900 to-gray-950 p-6 text-center space-y-4">
                <div className="text-4xl">📊</div>
                <p className="text-gray-400 text-sm font-medium">Management Digest Screenshot</p>
                <div className="w-64 h-16 bg-white/5 rounded border border-white/5 flex items-center justify-center">
                  <span className="text-xs text-gray-500">Seed earbuds, view dashboard to see live preview</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* CTA Button */}
      <RunwayButton 
        onClick={onEnterDashboard}
        className="mt-20"
      >
        Take it for a spin
      </RunwayButton>
    </motion.section>
  );
}

// Main Landing Page
export default function LandingPage({ onEnterDashboard }: { onEnterDashboard: () => void }) {
  const [isSection3Active, setIsSection3Active] = useState(false);
  const section3Ref = useRef<HTMLDivElement>(null);
  
  const isSection3InView = useInView(section3Ref, { amount: 0.3 });

  useEffect(() => {
    setIsSection3Active(isSection3InView);
  }, [isSection3InView]);

  const handleScroll = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="bg-gray-950 text-white selection:bg-blue-500/30 relative">
      {/* Persistent Particle Canvas */}
      <BackgroundParticles />

      {/* Film grain noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />
      <div id="section-1" className="relative z-10">
        <Section1Hero onCTAClick={() => handleScroll("section-2")} />
      </div>
      <div id="section-2" className="relative z-10">
        <Section2Problem isActive={!isSection3Active} />
      </div>
      <div id="section-3" className="relative z-10">
        <Section3Shift isActive={isSection3Active} ref={section3Ref} />
      </div>
      <div id="section-4" className="relative z-10">
        <Section4Architecture />
      </div>
      <div id="section-5" className="relative z-10">
        <Section5Teaser onEnterDashboard={onEnterDashboard} />
      </div>
    </div>
  );
}

function BackgroundParticles() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Stratified sampling using a 9x5 grid for perfect uniform distribution of 45 particles
    const gridCols = 9;
    const gridRows = 5;
    const particles = [];
    const cellWidth = width / gridCols;
    const cellHeight = height / gridRows;

    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        const isBright = Math.random() > 0.8;
        
        // Jitter within the cell boundaries
        const x = c * cellWidth + Math.random() * cellWidth;
        const y = r * cellHeight + Math.random() * cellHeight;

        particles.push({
          x,
          y,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: isBright ? Math.random() * 2 + 1.2 : Math.random() * 0.6 + 0.3,
          alpha: isBright ? Math.random() * 0.15 + 0.15 : Math.random() * 0.08 + 0.05,
          isBright,
        });
      }
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      if (document.hidden) {
        animationId = requestAnimationFrame(render);
        return;
      }

      // Trail clear trick using low opacity black rect
      ctx.fillStyle = 'rgba(3, 7, 18, 0.08)';
      ctx.fillRect(0, 0, width, height);

      // Update & Draw particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        // Wrap edges
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;

        // Subtle Parallax
        const depth = p.isBright ? 5 : 1.5;
        const offsetX = (mouseRef.current.x - width / 2) * 0.012 * depth;
        const offsetY = (mouseRef.current.y - height / 2) * 0.012 * depth;

        const drawX = p.x + offsetX;
        const drawY = p.y + offsetY;

        ctx.fillStyle = `rgba(129, 140, 248, ${p.alpha})`;
        ctx.beginPath();
        ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw lines
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          
          const depth1 = p1.isBright ? 5 : 1.5;
          const depth2 = p2.isBright ? 5 : 1.5;
          
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.hypot(dx, dy);

          if (dist < 120) {
            const x1_offset = p1.x + (mouseRef.current.x - width / 2) * 0.012 * depth1;
            const y1_offset = p1.y + (mouseRef.current.y - height / 2) * 0.012 * depth1;
            const x2_offset = p2.x + (mouseRef.current.x - width / 2) * 0.012 * depth2;
            const y2_offset = p2.y + (mouseRef.current.y - height / 2) * 0.012 * depth2;

            const alpha = (1 - dist / 120) * 0.16;
            
            ctx.shadowBlur = 3;
            ctx.shadowColor = 'rgba(129, 140, 248, 0.4)';
            ctx.strokeStyle = `rgba(129, 140, 248, ${alpha})`;
            ctx.lineWidth = 0.55;
            ctx.beginPath();
            ctx.moveTo(x1_offset, y1_offset);
            ctx.lineTo(x2_offset, y2_offset);
            ctx.stroke();
            ctx.shadowBlur = 0; // Reset shadow blur
          }
        }
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0 bg-gray-950"
    />
  );
}
