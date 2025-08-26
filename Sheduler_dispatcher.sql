-- 1. First, remove existing jobs to avoid conflicts
SELECT cron.unschedule('followups-scheduler-hourly');
SELECT cron.unschedule('followups-dispatcher-frequent');

-- 2. Create corrected jobs with proper frequency
SELECT cron.schedule(
  'followups-scheduler-daily',
  '0 9 * * *',  -- Once daily at 9 AM instead of every hour
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
  '*/15 * * * *',  -- Every 15 minutes instead of every 5 minutes
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

-- 3. Verification of new jobs
SELECT jobid, jobname, schedule, command, active 
FROM cron.job;

-- 4. Explanation of changes:
-- - Scheduler: Changed from hourly (0 * * * *) to daily (0 9 * * *) at 9 AM
-- - Dispatcher: Changed from every 5 minutes (*/5 * * * *) to every 15 minutes (*/15 * * * *)
-- - This prevents duplicate follow-ups while maintaining responsiveness
