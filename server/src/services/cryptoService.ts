import { createCipheriv, createDecipheriv, randomBytes } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const ENCRYPTED_PREFIX = 'enc:'

function getKey(): Buffer {
  const raw = process.env.ENCRYPTION_KEY
  if (!raw) throw new Error('ENCRYPTION_KEY environment variable is not set')
  const key = Buffer.from(raw, 'hex')
  if (key.length !== 32) throw new Error('ENCRYPTION_KEY must be a 32-byte hex string (64 hex characters)')
  return key
}

export function encrypt(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const authTag = cipher.getAuthTag()
  // 포맷: enc:<iv_hex>:<authTag_hex>:<ciphertext_hex>
  return `${ENCRYPTED_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`
}

export function decrypt(ciphertext: string): string {
  if (!ciphertext.startsWith(ENCRYPTED_PREFIX)) return ciphertext // 평문 그대로 반환 (마이그레이션 호환)
  const parts = ciphertext.slice(ENCRYPTED_PREFIX.length).split(':')
  if (parts.length !== 3) throw new Error('Invalid encrypted format')
  const [ivHex, authTagHex, encryptedHex] = parts
  const key = getKey()
  const iv = Buffer.from(ivHex, 'hex')
  const authTag = Buffer.from(authTagHex, 'hex')
  const encrypted = Buffer.from(encryptedHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)
  return decipher.update(encrypted).toString('utf8') + decipher.final('utf8')
}

export function encryptStringArray(arr: string[]): string[] {
  return arr.map(encrypt)
}

export function decryptStringArray(arr: string[]): string[] {
  return arr.map(decrypt)
}

export function isEncrypted(value: string): boolean {
  return value.startsWith(ENCRYPTED_PREFIX)
}
