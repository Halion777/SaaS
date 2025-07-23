import { createClient } from '@supabase/supabase-js';

/**
 * Supabase client configuration.
 * Uses environment variables for URL and API key.
 */
const supabaseUrl = 'https://kvuvjtbfvzhtccinhmcl.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzI4MjMsImV4cCI6MjA2ODYwODgyM30.9vj1JflLlLVrBiv1czG89WZMLgzo-QINoGecfkhVeXs';

// Only for server-side usage, not to be exposed in client code
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2dXZqdGJmdnpodGNjaW5obWNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzAzMjgyMywiZXhwIjoyMDY4NjA4ODIzfQ.eS8IqYJGiI39bcFyyrqsLWWNGBw3ikeqF-yPtpwsqy8';

/**
 * Supabase client for browser usage (with anon key)
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Storage configuration
 */
export const storageConfig = {
  url: 'https://kvuvjtbfvzhtccinhmcl.supabase.co/storage/v1/s3',
  region: 'ap-southeast-1',
  accessKey: 'ff87d0d22f61e2a64d6e7c6616d794b9',
  secretKey: '1694ddaf8941c411c1ab2fd9caa91f205aed3ebba1e4b85061db01e1d8aaba24'
};

export default supabase; 