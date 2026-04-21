import { useEffect, useRef } from 'react';
import { Wifi, ShieldAlert, CheckCircle, Loader, XCircle, AlertTriangle } from 'lucide-react';
import { TrafficRequest, statusBadgeClasses, statusLabel } from '../ips/ipsEngine';

type Props = {
  requests: TrafficRequest[];
  isRunning: boolean;
  onToggle: () => void;
};

function methodColor(method: string) {
  switch (method) {
    case 'GET':    return 'text-emerald-400';
    case 'POST':   return 'text-blue-400';
    case 'PUT':    return 'text-amber-400';
    case 'DELETE': return 'text-rose-400';
    default:       return 'text-gray-400';
  }
}

function StatusIcon({ status }: { status: TrafficRequest['status'] }) {
  switch (status) {
    case 'scanning':
      return <Loader className="w-3.5 h-3.5 text-blue-400 animate-spin" />;
    case 'passed':
      return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    case 'blocked':
    case 'terminated':
      return <XCircle className="w-3.5 h-3.5 text-rose-500" />;
    case 'captcha':
      return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    default:
      return null;
  }
}

function RowHighlight({ status }: { status: TrafficRequest['status'] }) {
  if (status === 'blocked' || status === 'terminated')
    return <div className="absolute inset-0 rounded-lg bg-rose-500/5 border border-rose-500/20 pointer-events-none" />;
  if (status === 'captcha')
    return <div className="absolute inset-0 rounded-lg bg-amber-400/5 border border-amber-400/20 pointer-events-none" />;
  if (status === 'passed')
    return <div className="absolute inset-0 rounded-lg bg-emerald-500/5 pointer-events-none" />;
  return null;
}

export default function TrafficInterceptor({ requests, isRunning, onToggle }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [requests.length]);

  const passed  = requests.filter((r) => r.status === 'passed').length;
  const blocked = requests.filter((r) => r.status === 'blocked' || r.status === 'terminated').length;
  const captcha = requests.filter((r) => r.status === 'captcha').length;
  const scanning = requests.filter((r) => r.status === 'scanning').length;

  return (
    <section className="flex flex-col gap-4 h-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wifi className={`w-4 h-4 ${isRunning ? 'text-emerald-400' : 'text-gray-600'}`} />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-mono">
            Live Traffic Interceptor
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-4 text-[10px] font-mono">
            <span className="text-emerald-400">{passed} passed</span>
            <span className="text-rose-400">{blocked} blocked</span>
            <span className="text-amber-400">{captcha} captcha</span>
            {scanning > 0 && <span className="text-blue-400">{scanning} scanning</span>}
          </div>
          <button
            onClick={onToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold border transition-all ${
              isRunning
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            {isRunning ? (
              <><ShieldAlert className="w-3.5 h-3.5" /> Stop Interceptor</>
            ) : (
              <><Wifi className="w-3.5 h-3.5" /> Start Interceptor</>
            )}
          </button>
        </div>
      </div>

      <div className="bg-gray-900/60 rounded-lg border border-gray-800 overflow-hidden flex flex-col">
        <div className="grid grid-cols-[90px_90px_140px_1fr_120px_110px] gap-0 px-3 py-2 border-b border-gray-800 text-[10px] font-mono uppercase tracking-widest text-gray-600">
          <span>Status</span>
          <span>IP Address</span>
          <span>Method · Path</span>
          <span>Payload</span>
          <span>Triggered Rule</span>
          <span>Time</span>
        </div>

        <div ref={scrollRef} className="overflow-y-auto max-h-[520px] divide-y divide-gray-800/50">
          {requests.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Wifi className="w-8 h-8 text-gray-700 mb-2" />
              <p className="text-sm text-gray-600 font-mono">Interceptor inactive.</p>
              <p className="text-xs text-gray-700 mt-1">Click "Start Interceptor" to begin scanning traffic.</p>
            </div>
          )}

          {requests.map((req) => (
            <div
              key={req.id}
              className="relative grid grid-cols-[90px_90px_140px_1fr_120px_110px] gap-0 px-3 py-2.5 items-start group"
            >
              <RowHighlight status={req.status} />

              <div className="relative z-10">
                <span className={`inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${statusBadgeClasses(req.status)}`}>
                  <StatusIcon status={req.status} />
                  {statusLabel(req.status)}
                </span>
              </div>

              <div className="relative z-10 font-mono text-xs text-gray-400 pt-0.5 truncate pr-2">
                {req.ip}
              </div>

              <div className="relative z-10 flex items-center gap-1.5 pt-0.5 pr-2 truncate">
                <span className={`font-mono text-[10px] font-bold ${methodColor(req.method)}`}>
                  {req.method}
                </span>
                <span className="font-mono text-xs text-gray-500 truncate">{req.path}</span>
              </div>

              <div className="relative z-10 font-mono text-[10px] text-gray-600 truncate pr-2 pt-0.5 max-w-full">
                <span className={`${
                  req.triggeredRule === 'SQL Injection Guard' ? 'text-rose-400 font-semibold' : ''
                }`}>
                  {req.payload.length > 40 ? req.payload.slice(0, 40) + '…' : req.payload}
                </span>
              </div>

              <div className="relative z-10 pt-0.5 pr-2">
                {req.triggeredRule ? (
                  <span className={`text-[10px] font-mono truncate block ${
                    req.triggeredAction === 'enable_captcha' ? 'text-amber-400' : 'text-rose-400'
                  }`}>
                    {req.triggeredRule}
                  </span>
                ) : req.status === 'passed' ? (
                  <span className="text-[10px] font-mono text-gray-700">—</span>
                ) : null}
              </div>

              <div className="relative z-10 font-mono text-[10px] text-gray-700 pt-0.5">
                {req.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {isRunning && (
        <div className="flex items-center gap-2 text-xs font-mono text-gray-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Scanning incoming requests in real-time — matched rules trigger instant intervention
        </div>
      )}
    </section>
  );
}
