# Client Management System Setup Guide

## Overview
This guide explains how to set up and use the client management system with Supabase backend integration.

## Features Implemented

### Backend (Supabase)
- ✅ Complete CRUD operations for clients
- ✅ Row Level Security (RLS) policies
- ✅ Field mapping between frontend and database
- ✅ Enhanced error handling
- ✅ Client statistics and analytics
- ✅ Location-based filtering
- ✅ Status management

### Frontend
- ✅ Client creation/editing forms
- ✅ All database fields included (city, country, postal code)
- ✅ Professional vs Individual client types
- ✅ PEPPOL e-invoicing support
- ✅ Communication preferences
- ✅ Search and filtering
- ✅ Client analytics dashboard

## Database Schema
The system uses the `clients` table with the following structure:

```sql
- id (UUID, Primary Key)
- user_id (UUID, Foreign Key to users)
- name (VARCHAR)
- email (VARCHAR)
- phone (VARCHAR)
- address (TEXT)
- city (VARCHAR)
- country (VARCHAR)
- postal_code (VARCHAR)
- client_type (VARCHAR: 'individual', 'company', 'government')
- contact_person (VARCHAR)
- company_size (VARCHAR)
- vat_number (VARCHAR)
- peppol_id (VARCHAR)
- peppol_enabled (BOOLEAN)
- communication_preferences (JSONB)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## Environment Setup

### 1. Supabase Configuration
Create a `.env` file in your project root with:

```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Setup
Run the `clients_schema.sql` file in your Supabase SQL editor to create the table and policies.

### 3. Authentication
The system uses Supabase authentication with RLS policies ensuring users can only access their own clients.

## Usage

### Creating a New Client
1. Navigate to Client Management
2. Click "Nouveau Client"
3. Fill in the required fields:
   - Basic information (name, email, phone)
   - Address details (address, city, country, postal code)
   - Professional details (if applicable)
   - PEPPOL configuration (optional)
   - Communication preferences

### Editing a Client
1. Click on any client card
2. Modify the required fields
3. Save changes

### Client Types
- **Individual**: Basic client information
- **Professional**: Additional company details including:
  - Contact person
  - Company size
  - VAT/Registration number
  - PEPPOL e-invoicing support

## API Endpoints

The client service provides these functions:

```javascript
// Fetch all clients for current user
fetchClients()

// Fetch single client by ID
fetchClientById(id)

// Create new client
createClient(clientData)

// Update existing client
updateClient(id, clientData)

// Delete client
deleteClient(id)

// Search clients
searchClients(query)

// Get client statistics
getClientStatistics()

// Toggle client status
toggleClientStatus(id, isActive)

// Get clients by location
getClientsByLocation(location)
```

## Field Mapping

The service automatically maps frontend field names to database column names:

| Frontend | Database |
|----------|----------|
| `name` | `name` |
| `type` | `client_type` |
| `email` | `email` |
| `phone` | `phone` |
| `address` | `address` |
| `city` | `city` |
| `country` | `country` |
| `postalCode` | `postal_code` |
| `contactPerson` | `contact_person` |
| `companySize` | `company_size` |
| `regNumber` | `vat_number` |
| `peppolId` | `peppol_id` |
| `enablePeppol` | `peppol_enabled` |
| `preferences` | `communication_preferences` |

## Security Features

- **Row Level Security (RLS)**: Users can only access their own clients
- **Input Validation**: Frontend validation for required fields
- **PEPPOL ID Validation**: Format validation for e-invoicing IDs
- **Error Handling**: Comprehensive error handling and user feedback

## Troubleshooting

### Common Issues

1. **Authentication Errors**: Ensure Supabase auth is properly configured
2. **Permission Denied**: Check RLS policies are enabled
3. **Field Mapping Errors**: Verify database schema matches the expected structure
4. **Missing Environment Variables**: Check `.env` file configuration

### Development Mode
The system includes fallback mock data for development when the backend is unavailable.

## Future Enhancements

- Bulk client import/export
- Advanced analytics and reporting
- Client relationship management
- Integration with accounting systems
- Multi-language support expansion
