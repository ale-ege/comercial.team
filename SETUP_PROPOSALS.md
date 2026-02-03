# Setup - Criador de Proposta

## ⚠️ Se você está vendo erro ao criar proposta

O erro geralmente ocorre porque o banco de dados não foi atualizado com as novas tabelas `Proposal` e `ProposalStep`.

## 🔧 Solução

Execute os seguintes comandos na raiz do projeto:

```bash
# 1. Gerar o Prisma Client atualizado
npx prisma generate

# 2. Aplicar as mudanças do schema ao banco de dados
npx prisma db push

# 3. (Opcional) Criar templates padrão
npm run db:seed
```

## 📋 Verificação

Após executar os comandos, verifique se as tabelas foram criadas:

```bash
npx prisma studio
```

Você deve ver as tabelas:
- `Proposal`
- `ProposalStep`

## 🐛 Erros Comuns

### Erro: "Foreign key constraint"
- **Causa**: Banco de dados não sincronizado
- **Solução**: Execute `npx prisma db push`

### Erro: "Cannot find module '@prisma/client'"
- **Causa**: Prisma Client não gerado
- **Solução**: Execute `npx prisma generate`

### Erro: "Table 'Proposal' already exists"
- **Causa**: Tabela já existe mas schema está desatualizado
- **Solução**: Execute `npx prisma db push --force-reset` (⚠️ CUIDADO: apaga dados)

## ✅ Após o Setup

1. Acesse `/resultados`
2. Clique no ícone "Gerar Proposta" em qualquer resultado
3. A proposta deve ser criada automaticamente
