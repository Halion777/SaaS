create table public.app_settings (
  id uuid not null default gen_random_uuid (),
  setting_key character varying(255) not null,
  setting_value jsonb not null,
  description text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  updated_by uuid null,
  constraint app_settings_pkey primary key (id),
  constraint app_settings_setting_key_key unique (setting_key)
) TABLESPACE pg_default;

create index IF not exists idx_app_settings_key on public.app_settings using btree (setting_key) TABLESPACE pg_default;


create table public.artisan_lead_preferences (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  profile_id uuid null,
  countries_served jsonb not null default '{}'::jsonb,
  regions_served jsonb not null default '{}'::jsonb,
  work_categories jsonb not null default '{}'::jsonb,
  other_work_category text null,
  receive_leads boolean null default false,
  max_leads_per_day integer null default 10,
  min_lead_value numeric(10, 2) null,
  max_lead_value numeric(10, 2) null,
  email_notifications boolean null default true,
  push_notifications boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint artisan_lead_preferences_pkey primary key (id),
  constraint artisan_lead_preferences_user_id_key unique (user_id),
  constraint artisan_lead_preferences_profile_id_fkey foreign KEY (profile_id) references user_profiles (id) on delete set null,
  constraint artisan_lead_preferences_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_artisan_lead_preferences_user_id on public.artisan_lead_preferences using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_artisan_lead_preferences_countries on public.artisan_lead_preferences using gin (countries_served jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_artisan_lead_preferences_regions on public.artisan_lead_preferences using gin (regions_served jsonb_path_ops) TABLESPACE pg_default;

create index IF not exists idx_artisan_lead_preferences_categories on public.artisan_lead_preferences using gin (work_categories jsonb_path_ops) TABLESPACE pg_default;




create table public.blogs (
  id uuid not null default gen_random_uuid (),
  title text not null,
  slug text not null,
  excerpt text null,
  content text not null,
  featured_image text null,
  category text null default 'general'::text,
  status text null default 'draft'::text,
  author_id uuid null,
  published_at timestamp with time zone null,
  meta_title text null,
  meta_description text null,
  tags text[] null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint blogs_pkey primary key (id),
  constraint blogs_slug_key unique (slug),
  constraint blogs_author_id_fkey foreign KEY (author_id) references auth.users (id) on delete set null,
  constraint blogs_category_check check (
    (
      category = any (
        array[
          'technology'::text,
          'business'::text,
          'tutorials'::text,
          'news'::text,
          'general'::text
        ]
      )
    )
  ),
  constraint blogs_status_check check (
    (
      status = any (
        array[
          'draft'::text,
          'published'::text,
          'archived'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_blogs_status on public.blogs using btree (status) TABLESPACE pg_default;

create index IF not exists idx_blogs_published_at on public.blogs using btree (published_at) TABLESPACE pg_default;

create index IF not exists idx_blogs_category on public.blogs using btree (category) TABLESPACE pg_default;

create index IF not exists idx_blogs_slug on public.blogs using btree (slug) TABLESPACE pg_default;

create trigger update_blogs_updated_at BEFORE
update on blogs for EACH row
execute FUNCTION update_updated_at_column ();



create table public.clients (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  name character varying(255) not null,
  email character varying(255) null,
  phone character varying(50) null,
  address text null,
  city character varying(100) null,
  country character varying(100) null,
  postal_code character varying(20) null,
  client_type character varying(50) null default 'individual'::character varying,
  contact_person character varying(255) null,
  company_size character varying(50) null,
  vat_number character varying(100) null,
  peppol_id character varying(100) null,
  peppol_enabled boolean null default false,
  communication_preferences jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint clients_pkey primary key (id),
  constraint clients_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_clients_user_id on public.clients using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_clients_email on public.clients using btree (email) TABLESPACE pg_default;

-- Unique constraint: Each user cannot have duplicate email addresses
-- Allows NULL emails but prevents duplicate non-NULL emails per user
-- Case-insensitive and whitespace-insensitive
create unique index IF not exists idx_clients_user_email_unique 
on public.clients (user_id, LOWER(TRIM(email)))
where email IS NOT NULL AND TRIM(email) != '';

create index IF not exists idx_clients_name on public.clients using btree (name) TABLESPACE pg_default;

create index IF not exists idx_clients_client_type on public.clients using btree (client_type) TABLESPACE pg_default;

create index IF not exists idx_clients_is_active on public.clients using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_clients_created_at on public.clients using btree (created_at) TABLESPACE pg_default;

create trigger update_clients_updated_at BEFORE
update on clients for EACH row
execute FUNCTION update_updated_at_column ();



create table public.company_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  profile_id uuid null,
  company_name character varying(255) not null,
  logo_path character varying(500) null,
  logo_filename character varying(255) null,
  logo_size integer null,
  logo_mime_type character varying(100) null,
  signature_path character varying(500) null,
  signature_filename character varying(255) null,
  signature_size integer null,
  signature_mime_type character varying(100) null,
  address text null,
  city character varying(100) null,
  state character varying(100) null,
  country character varying(100) null,
  postal_code character varying(20) null,
  phone character varying(50) null,
  email character varying(255) null,
  website character varying(255) null,
  vat_number character varying(100) null,
  is_default boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  iban character varying(34) null,
  account_name character varying(255) null,
  bank_name character varying(255) null,
  constraint company_profiles_pkey primary key (id),
  constraint company_profiles_profile_id_fkey foreign KEY (profile_id) references user_profiles (id) on delete CASCADE,
  constraint company_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_user_id on public.company_profiles using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_profile_id on public.company_profiles using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_is_default on public.company_profiles using btree (is_default) TABLESPACE pg_default;

create index IF not exists idx_company_profiles_iban on public.company_profiles using btree (iban) TABLESPACE pg_default
where
  (iban is not null);

create trigger update_company_profiles_updated_at BEFORE
update on company_profiles for EACH row
execute FUNCTION update_updated_at_column ();


create table public.credit_insurance_applications (
  id uuid not null default gen_random_uuid (),
  company_name character varying(255) not null,
  contact_person character varying(255) not null,
  email character varying(255) not null,
  telephone character varying(50) not null,
  address text not null,
  sector character varying(100) not null,
  activity_description text not null,
  annual_turnover numeric(15, 2) not null,
  top_customers text not null,
  status character varying(50) null default 'pending'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint credit_insurance_applications_pkey primary key (id),
  constraint credit_insurance_applications_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'approved'::character varying,
            'rejected'::character varying,
            'processing'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_credit_insurance_applications_email on public.credit_insurance_applications using btree (email) TABLESPACE pg_default;

create index IF not exists idx_credit_insurance_applications_status on public.credit_insurance_applications using btree (status) TABLESPACE pg_default;

create index IF not exists idx_credit_insurance_applications_created_at on public.credit_insurance_applications using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_credit_insurance_applications_sector on public.credit_insurance_applications using btree (sector) TABLESPACE pg_default;

create trigger update_credit_insurance_applications_updated_at BEFORE
update on credit_insurance_applications for EACH row
execute FUNCTION update_credit_updated_at_column ();



create table public.email_outbox (
  id uuid not null default gen_random_uuid (),
  quote_id uuid null,
  user_id uuid null,
  follow_up_id uuid null,
  to_email character varying(255) not null,
  subject text not null,
  html text null,
  text text null,
  status character varying(50) null default 'pending'::character varying,
  email_type character varying(100) null,
  attempts integer null default 0,
  sent_at timestamp with time zone null,
  last_error text null,
  meta jsonb null default '{}'::jsonb,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  invoice_id uuid null,
  constraint email_outbox_pkey primary key (id),
  constraint email_outbox_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint email_outbox_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint email_outbox_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint email_outbox_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'sending'::character varying,
            'sent'::character varying,
            'failed'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_email_outbox_status on public.email_outbox using btree (status) TABLESPACE pg_default;

create index IF not exists idx_email_outbox_quote_id on public.email_outbox using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_email_outbox_user_id on public.email_outbox using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_email_outbox_created_at on public.email_outbox using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_email_outbox_invoice_id on public.email_outbox using btree (invoice_id) TABLESPACE pg_default;


create table public.email_template_variables (
  id uuid not null default gen_random_uuid (),
  variable_name character varying(100) not null,
  description text null,
  example_value text null,
  is_required boolean null default false,
  created_at timestamp with time zone null default now(),
  constraint email_template_variables_pkey primary key (id),
  constraint email_template_variables_variable_name_key unique (variable_name)
) TABLESPACE pg_default;




create table public.email_templates (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  template_type character varying(100) not null,
  template_name character varying(255) not null,
  subject text not null,
  html_content text not null,
  text_content text not null,
  variables jsonb null default '{}'::jsonb,
  is_active boolean null default true,
  is_default boolean null default false,
  language character varying(10) null default 'fr'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint email_templates_pkey primary key (id),
  constraint email_templates_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_email_templates_user_id on public.email_templates using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_email_templates_template_type on public.email_templates using btree (template_type) TABLESPACE pg_default;

create index IF not exists idx_email_templates_is_default on public.email_templates using btree (is_default) TABLESPACE pg_default;

create index IF not exists idx_email_templates_language on public.email_templates using btree (language) TABLESPACE pg_default;

create index IF not exists idx_email_templates_is_active on public.email_templates using btree (is_active) TABLESPACE pg_default;


create table public.expense_invoices (
  id serial not null,
  invoice_number character varying(100) not null,
  supplier_name character varying(255) not null,
  supplier_email character varying(255) null,
  supplier_vat_number character varying(50) null,
  amount numeric(10, 2) not null,
  net_amount numeric(10, 2) null,
  vat_amount numeric(10, 2) null,
  status character varying(20) null default 'pending'::character varying,
  category text null,
  source character varying(20) null default 'manual'::character varying,
  issue_date date not null,
  due_date date not null,
  payment_method character varying(100) null,
  notes text null,
  created_at timestamp without time zone null default CURRENT_TIMESTAMP,
  updated_at timestamp without time zone null default CURRENT_TIMESTAMP,
  peppol_enabled boolean null default false,
  peppol_message_id character varying(255) null,
  peppol_received_at timestamp without time zone null,
  ubl_xml text null,
  sender_peppol_id character varying(100) null,
  peppol_metadata jsonb null default '{}'::jsonb,
  user_id uuid null,
  constraint expense_invoices_pkey primary key (id),
  constraint expense_invoices_invoice_number_key unique (invoice_number),
  constraint expense_invoices_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint expense_invoices_source_check check (
    (
      (source)::text = any (
        (
          array[
            'manual'::character varying,
            'peppol'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint expense_invoices_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'paid'::character varying,
            'overdue'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_status on public.expense_invoices using btree (status) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_category on public.expense_invoices using btree (category) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_issue_date on public.expense_invoices using btree (issue_date) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_peppol_enabled on public.expense_invoices using btree (peppol_enabled) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_peppol_message_id on public.expense_invoices using btree (peppol_message_id) TABLESPACE pg_default;

create index IF not exists idx_expense_invoices_user_id on public.expense_invoices using btree (user_id) TABLESPACE pg_default;

create trigger update_expense_invoices_updated_at BEFORE
update on expense_invoices for EACH row
execute FUNCTION update_updated_at_expense_column ();


create table public.invoice_events (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  user_id uuid not null,
  type character varying(50) not null,
  meta jsonb null default '{}'::jsonb,
  timestamp timestamp with time zone null default now(),
  constraint invoice_events_pkey primary key (id),
  constraint invoice_events_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_events_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_invoice_events_invoice_id on public.invoice_events using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_events_user_id on public.invoice_events using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_events_timestamp on public.invoice_events using btree ("timestamp") TABLESPACE pg_default;

create index IF not exists idx_invoice_events_type on public.invoice_events using btree (type) TABLESPACE pg_default;



create table public.invoice_follow_ups (
  id uuid not null default gen_random_uuid (),
  invoice_id uuid not null,
  user_id uuid not null,
  client_id uuid null,
  stage smallint not null default 1,
  scheduled_at timestamp with time zone not null,
  next_attempt_at timestamp with time zone null,
  attempts smallint not null default 0,
  max_attempts smallint not null default 3,
  status character varying(20) not null default 'pending'::character varying,
  channel character varying(20) not null default 'email'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  automated boolean not null default true,
  template_subject text null,
  template_text text null,
  template_html text null,
  meta jsonb null default '{}'::jsonb,
  template_id uuid null,
  template_variables jsonb null default '{}'::jsonb,
  last_error text null,
  last_attempt timestamp with time zone null,
  constraint invoice_follow_ups_pkey primary key (id),
  constraint invoice_follow_ups_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint invoice_follow_ups_invoice_id_fkey foreign KEY (invoice_id) references invoices (id) on delete CASCADE,
  constraint invoice_follow_ups_template_id_fkey foreign KEY (template_id) references email_templates (id) on delete set null,
  constraint invoice_follow_ups_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_invoice_id on public.invoice_follow_ups using btree (invoice_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_user_id on public.invoice_follow_ups using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_client_id on public.invoice_follow_ups using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_scheduled_at on public.invoice_follow_ups using btree (scheduled_at) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_status on public.invoice_follow_ups using btree (status) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_stage on public.invoice_follow_ups using btree (stage) TABLESPACE pg_default;

create index IF not exists idx_invoice_follow_ups_template_id on public.invoice_follow_ups using btree (template_id) TABLESPACE pg_default;




create table public.invoices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  client_id uuid null,
  quote_id uuid null,
  invoice_number character varying(50) not null,
  quote_number character varying(50) null,
  title text null,
  description text null,
  status character varying(50) null default 'unpaid'::character varying,
  amount numeric(15, 2) not null,
  tax_amount numeric(15, 2) null default 0,
  discount_amount numeric(15, 2) null default 0,
  final_amount numeric(15, 2) not null,
  issue_date date not null default CURRENT_DATE,
  due_date date not null,
  payment_method character varying(100) null,
  payment_terms text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  paid_at timestamp with time zone null,
  converted_from_quote_at timestamp with time zone null default now(),
  net_amount numeric(15, 2) null default 0,
  peppol_enabled boolean null default false,
  peppol_message_id character varying(255) null,
  peppol_status character varying(50) null default 'not_sent'::character varying,
  peppol_sent_at timestamp with time zone null,
  peppol_delivered_at timestamp with time zone null,
  peppol_error_message text null,
  ubl_xml text null,
  receiver_peppol_id character varying(100) null,
  peppol_metadata jsonb null default '{}'::jsonb,
  constraint invoices_pkey primary key (id),
  constraint invoices_user_id_invoice_number_key unique (user_id, invoice_number),
  constraint invoices_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete set null,
  constraint invoices_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint invoices_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint invoices_peppol_status_check check (
    (
      (peppol_status)::text = any (
        (
          array[
            'not_sent'::character varying,
            'sending'::character varying,
            'sent'::character varying,
            'delivered'::character varying,
            'failed'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint invoices_status_check check (
    (
      (status)::text = any (
        (
          array[
            'unpaid'::character varying,
            'paid'::character varying,
            'overdue'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_invoices_user_id on public.invoices using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_invoices_client_id on public.invoices using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_invoices_quote_id on public.invoices using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_invoices_invoice_number on public.invoices using btree (invoice_number) TABLESPACE pg_default;

create index IF not exists idx_invoices_status on public.invoices using btree (status) TABLESPACE pg_default;

create index IF not exists idx_invoices_due_date on public.invoices using btree (due_date) TABLESPACE pg_default;

create index IF not exists idx_invoices_created_at on public.invoices using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_invoices_peppol_enabled on public.invoices using btree (peppol_enabled) TABLESPACE pg_default;

create index IF not exists idx_invoices_peppol_status on public.invoices using btree (peppol_status) TABLESPACE pg_default;

create index IF not exists idx_invoices_peppol_message_id on public.invoices using btree (peppol_message_id) TABLESPACE pg_default;

create index IF not exists idx_invoices_user_id_invoice_number on public.invoices using btree (user_id, invoice_number) TABLESPACE pg_default;

create index IF not exists idx_invoices_net_amount on public.invoices using btree (net_amount) TABLESPACE pg_default;

create trigger update_invoices_updated_at BEFORE
update on invoices for EACH row
execute FUNCTION update_invoice_updated_at_column ();



create table public.lead_assignments (
  id uuid not null default gen_random_uuid (),
  lead_id uuid not null,
  artisan_user_id uuid not null,
  artisan_profile_id uuid null,
  assigned_at timestamp with time zone null default now(),
  status character varying(50) null default 'assigned'::character varying,
  quote_id uuid null,
  quote_sent_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint lead_assignments_pkey primary key (id),
  constraint lead_assignments_lead_id_artisan_user_id_key unique (lead_id, artisan_user_id),
  constraint lead_assignments_artisan_profile_id_fkey foreign KEY (artisan_profile_id) references user_profiles (id) on delete set null,
  constraint lead_assignments_artisan_user_id_fkey foreign KEY (artisan_user_id) references users (id) on delete CASCADE,
  constraint lead_assignments_lead_id_fkey foreign KEY (lead_id) references lead_requests (id) on delete CASCADE,
  constraint lead_assignments_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_lead_assignments_lead_id on public.lead_assignments using btree (lead_id) TABLESPACE pg_default;

create index IF not exists idx_lead_assignments_artisan_user_id on public.lead_assignments using btree (artisan_user_id) TABLESPACE pg_default;

create index IF not exists idx_lead_assignments_status on public.lead_assignments using btree (status) TABLESPACE pg_default;

create index IF not exists idx_lead_assignments_assigned_at on public.lead_assignments using btree (assigned_at) TABLESPACE pg_default;


create table public.lead_notifications (
  id uuid not null default gen_random_uuid (),
  lead_id uuid not null,
  artisan_user_id uuid not null,
  type character varying(50) not null,
  channel character varying(50) null default 'email'::character varying,
  subject text null,
  message text null,
  status character varying(50) null default 'pending'::character varying,
  sent_at timestamp with time zone null,
  delivered_at timestamp with time zone null,
  error_message text null,
  created_at timestamp with time zone null default now(),
  constraint lead_notifications_pkey primary key (id),
  constraint lead_notifications_artisan_user_id_fkey foreign KEY (artisan_user_id) references users (id) on delete CASCADE,
  constraint lead_notifications_lead_id_fkey foreign KEY (lead_id) references lead_requests (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lead_notifications_lead_id on public.lead_notifications using btree (lead_id) TABLESPACE pg_default;

create index IF not exists idx_lead_notifications_artisan_user_id on public.lead_notifications using btree (artisan_user_id) TABLESPACE pg_default;

create index IF not exists idx_lead_notifications_status on public.lead_notifications using btree (status) TABLESPACE pg_default;



create table public.lead_quotes (
  id uuid not null default gen_random_uuid (),
  lead_id uuid not null,
  artisan_user_id uuid not null,
  artisan_profile_id uuid null,
  quote_id uuid null,
  quote_amount numeric(15, 2) null,
  quote_currency character varying(3) null default 'EUR'::character varying,
  status character varying(50) null default 'sent'::character varying,
  viewed_at timestamp with time zone null,
  responded_at timestamp with time zone null,
  client_response text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint lead_quotes_pkey primary key (id),
  constraint lead_quotes_lead_id_artisan_user_id_key unique (lead_id, artisan_user_id),
  constraint lead_quotes_artisan_profile_id_fkey foreign KEY (artisan_profile_id) references user_profiles (id) on delete set null,
  constraint lead_quotes_artisan_user_id_fkey foreign KEY (artisan_user_id) references users (id) on delete CASCADE,
  constraint lead_quotes_lead_id_fkey foreign KEY (lead_id) references lead_requests (id) on delete CASCADE,
  constraint lead_quotes_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_lead_quotes_lead_id on public.lead_quotes using btree (lead_id) TABLESPACE pg_default;

create index IF not exists idx_lead_quotes_artisan_user_id on public.lead_quotes using btree (artisan_user_id) TABLESPACE pg_default;

create index IF not exists idx_lead_quotes_status on public.lead_quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_lead_quotes_created_at on public.lead_quotes using btree (created_at) TABLESPACE pg_default;

create trigger trigger_update_lead_status_on_max_quotes
after INSERT on lead_quotes for EACH row
execute FUNCTION update_lead_status_on_max_quotes ();



create table public.lead_requests (
  id uuid not null default gen_random_uuid (),
  project_categories text[] not null default '{}'::text[],
  custom_category text null,
  project_description text not null,
  price_range character varying(50) null,
  completion_date date null,
  country character varying(2) not null default 'BE'::character varying,
  region character varying(100) not null,
  street_number character varying(50) null,
  full_address text not null,
  city character varying(100) null default 'N/A'::character varying,
  zip_code character varying(20) not null,
  client_name character varying(255) not null,
  client_email character varying(255) not null,
  client_phone character varying(50) not null,
  client_address text not null,
  communication_preferences jsonb null default '{"sms": false, "email": true, "phone": false}'::jsonb,
  project_images text[] null default '{}'::text[],
  status character varying(50) null default 'active'::character varying,
  is_public boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  is_spam boolean null default false,
  spam_reason text null,
  reported_by_user_id uuid null,
  reported_at timestamp with time zone null,
  spam_reviewed_by uuid null,
  spam_reviewed_at timestamp with time zone null,
  spam_review_status character varying(50) null default 'pending'::character varying,
  constraint lead_requests_pkey primary key (id),
  constraint lead_requests_reported_by_user_id_fkey foreign KEY (reported_by_user_id) references users (id) on delete set null,
  constraint lead_requests_spam_reviewed_by_fkey foreign KEY (spam_reviewed_by) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_status on public.lead_requests using btree (status) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_country on public.lead_requests using btree (country) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_region on public.lead_requests using btree (region) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_city on public.lead_requests using btree (city) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_zip_code on public.lead_requests using btree (zip_code) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_created_at on public.lead_requests using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_categories on public.lead_requests using gin (project_categories) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_location on public.lead_requests using btree (
  country,
  region,
  COALESCE(city, 'N/A'::character varying)
) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_is_spam on public.lead_requests using btree (is_spam) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_spam_review_status on public.lead_requests using btree (spam_review_status) TABLESPACE pg_default;

create index IF not exists idx_lead_requests_reported_by on public.lead_requests using btree (reported_by_user_id) TABLESPACE pg_default;

create trigger trigger_auto_assign_lead
after INSERT on lead_requests for EACH row
execute FUNCTION auto_assign_lead_to_artisans ();




create table public.lead_spam_reports (
  id uuid not null default gen_random_uuid (),
  lead_id uuid not null,
  reported_by_user_id uuid not null,
  reason text not null,
  report_type character varying(50) null default 'spam'::character varying,
  additional_details text null,
  reviewed_by uuid null,
  reviewed_at timestamp with time zone null,
  review_status character varying(50) null default 'pending'::character varying,
  review_notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint lead_spam_reports_pkey primary key (id),
  constraint lead_spam_reports_lead_id_reported_by_user_id_key unique (lead_id, reported_by_user_id),
  constraint lead_spam_reports_lead_id_fkey foreign KEY (lead_id) references lead_requests (id) on delete CASCADE,
  constraint lead_spam_reports_reported_by_user_id_fkey foreign KEY (reported_by_user_id) references users (id) on delete CASCADE,
  constraint lead_spam_reports_reviewed_by_fkey foreign KEY (reviewed_by) references users (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_lead_spam_reports_lead_id on public.lead_spam_reports using btree (lead_id) TABLESPACE pg_default;

create index IF not exists idx_lead_spam_reports_reported_by on public.lead_spam_reports using btree (reported_by_user_id) TABLESPACE pg_default;

create index IF not exists idx_lead_spam_reports_review_status on public.lead_spam_reports using btree (review_status) TABLESPACE pg_default;

create index IF not exists idx_lead_spam_reports_created_at on public.lead_spam_reports using btree (created_at) TABLESPACE pg_default;



create table public.payment_records (
  id uuid not null default gen_random_uuid (),
  subscription_id uuid null,
  user_id uuid not null,
  stripe_payment_intent_id character varying(255) null,
  stripe_invoice_id character varying(255) null,
  amount numeric(10, 2) not null,
  currency character varying(3) null default 'EUR'::character varying,
  status character varying(50) not null,
  payment_method character varying(100) null,
  description text null,
  paid_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint payment_records_pkey primary key (id),
  constraint payment_records_stripe_payment_intent_id_key unique (stripe_payment_intent_id),
  constraint payment_records_subscription_id_fkey foreign KEY (subscription_id) references subscriptions (id) on delete CASCADE,
  constraint payment_records_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_payment_records_subscription_id on public.payment_records using btree (subscription_id) TABLESPACE pg_default;

create index IF not exists idx_payment_records_user_id on public.payment_records using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_payment_records_stripe_payment_intent_id on public.payment_records using btree (stripe_payment_intent_id) TABLESPACE pg_default;

create index IF not exists idx_payment_records_status on public.payment_records using btree (status) TABLESPACE pg_default;

create index IF not exists idx_payment_records_created_at on public.payment_records using btree (created_at) TABLESPACE pg_default;


create table public.peppol_invoices (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  invoice_number character varying(100) not null,
  document_type character varying(50) not null default 'INVOICE'::character varying,
  reference_number character varying(100) null,
  direction character varying(10) not null,
  sender_id uuid null,
  sender_peppol_id character varying(100) null,
  sender_name character varying(255) null,
  sender_vat_number character varying(50) null,
  sender_email character varying(255) null,
  receiver_id uuid null,
  receiver_peppol_id character varying(100) null,
  receiver_name character varying(255) null,
  receiver_vat_number character varying(50) null,
  receiver_email character varying(255) null,
  issue_date date not null,
  due_date date null,
  delivery_date date null,
  payment_terms text null,
  buyer_reference character varying(100) null,
  currency character varying(3) null default 'EUR'::character varying,
  subtotal_amount numeric(15, 2) null default 0,
  tax_amount numeric(15, 2) null default 0,
  discount_amount numeric(15, 2) null default 0,
  total_amount numeric(15, 2) null default 0,
  ubl_xml text null,
  pdf_url text null,
  attachment_urls text[] null,
  status character varying(50) null default 'pending'::character varying,
  peppol_message_id character varying(255) null,
  transmission_id character varying(255) null,
  error_message text null,
  retry_count integer null default 0,
  sent_at timestamp with time zone null,
  delivered_at timestamp with time zone null,
  received_at timestamp with time zone null,
  processed_at timestamp with time zone null,
  failed_at timestamp with time zone null,
  notes text null,
  metadata jsonb null default '{}'::jsonb,
  client_invoice_id uuid null,
  supplier_invoice_id integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint peppol_invoices_pkey primary key (id),
  constraint peppol_invoices_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint peppol_invoices_supplier_invoice_id_fkey foreign KEY (supplier_invoice_id) references expense_invoices (id) on delete set null,
  constraint peppol_invoices_client_invoice_id_fkey foreign KEY (client_invoice_id) references invoices (id) on delete set null,
  constraint peppol_invoices_receiver_id_fkey foreign KEY (receiver_id) references peppol_participants (id) on delete set null,
  constraint peppol_invoices_sender_id_fkey foreign KEY (sender_id) references peppol_participants (id) on delete set null,
  constraint peppol_invoices_direction_check check (
    (
      (direction)::text = any (
        (
          array[
            'outbound'::character varying,
            'inbound'::character varying
          ]
        )::text[]
      )
    )
  ),
  constraint peppol_invoices_status_check check (
    (
      (status)::text = any (
        (
          array[
            'pending'::character varying,
            'sent'::character varying,
            'delivered'::character varying,
            'received'::character varying,
            'processed'::character varying,
            'failed'::character varying,
            'rejected'::character varying,
            'cancelled'::character varying
          ]
        )::text[]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_user_id on public.peppol_invoices using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_direction on public.peppol_invoices using btree (direction) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_status on public.peppol_invoices using btree (status) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_peppol_message_id on public.peppol_invoices using btree (peppol_message_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_client_invoice_id on public.peppol_invoices using btree (client_invoice_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_invoices_supplier_invoice_id on public.peppol_invoices using btree (supplier_invoice_id) TABLESPACE pg_default;

create trigger update_peppol_invoices_updated_at BEFORE
update on peppol_invoices for EACH row
execute FUNCTION update_updated_at_column ();



create table public.peppol_participants (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  peppol_identifier character varying(100) not null,
  business_name character varying(255) not null,
  vat_number character varying(50) null,
  country_code character varying(2) not null,
  contact_name character varying(255) null,
  contact_email character varying(255) null,
  contact_phone character varying(50) null,
  street_address text null,
  city character varying(100) null,
  zip_code character varying(20) null,
  country character varying(100) null,
  supported_document_types text[] null default array[]::text[],
  is_registered boolean null default false,
  is_active boolean null default true,
  last_verified timestamp with time zone null,
  verification_status character varying(50) null default 'pending'::character varying,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint peppol_participants_pkey primary key (id),
  constraint peppol_participants_user_id_peppol_identifier_key unique (user_id, peppol_identifier),
  constraint peppol_participants_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_peppol_participants_user_id on public.peppol_participants using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_participants_peppol_id on public.peppol_participants using btree (peppol_identifier) TABLESPACE pg_default;

create trigger update_peppol_participants_updated_at BEFORE
update on peppol_participants for EACH row
execute FUNCTION update_updated_at_column ();



create table public.peppol_settings (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  peppol_id character varying(100) not null,
  business_name character varying(255) not null,
  country_code character varying(2) not null default 'BE'::character varying,
  contact_person_name character varying(255) null,
  contact_person_email character varying(255) null,
  contact_person_phone character varying(50) null,
  contact_person_language character varying(10) null default 'en-US'::character varying,
  supported_document_types text[] null default array['INVOICE'::text, 'CREDIT_NOTE'::text],
  limited_to_outbound_traffic boolean null default false,
  sandbox_mode boolean null default true,
  is_configured boolean null default false,
  is_active boolean null default true,
  last_tested timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  peppol_disabled boolean null default false,
  constraint peppol_settings_pkey primary key (id),
  constraint peppol_settings_peppol_id_key unique (peppol_id),
  constraint peppol_settings_user_id_key unique (user_id),
  constraint peppol_settings_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_peppol_settings_user_id on public.peppol_settings using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_settings_peppol_id on public.peppol_settings using btree (peppol_id) TABLESPACE pg_default;

create index IF not exists idx_peppol_settings_disabled on public.peppol_settings using btree (peppol_disabled) TABLESPACE pg_default
where
  (peppol_disabled = true);

create trigger update_peppol_settings_updated_at BEFORE
update on peppol_settings for EACH row
execute FUNCTION update_updated_at_column ();



create table public.predefined_materials (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category character varying(100) null,
  name character varying(255) not null,
  description text null,
  default_unit character varying(50) null,
  default_price numeric(15, 2) null,
  icon_name character varying(100) null,
  is_active boolean null default true,
  is_global boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint predefined_materials_pkey primary key (id),
  constraint predefined_materials_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_predefined_materials_user_id on public.predefined_materials using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_predefined_materials_category on public.predefined_materials using btree (category) TABLESPACE pg_default;

create index IF not exists idx_predefined_materials_is_global on public.predefined_materials using btree (is_global) TABLESPACE pg_default;

create trigger update_predefined_materials_updated_at BEFORE
update on predefined_materials for EACH row
execute FUNCTION update_updated_at_column ();



create table public.predefined_tasks (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  category character varying(100) null,
  title character varying(255) not null,
  description text null,
  default_duration numeric(10, 2) null,
  default_price numeric(15, 2) null,
  icon_name character varying(100) null,
  is_active boolean null default true,
  is_global boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint predefined_tasks_pkey primary key (id),
  constraint predefined_tasks_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_predefined_tasks_user_id on public.predefined_tasks using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_predefined_tasks_category on public.predefined_tasks using btree (category) TABLESPACE pg_default;

create index IF not exists idx_predefined_tasks_is_global on public.predefined_tasks using btree (is_global) TABLESPACE pg_default;

create trigger update_predefined_tasks_updated_at BEFORE
update on predefined_tasks for EACH row
execute FUNCTION update_updated_at_column ();


create table public.quote_access_logs (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  share_token character varying(100) null,
  action character varying(100) null,
  accessed_at timestamp with time zone null default now(),
  constraint quote_access_logs_pkey primary key (id),
  constraint quote_access_logs_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_quote_id on public.quote_access_logs using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_share_token on public.quote_access_logs using btree (share_token) TABLESPACE pg_default;

create index IF not exists idx_quote_access_logs_accessed_at on public.quote_access_logs using btree (accessed_at) TABLESPACE pg_default;



create table public.quote_drafts (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  profile_id uuid null,
  draft_data jsonb not null default '{}'::jsonb,
  last_saved timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  quote_number character varying(50) null,
  constraint quote_drafts_pkey primary key (id),
  constraint quote_drafts_quote_number_unique unique (user_id, profile_id, quote_number),
  constraint quote_drafts_profile_id_fkey foreign KEY (profile_id) references user_profiles (id) on delete CASCADE,
  constraint quote_drafts_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_user_id on public.quote_drafts using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_profile_id on public.quote_drafts using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_draft_data_gin on public.quote_drafts using gin (draft_data) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_user on public.quote_drafts using btree (user_id, profile_id, last_saved desc) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_quote_number on public.quote_drafts using btree (quote_number) TABLESPACE pg_default;

create index IF not exists idx_quote_drafts_user_profile_quote on public.quote_drafts using btree (user_id, profile_id, quote_number) TABLESPACE pg_default;

create trigger update_quote_drafts_updated_at BEFORE
update on quote_drafts for EACH row
execute FUNCTION update_updated_at_column ();


create table public.quote_events (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  user_id uuid null,
  type character varying(50) not null,
  meta jsonb null default '{}'::jsonb,
  timestamp timestamp with time zone null default now(),
  share_token character varying(100) null,
  constraint quote_events_pkey primary key (id),
  constraint quote_events_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_events_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint quote_events_user_id_check check (
    (
      (user_id is not null)
      or (
        (user_id is null)
        and (
          (type)::text = any (
            (
              array[
                'email_sent'::character varying,
                'system_event'::character varying,
                'quote_created'::character varying,
                'quote_updated'::character varying
              ]
            )::text[]
          )
        )
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_quote_events_quote_id on public.quote_events using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_events_user_id on public.quote_events using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quote_events_type on public.quote_events using btree (type) TABLESPACE pg_default;

create index IF not exists idx_quote_events_timestamp on public.quote_events using btree ("timestamp") TABLESPACE pg_default;

create index IF not exists idx_quote_events_share_token on public.quote_events using btree (share_token) TABLESPACE pg_default;


create table public.quote_files (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  file_name character varying(255) not null,
  file_path character varying(500) not null,
  file_size integer null,
  mime_type character varying(100) null,
  file_category character varying(100) null,
  uploaded_by uuid null,
  created_at timestamp with time zone null default now(),
  constraint quote_files_pkey primary key (id),
  constraint quote_files_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_files_uploaded_by_fkey foreign KEY (uploaded_by) references user_profiles (id) on delete set null
) TABLESPACE pg_default;

create index IF not exists idx_quote_files_quote_id on public.quote_files using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_files_file_category on public.quote_files using btree (file_category) TABLESPACE pg_default;


create table public.quote_financial_configs (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  vat_config jsonb null default '{}'::jsonb,
  advance_config jsonb null default '{}'::jsonb,
  marketing_banner jsonb null default '{}'::jsonb,
  payment_terms jsonb null default '{}'::jsonb,
  discount_config jsonb null default '{}'::jsonb,
  show_material_prices boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint quote_financial_configs_pkey primary key (id),
  constraint quote_financial_configs_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_financial_configs_quote_id on public.quote_financial_configs using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_financial_configs_vat_config_gin on public.quote_financial_configs using gin (vat_config) TABLESPACE pg_default;

create index IF not exists idx_quote_financial_configs_discount_config_gin on public.quote_financial_configs using gin (discount_config) TABLESPACE pg_default;

create trigger update_quote_financial_configs_updated_at BEFORE
update on quote_financial_configs for EACH row
execute FUNCTION update_updated_at_column ();


create table public.quote_follow_ups (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  user_id uuid not null,
  client_id uuid null,
  stage smallint not null,
  scheduled_at timestamp with time zone not null,
  next_attempt_at timestamp with time zone null,
  attempts smallint not null default 0,
  max_attempts smallint not null default 3,
  status character varying(20) not null default 'pending'::character varying,
  channel character varying(20) not null default 'email'::character varying,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  automated boolean not null default true,
  template_subject text null,
  template_text text null,
  template_html text null,
  meta jsonb null default '{}'::jsonb,
  constraint quote_follow_ups_pkey primary key (id),
  constraint quote_follow_ups_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint quote_follow_ups_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_follow_ups_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_quote_id on public.quote_follow_ups using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_user_id on public.quote_follow_ups using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quote_follow_ups_scheduled_at on public.quote_follow_ups using btree (scheduled_at) TABLESPACE pg_default;




create table public.quote_materials (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  quote_task_id uuid null,
  name character varying(255) not null,
  description text null,
  quantity numeric(10, 2) null default 1,
  unit character varying(50) null default 'piece'::character varying,
  unit_price numeric(15, 2) null default 0,
  total_price numeric(15, 2) null default 0,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint quote_materials_pkey primary key (id),
  constraint quote_materials_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE,
  constraint quote_materials_quote_task_id_fkey foreign KEY (quote_task_id) references quote_tasks (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_materials_quote_id on public.quote_materials using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_materials_quote_task_id on public.quote_materials using btree (quote_task_id) TABLESPACE pg_default;

create index IF not exists idx_quote_materials_order_index on public.quote_materials using btree (order_index) TABLESPACE pg_default;

create trigger update_quote_materials_updated_at BEFORE
update on quote_materials for EACH row
execute FUNCTION update_updated_at_column ();



create table public.quote_shares (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  share_token character varying(100) not null,
  access_count integer null default 0,
  last_accessed timestamp with time zone null,
  expires_at timestamp with time zone null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint quote_shares_pkey primary key (id),
  constraint quote_shares_share_token_key unique (share_token),
  constraint quote_shares_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_shares_quote_id on public.quote_shares using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_shares_share_token on public.quote_shares using btree (share_token) TABLESPACE pg_default;



create table public.quote_signatures (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  signer_name character varying(255) not null,
  signer_email character varying(255) null,
  signature_data text null,
  signature_mode character varying(50) null default 'draw'::character varying,
  signature_type character varying(50) null default 'client'::character varying,
  signature_file_path character varying(500) null,
  signature_filename character varying(255) null,
  signature_size integer null,
  signature_mime_type character varying(100) null,
  customer_comment text null,
  signed_at timestamp with time zone null default now(),
  created_at timestamp with time zone null default now(),
  constraint quote_signatures_pkey primary key (id),
  constraint quote_signatures_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_signatures_quote_id on public.quote_signatures using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_signatures_signer_email on public.quote_signatures using btree (signer_email) TABLESPACE pg_default;



create table public.quote_tasks (
  id uuid not null default gen_random_uuid (),
  quote_id uuid not null,
  name character varying(255) not null,
  description text null,
  quantity numeric(10, 2) null default 1,
  unit character varying(50) null default 'piece'::character varying,
  unit_price numeric(15, 2) null default 0,
  total_price numeric(15, 2) null default 0,
  duration numeric(10, 2) null,
  duration_unit character varying(20) null default 'minutes'::character varying,
  pricing_type character varying(50) null default 'flat'::character varying,
  hourly_rate numeric(15, 2) null,
  order_index integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint quote_tasks_pkey primary key (id),
  constraint quote_tasks_quote_id_fkey foreign KEY (quote_id) references quotes (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quote_tasks_quote_id on public.quote_tasks using btree (quote_id) TABLESPACE pg_default;

create index IF not exists idx_quote_tasks_order_index on public.quote_tasks using btree (order_index) TABLESPACE pg_default;

create index IF not exists idx_quote_tasks_pricing_type on public.quote_tasks using btree (pricing_type) TABLESPACE pg_default;

create trigger update_quote_tasks_updated_at BEFORE
update on quote_tasks for EACH row
execute FUNCTION update_updated_at_column ();


create table public.quotes (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  profile_id uuid null,
  company_profile_id uuid null,
  client_id uuid null,
  quote_number character varying(50) not null,
  title text null,
  description text null,
  status character varying(50) null default 'draft'::character varying,
  project_categories text[] null default '{}'::text[],
  custom_category text null,
  total_amount numeric(15, 2) null default 0,
  tax_amount numeric(15, 2) null default 0,
  discount_amount numeric(15, 2) null default 0,
  final_amount numeric(15, 2) null default 0,
  valid_until date null,
  terms_conditions text null,
  share_token character varying(100) null,
  is_public boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  start_date date null,
  accepted_at timestamp with time zone null,
  rejected_at timestamp with time zone null,
  sent_at timestamp with time zone null,
  rejection_reason text null,
  view_only_token character varying(100) null,
  constraint quotes_pkey primary key (id),
  constraint quotes_view_only_token_key unique (view_only_token),
  constraint quotes_share_token_key unique (share_token),
  constraint quotes_user_quote_number_key unique (user_id, quote_number),
  constraint quotes_client_id_fkey foreign KEY (client_id) references clients (id) on delete set null,
  constraint quotes_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint quotes_company_profile_id_fkey foreign KEY (company_profile_id) references company_profiles (id) on delete set null,
  constraint quotes_profile_id_fkey foreign KEY (profile_id) references user_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_quotes_sent_at on public.quotes using btree (sent_at) TABLESPACE pg_default;

create index IF not exists idx_quotes_rejection_reason on public.quotes using btree (rejection_reason) TABLESPACE pg_default;

create index IF not exists idx_quotes_user_id on public.quotes using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_profile_id on public.quotes using btree (profile_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_company_profile_id on public.quotes using btree (company_profile_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_client_id on public.quotes using btree (client_id) TABLESPACE pg_default;

create index IF not exists idx_quotes_quote_number on public.quotes using btree (quote_number) TABLESPACE pg_default;

create index IF not exists idx_quotes_status on public.quotes using btree (status) TABLESPACE pg_default;

create index IF not exists idx_quotes_share_token on public.quotes using btree (share_token) TABLESPACE pg_default;

create index IF not exists idx_quotes_valid_until on public.quotes using btree (valid_until) TABLESPACE pg_default;

create index IF not exists idx_quotes_created_at on public.quotes using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_quotes_is_public on public.quotes using btree (is_public) TABLESPACE pg_default;

create index IF not exists idx_quotes_project_categories_gin on public.quotes using gin (project_categories) TABLESPACE pg_default;

create index IF not exists idx_quotes_view_only_token on public.quotes using btree (view_only_token) TABLESPACE pg_default;



create table public.subscriptions (
  id uuid not null default gen_random_uuid (),
  user_id uuid not null,
  stripe_subscription_id character varying(255) null,
  stripe_customer_id character varying(255) null,
  plan_name character varying(100) not null,
  plan_type character varying(50) not null,
  status character varying(50) not null default 'trialing'::character varying,
  interval character varying(20) not null default 'monthly'::character varying,
  amount numeric(10, 2) not null,
  currency character varying(3) null default 'EUR'::character varying,
  current_period_start timestamp with time zone null,
  current_period_end timestamp with time zone null,
  trial_start timestamp with time zone null,
  trial_end timestamp with time zone null,
  cancel_at_period_end boolean null default false,
  cancelled_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint subscriptions_pkey primary key (id),
  constraint subscriptions_stripe_subscription_id_key unique (stripe_subscription_id),
  constraint subscriptions_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_user_id on public.subscriptions using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_stripe_subscription_id on public.subscriptions using btree (stripe_subscription_id) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_status on public.subscriptions using btree (status) TABLESPACE pg_default;

create index IF not exists idx_subscriptions_created_at on public.subscriptions using btree (created_at) TABLESPACE pg_default;

create trigger update_subscriptions_updated_at BEFORE
update on subscriptions for EACH row
execute FUNCTION update_subscription_updated_at_column ();



create table public.user_profiles (
  id uuid not null default gen_random_uuid (),
  user_id uuid null,
  name text not null,
  email text null,
  role text not null,
  avatar text null,
  permissions jsonb not null default '{}'::jsonb,
  pin text null,
  is_active boolean null default false,
  last_active timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint user_profiles_pkey primary key (id),
  constraint user_profiles_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_user_id on public.user_profiles using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_is_active on public.user_profiles using btree (is_active) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_role on public.user_profiles using btree (role) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_pin on public.user_profiles using btree (pin) TABLESPACE pg_default;

create index IF not exists idx_user_profiles_permissions_gin on public.user_profiles using gin (permissions) TABLESPACE pg_default;



create table public.users (
  id uuid not null,
  email text not null,
  first_name text null,
  last_name text null,
  company_name text null,
  phone text null,
  profession text null,
  country text null default 'FR'::text,
  business_size text null,
  selected_plan text null default 'pro'::text,
  subscription_status text null default 'trial'::text,
  stripe_customer_id text null,
  stripe_subscription_id text null,
  trial_start_date timestamp with time zone null,
  trial_end_date timestamp with time zone null,
  avatar_url text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  vat_number text null,
  role text null default 'admin'::text,
  last_login_at timestamp with time zone null,
  registration_completed boolean null default false,
  email_verified boolean null default false,
  email_verified_at timestamp with time zone null,
  analytics_objectives jsonb null default '{"clientTarget": null, "revenueTarget": null, "projectsTarget": null}'::jsonb,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE,
  constraint users_role_check check (
    (
      role = any (array['admin'::text, 'superadmin'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_users_analytics_objectives on public.users using gin (analytics_objectives) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_subscription_status on public.users using btree (subscription_status) TABLESPACE pg_default;

create index IF not exists idx_users_trial_end_date on public.users using btree (trial_end_date) TABLESPACE pg_default;

create index IF not exists idx_users_stripe_customer_id on public.users using btree (stripe_customer_id) TABLESPACE pg_default;

create index IF not exists idx_users_stripe_subscription_id on public.users using btree (stripe_subscription_id) TABLESPACE pg_default;

create index IF not exists idx_users_vat_number on public.users using btree (vat_number) TABLESPACE pg_default;

create index IF not exists idx_users_email_verified on public.users using btree (email_verified) TABLESPACE pg_default;



