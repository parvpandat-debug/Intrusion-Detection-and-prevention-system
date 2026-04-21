import { IPSRule } from '../lib/supabase';

// ─── Types ────────────────────────────────────────────────────────────────────

export type RequestStatus = 'scanning' | 'passed' | 'blocked' | 'terminated' | 'captcha';
export type RuleAction = 'block_ip' | 'terminate_connection' | 'enable_captcha';

export type TrafficRequest = {
  id: string;
  ip: string;
  method: string;
  path: string;
  payload: string;
  loginAttempts: number;
  requestRate: number;
  status: RequestStatus;
  triggeredRule: string | null;
  triggeredAction: RuleAction | null;
  timestamp: Date;
};

export type EvalResult = {
  status: RequestStatus;
  triggeredRule: string | null;
  triggeredAction: RuleAction | null;
  ruleId: string | null;
};

// ─── IP State Tracking ────────────────────────────────────────────────────────

type IPState = {
  loginFailures: number;
  requestCount: number;
  windowStart: number;
  requestRate: number;
};

const ipStates = new Map<string, IPState>();

export function resetIPState(ip: string) {
  ipStates.delete(ip);
}

// ─── Data Pools ───────────────────────────────────────────────────────────────

const NORMAL_IPS = [
  '10.0.0.23', '172.16.4.89', '192.168.2.100',
  '10.10.10.5', '192.0.2.45', '192.168.1.200',
];

const ATTACK_IPS = [
  '185.220.101.42', '45.33.32.156', '198.199.88.18',
  '192.168.1.45', '203.0.113.99',
];

const PATHS = [
  '/login', '/api/users', '/admin/dashboard',
  '/api/data', '/search', '/api/orders', '/auth/token',
];

const METHODS = ['GET', 'POST', 'PUT', 'DELETE'];

const NORMAL_PAYLOADS = [
  '{}',
  '{"username": "alice", "password": "hunter2"}',
  '{"page": 1, "limit": 20}',
  '{"filter": "active"}',
];

const MALICIOUS_PAYLOADS = [
  '{"query": "SELECT * FROM users WHERE id=1"}',
  '{"search": "product\' OR 1=1--"}',
  '{"filter": "name UNION SELECT * FROM admin--"}',
  '{"id": "1; DROP TABLE users;--"}',
  '{"input": "admin\'--"}',
  '{"cmd": "EXEC xp_cmdshell(\'dir\')"}',
];

const SQL_KEYWORDS = [
  'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP',
  'UNION', 'OR 1=1', '--', ';--', 'EXEC', 'XP_',
  "' OR", "1=1",
];

// ─── Request Generation ───────────────────────────────────────────────────────

export function generateMockRequest(): TrafficRequest {
  const isAttack = Math.random() < 0.35;
  const ip = isAttack
    ? ATTACK_IPS[Math.floor(Math.random() * ATTACK_IPS.length)]
    : NORMAL_IPS[Math.floor(Math.random() * NORMAL_IPS.length)];

  const path = PATHS[Math.floor(Math.random() * PATHS.length)];
  const method = path === '/login' ? 'POST' : METHODS[Math.floor(Math.random() * METHODS.length)];

  const usesMaliciousPayload = isAttack && Math.random() < 0.5;
  const payload = usesMaliciousPayload
    ? MALICIOUS_PAYLOADS[Math.floor(Math.random() * MALICIOUS_PAYLOADS.length)]
    : NORMAL_PAYLOADS[Math.floor(Math.random() * NORMAL_PAYLOADS.length)];

  const now = Date.now();
  const existing = ipStates.get(ip) ?? {
    loginFailures: 0,
    requestCount: 0,
    windowStart: now,
    requestRate: 0,
  };

  if (now - existing.windowStart > 60_000) {
    existing.loginFailures = 0;
    existing.requestCount = 0;
    existing.windowStart = now;
  }

  existing.requestCount += 1;
  const elapsed = Math.max((now - existing.windowStart) / 1000, 0.1);
  existing.requestRate = Math.round(existing.requestCount / elapsed);

  if (path === '/login' && isAttack) {
    existing.loginFailures += Math.floor(Math.random() * 3) + 1;
  }

  ipStates.set(ip, existing);

  return {
    id: crypto.randomUUID(),
    ip,
    method,
    path,
    payload,
    loginAttempts: existing.loginFailures,
    requestRate: existing.requestRate,
    status: 'scanning',
    triggeredRule: null,
    triggeredAction: null,
    timestamp: new Date(),
  };
}

// ─── Rule Evaluation ──────────────────────────────────────────────────────────

export function evaluateRequest(
  request: TrafficRequest,
  rules: IPSRule[],
  blockedIPs: Set<string>,
): EvalResult {
  if (blockedIPs.has(request.ip)) {
    return {
      status: 'blocked',
      triggeredRule: 'Pre-blocked IP',
      triggeredAction: 'block_ip',
      ruleId: null,
    };
  }

  for (const rule of rules) {
    if (!rule.enabled) continue;

    let triggered = false;

    switch (rule.metric) {
      case 'login_failures':
        if (rule.operator === 'greater_than') {
          triggered = request.loginAttempts > Number(rule.threshold_value);
        }
        break;

      case 'sql_keyword': {
        const haystack = (request.payload + ' ' + request.path).toUpperCase();
        triggered = SQL_KEYWORDS.some((kw) => haystack.includes(kw));
        break;
      }

      case 'request_rate':
        if (rule.operator === 'greater_than') {
          triggered = request.requestRate > Number(rule.threshold_value);
        }
        break;
    }

    if (triggered) {
      const statusMap: Record<RuleAction, RequestStatus> = {
        block_ip: 'blocked',
        terminate_connection: 'terminated',
        captcha: 'captcha',
        enable_captcha: 'captcha',
      } as Record<RuleAction, RequestStatus>;

      return {
        status: statusMap[rule.action] ?? 'blocked',
        triggeredRule: rule.name,
        triggeredAction: rule.action,
        ruleId: rule.id,
      };
    }
  }

  return {
    status: 'passed',
    triggeredRule: null,
    triggeredAction: null,
    ruleId: null,
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function actionLabel(action: string): string {
  const labels: Record<string, string> = {
    block_ip: 'Block IP',
    terminate_connection: 'Terminate Connection',
    enable_captcha: 'Enable CAPTCHA',
  };
  return labels[action] ?? action;
}

export function metricLabel(metric: string): string {
  const labels: Record<string, string> = {
    login_failures: 'Login Failures',
    sql_keyword: 'SQL Keyword',
    request_rate: 'Request Rate',
  };
  return labels[metric] ?? metric;
}

export function operatorLabel(op: string): string {
  const labels: Record<string, string> = {
    greater_than: '>',
    less_than: '<',
    contains: 'contains',
  };
  return labels[op] ?? op;
}

export function statusBadgeClasses(status: RequestStatus): string {
  switch (status) {
    case 'blocked':    return 'bg-rose-500/20 text-rose-400 border border-rose-500/50';
    case 'terminated': return 'bg-rose-600/20 text-rose-300 border border-rose-600/50';
    case 'captcha':    return 'bg-amber-400/20 text-amber-300 border border-amber-400/50';
    case 'scanning':   return 'bg-blue-500/20 text-blue-300 border border-blue-500/50';
    case 'passed':     return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50';
    default:           return 'bg-gray-700 text-gray-300';
  }
}

export function statusLabel(status: RequestStatus): string {
  switch (status) {
    case 'blocked':    return 'BLOCKED';
    case 'terminated': return 'TERMINATED';
    case 'captcha':    return 'CAPTCHA';
    case 'scanning':   return 'SCANNING';
    case 'passed':     return 'PASSED';
    default:           return status.toUpperCase();
  }
}
