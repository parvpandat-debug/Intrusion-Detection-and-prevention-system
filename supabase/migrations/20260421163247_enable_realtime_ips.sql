
/*
  # Enable Realtime for IPS Interventions

  1. Changes
    - Enable realtime replication on `ips_interventions` table
    - This allows instant updates across all connected clients
*/

ALTER PUBLICATION supabase_realtime ADD TABLE ips_interventions;
