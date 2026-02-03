# Usar o projeto no GitHub

Guia para **manter o código no GitHub** e **pegar de lá** no outro computador (ou em qualquer máquina). Assim você não depende de copiar pastas manualmente.

---

## Resumo rápido

| Onde | O que fazer |
|------|-------------|
| **Neste PC (primeira vez)** | Inicializar Git, criar repositório no GitHub, enviar o código (`push`) |
| **Neste PC (depois)** | Só dar `git add`, `git commit` e `git push` quando mudar algo |
| **Outro PC** | `git clone` do repositório, depois `npm install`, `.env`, Prisma e `npm run dev` |

O que **não** vai para o GitHub (está no `.gitignore`): `node_modules`, `.env`, `prisma/dev.db`, `.next`. No novo PC você recria isso (instalação + `.env` + seed).

---

## 1. Primeira vez: colocar o projeto no GitHub

### 1.1 Instalar Git (se ainda não tiver)

- Download: https://git-scm.com/downloads  
- Depois de instalar, no terminal: `git --version`

### 1.2 Configurar nome e e-mail (uma vez por máquina)

```bash
git config --global user.name "Seu Nome"
git config --global user.email "seu-email@exemplo.com"
```

### 1.3 Dentro da pasta do projeto

Abra o terminal na pasta do projeto (ex.: `c:\Projetos\Agente comercial`).

**Se o projeto ainda NÃO é um repositório Git:**

```bash
git init
git add .
git status
```

Confira se não aparece `.env` nem `node_modules` na lista (eles devem estar ignorados). Depois:

```bash
git commit -m "Initial commit: Agente Comercial"
```

**Se o projeto JÁ é um repositório Git** (já existe pasta `.git`):

```bash
git status
git add .
git commit -m "Atualização do projeto"
```

### 1.4 Criar o repositório no GitHub

1. Acesse https://github.com e faça login.
2. Clique em **New** (novo repositório).
3. Nome sugerido: `agente-comercial` (ou outro que preferir).
4. Deixe **público** ou **privado** como quiser.
5. **Não** marque “Add a README” (o projeto já tem um).
6. Clique em **Create repository**.

### 1.5 Conectar e enviar o código

No terminal, ainda na pasta do projeto. O GitHub vai mostrar algo como:

```bash
git remote add origin https://github.com/SEU-USUARIO/agente-comercial.git
git branch -M main
git push -u origin main
```

Substitua `SEU-USUARIO/agente-comercial` pela URL do seu repositório.  
Se pedir usuário/senha: use seu usuário GitHub e um **Personal Access Token** como senha (em Settings → Developer settings → Personal access tokens).

Depois disso, o código estará no GitHub.

---

## 2. Dia a dia: salvar alterações no GitHub

Sempre que você mudar código e quiser guardar no GitHub:

```bash
git add .
git status
git commit -m "Descrição do que mudou"
git push
```

---

## 3. No outro computador: pegar do GitHub e rodar

### 3.1 Clonar o repositório

```bash
cd c:\Projetos
git clone https://github.com/SEU-USUARIO/agente-comercial.git
cd agente-comercial
```

(Use a URL do seu repositório; no GitHub, botão verde **Code** → copiar URL.)

### 3.2 Instalar e configurar (igual à migração)

```bash
npm install
Copy-Item .env.example .env
```

Edite o `.env` e coloque sua `OPENAI_API_KEY`.

```bash
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

Acesse http://localhost:3000.

Ou seja: **não é só copiar arquivos** — você **clona** do GitHub e depois roda `npm install`, cria o `.env` e sobe o banco (Prisma + seed). O guia completo está em **MIGRACAO_AMBIENTE.md**.

---

## 4. O que vai e o que não vai para o GitHub

| Vai para o GitHub | NÃO vai (ficam só no seu PC) |
|-------------------|------------------------------|
| Código fonte (`app/`, `lib/`, `components/`, etc.) | `node_modules/` |
| `package.json`, `prisma/schema.prisma`, `README.md`, etc. | `.env` (suas chaves) |
| `.env.example` (modelo sem segredos) | `prisma/dev.db` (banco de dados) |
| | `.next/` (build) |

Por isso no novo PC você: clona → `npm install` → cria `.env` → `prisma generate`, `db push`, `db:seed` → `npm run dev`.

---

## 5. Respostas diretas

- **“Agora é só copiar os arquivos?”**  
  Se você usar GitHub: **não**. No novo PC você faz `git clone` e depois os passos de instalação (npm, .env, Prisma, dev). Se não usar GitHub, aí sim pode “só copiar” a pasta (sem `node_modules` e sem `.env`) e no novo PC rodar `npm install`, criar `.env` e Prisma.

- **“Como faço para manter isso no GitHub e pegar de lá?”**  
  1) Neste PC: `git init` (se precisar), `git add .`, `git commit`, criar repositório no GitHub, `git remote add origin ...`, `git push`.  
  2) Depois: sempre que mudar algo, `git add .`, `git commit -m "..."`, `git push`.  
  3) No outro PC: `git clone ...`, depois os comandos de instalação e `.env` (como no **MIGRACAO_AMBIENTE.md**).

Se quiser, na próxima mensagem você pode dizer se já tem repositório criado no GitHub ou não, e em qual pasta está o projeto, que eu te passo os comandos exatos linha a linha.
