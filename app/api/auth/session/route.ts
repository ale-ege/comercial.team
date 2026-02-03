import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifySessionCookie, getSessionCookieName } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const cookieValue = request.cookies.get(getSessionCookieName())?.value
    const userId = verifySessionCookie(cookieValue)
    if (!userId) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, active: true },
    })

    if (!user || !user.active) {
      return NextResponse.json({ user: null }, { status: 200 })
    }

    return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } })
  } catch (e: any) {
    console.error('Session error:', e)
    return NextResponse.json({ user: null }, { status: 200 })
  }
}
