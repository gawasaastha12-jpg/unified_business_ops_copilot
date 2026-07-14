import { useState, useEffect } from "react";
import { Activity, ShieldAlert, Award, Zap, Compass } from "lucide-react";

interface BenchmarkData {
  accuracy_pct: number;
  total_audited: number;
  matches: number;
  naive_steps: number;
  pipeline_steps: number;
  speedup_factor: number;
  mismatch_details: string[];
}

export default function BenchmarkTab({ apiBase }: { apiBase: string }) {
  const [data, setData] = useState<BenchmarkData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBenchmark = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiBase}/api/benchmark`);
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Failed to load benchmark stats");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-gray-400">
        <Activity className="h-8 width-8 animate-spin mb-4 text-indigo-400" />
        <p className="text-sm font-medium">Analyzing database & computing audit metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-950/10 rounded-3xl text-center">
        <ShieldAlert className="h-10 w-10 text-red-400 mx-auto mb-4" />
        <h4 className="text-lg font-bold text-red-200 mb-2">Benchmark Failed</h4>
        <p className="text-sm text-red-400 mb-4">{error || "No data received"}</p>
        <button 
          onClick={fetchBenchmark}
          className="px-6 py-2 bg-red-900/30 hover:bg-red-900/50 text-red-300 border border-red-500/30 rounded-2xl text-xs font-semibold transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white mb-1">System Audit & Benchmark</h3>
        <p className="text-xs text-gray-400">Compare pipeline efficiency against manual human audits in real time.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Metric 1: Accuracy */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Routing Accuracy</span>
            <Award className="h-5 w-5 text-indigo-400" />
          </div>
          <div className="text-6xl font-black text-white leading-none tracking-tight mb-2">
            {data.accuracy_pct}%
          </div>
          <p className="text-[11px] text-gray-400">
            Successfully routed {data.matches} of {data.total_audited} seed events to their correct agent queues.
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider mb-1">Honest Pitch Caveat</span>
            <p className="text-[10px] text-gray-400 italic">
              "We achieved {data.accuracy_pct}% routing accuracy on our seeded test set—but we'd expect this to drop on messier real-world input, which is exactly why the composite confidence gate exists as a safety net."
            </p>
          </div>
        </div>

        {/* Metric 2: Speedup */}
        <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6 relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Pipeline Speedup</span>
            <Zap className="h-5 w-5 text-amber-400" />
          </div>
          <div className="text-6xl font-black text-amber-400 leading-none tracking-tight mb-2">
            {data.speedup_factor}x
          </div>
          <p className="text-[11px] text-gray-400">
            Faster at correlating signals across siloed business departments.
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <span className="text-[10px] text-gray-500 font-semibold block uppercase tracking-wider mb-1">Methodology Definition</span>
            <p className="text-[10px] text-gray-400">
              "We define a 'step' as a single context switch or read action—meaning a human auditor must manually perform {data.total_audited} event reviews and switch between 3 dashboard views to correlate the pattern, whereas the pipeline surfaces it in 1 single unified view."
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Detail */}
      <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-6">
        <h4 className="text-sm font-bold text-white mb-4">Workflow Steps Comparison</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/20 border border-white/5 rounded-2xl p-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-red-400/80 block mb-2">Naive Human Audit Workflow</span>
            <ul className="space-y-2 text-[11px] text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-red-500">✕</span> Read & review {data.total_audited} events in isolation.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">✕</span> Switch context across 3 distinct dashboards (Inbox, Twitter, Finance).
              </li>
              <li className="flex items-start gap-2">
                <span className="text-red-500">✕</span> Manually remember product keys or client IDs to cross-reference records.
              </li>
            </ul>
            <div className="mt-4 pt-2 text-right">
              <span className="text-xs text-gray-500 font-medium">Total Workflow Actions: </span>
              <span className="text-sm font-bold text-red-400">{data.naive_steps} steps</span>
            </div>
          </div>

          <div className="bg-indigo-950/20 border border-indigo-500/20 rounded-2xl p-4">
            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-400 block mb-2">Automated Agentic Pipeline</span>
            <ul className="space-y-2 text-[11px] text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span> Multi-Agent router categorizes events on ingest.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span> Customer Care agent performs instant RAG + cross-domain tool check.
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">✓</span> Management Agent highlights linked correlations automatically.
              </li>
            </ul>
            <div className="mt-4 pt-2 text-right">
              <span className="text-xs text-gray-500 font-medium">Total Workflow Actions: </span>
              <span className="text-sm font-bold text-indigo-400">{data.pipeline_steps} step</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
