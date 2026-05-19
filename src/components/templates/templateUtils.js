const GST_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const PHONE_REGEX = /^[6-9][0-9]{9}$/;

export const normalizeDigits = (value = '') => String(value).replace(/\D/g, '');

export const isValidGSTIN = (value = '') => GST_REGEX.test(String(value).trim().toUpperCase());
export const isValidPAN = (value = '') => PAN_REGEX.test(String(value).trim().toUpperCase());
export const isValidPhone10 = (value = '') => PHONE_REGEX.test(normalizeDigits(value));

export const maskCardNumber = (cardLast4 = '', existingMask = '') => {
  const last4 = normalizeDigits(cardLast4).slice(-4) || normalizeDigits(existingMask).slice(-4);
  return last4 ? `************${last4}` : '';
};

const slugify = (value = '') =>
  String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const buildExportFilename = (billType = 'bill', billNumber = '', billDate = '') => {
  const typeSlug = slugify(billType) || 'bill';
  const numberSlug = slugify(billNumber) || 'na';
  const dateToken = String(billDate || '')
    .trim()
    .replace(/[^0-9]/g, '')
    .slice(0, 8) || new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${typeSlug}-${numberSlug}-${dateToken}`;
};

export const firstValidationError = (checks = []) => {
  const fail = checks.find((check) => check && check.valid === false);
  return fail ? fail.message : '';
};
