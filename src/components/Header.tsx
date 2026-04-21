import { Shield, Activity, AlertTriangle } from 'lucide-react';

type Props = {
  totalBlocked: number;
  totalRequests: number;
  activeRules: number;
};

export default function Header({ totalBlocked, totalRequests, activeRules }: Props) {
  const blockRate = totalRequests > 0 ? ((totalBlocked / totalRequests) * 100).toFixed(1) : '0.0';

  return (
    <header className="border-b border-gray-800 bg-gray-950/90 backdrop-blur sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-full bg-rose-500/30 blur-md animate-pulse" />
            <Shield className="relative w-8 h-8 text-rose-500" strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-100 tracking-tight leading-none">
              Intrusion Prevention System
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 font-mono uppercase tracking-widest">
              Active Prevention Module — v2.4.1
            </p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <Stat
            icon={<AlertTriangle className="w-4 h-4 text-rose-500" />}
            label="Blocked"
            value={totalBlocked.toLocaleString()}
            valueClass="text-rose-400"
          />
          <Stat
            icon={<Activity className="w-4 h-4 text-amber-400" />}
            label="Block Rate"
            value={`${blockRate}%`}
            valueClass="text-amber-400"
          />
          <Stat
            icon={<Shield className="w-4 h-4 text-emerald-400" />}
            label="Active Rules"
            value={String(activeRules)}
            valueClass="text-emerald-400"
          />

          <div className="flex items-center gap-2 pl-4 border-l border-gray-800">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider">
              Interceptor Live
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

function Stat({
  icon,
  label,
  value,
  valueClass,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  valueClass: string;
}) {
  return (
    <div className="flex items-center gap-2">
      {icon}
      <div>
        <p className="text-[10px] text-gray-600 font-mono uppercase tracking-widest leading-none">{label}</p>
        <p className={`text-sm font-bold font-mono leading-tight ${valueClass}`}>{value}</p>
      </div>
    </div>
  );
}
