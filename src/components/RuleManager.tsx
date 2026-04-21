import { useState } from 'react';
import { Plus, Trash2, ToggleLeft, ToggleRight, Shield, ChevronDown } from 'lucide-react';
import { IPSRule } from '../lib/supabase';
import { actionLabel, metricLabel, operatorLabel } from '../ips/ipsEngine';

type Props = {
  rules: IPSRule[];
  onAdd: (rule: Omit<IPSRule, 'id' | 'created_at'>) => void;
  onToggle: (id: string, enabled: boolean) => void;
  onDelete: (id: string) => void;
};

const METRIC_OPTIONS = [
  { value: 'login_failures', label: 'Login Failures', unit: 'attempts' },
  { value: 'sql_keyword',    label: 'SQL Keyword',    unit: '' },
  { value: 'request_rate',   label: 'Request Rate',   unit: 'req/sec' },
];

const ACTION_OPTIONS = [
  { value: 'block_ip',             label: 'Block IP',             color: 'text-rose-400' },
  { value: 'terminate_connection', label: 'Terminate Connection', color: 'text-rose-300' },
  { value: 'enable_captcha',       label: 'Enable CAPTCHA',       color: 'text-amber-400' },
];

const OPERATOR_OPTIONS = [
  { value: 'greater_than', label: '> Greater than' },
  { value: 'less_than',    label: '< Less than' },
  { value: 'contains',     label: 'Contains' },
];

const defaultForm = {
  name: '',
  metric: 'login_failures' as IPSRule['metric'],
  operator: 'greater_than' as IPSRule['operator'],
  threshold_value: '5',
  time_window: 60,
  action: 'block_ip' as IPSRule['action'],
  enabled: true,
};

export default function RuleManager({ rules, onAdd, onToggle, onDelete }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...defaultForm });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    onAdd({ ...form });
    setForm({ ...defaultForm });
    setShowForm(false);
  }

  function actionColor(action: string) {
    if (action === 'block_ip' || action === 'terminate_connection') return 'text-rose-400';
    return 'text-amber-400';
  }

  function actionBg(action: string) {
    if (action === 'block_ip' || action === 'terminate_connection')
      return 'bg-rose-500/10 border-rose-500/30';
    return 'bg-amber-400/10 border-amber-400/30';
  }

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-gray-200 uppercase tracking-widest font-mono">
            Rule Manager
          </h2>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-gray-800 text-gray-400">
            {rules.filter((r) => r.enabled).length} active
          </span>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-semibold bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 hover:border-gray-600 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Rule
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showForm ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-gray-900 border border-gray-700 rounded-lg p-4 grid grid-cols-2 gap-3"
        >
          <div className="col-span-2">
            <label className="field-label">Rule Name</label>
            <input
              className="field-input"
              placeholder="e.g. Brute Force Login Block"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">Metric</label>
            <select
              className="field-input"
              value={form.metric}
              onChange={(e) => setForm((f) => ({ ...f, metric: e.target.value as IPSRule['metric'] }))}
            >
              {METRIC_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Operator</label>
            <select
              className="field-input"
              value={form.operator}
              onChange={(e) => setForm((f) => ({ ...f, operator: e.target.value as IPSRule['operator'] }))}
            >
              {OPERATOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Threshold Value</label>
            <input
              className="field-input"
              placeholder="e.g. 5"
              value={form.threshold_value}
              onChange={(e) => setForm((f) => ({ ...f, threshold_value: e.target.value }))}
              required
            />
          </div>

          <div>
            <label className="field-label">Action</label>
            <select
              className="field-input"
              value={form.action}
              onChange={(e) => setForm((f) => ({ ...f, action: e.target.value as IPSRule['action'] }))}
            >
              {ACTION_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2 flex gap-2 pt-1">
            <button
              type="submit"
              className="flex-1 py-2 rounded text-xs font-mono font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
            >
              Deploy Rule
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setForm({ ...defaultForm }); }}
              className="px-4 py-2 rounded text-xs font-mono font-semibold bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col gap-2">
        {rules.length === 0 && (
          <p className="text-xs text-gray-600 font-mono text-center py-6">No rules configured.</p>
        )}
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`relative rounded-lg border p-3 transition-all ${
              rule.enabled
                ? `${actionBg(rule.action)} hover:brightness-110`
                : 'bg-gray-900/40 border-gray-800 opacity-50'
            }`}
          >
            {rule.enabled && (
              <div className={`absolute left-0 top-0 bottom-0 w-0.5 rounded-l-lg ${
                rule.action === 'enable_captcha' ? 'bg-amber-400' : 'bg-rose-500'
              }`} />
            )}
            <div className="flex items-start justify-between gap-2 pl-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-200 truncate">{rule.name}</p>
                <p className="text-xs font-mono text-gray-500 mt-0.5">
                  <span className="text-gray-400">{metricLabel(rule.metric)}</span>
                  {' '}
                  <span className="text-gray-500">{operatorLabel(rule.operator)}</span>
                  {' '}
                  <span className="text-gray-300 font-semibold">{rule.threshold_value}</span>
                  {rule.time_window > 0 && (
                    <span className="text-gray-600"> / {rule.time_window}s window</span>
                  )}
                  {' → '}
                  <span className={`font-semibold ${actionColor(rule.action)}`}>
                    {actionLabel(rule.action)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onToggle(rule.id, !rule.enabled)}
                  className="p-1 rounded hover:bg-gray-700/50 transition-colors"
                  title={rule.enabled ? 'Disable rule' : 'Enable rule'}
                >
                  {rule.enabled
                    ? <ToggleRight className="w-5 h-5 text-emerald-400" />
                    : <ToggleLeft className="w-5 h-5 text-gray-600" />}
                </button>
                <button
                  onClick={() => onDelete(rule.id)}
                  className="p-1 rounded hover:bg-rose-900/40 transition-colors"
                  title="Delete rule"
                >
                  <Trash2 className="w-4 h-4 text-gray-600 hover:text-rose-400 transition-colors" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
