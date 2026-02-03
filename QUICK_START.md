# Guia Rápido de Início

## Passos para rodar a aplicação

1. **Instalar dependências:**
```bash
npm install
```

2. **Configurar variáveis de ambiente:**
```bash
cp .env.example .env
```
Edite o `.env` e adicione sua `OPENAI_API_KEY`.

3. **Configurar banco de dados:**
```bash
npx prisma generate
npx prisma db push
npm run db:seed
```

4. **Iniciar o servidor:**
```bash
npm run dev
```

5. **Acessar a aplicação:**
Abra `http://localhost:3000` no navegador.

## Primeiro uso

1. **Criar um Closer:**
   - Vá em **Configurações > Closers**
   - Clique em "Criar Novo"
   - Preencha nome e email (opcional)
   - Salve

2. **Processar uma transcrição:**
   - Vá para a página principal
   - Digite o nome do cliente (será criado automaticamente se não existir)
   - Selecione o closer criado
   - Carregue um arquivo .txt ou cole a transcrição
   - Clique em "Processar"
   - Aguarde a análise (pode levar alguns segundos)

3. **Visualizar relatório:**
   - Após o processamento, você será redirecionado para o relatório
   - Veja a nota geral, análise por critério, gráficos e plano de ação

## Exemplo de transcrição

Use o arquivo `EXEMPLO_TRANSCRICAO.txt` como referência para o formato esperado.

## Troubleshooting

- **Erro ao processar:** Verifique se a `OPENAI_API_KEY` está correta no `.env`
- **Banco não inicializado:** Execute `npx prisma db push && npm run db:seed`
- **Erro de dependências:** Execute `npm install` novamente