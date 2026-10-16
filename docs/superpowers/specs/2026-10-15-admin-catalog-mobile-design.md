# UniPress: administração de catálogo, serviços e experiência mobile

## Objetivo

Permitir que a equipe da UniPress mantenha famílias, ordem dos produtos e textos da página de serviços pelo Payload CMS, corrigir o uso da imagem cadastrada em cada serviço e tornar a navegação e o catálogo proporcionais e práticos em dispositivos móveis.

O trabalho preserva o conteúdo e o visual da página inicial e mantém a apresentação atual das páginas de produtos. Alterações internas necessárias para famílias e ordenação não devem introduzir mudanças visuais não solicitadas nessas páginas.

## Escopo

### Imagem do serviço

- A imagem cadastrada no documento de um serviço será exibida no lado direito do cabeçalho da página interna desse serviço.
- A imagem substituirá visualmente o selo circular “RBC”.
- Quando o serviço não tiver imagem cadastrada, o selo “RBC” continuará sendo exibido como fallback.
- A imagem será responsiva, respeitará o texto alternativo cadastrado e usará o componente de imagem já adotado pelo projeto.
- A publicação ou remoção da imagem deverá invalidar o cache da página interna do serviço.

### Conteúdo editável da página geral de serviços

- Será criado um Global do Payload CMS para a página geral de serviços.
- O Global terá os campos:
  - chamada superior;
  - título;
  - descrição.
- Os valores atuais serão usados como padrões, preservando o site após a migração.
- A página `/servicos` passará a carregar esses campos do CMS.
- A publicação desse Global invalidará o cache de `/servicos`.

### Famílias de produtos

- Será criada a coleção “Famílias de produtos”.
- Cada família terá, no mínimo, nome, slug e perfil técnico interno.
- Os registros iniciais “Manômetro” e “Acessório” serão criados e os produtos e categorias existentes serão migrados para relacionamentos com esses registros.
- Produtos e categorias continuarão pertencendo a uma família, mas deixarão de depender de opções fixas no código.
- Novas famílias, como “Termômetros”, terão perfil técnico genérico por padrão.
- Os campos técnicos especializados atuais continuarão associados aos perfis de manômetro e acessório. Famílias genéricas usarão os campos gerais do produto.
- Renomear uma família atualizará automaticamente o nome apresentado nos pontos que já mostram a família, sem exigir edição individual dos produtos.
- A exclusão será bloqueada quando a família estiver vinculada a qualquer produto ou categoria. O admin apresentará uma mensagem orientando o usuário a transferir os itens antes de excluir.
- A página inicial não será alterada.
- As páginas e cards de produto manterão sua aparência atual. O filtro de família passará a usar os nomes vindos do CMS.

### Ordenação dos produtos

- A coleção de produtos usará a ordenação nativa por arrastar e soltar do Payload CMS.
- A lista administrativa deixará clara a possibilidade de reordenar itens.
- Produtos novos serão adicionados ao final da ordem.
- A consulta pública de produtos usará a ordem administrativa como ordenação principal.
- Busca e filtros preservarão essa ordem relativa; eles apenas removem os itens que não correspondem aos critérios.
- Não será criado um segundo campo numérico manual de ordem.

### Menu e layout mobile

- O menu mobile deixará de depender apenas do elemento `details` sem controle de rota e passará a ter estado controlado.
- O menu fechará automaticamente quando o usuário selecionar qualquer link interno ou o link de contato.
- O controle terá rótulos acessíveis de abrir/fechar, estado expandido e suporte a teclado.
- O layout será revisado nas larguras de 375/390 px, 768 px e desktop para corrigir tipografia, espaçamentos, larguras, imagens e colunas desproporcionais.
- Os ajustes serão direcionados aos componentes e seletores afetados, sem redesenhar a identidade visual existente.

### Filtros de produtos no mobile

- Em telas pequenas, os filtros ficarão recolhidos inicialmente.
- Um botão “Filtrar produtos” abrirá o painel e informará a quantidade de critérios ativos.
- Todas as facetas atuais permanecerão disponíveis.
- O painel poderá ser fechado explicitamente e fechará após a ação de aplicar, levando o usuário de volta aos resultados.
- A limpeza dos filtros continuará disponível.
- Em tablet e desktop, o comportamento atual de filtros visíveis será preservado quando houver espaço adequado.
- Os filtros continuarão refletidos na URL para permitir compartilhar e restaurar uma busca.

## Arquitetura e fluxo de dados

1. O Payload CMS continuará sendo a fonte única de conteúdo.
2. A nova coleção de famílias será referenciada por produtos e categorias.
3. A camada `src/lib/cms.ts` converterá os relacionamentos do Payload em modelos públicos simples, incluindo nome e perfil da família e a chave de ordenação do produto.
4. A consulta de produtos usará a ordenação nativa da coleção; o componente de catálogo filtrará a lista sem reordená-la.
5. O novo Global de serviços será convertido em conteúdo público com defaults seguros, seguindo o padrão já usado pelas páginas institucionais.
6. Hooks de revalidação cobrirão alterações de famílias, produtos, serviços e conteúdo da página geral de serviços.

## Migração e compatibilidade

- Uma migração de banco criará a coleção de famílias, o Global de serviços, os relacionamentos e a estrutura de ordenação necessária.
- A migração criará ou localizará as famílias iniciais e converterá os valores legados `manometro` e `acessorio` sem perda de dados.
- A migração será idempotente nos pontos em que cria registros iniciais.
- Tipos do Payload e o import map do admin serão regenerados quando necessário.
- Conteúdo já publicado continuará publicado.
- A implantação deverá executar a migração antes de servir a nova versão.

## Tratamento de erros

- Falha ao carregar o Global da página de serviços usará os textos atuais como fallback.
- Relacionamentos de família ausentes não deverão derrubar o catálogo; o item receberá um rótulo neutro para leitura pública, enquanto o admin exigirá uma família válida nas próximas edições.
- Tentativas de excluir famílias em uso retornarão erro de validação legível no admin.
- Imagens ausentes ou removidas usarão o selo RBC na página interna do serviço.

## Testes e critérios de aceitação

- Testes do CMS confirmam a existência do Global de serviços e da coleção de famílias.
- Testes do CMS confirmam que produtos e categorias referenciam famílias cadastradas.
- Teste de exclusão confirma que uma família em uso não pode ser removida e que uma família sem vínculos pode ser removida.
- Testes da camada de catálogo confirmam que a ordem administrativa é preservada com e sem filtros.
- Testes da página de serviços confirmam textos vindos do CMS com fallback.
- Teste da página interna confirma imagem cadastrada e fallback RBC.
- Teste mobile confirma que o menu fecha após navegação.
- Testes mobile confirmam filtros recolhidos inicialmente, abertura, contagem de filtros ativos, aplicação, fechamento e limpeza.
- Verificação visual cobre 375/390 px, 768 px e desktop.
- A suíte de integração, a suíte E2E, o lint, o typecheck e o build devem terminar sem novos erros antes da entrega.

## Fora do escopo

- Redesenhar a página inicial.
- Redesenhar cards ou páginas internas de produtos.
- Criar novos conjuntos de especificações técnicas para termômetros ou outras famílias futuras.
- Alterar filtros, campos técnicos ou conteúdo além do necessário para suportar famílias dinâmicas e responsividade.
