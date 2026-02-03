# Migração do ambiente de desenvolvimento

Guia para rodar a aplicação **Agente Comercial** em outro computador, localmente (novo ambiente de desenvolvimento).

---

## 1. Pré-requisitos no novo computador

Instale antes de começar:

| Requisito | Versão | Onde obter |
|-----------|--------|------------|
| **Node.js** | 18 ou superior | https://nodejs.org |
| **npm** | vem com Node.js | — |
| **Conta OpenAI** | — | https://platform.openai.com (para API key) |

Para conferir no terminal:
```bash
node -v   # deve ser v18.x ou superior
npm -v
```

---

## 2. Copiar o projeto para o novo computador

Escolha uma das opções:

- **Opção A – GitHub (recomendado):** mantenha o código no GitHub e no novo PC use `git clone`. Veja o guia completo em **[GITHUB_SETUP.md](GITHUB_SETUP.md)**.
- **Opção B – Cópia manual:** copie a pasta do projeto (zip, pendrive, rede etc.).

**Importante:** não copie a pasta `node_modules` (será recriada com `npm install`).  
Se copiar tudo, no novo PC apague `node_modules` e rode `npm install` de novo.

Arquivos/pastas que **não** precisam ser copiados (podem ser recriados):

- `node_modules/`
- `.next/`
- `prisma/dev.db` e `prisma/dev.db-journal` (banco SQLite; será recriado pelo seed)
- `.env` (não copie o .env do PC antigo; crie um novo a partir do `.env.example`)

---

## 3. Instalação no novo computador

Abra um terminal na pasta do projeto e siga na ordem.

### 3.1 Instalar dependências

```bash
npm install
```

### 3.2 Configurar variáveis de ambiente

Crie o arquivo `.env` a partir do exemplo:

**Windows (PowerShell):**
```powershell
Copy-Item .env.example .env
```

**Windows (CMD) / Linux / macOS:**
```bash
cp .env.example .env
```

Edite o arquivo `.env` e preencha:

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="sua-chave-da-openai-aqui"
```

- A chave da OpenAI você obtém em: https://platform.openai.com/api-keys  
- Não compartilhe o `.env` nem faça commit dele (ele já está no `.gitignore`).

### 3.3 Configurar o banco de dados

```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

- `prisma generate` – gera o cliente Prisma  
- `prisma db push` – cria/atualiza as tabelas no SQLite  
- `db:seed` – insere dados iniciais (critérios, template de prompt etc.)

### 3.4 Subir a aplicação

```bash
npm run dev
```

Acesse no navegador: **http://localhost:3000**

---

## 4. Resumo dos comandos (novo PC)

```bash
npm install
cp .env.example .env
# Editar .env e colocar OPENAI_API_KEY
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

---

## 5. Migrar dados do computador antigo (opcional)

Se você quiser **levar o banco de dados** (reuniões, relatórios, closers, clientes etc.) do PC antigo para o novo:

1. No **computador antigo**, copie os arquivos:
   - `prisma/dev.db`
   - (se existir) `prisma/dev.db-journal`
2. No **novo computador**, pare o servidor (`Ctrl+C` no terminal onde está `npm run dev`).
3. Substitua os arquivos `prisma/dev.db` (e `dev.db-journal`, se houver) pela cópia que você trouxe.
4. Rode apenas (sem seed, para não sobrescrever dados):
   ```bash
   npx prisma generate
   npm run dev
   ```

Se você **não** trouxer o `dev.db`, o seed vai criar um banco novo e vazio; aí você configura closers, clientes e critérios de novo pela aplicação.

---

## 6. Problemas comuns

| Problema | Solução |
|----------|--------|
| `OPENAI_API_KEY não encontrada` | Verifique se o `.env` está na raiz do projeto e se a variável está preenchida. Reinicie o servidor após alterar o `.env`. |
| `Nenhum prompt template ativo` | Rode `npm run db:seed` no novo ambiente. |
| Erro ao rodar `npx prisma` | Confirme que está na pasta do projeto e que rodou `npm install`. |
| Porta 3000 em uso | Use outra porta: `npm run dev -- -p 3001` (acesse http://localhost:3001). |

Para mais erros e soluções, veja a seção **Troubleshooting** no `README.md`.

---

## 7. Checklist rápido

- [ ] Node.js 18+ instalado  
- [ ] Projeto copiado/clonado (sem depender de `node_modules` do PC antigo)  
- [ ] `npm install` executado  
- [ ] `.env` criado a partir de `.env.example`  
- [ ] `OPENAI_API_KEY` preenchida no `.env`  
- [ ] `npx prisma generate`  
- [ ] `npx prisma db push`  
- [ ] `npm run db:seed`  
- [ ] `npm run dev`  
- [ ] Acesso a http://localhost:3000 funcionando  

Depois disso, a aplicação está rodando localmente no novo computador.
