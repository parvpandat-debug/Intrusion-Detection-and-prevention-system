import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, IPSRule, Intervention } from './lib/supabase';
import {
  TrafficRequest,
  generateMockRequest,
  evaluateRequest,
  resetIPState,
} from './ips/ipsEngine';
import Header from './components/Header';
import RuleManager from './components/RuleManager';
import PreventionConsole from './components/PreventionConsole';
import TrafficInterceptor from './components/TrafficInterceptor';

const MAX_TRAFFIC_ROWS = 80;
const SCAN_DELAY_MS    = 400;
const REQUEST_INTERVAL = 600;

export default function App() {
  const [rules, setRules]                 = useState<IPSRule[]>([]);
  const [interventions, setInterventions] = useState<Intervention[]>([]);
  const [requests, setRequests]           = useState<TrafficRequest[]>([]);
  const [isRunning, setIsRunning]         = useState(false);
  const [blockedIPs, setBlockedIPs]       = useState<Set<string>>(new Set());

  const rulesRef        = useRef(rules);
  const blockedIPsRef   = useRef(blockedIPs);
  rulesRef.current      = rules;
  blockedIPsRef.current = blockedIPs;

  useEffect(() => {
    async function load() {
      const [{ data: rulesData }, { data: iData }] = await Promise.all([
        supabase.from('ips_rules').select('*').order('created_at'),
        supabase
          .from('ips_interventions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(100),
      ]);
      if (rulesData) setRules(rulesData as IPSRule[]);
      if (iData) {
        const items = iData as Intervention[];
        setInterventions(items);
        const active = new Set(items.filter((i) => !i.unblocked).map((i) => i.ip));
        setBlockedIPs(active);
      }
    }
    load();

    // Realtime subscription for interventions
    const channel = supabase
      .channel('ips-interventions-realtime')
      .on<Intervention>(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'ips_interventions' },
        (payload) => {
          const newItem = payload.new as Intervention;
          setInterventions((prev) => {
            if (prev.some((i) => i.id === newItem.id)) return prev;
            return [newItem, ...prev];
          });
          if (!newItem.unblocked && newItem.action === 'block_ip') {
            setBlockedIPs((prev) => {
              const next = new Set(prev);
              next.add(newItem.ip);
              return next;
            });
          }
        }
      )
      .on<Intervention>(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ips_interventions' },
        (payload) => {
          const updated = payload.new as Intervention;
          setInterventions((prev) =>
            prev.map((i) => (i.id === updated.id ? updated : i))
          );
          if (updated.unblocked) {
            setBlockedIPs((prev) => {
              const next = new Set(prev);
              next.delete(updated.ip);
              return next;
            });
            resetIPState(updated.ip);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const processRequest = useCallback(async (req: TrafficRequest) => {
    const result = evaluateRequest(req, rulesRef.current, blockedIPsRef.current);

    await new Promise((r) => setTimeout(r, SCAN_DELAY_MS));

    const updated: TrafficRequest = {
      ...req,
      status:          result.status,
      triggeredRule:   result.triggeredRule,
      triggeredAction: result.triggeredAction,
    };

    setRequests((prev) => [updated, ...prev].slice(0, MAX_TRAFFIC_ROWS));

    const isIntercepted =
      result.status === 'blocked' ||
      result.status === 'terminated' ||
      result.status === 'captcha';

    if (isIntercepted && result.triggeredAction && result.triggeredRule !== 'Pre-blocked IP') {
      const reasonMap: Record<string, string> = {
        block_ip:             'Brute Force / Rule Match',
        terminate_connection: 'SQL Injection Detected',
        enable_captcha:       'Rate Limit Exceeded',
      };

      const { data } = await supabase
        .from('ips_interventions')
        .insert({
          ip:        req.ip,
          rule_id:   result.ruleId,
          rule_name: result.triggeredRule,
          action:    result.triggeredAction,
          reason:    reasonMap[result.triggeredAction] ?? 'Rule Match',
          unblocked: false,
        })
        .select()
        .single();

      if (data) {
        const intervention = data as Intervention;
        setInterventions((prev) => [intervention, ...prev]);

        if (result.triggeredAction === 'block_ip') {
          setBlockedIPs((prev) => {
            const next = new Set(prev);
            next.add(req.ip);
            return next;
          });
        }
      }
    }
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const tick = () => {
      const req = generateMockRequest();
      setRequests((prev) => [req, ...prev].slice(0, MAX_TRAFFIC_ROWS));
      processRequest(req);
    };

    const id = setInterval(tick, REQUEST_INTERVAL);
    return () => clearInterval(id);
  }, [isRunning, processRequest]);

  async function handleAddRule(rule: Omit<IPSRule, 'id' | 'created_at'>) {
    const { data } = await supabase.from('ips_rules').insert(rule).select().single();
    if (data) setRules((prev) => [...prev, data as IPSRule]);
  }

  async function handleToggleRule(id: string, enabled: boolean) {
    await supabase.from('ips_rules').update({ enabled }).eq('id', id);
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled } : r)));
  }

  async function handleDeleteRule(id: string) {
    await supabase.from('ips_rules').delete().eq('id', id);
    setRules((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleUnblock(id: string, ip: string) {
    await supabase.from('ips_interventions').update({ unblocked: true }).eq('id', id);
    // Realtime subscription will handle state updates
  }

  const totalBlocked  = interventions.filter((i) => !i.unblocked).length;
  const totalRequests = requests.length;
  const activeRules   = rules.filter((r) => r.enabled).length;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <Header
        totalBlocked={totalBlocked}
        totalRequests={totalRequests}
        activeRules={activeRules}
      />

      <main className="max-w-screen-xl mx-auto px-6 py-6 grid grid-cols-1 xl:grid-cols-[360px_1fr] gap-6">
        <aside className="flex flex-col gap-6">
          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-xl">
            <RuleManager
              rules={rules}
              onAdd={handleAddRule}
              onToggle={handleToggleRule}
              onDelete={handleDeleteRule}
            />
          </div>

          <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-xl">
            <PreventionConsole
              interventions={interventions}
              onUnblock={handleUnblock}
            />
          </div>
        </aside>

        <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-5 shadow-xl">
          <TrafficInterceptor
            requests={requests}
            isRunning={isRunning}
            onToggle={() => setIsRunning((v) => !v)}
          />
        </div>
      </main>
    </div>
  );
}
