import { useState } from "react";
import { Terminal, ChevronDown, ChevronUp } from "lucide-react";

interface ReasoningTraceViewerProps {
  trace: string;
}

export default function ReasoningTraceViewer({ trace }: ReasoningTraceViewerProps) {
  const [isOpen, setIsOpen] = useState(false);

  const lines = trace
    .split("\n")
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const parseLine = (line: string) => {
    let tag = "System";
    let tagColor = "bg-gray-800/50 border-gray-700/30 text-gray-400";
    let content = line;

    if (line.startsWith("Router:")) {
      tag = "Router";
      tagColor = "bg-indigo-500/10 border-indigo-500/20 text-indigo-400";
      content = line.substring(7).trim();
    } else if (line.startsWith("Customer Care Agent:")) {
      tag = "Customer Care Agent";
      tagColor = "bg-sky-500/10 border-sky-500/20 text-sky-400";
      content = line.substring(20).trim();
    } else if (line.startsWith("Social Agent:")) {
      tag = "Social Agent";
      tagColor = "bg-violet-500/10 border-violet-500/20 text-violet-400";
      content = line.substring(13).trim();
    } else if (line.startsWith("Finance Agent:")) {
      tag = "Finance Agent";
      tagColor = "bg-emerald-500/10 border-emerald-500/20 text-emerald-400";
      content = line.substring(14).trim();
    } else if (line.startsWith("Composite Gating:")) {
      tag = "Composite Gating";
      tagColor = "bg-amber-500/10 border-amber-500/20 text-amber-400";
      content = line.substring(17).trim();
    } else if (line.startsWith("Found ") || line.startsWith("No related ")) {
      tag = "Tool Execution";
      tagColor = "bg-teal-500/10 border-teal-500/20 text-teal-400";
    }

    return { tag, tagColor, content };
  };

  return (
    <div className="mt-4 border-t border-white/5 pt-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-[11px] font-bold text-gray-400 hover:text-white transition-all py-1"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          <span>Agent Reasoning & Observability Trace</span>
        </div>
        {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {isOpen && (
        <div className="mt-3 bg-black/40 border border-white/5 rounded-2xl p-4 font-mono text-[10px] space-y-2.5 overflow-x-auto leading-relaxed max-h-64 overflow-y-auto">
          {lines.map((line, idx) => {
            const { tag, tagColor, content } = parseLine(line);
            return (
              <div key={idx} className="flex items-start gap-3">
                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border shrink-0 ${tagColor}`}>
                  {tag}
                </span>
                <span className="text-gray-300 break-words">{content}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
