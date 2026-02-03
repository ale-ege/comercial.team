import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionCookie, getSessionCookieName } from '@/lib/auth'

export type SessionUser = { id: string; email: string; name: string }

export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const cookieValue = request.cookies.get(getSessionCookieName())?.value
  const userId = verifySessionCookie(cookieValue)
  if (!userId) return null

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, active: true },
  })
  if (!user || !user.active) return null
  return { id: user.id, email: user.email, name: user.name }
}
