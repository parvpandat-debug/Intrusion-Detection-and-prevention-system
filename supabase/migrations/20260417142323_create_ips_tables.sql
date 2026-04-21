
/*
  # IPS (Intrusion Prevention System) Tables

  1. New Tables
    - `ips_rules`
      - `id` (uuid, primary key)
      - `name` (text) - Human-readable rule name
      - `metric` (text) - The metric to evaluate: login_failures, sql_keyword, request_rate
      - `operator` (text) - Comparison operator: greater_than, contains, less_than
      - `threshold_value` (text) - Value to compare against (string to support both numeric and keyword)
      - `time_window` (integer) - Evaluation window in seconds
      - `action` (text) - Action to take: block_ip, terminate_connection, enable_captcha
      - `enabled` (boolean) - Whether rule is active
      - `created_at` (timestamptz)

    - `ips_interventions`
      - `id` (uuid, primary key)
      - `ip` (text) - Source IP address
      - `rule_id` (uuid, nullable) - FK to ips_rules
      - `rule_name` (text) - Snapshot of rule name at time of block
      - `action` (text) - Action that was taken
      - `reason` (text) - Human-readable reason
      - `unblocked` (boolean) - Whether manually unblocked
      - `created_at` (timestamptz)

  2. Security
    - RLS enabled on both tables
    - Anon read/write for demo (no auth in this module)

  3. Seed Data
    - 3 default rules matching requirements
*/

CREATE TABLE IF NOT EXISTS ips_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  metric text NOT NULL CHECK (metric IN ('login_failures', 'sql_keyword', 'request_rate')),
  operator text NOT NULL CHECK (operator IN ('greater_than', 'contains', 'less_than')),
  threshold_value text NOT NULL DEFAULT '5',
  time_window integer NOT NULL DEFAULT 60,
  action text NOT NULL CHECK (action IN ('block_ip', 'terminate_connection', 'enable_captcha')),
  enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ips_interventions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  rule_id uuid REFERENCES ips_rules(id) ON DELETE SET NULL,
  rule_name text NOT NULL,
  action text NOT NULL,
  reason text NOT NULL,
  unblocked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE ips_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ips_interventions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon select ips_rules"
  ON ips_rules FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon insert ips_rules"
  ON ips_rules FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon update ips_rules"
  ON ips_rules FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anon delete ips_rules"
  ON ips_rules FOR DELETE
  TO anon
  USING (true);

CREATE POLICY "Anon select ips_interventions"
  ON ips_interventions FOR SELECT
  TO anon
  USING (true);

CREATE POLICY "Anon insert ips_interventions"
  ON ips_interventions FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Anon update ips_interventions"
  ON ips_interventions FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

INSERT INTO ips_rules (name, metric, operator, threshold_value, time_window, action, enabled) VALUES
  ('Brute Force Login Block',    'login_failures', 'greater_than', '5',   60,  'block_ip',             true),
  ('SQL Injection Guard',        'sql_keyword',    'contains',     'SQL', 0,   'terminate_connection', true),
  ('Rate Limit Enforcement',     'request_rate',   'greater_than', '100', 1,   'enable_captcha',       true)
ON CONFLICT DO NOTHING;
