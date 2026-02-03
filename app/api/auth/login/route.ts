import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyPassword, createSessionCookie, getSessionCookieName, getSessionMaxAge } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const email = (body.email ?? '').toString().trim().toLowerCase()
    const password = (body.password ?? '').toString()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios' },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      const totalUsers = await prisma.user.count()
      if (totalUsers === 0) {
        return NextResponse.json(
          { error: 'Nenhum usuário cadastrado. Execute: npx prisma db push && npx prisma db seed — depois use admin@example.com / admin123' },
          { status: 401 }
        )
      }
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      )
    }

    if (!user.active) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      )
    }

    const ok = verifyPassword(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json(
        { error: 'E-mail ou senha inválidos' },
        { status: 401 }
      )
    }

    const cookieValue = createSessionCookie(user.id)
    const res = NextResponse.json({ ok: true, user: { id: user.id, email: user.email, name: user.name } })
    res.cookies.set(getSessionCookieName(), cookieValue, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: getSessionMaxAge(),
      path: '/',
    })
    return res
  } catch (e: any) {
    console.error('Login error:', e)
    return NextResponse.json({ error: 'Erro ao fazer login' }, { status: 500 })
  }
}
