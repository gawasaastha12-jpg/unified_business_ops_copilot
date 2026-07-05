import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, animate } from "framer-motion";
import { RefreshCw, ChevronDown, ChevronUp, Check, X, ArrowLeft, Mail, Megaphone, TrendingUp, Settings } from "lucide-react";
import { toast } from "sonner";

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

// Command Bar
function CommandBar({ 
  onRefresh, 
  isLoading, 
  onBackToLanding 
}: { 
  onRefresh: () => void; 
  isLoading: boolean;
  onBackToLanding: () => void;
}) {
  const [isHealthy, setIsHealthy] = useState(true);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/events`);
        setIsHealthy(res.ok);
      } catch {
        setIsHealthy(false);
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBackToLanding}
          className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-gray-400 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Landing
        </motion.button>
        <div className="h-4 w-px bg-white/10" />
        <h1 className="text-lg font-black tracking-tight text-white uppercase">Ops Copilot</h1>
        <div className="flex items-center gap-2 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
          <div className={`w-2 h-2 rounded-full ${isHealthy ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
            {isHealthy ? "All systems go" : "Houston, we have a problem"}
          </span>
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onRefresh}
        disabled={isLoading}
        title="Give it a nudge"
        className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[18px] transition-all disabled:opacity-50 cursor-pointer"
      >
        <RefreshCw className={`w-4 h-4 text-white ${isLoading ? "animate-spin" : ""}`} />
      </motion.button>
    </div>
  );
}

// Stats Bar
function StatsBar({ stats }: { stats: DigestResponse["stats"] }) {
  const kpis = [
    { label: "Total Events", value: stats.total_events, color: "from-sky-400 to-cyan-300" },
    {
      label: "Pending Approval",
      value: stats.by_status.pending_approval || 0,
      color: "from-amber-400 to-rose-400"
    },
    {
      label: "Flagged Anomalies",
      value: stats.by_status.flagged || 0,
      color: "from-rose-400 to-orange-400"
    },
    {
      label: "Ready / Resolved",
      value: (stats.by_status.ready_to_send || 0) + (stats.by_status.resolved || 0),
      color: "from-emerald-400 to-lime-300"
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 px-6 py-8 bg-gray-950 relative overflow-hidden">
      {/* Background glow blobs */}
      <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-blue-500/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-purple-500/5 blur-[120px] rounded-full pointer-events-none" />

      {kpis.map((kpi, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 15, delay: i * 0.1 }}
          whileHover={{ y: -4, scale: 1.01 }}
          className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-6 shadow-2xl relative overflow-hidden group hover:border-white/20 transition-all duration-300"
        >
          {/* subtle radial highlight */}
          <div className="absolute inset-0 bg-radial from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          
          <span className={`text-7xl md:text-8xl font-black bg-gradient-to-r ${kpi.color} bg-clip-text text-transparent tracking-tighter block`}>
            <AnimatedNumber value={kpi.value} />
          </span>
          <p className="text-[10px] uppercase tracking-[0.25em] text-gray-500 font-bold mt-2 text-left">{kpi.label}</p>
        </motion.div>
      ))}
    </div>
  );
}

// Management Digest
function DigestPanel({ digest }: { digest: DigestResponse }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/[0.03] backdrop-blur-xl border border-blue-500/20 rounded-[28px] p-6 mb-8 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute -left-20 -bottom-20 w-80 h-80 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      <h3 className="text-xs uppercase tracking-widest font-black text-blue-400 mb-3">Management Digest</h3>
      <p className="text-xl font-medium text-gray-200 mb-6 leading-relaxed max-w-4xl">{digest.digest_paragraph}</p>

      {digest.cross_domain_patterns.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Cross-Domain Patterns</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {digest.cross_domain_patterns.map((pattern, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-white/[0.02] border border-purple-500/20 rounded-3xl p-4 shadow-xl border-l-4 border-l-purple-500"
              >
                <p className="text-sm font-medium text-gray-300 mb-3">{pattern.reason}</p>
                <div className="flex gap-2 flex-wrap">
                  {pattern.related_event_ids.map((id) => (
                    <span
                      key={id}
                      className="px-2.5 py-1 bg-purple-500/10 text-purple-300 text-xs rounded-full border border-purple-500/20 font-semibold"
                    >
                      Event #{id}
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500 font-medium">All clear — nothing connecting the dots right now.</p>
      )}
    </motion.div>
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

  // Generate ~16 fire flame particles with staggered positions, delays, durations, and sizes
  const flames = Array.from({ length: 16 }).map((_, i) => {
    const left = `${Math.random() * 90 + 5}%`;
    const delay = `${Math.random() * 1.5}s`;
    const duration = `${0.6 + Math.random() * 0.8}s`;
    const size = `${Math.random() * 12 + 6}px`;
    const colors = [
      'rgba(249, 115, 22, 0.65)', // orange
      'rgba(239, 68, 68, 0.65)',  // red
      'rgba(245, 158, 11, 0.7)',  // amber
      'rgba(253, 224, 71, 0.75)', // yellow
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

      {/* Roaring fire visual overlay on hover */}
      {!prefersReducedMotion && (
        <div className="absolute inset-0 bg-gray-950 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex items-end">
          {/* Base heat glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-amber-600/40 via-red-600/20 to-transparent" />
          
          {/* Flame particles rising up */}
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

      {/* Button content */}
      <span className="relative z-10 drop-shadow-md">
        {children}
      </span>
    </motion.button>
  );
}

// Simulate & Process Panel
function SimulatePanel({ onProcessed }: { onProcessed: () => void }) {
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
    } catch (error) {
      toast.error("Error processing event");
      console.error(error);
      setStep(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[28px] p-6 mb-8 shadow-2xl"
    >
      <h3 className="text-sm uppercase tracking-widest font-black text-white mb-4">Drop something in</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
            Source Channel
          </label>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            disabled={isLoading}
            className="w-full bg-gray-900 border border-white/10 rounded-[18px] px-4 py-2.5 text-white disabled:opacity-50 focus:outline-none focus:border-blue-500 transition-colors"
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
            className="w-full bg-gray-900 border border-white/10 rounded-[18px] px-4 py-3 text-white font-mono text-sm disabled:opacity-50 h-24 focus:outline-none focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        <FireButton disabled={isLoading} isLoading={isLoading} step={step}>
          {isLoading ? step || "Processing..." : "Fire it off"}
        </FireButton>
      </div>
    </motion.form>
  );
}

// Activity Feed (Restructured)
function ActivityFeed({ events, onRefresh }: { events: Event[]; onRefresh: () => void }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [history, setHistory] = useState<Record<number, HistoryEntry[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Set<number>>(new Set());
  const [filterDomain, setFilterDomain] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [approvingId, setApprovingId] = useState<number | null>(null);

  const domains = [
    { id: "customer_care", name: "Customer Care", icon: "📧", color: "customer_care" },
    { id: "social", name: "Social Media", icon: "📣", color: "social" },
    { id: "finance", name: "Finance Anomaly", icon: "💰", color: "finance" },
    { id: "general", name: "General Ops", icon: "⚙️", color: "general" },
  ];

  const domainColors: Record<string, string> = {
    customer_care: "bg-blue-500",
    social: "bg-violet-500",
    finance: "bg-emerald-500",
    general: "bg-slate-500",
  };

  const domainIcons: Record<string, React.ComponentType<{ className?: string }>> = {
    customer_care: Mail,
    social: Megaphone,
    finance: TrendingUp,
    general: Settings,
  };

  const domainColorConfig: Record<string, { bg: string; border: string; text: string; glow: string; gradient: string; shadow: string }> = {
    customer_care: {
      bg: "bg-blue-500/8 hover:bg-blue-500/15",
      border: "border-blue-500/30",
      text: "text-blue-300",
      glow: "bg-blue-500/20",
      gradient: "from-blue-500 to-cyan-400",
      shadow: "shadow-blue-500/20",
    },
    social: {
      bg: "bg-violet-500/8 hover:bg-violet-500/15",
      border: "border-violet-500/30",
      text: "text-violet-300",
      glow: "bg-violet-500/20",
      gradient: "from-violet-500 to-pink-500",
      shadow: "shadow-violet-500/20",
    },
    finance: {
      bg: "bg-emerald-500/8 hover:bg-emerald-500/15",
      border: "border-emerald-500/30",
      text: "text-emerald-300",
      glow: "bg-emerald-500/20",
      gradient: "from-emerald-500 to-lime-400",
      shadow: "shadow-emerald-500/20",
    },
    general: {
      bg: "bg-slate-500/8 hover:bg-slate-500/15",
      border: "border-slate-500/30",
      text: "text-slate-400",
      glow: "bg-slate-500/20",
      gradient: "from-slate-500 to-gray-400",
      shadow: "shadow-slate-500/20",
    },
  };

  const domainBorderHex: Record<string, string> = {
    customer_care: "#3b82f6",
    social: "#8b5cf6",
    finance: "#10b981",
    general: "#64748b",
  };

  const urgencyColors: Record<string, string> = {
    low: "bg-green-500/20 text-green-300 border border-green-500/20",
    medium: "bg-yellow-500/20 text-yellow-300 border border-yellow-500/20",
    high: "bg-red-500/20 text-red-300 border border-red-500/20",
  };

  const statusTabs = [
    { id: null, name: "All" },
    { id: "pending", name: "Pending" },
    { id: "pending_approval", name: "Pending Approval" },
    { id: "approved", name: "Approved" },
    { id: "rejected", name: "Rejected" },
    { id: "flagged", name: "Flagged" },
    { id: "ready_to_send", name: "Ready to Send" },
  ];

  // Domain computation helpers
  const getDomainStats = (domainName: string) => {
    const domainEvents = events.filter((e) => e.domain === domainName);
    const count = domainEvents.length;

    const statusCounts: Record<string, number> = {};
    domainEvents.forEach((e) => {
      statusCounts[e.status] = (statusCounts[e.status] || 0) + 1;
    });

    const breakdownStr = Object.entries(statusCounts)
      .map(([status, val]) => {
        const formatted = status.replace(/_/g, " ");
        return `${val} ${formatted}`;
      })
      .join(" · ");

    return { count, breakdown: breakdownStr || "0 events" };
  };

  const getStatusCount = (statusId: string | null) => {
    let filtered = events;
    if (filterDomain) {
      filtered = filtered.filter((e) => e.domain === filterDomain);
    }
    if (statusId === null) {
      return filtered.length;
    }
    return filtered.filter((e) => e.status === statusId).length;
  };

  const filteredEvents = events.filter((e) => {
    if (filterDomain && e.domain !== filterDomain) return false;
    if (filterStatus && e.status !== filterStatus) return false;
    return true;
  });

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
        onRefresh();
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

  return (
    <div className="space-y-8">
      {/* 1. Domain Boxes (Top Level Grid) */}
      <div>
        <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500 mb-3">Filter by Domain</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {domains.map((dom) => {
            const stats = getDomainStats(dom.id);
            const isSelected = filterDomain === dom.id;
            const colors = domainColorConfig[dom.id];
            const IconComponent = domainIcons[dom.id] || Settings;
            
            return (
              <motion.button
                key={dom.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setFilterDomain(isSelected ? null : dom.id)}
                className={`relative overflow-hidden text-left p-5 rounded-[28px] border transition-all duration-300 ${
                  isSelected
                    ? `${colors.bg} ${colors.border} shadow-lg ${colors.shadow}`
                    : "bg-white/[0.03] border-white/10 hover:border-white/20"
                } backdrop-blur-xl cursor-pointer`}
              >
                {isSelected && (
                  <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${colors.glow} blur-2xl rounded-full`} />
                )}
                
                <div className="flex justify-between items-start mb-3">
                  <div className={`${
                    dom.id === 'customer_care' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                    dom.id === 'social' ? "bg-violet-500/10 border-violet-500/20 text-violet-400" :
                    dom.id === 'finance' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" :
                    "bg-slate-500/10 border-slate-500/20 text-slate-400"
                  } border rounded-full w-12 h-12 flex items-center justify-center`}>
                    <IconComponent className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${isSelected ? `${colors.bg} ${colors.text}` : "bg-white/5 text-gray-400"}`}>
                    <AnimatedNumber value={stats.count} /> events
                  </span>
                </div>
                
                <h5 className="font-extrabold text-white text-base mb-1">{dom.name}</h5>
                <p className="text-xs text-gray-400 leading-normal font-light truncate">
                  {stats.breakdown || "0 events"}
                </p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* 2. Status Tabs (Tactile Segmented Pill) */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500">Filter by Status</h4>
          {filterDomain && (
            <button 
              onClick={() => setFilterDomain(null)} 
              className="text-[10px] uppercase tracking-widest text-blue-400 hover:text-blue-300 font-bold"
            >
              Clear Domain Filter
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5 p-1.5 bg-white/[0.03] border border-white/10 rounded-[20px] backdrop-blur-xl max-w-fit">
          {statusTabs.map((tab) => {
            const count = getStatusCount(tab.id);
            const isSelected = filterStatus === tab.id;
            return (
              <button
                key={tab.id ?? "all"}
                onClick={() => setFilterStatus(tab.id)}
                className="relative px-4 py-2 rounded-[18px] text-xs font-bold transition-all duration-300 z-10 flex items-center gap-2 cursor-pointer"
                style={{
                  color: isSelected ? "#ffffff" : "#9ca3af",
                }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="active-status-pill"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-[18px] -z-10"
                  />
                )}
                <span>{tab.name}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSelected ? "bg-white/10 text-white" : "bg-gray-800 text-gray-500"
                }`}>
                  <AnimatedNumber value={count} />
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Event List */}
      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-500">
          Events ({filteredEvents.length})
        </h4>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {filteredEvents.map((event) => (
              <motion.div
                key={event.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white/[0.02] border border-white/5 rounded-[28px] overflow-hidden shadow-xl hover:border-white/10 transition-colors"
              >
                {/* Collapsed row header */}
                <button
                  onClick={() => {
                    setExpandedId(expandedId === event.id ? null : event.id);
                    if (expandedId !== event.id) {
                      fetchHistory(event.id);
                    }
                  }}
                  className="w-full px-5 py-4 flex items-center justify-between gap-4 hover:bg-white/[0.02] transition-colors border-l-4 text-left cursor-pointer"
                  style={{
                    borderLeftColor: domainBorderHex[event.domain || "general"],
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-500 font-semibold">
                        #{event.id}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-gradient-to-r ${domainColorConfig[event.domain || "general"].gradient} bg-clip-text text-transparent`}
                      >
                        {event.domain || "general"}
                      </span>
                      {event.urgency && (
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold ${
                            urgencyColors[event.urgency]
                          }`}
                        >
                          {event.urgency}
                        </span>
                      )}
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-extrabold bg-white/5 text-gray-300 border border-white/5">
                        {event.status.replace(/_/g, " ")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-300 font-light truncate max-w-2xl">
                      {event.raw_content}
                    </p>
                  </div>
                  {expandedId === event.id ? (
                    <ChevronUp className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                {/* Expanded view */}
                <AnimatePresence>
                  {expandedId === event.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="bg-white/[0.01] px-5 pb-5 border-t border-white/5 space-y-4 pt-4"
                    >
                      {/* Raw Content */}
                      <div>
                        <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                          Raw Content Payload
                        </h4>
                        <p className="text-sm text-gray-300 bg-gray-950/80 p-4 rounded-2xl border border-white/5 font-mono leading-relaxed">
                          {event.raw_content}
                        </p>
                      </div>

                      {/* Agent Response */}
                      {event.agent_response && (
                        <div>
                          <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-2">
                            Copilot Response Actions
                          </h4>
                          <p className="text-sm text-gray-300 bg-gray-950/80 p-4 rounded-2xl border border-white/5 font-mono leading-relaxed">
                            {event.agent_response}
                          </p>
                        </div>
                      )}

                      {/* Action buttons (Approve / Reject) */}
                      {event.status === "pending_approval" && (
                        <div className="flex gap-3">
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleApprove(event.id, "approved")}
                            disabled={approvingId === event.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-400 text-white py-2.5 rounded-full font-bold shadow-[0_12px_32px_rgba(16,185,129,0.4)] hover:shadow-[0_16px_40px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <Check className="w-4 h-4" />
                            Approve Actions
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.01 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleApprove(event.id, "rejected")}
                            disabled={approvingId === event.id}
                            className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-rose-500 to-orange-400 text-white py-2.5 rounded-full font-bold shadow-[0_12px_32px_rgba(244,63,94,0.4)] hover:shadow-[0_16px_40px_rgba(244,63,94,0.5)] transition-all disabled:opacity-50 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            Reject Actions
                          </motion.button>
                        </div>
                      )}

                      {/* Status History Timeline */}
                      {history[event.id] && history[event.id].length > 0 && (
                        <div className="pt-2 border-t border-white/5">
                          <h4 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3">
                            Status History Timeline
                          </h4>
                          <div className="space-y-3 pl-2">
                            {history[event.id].map((h, i) => (
                              <div key={i} className="flex items-center gap-3 text-xs text-gray-400">
                                <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-md shadow-sky-500/50" />
                                <span className="font-semibold text-gray-300">
                                  {h.old_status.replace(/_/g, " ")} → {h.new_status.replace(/_/g, " ")}
                                </span>
                                <span className="text-gray-500 font-mono text-[10px]">
                                  {new Date(h.changed_at).toLocaleString()}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {filteredEvents.length === 0 && (
        <div className="text-center py-12 text-gray-500 font-medium">
          All clear — no events match these filters.
        </div>
      )}
    </div>
  );
}

// Main Dashboard Component
export default function Dashboard({ onBackToLanding }: { onBackToLanding: () => void }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [eventsRes, digestRes] = await Promise.all([
        fetch(`${API_BASE}/api/events`),
        fetch(`${API_BASE}/api/agents/digest`),
      ]);

      if (eventsRes.ok) {
        const eventsData = await eventsRes.json();
        setEvents(Array.isArray(eventsData) ? eventsData : []);
      }

      if (digestRes.ok) {
        const digestData = await digestRes.json();
        setDigest(digestData.digest || digestData);
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

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="bg-gray-950 text-white min-h-screen relative">
      {/* Film grain noise overlay */}
      <div 
        className="fixed inset-0 pointer-events-none z-50 opacity-[0.03] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '128px 128px',
        }}
      />

      <CommandBar onRefresh={fetchData} isLoading={isLoading} onBackToLanding={onBackToLanding} />
      
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-950/40 border border-rose-500/30 text-rose-300 px-6 py-4 mx-6 mt-6 rounded-3xl flex items-center justify-between shadow-lg"
        >
          <span className="font-semibold text-sm">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-300 font-bold"
          >
            ✕
          </button>
        </motion.div>
      )}
      
      {digest && <StatsBar stats={digest.stats} />}
      
      {!digest && !error && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-500 gap-3 font-semibold">
          <div className="animate-spin text-2xl">⏳</div>
          <span>Warming up the engines...</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-6 py-8 relative">
        {digest && <DigestPanel digest={digest} />}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-1">
            <SimulatePanel onProcessed={fetchData} />
          </div>
          <div className="lg:col-span-2">
            <ActivityFeed events={events} onRefresh={fetchData} />
          </div>
        </div>
      </div>
    </div>
  );
}
