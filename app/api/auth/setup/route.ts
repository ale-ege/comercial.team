import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { hashPassword, createSessionCookie, getSessionCookieName, getSessionMaxAge } from '@/lib/auth'

/**
 * Cria o primeiro usuário do sistema (quando não existe nenhum).
 * Só funciona quando prisma.user.count() === 0.
 */
export async function POST(request: NextRequest) {
  try {
    const count = await prisma.user.count()
    if (count > 0) {
      return NextResponse.json(
        { error: 'Já existem usuários cadastrados. Use a tela de login.' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const email = (body.email ?? '').toString().trim().toLowerCase()
    const password = (body.password ?? '').toString()
    const name = (body.name ?? '').toString().trim()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'E-mail, senha e nome são obrigatórios' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Senha deve ter no mínimo 6 caracteres' },
        { status: 400 }
      )
    }

    const passwordHash = hashPassword(password)
    const user = await prisma.user.create({
      data: { email, passwordHash, name, active: true },
    })

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
    console.error('Setup error:', e)
    return NextResponse.json({ error: 'Erro ao criar usuário' }, { status: 500 })
  }
}
