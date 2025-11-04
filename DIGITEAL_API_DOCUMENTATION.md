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

### 📋 UBL Document Requirements

For complete UBL structure examples, see:
- **[JavaScript UBL Invoice Generation Example](#-javascript-ubl-invoice-generation-example)** - Complete working code for generating UBL invoices
- **[Practical UBL Examples](#-practical-ubl-examples)** - Comprehensive XML examples with all scenarios
- **[UBL Syntax & Validation Rules](#-ubl-syntax--validation-rules-peppol-bis-billing-30)** - Detailed structure requirements

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

### Digiteal Supported Document Types

| Type | Profile Name | Document Type Identifier | Process Identifier |
|------|-------------|-------------------------|-------------------|
| **Invoice** | Peppol BIS Billing UBL Invoice V3 | `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |
| **Credit Note** | Peppol BIS Billing UBL Credit Note V3 | `urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |
| **Invoice Response** | Peppol Invoice Response transaction 3.0 | `urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2::ApplicationResponse##urn:fdc:peppol.eu:poacc:trns:invoice_response:3::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:poacc:bis:invoice_response:3` |
| **MLR** | Peppol Message Level Response transaction 3.0 | `urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2::ApplicationResponse##urn:fdc:peppol.eu:poacc:trns:mlr:3::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:poacc:bis:mlr:3` |
| **Self-billing Invoice** | Peppol BIS UBL Self-billed Invoice | `urn:oasis:names:specification:ubl:schema:xsd:Invoice-2::Invoice##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:selfbilling:3.0::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:2017:poacc:selfbilling:01:1.0` |
| **Self-billing Credit Note** | Peppol BIS UBL Self-billed Credit Note | `urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2::CreditNote##urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:selfbilling:3.0::2.1` | `cenbii-procid-ubl::urn:fdc:peppol.eu:2017:poacc:selfbilling:01:1.0` |

### API Document Type Codes

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

## 💻 JavaScript UBL Invoice Generation Example

This section provides a complete JavaScript example for generating UBL invoices and sending them through Digiteal Peppol Access Point.

### Complete Example Script

```javascript
// Example script for generating a UBL Invoice and sending it through Peppol
// This script works on all popular javascript runtimes: browser, node.js, bun.js, deno...

// Sample input data
var invoiceConfig = {
  billName: "INV-2025-001",
  issueDate: "2025-06-20",
  dueDate: "2025-07-20",
  deliveryDate: "2025-06-30",
  buyerReference: "PO-12345",
  paymentDelay: 30, // In amount of days
  paymentMeans: 31, // Debit transfer, see: https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL4461/
  sender: {
    vatNumber: "BE0262465766",
    name: "My Company BVBA",
    addressLine1: "Main Street 123",
    city: "Brussels",
    countryCode: "BE",
    zipCode: "1000",
    iban: "BE0403019261"
  },
  receiver: {
    vatNumber: "NL123456789B01",
    name: "Customer Company BV",
    addressLine1: "Customer Street 456",
    city: "Amsterdam",
    zipCode: "1012",
    countryCode: "NL",
    peppolIdentifier: "0088:0847976000005",
    contact: {
      name: "John Doe",
      phone: "+31 20 1234567",
      email: "john@customer.nl"
    }
  },
  invoiceLines: [
    {
      description: "Consulting Services",
      quantity: 10,
      unitPrice: 100,
      taxableAmount: 1e3,
      taxAmount: 210,
      totalAmount: 1210,
      vatCode: "S",
      taxPercentage: 21
    }
  ]
};

// Utility functions
var formatDate = (date, format = "iso") => {
  const d = new Date(date);
  return format === "iso" ? d.toISOString() : d.toISOString().split("T")[0];
};

var getVATPEPPOLIdentifier = (vat) => `0208:${vat.split("BE")[1]}`;

var encodeBase64 = (data) => {
  if (typeof data === "string") {
    return btoa(data);
  }
  const bytes = new Uint8Array(data);
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary);
};

var xmlEscape = (str) => str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Business logic helper functions
var calculateTaxCategories = (lines) => {
  let categories = {};
  lines.forEach((line) => {
    const key = `${line.vatCode}${line.taxPercentage}`;
    const existing = categories[key];
    const entry = existing ? {
      ...existing,
      taxableAmount: existing.taxableAmount + line.taxableAmount,
      taxAmount: existing.taxAmount + line.taxAmount,
      totalAmount: existing.totalAmount + line.totalAmount
    } : {
      vatCode: line.vatCode,
      taxPercentage: line.taxPercentage,
      taxableAmount: line.taxableAmount,
      taxAmount: line.taxAmount,
      totalAmount: line.totalAmount
    };
    categories = {
      ...categories,
      ...{
        [key]: entry
      }
    };
  });
  return categories;
};

var calculateTotals = (lines) => lines.reduce((totals, line) => ({
  taxableAmount: totals.taxableAmount + line.taxableAmount,
  taxAmount: totals.taxAmount + line.taxAmount,
  totalAmount: totals.totalAmount + line.totalAmount
}), {
  taxableAmount: 0,
  taxAmount: 0,
  totalAmount: 0
});

// XML generation functions
var generatePartyInfo = (party, isSupplier = true) => {
  const partyType = isSupplier ? "AccountingSupplierParty" : "AccountingCustomerParty";
  const [endpointScheme, endpointId] = (party.peppolIdentifier ?? getVATPEPPOLIdentifier(party.vatNumber)).split(":");
  return `
    <cac:${partyType}>
      <cac:Party>
        <cbc:EndpointID schemeID="${endpointScheme}">${endpointId}</cbc:EndpointID>
        <cac:PartyName>
          <cbc:Name>${xmlEscape(party.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${xmlEscape(party.addressLine1)}</cbc:StreetName>
          <cbc:CityName>${xmlEscape(party.city)}</cbc:CityName>
          <cbc:PostalZone>${xmlEscape(party.zipCode)}</cbc:PostalZone>
          <cac:Country>
            <cbc:IdentificationCode>${xmlEscape(party.vatNumber.substring(0, 2))}</cbc:IdentificationCode>
          </cac:Country>
        </cac:PostalAddress>
        <cac:PartyTaxScheme>
          <cbc:CompanyID>${party.vatNumber}</cbc:CompanyID>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:PartyTaxScheme>
        <cac:PartyLegalEntity>
          <cbc:RegistrationName>${xmlEscape(party.name)}</cbc:RegistrationName>
          <cbc:CompanyID>${party.vatNumber}</cbc:CompanyID>
        </cac:PartyLegalEntity>
        ${!isSupplier ? generateContactInfo(party.contact) : ""}
      </cac:Party>
    </cac:${partyType}>
  `;
};

var generateContactInfo = ({ name, phone, email }) => {
  if (!name && !phone && !email) return "";
  return `
    <cac:Contact>
      ${name ? `<cbc:Name>${xmlEscape(name)}</cbc:Name>` : ""}
      ${phone ? `<cbc:Telephone>${xmlEscape(phone)}</cbc:Telephone>` : ""}
      ${email ? `<cbc:ElectronicMail>${xmlEscape(email)}</cbc:ElectronicMail>` : ""}
    </cac:Contact>
  `;
};

var generateDelivery = (invoiceConfig) => `
<cac:Delivery>
  <cbc:ActualDeliveryDate>${invoiceConfig.deliveryDate}</cbc:ActualDeliveryDate>
  <cac:DeliveryLocation>
    <cac:Address>
      <cac:Country>
        <cbc:IdentificationCode>${xmlEscape(invoiceConfig.receiver.countryCode)}</cbc:IdentificationCode>
      </cac:Country>
    </cac:Address>
  </cac:DeliveryLocation>
</cac:Delivery>
`;

var generatePaymentMeansAndTerms = (invoiceConfig) => `
<cac:PaymentMeans>
  <cbc:PaymentMeansCode name="Credit transfer">${invoiceConfig.paymentMeans}</cbc:PaymentMeansCode>
  <cbc:PaymentID>${xmlEscape(invoiceConfig.billName)}</cbc:PaymentID>
  <cac:PayeeFinancialAccount>
    <cbc:ID>${invoiceConfig.sender.iban}</cbc:ID>
    <cbc:Name>${xmlEscape(invoiceConfig.sender.name)}</cbc:Name>
  </cac:PayeeFinancialAccount>
</cac:PaymentMeans>
<cac:PaymentTerms>
  <cbc:Note>Net within ${invoiceConfig.paymentDelay} days</cbc:Note>
</cac:PaymentTerms>
`;

var generateTaxSubtotals = (taxCategories) => Object.values(taxCategories).map((category) => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${category.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${category.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${category.vatCode}</cbc:ID>
          <cbc:Percent>${category.taxPercentage}</cbc:Percent>
          ${category.taxPercentage === 0 ? "<cbc:TaxExemptionReasonCode>VATEX-EU-IC</cbc:TaxExemptionReasonCode>" : ""}
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    `).join("");

var generateInvoiceLines = (lines) => lines.map((line, index) => `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="1I">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${line.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${xmlEscape(line.description ?? "")}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${line.vatCode}</cbc:ID>
          <cbc:Percent>${line.taxPercentage}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="EUR">${line.unitPrice}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>
  `).join("");

// Main composition function
var generatePEPPOLXML = (invoiceData) => {
  const timestamp = formatDate(new Date());
  const taxCategories = calculateTaxCategories(invoiceData.invoiceLines);
  const totals = calculateTotals(invoiceData.invoiceLines);
  
  if (!invoiceData.receiver.peppolIdentifier) {
    throw new Error("Peppol identifier of receiving party must be defined");
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
  <Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
           xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
           xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>${xmlEscape(invoiceData.billName)}</cbc:ID>
    <cbc:IssueDate>${invoiceData.issueDate}</cbc:IssueDate>
    <cbc:DueDate>${invoiceData.dueDate}</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    ${invoiceData.buyerReference ? `<cbc:BuyerReference>${xmlEscape(invoiceData.buyerReference)}</cbc:BuyerReference>` : ""}
  ${generatePartyInfo(invoiceData.sender, true)}
  ${generatePartyInfo(invoiceData.receiver, false)}
  ${generateDelivery(invoiceData)}
  ${generatePaymentMeansAndTerms(invoiceData)}
    <cac:TaxTotal>
      <cbc:TaxAmount currencyID="EUR">${totals.taxAmount.toFixed(2)}</cbc:TaxAmount>
      ${generateTaxSubtotals(taxCategories)}
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
      <cbc:LineExtensionAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cbc:TaxExclusiveAmount currencyID="EUR">${totals.taxableAmount.toFixed(2)}</cbc:TaxExclusiveAmount>
      <cbc:TaxInclusiveAmount currencyID="EUR">${totals.totalAmount.toFixed(2)}</cbc:TaxInclusiveAmount>
      <cbc:PayableAmount currencyID="EUR">${totals.totalAmount.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
  ${generateInvoiceLines(invoiceData.invoiceLines)}
  </Invoice>`;
};

// HTTP functions using browser fetch API
var createAuthHeader = (username, password) => `Basic ${encodeBase64(`${username}:${password}`)}`;

var createFormData = (xml, comment = "Sent from Modern UBL Generator") => {
  const formData = new FormData();
  const blob = new Blob([xml], { type: "application/xml" });
  formData.append("comment", comment);
  formData.append("document", blob, "ubl.xml");
  return formData;
};

var sendToPEPPOL = async (credentials, invoiceData, isTest = false) => {
  const baseUrl = isTest ? "https://test.digiteal.eu" : "https://app.digiteal.eu";
  const url = `${baseUrl}/api/v1/peppol/outbound-ubl-documents`;
  
  try {
    const xml = generatePEPPOLXML(invoiceData);
    const formData = createFormData(xml);
    
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": createAuthHeader(credentials.username, credentials.password)
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }
    
    const result = await response.text();
    if (result.includes("OK")) {
      console.log(`Invoice ${invoiceData.billName} sent successfully via PEPPOL`);
      return {
        success: true,
        message: "Invoice sent successfully"
      };
    } else {
      throw new Error(`PEPPOL service error: ${result}`);
    }
  } catch (error) {
    console.error("Failed to send PEPPOL invoice:", error);
    throw error;
  }
};

// Send UBL
sendToPEPPOL({
  username: "peppol-integrator",
  password: "sup3rs3cr3t"
}, invoiceConfig, true).then((result) => {
  console.log("Success:", result);
}).catch((error) => {
  console.error("Error:", error);
});
```

---

## 📋 Mandatory Fields for Peppol BIS Billing 3.0

This section details all mandatory fields required for generating valid Peppol-compliant UBL invoices and credit notes, specifically for **client invoices** (outbound) and **expense invoices** (inbound).

### Overview

Peppol BIS Billing 3.0 mandates specific fields for invoices and credit notes. These fields are **required** for both:
- **Client Invoices** (outbound): Invoices you send to your customers via Peppol
- **Expense Invoices** (inbound): Invoices you receive from suppliers via Peppol webhook

---

### 1. Document Identifiers (Mandatory)

These fields identify the document itself:

| Element | Path | Description | Example Value |
|---------|------|-------------|---------------|
| **CustomizationID** | `cbc:CustomizationID` | Specification identifier | `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0` |
| **ProfileID** | `cbc:ProfileID` | Business process type | `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |
| **ID** | `cbc:ID` | Invoice number (sequential, unique) | `INV-2025-001` |
| **IssueDate** | `cbc:IssueDate` | Invoice issue date | `2025-01-15` (Format: YYYY-MM-DD) |
| **InvoiceTypeCode** | `cbc:InvoiceTypeCode` | Functional type code (from allowed UN/CEFACT subset) | `380` (Standard invoice) |

**Key Requirements:**
- Invoice number (`cbc:ID`) must be **unique** within business context and **sequential** (required by Article 226(2) of EU Directive 2006/112/EC)
- Issue date must be in **YYYY-MM-DD** format (ISO 8601)
- InvoiceTypeCode must be from allowed UN/CEFACT subset (typically `380` for invoice, `381` for credit note)

---

### 2. Parties / Identifiers (Mandatory)

These fields identify the supplier (sender) and customer (receiver):

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **AccountingSupplierParty** | `cac:AccountingSupplierParty` | Supplier information | Must contain Party structure |
| **AccountingCustomerParty** | `cac:AccountingCustomerParty` | Customer information | Must contain Party structure |
| **EndpointID** | `cbc:EndpointID` | Peppol electronic address | Must have valid `schemeID` attribute |
| **PartyIdentification** | `cac:PartyIdentification/cbc:ID` | Party identifier | Company identifier |
| **CompanyID** | `cac:PartyLegalEntity/cbc:CompanyID` | Legal registration number | VAT number or company registration |

**Critical Requirements:**

#### For Client Invoices (Outbound):
- **Supplier (Sender)**: Must have valid Peppol identifier registered with Digiteal
- **Customer (Receiver)**: Must have valid Peppol identifier and be registered to receive invoices
- **EndpointID**: Format is `{schemeID}:{identifier}` (e.g., `0208:0630675588` for Belgium)
  - SchemeID `0208` = Belgium company number
  - SchemeID `9925` = Belgian VAT number
  - SchemeID `0002` = French VAT number
  - Full list: [Peppol Codelists](https://docs.peppol.eu/edelivery/codelists/)

#### For Expense Invoices (Inbound):
- **Supplier (Sender)**: Information comes from received UBL document
- **Customer (Receiver)**: Your company (must be registered to receive invoices)
- **EndpointID**: Must match your registered Peppol identifier

**Example Structure:**
```xml
<cac:AccountingSupplierParty>
  <cac:Party>
    <cbc:EndpointID schemeID="0208">0630675588</cbc:EndpointID>
    <cac:PartyIdentification>
      <cbc:ID>0630675588</cbc:ID>
    </cac:PartyIdentification>
    <cac:PartyName>
      <cbc:Name>Supplier Company Name</cbc:Name>
    </cac:PartyName>
    <cac:PostalAddress>
      <cbc:StreetName>Main Street 123</cbc:StreetName>
      <cbc:CityName>Brussels</cbc:CityName>
      <cbc:PostalZone>1000</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode>BE</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>
    <cac:PartyTaxScheme>
      <cbc:CompanyID>BE0630675588</cbc:CompanyID>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:PartyTaxScheme>
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>Supplier Official Name</cbc:RegistrationName>
      <cbc:CompanyID>BE0630675588</cbc:CompanyID>
    </cac:PartyLegalEntity>
  </cac:Party>
</cac:AccountingSupplierParty>
```

---

### 3. Invoice Lines (Mandatory)

**For each `<cac:InvoiceLine>`**, the following fields are **mandatory**:

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **ID** | `cbc:ID` | Line number | Sequential (1, 2, 3, ...) |
| **InvoicedQuantity** | `cbc:InvoicedQuantity` | Quantity | Must have `unitCode` attribute (UNECE Recommendation 20) |
| **LineExtensionAmount** | `cbc:LineExtensionAmount` | Line total (net) | Must have `currencyID` attribute |
| **PriceAmount** | `cac:Price/cbc:PriceAmount` | Unit price | Must have `currencyID` attribute |

**Key Requirements:**
- Line IDs must be **sequential** (1, 2, 3, ...)
- `InvoicedQuantity` must use UNECE Recommendation 20 unit codes (e.g., `C62` = piece, `MTR` = meter, `KGM` = kilogram)
- `LineExtensionAmount` = Quantity × Unit Price (net of tax)
- All amounts must have `currencyID` attribute matching document currency

**Example Structure:**
```xml
<cac:InvoiceLine>
  <cbc:ID>1</cbc:ID>
  <cbc:InvoicedQuantity unitCode="C62">10</cbc:InvoicedQuantity>
  <cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount>
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
```

---

### 4. Tax Information (Mandatory)

**At document level** (`<cac:TaxTotal>`), the following is **mandatory**:

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **TaxAmount** | `cbc:TaxAmount` | Total tax amount | Must have `currencyID` attribute |
| **TaxSubtotal** | `cac:TaxSubtotal` | Tax breakdown by category | One per tax category |
| **TaxableAmount** | `cbc:TaxableAmount` | Amount subject to tax | Must have `currencyID` attribute |
| **TaxAmount** (in TaxSubtotal) | `cbc:TaxAmount` | Tax amount for this category | Must have `currencyID` attribute |
| **TaxCategory** | `cac:TaxCategory` | Tax category information | |
| **ID** | `cbc:TaxCategory/cbc:ID` | VAT category code | S, Z, E, K, G, etc. |
| **Percent** | `cbc:TaxCategory/cbc:Percent` | Tax rate percentage | 0-100 |
| **TaxScheme ID** | `cac:TaxScheme/cbc:ID` | Tax scheme identifier | Must be `VAT` |

**Key Requirements:**
- Tax amounts must match calculated values: `TaxAmount = TaxableAmount × (TaxRate / 100)`
- Tax category on invoice lines must match tax category in `TaxTotal`
- All amounts must have `currencyID` attribute matching document currency

**Example Structure:**
```xml
<cac:TaxTotal>
  <cbc:TaxAmount currencyID="EUR">210.00</cbc:TaxAmount>
  <cac:TaxSubtotal>
    <cbc:TaxableAmount currencyID="EUR">1000.00</cbc:TaxableAmount>
    <cbc:TaxAmount currencyID="EUR">210.00</cbc:TaxAmount>
    <cac:TaxCategory>
      <cbc:ID>S</cbc:ID>
      <cbc:Percent>21</cbc:Percent>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:TaxCategory>
  </cac:TaxSubtotal>
</cac:TaxTotal>
```

---

### 5. Totals (Mandatory)

**At document level** (`<cac:LegalMonetaryTotal>`), the following is **mandatory**:

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **LineExtensionAmount** | `cbc:LineExtensionAmount` | Sum of all line items (net) | Must have `currencyID`, 2 decimals |
| **TaxExclusiveAmount** | `cbc:TaxExclusiveAmount` | Total before tax | Must have `currencyID`, 2 decimals |
| **TaxInclusiveAmount** | `cbc:TaxInclusiveAmount` | Total including tax | Must have `currencyID`, 2 decimals |
| **PayableAmount** | `cbc:PayableAmount` | Final amount to pay | Must have `currencyID`, 2 decimals |

**Key Requirements:**
- All amounts must have **2 decimal places** (e.g., `100.00`, not `100` or `100.0`)
- All amounts must have `currencyID` attribute matching `cbc:DocumentCurrencyCode`
- `PayableAmount` = `TaxInclusiveAmount` (unless adjustments like prepayments)

**Example Structure:**
```xml
<cac:LegalMonetaryTotal>
  <cbc:LineExtensionAmount currencyID="EUR">1000.00</cbc:LineExtensionAmount>
  <cbc:TaxExclusiveAmount currencyID="EUR">1000.00</cbc:TaxExclusiveAmount>
  <cbc:TaxInclusiveAmount currencyID="EUR">1210.00</cbc:TaxInclusiveAmount>
  <cbc:PayableAmount currencyID="EUR">1210.00</cbc:PayableAmount>
</cac:LegalMonetaryTotal>
```

---

### 6. Currency Code (Mandatory)

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **DocumentCurrencyCode** | `cbc:DocumentCurrencyCode` | Invoice currency | ISO 4217 format (EUR, USD, GBP, etc.) |

**Key Requirements:**
- Must be valid ISO 4217 currency code
- **All** `currencyID` attributes in the document must match this value
- Only one currency allowed per invoice (exception: VAT accounting currency can differ)

---

### Important Considerations

#### Document Level Information
- **Invoice Period**: If used, must include `StartDate` and/or `EndDate` (Format: YYYY-MM-DD)
- **Buyer Reference OR Purchase Order Reference**: An invoice **MUST** have either:
  - `cbc:BuyerReference`, OR
  - `cac:OrderReference/cbc:ID` (can be `"NA"` if only Sales Order exists)
- **Payment Due Date OR Payment Terms**: If `PayableAmount` is positive, must have either:
  - `cbc:DueDate`, OR
  - `cac:PaymentTerms/cbc:Note`
- **Tax Point Date**: Required if different from `IssueDate`

#### Consistency Requirements
- **Currency Consistency**: All `currencyID` attributes must match `DocumentCurrencyCode`
- **Tax Consistency**: Tax category on invoice lines must exist in `TaxTotal/TaxSubtotal`
- **Amount Consistency**: 
  - `LineExtensionAmount` = Sum of all line `LineExtensionAmount` values
  - `TaxAmount` = Sum of all `TaxSubtotal/TaxAmount` values
  - `TaxInclusiveAmount` = `TaxExclusiveAmount` + `TaxAmount`

#### Format Requirements
- **No Empty Elements**: Document must not contain empty elements
- **Valid Format**: Identifiers (VAT numbers, company numbers) must adhere to country-specific formats
- **Two Decimals**: All monetary amounts must have exactly 2 decimal places
- **Date Format**: All dates must be in YYYY-MM-DD format (ISO 8601)

#### Conditional Fields
Certain fields are **mandatory based on business case**:
- **Allowance/Charge**: If discounts or fees are applied, `cac:AllowanceCharge` is mandatory
- **Delivery Information**: If delivery details differ from billing address, `cac:Delivery` is required
- **Payment Means**: If payment method is specified, `cac:PaymentMeans` is required

---

### Client Invoice vs Expense Invoice

#### Client Invoice (Outbound - You Send)
**Your Application Responsibilities:**
1. ✅ Generate UBL XML with all mandatory fields
2. ✅ Validate UBL before sending (use `validate-document` API)
3. ✅ Ensure sender (your company) is registered with Digiteal
4. ✅ Verify receiver (customer) is registered to receive invoices
5. ✅ Send via `POST /api/v1/peppol/outbound-ubl-documents`
6. ✅ Store UBL XML in `invoices.ubl_xml` field
7. ✅ Update `invoices.peppol_status` based on webhook responses

**Mandatory Fields Focus:**
- `cac:AccountingSupplierParty` = Your company (must match registered Peppol identifier)
- `cac:AccountingCustomerParty` = Customer (must have valid Peppol identifier)
- All document identifiers, tax, totals must be complete

#### Expense Invoice (Inbound - You Receive)
**Webhook Processing Responsibilities:**
1. ✅ Receive UBL XML via `PEPPOL_INVOICE_RECEIVED` webhook
2. ✅ Parse UBL XML to extract all mandatory fields
3. ✅ Validate UBL structure (should already be validated by Peppol network)
4. ✅ Create `expense_invoices` record with extracted data
5. ✅ Store UBL XML in `expense_invoices.ubl_xml` field
6. ✅ Extract supplier information from `cac:AccountingSupplierParty`
7. ✅ Extract customer information from `cac:AccountingCustomerParty` (should be your company)

**Mandatory Fields Extraction:**
- Extract `cbc:ID` (invoice number from sender)
- Extract `cbc:IssueDate` (invoice date)
- Extract `cac:AccountingSupplierParty` (sender information → `sender_peppol_id`)
- Extract `cac:AccountingCustomerParty` (your company → verify matches your Peppol ID)
- Extract all line items, tax, totals
- Store in `expense_invoices` table

---

### Validation Checklist

Before sending a client invoice, verify:

- [ ] All document identifiers present (CustomizationID, ProfileID, ID, IssueDate, InvoiceTypeCode)
- [ ] DocumentCurrencyCode is valid ISO 4217 code
- [ ] Supplier party has valid EndpointID with correct schemeID
- [ ] Customer party has valid EndpointID (verify recipient can receive invoices)
- [ ] All invoice lines have ID, InvoicedQuantity, LineExtensionAmount, PriceAmount
- [ ] TaxTotal has TaxAmount and at least one TaxSubtotal per tax category
- [ ] TaxSubtotal has TaxableAmount, TaxAmount, TaxCategory with ID and Percent
- [ ] LegalMonetaryTotal has LineExtensionAmount, TaxExclusiveAmount, TaxInclusiveAmount, PayableAmount
- [ ] All amounts have currencyID matching DocumentCurrencyCode
- [ ] All amounts have 2 decimal places
- [ ] BuyerReference OR OrderReference present
- [ ] DueDate OR PaymentTerms present (if PayableAmount > 0)
- [ ] No empty elements in document
- [ ] Tax calculations are correct (TaxAmount = TaxableAmount × TaxRate / 100)
- [ ] Line totals match sum of invoice lines

---

### Quick Reference

**Minimum Required Structure:**
```xml
<Invoice>
  <!-- Document Identifiers -->
  <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
  <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
  <cbc:ID>INV-001</cbc:ID>
  <cbc:IssueDate>2025-01-15</cbc:IssueDate>
  <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
  
  <!-- Supplier & Customer Parties -->
  <cac:AccountingSupplierParty>...</cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>...</cac:AccountingCustomerParty>
  
  <!-- Tax -->
  <cac:TaxTotal>...</cac:TaxTotal>
  
  <!-- Totals -->
  <cac:LegalMonetaryTotal>...</cac:LegalMonetaryTotal>
  
  <!-- Invoice Lines (at least one) -->
  <cac:InvoiceLine>...</cac:InvoiceLine>
</Invoice>
```

---

## 📐 UBL Syntax & Validation Rules (Peppol BIS Billing 3.0)

This section provides detailed information about UBL (Universal Business Language) document structure and validation rules according to Peppol BIS Billing 3.0 specifications.

**Reference Documentation:**
- [Peppol BIS Billing 3.0 UBL Invoice Syntax](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/tree/)
- [Peppol BIS Billing 3.0 UBL Credit Note Syntax](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-creditnote/tree/)
- [Peppol BIS Billing 3.0 UBL TC434 Rules](https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/)
- [Peppol BIS Billing 3.0 UBL Peppol Rules](https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-peppol/)

---

### UBL Invoice Structure

#### Root Element (Mandatory)

```xml
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
```

#### Mandatory Elements (1..1)

| Element | Path | Description | Default/Example Value |
|---------|------|-------------|----------------------|
| **CustomizationID** | `cbc:CustomizationID` | Specification identifier | `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0` |
| **ProfileID** | `cbc:ProfileID` | Business process type | `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |
| **ID** | `cbc:ID` | Invoice number (sequential, unique) | `33445566` |
| **IssueDate** | `cbc:IssueDate` | Invoice issue date | `2017-11-01` (Format: YYYY-MM-DD) |
| **InvoiceTypeCode** | `cbc:InvoiceTypeCode` | Functional type code | `380` (Standard invoice) |
| **DocumentCurrencyCode** | `cbc:DocumentCurrencyCode` | Invoice currency | `EUR` |
| **AccountingSupplierParty** | `cac:AccountingSupplierParty` | Supplier information | See Party Structure below |
| **AccountingCustomerParty** | `cac:AccountingCustomerParty` | Customer information | See Party Structure below |
| **TaxTotal** | `cac:TaxTotal` | Tax information | See Tax Structure below |
| **LegalMonetaryTotal** | `cac:LegalMonetaryTotal` | Monetary totals | See Monetary Total below |
| **InvoiceLine** | `cac:InvoiceLine` | Invoice line items | At least one required |

#### Optional but Important Elements (0..1)

| Element | Path | Description | Notes |
|---------|------|-------------|-------|
| **DueDate** | `cbc:DueDate` | Payment due date | Format: YYYY-MM-DD. Required if Amount due for payment (BT-115) is positive |
| **TaxPointDate** | `cbc:TaxPointDate` | VAT point date | Required if different from IssueDate |
| **BuyerReference** | `cbc:BuyerReference` | Buyer reference | **Must have either BuyerReference OR Purchase Order Reference** |
| **OrderReference** | `cac:OrderReference` | Purchase order reference | **Must have either BuyerReference OR Purchase Order Reference** |
| **InvoicePeriod** | `cac:InvoicePeriod` | Invoice/delivery period | If used, StartDate and/or EndDate required |
| **Note** | `cbc:Note` | Invoice note | Not repeatable (except for German buyers/sellers) |

---

### Party Structure (Supplier/Customer)

#### Mandatory Elements

```xml
<cac:AccountingSupplierParty>
  <cac:Party>
    <!-- Endpoint ID (Peppol Identifier) -->
    <cbc:EndpointID schemeID="0208">0630675588</cbc:EndpointID>
    
    <!-- Party Name -->
    <cac:PartyName>
      <cbc:Name>Company Name</cbc:Name>
    </cac:PartyName>
    
    <!-- Postal Address -->
    <cac:PostalAddress>
      <cbc:StreetName>Main Street 123</cbc:StreetName>
      <cbc:CityName>Brussels</cbc:CityName>
      <cbc:PostalZone>1000</cbc:PostalZone>
      <cac:Country>
        <cbc:IdentificationCode>BE</cbc:IdentificationCode>
      </cac:Country>
    </cac:PostalAddress>
    
    <!-- Tax Scheme -->
    <cac:PartyTaxScheme>
      <cbc:CompanyID>BE123456789</cbc:CompanyID>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:PartyTaxScheme>
    
    <!-- Legal Entity -->
    <cac:PartyLegalEntity>
      <cbc:RegistrationName>Company Legal Name</cbc:RegistrationName>
      <cbc:CompanyID schemeID="BE">BE123456789</cbc:CompanyID>
    </cac:PartyLegalEntity>
    
    <!-- Contact (for Customer Party only) -->
    <cac:Contact>
      <cbc:Name>John Doe</cbc:Name>
      <cbc:Telephone>+321234567</cbc:Telephone>
      <cbc:ElectronicMail>john@example.com</cbc:ElectronicMail>
    </cac:Contact>
  </cac:Party>
</cac:AccountingSupplierParty>
```

**Key Requirements:**
- `EndpointID` must match Peppol identifier format (e.g., `0208:0630675588`)
- `schemeID` in EndpointID is the country code number (0208 = Belgium, 0209 = Netherlands, etc.)
- Country code in `PostalAddress/Country/IdentificationCode` must be ISO 3166-1 alpha-2 (e.g., BE, NL, FR)
- VAT number format must match country requirements

---

### Tax Structure

#### Mandatory Elements

```xml
<cac:TaxTotal>
  <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
  
  <!-- Tax Subtotal (one per tax category) -->
  <cac:TaxSubtotal>
    <cbc:TaxableAmount currencyID="EUR">100.00</cbc:TaxableAmount>
    <cbc:TaxAmount currencyID="EUR">21.00</cbc:TaxAmount>
    <cac:TaxCategory>
      <cbc:ID>S</cbc:ID> <!-- VAT Category Code: S=Standard, Z=Zero-rated, E=Exempt, etc. -->
      <cbc:Percent>21</cbc:Percent> <!-- VAT Rate -->
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID> <!-- Must be "VAT" -->
      </cac:TaxScheme>
    </cac:TaxCategory>
  </cac:TaxSubtotal>
</cac:TaxTotal>
```

**VAT Category Codes:**
- `S` - Standard rate
- `Z` - Zero rated
- `E` - Exempt from VAT
- `AE` - Reverse charge
- `K` - VAT exempt for intra-EU supply
- `G` - Free text
- `L` - Canary Islands general indirect tax (IGIC)
- `M` - Canary Islands indirect tax (IPSI)
- `O` - Not subject to VAT

---

### Monetary Total Structure

#### Mandatory Elements

```xml
<cac:LegalMonetaryTotal>
  <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
  <cbc:TaxExclusiveAmount currencyID="EUR">100.00</cbc:TaxExclusiveAmount>
  <cbc:TaxInclusiveAmount currencyID="EUR">121.00</cbc:TaxInclusiveAmount>
  <cbc:PayableAmount currencyID="EUR">121.00</cbc:PayableAmount>
</cac:LegalMonetaryTotal>
```

**Calculations:**
- `LineExtensionAmount` = Sum of all line items (net amounts)
- `TaxExclusiveAmount` = Sum before tax (usually same as LineExtensionAmount)
- `TaxInclusiveAmount` = Sum including tax
- `PayableAmount` = Final amount to pay (usually same as TaxInclusiveAmount)

---

### Invoice Line Structure

#### Mandatory Elements

```xml
<cac:InvoiceLine>
  <cbc:ID>1</cbc:ID> <!-- Line number (sequential) -->
  
  <!-- Invoiced Quantity -->
  <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
  <!-- unitCode examples: C62=piece, MTR=meter, KGM=kilogram, etc. -->
  
  <!-- Line Extension Amount (net) -->
  <cbc:LineExtensionAmount currencyID="EUR">100.00</cbc:LineExtensionAmount>
  
  <!-- Item Details -->
  <cac:Item>
    <cbc:Name>Product or Service Name</cbc:Name>
    
    <!-- Tax Category -->
    <cac:ClassifiedTaxCategory>
      <cbc:ID>S</cbc:ID>
      <cbc:Percent>21</cbc:Percent>
      <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
      </cac:TaxScheme>
    </cac:ClassifiedTaxCategory>
  </cac:Item>
  
  <!-- Price -->
  <cac:Price>
    <cbc:PriceAmount currencyID="EUR">100.00</cbc:PriceAmount>
    <!-- Optional: Base Quantity -->
    <cbc:BaseQuantity unitCode="C62">1</cbc:BaseQuantity>
  </cac:Price>
</cac:InvoiceLine>
```

**Key Requirements:**
- Line ID must be sequential (1, 2, 3, ...)
- `InvoicedQuantity` must use UNECE Recommendation 20 unit codes
- `LineExtensionAmount` = Quantity × Unit Price (net of tax)
- Tax category on line must match tax category in TaxTotal

---

### Validation Rules

#### Business Rules (from Peppol BIS 3.0)

1. **Invoice Number (BT-1)**
   - Must be unique within business context, time-frame, and operating systems
   - Sequential number required by Article 226(2) of EU Directive 2006/112/EC
   - No identification scheme should be used

2. **Buyer Reference OR Purchase Order Reference (BT-10 or BT-13)**
   - An invoice **MUST** have either:
     - Buyer Reference (`cbc:BuyerReference`), OR
     - Purchase Order Reference (`cac:OrderReference/cbc:ID`)
   - If Sales Order Reference is provided but no Purchase Order Reference, use `"NA"` for Purchase Order Reference

3. **Payment Due Date OR Payment Terms (BT-9 or BT-20)**
   - If Amount due for payment (BT-115) is positive, either:
     - Payment Due Date (`cbc:DueDate`), OR
     - Payment Terms (`cac:PaymentTerms/cbc:Note`)

4. **Tax Point Date (BT-7)**
   - Required if different from Invoice Issue Date
   - Format: YYYY-MM-DD

5. **Currency (BT-5)**
   - Only one currency shall be used in the Invoice
   - Exception: VAT accounting currency (BT-6) and VAT amount in accounting currency (BT-111) can differ

6. **Invoice Period (BT-73)**
   - If used, must include StartDate and/or EndDate
   - Format: YYYY-MM-DD

#### UBL TC434 Validation Rules

- All amounts must be positive (except for credit notes)
- Tax amounts must match calculated values (TaxableAmount × TaxRate)
- Line totals must match sum of line items
- Currency codes must be ISO 4217 (e.g., EUR, USD, GBP)

#### Peppol-Specific Rules

- EndpointID schemeID must be valid Peppol country code
- Document must conform to Peppol BIS Billing 3.0 specification
- All mandatory elements must be present
- Element cardinality must be respected (1..1 = mandatory, 0..1 = optional)

---

### UBL Credit Note Structure

Credit Notes follow the same structure as Invoices but use:
- Root element: `<CreditNote>` instead of `<Invoice>`
- Namespace: `urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2`
- Same element names (inherited from EN16931)

**Key Differences:**
- InvoiceTypeCode typically uses `381` for credit note
- Amounts may be negative (depending on implementation)
- Must reference original invoice when applicable

**Reference:** [Peppol BIS Billing 3.0 UBL Credit Note Syntax](https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-creditnote/tree/)

---

### Common Validation Errors

| Error | Cause | Solution |
|-------|-------|----------|
| Missing CustomizationID | Element not present or wrong value | Use: `urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0` |
| Missing ProfileID | Element not present or wrong value | Use: `urn:fdc:peppol.eu:2017:poacc:billing:01:1.0` |
| Invalid EndpointID | Wrong format or schemeID | Use format: `COUNTRY_CODE:VAT_NUMBER` (e.g., `0208:0630675588`) |
| Missing Buyer Reference | Neither BuyerReference nor OrderReference present | Add one of them |
| Tax calculation mismatch | Tax amounts don't match calculated values | Verify: TaxAmount = TaxableAmount × (TaxRate / 100) |
| Invalid currency code | Not ISO 4217 format | Use standard codes (EUR, USD, GBP, etc.) |
| Missing TaxScheme ID | TaxScheme ID not "VAT" | Always use `VAT` for VAT scheme |
| Invalid date format | Date not YYYY-MM-DD | Use ISO 8601 format |

---

## 📋 Practical UBL Examples

This section provides practical UBL invoice and credit note examples based on Peppol BIS Billing 3.0 specifications.

### Standard VAT Invoice Example

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>Snippet1</cbc:ID>
    <cbc:IssueDate>2017-11-13</cbc:IssueDate>
    <cbc:DueDate>2017-12-01</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>0150abc</cbc:BuyerReference>
    
    <!-- Supplier Party -->
    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0088">7300010000001</cbc:EndpointID>
            <cac:PartyIdentification>
                <cbc:ID>99887766</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>SupplierTradingName Ltd.</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>Main street 1</cbc:StreetName>
                <cbc:AdditionalStreetName>Postbox 123</cbc:AdditionalStreetName>
                <cbc:CityName>London</cbc:CityName>
                <cbc:PostalZone>GB 123 EW</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>GB</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>GB1232434</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>SupplierOfficialName Ltd</cbc:RegistrationName>
                <cbc:CompanyID>GB983294</cbc:CompanyID>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    
    <!-- Customer Party -->
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:EndpointID schemeID="0002">FR23342</cbc:EndpointID>
            <cac:PartyIdentification>
                <cbc:ID schemeID="0002">FR23342</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>BuyerTradingName AS</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>Hovedgatan 32</cbc:StreetName>
                <cbc:AdditionalStreetName>Po box 878</cbc:AdditionalStreetName>
                <cbc:CityName>Stockholm</cbc:CityName>
                <cbc:PostalZone>456 34</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SE</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>SE4598375937</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>Buyer Official Name</cbc:RegistrationName>
                <cbc:CompanyID schemeID="0183">39937423947</cbc:CompanyID>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    
    <!-- Tax Total -->
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EUR">2.10</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="EUR">10.00</cbc:TaxableAmount>
            <cbc:TaxAmount currencyID="EUR">2.10</cbc:TaxAmount>
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
        <cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="EUR">10.00</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="EUR">12.10</cbc:TaxInclusiveAmount>
        <cbc:PayableAmount currencyID="EUR">12.10</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    
    <!-- Invoice Line -->
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="C62">1</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">10.00</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Name>Some product</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">10.00</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
</Invoice>
```

### VAT Category Examples

#### Standard VAT (Category S)
```xml
<cac:TaxCategory>
    <cbc:ID>S</cbc:ID>
    <cbc:Percent>21</cbc:Percent>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

#### Intracom VAT Exemption (Category K)
```xml
<cac:TaxCategory>
    <cbc:ID>K</cbc:ID>
    <cbc:Percent>0</cbc:Percent>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

#### Export Outside EU (Category G)
```xml
<cac:TaxCategory>
    <cbc:ID>G</cbc:ID>
    <cbc:Percent>0</cbc:Percent>
    <cbc:TaxExemptionReasonCode>VATEX-EU-G</cbc:TaxExemptionReasonCode>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

#### Zero Rated (Category Z)
```xml
<cac:TaxCategory>
    <cbc:ID>Z</cbc:ID>
    <cbc:Percent>0</cbc:Percent>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

#### Exempt (Category E)
```xml
<cac:TaxCategory>
    <cbc:ID>E</cbc:ID>
    <cbc:Percent>0</cbc:Percent>
    <cbc:TaxExemptionReasonCode>VATEX-EU-F</cbc:TaxExemptionReasonCode>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

#### Outside Scope (Category O)
```xml
<cac:TaxCategory>
    <cbc:ID>O</cbc:ID>
    <cbc:TaxExemptionReason>Not subject to VAT</cbc:TaxExemptionReason>
    <cac:TaxScheme>
        <cbc:ID>VAT</cbc:ID>
    </cac:TaxScheme>
</cac:TaxCategory>
```

### Allowance and Charge Examples

#### Charge (Additional Fee)
```xml
<cac:AllowanceCharge>
    <cbc:ChargeIndicator>true</cbc:ChargeIndicator>
    <cbc:AllowanceChargeReasonCode>CG</cbc:AllowanceChargeReasonCode>
    <cbc:AllowanceChargeReason>Cleaning</cbc:AllowanceChargeReason>
    <cbc:MultiplierFactorNumeric>20</cbc:MultiplierFactorNumeric>
    <cbc:Amount currencyID="EUR">200</cbc:Amount>
    <cbc:BaseAmount currencyID="EUR">1000</cbc:BaseAmount>
    <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>25</cbc:Percent>
        <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
    </cac:TaxCategory>
</cac:AllowanceCharge>
```

#### Allowance (Discount)
```xml
<cac:AllowanceCharge>
    <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
    <cbc:AllowanceChargeReasonCode>95</cbc:AllowanceChargeReasonCode>
    <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>
    <cbc:Amount currencyID="EUR">200</cbc:Amount>
    <cac:TaxCategory>
        <cbc:ID>S</cbc:ID>
        <cbc:Percent>25</cbc:Percent>
        <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
        </cac:TaxScheme>
    </cac:TaxCategory>
</cac:AllowanceCharge>
```

### Credit Note Structure

```xml
<?xml version="1.0" encoding="UTF-8"?>
<CreditNote xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
    xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
    xmlns="urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2">
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>Snippet1</cbc:ID>
    <cbc:IssueDate>2017-11-13</cbc:IssueDate>
    <cbc:CreditNoteTypeCode>381</cbc:CreditNoteTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>0150abc</cbc:BuyerReference>
    
    <!-- Reference to original invoice -->
    <cac:BillingReference>
        <cac:InvoiceDocumentReference>
            <cbc:ID>Snippet1</cbc:ID>
        </cac:InvoiceDocumentReference>
    </cac:BillingReference>
    
    <!-- Supplier and Customer Parties (same structure as Invoice) -->
    <!-- ... -->
    
    <!-- Credit Note Line -->
    <cac:CreditNoteLine>
        <cbc:ID>1</cbc:ID>
        <cbc:CreditedQuantity unitCode="DAY">7</cbc:CreditedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">2800</cbc:LineExtensionAmount>
        <cac:Item>
            <cbc:Description>Description of item</cbc:Description>
            <cbc:Name>item name</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>25.0</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">400</cbc:PriceAmount>
        </cac:Price>
    </cac:CreditNoteLine>
</CreditNote>
```

### Additional Elements

#### Order Reference (Sales Order)
```xml
<cac:OrderReference>
    <cbc:ID>NA</cbc:ID><!-- NA can be provided if there is no purchase order -->
    <cbc:SalesOrderID>123456</cbc:SalesOrderID>
</cac:OrderReference>
```

#### Delivery Information
```xml
<cac:Delivery>
    <cbc:ActualDeliveryDate>2017-11-01</cbc:ActualDeliveryDate>
    <cac:DeliveryLocation>
        <cbc:ID schemeID="0088">7300010000001</cbc:ID>
        <cac:Address>
            <cbc:StreetName>Delivery street 2</cbc:StreetName>
            <cbc:AdditionalStreetName>Building 56</cbc:AdditionalStreetName>
            <cbc:CityName>Stockholm</cbc:CityName>
            <cbc:PostalZone>21234</cbc:PostalZone>
            <cbc:CountrySubentity>Södermalm</cbc:CountrySubentity>
            <cac:Country>
                <cbc:IdentificationCode>SE</cbc:IdentificationCode>
            </cac:Country>
        </cac:Address>
    </cac:DeliveryLocation>
    <cac:DeliveryParty>
        <cac:PartyName>
            <cbc:Name>Delivery party Name</cbc:Name>
        </cac:PartyName>
    </cac:DeliveryParty>
</cac:Delivery>
```

#### Payment Means
```xml
<cac:PaymentMeans>
    <cbc:PaymentMeansCode name="Credit transfer">30</cbc:PaymentMeansCode>
    <cbc:PaymentID>Snippet1</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
        <cbc:ID>IBAN32423940</cbc:ID>
        <cbc:Name>AccountName</cbc:Name>
        <cac:FinancialInstitutionBranch>
            <cbc:ID>BIC324098</cbc:ID>
        </cac:FinancialInstitutionBranch>
    </cac:PayeeFinancialAccount>
</cac:PaymentMeans>
```

#### Additional Document Reference
```xml
<cac:AdditionalDocumentReference>
    <cbc:ID schemeID="ABT">DR35141</cbc:ID>
    <cbc:DocumentTypeCode>130</cbc:DocumentTypeCode>
</cac:AdditionalDocumentReference>
```

#### Invoice Line with Allowance/Charge
```xml
<cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">10</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">4000.00</cbc:LineExtensionAmount>
    
    <!-- Line-level Charge -->
    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>true</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReasonCode>CG</cbc:AllowanceChargeReasonCode>
        <cbc:AllowanceChargeReason>Cleaning</cbc:AllowanceChargeReason>
        <cbc:MultiplierFactorNumeric>1</cbc:MultiplierFactorNumeric>
        <cbc:Amount currencyID="EUR">1</cbc:Amount>
        <cbc:BaseAmount currencyID="EUR">100</cbc:BaseAmount>
    </cac:AllowanceCharge>
    
    <!-- Line-level Discount -->
    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReasonCode>95</cbc:AllowanceChargeReasonCode>
        <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>
        <cbc:Amount currencyID="EUR">101</cbc:Amount>
    </cac:AllowanceCharge>
    
    <cac:Item>
        <cbc:Name>item name</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>25.0</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">410</cbc:PriceAmount>
        <cbc:BaseQuantity unitCode="C62">1</cbc:BaseQuantity>
    </cac:Price>
</cac:InvoiceLine>
```

### RECUPEL/BEBAT Examples

#### BEBAT/RECUPEL Inside InvoiceLine
```xml
<cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="1I">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">0.64</cbc:LineExtensionAmount>
    
    <!-- BEBAT Charge -->
    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>true</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReasonCode>AEO</cbc:AllowanceChargeReasonCode>
        <cbc:AllowanceChargeReason>BEBAT Cost</cbc:AllowanceChargeReason>
        <cbc:Amount currencyID="EUR">0.50</cbc:Amount>
        <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:TaxCategory>
    </cac:AllowanceCharge>
    
    <cac:Item>
        <cbc:Name>Product with battery</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">0.14</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>
```

#### RECUPEL/BEBAT as Separate Invoice Lines
```xml
<!-- Product Line -->
<cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="1I">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">0.14</cbc:LineExtensionAmount>
    <cac:Item>
        <cbc:Name>Product with battery</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">0.14</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>

<!-- BEBAT Cost Line -->
<cac:InvoiceLine>
    <cbc:ID>2</cbc:ID>
    <cbc:InvoicedQuantity unitCode="1I">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">0.5</cbc:LineExtensionAmount>
    <cac:Item>
        <cbc:Name>BEBAT Cost Ref Line 1</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">0.5</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>

<!-- RECUPEL Cost Line -->
<cac:InvoiceLine>
    <cbc:ID>3</cbc:ID>
    <cbc:InvoicedQuantity unitCode="1I">1</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">0.5</cbc:LineExtensionAmount>
    <cbc:Note>RECUPEL Cost Ref Line 2</cbc:Note>
    <cac:Item>
        <cbc:Name>RECUPEL Cost</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>21</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">0.5</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>
```

### Negative Invoice (Correction)
Negative invoices use negative amounts for corrections:
```xml
<cac:TaxTotal>
    <cbc:TaxAmount currencyID="EUR">-331.25</cbc:TaxAmount>
    <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">-1325</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">-331.25</cbc:TaxAmount>
        <!-- ... -->
    </cac:TaxSubtotal>
</cac:TaxTotal>
<cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="EUR">-1300</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="EUR">-1325</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="EUR">-1656.25</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="EUR">-1656.25</cbc:PayableAmount>
</cac:LegalMonetaryTotal>
```

### Invoice Line with Multiple Tax Rates
```xml
<cac:InvoiceLine>
    <cbc:ID>1</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">10</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">4000.00</cbc:LineExtensionAmount>
    <cac:Item>
        <cbc:Name>Item with 25% VAT</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>25.0</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">400</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>

<cac:InvoiceLine>
    <cbc:ID>2</cbc:ID>
    <cbc:InvoicedQuantity unitCode="C62">10</cbc:InvoicedQuantity>
    <cbc:LineExtensionAmount currencyID="EUR">2000.00</cbc:LineExtensionAmount>
    <cac:Item>
        <cbc:Name>Item with 15% VAT</cbc:Name>
        <cac:ClassifiedTaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>15.0</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
    </cac:Item>
    <cac:Price>
        <cbc:PriceAmount currencyID="EUR">200</cbc:PriceAmount>
    </cac:Price>
</cac:InvoiceLine>
```

---

### Best Practices

1. **Always Validate Before Sending**
   - Use `POST /api/v1/peppol/public/validate-document` to validate your UBL XML
   - Fix all errors and warnings before sending

2. **Use Correct Namespaces**
   ```xml
   xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
   xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
   xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
   ```

3. **Verify Peppol Identifiers**
   - Check recipient supports Peppol before sending
   - Verify Peppol identifier format matches country requirements

4. **Test with Sample Data**
   - Start with simple invoices (one line item)
   - Gradually add complexity (multiple tax rates, discounts, etc.)

5. **Monitor Webhook Events**
   - Configure webhooks to receive delivery confirmations
   - Handle errors and retries appropriately

---

## 📚 Resources

### Official Peppol Documentation
- **Peppol BIS Billing 3.0 UBL Invoice Syntax:** https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-invoice/tree/
- **Peppol BIS Billing 3.0 UBL Credit Note Syntax:** https://docs.peppol.eu/poacc/billing/3.0/syntax/ubl-creditnote/tree/
- **Peppol BIS Billing 3.0 UBL TC434 Rules:** https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-tc434/
- **Peppol BIS Billing 3.0 UBL Peppol Rules:** https://docs.peppol.eu/poacc/billing/3.0/rules/ubl-peppol/

### Digiteal Resources
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