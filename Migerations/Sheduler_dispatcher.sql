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

-- 3. Schedule invoice follow-up jobs
SELECT cron.unschedule('invoice-followups-scheduler-daily');
SELECT cron.unschedule('invoice-followups-dispatcher-frequent');

SELECT cron.schedule(
  'invoice-followups-scheduler-daily',
  '0 9 * * *',  -- Once daily at 9 AM
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/invoice-followups-scheduler',
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
  'invoice-followups-dispatcher-frequent',
  '*/15 * * * *',  -- Every 15 minutes
  $$
  SELECT content::text 
  FROM http((
    'POST',
    'https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/invoice-followups-dispatcher',
    ARRAY[
      ('Authorization'::text, 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMjgyMywiZXhwIjoyMDY4NjA4ODIzfQ.eS8IqYJGiI39bcFyyrqsLWWNGBw3ikeqF-yPtpwsqy8'::text),
      ('Content-Type'::text, 'application/json'::text)
    ]::http_header[],
    'application/json',
    '{}'::jsonb
  )::http_request);
  $$
);

-- 4. Verification of all jobs
SELECT jobid, jobname, schedule, command, active 
FROM cron.job;

-- 5. Explanation of changes:
-- Quote Follow-ups:
-- - Scheduler: Daily at 9 AM (0 9 * * *)
-- - Dispatcher: Every 15 minutes (*/15 * * * *)
-- Invoice Follow-ups:
-- - Scheduler: Daily at 9 AM (0 9 * * *)
-- - Dispatcher: Every 15 minutes (*/15 * * * *)
-- This prevents duplicate follow-ups while maintaining responsiveness
