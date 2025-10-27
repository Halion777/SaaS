# Digiteal Peppol Access Point API Documentation

Complete API reference for Digiteal Peppol Access Point integration.

**Base URL:** `https://test.digiteal.eu`  
**Authentication:** Basic Auth  
**Username:** `haliqo-test`  
**Password:** `Haliqo123`

---

## 📋 Table of Contents

### Public APIs (No Authentication Required)
1. [Get Supported Document Types](#1-get-supported-document-types-public) - `GET /api/v1/peppol/public/supported-document-types`
2. [Get Detailed Participant Information](#2-get-detailed-participant-information-public) - `GET /api/v1/peppol/public/participants/{peppolIdentifier}`
3. [Validate Document](#3-validate-document-public) - `POST /api/v1/peppol/public/validate-document`

### Authenticated APIs
4. [Get Participants](#4-get-participants) - `GET /api/v1/peppol/registered-participants`
5. [Get Participant by ID](#5-get-participant-by-id) - `GET /api/v1/peppol/registered-participants/{peppolIdentifier}`
6. [Register Participant](#6-register-participant) - `POST /api/v1/peppol/registered-participants`
7. [Unregister Participant](#7-unregister-participant) - `DELETE /api/v1/peppol/registered-participants/{peppolIdentifier}`
8. [Send UBL Document](#8-send-ubl-document) - `POST /api/v1/peppol/outbound-ubl-documents`
9. [Get Supported Documents for Participant](#9-get-supported-documents-for-participant) - `GET /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types`
10. [Add Supported Document Type](#10-add-supported-document-type) - `POST /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}`
11. [Remove Supported Document Type](#11-remove-supported-document-type) - `DELETE /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}`
12. [Get Webhook Configuration](#12-get-webhook-configuration) - `GET /api/v1/webhook`
13. [Update Webhook Configuration](#13-update-webhook-configuration) - `POST /api/v1/webhook/configuration`

---

## 1. Get Supported Document Types (Public)

**Public API - No authentication required**

### Endpoint
```
GET https://test.digiteal.eu/api/v1/peppol/public/supported-document-types
```

### Description
Get list of supported Peppol document types. This is a public endpoint that doesn't require authentication.

### Headers
No headers required.

### Example Response
```json
{
  "documentTypes": [
    {
      "type": "INVOICE",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1",
      "currentSpecVersion": "2024.11",
      "futureSpecVersion": "2025.5"
    },
    {
      "type": "CREDIT_NOTE",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1",
      "currentSpecVersion": "2024.11",
      "futureSpecVersion": "2025.5"
    },
    {
      "type": "SELF_BILLING_INVOICE",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:selfbilling:3.0::2.1",
      "currentSpecVersion": "2025.3"
    },
    {
      "type": "SELF_BILLING_CREDIT_NOTE",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:selfbilling:3.0::2.1",
      "currentSpecVersion": "2025.3"
    },
    {
      "type": "MLR",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2::ApplicationResponse##urn:fdc:peppol.eu:poacc:trns:mlr:3::2.1",
      "currentSpecVersion": "2024.11",
      "futureSpecVersion": "2025.5"
    },
    {
      "type": "INVOICE_RESPONSE",
      "fullType": "urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2::ApplicationResponse##urn:fdc:peppol.eu:poacc:trns:invoice_response:3::2.1",
      "currentSpecVersion": "2024.11",
      "futureSpecVersion": "2025.5"
    }
  ]
}
```

---

## 2. Get Detailed Participant Information (Public)

**Public API - No authentication required**

### Endpoint
```
GET https://test.digiteal.eu/api/v1/peppol/public/participants/{peppolIdentifier}
```

### Description
Get detailed participant information from the Peppol network. This is a public endpoint that doesn't require authentication.

### Headers
No headers required.

### URL Parameters
- `peppolIdentifier` (required) - The Peppol identifier (e.g., `9925:be1009915104`)

### Example
```
GET https://test.digiteal.eu/api/v1/peppol/public/participants/9925:be1009915104
```

### Response
Returns participant information including:
- Participant details
- Supported document types
- Service metadata
- Access point information

---

## 3. Validate Document (Public)

**Public API - No authentication required**

### Endpoint
```
POST https://test.digiteal.eu/api/v1/peppol/public/validate-document
```

### Description
Validate a UBL document file against Peppol specifications. This is a public endpoint that doesn't require authentication.

### Headers
```
Content-Type: multipart/form-data
```

### Request Body
- `file` (required) - UBL XML document file to validate

### Body Type
`multipart/form-data`

### ⚠️ Important: Upload UBL XML Files Only
- ✅ **ONLY** UBL XML documents (`.xml` files)
- ❌ **NO** PDF files - You must convert PDFs to UBL XML first
- ✅ Use this API to validate your UBL before sending

### How to Test in Postman:
1. Select **Body** tab
2. Choose **form-data**
3. Key: `file`
4. Type: **File** (click dropdown)
5. Click **Select Files** and choose your **UBL XML** file
6. Click **Send**

### Expected Response
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

Or if invalid:
```json
{
  "valid": false,
  "errors": [
    {
      "code": "INVALID_FORMAT",
      "message": "Document does not conform to Peppol specifications"
    }
  ],
  "warnings": []
}
```

---

## 4. Get Participants

### Endpoint
```
GET https://test.digiteal.eu/api/v1/peppol/registered-participants
```

### Description
Get list of all registered participants.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### Response
Returns array of participant objects.

---

## 5. Get Participant by ID

### Endpoint
```
GET https://test.digiteal.eu/api/v1/peppol/registered-participants/{participantId}
```

### Description
Get detailed information about a specific participant.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### URL Parameters
- `participantId` (required) - The participant identifier (e.g., `9925:be1009915104`)

### Example
```
GET https://test.digiteal.eu/api/v1/peppol/registered-participants/9925:be1009915104
```

---

## 6. Register Participant

### Endpoint
```
POST https://test.digiteal.eu/api/v1/peppol/registered-participants
```

### Description
Register a new participant to receive Peppol invoices/credit notes through Digiteal.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
Content-Type: application/json
```

### Request Body
```json
{
  "peppolIdentifier": "0208:0630675588",
  "name": "Haliqo Test Company",
  "countryCode": "BE",
  "contactPerson": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@digiteal.eu",
    "phoneNumber": "+321234567",
    "language": "en-US"
  },
  "limitedToOutboundTraffic": false,
  "supportedDocumentTypes": [
    "INVOICE",
    "CREDIT_NOTE",
    "INVOICE_RESPONSE",
    "SELF_BILLING_INVOICE",
    "SELF_BILLING_CREDIT_NOTE"
  ]
}
```

### Required Fields
- `peppolIdentifier` - PEPPOL identifier
- `contactPerson` (object) - Contact person details
  - `email` (required)
  - `firstName` (string)
  - `lastName` (string)
  - `phoneNumber` (string)
  - `language` (default: "en-US")

### Optional Fields
- `name` - Company name
- `countryCode` - Two-letter country code (e.g., "BE")
- `limitedToOutboundTraffic` - Boolean (default: false)
- `supportedDocumentTypes` - Array of supported document types

### Success Response (200)
```
The registration action was successful.
```

### Error Response (400)
```json
{
  "errorCode": "REGISTER_ALREADY_REGISTERED_TO_DIGITEAL",
  "errorMessage": "The participant was already registered through Digiteal"
}
```

---

## 7. Unregister Participant

### Endpoint
```
DELETE https://test.digiteal.eu/api/v1/peppol/registered-participants/{participantId}
```

### Description
Unregister a participant from receiving Peppol documents.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### URL Parameters
- `participantId` (required) - The participant identifier (e.g., `9925:be1009915104`)

### Example
```
DELETE https://test.digiteal.eu/api/v1/peppol/registered-participants/9925:be1009915104
```

---

## 8. Send UBL Document

### Endpoint
```
POST https://test.digiteal.eu/api/v1/peppol/outbound-ubl-documents
```

### Description
Send a UBL (Universal Business Language) document through Peppol network using file upload.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

**Note:** `Content-Type` header is automatically set to `multipart/form-data` by Postman when using form-data body.

### Request Body (multipart/form-data)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `document` | File | Yes | UBL XML document file to send |
| `comment` | String | No | Optional comment for the document |
| `id` | UUID | No | Optional UUID. If provided, will be used in SBDH; otherwise, document identifier in UBL will be used |

### How to Use in Postman:
1. Select **Body** tab
2. Choose **form-data**
3. Add fields:
   - Key: `document`, Type: **File**, Value: Select your UBL XML file
   - Key: `comment`, Type: **Text**, Value: (optional) Your comment
   - Key: `id`, Type: **Text**, Value: (optional) UUID string
4. Click **Send**

### ⚠️ Important: Document Format Requirements

**Peppol requires UBL (Universal Business Language) XML format, NOT PDF files.**

You **MUST** convert PDF invoices to UBL XML before uploading.

### Converting PDF to UBL XML

The UBL document must conform to Peppol BIS 3.0 specifications:

#### Supported Document Types:
- **INVOICE** - Standard invoice (`urn:oasis:names:specification:ubl:schema:xsd:Invoice-2`)
- **CREDIT_NOTE** - Credit note (`urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2`)
- **SELF_BILLING_INVOICE** - Self-billing invoice
- **SELF_BILLING_CREDIT_NOTE** - Self-billing credit note

#### Example UBL Invoice Structure:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <!-- Document ID -->
  <cbc:ID>INV-001</cbc:ID>
  
  <!-- Issue Date -->
  <cbc:IssueDate>2025-10-27</cbc:IssueDate>
  
  <!-- Invoice Type Code -->
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  
  <!-- Supplier Information -->
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Supplier Company Name</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Main Street</cbc:StreetName>
        <cbc:CityName>Brussels</cbc:CityName>
        <cbc:PostalZone>1000</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>BE</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>BE123456789</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
      <cac:PartyLegalEntity>
        <cbc:RegistrationName>Supplier Company</cbc:RegistrationName>
        <cac:CompanyID schemeID="BE">BE123456789</cac:CompanyID>
      </cac:PartyLegalEntity>
    </cac:Party>
  </cac:AccountingSupplierParty>
  
  <!-- Customer Information -->
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName>
        <cbc:Name>Customer Company Name</cbc:Name>
      </cac:PartyName>
      <cac:PostalAddress>
        <cbc:StreetName>Customer Street</cbc:StreetName>
        <cbc:CityName>Amsterdam</cbc:CityName>
        <cbc:PostalZone>1012</cbc:PostalZone>
        <cac:Country>
          <cbc:IdentificationCode>NL</cbc:IdentificationCode>
        </cac:Country>
      </cac:PostalAddress>
      <cac:PartyTaxScheme>
        <cbc:CompanyID>NL123456789B01</cbc:CompanyID>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:PartyTaxScheme>
    </cac:Party>
  </cac:AccountingCustomerParty>
  
  <!-- Tax Scheme -->
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="EUR">100.00</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
      <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>21</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  
  <!-- Monetary Total -->
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">100.00</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">121.00</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">121.00</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines -->
  <cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
    <cac:Item>
      <cbc:Name>Product or Service Name</cbc:Name>
      <cac:ClassifiedTaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>21</cbc:Percent>
        <cac:TaxScheme>
          <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
      </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
      <cbc:PriceAmount currencyID="EUR">100.00</cbc:PriceAmount>
    </cac:Price>
  </cac:InvoiceLine>
</Invoice>
```

### 📋 Required UBL Elements (Peppol BIS 3.0):
1. **Document ID** - Unique identifier
2. **Issue Date** - Invoice date
3. **Invoice Type Code** - Standard code (380 for invoice)
4. **Supplier Party** - Legal name, address, VAT number
5. **Customer Party** - Name, address, VAT number
6. **Tax Information** - Tax category, rate, amount
7. **Monetary Total** - Net, tax, gross amounts
8. **Invoice Lines** - Line items with description, quantity, price

### ⚡ Quick Tips:
- ✅ UBL XML files only (`.xml` extension)
- ❌ NO PDF files accepted
- ✅ Must comply with Peppol BIS 3.0
- ✅ Use the `validate-document` API to test before sending

### Success Response (200)
Returns information about the sent document including:
- Document ID
- Status
- Processing details

### Error Response (400/403)
```json
{
  "errorCode": "INVALID_FORMAT",
  "errorMessage": "Document does not conform to Peppol UBL specifications"
}
```

---

## 9. Get Supported Documents for Participant

### Endpoint
```
GET https://test.digiteal.eu/api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types
```

### Description
Get the list of supported document types for a specific remote participant.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### URL Parameters
- `peppolIdentifier` (required) - The Peppol identifier (e.g., `0208:1009915104`)

### Example
```
GET https://test.digiteal.eu/api/v1/peppol/remote-participants/0208:1009915104/supported-document-types
```

### Response
Returns an array of supported document types for the participant.

---

## 10. Add Supported Document Type

### Endpoint
```
POST https://test.digiteal.eu/api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}
```

### Description
Add a supported document type for a remote participant.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### URL Parameters
- `peppolIdentifier` (required) - The Peppol identifier (e.g., `0208:1009915104`)
- `peppolDocumentType` (required) - Document type (e.g., `SELF_BILLING_CREDIT_NOTE`)

### Example
```
POST https://test.digiteal.eu/api/v1/peppol/remote-participants/0208:1009915104/supported-document-types/SELF_BILLING_CREDIT_NOTE
```

---

## 11. Remove Supported Document Type

### Endpoint
```
DELETE https://test.digiteal.eu/api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}
```

### Description
Remove a supported document type for a remote participant.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### URL Parameters
- `peppolIdentifier` (required) - The Peppol identifier (e.g., `0208:1009915104`)
- `peppolDocumentType` (required) - Document type (e.g., `APPLICATION_RESPONSE`)

### Example
```
DELETE https://test.digiteal.eu/api/v1/peppol/remote-participants/0208:1009915104/supported-document-types/APPLICATION_RESPONSE
```

---

## 12. Get Webhook Configuration

### Endpoint
```
GET https://test.digiteal.eu/api/v1/webhook
```

### Description
Get current webhook configuration.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

### Example Response
```json
{
  "webHooks": [
    {
      "type": "PEPPOL_INVOICE_RECEIVED",
      "url": "https://example.com/webhook"
    }
  ]
}
```

---

## 13. Update Webhook Configuration

### Endpoint
```
POST https://test.digiteal.eu/api/v1/webhook/configuration
```

### Description
Configure webhooks for Peppol events.

### Headers
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
Content-Type: application/json
```

### Request Body
```json
{
  "login": "haliqo-test",
  "password": "Haliqo123",
  "webHooks": [
    {
      "type": "PEPPOL_INVOICE_RECEIVED",
      "url": "https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook"
    },
    {
      "type": "PEPPOL_SEND_PROCESSING_OUTCOME",
      "url": "https://kvuvjtbfvzhtccinhmcl.supabase.co/functions/v1/peppol-webhook"
    }
  ]
}
```

### Available Webhook Types
- `PEPPOL_INVOICE_RECEIVED`
- `PEPPOL_SEND_PROCESSING_OUTCOME`
- `PEPPOL_CREDIT_NOTE_RECEIVED`
- `PEPPOL_INVOICE_RESPONSE_RECEIVED`
- `PEPPOL_TRANSPORT_ACK_RECEIVED`
- `PEPPOL_MLR_RECEIVED`
- `PEPPOL_SELF_BILLING_INVOICE_RECEIVED`
- `PEPPOL_SELF_BILLING_CREDIT_NOTE_RECEIVED`
- `PEPPOL_FUTURE_VALIDATION_FAILED`

---

## 📝 Document Types Reference

| Type | Description |
|------|-------------|
| `INVOICE` | Standard invoice |
| `CREDIT_NOTE` | Credit note |
| `SELF_BILLING_INVOICE` | Self-billing invoice |
| `SELF_BILLING_CREDIT_NOTE` | Self-billing credit note |
| `MLR` | Message Level Response |
| `INVOICE_RESPONSE` | Invoice response |
| `APPLICATION_RESPONSE` | Application response |

---

## 🔐 Authentication

All API requests (except public endpoints) require Basic Authentication.

**Header Format:**
```
Authorization: Basic {base64(username:password)}
```

**Example:**
```
Authorization: Basic aGFsaXFvLXRlc3Q6SGFsaXFvMTIz
```

---

## 📌 Notes

1. **Test Environment:** All endpoints use `https://test.digiteal.eu`
2. **Production Environment:** Replace with production URL when ready
3. **Participant IDs:** Format varies by country (e.g., `BE:VAT:BE123456789`, `0208:0630675588`)
4. **Document Types:** Check supported types using the public API before sending
5. **Webhook Configuration:** Configure webhooks separately via Digiteal dashboard or API

---

## 📚 Resources

- **Documentation:** https://doc.digiteal.eu
- **Support:** Contact Digiteal support for API assistance
- **Postman Collection:** Import `Digiteal-Peppol-Access-Point.postman_collection.json` for testing

---


Quick verification list of APIs

Public APIs (No Auth Required)[3]:
✅ GET /api/v1/peppol/public/supported-document-types
✅ GET /api/v1/peppol/public/participants/{peppolIdentifier}
✅ POST /api/v1/peppol/public/validate-document


Authenticated APIs[8]:
✅ GET /api/v1/peppol/registered-participants
✅ GET /api/v1/peppol/registered-participants/{peppolIdentifier}
✅ POST /api/v1/peppol/registered-participants
✅ DELETE /api/v1/peppol/registered-participants/{peppolIdentifier}
✅ POST /api/v1/peppol/outbound-ubl-documents
✅ GET /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types
✅ POST /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}
✅ DELETE /api/v1/peppol/remote-participants/{peppolIdentifier}/supported-document-types/{peppolDocumentType}

WebHook APIs[2]:
✅ GET /api/v1/webhook
✅ POST /api/v1/webhook/configuration


**Last Updated:** October 27, 2025