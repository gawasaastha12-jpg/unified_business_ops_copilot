import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { 
  RefreshCw, ChevronDown, ChevronUp, Check, X, ArrowLeft, Mail, 
  Megaphone, TrendingUp, Settings, Search, Bell, User, Plus, 
  Menu, Download, AlertTriangle, FileSpreadsheet, FileDown, Activity, LogOut
} from "lucide-react";
import { toast } from "sonner";
import { DOMAIN_COLORS } from "@/const";
import { useLocation } from "wouter";

// Types
interface Event {
  id: number;
  source: string;
  domain: string | null;
  raw_content: string;
  urgency: string | null;
  confidence: number | null;
  agent_response: string | null;
  status: string;
  created_at: string;
}

interface HistoryEntry {
  old_status: string;
  new_status: string;
  changed_at: string;
}

interface DigestResponse {
  stats: {
    total_events: number;
    by_domain: Record<string, number>;
    by_urgency: Record<string, number>;
    by_status: Record<string, number>;
  };
  digest_paragraph: string;
  cross_domain_patterns: Array<{
    related_event_ids: number[];
    reason: string;
  }>;
}

// API Base URL
const API_BASE = import.meta.env.DEV ? "http://127.0.0.1:8000" : "";

// Animated Number Component with Spring Easing
function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);

  useEffect(() => {
    const controls = animate(displayValue, value, {
      type: "spring",
      stiffness: 80,
      damping: 15,
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    });
    return () => controls.stop();
  }, [value]);

  return <span>{displayValue}</span>;
}

// Sparkline Component
function Sparkline({ data }: { data: number[] }) {
  if (data.length < 2) return null;
  const width = 80;
  const height = 24;
  const max = Math.max(...data, 1);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - (val / max) * height + 2;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible opacity-60 text-indigo-400">
      <polyline
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        points={points}
      />
    </svg>
  );
}

function DistributionDonut({ stats }: { stats: Record<string, number> }) {
  const data = Object.entries(stats).map(([key, val]) => {
    const config = DOMAIN_COLORS[key] || DOMAIN_COLORS.general;
    return {
      name: key === 'customer_care' ? 'Customer Care' :
            key === 'social' ? 'Social Media' :
            key === 'finance' ? 'Finance Anomaly' :
            key === 'management' ? 'Management Brain' : 'General Ops',
      value: val,
      color: config.str
    };
  }).filter(item => item.value > 0);

  const total = data.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <div className="text-xs text-gray-500 py-4 text-center">No active distribution</div>;

  let accumulatedPercent = 0;
  return (
    <div className="flex items-center gap-6 py-2">
      <svg width="80" height="80" viewBox="0 0 36 36" className="transform -rotate-90 flex-shrink-0">
        <circle cx="18" cy="18" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="3" />
        {data.map((item, i) => {
          const percent = (item.value / total) * 100;
          const strokeDasharray = `${percent} ${100 - percent}`;
          const strokeDashoffset = 100 - accumulatedPercent;
          accumulatedPercent += percent;
          return (
            <circle
              key={i}
              cx="18"
              cy="18"
              r="15.915"
              fill="transparent"
              stroke={item.color}
              strokeWidth="3.2"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
      <div className="space-y-1.5 flex-1 min-w-0">
        {data.map((item, i) => (
          <div key={i} className="flex items-center justify-between text-[10px] text-gray-400 font-medium">
            <div className="flex items-center gap-1.5 truncate">
              <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
              <span className="truncate">{item.name}</span>
            </div>
            <span className="font-mono text-gray-300 font-bold">{Math.round((item.value / total) * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Narrate History Entry for Audit Trail
function narrateHistoryEntry(entry: HistoryEntry, eventDomain: string | null) {
  const domainName = eventDomain ? (eventDomain === 'customer_care' ? 'Customer Care' : eventDomain === 'social' ? 'Social Media' : eventDomain === 'finance' ? 'Finance' : 'General') : 'General';
  
  if (entry.new_status === "created") {
    return {
      title: "Incident Received",
      actor: "Ingestion Gateway",
      dotColor: "blue"
    };
  }

  if (entry.old_status === "pending" || entry.old_status === "") {
    return {
      title: `Routed to ${domainName} Queue`,
      actor: "Router Classifier AI",
      dotColor: "amber"
    };
  }

  if (entry.new_status === "pending_approval" || entry.new_status === "ready_to_send") {
    return {
      title: "Agent Response Draft Generated",
      actor: `${domainName} Agent`,
      dotColor: "emerald"
    };
  }

  if (entry.new_status === "flagged") {
    return {
      title: eventDomain === "finance" ? "Fraud Warning Triggered" : "Anomaly Flagged",
      actor: "Risk Guard Agent",
      dotColor: "red"
    };
  }

  if (entry.new_status === "approved") {
    return {
      title: "Approved",
      actor: "Human Reviewer",
      dotColor: "green"
    };
  }

  if (entry.new_status === "rejected") {
    return {
      title: "Rejected",
      actor: "Human Reviewer",
      dotColor: "rose"
    };
  }

  if (entry.new_status === "needs_manual_routing") {
    return {
      title: "Flagged for Manual Routing",
      actor: "Fallback Handler",
      dotColor: "slate"
    };
  }

  return {
    title: `Status set to ${entry.new_status.replace(/_/g, " ")}`,
    actor: "System",
    dotColor: "slate"
  };
}

// Reusable Audit Trail History Component
function AuditTrailHistory({ 
  event, 
  rawHistory 
}: { 
  event: Event; 
  rawHistory: HistoryEntry[];
}) {
  const [isOpen, setIsOpen] = useState(true);

  let timelineEntries = [...rawHistory];
  timelineEntries.sort((a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime());

  const hasCreation = timelineEntries.some(e => e.old_status === "" || e.old_status === null || e.new_status === "created");
  if (!hasCreation) {
    timelineEntries.unshift({
      old_status: "",
      new_status: "created",
      changed_at: event.created_at
    });
  }

  const dotColorClasses: Record<string, { dot: string; glow: string; text: string }> = {
    blue: { dot: "bg-blue-500", glow: "shadow-[0_0_8px_rgba(59,130,246,0.5)]", text: "text-blue-400" },
    amber: { dot: "bg-amber-500", glow: "shadow-[0_0_8px_rgba(245,158,11,0.5)]", text: "text-amber-400" },
    teal: { dot: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-400" },
    emerald: { dot: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-400" },
    red: { dot: "bg-red-500", glow: "shadow-[0_0_8px_rgba(239,68,68,0.55)]", text: "text-red-400" },
    green: { dot: "bg-emerald-500", glow: "shadow-[0_0_8px_rgba(16,185,129,0.5)]", text: "text-emerald-400" },
    rose: { dot: "bg-rose-500", glow: "shadow-[0_0_8px_rgba(244,63,94,0.5)]", text: "text-rose-400" },
    slate: { dot: "bg-slate-500", glow: "shadow-[0_0_8px_rgba(100,116,139,0.4)]", text: "text-slate-400" }
  };

  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-xl mt-4">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/[0.01] transition-colors border-b border-white/5 text-left cursor-pointer"
      >
        <span className="text-[10px] uppercase tracking-widest font-black text-gray-400">
          AUDIT TRAIL HISTORY
        </span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="text-gray-500 hover:text-white transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 150, damping: 18 }}
            className="overflow-hidden"
          >
            <div className="p-5 pl-7 pr-6 relative space-y-6">
              {timelineEntries.map((entry, index) => {
                const narration = narrateHistoryEntry(entry, event.domain);
                const colors = dotColorClasses[narration.dotColor] || dotColorClasses.slate;
                const formattedTime = new Date(entry.changed_at).toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                });

                return (
                  <div key={index} className="relative flex gap-4 items-start">
                    {index < timelineEntries.length - 1 && (
                      <div className="absolute left-[5.5px] top-[14px] bottom-[-24px] w-[1px] bg-white/10" />
                    )}

                    <div className="relative mt-1.5 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${colors.dot} ${colors.glow} border border-gray-950`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h5 className="text-xs font-bold text-white leading-tight">
                        {narration.title}
                      </h5>
                      <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        by <span className="text-gray-400 font-bold">{narration.actor}</span>
                      </p>
                      <p className="text-[9px] text-gray-600 font-mono mt-1 tracking-wider uppercase">
                        {formattedTime}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Fire Button Component with custom rising flame particles on hover
function FireButton({ 
  disabled, 
  isLoading, 
  step, 
  children 
}: { 
  disabled: boolean; 
  isLoading: boolean; 
  step: string | null; 
  children: React.ReactNode; 
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
  }, []);

  const flames = Array.from({ length: 16 }).map((_, i) => {
    const left = `${Math.random() * 90 + 5}%`;
    const delay = `${Math.random() * 1.5}s`;
    const duration = `${0.6 + Math.random() * 0.8}s`;
    const size = `${Math.random() * 12 + 6}px`;
    const colors = [
      'rgba(249, 115, 22, 0.65)',
      'rgba(239, 68, 68, 0.65)',
      'rgba(245, 158, 11, 0.7)',
      'rgba(253, 224, 71, 0.75)',
    ];
    const color = colors[i % colors.length];
    return { id: i, left, delay, duration, size, color };
  });

  return (
    <motion.button
      type="submit"
      disabled={disabled}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      className="relative w-full py-3.5 rounded-full font-black uppercase tracking-wider text-xs text-white bg-gradient-to-r from-amber-500 via-rose-500 to-pink-500 shadow-[0_12px_32px_rgba(245,158,11,0.4)] hover:shadow-[0_16px_48px_rgba(239,68,68,0.55)] transition-all disabled:opacity-50 cursor-pointer overflow-hidden group select-none"
    >
      <style>{`
        @keyframes fire-rise {
          0% {
            transform: translateY(18px) scale(1);
            filter: blur(1px);
          }
          50% {
            transform: translateY(0px) scale(1.2);
            filter: blur(2px);
          }
          100% {
            transform: translateY(-24px) scale(0);
            filter: blur(4px);
          }
        }
      `}</style>

      {!prefersReducedMotion && (
        <div className="absolute inset-0 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end">
          <div className="absolute inset-0 bg-gradient-to-t from-amber-600/40 via-red-600/20 to-transparent" />
          {flames.map((f) => (
            <div
              key={f.id}
              className="absolute rounded-full"
              style={{
                left: f.left,
                width: f.size,
                height: f.size,
                backgroundColor: f.color,
                boxShadow: `0 0 8px ${f.color}`,
                animation: `fire-rise ${f.duration} linear infinite`,
                animationDelay: f.delay,
                bottom: '0px',
              }}
            />
          ))}
        </div>
      )}

      <span className="relative z-10 drop-shadow-md">
        {children}
      </span>
    </motion.button>
  );
}

// Runway Button Component (Used for Header "+ New Event")
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

  return (
    <motion.button
      whileHover="hover"
      initial="initial"
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`relative px-8 py-2.5 bg-gradient-to-r from-violet-600 to-blue-500 text-white font-extrabold uppercase tracking-wider text-xs rounded-full shadow-[0_12px_32px_rgba(139,92,246,0.35)] hover:shadow-[0_16px_48px_rgba(139,92,246,0.55)] transition-all cursor-pointer overflow-hidden group select-none ${className}`}
    >
      <style>{`
        @keyframes runway-move {
          0% { transform: translateX(0); }
          100% { transform: translateX(-20px); }
        }
      `}</style>

      {!prefersReducedMotion && (
        <div className="absolute inset-0 bg-slate-900 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center overflow-hidden pointer-events-none">
          <div className="absolute inset-x-0 top-1.5 h-[1px] bg-slate-700/50" />
          <div className="absolute inset-x-0 bottom-1.5 h-[1px] bg-slate-700/50" />
          <div 
            className="w-[200%] h-[2px] absolute top-1/2 -translate-y-1/2"
            style={{
              backgroundImage: 'repeating-linear-gradient(90deg, #eab308, #eab308 10px, transparent 10px, transparent 20px)',
              animation: 'runway-move 0.6s linear infinite'
            }}
          />
        </div>
      )}

      <span className="relative z-10 block transition-transform duration-300 group-hover:translate-x-3 text-center">
        {children}
      </span>

      {!prefersReducedMotion && (
        <motion.div
          variants={planeVariants}
          className="absolute z-20 top-1/2 -translate-y-1/2 left-0 pointer-events-none text-white"
          style={{ originY: "50%" }}
        >
          <PlaneIcon className="w-3.5 h-3.5 transform rotate-45" />
        </motion.div>
      )}
    </motion.button>
  );
}

// Simulate Modal Wrapper
function SimulateModal({ 
  isOpen, 
  onClose, 
  onProcessed 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onProcessed: () => void; 
}) {
  const [content, setContent] = useState("");
  const [source, setSource] = useState("email");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      toast.error("Please enter content");
      return;
    }

    setIsLoading(true);
    setStep("Creating event...");

    try {
      const createRes = await fetch(`${API_BASE}/api/events/simulate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ source, raw_content: content }),
      });

      if (!createRes.ok) throw new Error("Failed to create event");
      const newEvent = await createRes.json();

      setStep("Processing...");

      const eventId = newEvent.event?.id || newEvent.id;
      const processRes = await fetch(`${API_BASE}/api/process/${eventId}`, {
        method: "POST",
      });

      if (!processRes.ok) throw new Error("Failed to process event");

      setStep("Done!");
      toast.success("Event processed successfully!");
      setContent("");
      setSource("email");
      setStep(null);
      onProcessed();
      onClose();
    } catch (error) {
      toast.error("Error processing event");
      console.error(error);
      setStep(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          <motion.form
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            onSubmit={handleSubmit}
            className="bg-gray-905 bg-slate-900/95 border border-white/10 rounded-[28px] p-6 w-full max-w-lg shadow-2xl relative z-10"
          >
            <button 
              type="button" 
              onClick={onClose} 
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              ✕
            </button>
            <h3 className="text-base uppercase tracking-widest font-black text-white mb-4">Simulate New Event</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                  Source Channel
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  disabled={isLoading}
                  className="w-full bg-gray-950 border border-white/10 rounded-[18px] px-4 py-2.5 text-white disabled:opacity-50 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="email">Email Inbox</option>
                  <option value="twitter">Twitter / X Mention</option>
                  <option value="transaction_csv">Transaction (CSV upload)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                  Raw Payload Content
                </label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={isLoading}
                  placeholder="e.g. refund wireless earbuds order, or complaint about dead battery..."
                  className="w-full bg-gray-950 border border-white/10 rounded-[18px] px-4 py-3 text-white font-mono text-sm disabled:opacity-50 h-28 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                />
              </div>

              <div className="pt-2">
                <FireButton disabled={isLoading} isLoading={isLoading} step={step}>
                  {isLoading ? step || "Processing..." : "Fire it off"}
                </FireButton>
              </div>
            </div>
          </motion.form>
        </div>
      )}
    </AnimatePresence>
  );
}

// Main Dashboard Component
export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [events, setEvents] = useState<Event[]>([]);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Layout State
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSimulateOpen, setIsSimulateOpen] = useState(false);

  // Filters State
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [filterSearch, setFilterSearch] = useState("");
  const [filterDatePreset, setFilterDatePreset] = useState<"today" | "week" | "all">("all");
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);

  // Detailed Card State
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<number, HistoryEntry[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Set<number>>(new Set());
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const domains = [
    { id: "customer_care", name: "Customer Care", icon: Mail, colorClass: DOMAIN_COLORS.customer_care.colorClass, hoverClass: DOMAIN_COLORS.customer_care.hoverClass, activeBorder: DOMAIN_COLORS.customer_care.activeBorder },
    { id: "social", name: "Social Media", icon: Megaphone, colorClass: DOMAIN_COLORS.social.colorClass, hoverClass: DOMAIN_COLORS.social.hoverClass, activeBorder: DOMAIN_COLORS.social.activeBorder },
    { id: "finance", name: "Finance Anomaly", icon: TrendingUp, colorClass: DOMAIN_COLORS.finance.colorClass, hoverClass: DOMAIN_COLORS.finance.hoverClass, activeBorder: DOMAIN_COLORS.finance.activeBorder },
    { id: "management", name: "Management Brain", icon: Activity, colorClass: DOMAIN_COLORS.management.colorClass, hoverClass: DOMAIN_COLORS.management.hoverClass, activeBorder: DOMAIN_COLORS.management.activeBorder },
    { id: "general", name: "General Ops", icon: Settings, colorClass: DOMAIN_COLORS.general.colorClass, hoverClass: DOMAIN_COLORS.general.hoverClass, activeBorder: DOMAIN_COLORS.general.activeBorder },
  ];

  const domainBorderHex: Record<string, string> = {
    customer_care: DOMAIN_COLORS.customer_care.str,
    social: DOMAIN_COLORS.social.str,
    finance: DOMAIN_COLORS.finance.str,
    management: DOMAIN_COLORS.management.str,
    general: DOMAIN_COLORS.general.str,
  };

  const domainGradients: Record<string, string> = {
    customer_care: DOMAIN_COLORS.customer_care.gradient,
    social: DOMAIN_COLORS.social.gradient,
    finance: DOMAIN_COLORS.finance.gradient,
    management: DOMAIN_COLORS.management.gradient,
    general: DOMAIN_COLORS.general.gradient,
  };

  const statusIcons: Record<string, string> = {
    approved: "✅",
    rejected: "❌",
    pending: "⚠️",
    pending_approval: "⚠️",
    ready_to_send: "📦",
    flagged: "🚨",
    resolved: "✔️",
  };

  const statusColors: Record<string, string> = {
    approved: "bg-emerald-500/10 border-emerald-500/25 text-emerald-400",
    rejected: "bg-rose-500/10 border-rose-500/25 text-rose-400",
    pending: "bg-amber-500/10 border-amber-500/25 text-amber-400",
    pending_approval: "bg-amber-500/10 border-amber-500/25 text-amber-400",
    ready_to_send: "bg-blue-500/10 border-blue-500/25 text-blue-400",
    flagged: "bg-rose-500/10 border-rose-500/25 text-rose-400 font-extrabold animate-pulse",
    resolved: "bg-teal-500/10 border-teal-500/25 text-teal-400",
  };

  const statusBoxConfig: Record<string, { label: string; icon: string; border: string; text: string; bg: string; activeBg: string; activeBorder: string }> = {
    pending: {
      label: "Pending",
      icon: "⚠️",
      border: "border-amber-500/20",
      text: "text-amber-400",
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
      activeBg: "bg-amber-500/20",
      activeBorder: "border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
    },
    pending_approval: {
      label: "Pending Approval",
      icon: "⚠️",
      border: "border-amber-500/20",
      text: "text-amber-400",
      bg: "bg-amber-500/5 hover:bg-amber-500/10",
      activeBg: "bg-amber-500/20",
      activeBorder: "border-amber-500/60 shadow-[0_0_12px_rgba(245,158,11,0.2)]"
    },
    approved: {
      label: "Approved",
      icon: "✅",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
      activeBg: "bg-emerald-500/20",
      activeBorder: "border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
    },
    rejected: {
      label: "Rejected",
      icon: "❌",
      border: "border-rose-500/20",
      text: "text-rose-400",
      bg: "bg-rose-500/5 hover:bg-rose-500/10",
      activeBg: "bg-rose-500/20",
      activeBorder: "border-rose-500/60 shadow-[0_0_12px_rgba(244,63,94,0.2)]"
    },
    flagged: {
      label: "Flagged",
      icon: "🚨",
      border: "border-orange-500/20",
      text: "text-orange-400",
      bg: "bg-orange-500/5 hover:bg-orange-500/10",
      activeBg: "bg-orange-500/20",
      activeBorder: "border-orange-500/60 shadow-[0_0_12px_rgba(249,115,22,0.2)]"
    },
    ready_to_send: {
      label: "Ready to Send",
      icon: "📦",
      border: "border-emerald-500/20",
      text: "text-emerald-400",
      bg: "bg-emerald-500/5 hover:bg-emerald-500/10",
      activeBg: "bg-emerald-500/20",
      activeBorder: "border-emerald-500/60 shadow-[0_0_12px_rgba(16,185,129,0.2)]"
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    // Fetch digest independently in the background (does not block events)
    fetch(`${API_BASE}/api/agents/digest`)
      .then(async (res) => {
        if (res.ok) {
          const digestData = await res.json();
          setDigest(digestData.digest || digestData);
        }
      })
      .catch((err) => {
        console.error("Error fetching digest:", err);
      });

    // Fetch events and manage loading state
    try {
      const res = await fetch(`${API_BASE}/api/events`);
      if (res.ok) {
        const eventsData = await res.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      } else {
        throw new Error("Failed to load events");
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
      const errorMsg = "Failed to load data from backend";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = async (eventId: number) => {
    if (history[eventId]) return;
    setLoadingHistory((prev) => new Set(prev).add(eventId));
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistory((prev) => ({ ...prev, [eventId]: data }));
      }
    } catch (error) {
      console.error("Failed to fetch history:", error);
    } finally {
      setLoadingHistory((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
    }
  };

  const handleApprove = async (eventId: number, newStatus: string) => {
    setApprovingId(eventId);
    try {
      const res = await fetch(`${API_BASE}/api/events/${eventId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(`Event marked as ${newStatus}`);
        fetchData();
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
      console.error(error);
    } finally {
      setApprovingId(null);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter Computation
  const filteredEvents = events.filter((e) => {
    // 1. Sidebar Domain filter — null-domain (unrouted) events count as 'general'
    if (filterDomain) {
      const eventDomain = e.domain || "general";
      if (eventDomain !== filterDomain) return false;
    }
    
    // 2. Dropdown Status filter
    if (filterStatus && e.status !== filterStatus) return false;

    // 3. Search text match
    if (filterSearch) {
      const term = filterSearch.toLowerCase();
      const contentMatch = e.raw_content.toLowerCase().includes(term);
      const responseMatch = e.agent_response ? e.agent_response.toLowerCase().includes(term) : false;
      if (!contentMatch && !responseMatch) return false;
    }

    // 4. Anomalies-only toggle
    if (filterAnomaliesOnly) {
      const isAnomaly = e.status === "flagged" || e.urgency === "high";
      if (!isAnomaly) return false;
    }

    // 5. Date Presets filter
    if (filterDatePreset !== "all") {
      const eventTime = new Date(e.created_at).getTime();
      const now = Date.now();
      if (filterDatePreset === "today") {
        const oneDay = 24 * 60 * 60 * 1000;
        if (now - eventTime > oneDay) return false;
      } else if (filterDatePreset === "week") {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        if (now - eventTime > oneWeek) return false;
      }
    }

    return true;
  });

  // KPI events: respects domain filter only (not status/search) so top cards match the sidebar
  // null-domain (unrouted) events count under 'general'
  const kpiEvents = filterDomain
    ? events.filter(e =>
        filterDomain === "general"
          ? (e.domain === "general" || e.domain === null)
          : e.domain === filterDomain
      )
    : events;

  // KPI Sparklines Generation
  const getSparklineBins = (filterFn?: (e: Event) => boolean) => {
    const list = filterFn ? kpiEvents.filter(filterFn) : kpiEvents;
    const bins = Array(7).fill(0);
    list.forEach(e => {
      const day = new Date(e.created_at).getDay();
      bins[day] = (bins[day] || 0) + 1;
    });
    return bins;
  };

  // CSV Export Generator
  const handleExportCSV = () => {
    if (filteredEvents.length === 0) {
      toast.error("No data to export");
      return;
    }

    const headers = ["ID", "Domain", "Status", "Urgency", "Raw Content", "Agent Response", "Created At"];
    const rows = filteredEvents.map(e => [
      e.id,
      e.domain || "general",
      e.status,
      e.urgency || "low",
      `"${e.raw_content.replace(/"/g, '""')}"`,
      e.agent_response ? `"${e.agent_response.replace(/"/g, '""')}"` : "",
      e.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `events_export_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  return (
    <div className="bg-gray-950 text-white min-h-screen flex flex-col relative overflow-hidden">
      {/* Film grain noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      {/* 1. Header (Top Bar) */}
      <header className="h-16 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl px-6 flex items-center justify-between z-40 relative">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 shadow-md">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-black text-sm uppercase tracking-tight text-white hidden sm:inline">
            Unified Business Ops Copilot
          </span>
        </div>

        {/* Center: Search Box */}
        <div className="flex-1 max-w-md mx-6 relative">
          <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search events payload or actions..."
            value={filterSearch}
            onChange={(e) => setFilterSearch(e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-full pl-9 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition-colors"
          />
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-4">
          <RunwayButton 
            onClick={() => setIsSimulateOpen(true)}
            className="px-6 py-2 shadow-none hover:shadow-none font-bold text-[10px] tracking-widest"
          >
            <div className="flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" />
              <span>New Event</span>
            </div>
          </RunwayButton>

          <div className="h-4 w-px bg-white/10" />

          {/* Decorative icons */}
          <button className="p-1.5 text-gray-400 hover:text-white transition-colors relative">
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
          </button>

          <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>

          <button 
            onClick={() => setLocation("/")}
            title="Log out back to landing" 
            className="flex items-center justify-center w-8 h-8 rounded-full border border-white/10 bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* 2. Sidebar (Left Navigation) */}
        <aside 
          className={`flex flex-col border-r border-white/5 bg-gray-900/10 backdrop-blur-xl transition-all duration-300 ${
            isSidebarCollapsed ? "w-16" : "w-64"
          }`}
        >
          <div className="flex-1 py-4 space-y-1 px-3 overflow-y-auto">
            {/* All option */}
            <button
              onClick={() => setFilterDomain(null)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                filterDomain === null 
                  ? "bg-white/10 text-white border border-white/10" 
                  : "text-gray-400 hover:text-white border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3">
                <Activity className="w-4 h-4 text-indigo-400" />
                {!isSidebarCollapsed && <span>All Domains</span>}
              </div>
              {!isSidebarCollapsed && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-gray-800 text-gray-500">
                  {events.length}
                </span>
              )}
            </button>

            {domains.map((dom) => {
              const isSelected = filterDomain === dom.id;
              // null-domain (unrouted) events are counted under 'general'
              const count = events.filter(e =>
                dom.id === "general"
                  ? (e.domain === "general" || e.domain === null)
                  : e.domain === dom.id
              ).length;
              const IconComponent = dom.icon;
              return (
                <button
                  key={dom.id}
                  onClick={() => setFilterDomain(isSelected ? null : dom.id)}
                  title={isSidebarCollapsed ? dom.name : undefined}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-bold border transition-all ${
                    isSelected 
                      ? `${dom.colorClass} ${dom.activeBorder}` 
                      : `text-gray-400 border-transparent ${dom.hoverClass}`
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <IconComponent className="w-4 h-4" />
                    {!isSidebarCollapsed && <span>{dom.name}</span>}
                  </div>
                  {!isSidebarCollapsed && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isSelected ? "bg-white/10 text-white" : "bg-gray-800 text-gray-500"
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Toggle Button */}
          <div className="p-3 border-t border-white/5">
            <button
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="w-full flex items-center justify-center p-2 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition-all"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </aside>

        {/* 3. Main Content Viewport */}
        <main className="flex-1 overflow-y-auto bg-gray-950 p-6 space-y-6">
          {/* Top Section (KPI Digest Overview) — derived from live events, not stale digest cache */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-white/15 transition-all">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Total Events</p>
                <span className="text-3xl font-black bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                  <AnimatedNumber value={kpiEvents.length} />
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Sparkline data={getSparklineBins()} />
                <span className="text-[9px] text-gray-500">7-day active trend</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-white/15 transition-all">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Anomalies Flagged</p>
                <span className="text-3xl font-black bg-gradient-to-r from-rose-400 to-orange-400 bg-clip-text text-transparent">
                  <AnimatedNumber value={kpiEvents.filter(e => e.status === 'flagged').length} />
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Sparkline data={getSparklineBins(e => e.status === 'flagged')} />
                <span className="text-[9px] text-gray-500">flagged incidents</span>
              </div>
            </div>

            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-xl flex items-center justify-between relative overflow-hidden group hover:border-white/15 transition-all">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-500 font-bold mb-1">Pending Approvals</p>
                <span className="text-3xl font-black bg-gradient-to-r from-amber-400 to-rose-400 bg-clip-text text-transparent">
                  <AnimatedNumber value={kpiEvents.filter(e => e.status === 'pending_approval' || e.status === 'ready_to_send').length} />
                </span>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Sparkline data={getSparklineBins(e => e.status === 'pending_approval' || e.status === 'ready_to_send')} />
                <span className="text-[9px] text-gray-500">needs review</span>
              </div>
            </div>
          </div>

          {/* 4. Audit Alerts Banner */}
          {digest && digest.cross_domain_patterns && digest.cross_domain_patterns.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-amber-500/10 border border-amber-500/20 text-amber-300 p-4 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg"
            >
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-white">Cross-Domain Audit Alert</h5>
                  <p className="text-xs text-amber-200/80 font-medium mt-0.5">{digest.cross_domain_patterns[0].reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {digest.cross_domain_patterns[0].related_event_ids.map(id => (
                  <span key={id} className="px-2 py-0.5 bg-amber-500/25 border border-amber-500/30 rounded-full text-[9px] font-bold text-white">
                    #{id}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Split Content Column Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Event List Column (Left/Center) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500">
                  Event Stream ({filteredEvents.length})
                </h4>

                {/* CSV/PDF Export Options */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>

                  <div className="group relative">
                    <button
                      disabled
                      className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-500 border border-white/5 px-3 py-1.5 rounded-full bg-white/[0.02] cursor-not-allowed"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      <span>PDF</span>
                    </button>
                    <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block bg-gray-900 border border-white/10 text-white text-[9px] px-2.5 py-1 rounded-lg shadow-xl pointer-events-none whitespace-nowrap z-30">
                      Coming soon
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Breakdown Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-2">
                {Object.entries(statusBoxConfig).map(([statusId, config]) => {
                  const isSelected = filterStatus === statusId;
                  const count = events.filter(e => {
                    if (filterDomain && e.domain !== filterDomain) return false;
                    return e.status === statusId;
                  }).length;

                  return (
                    <motion.button
                      key={statusId}
                      whileHover={{ scale: 1.02, y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setFilterStatus(isSelected ? null : statusId)}
                      className={`relative overflow-hidden text-left p-3 rounded-2xl border transition-all duration-300 backdrop-blur-xl cursor-pointer flex flex-col justify-between h-20 ${
                        isSelected 
                          ? `${config.activeBg} ${config.activeBorder}` 
                          : `bg-white/[0.02] border-white/5 hover:border-white/15`
                      }`}
                    >
                      <div className="flex justify-between items-start w-full">
                        <span className="text-[9px] text-gray-500 font-black uppercase tracking-wider truncate mr-1">
                          {config.label}
                        </span>
                        <span className="text-xs">{config.icon}</span>
                      </div>
                      <div className="flex items-baseline gap-1 mt-2">
                        <span className={`text-xl font-black ${config.text}`}>
                          <AnimatedNumber value={count} />
                        </span>
                        <span className="text-[7px] text-gray-600 font-black uppercase">events</span>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Event Cards List */}
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {filteredEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      layout
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white/[0.02] border border-white/5 rounded-3xl overflow-hidden shadow-xl hover:border-white/10 transition-colors"
                    >
                      <button
                        onClick={() => {
                          setExpandedId(expandedId === event.id ? null : event.id);
                          if (expandedId !== event.id) {
                            fetchHistory(event.id);
                          }
                        }}
                        className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.01] transition-colors border-l-4 text-left cursor-pointer"
                        style={{
                          borderLeftColor: domainBorderHex[event.domain || "general"],
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-mono text-gray-500 font-bold">
                              #{event.id}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold bg-gradient-to-r ${domainGradients[event.domain || "general"]} bg-clip-text text-transparent`}
                            >
                              {event.domain || "general"}
                            </span>
                            {event.urgency && (
                              <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold ${
                                event.urgency === 'high' ? 'bg-red-500/20 text-red-300' :
                                event.urgency === 'medium' ? 'bg-amber-500/20 text-amber-300' : 'bg-green-500/20 text-green-300'
                              }`}>
                                {event.urgency}
                              </span>
                            )}
                            
                            {/* Pill status color */}
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold border ${statusColors[event.status] || "bg-white/5 text-gray-300 border-white/5"} flex items-center gap-1`}>
                              <span>{statusIcons[event.status] || "🔹"}</span>
                              <span>{event.status.replace(/_/g, " ")}</span>
                            </span>
                          </div>
                          <p className="text-sm text-gray-300 font-light truncate max-w-2xl">
                            {event.raw_content}
                          </p>
                        </div>
                        {expandedId === event.id ? (
                          <ChevronUp className="w-4 h-4 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-500" />
                        )}
                      </button>

                      {/* Detail Expander */}
                      <AnimatePresence>
                        {expandedId === event.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-white/[0.01] px-5 pb-5 border-t border-white/5 space-y-4 pt-4"
                          >
                            <div>
                              <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                                Raw Content Payload
                              </h4>
                              <p className="text-sm text-gray-300 bg-gray-950 p-4 rounded-2xl border border-white/5 font-mono leading-relaxed">
                                {event.raw_content}
                              </p>
                            </div>

                            {event.agent_response && (
                              <div>
                                <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                                  Copilot Response Actions
                                </h4>
                                <p className="text-sm text-gray-300 bg-gray-950 p-4 rounded-2xl border border-white/5 font-mono leading-relaxed">
                                  {event.agent_response}
                                </p>
                              </div>
                            )}

                            {/* Human-in-the-Loop approval panel — shown for both pending_approval and ready_to_send */}
                            {(event.status === "pending_approval" || event.status === "ready_to_send") && (
                              <div className="border border-amber-500/20 bg-amber-500/5 rounded-2xl p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] uppercase tracking-widest font-black text-amber-400">🧑‍💼 Human Review Required</span>
                                  {event.status === "ready_to_send" && (
                                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 font-bold">High-confidence draft — review before sending</span>
                                  )}
                                </div>
                                <div className="flex gap-3">
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApprove(event.id, "approved")}
                                    disabled={approvingId === event.id}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-2.5 rounded-full font-bold shadow-[0_12px_32px_rgba(16,185,129,0.4)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 cursor-pointer text-xs"
                                  >
                                    <Check className="w-4 h-4" />
                                    Approve & Send
                                  </motion.button>
                                  <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => handleApprove(event.id, "rejected")}
                                    disabled={approvingId === event.id}
                                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white py-2.5 rounded-full font-bold shadow-[0_12px_32px_rgba(244,63,94,0.4)] hover:shadow-[0_16px_40px_rgba(244,63,94,0.5)] transition-all disabled:opacity-50 cursor-pointer text-xs"
                                  >
                                    <X className="w-4 h-4" />
                                    Reject
                                  </motion.button>
                                </div>
                              </div>
                            )}

                            {/* Status Timeline history (Audit Trail) */}
                            {history[event.id] && history[event.id].length > 0 && (
                              <AuditTrailHistory event={event} rawHistory={history[event.id]} />
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {filteredEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500 font-medium">
                  All clear — no events match these filters.
                </div>
              )}
            </div>

            {/* Filter Side Panel (Right) */}
            <div className="space-y-6">
              {/* Filter controls */}
              <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500">Filter Controls</h4>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-2">Status</label>
                  <select
                    value={filterStatus || ""}
                    onChange={(e) => setFilterStatus(e.target.value || null)}
                    className="w-full bg-gray-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="pending_approval">Pending Approval</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="flagged">Flagged</option>
                    <option value="ready_to_send">Ready to Send</option>
                  </select>
                </div>

                {/* Domain Filter */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-2">Domain</label>
                  <select
                    value={filterDomain || ""}
                    onChange={(e) => setFilterDomain(e.target.value || null)}
                    className="w-full bg-gray-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="">All Domains</option>
                    <option value="customer_care">Customer Care</option>
                    <option value="social">Social Media</option>
                    <option value="finance">Finance Anomaly</option>
                    <option value="general">General Ops</option>
                  </select>
                </div>

                {/* Date presets */}
                <div>
                  <label className="block text-[9px] uppercase tracking-wider font-bold text-gray-500 mb-2">Date Range</label>
                  <select
                    value={filterDatePreset}
                    onChange={(e) => setFilterDatePreset(e.target.value as any)}
                    className="w-full bg-gray-900 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/50"
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">This Week</option>
                  </select>
                </div>

                {/* Toggle anomalies */}
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-xs font-bold text-gray-300">Show Anomalies Only</span>
                  <button
                    onClick={() => setFilterAnomaliesOnly(!filterAnomaliesOnly)}
                    className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-300 ${
                      filterAnomaliesOnly ? "bg-rose-500" : "bg-gray-800"
                    }`}
                  >
                    <div 
                      className={`w-4 h-4 bg-white rounded-full transition-transform duration-300 ${
                        filterAnomaliesOnly ? "transform translate-x-5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Event Distribution by Domain */}
              {digest && (
                <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-5 shadow-xl space-y-4">
                  <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500">Distribution by Domain</h4>
                  <DistributionDonut stats={digest.stats.by_domain} />
                </div>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Simulate Modal */}
      <SimulateModal 
        isOpen={isSimulateOpen} 
        onClose={() => setIsSimulateOpen(false)} 
        onProcessed={fetchData} 
      />
    </div>
  );
}
