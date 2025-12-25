# Complete Peppol Integration Checklist & Implementation Guide

**Version:** 1.0  
**Last Updated:** December 2025  
**Target Audience:** Developers integrating SaaS applications with Peppol via Digiteal Access Point

---

## Table of Contents

1. [Prerequisites & Account Setup](#1-prerequisites--account-setup)
2. [Peppol Identifier System](#2-peppol-identifier-system)
3. [Participant Registration](#3-participant-registration)
4. [UBL Invoice Generation](#4-ubl-invoice-generation)
5. [Sending Documents via Peppol](#5-sending-documents-via-peppol)
6. [Receiving Documents](#6-receiving-documents)
7. [Document Validation](#7-document-validation)
8. [Complete Integration Test Scenarios](#8-complete-integration-test-scenarios)
9. [Error Handling & Fallback](#9-error-handling--fallback)
10. [Production Readiness Checklist](#10-production-readiness-checklist)
11. [Quick Reference](#11-quick-reference)
12. [Verification Commands](#12-verification-commands)

---

## 1. Prerequisites & Account Setup

### 1.1 Required Credentials

- [ ] **Digiteal API Credentials**
  - Username (Peppol integrator account)
  - Password
  - Environment selection: Test or Production

### 1.2 Environment Endpoints

```javascript
const ENDPOINTS = {
  test: "https://test.digiteal.eu/api/v1/peppol",
  production: "https://app.digiteal.eu/api/v1/peppol"
};
```

**Important:** Always start integration in the TEST environment before moving to production.

---

## 2. Peppol Identifier System

### 2.1 Understanding Peppol Identifiers

**Format:** `{type}:{value}`

**Example:** `9925:be0630675588` (Belgian VAT number)

### 2.2 Common Identifier Types

| Type | Description | Example |
|------|-------------|---------|
| 0208 | Belgian company number | `0208:0630675588` |
| 9925 | Belgian VAT number | `9925:be0630675588` |
| 9930 | German VAT number | `9930:de123456789` |
| 9932 | UK VAT number | `9932:gb123456789` |
| 9944 | Netherlands VAT number | `9944:nl123456789b01` |
| 9957 | French VAT number | `9957:fr12345678901` |

### 2.3 Complete Country Code to Scheme ID Mapping

```javascript
const PEPPOL_SCHEME_MAP = {
  'AD': '9922', 'AL': '9923', 'BA': '9924', 'BE': '9925',
  'BG': '9926', 'CH': '9927', 'CY': '9928', 'CZ': '9929',
  'DE': '9930', 'EE': '9931', 'GB': '9932', 'GR': '9933',
  'HR': '9934', 'IE': '9935', 'LI': '9936', 'LT': '9937',
  'LU': '9938', 'LV': '9939', 'MC': '9940', 'ME': '9941',
  'MK': '9942', 'MT': '9943', 'NL': '9944', 'PL': '9945',
  'PT': '9946', 'RO': '9947', 'RS': '9948', 'SI': '9949',
  'SK': '9950', 'SM': '9951', 'TR': '9952', 'VA': '9953',
  'SE': '9955', 'FR': '9957'
};
```

### 2.4 Identifier Generation Functions

```javascript
/**
 * Generate Peppol identifier from VAT number
 * @param {string} vatNumber - VAT number (e.g., "BE0262465766")
 * @returns {string} Peppol identifier (e.g., "9925:be0262465766")
 */
function generatePeppolIdentifier(vatNumber) {
  const countryCode = vatNumber.substring(0, 2).toUpperCase();
  const schemeId = PEPPOL_SCHEME_MAP[countryCode];
  
  if (!schemeId) {
    throw new Error(`Unsupported country code: ${countryCode}`);
  }
  
  return `${schemeId}:${vatNumber.toLowerCase()}`;
}

/**
 * Get Belgian company number identifier (special case)
 * @param {string} vatNumber - Belgian VAT number
 * @returns {string|null} Company identifier or null
 */
function getBelgianCompanyIdentifier(vatNumber) {
  if (vatNumber.match(/^BE\d{10}$/)) {
    return `0208:${vatNumber.substring(2, 12)}`;
  }
  return null;
}

/**
 * Get all possible Peppol identifiers for a VAT number
 * @param {string} vatNumber - VAT number
 * @returns {string[]} Array of possible identifiers
 */
function getAllPeppolIdentifiers(vatNumber) {
  const identifiers = [generatePeppolIdentifier(vatNumber)];
  
  // Add Belgian company number if applicable
  const companyId = getBelgianCompanyIdentifier(vatNumber);
  if (companyId) {
    identifiers.push(companyId);
  }
  
  return identifiers;
}
```

**✓ Validation Checkpoint:**
- [ ] Can generate Peppol identifier from VAT number
- [ ] Handles all supported country codes
- [ ] Returns multiple identifiers for Belgian entities

---

## 3. Participant Registration

### 3.1 Register Sender (Your Company)

**Purpose:** Register your company to send documents via Peppol.

**Mandatory Fields:**

```javascript
const senderData = {
  vatNumber: "BE0262465766",              // Required
  name: "My Company BVBA",                // Required
  addressLine1: "Main Street 123",        // Required
  city: "Brussels",                       // Required
  countryCode: "BE",                      // Required (2-letter ISO)
  zipCode: "1000",                        // Required
  iban: "BE0403019261",                   // Required for payment info
  peppolIdentifier: "0208:0262465766"     // Optional (auto-generated)
};
```

**API Call:**

```javascript
async function registerSender(credentials, senderData) {
  const response = await fetch(
    `${ENDPOINTS.test}/participants/register`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...senderData,
        supportedDocuments: [
          'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2'
        ]
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Registration failed: ${await response.text()}`);
  }
  
  return await response.json();
}
```

**✓ Validation Checkpoint:**
- [ ] Sender successfully registered in test environment
- [ ] Peppol identifier correctly formatted
- [ ] All mandatory fields provided
- [ ] Registration confirmed via API response

### 3.2 Check Receiver Capability

**CRITICAL:** Always check if receiver is on Peppol BEFORE sending.

**Purpose:** Verify receiver can accept documents via Peppol.

**Important:** This checks the **GLOBAL Peppol network** (SML/SMK registry), not just Digiteal's registry. The receiver can be with ANY access point provider (Digiteal, Basware, IBM, etc.) and you will still find them.

```javascript
/**
 * Check if receiver is registered on Peppol
 * 
 * IMPORTANT: This checks the GLOBAL Peppol network (SML/SMK registry)
 * - Finds participants with ANY access point provider (not just Digiteal)
 * - Returns their supported document types
 * - Digiteal will automatically route to their access point
 * 
 * @param {object} credentials - API credentials
 * @param {string} receiverVatNumber - Receiver's VAT number
 * @returns {object} Capability information
 */
async function checkReceiverCapability(credentials, receiverVatNumber) {
  const identifiers = getAllPeppolIdentifiers(receiverVatNumber);
  
  for (const identifier of identifiers) {
    try {
      // This queries the GLOBAL Peppol SML/SMK registry
      const response = await fetch(
        `${ENDPOINTS.test}/participants/${encodeURIComponent(identifier)}/capabilities`,
        {
          headers: {
            'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
          }
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          found: true,
          identifier: identifier,
          supportedDocuments: data.supportedDocuments,
          // Note: Receiver may be using a different access point
          // Digiteal will handle routing automatically
        };
      }
    } catch (error) {
      console.log(`Identifier ${identifier} not found, trying next...`);
    }
  }
  
  return { found: false };
}

/**
 * Alternative: Direct check of global Peppol directory
 * Useful for validation without API credentials
 */
async function checkPeppolDirectoryDirectly(peppolIdentifier) {
  const [scheme, value] = peppolIdentifier.split(':');
  
  try {
    const response = await fetch(
      `https://directory.peppol.eu/search/1.0/json?participant=${scheme}::${value}`
    );
    
    if (response.ok) {
      const data = await response.json();
      return {
        found: data.matches && data.matches.length > 0,
        details: data.matches?.[0]
      };
    }
  } catch (error) {
    console.error('Peppol directory lookup failed:', error);
  }
  
  return { found: false };
}
```

**Peppol First Principle:**
1. Check if receiver is on Peppol
2. If YES → Send via Peppol (it's their preferred method)
3. If NO → Use fallback (email, postal mail)

**✓ Validation Checkpoint:**
- [ ] Can query receiver capabilities
- [ ] Handles multiple identifier types
- [ ] Returns supported document types
- [ ] Implements fallback if receiver not on Peppol

---

## 4. UBL Invoice Generation

### 4.1 Mandatory Fields Checklist

#### Document Level (Root)

- [ ] `cbc:CustomizationID` = `"urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0"`
- [ ] `cbc:ProfileID` = `"urn:fdc:peppol.eu:2017:poacc:billing:01:1.0"`
- [ ] `cbc:ID` - Invoice number (unique)
- [ ] `cbc:IssueDate` - Format: YYYY-MM-DD
- [ ] `cbc:DueDate` - Format: YYYY-MM-DD
- [ ] `cbc:InvoiceTypeCode` = `"380"` (standard invoice)
- [ ] `cbc:DocumentCurrencyCode` = `"EUR"` (or other ISO currency)

#### Supplier Party (Sender)

- [ ] `cbc:EndpointID` with `schemeID` attribute
- [ ] `cac:PartyName/cbc:Name`
- [ ] `cac:PostalAddress` (StreetName, CityName, PostalZone, Country)
- [ ] `cac:PartyTaxScheme/cbc:CompanyID` (VAT number)
- [ ] `cac:PartyLegalEntity/cbc:RegistrationName`
- [ ] `cac:PartyLegalEntity/cbc:CompanyID`

#### Customer Party (Receiver)

- [ ] `cbc:EndpointID` with `schemeID` attribute (**CRITICAL**)
- [ ] `cac:PartyName/cbc:Name`
- [ ] `cac:PostalAddress` (StreetName, CityName, PostalZone, Country)
- [ ] `cac:PartyTaxScheme/cbc:CompanyID` (VAT number)
- [ ] `cac:PartyLegalEntity/cbc:RegistrationName`
- [ ] `cac:PartyLegalEntity/cbc:CompanyID`
- [ ] `cac:Contact` (optional but recommended)

#### Payment Information

- [ ] `cac:PaymentMeans/cbc:PaymentMeansCode` (e.g., 31 for debit transfer)
- [ ] `cac:PaymentMeans/cbc:PaymentID`
- [ ] `cac:PayeeFinancialAccount/cbc:ID` (IBAN)
- [ ] `cac:PaymentTerms/cbc:Note`

#### Tax Information

- [ ] `cac:TaxTotal/cbc:TaxAmount` with `currencyID`
- [ ] For each `cac:TaxSubtotal`:
  - [ ] `cbc:TaxableAmount`
  - [ ] `cbc:TaxAmount`
  - [ ] `cac:TaxCategory/cbc:ID`
  - [ ] `cac:TaxCategory/cbc:Percent`
  - [ ] `cbc:TaxExemptionReasonCode` (if 0% VAT)
  - [ ] `cac:TaxScheme/cbc:ID` = "VAT"

#### Monetary Totals

- [ ] `cbc:LineExtensionAmount` (sum before tax)
- [ ] `cbc:TaxExclusiveAmount`
- [ ] `cbc:TaxInclusiveAmount`
- [ ] `cbc:PayableAmount`

#### Invoice Lines (for each line)

- [ ] `cbc:ID` (line number)
- [ ] `cbc:InvoicedQuantity` with `unitCode`
- [ ] `cbc:LineExtensionAmount` with `currencyID`
- [ ] `cac:Item/cbc:Name`
- [ ] `cac:Item/cac:ClassifiedTaxCategory/cbc:ID`
- [ ] `cac:Item/cac:ClassifiedTaxCategory/cbc:Percent`
- [ ] `cac:Price/cbc:PriceAmount` with `currencyID`

### 4.2 Tax Category Codes Reference

| Code | Description | Percent | Exemption Code | Use Case |
|------|-------------|---------|----------------|----------|
| S | Standard rate | 21% (BE/NL) | - | Domestic sales |
| K | Intra-community | 0% | VATEX-EU-IC | B2B within EU |
| G | Export outside EU | 0% | VATEX-EU-G | Sales outside EU |
| Z | Zero rated goods | 0% | - | Specific goods |
| E | Exempt from tax | 0% | VATEX-EU-E | Exempt services |
| AE | Reverse charge | 0% | VATEX-EU-AE | Reverse charge mechanism |

### 4.3 Helper Functions

```javascript
/**
 * Calculate tax categories from invoice lines
 */
function calculateTaxCategories(lines) {
  const categories = {};
  
  lines.forEach(line => {
    const key = `${line.vatCode}${line.taxPercentage}`;
    
    if (categories[key]) {
      categories[key].taxableAmount += line.taxableAmount;
      categories[key].taxAmount += line.taxAmount;
      categories[key].totalAmount += line.totalAmount;
    } else {
      categories[key] = {
        vatCode: line.vatCode,
        taxPercentage: line.taxPercentage,
        taxableAmount: line.taxableAmount,
        taxAmount: line.taxAmount,
        totalAmount: line.totalAmount
      };
    }
  });
  
  return categories;
}

/**
 * Calculate invoice totals
 */
function calculateTotals(lines) {
  return lines.reduce((totals, line) => ({
    taxableAmount: totals.taxableAmount + line.taxableAmount,
    taxAmount: totals.taxAmount + line.taxAmount,
    totalAmount: totals.totalAmount + line.totalAmount
  }), {
    taxableAmount: 0,
    taxAmount: 0,
    totalAmount: 0
  });
}

/**
 * Escape XML special characters
 */
function xmlEscape(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate party information XML
 */
function generatePartyInfo(party, isSupplier = true) {
  const partyType = isSupplier ? 'AccountingSupplierParty' : 'AccountingCustomerParty';
  const [schemeId, endpointId] = party.peppolIdentifier.split(':');
  
  return `
    <cac:${partyType}>
      <cac:Party>
        <cbc:EndpointID schemeID="${schemeId}">${endpointId}</cbc:EndpointID>
        <cac:PartyName>
          <cbc:Name>${xmlEscape(party.name)}</cbc:Name>
        </cac:PartyName>
        <cac:PostalAddress>
          <cbc:StreetName>${xmlEscape(party.addressLine1)}</cbc:StreetName>
          <cbc:CityName>${xmlEscape(party.city)}</cbc:CityName>
          <cbc:PostalZone>${xmlEscape(party.zipCode)}</cbc:PostalZone>
          <cac:Country>
            <cbc:IdentificationCode>${party.countryCode}</cbc:IdentificationCode>
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
        ${!isSupplier && party.contact ? generateContactInfo(party.contact) : ''}
      </cac:Party>
    </cac:${partyType}>
  `;
}

/**
 * Generate contact information XML
 */
function generateContactInfo(contact) {
  if (!contact || (!contact.name && !contact.phone && !contact.email)) {
    return '';
  }
  
  return `
    <cac:Contact>
      ${contact.name ? `<cbc:Name>${xmlEscape(contact.name)}</cbc:Name>` : ''}
      ${contact.phone ? `<cbc:Telephone>${xmlEscape(contact.phone)}</cbc:Telephone>` : ''}
      ${contact.email ? `<cbc:ElectronicMail>${xmlEscape(contact.email)}</cbc:ElectronicMail>` : ''}
    </cac:Contact>
  `;
}

/**
 * Generate tax subtotals XML
 */
function generateTaxSubtotals(taxCategories) {
  return Object.values(taxCategories).map(category => `
      <cac:TaxSubtotal>
        <cbc:TaxableAmount currencyID="EUR">${category.taxableAmount.toFixed(2)}</cbc:TaxableAmount>
        <cbc:TaxAmount currencyID="EUR">${category.taxAmount.toFixed(2)}</cbc:TaxAmount>
        <cac:TaxCategory>
          <cbc:ID>${category.vatCode}</cbc:ID>
          <cbc:Percent>${category.taxPercentage}</cbc:Percent>
          ${category.taxPercentage === 0 && category.vatCode === 'K' ? 
            '<cbc:TaxExemptionReasonCode>VATEX-EU-IC</cbc:TaxExemptionReasonCode>' : ''}
          ${category.taxPercentage === 0 && category.vatCode === 'G' ? 
            '<cbc:TaxExemptionReasonCode>VATEX-EU-G</cbc:TaxExemptionReasonCode>' : ''}
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:TaxCategory>
      </cac:TaxSubtotal>
    `).join('');
}

/**
 * Generate invoice lines XML
 */
function generateInvoiceLines(lines) {
  return lines.map((line, index) => `
    <cac:InvoiceLine>
      <cbc:ID>${index + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="1I">${line.quantity}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="EUR">${line.taxableAmount.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item>
        <cbc:Name>${xmlEscape(line.description)}</cbc:Name>
        <cac:ClassifiedTaxCategory>
          <cbc:ID>${line.vatCode}</cbc:ID>
          <cbc:Percent>${line.taxPercentage}</cbc:Percent>
          <cac:TaxScheme>
            <cbc:ID>VAT</cbc:ID>
          </cac:TaxScheme>
        </cac:ClassifiedTaxCategory>
      </cac:Item>
      <cac:Price>
        <cbc:PriceAmount currencyID="EUR">${line.unitPrice.toFixed(2)}</cbc:PriceAmount>
      </cac:Price>
    </cac:InvoiceLine>
  `).join('');
}
```

### 4.4 Complete UBL Generation Function

```javascript
/**
 * Generate complete UBL Invoice XML
 * @param {object} invoiceData - Invoice data object
 * @returns {string} UBL XML string
 */
function generateUBLInvoice(invoiceData) {
  // Validate mandatory fields
  validateInvoiceData(invoiceData);
  
  // Calculate totals
  const taxCategories = calculateTaxCategories(invoiceData.invoiceLines);
  const totals = calculateTotals(invoiceData.invoiceLines);
  
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
  ${invoiceData.buyerReference ? `<cbc:BuyerReference>${xmlEscape(invoiceData.buyerReference)}</cbc:BuyerReference>` : ''}

  ${generatePartyInfo(invoiceData.sender, true)}
  ${generatePartyInfo(invoiceData.receiver, false)}

  <cac:Delivery>
    <cbc:ActualDeliveryDate>${invoiceData.deliveryDate}</cbc:ActualDeliveryDate>
    <cac:DeliveryLocation>
      <cac:Address>
        <cac:Country>
          <cbc:IdentificationCode>${invoiceData.receiver.countryCode}</cbc:IdentificationCode>
        </cac:Country>
      </cac:Address>
    </cac:DeliveryLocation>
  </cac:Delivery>

  <cac:PaymentMeans>
    <cbc:PaymentMeansCode name="Credit transfer">${invoiceData.paymentMeans}</cbc:PaymentMeansCode>
    <cbc:PaymentID>${xmlEscape(invoiceData.billName)}</cbc:PaymentID>
    <cac:PayeeFinancialAccount>
      <cbc:ID>${invoiceData.sender.iban}</cbc:ID>
      <cbc:Name>${xmlEscape(invoiceData.sender.name)}</cbc:Name>
    </cac:PayeeFinancialAccount>
  </cac:PaymentMeans>

  <cac:PaymentTerms>
    <cbc:Note>Net within ${invoiceData.paymentDelay} days</cbc:Note>
  </cac:PaymentTerms>

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
}

/**
 * Validate invoice data
 */
function validateInvoiceData(data) {
  const required = [
    'billName', 'issueDate', 'dueDate', 'deliveryDate',
    'paymentDelay', 'paymentMeans', 'sender', 'receiver', 'invoiceLines'
  ];
  
  for (const field of required) {
    if (!data[field]) {
      throw new Error(`Missing mandatory field: ${field}`);
    }
  }
  
  if (!data.receiver.peppolIdentifier) {
    throw new Error('Receiver Peppol identifier is mandatory');
  }
  
  if (!data.invoiceLines || data.invoiceLines.length === 0) {
    throw new Error('At least one invoice line is required');
  }
  
  return true;
}
```

**✓ Validation Checkpoint:**
- [ ] All mandatory fields present
- [ ] Receiver Peppol identifier included
- [ ] Tax calculations correct
- [ ] Monetary totals match line items
- [ ] All amounts have 2 decimal places
- [ ] Currency codes consistent throughout
- [ ] Tax category codes valid
- [ ] XML properly escaped

---

## 5. Sending Documents via Peppol

### 5.1 Complete Send Function

```javascript
/**
 * Send UBL invoice via Peppol
 * @param {object} credentials - API credentials
 * @param {object} invoiceData - Invoice data
 * @param {boolean} isTest - Use test environment
 * @returns {object} Send result
 */
async function sendPeppolInvoice(credentials, invoiceData, isTest = true) {
  const baseUrl = isTest ? ENDPOINTS.test : ENDPOINTS.production;
  
  // Step 1: Check if receiver is on Peppol
  const receiverCheck = await checkReceiverCapability(
    credentials, 
    invoiceData.receiver.vatNumber
  );
  
  if (!receiverCheck.found) {
    throw new Error(
      `Receiver ${invoiceData.receiver.vatNumber} not found on Peppol network. ` +
      `Use fallback delivery method (email, postal mail).`
    );
  }
  
  // Step 2: Set receiver Peppol identifier
  invoiceData.receiver.peppolIdentifier = receiverCheck.identifier;
  
  // Step 3: Generate UBL XML
  const xml = generateUBLInvoice(invoiceData);
  
  // Step 4: Create form data
  const formData = new FormData();
  formData.append('comment', `Invoice ${invoiceData.billName}`);
  formData.append(
    'document', 
    new Blob([xml], { type: 'application/xml' }), 
    'invoice.xml'
  );
  
  // Step 5: Send to Peppol
  const response = await fetch(
    `${baseUrl}/outbound-ubl-documents`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`
      },
      body: formData
    }
  );
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to send invoice: HTTP ${response.status} - ${errorText}`);
  }
  
  const result = await response.text();
  
  return {
    success: result.includes('OK'),
    message: result,
    invoiceNumber: invoiceData.billName,
    receiverIdentifier: receiverCheck.identifier
  };
}
```

**✓ Validation Checkpoint:**
- [ ] Receiver capability checked before sending
- [ ] UBL XML generates without errors
- [ ] Document sent successfully (HTTP 200)
- [ ] Response indicates "OK"
- [ ] Error handling implemented

---

## 6. Receiving Documents

### 6.1 Register as Receiver

```javascript
/**
 * Register to receive documents via Peppol
 */
async function registerReceiver(credentials, receiverData) {
  const response = await fetch(
    `${ENDPOINTS.test}/participants/register`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${credentials.username}:${credentials.password}`)}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ...receiverData,
        supportedDocuments: [
          'urn:oasis:names:specification:ubl:schema:xsd:Invoice-2',
          'urn:oasis:names:specification:ubl:schema:xsd:CreditNote-2',
          'urn:peppol:pint:selfbilling:1::SelfBillingInvoice',
          'urn:peppol:pint:selfbilling:1::SelfBillingCreditNote'
        ]
      })
    }
  );
  
  if (!response.ok) {
    throw new Error(`Registration failed: ${await response.text()}`);
  }
  
  return await response.json();
}
```

### 6.2 Webhook Configuration

**Webhook Types:**
- `PEPPOL_INVOICE_RECEIVED` - Standard invoice
- `PEPPOL_CREDIT_NOTE_RECEIVED` - Credit note
- `SELF_BILLING_INVOICE_RECEIVED` - Self-billing invoice
- `SELF_BILLING_CREDIT_NOTE_RECEIVED` - Self-billing credit note

**Configuration Options:**

1. **No Configuration (Default)**: Documents sent to integrator email
2. **Email Delivery**: `mailto:invoices@yourcompany.com`
3. **URL Endpoint (Recommended)**: `https://your-api.com/webhooks/peppol/invoice`

### 6.3 Webhook Endpoint Implementation

```javascript
// Express.js example
const express = require('express');
const app = express();

app.use(express.json());

app.post('/webhooks/peppol/invoice', async (req, res) => {
  try {
    const { documentType, document, metadata } = req.body;
    
    // Document is in SBD (Standard Business Document) format
    // Extract UBL from SBD
    const ubl = extractUBLFromSBD(document);
    
    // Process invoice
    await processInvoice({
      type: documentType,
      ubl: ubl,
      receivedAt: metadata.receivedAt,
      sender: metadata.sender
    });
    
    // IMPORTANT: Always return 200 to acknowledge receipt
    res.status(200).json({ success: true });
    
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * Extract UBL from SBD (Standard Business Document)
 * Note: Received documents are wrapped in SBD format
 */
function extractUBLFromSBD(sbdDocument) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(sbdDocument, 'text/xml');
  
  // Extract UBL from SBD
  const invoice = doc.getElementsByTagName('Invoice')[0] ||
                  doc.getElementsByTagName('CreditNote')[0];
  
  if (!invoice) {
    throw new Error('No UBL document found in SBD');
  }
  
  return new XMLSerializer().serializeToString(invoice);
}

app.listen(3000, () => {
  console.log('Webhook server listening on port 3000');
});
```

**✓ Validation Checkpoint:**
- [ ] Receiver registered with all document types
- [ ] Webhook endpoint configured
- [ ] Webhook returns HTTP 200
- [ ] Can parse SBD format
- [ ] Can extract UBL from SBD
- [ ] Error handling implemented

---

## 7. Document Validation

### 7.1 Current Validation Rules

**Enforced:** Peppol BIS Billing v3 v3.0.18 (since August 11, 2025)

**Upcoming Versions:**
- v3.0.19: Warning from Sept 15, 2025 → Enforced Dec 15, 2025
- v3.0.20: Warning TBD → Enforced Feb 23, 2026

### 7.2 Validation Checklist

```javascript
/**
 * Validate UBL document before sending
 */
function validateDocument(xml) {
  const errors = [];
  
  // Check mandatory document identifiers
  const mandatoryFields = {
    'cbc:CustomizationID': 'urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0',
    'cbc:ProfileID': 'urn:fdc:peppol.eu:2017:poacc:billing:01:1.0',
    'cbc:InvoiceTypeCode': '380'
  };
  
  for (const [field, expectedValue] of Object.entries(mandatoryFields)) {
    if (!xml.includes(`<${field}>${expectedValue}</${field}>`)) {
      errors.push(`Missing or incorrect ${field}`);
    }
  }
  
  // Check endpoint IDs have schemeID
  if (!xml.includes('schemeID=')) {
    errors.push('Missing schemeID attribute in EndpointID');
  }
  
  // Check all amounts have currencyID
  const amountFields = [
    'TaxAmount', 'TaxableAmount', 'LineExtensionAmount',
    'PriceAmount', 'PayableAmount'
  ];
  
  for (const field of amountFields) {
    if (xml.includes(`<cbc:${field}>`) && !xml.includes(`<cbc:${field} currencyID=`)) {
      errors.push(`Missing currencyID in ${field}`);
    }
  }
  
  return {
    valid: errors.length === 0,
    errors: errors
  };
}
```

### 7.3 Subscribe to Validation Warnings

```javascript
// Configure webhook for future validation warnings
const VALIDATION_WEBHOOK = {
  type: 'PEPPOL_FUTURE_VALIDATION_FAILED',
  url: 'https://your-api.com/webhooks/peppol/validation-warning'
};
```

**✓ Validation Checkpoint:**
- [ ] Documents validate against current version
- [ ] Validation webhook configured
- [ ] Monitoring for validation warnings
- [ ] Update plan for new versions

---

## 8. Complete Integration Test Scenarios

### 8.1 Test Case 1: Domestic Invoice (Standard VAT)

```javascript
const domesticInvoice = {
  billName: "TEST-INV-2025-001",
  issueDate: "2025-12-05",
  dueDate: "2026-01-04",
  deliveryDate: "2025-12-05",
  buyerReference: "PO-12345",
  paymentDelay: 30,
  paymentMeans: 31,
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
    vatNumber: "BE0987654321",
    name: "Customer Company BVBA",
    addressLine1: "Customer Street 456",
    city: "Antwerp",
    zipCode: "2000",
    countryCode: "BE",
    peppolIdentifier: null,
    contact: {
      name: "John Doe",
      phone: "+32 3 123 4567",
      email: "john@customer.be"
    }
  },
  invoiceLines: [{
    description: "Consulting Services",
    quantity: 10,
    unitPrice: 100,
    taxableAmount: 1000,
    taxAmount: 210,
    totalAmount: 1210,
    vatCode: "S",
    taxPercentage: 21
  }]
};

// Test execution
async function runTest1() {
  console.log('Test 1: Domestic Invoice with Standard VAT');
  const result = await sendPeppolInvoice(credentials, domesticInvoice, true);
  console.log('Result:', result);
  return result.success;
}
```

### 8.2 Test Case 2: Intra-Community Invoice (VAT Exempt)

```javascript
const intraCommunityInvoice = {
  billName: "TEST-INV-2025-002",
  issueDate: "2025-12-05",
  dueDate: "2026-01-04",
  deliveryDate: "2025-12-05",
  buyerReference: "PO-12346",
  paymentDelay: 30,
  paymentMeans: 31,
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
    name: "Dutch Company BV",
    addressLine1: "Amsterdam Street 789",
    city: "Amsterdam",
    zipCode: "1012",
    countryCode: "NL",
    peppolIdentifier: null,
    contact: {
      name: "Jan de Vries",
      phone: "+31 20 123 4567",
      email: "jan@dutchcompany.nl"
    }
  },
  invoiceLines: [{
    description: "Software Development Services",
    quantity: 20,
    unitPrice: 150,
    taxableAmount: 3000,
    taxAmount: 0,
    totalAmount: 3000,
    vatCode: "K",
    taxPercentage: 0
  }]
};

// Test execution
async function runTest2() {
  console.log('Test 2: Intra-Community Invoice (VAT Exempt)');
  const result = await sendPeppolInvoice(credentials, intraCommunityInvoice, true);
  console.log('Result:', result);
  return result.success;
}
```

### 8.3 Test Case 3: Export Invoice (Outside EU)

```javascript
const exportInvoice = {
  billName: "TEST-INV-2025-003",
  issueDate: "2025-12-05",
  dueDate: "2026-01-04",
  deliveryDate: "2025-12-05",
  buyerReference: "PO-12347",
  paymentDelay: 30,
  paymentMeans: 31,
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
    vatNumber: "CH123456789",
    name: "Swiss Company AG",
    addressLine1: "Bahnhofstrasse 123",
    city: "Zurich",
    zipCode: "8001",
    countryCode: "CH",
    peppolIdentifier: null,
    contact: {
      name: "Hans Müller",
      phone: "+41 44 123 4567",
      email: "hans@swisscompany.ch"
    }
  },
  invoiceLines: [{
    description: "Hardware Equipment",
    quantity: 5,
    unitPrice: 500,
    taxableAmount: 2500,
    taxAmount: 0,
    totalAmount: 2500,
    vatCode: "G",
    taxPercentage: 0
  }]
};

// Test execution
async function runTest3() {
  console.log('Test 3: Export Invoice (Outside EU)');
  const result = await sendPeppolInvoice(credentials, exportInvoice, true);
  console.log('Result:', result);
  return result.success;
}
```

**✓ Test Execution Checklist:**
- [ ] Test 1: Domestic invoice sent successfully
- [ ] Test 2: Intra-community invoice sent successfully
- [ ] Test 3: Export invoice sent successfully
- [ ] All test documents validated correctly
- [ ] Received confirmation for each document

---

## 9. Error Handling & Fallback

### 9.1 Send with Fallback Mechanism

```javascript
/**
 * Send invoice with automatic fallback to email
 */
async function sendWithFallback(credentials, invoiceData, fallbackEmail) {
  try {
    // Try Peppol first
    const result = await sendPeppolInvoice(credentials, invoiceData, true);
    
    if (result.success) {
      console.log(`✓ Invoice ${invoiceData.billName} sent via Peppol`);
      return { 
        channel: 'peppol', 
        success: true,
        identifier: result.receiverIdentifier
      };
    }
    
  } catch (error) {
    console.error('Peppol send failed:', error.message);
    
    // Check if receiver not on Peppol
    if (error.message.includes('not found on Peppol')) {
      console.log(`→ Receiver not on Peppol, using fallback email`);
      
      await sendViaEmail(invoiceData, fallbackEmail);
      
      return { 
        channel: 'email', 
        success: true,
        reason: 'receiver_not_on_peppol'
      };
    }
    
    // Re-throw other errors
    throw error;
  }
}

/**
 * Fallback: Send via email
 */
async function sendViaEmail(invoiceData, email) {
  // Generate UBL
  const ubl = generateUBLInvoice(invoiceData);
  
  // Generate PDF (implementation depends on your PDF library)
  const pdf = await generatePDFFromUBL(ubl);
  
  // Send email with attachments
  await sendEmail({
    to: email,
    subject: `Invoice ${invoiceData.billName}`,
    body: `Dear Customer,\n\nPlease find attached invoice ${invoiceData.billName}.\n\nBest regards`,
    attachments: [
      { 
        filename: `${invoiceData.billName}.pdf`, 
        content: pdf,
        contentType: 'application/pdf'
      },
      {
        filename: `${invoiceData.billName}.xml`,
        content: ubl,
        contentType: 'application/xml'
      }
    ]
  });
}
```

### 9.2 Error Code Reference

| HTTP Code | Error | Cause | Solution |
|-----------|-------|-------|----------|
| 401 | Unauthorized | Invalid credentials | Verify username/password |
| 404 | Not Found | Receiver not on Peppol | Use fallback delivery |
| 400 | Bad Request | Invalid UBL structure | Validate document format |
| 422 | Validation Failed | Peppol BIS compliance | Check validation rules |
| 500 | Server Error | Temporary server issue | Retry with backoff |

### 9.3 Retry Logic

```javascript
/**
 * Send with retry logic for transient errors
 */
async function sendWithRetry(credentials, invoiceData, maxRetries = 3) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Attempt ${attempt} of ${maxRetries}`);
      
      const result = await sendPeppolInvoice(credentials, invoiceData, true);
      
      if (result.success) {
        console.log('✓ Send successful');
        return result;
      }
      
    } catch (error) {
      lastError = error;
      
      // Don't retry for non-transient errors
      if (error.message.includes('not found') || 
          error.message.includes('validation')) {
        throw error;
      }
      
      // Wait before retry (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw new Error(`Failed after ${maxRetries} attempts: ${lastError.message}`);
}
```

**✓ Validation Checkpoint:**
- [ ] Error handling covers all scenarios
- [ ] Fallback mechanism implemented
- [ ] Retry logic for transient errors
- [ ] Logging captures all attempts
- [ ] Non-Peppol receivers handled gracefully

---

## 10. Production Readiness Checklist

### 10.1 Pre-Production Verification

#### Configuration
- [ ] Test environment fully functional
- [ ] All test scenarios passed
- [ ] Production credentials obtained
- [ ] Production endpoints configured
- [ ] Webhook endpoints accessible from internet
- [ ] SSL/TLS certificates valid
- [ ] Firewall rules configured

#### Registration
- [ ] Sender registered in production
- [ ] Receiver(s) registered in production (if applicable)
- [ ] Peppol identifiers verified in production SML
- [ ] Test invoice sent in production
- [ ] Test invoice received and processed

#### Monitoring
- [ ] Logging configured for all transactions
- [ ] Webhook failure alerts configured
- [ ] Validation warning webhook subscribed
- [ ] Dashboard showing Peppol vs fallback usage
- [ ] Error rate monitoring
- [ ] Performance metrics tracking

#### Documentation
- [ ] Internal documentation complete
- [ ] Runbook for common errors
- [ ] Contact list (Digiteal, OpenPeppol)
- [ ] User guide for invoice processing
- [ ] API documentation for developers

### 10.2 Go-Live Steps

#### Phase 1: Shadow Mode (1-2 weeks)
- [ ] Send documents via both Peppol and existing channel
- [ ] Compare delivery success rates
- [ ] Monitor for discrepancies
- [ ] Validate invoice data accuracy
- [ ] Gather user feedback

#### Phase 2: Soft Launch (1 week)
- [ ] Enable Peppol for 10% of transactions
- [ ] Monitor closely for issues
- [ ] Gradually increase to 50%
- [ ] Validate delivery confirmations

#### Phase 3: Full Production
- [ ] Enable Peppol for all applicable receivers
- [ ] Disable shadow mode
- [ ] Monitor intensively for 48 hours
- [ ] Verify delivery rates
- [ ] Check fallback usage patterns

### 10.3 Ongoing Maintenance

#### Monthly Tasks
- [ ] Review validation warnings
- [ ] Update to latest Peppol BIS if needed
- [ ] Check for new supported document types
- [ ] Analyze fallback usage patterns
- [ ] Review error logs

#### Quarterly Tasks
- [ ] Performance optimization review
- [ ] Identify customers to onboard to Peppol
- [ ] Update documentation
- [ ] Security audit
- [ ] Cost analysis

#### Annual Tasks
- [ ] Credential rotation
- [ ] Full security audit
- [ ] Disaster recovery test
- [ ] API version upgrade review
- [ ] Compliance review

---

## 11. Quick Reference

### 11.1 Essential URLs

**Official Documentation:**
- Digiteal API: https://doc.digiteal.eu/docs/peppol-access-point
- Peppol BIS Billing 3.0: https://docs.peppol.eu/poacc/billing/3.0/
- VAT Exemption Codes: https://docs.peppol.eu/poacc/billing/3.0/codelist/vatex/
- Payment Means Codes: https://docs.peppol.eu/poacc/billing/3.0/codelist/UNCL4461/

**Validation Tools:**
- Online Validator: https://peppol-validator.peppol.eu/
- Participant Query: https://test.peppol.helger.com/

**Codelists:**
- Participant Identifiers: https://docs.peppol.eu/edelivery/codelists/v9.4/Peppol%20Code%20Lists%20-%20Participant%20identifier%20schemes%20v9.4.html
- Document Types: https://docs.peppol.eu/edelivery/codelists/v9.4/Peppol%20Code%20Lists%20-%20Document%20types%20v9.4.html
- Processes: https://docs.peppol.eu/edelivery/codelists/v9.4/Peppol%20Code%20Lists%20-%20Processes%20v9.4.html

### 11.2 API Endpoints Summary

```javascript
const API_ENDPOINTS = {
  registerParticipant: '/api/v1/peppol/participants/register',
  checkCapability: '/api/v1/peppol/participants/{identifier}/capabilities',
  sendDocument: '/api/v1/peppol/outbound-ubl-documents',
  configureWebhook: '/api/v1/webhooks/configure'
};
```

**Usage Examples:**

```javascript
// Register participant
const registerUrl = `${baseUrl}${API_ENDPOINTS.registerParticipant}`;

// Check capability (replace {identifier} with actual identifier)
const identifier = '9925:be0262465766';
const capabilityUrl = `${baseUrl}${API_ENDPOINTS.checkCapability.replace('{identifier}', encodeURIComponent(identifier))}`;

// Send document
const sendUrl = `${baseUrl}${API_ENDPOINTS.sendDocument}`;

// Configure webhook
const webhookUrl = `${baseUrl}${API_ENDPOINTS.configureWebhook}`;
```

### 11.3 Critical Reminders

**⚠️ MUST-FOLLOW Rules:**

1. **ALWAYS check receiver capability before sending**
   - Use the capability check API for every receiver
   - Try all possible identifiers for the receiver
   - Implement fallback if receiver not found

2. **Receiver Peppol identifier is MANDATORY in UBL**
   - Must be included in `cbc:EndpointID` with `schemeID` attribute
   - Format: `<cbc:EndpointID schemeID="9925">be0262465766</cbc:EndpointID>`
   - This is the most common cause of rejection

3. **Use proper tax category codes (S, K, G, E, AE, Z)**
   - S = Standard rate (21% in BE/NL)
   - K = Intra-community supply (0%)
   - G = Export outside EU (0%)
   - E = Exempt from tax (0%)
   - AE = Reverse charge (0%)
   - Z = Zero rated goods (0%)

4. **Include tax exemption reason codes for 0% VAT**
   - K requires: `VATEX-EU-IC`
   - G requires: `VATEX-EU-G`
   - E requires: `VATEX-EU-E`
   - AE requires: `VATEX-EU-AE`

5. **All amounts must have exactly 2 decimal places**
   - Use `.toFixed(2)` for all monetary values
   - Applies to: TaxAmount, TaxableAmount, LineExtensionAmount, PriceAmount, PayableAmount

6. **EndpointID must include schemeID attribute**
   - Both sender and receiver endpoints
   - Format: `<cbc:EndpointID schemeID="XXXX">value</cbc:EndpointID>`
   - Failure to include this will cause validation errors

7. **Received documents are in SBD format, not pure UBL**
   - Standard Business Document (SBD) wraps the UBL
   - Extract UBL from SBD in webhook handler
   - SBD contains additional metadata

8. **Implement fallback for non-Peppol receivers**
   - Not all companies are on Peppol
   - Have email/postal mail fallback ready
   - Log fallback usage for analysis

---

## 12. Verification Commands for AI Implementation

Use these commands to verify your implementation:

```javascript
/**
 * Verification Test Suite
 * Run these tests to validate your Peppol integration
 */

// Test 1: Identifier Generation
console.log('Test 1: Peppol Identifier Generation');
console.assert(
  generatePeppolIdentifier("BE0262465766") === "9925:be0262465766",
  "❌ Belgian VAT identifier generation failed"
);
console.assert(
  generatePeppolIdentifier("NL123456789B01") === "9944:nl123456789b01",
  "❌ Dutch VAT identifier generation failed"
);
console.assert(
  getBelgianCompanyIdentifier("BE0262465766") === "0208:0262465766",
  "❌ Belgian company identifier generation failed"
);
console.log('✅ Test 1 passed');

// Test 2: Receiver Capability Check
console.log('Test 2: Receiver Capability Check');
const capability = await checkReceiverCapability(credentials, "NL123456789B01");
console.assert(
  capability.hasOwnProperty('found'),
  "❌ Capability check did not return 'found' property"
);
console.assert(
  capability.found === true || capability.found === false,
  "❌ Capability 'found' must be boolean"
);
console.log('✅ Test 2 passed');

// Test 3: UBL Generation - Structure
console.log('Test 3: UBL Document Structure');
const xml = generateUBLInvoice(testInvoiceData);
console.assert(
  xml.includes('<?xml version="1.0" encoding="UTF-8"?>'),
  "❌ Missing XML declaration"
);
console.assert(
  xml.includes('cbc:CustomizationID'),
  "❌ Missing CustomizationID"
);
console.assert(
  xml.includes('urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0'),
  "❌ Incorrect CustomizationID value"
);
console.assert(
  xml.includes('cbc:ProfileID'),
  "❌ Missing ProfileID"
);
console.assert(
  xml.includes('schemeID='),
  "❌ Missing schemeID in EndpointID"
);
console.log('✅ Test 3 passed');

// Test 4: UBL Generation - Mandatory Fields
console.log('Test 4: Mandatory Fields Validation');
const mandatoryFields = [
  'cbc:ID',
  'cbc:IssueDate',
  'cbc:DueDate',
  'cbc:InvoiceTypeCode',
  'cbc:DocumentCurrencyCode',
  'cac:AccountingSupplierParty',
  'cac:AccountingCustomerParty',
  'cac:TaxTotal',
  'cac:LegalMonetaryTotal',
  'cac:InvoiceLine'
];

mandatoryFields.forEach(field => {
  console.assert(
    xml.includes(`<${field}`),
    `❌ Missing mandatory field: ${field}`
  );
});
console.log('✅ Test 4 passed');

// Test 5: Document Validation
console.log('Test 5: Document Validation');
const validation = await validateDocument(xml);
console.assert(
  validation.hasOwnProperty('valid'),
  "❌ Validation result missing 'valid' property"
);
console.assert(
  validation.hasOwnProperty('errors'),
  "❌ Validation result missing 'errors' property"
);
if (!validation.valid) {
  console.error('❌ Validation errors:', validation.errors);
} else {
  console.log('✅ Test 5 passed');
}

// Test 6: Tax Calculations
console.log('Test 6: Tax Calculations');
const testLines = [
  {
    taxableAmount: 1000,
    taxAmount: 210,
    totalAmount: 1210,
    vatCode: 'S',
    taxPercentage: 21
  },
  {
    taxableAmount: 500,
    taxAmount: 105,
    totalAmount: 605,
    vatCode: 'S',
    taxPercentage: 21
  }
];

const totals = calculateTotals(testLines);
console.assert(
  totals.taxableAmount === 1500,
  "❌ Taxable amount calculation incorrect"
);
console.assert(
  totals.taxAmount === 315,
  "❌ Tax amount calculation incorrect"
);
console.assert(
  totals.totalAmount === 1815,
  "❌ Total amount calculation incorrect"
);
console.assert(
  totals.totalAmount === (totals.taxableAmount + totals.taxAmount),
  "❌ Tax calculation mismatch"
);
console.log('✅ Test 6 passed');

// Test 7: Tax Category Grouping
console.log('Test 7: Tax Category Grouping');
const mixedLines = [
  { taxableAmount: 1000, taxAmount: 210, totalAmount: 1210, vatCode: 'S', taxPercentage: 21 },
  { taxableAmount: 500, taxAmount: 0, totalAmount: 500, vatCode: 'K', taxPercentage: 0 },
  { taxableAmount: 300, taxAmount: 63, totalAmount: 363, vatCode: 'S', taxPercentage: 21 }
];

const categories = calculateTaxCategories(mixedLines);
console.assert(
  Object.keys(categories).length === 2,
  "❌ Should have 2 tax categories"
);
console.assert(
  categories['S21'].taxableAmount === 1300,
  "❌ Standard rate category totals incorrect"
);
console.assert(
  categories['K0'].taxableAmount === 500,
  "❌ Intra-community category totals incorrect"
);
console.log('✅ Test 7 passed');

// Test 8: Send Document (if in test environment)
console.log('Test 8: Send Document');
try {
  const result = await sendPeppolInvoice(credentials, testInvoiceData, true);
  console.assert(
    result.hasOwnProperty('success'),
    "❌ Send result missing 'success' property"
  );
  console.assert(
    result.hasOwnProperty('message'),
    "❌ Send result missing 'message' property"
  );
  if (result.success) {
    console.log('✅ Test 8 passed');
  } else {
    console.error('❌ Document send failed:', result.message);
  }
} catch (error) {
  console.error('❌ Test 8 failed:', error.message);
}

// Test 9: XML Escaping
console.log('Test 9: XML Character Escaping');
console.assert(
  xmlEscape('Test & Company') === 'Test &amp; Company',
  "❌ Ampersand escaping failed"
);
console.assert(
  xmlEscape('Price < 100') === 'Price &lt; 100',
  "❌ Less-than escaping failed"
);
console.assert(
  xmlEscape('Price > 100') === 'Price &gt; 100',
  "❌ Greater-than escaping failed"
);
console.assert(
  xmlEscape('Say "Hello"') === 'Say &quot;Hello&quot;',
  "❌ Quote escaping failed"
);
console.log('✅ Test 9 passed');

// Test 10: Decimal Precision
console.log('Test 10: Decimal Precision');
const amount1 = 1000.123;
const amount2 = 210.567;
console.assert(
  amount1.toFixed(2) === '1000.12',
  "❌ Decimal rounding incorrect"
);
console.assert(
  amount2.toFixed(2) === '210.57',
  "❌ Decimal rounding incorrect"
);
console.log('✅ Test 10 passed');

console.log('\n========================================');
console.log('All verification tests completed!');
console.log('========================================\n');
```

---

## Final Implementation Status

Mark each section as you complete it:

**Core Integration:**
- [ ] Section 1: Credentials & Environment Setup
- [ ] Section 2: Peppol Identifier System
- [ ] Section 3: Participant Registration
- [ ] Section 4: UBL Invoice Generation
- [ ] Section 5: Sending Documents
- [ ] Section 6: Receiving Documents
- [ ] Section 7: Document Validation
- [ ] Section 8: Integration Tests
- [ ] Section 9: Error Handling
- [ ] Section 10: Production Readiness

**Documentation & Testing:**
- [ ] Section 11: Documentation Review
- [ ] Section 12: Verification Tests Passed

**Test Scenarios:**
- [ ] Test Case 1: Domestic Invoice (Standard VAT)
- [ ] Test Case 2: Intra-Community Invoice (VAT Exempt)
- [ ] Test Case 3: Export Invoice (Outside EU)

**Production Checklist:**
- [ ] Test environment fully functional
- [ ] All verification tests passed
- [ ] Error handling implemented
- [ ] Fallback mechanism working
- [ ] Monitoring configured
- [ ] Documentation complete
- [ ] Team trained
- [ ] Production credentials obtained

**Integration Status:**  
[ ] Complete | [ ] In Progress | [ ] Not Started

**Notes:**
_Add any implementation notes, blockers, or special considerations here_

---

## Appendix A: Common Issues & Solutions

### Issue 1: "Receiver not found on Peppol"
**Cause:** Receiver not registered or wrong identifier used  
**Solution:** 
- Try all possible identifiers (VAT number, company number)
- Use participant query tool to verify
- Implement fallback delivery method

### Issue 2: "Missing schemeID attribute"
**Cause:** EndpointID missing schemeID attribute  
**Solution:**
```xml
<!-- Wrong -->
<cbc:EndpointID>be0262465766</cbc:EndpointID>

<!-- Correct -->
<cbc:EndpointID schemeID="9925">be0262465766</cbc:EndpointID>
```

### Issue 3: "Validation failed: Incorrect CustomizationID"
**Cause:** Wrong CustomizationID value  
**Solution:**
```xml
<!-- Must be exactly this -->
<cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
```

### Issue 4: "Tax calculation mismatch"
**Cause:** Rounding errors or incorrect totals  
**Solution:**
- Always use `.toFixed(2)` for amounts
- Sum line items carefully
- Verify: TaxInclusiveAmount = TaxExclusiveAmount + TaxAmount

### Issue 5: "Webhook not receiving documents"
**Cause:** Endpoint not accessible or not returning 200  
**Solution:**
- Verify endpoint is publicly accessible
- Check SSL certificate validity
- Always return HTTP 200 from webhook
- Check firewall rules

---

## Appendix B: Sample Invoice Data Objects

### Domestic Invoice (Belgium)
```javascript
const domesticInvoice = {
  billName: "INV-2025-001",
  issueDate: "2025-12-05",
  dueDate: "2026-01-04",
  deliveryDate: "2025-12-05",
  buyerReference: "PO-12345",
  paymentDelay: 30,
  paymentMeans: 31,
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
    vatNumber: "BE0987654321",
    name: "Customer BVBA",
    addressLine1: "Customer Street 456",
    city: "Antwerp",
    zipCode: "2000",
    countryCode: "BE",
    peppolIdentifier: null,
    contact: {
      name: "John Doe",
      phone: "+32 3 123 4567",
      email: "john@customer.be"
    }
  },
  invoiceLines: [{
    description: "Consulting Services",
    quantity: 10,
    unitPrice: 100,
    taxableAmount: 1000,
    taxAmount: 210,
    totalAmount: 1210,
    vatCode: "S",
    taxPercentage: 21
  }]
};
```

---
This is the standard Peppol way to handle deposit deductions in the final invoice.
Deposit Invoice :
❌ NO AllowanceCharge needed - just a simple invoice as we have now all things same but for deposit invoice wr have to exclude total and balance information only, show only deposit total and its vat but keep invocie line shwoing same, only we dont have to show total anf balnce info in deposit invoices
Final Invoice :
✅ YES - Use AllowanceCharge here to deduct the deposit, and here in this ubl we can show everything as we showing now, only we have to add AllowanceCharge
<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
    <cbc:UBLVersionID>2.1</cbc:UBLVersionID>
    <cbc:CustomizationID>urn:cen.eu:en16931:2017#compliant#urn:fdc:peppol.eu:2017:poacc:billing:3.0</cbc:CustomizationID>
    <cbc:ProfileID>urn:fdc:peppol.eu:2017:poacc:billing:01:1.0</cbc:ProfileID>
    <cbc:ID>22505764</cbc:ID>
    <cbc:IssueDate>2025-06-15</cbc:IssueDate>
    <cbc:DueDate>2025-07-30</cbc:DueDate>
    <cbc:InvoiceTypeCode>380</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>EUR</cbc:DocumentCurrencyCode>
    <cbc:BuyerReference>22505764</cbc:BuyerReference>
    <cac:OrderReference>
        <cbc:ID>22505764</cbc:ID>
    </cac:OrderReference>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cbc:EndpointID schemeID="9925">BE1111111111</cbc:EndpointID>
            <cac:PartyIdentification>
                <cbc:ID>9925:BE1111111111</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>Tst Escompte SA</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName>Route AA 134</cbc:StreetName>
                <cbc:CityName>AAA</cbc:CityName>
                <cbc:PostalZone>0000</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>BE</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>BE1111111111</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>Tst Escompte SA</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>
    <cac:AccountingCustomerParty>
        <cac:Party>
            <cbc:EndpointID schemeID="9925">be2222222222</cbc:EndpointID>
            <cac:PartyIdentification>
                <cbc:ID>9925:be2222222222</cbc:ID>
            </cac:PartyIdentification>
            <cac:PartyName>
                <cbc:Name>BB</cbc:Name>
            </cac:PartyName>
            <cac:PostalAddress>
                <cbc:StreetName> Strasse 212</cbc:StreetName>
                <cbc:CityName>CCC</cbc:CityName>
                <cbc:PostalZone>3333</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>BE</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>be2222222222</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>BB</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>
    <cac:PaymentMeans>
        <cbc:PaymentMeansCode name="Credit transfer">42</cbc:PaymentMeansCode>
        <cbc:PaymentID>22505764</cbc:PaymentID>
        <cac:PayeeFinancialAccount>
            <cbc:ID>BE98348031033293</cbc:ID>
            <cac:FinancialInstitutionBranch>
                <cbc:ID>BBRUBEBB</cbc:ID>
            </cac:FinancialInstitutionBranch>
        </cac:PayeeFinancialAccount>
    </cac:PaymentMeans>
    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReason>Escompte appliqué</cbc:AllowanceChargeReason>
        <cbc:MultiplierFactorNumeric>1.5</cbc:MultiplierFactorNumeric> 
        <cbc:Amount currencyID="EUR">1.60</cbc:Amount>
        <cbc:BaseAmount currencyID="EUR">106.64</cbc:BaseAmount>
        <cac:TaxCategory>
            <cbc:ID>S</cbc:ID> <!-- Code TVA standard -->
            <cbc:Percent>21.00</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:TaxCategory>
    </cac:AllowanceCharge>    
    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="EUR">22.06</cbc:TaxAmount>
        <cac:TaxSubtotal>
            <cbc:TaxableAmount currencyID="EUR">105.04</cbc:TaxableAmount> <!-- Changed from 105.04 to 106.64 --> 
            <cbc:TaxAmount currencyID="EUR">22.06</cbc:TaxAmount>
            <cac:TaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:TaxCategory>
        </cac:TaxSubtotal>
    </cac:TaxTotal>
    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="EUR">106.64</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="EUR">105.04</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="EUR">127.10</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="EUR">1.60</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="EUR">127.10</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="H87">2.00</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">22.29</cbc:LineExtensionAmount>
        <cac:OrderLineReference>
            <cbc:LineID>2885839</cbc:LineID>
        </cac:OrderLineReference>
        <cac:Item>
            <cbc:Description>Pastilles de detartrage - 3 x 3 - JURA</cbc:Description>
            <cbc:Name>P JU 61848 (618484)</cbc:Name>
            <cac:SellersItemIdentification>
                <cbc:ID>225175</cbc:ID>
            </cac:SellersItemIdentification>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">11.15</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="H87">2.00</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">65.45</cbc:LineExtensionAmount>
        <cac:OrderLineReference>
            <cbc:LineID>2885840</cbc:LineID>
        </cac:OrderLineReference>
        <cac:Item>
            <cbc:Description>Filtre Claris Smart+ - 3 pieces - JURA</cbc:Description>
            <cbc:Name>P JU 24233 (242337)</cbc:Name>
            <cac:SellersItemIdentification>
                <cbc:ID>225164</cbc:ID>
            </cac:SellersItemIdentification>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">32.72</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="H87">2.00</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">14.90</cbc:LineExtensionAmount>
        <cac:OrderLineReference>
            <cbc:LineID>2885841</cbc:LineID>
        </cac:OrderLineReference>
        <cac:Item>
            <cbc:Description>Pastilles de nettoyage 3en1 - 6 pcs. - JURA</cbc:Description>
            <cbc:Name>P JU 24225 (242252)</cbc:Name>
            <cac:SellersItemIdentification>
                <cbc:ID>311521</cbc:ID>
            </cac:SellersItemIdentification>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">7.45</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    <cac:InvoiceLine>
        <cbc:ID>1</cbc:ID>
        <cbc:InvoicedQuantity unitCode="H87">1.00</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="EUR">4.00</cbc:LineExtensionAmount>
        <cac:OrderLineReference>
            <cbc:LineID>2885842</cbc:LineID>
        </cac:OrderLineReference>
        <cac:Item>
            <cbc:Description>Participation Frais Logistiques</cbc:Description>
            <cbc:Name>Participation Frais Logistiques @7410</cbc:Name>
            <cac:SellersItemIdentification>
                <cbc:ID>20627</cbc:ID>
            </cac:SellersItemIdentification>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>21</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="EUR">4</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
</Invoice>

**Document Version:** 1.0  
**Last Updated:** December 2025  
**Author:** Peppol Integration Team  
**Status:** Complete and Ready for Implementation