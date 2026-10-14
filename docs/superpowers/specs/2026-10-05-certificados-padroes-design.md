# Portal público de certificados dos padrões UniPress

**Data:** 05/10/2026

**Status:** especificação para revisão
**Rota definitiva:** `https://www.unipress.com.br/certificados-padroes`

## 1. Objetivo

Criar uma página pública não divulgada na navegação do site para que clientes consultem os certificados dos padrões de referência pertencentes à UniPress. Um QR Code permanente apontará para a rota fixa. A página não exibirá nem permitirá acesso a certificados de equipamentos de clientes.

O conteúdo será administrado pelo Payload CMS. Administradores cadastrarão uma TAG uma única vez e anexarão o histórico de certificados PDF daquele padrão. Um certificado publicado será marcado como atual e receberá destaque; certificados publicados anteriores continuarão disponíveis no histórico.

## 2. Decisões confirmadas

- A página é pública, sem login, senha, token ou expiração.
- Qualquer pessoa que conheça ou receba a URL poderá acessar o conteúdo publicado.
- A rota não aparecerá no menu, nos links editoriais nem no sitemap.
- A página receberá metadados `noindex, nofollow`.
- O endereço permanente será `https://www.unipress.com.br/certificados-padroes`.
- O QR Code será padrão, preto e branco, sem logo incorporada, nos formatos PNG, SVG e PDF.
- A página usará o cabeçalho e o rodapé normais do site.
- Somente certificados de padrões da UniPress serão aceitos. A área autenticada de certificados de clientes continuará separada e inalterada.
- A busca será feita exclusivamente pela TAG/identificação.
- Serão exibidas todas as TAGs publicamente visíveis, com busca local e ordem alfabética natural.
- O volume inicial será inferior a 50 TAGs; não haverá paginação nesta versão.
- Cada PDF poderá ter no máximo 20 MB.
- Não haverá métricas de acesso nem trilha de auditoria específica nesta versão.

## 3. Abordagens consideradas

### 3.1. Reutilizar a coleção de calibrações de clientes

Rejeitada. A coleção atual possui autenticação, relacionamento com clientes, arquivos privados e regras de autorização próprias. Misturar certificados de padrões públicos com certificados confidenciais de clientes aumentaria o risco de exposição e tornaria as regras mais difíceis de compreender.

### 3.2. Usar uma única coleção de PDFs com a TAG digitada em cada upload

Rejeitada. O fluxo é curto, mas erros de digitação criariam TAGs duplicadas e históricos fragmentados, por exemplo `PI-20`, `PI20` e `PI 20`.

### 3.3. Separar padrões e certificados

Escolhida. Uma coleção mantém TAGs únicas; outra coleção de upload relaciona cada PDF a uma TAG existente. A estrutura adiciona uma seleção no admin, mas garante consistência, histórico correto e regras claras para visibilidade e certificado atual.

## 4. Arquitetura

O recurso será composto por:

1. Coleção Payload `reference-standards`, responsável pelas TAGs e pela visibilidade pública.
2. Coleção Payload de upload `reference-certificates`, responsável pelos PDFs, ano, estado de publicação e indicação de certificado atual.
3. Armazenamento privado no Vercel Blob, com upload direto do navegador restrito a administradores.
4. Página pública Next.js em `/certificados-padroes`.
5. Rotas controladas para visualizar e baixar PDFs.
6. Hooks de consistência para publicação, exclusividade do certificado atual, promoção do anterior e revalidação da página.
7. Artefatos de QR Code apontando para a URL definitiva.

Embora os documentos não contenham dados confidenciais, o Blob será privado. Essa decisão é necessária para cumprir a regra de que ocultar uma TAG torna seus PDFs inacessíveis inclusive por links diretos previamente copiados.

## 5. Modelo de dados

### 5.1. Padrões (`reference-standards`)

Campos:

- `tag`: texto obrigatório, único e indexado; será exibido preservando a grafia cadastrada.
- `searchKey`: texto gerado internamente a partir da TAG, normalizado para pesquisa e verificação de duplicidade lógica.
- `visible`: booleano administrável, padrão `true`.
- timestamps padrão do Payload.

Regras:

- A normalização remove acentos, espaços, hífens e demais caracteres não alfanuméricos e converte para minúsculas. Assim, `PI-20`, `PI 20` e `pi20` compartilham a chave `pi20`.
- `searchKey` será única para impedir TAGs equivalentes cadastradas com grafias diferentes.
- Somente administradores podem criar, editar, excluir ou consultar a coleção pela API do Payload.
- A página pública consultará a coleção no servidor e aplicará explicitamente `visible = true`.
- Uma TAG visível sem certificado publicado não será exibida.
- Uma TAG oculta não aparecerá na página e bloqueará todas as rotas de visualização/download dos seus PDFs.

### 5.2. Certificados dos padrões (`reference-certificates`)

Coleção de upload de PDF com:

- `standard`: relacionamento obrigatório e indexado com `reference-standards`.
- `year`: número inteiro obrigatório de quatro dígitos.
- `isCurrent`: booleano com o rótulo “Certificado atual”.
- `_status`: rascunho ou publicado, usando o fluxo nativo de drafts do Payload.
- arquivo obrigatório no formato `application/pdf`.
- limite de 20 MB.
- timestamps padrão do Payload.

Regras de acesso:

- Somente administradores podem criar, editar, excluir ou consultar registros pela API do Payload.
- O Blob e sua URL interna nunca serão entregues diretamente pela API pública.
- A página e as rotas públicas usam consultas internas no servidor e retornam apenas os campos necessários.

## 6. Publicação e certificado atual

O estado público depende simultaneamente de três condições:

1. certificado com `_status = published`;
2. padrão relacionado com `visible = true`;
3. arquivo PDF existente.

Regras de transição:

- Marcar `isCurrent` em um rascunho não altera o certificado atual publicado.
- Ao publicar um certificado marcado como atual, todos os demais certificados publicados da mesma TAG são desmarcados automaticamente.
- O registro anterior continua publicado e aparece no histórico.
- O primeiro certificado publicado de uma TAG deve ser marcado como atual. A publicação será recusada com uma mensagem clara se não existir outro certificado atual e o novo não estiver marcado.
- Ao despublicar ou excluir o certificado atual, o sistema promove automaticamente o certificado publicado anterior da mesma TAG.
- A promoção escolhe o maior `year`; em empate, escolhe o registro mais recentemente criado.
- Se não existir outro certificado publicado, a TAG deixa de aparecer porque não terá certificados públicos.
- Alterar `visible` para `false` não muda internamente qual certificado é o atual; apenas bloqueia a exposição. Ao reativar a TAG, o mesmo atual volta a aparecer.
- Atualizações automáticas usarão contexto interno para impedir recursão dos hooks.

As operações que mudam o certificado atual devem executar dentro da transação disponibilizada pela requisição do Payload sempre que houver suporte do adaptador PostgreSQL.

## 7. Nomes e ordenação no histórico

O cliente verá:

- `Certificado atual` em destaque, acompanhado do ano;
- abaixo, a seção `Histórico de certificados`.

Rótulos:

- Um único documento no ano: `Certificado 2026`.
- Dois documentos no mesmo ano: `Certificado 2026 — 1/2` e `Certificado 2026 — 2/2`.
- A numeração dentro do ano seguirá a criação em ordem crescente: o mais antigo recebe `1/N` e o mais recente recebe `N/N`.

Ordenação:

- O atual aparece primeiro independentemente do ano.
- O histórico aparece por ano decrescente e, dentro do ano, por criação decrescente.
- As TAGs usam ordenação natural `pt-BR` com comparação numérica, de modo que `PAD-2` apareça antes de `PAD-10`.

## 8. Página pública

### 8.1. Estrutura

- Cabeçalho padrão UniPress.
- Introdução curta explicando que a página reúne certificados dos padrões utilizados pela UniPress.
- Campo “Pesquisar por TAG”.
- Contador de resultados.
- Lista de cards, um por TAG.
- Certificado atual destacado em cada card.
- Histórico recolhível ou visualmente secundário.
- Botões `Visualizar` e `Baixar` em cada certificado.
- Rodapé padrão UniPress.

### 8.2. Pesquisa

A lista completa será carregada pelo servidor, pois o volume previsto é inferior a 50 TAGs. Um componente cliente filtrará localmente sem nova requisição.

A busca usará a mesma normalização da chave administrativa e fará correspondência por trecho (`includes`) da TAG normalizada. Exemplos:

- `pi20` encontra `PI-20`;
- `PAD 10` encontra `PAD-10`;
- diferenças entre maiúsculas e minúsculas não afetam o resultado.

Estado vazio de busca: “Nenhuma TAG encontrada. Confira a identificação informada.”

Estado sem conteúdo publicado: mensagem institucional informando que nenhum certificado está disponível, sem revelar registros em rascunho ou TAGs ocultas.

### 8.3. Descoberta e indexação

- A rota não será adicionada ao `SiteHeader`, `SiteFooter`, conteúdo editorial ou sitemap.
- A página definirá `robots: { index: false, follow: false }`.
- A resposta incluirá `X-Robots-Tag: noindex, nofollow` quando aplicável.
- A rota não será adicionada como `Disallow` em `robots.txt`, pois isso anunciaria o caminho e poderia impedir que robôs respeitassem o `noindex` da página.
- Esses controles reduzem descoberta acidental, mas não são autenticação. Essa limitação foi explicitamente aceita.

## 9. Visualização e download de PDFs

Rotas propostas:

- `/certificados-padroes/[id]/visualizar`
- `/certificados-padroes/[id]/baixar`

Cada requisição deve:

1. buscar o certificado internamente;
2. confirmar que está publicado;
3. confirmar que o padrão relacionado está visível;
4. confirmar que o Blob existe;
5. recuperar o arquivo usando o token privado no servidor;
6. responder com `Content-Type: application/pdf`;
7. usar `Content-Disposition: inline` para visualizar e `attachment` para baixar;
8. sanitizar o nome do arquivo;
9. aplicar `Cache-Control: private, no-store` e `X-Content-Type-Options: nosniff`.

Qualquer falha de autorização editorial — rascunho, TAG oculta ou registro inexistente — retorna `404`, sem revelar se o documento já existiu. Uma falha temporária do Blob retorna uma página/erro amigável e é registrada apenas no servidor.

O uso de `no-store` evita que um PDF continue acessível por cache da aplicação depois que sua TAG for ocultada. Um usuário que já tenha baixado o arquivo localmente continuará com sua cópia, algo que nenhum controle do site pode revogar.

## 10. Vercel Blob

Será criado ou associado um Blob store privado específico para o recurso, configurado por:

- `STANDARDS_BLOB_READ_WRITE_TOKEN`

Configuração:

- prefixo `reference-certificates/`;
- sufixo aleatório para evitar colisões;
- upload direto do navegador para o Blob;
- autorização de client upload somente para usuários da coleção administrativa `users`;
- MIME permitido exclusivamente `application/pdf`;
- validação de limite de 20 MB tanto no cliente/admin quanto no servidor/hook;
- exclusão do Blob associada à exclusão definitiva do registro, seguindo as garantias do adaptador.

O token será configurado em Preview e Production na Vercel e nunca será armazenado no Git.

## 11. Atualização de conteúdo e cache

Mudanças em padrões ou certificados deverão revalidar `/certificados-padroes`:

- publicação/despublicação;
- troca de certificado atual;
- upload ou substituição de arquivo;
- alteração de ano;
- alteração da TAG;
- mudança de visibilidade;
- exclusão.

A página pode usar cache do Next.js com revalidação explícita pelos hooks. As rotas de PDF não usarão cache persistente.

## 12. QR Code

O QR Code codificará exatamente:

`https://www.unipress.com.br/certificados-padroes`

Entregáveis:

- PNG em alta resolução para documentos e mensagens;
- SVG vetorial para impressão;
- PDF pronto para impressão;
- margem branca mínima recomendada pelo padrão QR;
- alto contraste preto sobre branco;
- sem logo, gradiente ou decoração dentro da matriz.

Os três arquivos serão validados por leitura automatizada e por abertura da URL codificada. O QR pode ser gerado antes de a rota entrar no ar, mas só deve ser distribuído após o domínio `www.unipress.com.br` apontar para a versão que contém a página.

## 13. Área administrativa

As duas coleções ficarão em um grupo “Certificados dos padrões”.

### Padrões

Lista padrão:

- TAG;
- visível/oculto;
- atualização.

### Certificados dos padrões

Lista padrão:

- TAG relacionada;
- ano;
- atual;
- status;
- atualização.

O formulário exibirá descrições curtas para esclarecer:

- rascunhos não aparecem na página;
- marcar “atual” só substitui o anterior ao publicar;
- ocultar a TAG bloqueia todos os seus PDFs;
- o arquivo deve ser PDF e ter até 20 MB.

Não haverá formulário público de upload, importação em massa, estatísticas nem ações específicas de auditoria nesta versão.

## 14. Migração e tipos

A implementação deverá:

- registrar as duas coleções em `payload.config.ts`;
- configurar o novo Blob adapter;
- gerar `payload-types.ts`;
- criar migration PostgreSQL versionada para as tabelas, relacionamentos, índices e tabelas de versões necessárias;
- atualizar `.env.example` com `STANDARDS_BLOB_READ_WRITE_TOKEN` sem valor real;
- manter as migrations seguras para banco vazio e banco já existente.

Nenhum registro demonstrativo será criado.

## 15. Testes e critérios de aceite

### Regras e dados

- TAGs equivalentes após normalização não podem ser duplicadas.
- Busca `pi20` encontra `PI-20`.
- Apenas uma publicação pode ser atual por TAG.
- Publicar um novo atual desmarca o anterior.
- Rascunho marcado como atual não afeta o atual publicado.
- Excluir ou despublicar o atual promove o anterior.
- Duas entradas no mesmo ano recebem rótulos `1/2` e `2/2` de forma estável.
- TAG oculta não aparece e bloqueia os PDFs.
- TAG sem certificado publicado não aparece.
- Upload não PDF ou acima de 20 MB é recusado.

### Página

- `/certificados-padroes` responde com sucesso e contém cabeçalho e rodapé normais.
- A rota não aparece no menu nem no sitemap.
- Metadados impedem indexação.
- TAGs aparecem em ordem natural.
- Pesquisa funciona sem considerar pontuação, espaços ou caixa.
- Certificado atual recebe destaque.
- Histórico permanece acessível.
- Layout funciona em desktop e celular e atende à navegação por teclado.

### PDFs

- Visualização responde com PDF inline.
- Download responde como attachment.
- MIME, nome e cabeçalhos de segurança são corretos.
- Rascunho, TAG oculta, registro inexistente ou arquivo removido não vazam URL do Blob e retornam resposta controlada.
- URLs privadas do Blob não aparecem no HTML público.

### Regressão

- A área autenticada `/area-do-cliente` continua isolando certificados por cliente.
- Produtos, serviços, admin e botão do WhatsApp permanecem funcionais.
- Lint, TypeScript, testes Vitest, E2E e build Vercel devem ser executados antes da entrega.

## 16. Fora de escopo

- Certificados de equipamentos dos clientes.
- Login ou senha para a página dos padrões.
- Links temporários ou tokens no QR Code.
- Datas e validade exibidas ao público.
- Nome, modelo, série ou descrição do padrão na página pública.
- Métricas de visualização e download.
- Trilha de auditoria específica.
- Paginação.
- Importação em massa.
- Notificações de vencimento.
- Geração automática de um QR diferente por TAG.

## 17. Riscos aceitos e mitigados

- **A URL pode ser compartilhada ou descoberta:** aceito; não há conteúdo confidencial. Mitigação: ausência de navegação, sitemap e indexação.
- **Um PDF baixado não pode ser revogado do dispositivo do usuário:** aceito. Mitigação: Blob privado e bloqueio imediato de novos acessos quando a TAG for ocultada.
- **QR permanente depende do domínio:** mitigação: codificar somente o domínio final `www.unipress.com.br` e distribuir após validar o DNS e a rota em produção.
- **Concorrência ao trocar o atual:** mitigação: hooks idempotentes, contexto antirrecursão e transação PostgreSQL quando disponível.
- **Arquivos grandes em ambiente serverless:** mitigação: upload direto ao Blob, limitado a 20 MB e autorizado apenas para administradores.
