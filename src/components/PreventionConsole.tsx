import { Ban, ShieldOff, AlertCircle, Unlock, Clock } from 'lucide-react';
import { Intervention } from '../lib/supabase';

type Props = {
  interventions: Intervention[];
  onUnblock: (id: string, ip: string) => void;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
}

function actionIcon(action: string) {
  if (action === 'block_ip') return <Ban className="w-3.5 h-3.5 text-rose-400" />;
  if (action === 'terminate_connection') return <ShieldOff className="w-3.5 h-3.5 text-rose-300" />;
  return <AlertCircle className="w-3.5 h-3.5 text-amber-400" />;
}

function actionTagClasses(action: string) {
  if (action === 'block_ip') return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
  if (action === 'terminate_connection') return 'bg-rose-700/20 text-rose-300 border-rose-700/40';
  return 'bg-amber-400/20 text-amber-300 border-amber-400/40';
}

function actionTagLabel(action: string) {
  if (action === 'block_ip') return 'IP Blocked';
  if (action === 'terminate_connection') return 'Conn. Terminated';
  return 'CAPTCHA Enabled';
}

export default function PreventionConsole({ interventions, onUnblock }: Props) {
  const active = interventions.filter((i) => !i.unblocked);
  const resolved = interventions.filter((i) => i.unblocked);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ban className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-mono">
            Prevention Console
          </h2>
          {active.length > 0 && (
            <span className="flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
              {active.length} active
            </span>
          )}
        </div>
        <span className="text-xs font-mono text-gray-600">
          {interventions.length} total interventions
        </span>
      </div>

      {interventions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-gray-800 rounded-lg">
          <ShieldOff className="w-8 h-8 text-gray-700 mb-2" />
          <p className="text-sm text-gray-600 font-mono">No interventions yet.</p>
          <p className="text-xs text-gray-700 mt-1">Traffic is clean — monitoring active.</p>
        </div>
      )}

      {active.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600 px-1">Active Blocks</p>
          {active.map((item) => (
            <InterventionCard key={item.id} item={item} onUnblock={onUnblock} />
          ))}
        </div>
      )}

      {resolved.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-[10px] font-mono uppercase tracking-widest text-gray-600 px-1">Resolved</p>
          {resolved.slice(0, 5).map((item) => (
            <InterventionCard key={item.id} item={item} onUnblock={onUnblock} dimmed />
          ))}
        </div>
      )}
    </section>
  );
}

function InterventionCard({
  item,
  onUnblock,
  dimmed = false,
}: {
  item: Intervention;
  onUnblock: (id: string, ip: string) => void;
  dimmed?: boolean;
}) {
  return (
    <div
      className={`rounded-lg border p-3 transition-all ${
        dimmed
          ? 'bg-gray-900/30 border-gray-800/50 opacity-60'
          : item.action === 'enable_captcha'
          ? 'bg-amber-400/5 border-amber-400/20'
          : 'bg-rose-500/5 border-rose-500/20'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="mt-0.5">{actionIcon(item.action)}</div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-sm font-bold text-gray-200">{item.ip}</span>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded border uppercase tracking-wider ${
                  item.unblocked
                    ? 'bg-gray-800 text-gray-500 border-gray-700'
                    : actionTagClasses(item.action)
                }`}
              >
                {item.unblocked ? 'Unblocked' : actionTagLabel(item.action)}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              Reason: <span className="text-gray-400">{item.reason}</span>
            </p>
            <p className="text-xs text-gray-600 font-mono mt-0.5">
              Rule: <span className="text-gray-500">{item.rule_name}</span>
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          <div className="flex items-center gap-1 text-[10px] font-mono text-gray-600">
            <Clock className="w-3 h-3" />
            {timeAgo(item.created_at)}
          </div>
          {!item.unblocked && (
            <button
              onClick={() => onUnblock(item.id, item.ip)}
              className="flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-mono font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-emerald-400 border border-gray-700 hover:border-emerald-500/40 transition-all"
            >
              <Unlock className="w-3 h-3" />
              Manual Unblock
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
