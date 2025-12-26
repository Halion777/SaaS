/**
 * Email validation function - checks for proper email format
 * Same validation as used in registration flow step 1
 */
export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false;
  
  // Trim and lowercase
  const trimmedEmail = email.trim().toLowerCase();
  
  // Check if email starts with dot (invalid)
  if (trimmedEmail.startsWith('.')) return false;
  
  // RFC 5322 compliant regex (simplified but more strict than basic)
  const emailRegex = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;
  
  // Check basic format
  if (!emailRegex.test(trimmedEmail)) {
    return false;
  }
  
  // Additional checks
  // - Must not start or end with dot
  // - Must not have consecutive dots
  // - Domain must have at least one dot
  // - Must not have invalid characters at the end
  const parts = trimmedEmail.split('@');
  if (parts.length !== 2) return false;
  
  const [localPart, domain] = parts;
  
  // Local part checks
  if (localPart.length === 0 || localPart.length > 64) return false;
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false;
  if (localPart.includes('..')) return false;
  
  // Domain checks
  if (domain.length === 0 || domain.length > 253) return false;
  if (domain.startsWith('.') || domain.endsWith('.')) return false;
  if (domain.includes('..')) return false;
  if (!domain.includes('.')) return false;
  
  // Domain must have valid TLD (at least 2 characters after last dot)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];
  if (!tld || tld.length < 2) return false;
  
  // Check TLD - must be only letters (no numbers or invalid characters)
  // This catches cases like "email@gmail.com7" or "email@gmail.com89"
  if (!/^[a-z]+$/i.test(tld)) return false;
  
  // Check if domain has any invalid characters after TLD
  // Split domain by dots and check each part
  for (let i = 0; i < domainParts.length; i++) {
    const part = domainParts[i];
    // Each part should only contain letters, numbers, and hyphens (but not start/end with hyphen)
    if (!/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(part)) return false;
    
    // For TLD (last part), it should only be letters
    if (i === domainParts.length - 1 && !/^[a-z]+$/i.test(part)) return false;
  }
  
  // Additional check: Look for numbers or invalid characters immediately after TLD in the full domain
  // This catches cases where someone might have "gmail.com89" as the domain
  const domainWithoutTLD = domainParts.slice(0, -1).join('.');
  const fullDomainPattern = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]+$/i;
  if (!fullDomainPattern.test(domain)) return false;
  
  // Final check: Ensure the domain doesn't end with numbers or invalid characters
  // Extract everything after the last dot (TLD) and ensure it's only letters
  const lastDotIndex = domain.lastIndexOf('.');
  if (lastDotIndex === -1) return false;
  const tldPart = domain.substring(lastDotIndex + 1);
  if (!/^[a-z]+$/i.test(tldPart)) return false;
  
  return true;
};

/**
 * Validates and prevents negative numbers
 * Returns the validated value or empty string
 */
export const validateNumberInput = (value, allowDecimals = true, min = 0, max = null) => {
  if (value === '' || value === null || value === undefined) return '';
  
  // Remove any non-numeric characters except decimal point if allowed
  let cleaned = String(value).replace(/[^\d.]/g, '');
  
  // Remove multiple decimal points
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }
  
  // If decimals not allowed, remove decimal point
  if (!allowDecimals) {
    cleaned = cleaned.replace(/\./g, '');
  }
  
  // Convert to number
  const numValue = parseFloat(cleaned);
  
  // Check if it's a valid number
  if (isNaN(numValue)) return '';
  
  // Enforce minimum (prevent negative)
  if (numValue < min) return min.toString();
  
  // Enforce maximum if provided
  if (max !== null && numValue > max) return max.toString();
  
  // Return the cleaned value as string to preserve decimal input
  return cleaned;
};

/**
 * Limits the length of number input
 * Default max length is 15 digits (reasonable for most financial inputs)
 */
export const limitNumberLength = (value, maxLength = 15) => {
  if (!value) return '';
  const stringValue = String(value);
  // Remove any non-numeric characters except decimal point
  const cleaned = stringValue.replace(/[^\d.]/g, '');
  // Limit to maxLength characters
  return cleaned.slice(0, maxLength);
};

