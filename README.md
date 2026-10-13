# UniPress

Aplicação institucional e portal de clientes construída com Next.js, Payload CMS e PostgreSQL.

## Requisitos

- Node.js 20.9 ou superior
- pnpm 10 ou superior
- PostgreSQL 16 (local ou via Docker)

## Executar localmente

1. Inicie um banco PostgreSQL. Com Docker:

   ```powershell
   docker run --name unipress-postgres `
     -e POSTGRES_PASSWORD=postgres `
     -e POSTGRES_DB=unipress `
     -p 5432:5432 `
     -d postgres:16
   ```

2. Copie as variáveis de ambiente e altere os segredos:

   ```powershell
   Copy-Item .env.example .env
   ```

3. Instale as dependências e aplique as migrações:

   ```powershell
   pnpm install
   pnpm migrate
   ```

4. Inicie o servidor:

   ```powershell
   pnpm dev
   ```

O site ficará disponível em <http://localhost:3000> e o painel administrativo em <http://localhost:3000/admin>.

Na primeira visita ao painel administrativo, crie o usuário administrador.

## Conteúdo demonstrativo

Com o banco local configurado, execute:

```powershell
pnpm seed
```

O seed é bloqueado automaticamente em produção.

## Verificações

```powershell
pnpm typecheck
pnpm test:int
pnpm test:e2e
pnpm build
```

## Primeiro deploy na Vercel

1. Crie um banco PostgreSQL Neon e configure as variáveis essenciais em Preview e Production:

   - `DATABASE_URL`
   - `PAYLOAD_SECRET`
   - `PREVIEW_SECRET`
   - `CRON_SECRET`
   - `NEXT_PUBLIC_SERVER_URL`
   - `NEXT_PUBLIC_WHATSAPP_NUMBER`
   - `STANDARDS_BLOB_READ_WRITE_TOKEN`

2. Importe o repositório na Vercel. O arquivo `vercel.json` executa `pnpm build:vercel`, que aplica as migrations antes do build do Next.js.

3. Antes de divulgar o endereço público, acesse o mesmo banco em um ambiente controlado e crie o primeiro usuário administrador do Payload.

4. O store associado a `STANDARDS_BLOB_READ_WRITE_TOKEN` deve ser privado. Configure a variável tanto em Preview quanto em Production. Variáveis adicionadas ou alteradas na Vercel só entram em novos deployments, portanto faça um redeploy depois de configurá-la.

O conteúdo demonstrativo é opt-in e bloqueado em produção. Para usá-lo somente em desenvolvimento, defina `ALLOW_DEMO_CONTENT=true`. Resend, Turnstile, `BLOB_READ_WRITE_TOKEN` e `CERTIFICATES_BLOB_READ_WRITE_TOKEN` continuam opcionais nesta fase.

## Certificados dos padrões UniPress

A página pública fica em `/certificados-padroes`, mas não aparece na navegação nem no sitemap e está marcada como `noindex`. Ela contém somente certificados dos padrões de referência da própria UniPress; os certificados de clientes permanecem isolados na área autenticada.

Fluxo do administrador:

1. No painel, abra **Certificados dos padrões > Padrões** e crie a TAG/identificação. A TAG normalizada é única.
2. Em **Certificados dos padrões > Certificados dos padrões**, envie o PDF de até 20 MB como rascunho, selecione a TAG e informe o ano.
3. Marque **Certificado atual** antes de publicar o primeiro PDF daquela TAG. Um novo PDF publicado como atual desmarca o anterior automaticamente.
4. Os PDFs publicados anteriores continuam disponíveis no histórico. Se o atual for despublicado, desmarcado ou excluído, o publicado mais recente é promovido automaticamente.
5. Use **Visível na página pública** no cadastro da TAG para mostrar ou ocultar a TAG inteira. Quando oculta, seus links diretos de visualização e download também deixam de funcionar publicamente.

O schema do banco é controlado exclusivamente por migrations. Depois de atualizar o código localmente, execute `pnpm migrate` antes de iniciar o site. Na Vercel, `pnpm build:vercel` aplica as migrations automaticamente antes do build.

O QR permanente aponta para `https://www.unipress.com.br/certificados-padroes`. Os arquivos prontos para impressão e uso digital estão em `docs/qr-code/`; regenere-os com `pnpm generate:standards-qr` se precisar reproduzi-los, sem alterar a URL.
