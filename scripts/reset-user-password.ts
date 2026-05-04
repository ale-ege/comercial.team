/**
 * Uso: npx tsx scripts/reset-user-password.ts <email> [nova_senha]
 * Se não passar a senha, gera uma temporária e imprime no console.
 */
import { randomBytes } from 'crypto'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'
import { hashPassword } from '../lib/auth'

function loadEnv() {
  const p = join(process.cwd(), '.env')
  if (!existsSync(p)) return
  const raw = readFileSync(p, 'utf8')
  for (const line of raw.split('\n')) {
    const t = line.trim()
    if (!t || t.startsWith('#')) continue
    const i = t.indexOf('=')
    if (i === -1) continue
    const key = t.slice(0, i).trim()
    let val = t.slice(i + 1).trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    if (key && process.env[key] === undefined) process.env[key] = val
  }
}

loadEnv()

const prisma = new PrismaClient()
const emailArg = (process.argv[2] || '').toString().trim().toLowerCase()
const explicitPassword = process.argv[3]?.toString()

function randomPassword() {
  const a = randomBytes(6).toString('base64url').replace(/[^a-zA-Z0-9]/g, '')
  return `Exec${a.slice(0, 6)}!9`
}

async function main() {
  if (!emailArg) {
    console.error('Uso: npx tsx scripts/reset-user-password.ts <email> [nova_senha]')
    process.exit(1)
  }
  if (explicitPassword !== undefined && explicitPassword.length < 6) {
    console.error('Senha deve ter no mínimo 6 caracteres.')
    process.exit(1)
  }

  const newPassword = explicitPassword || randomPassword()
  const user = await prisma.user.findUnique({ where: { email: emailArg } })
  if (!user) {
    console.error('Usuário não encontrado:', emailArg)
    process.exit(1)
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: hashPassword(newPassword) },
  })

  console.log('OK — senha redefinida')
  console.log('E-mail:', user.email)
  if (!explicitPassword) {
    console.log('Senha temporária gerada (guarde aí e troque após o login):')
  }
  console.log(newPassword)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
