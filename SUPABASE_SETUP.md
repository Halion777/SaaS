# HAVITAM - Supabase Setup Guide

This guide provides step-by-step instructions for setting up and configuring Supabase for the HAVITAM application.

## Prerequisites

- Supabase account (Create one at [supabase.com](https://supabase.com) if you don't have one)
- Node.js and npm installed
- Supabase CLI (optional, for local development and Edge Functions deployment)

## 1. Project Setup

### 1.1 Create Supabase Project

1. Log in to [Supabase Dashboard](https://app.supabase.com)
2. Click "New Project"
3. Enter project details:
   - Name: HAVITAM (or your preferred name)
   - Database Password: Create a strong password
   - Region: Select closest to your users (EU for French market)
4. Click "Create New Project"

### 1.2 Get API Credentials

1. Once the project is created, go to Project Settings → API
2. Note these keys:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secure, server-side only)

### 1.3 Environment Variables

Create or update `.env` file in your project root:

```
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

For server-side or Edge Functions, you'll also need:

```
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## 2. Database Setup

Execute these SQL scripts in the Supabase SQL Editor to create the required tables.

### 2.1 Create Tables

```sql
-- Create Users Table
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Clients Table
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  address TEXT,
  company TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Quotes Table
CREATE TABLE quotes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  quote_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  sent_at TIMESTAMP WITH TIME ZONE,
  valid_until TIMESTAMP WITH TIME ZONE
);

-- Create Tasks Table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Materials Table
CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) NOT NULL,
  name TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  unit TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create Invoices Table
CREATE TABLE invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  client_id UUID REFERENCES clients(id) NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  invoice_number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  due_date TIMESTAMP WITH TIME ZONE
);

-- Create Files Table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) NOT NULL,
  quote_id UUID REFERENCES quotes(id),
  invoice_id UUID REFERENCES invoices(id),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Create AI Usage Logs Table
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  function_name TEXT NOT NULL,
  input_length INTEGER,
  output_length INTEGER,
  model TEXT,
  tokens_used INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

### 2.2 Create Helper Functions

```sql
-- Function to calculate total amount for quotes
CREATE OR REPLACE FUNCTION sum_quote_amounts()
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN (SELECT COALESCE(SUM(total_amount), 0) FROM quotes);
END;
$$ LANGUAGE plpgsql;

-- Function to get top clients by invoice value
CREATE OR REPLACE FUNCTION get_top_clients(limit_count INTEGER DEFAULT 5)
RETURNS TABLE (
  client_id UUID,
  client_name TEXT,
  total_spent DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY 
  SELECT 
    c.id AS client_id, 
    c.name AS client_name, 
    COALESCE(SUM(i.total_amount), 0) AS total_spent
  FROM 
    clients c
  LEFT JOIN 
    invoices i ON c.id = i.client_id
  GROUP BY 
    c.id, c.name
  ORDER BY 
    total_spent DESC
  LIMIT 
    limit_count;
END;
$$ LANGUAGE plpgsql;
```

### 2.3 Setup Row Level Security (RLS)

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Users can view their own data only"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own data only"
  ON users
  FOR UPDATE
  USING (auth.uid() = id);

-- Clients table policies
CREATE POLICY "Users can view their own clients"
  ON clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Apply similar policies for all other tables
-- (quotes, tasks, materials, invoices, files)
```

## 3. Storage Setup

### 3.1 Create Storage Buckets

1. Go to Storage section in Supabase Dashboard
2. Create the following buckets:
   - `quotes-attachments` (private)
   - `client-files` (private)
   - `profile-images` (private)

### 3.2 Setup Storage Policies

For each bucket, apply these policies:

```sql
-- Example for quotes-attachments bucket
-- Allow users to select their own files
CREATE POLICY "Users can view their own files"
  ON storage.objects
  FOR SELECT
  USING (
    auth.uid() = (
      SELECT user_id FROM files 
      WHERE file_path = storage.objects.name
    )
  );

-- Allow users to insert their own files
CREATE POLICY "Users can upload files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (true);  -- This will be handled by our application logic

-- Allow users to update their own files
CREATE POLICY "Users can update their own files"
  ON storage.objects
  FOR UPDATE
  USING (
    auth.uid() = (
      SELECT user_id FROM files 
      WHERE file_path = storage.objects.name
    )
  );

-- Allow users to delete their own files
CREATE POLICY "Users can delete their own files"
  ON storage.objects
  FOR DELETE
  USING (
    auth.uid() = (
      SELECT user_id FROM files 
      WHERE file_path = storage.objects.name
    )
  );
```

## 4. Authentication Setup

### 4.1 Configure Auth Settings

1. Go to Authentication → Settings
2. Configure:
   - Site URL: Your application URL
   - Redirect URLs: Add your application URLs
   - Enable/disable providers as needed (email, social, etc.)

### 4.2 Configure Email Templates

1. Go to Authentication → Email Templates
2. Customize the email templates for:
   - Confirmation
   - Invitation
   - Magic Link
   - Change Email
   - Reset Password

## 5. Edge Functions Setup

### 5.1 Install Supabase CLI (if not already installed)

```bash
npm install -g supabase
```

### 5.2 Login to Supabase CLI

```bash
supabase login
```

### 5.3 Link to Your Project

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 5.4 Deploy Edge Functions

```bash
supabase functions deploy generate-task-description
supabase functions deploy transcribe-audio
supabase functions deploy generate-follow-up
supabase functions deploy analyze-client-data
supabase functions deploy generate-business-insights
supabase functions deploy optimize-pricing
```

### 5.5 Set Secrets for Edge Functions

```bash
supabase secrets set OPENAI_API_KEY=YOUR_OPENAI_API_KEY
```

## 6. Client Setup

### 6.1 Install Required Packages

```bash
npm install @supabase/supabase-js uuid
```

### 6.2 Initialize Application

```bash
npm run dev
```

## 7. Testing

### 7.1 Create Test User

1. Use the register form in the application
2. Or create a user via the Authentication section in Supabase Dashboard

### 7.2 Test Authentication

Login with the created user to verify the authentication flow.

### 7.3 Test Database Operations

Create test data for:
- Clients
- Quotes
- Invoices

### 7.4 Test Storage

Upload files to verify storage functionality.

### 7.5 Test Edge Functions

Use the AI-powered features to verify Edge Functions work correctly.

## 8. Monitoring

### 8.1 Database

Monitor database performance in Supabase Dashboard → Database → Performance.

### 8.2 Edge Functions

Monitor Edge Function logs and performance in Supabase Dashboard → Edge Functions → Logs.

### 8.3 Storage

Monitor storage usage in Supabase Dashboard → Storage → Usage.

## 9. Troubleshooting

- **Auth Issues**: Check auth settings and email templates
- **Database Errors**: Review RLS policies
- **Edge Function Errors**: Check logs in Supabase Dashboard
- **CORS Issues**: Add your domain to the allowed origins list

## 10. Production Deployment

1. Update environment variables for production
2. Set up proper error tracking
3. Configure monitoring and alerts
4. Consider upgrading your Supabase plan based on expected usage

---

For more information, refer to the [Supabase Documentation](https://supabase.com/docs). 