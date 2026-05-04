# Rodar o projeto com Docker

O projeto pode ser executado em **Docker** para desenvolvimento ou deploy. O banco SQLite é persistido em um volume.

---

## Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) instalado
- [Docker Compose](https://docs.docker.com/compose/install/) (geralmente já vem com o Docker Desktop)

---

## Uso rápido

1. **Crie o arquivo `.env`** na raiz do projeto (se ainda não tiver), com pelo menos:
   ```env
   DATABASE_URL="file:./data/dev.db"
   OPENAI_API_KEY="sua-chave-openai"
   ```
   No Docker Compose, o `DATABASE_URL` é sobrescrito para `file:./data/dev.db` (volume). O `.env` é carregado pelo `env_file`; o importante é ter `OPENAI_API_KEY`.

2. **Build e subida:**
   ```bash
   docker compose up --build
   ```
   Na primeira vez o build pode levar alguns minutos.

3. Acesse: **http://localhost:3000**

4. Para parar: `Ctrl+C` ou, em outro terminal, `docker compose down`.

---

## Comandos úteis

| Comando | Descrição |
|--------|-----------|
| `docker compose up --build` | Sobe a aplicação (build + run). Use `-d` para rodar em segundo plano. |
| `docker compose down` | Para e remove os containers. O volume do banco é mantido. |
| `docker compose down -v` | Para e remove também os volumes (apaga o banco). |
| `docker compose logs -f app` | Ver logs do serviço em tempo real. |
| `docker compose exec app sh` | Abre um shell dentro do container. |

---

## O que foi configurado

- **Dockerfile**: build multi-stage (Node 18, Alpine). Gera o Prisma Client, faz o build do Next.js e usa um script de entrada que roda `prisma db push`, `db:seed` e depois `next start`.
- **docker-compose.yml**: serviço `app` na porta 3000, carrega `.env`, monta o volume `prisma_data` em `/app/data` para persistir o SQLite.
- **docker-entrypoint.sh**: executa `prisma db push` e `npm run db:seed` antes de iniciar o Next.js (para banco novo ou após `down -v`).
- **.dockerignore**: evita copiar `node_modules`, `.next`, `.env`, `.git` e arquivos desnecessários para a imagem.

---

## Persistência do banco

O SQLite fica em **`/app/data/dev.db`** dentro do container, que está mapeado para o volume nomeado `prisma_data`. Por isso:

- Reiniciar com `docker compose down` e `docker compose up` **mantém** os dados.
- Usar `docker compose down -v` **apaga** o volume e, na próxima subida, o banco será recriado (entrypoint roda `db push` e `seed` de novo).

---

## Variáveis de ambiente

O Compose usa `env_file: .env`. Garanta que o `.env` tenha pelo menos:

- `OPENAI_API_KEY` – obrigatório para análise de transcrições e propostas.

O `DATABASE_URL` no Compose é definido em `environment` como `file:./data/dev.db`; não é necessário alterar no `.env` para rodar com Docker.

---

## Troubleshooting

- **Erro "OPENAI_API_KEY não encontrada"**  
  Verifique se o `.env` existe na raiz e contém `OPENAI_API_KEY=...`. Reinicie com `docker compose up --build`.

- **Porta 3000 em uso**  
  Altere no `docker-compose.yml`:
  ```yaml
  ports:
    - "3001:3000"
  ```
  e acesse http://localhost:3001.

- **Banco vazio ou "Nenhum prompt template ativo"**  
  O entrypoint roda o seed na subida. Se o volume já existia com dados antigos, pode ser necessário recriar: `docker compose down -v` e depois `docker compose up --build`.
