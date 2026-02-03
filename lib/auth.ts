import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'crypto'

const SALT_LEN = 16
const KEY_LEN = 64

export function hashPassword(password: string): string {
  const salt = randomBytes(SALT_LEN).toString('hex')
  const hash = scryptSync(password, salt, KEY_LEN).toString('hex')
  return `${salt}:${hash}`
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const hashBuf = Buffer.from(hash, 'hex')
  const supplied = scryptSync(password, salt, KEY_LEN)
  return timingSafeEqual(hashBuf, supplied)
}

const SESSION_COOKIE = 'session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7 // 7 dias
const SECRET = process.env.SESSION_SECRET || 'default-secret-change-in-production'

function sign(value: string): string {
  return createHmac('sha256', SECRET).update(value).digest('hex')
}

export function createSessionCookie(userId: string): string {
  const payload = JSON.stringify({ userId, exp: Date.now() + SESSION_MAX_AGE * 1000 })
  const encoded = Buffer.from(payload).toString('base64url')
  const sig = sign(encoded)
  return `${encoded}.${sig}`
}

export function verifySessionCookie(cookieValue: string | undefined): string | null {
  if (!cookieValue || !cookieValue.includes('.')) return null
  const [encoded, sig] = cookieValue.split('.')
  if (!encoded || !sig || sign(encoded) !== sig) return null
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.exp && Date.now() > payload.exp) return null
    return payload.userId || null
  } catch {
    return null
  }
}

export function getSessionCookieName(): string {
  return SESSION_COOKIE
}

export function getSessionMaxAge(): number {
  return SESSION_MAX_AGE
}
