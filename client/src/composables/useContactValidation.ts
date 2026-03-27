export interface ContactErrors { phone?: string; email?: string }

const PHONE_REGEX = /^(01[016789]\d{7,8}|02\d{7,8}|0[3-9]\d{8,9}|1[5-6]\d{6})$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/

export function sanitizePhone(raw: string): string {
  return raw.replace(/\D/g, '').slice(0, 11)
}

export function formatPhone(digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 11)
  if (/^1[56]/.test(d)) {
    const t = d.slice(0, 8)
    if (t.length <= 4) return t
    return `${t.slice(0, 4)}-${t.slice(4)}`
  }
  if (d.startsWith('02')) {
    const t = d.slice(0, 10)
    if (t.length <= 2) return t
    if (t.length <= 5) return `${t.slice(0, 2)}-${t.slice(2)}`
    if (t.length <= 9) return `${t.slice(0, 2)}-${t.slice(2, 5)}-${t.slice(5)}`
    return `${t.slice(0, 2)}-${t.slice(2, 6)}-${t.slice(6)}`
  }
  if (d.startsWith('010')) {
    const t = d.slice(0, 11)
    if (t.length <= 3) return t
    if (t.length <= 7) return `${t.slice(0, 3)}-${t.slice(3)}`
    return `${t.slice(0, 3)}-${t.slice(3, 7)}-${t.slice(7)}`
  }
  if (d.startsWith('0')) {
    const t = d.slice(0, 11)
    if (t.length <= 3) return t
    if (t.length <= 6) return `${t.slice(0, 3)}-${t.slice(3)}`
    if (t.length <= 10) return `${t.slice(0, 3)}-${t.slice(3, 6)}-${t.slice(6)}`
    return `${t.slice(0, 3)}-${t.slice(3, 7)}-${t.slice(7)}`
  }
  return d
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(value.replace(/\D/g, ''))
}

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value.trim())
}

export function useContactValidation() {
  function validateContact(phone?: string, email?: string): ContactErrors {
    const errors: ContactErrors = {}
    if (phone?.trim() && !isValidPhone(phone)) {
      errors.phone = '올바르지 않은 전화번호 형식입니다.'
    }
    if (email?.trim() && !isValidEmail(email)) {
      errors.email = '올바르지 않은 이메일 형식입니다.'
    }
    return errors
  }
  function hasErrors(e: ContactErrors): boolean {
    return !!(e.phone || e.email)
  }
  return { validateContact, hasErrors, formatPhone, sanitizePhone }
}
