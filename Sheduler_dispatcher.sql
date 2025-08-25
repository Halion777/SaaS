-- 4. Create new jobs
SELECT cron.schedule(
  'followups-scheduler-hourly',
  '0 * * * *',
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/followups-scheduler',
    ARRAY[
      ('Authorization'::text, 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMjgyMywiZXhwIjoyMDY4NjA4ODIzfQ.eS8IqYJGiI39bcFyyrqsLWWNGBw3ikeqF-yPtpwsqy8'::text),
      ('Content-Type'::text, 'application/json'::text)
    ]::http_header[],
    'application/json',
    '{}'::jsonb
  )::http_request);
  $$
);

SELECT cron.schedule(
  'followups-dispatcher-frequent',
  '*/5 * * * *',
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/followups-dispatcher',
    ARRAY[
      ('Authorization'::text, 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMjgyMywiZXhwIjoyMDY4NjA4ODIzfQ.eS8IqYJGiI39bcFyyrqsLWWNGBw3ikeqF-yPtpwsqy8'::text),
      ('Content-Type'::text, 'application/json'::text)
    ]::http_header[],
    'application/json',
    '{}'::jsonb
  )::http_request);
  $$
);

-- 5. Final verification of new jobs
SELECT jobid, jobname, schedule, command, active 
FROM cron.job;