# Supabase Integration Setup for HAVITAM

## Configuration

The Supabase client has been set up in `src/services/supabaseClient.js` with the following credentials:

- **Project URL:** https://kvuvjtbfvzhtccinhmcl.supabase.co
- **Anon Key:** Already configured in the client file
- **Storage URL:** https://kvuvjtbfvzhtccinhmcl.supabase.co/storage/v1/s3
- **Region:** ap-southeast-1

## Next Steps

### 1. Install Supabase dependencies
```bash
npm install @supabase/supabase-js
```

### 2. Create Database Tables
Log into the Supabase dashboard and create the following tables:

#### Users Table
```sql
CREATE TABLE users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE,
  full_name TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

#### Clients Table
```sql
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
```

#### Quotes Table
```sql
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
```

#### Tasks Table
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID REFERENCES quotes(id) NOT NULL,
  description TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);
```

#### Materials Table
```sql
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
```

#### Invoices Table
```sql
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
```

#### Files Table
```sql
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
```

### 3. Set up Row Level Security (RLS)
Enable RLS on all tables and add policies:

```sql
-- Example for quotes table
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quotes"
  ON quotes
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON quotes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Repeat for other tables
```

### 4. Create Storage Buckets
In Supabase Dashboard:
1. Go to Storage section
2. Create buckets:
   - `quotes-attachments`
   - `client-files`
   - `profile-images`
3. Set appropriate RLS policies for each bucket

### 5. Setup Authentication Redirect URLs
In Supabase Dashboard:
1. Go to Authentication → URL Configuration
2. Add allowed redirect URLs for your application

