const SIMPLE_EMAIL_REGEX = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,63}$/

export const normalizePhoneDigits = (value: string) => value.replace(/\D/g, '')

export const toUS10DigitPhone = (value: string): string | null => {
  const digits = normalizePhoneDigits(value)
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.slice(1)
  }
  if (digits.length === 10) {
    return digits
  }
  return null
}

export const isValidUSPhoneNumber = (value: string): boolean => {
  const normalized = toUS10DigitPhone(value)
  if (!normalized) return false
  // NANP basic validation:
  // area code and central office code cannot start with 0 or 1.
  return /^[2-9]\d{2}[2-9]\d{6}$/.test(normalized)
}

export const toE164USPhone = (value: string): string | null => {
  const normalized = toUS10DigitPhone(value)
  if (!normalized) return null
  if (!isValidUSPhoneNumber(normalized)) return null
  return `+1${normalized}`
}

export const isValidEmailAddress = (value: string): boolean => {
  const email = value.trim()
  if (!SIMPLE_EMAIL_REGEX.test(email)) return false
  if (email.includes('..')) return false

  const [localPart, domainPart] = email.split('@')
  if (!localPart || !domainPart) return false
  if (localPart.startsWith('.') || localPart.endsWith('.')) return false

  const labels = domainPart.split('.')
  if (labels.some(label => !label || label.startsWith('-') || label.endsWith('-'))) return false

  return true
}
