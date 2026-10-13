# ZANKER

**AI Product Design & Visual Engineering Agent**  
**Documento de visão, produto, arquitetura e funcionamento**  
**Versão de referência:** plugin v1.0.0 | **Data:** 12 de outubro de 2026  
**Estado:** base funcional com capacidades avançadas ainda em evolução

> **Em uma frase:** Zanker é um subagente de IA que compreende produtos e projetos frontend, diagnostica problemas visuais, orienta decisões de UX/UI, cria e aprimora interfaces na stack existente e utiliza prévias e evidências de validação para entregar experiências mais consistentes.

---

## 1. Resumo executivo

O Zanker é um **plugin de inteligência de produto, design e engenharia visual** para harnesses de IA utilizados no desenvolvimento de software. Ele combina conhecimentos de UX/UI, análise de código frontend, direção de arte, componentes, iconografia, mídia, motion, experimentação visual e validação por navegador em um mesmo fluxo de trabalho.

Seu propósito não é simplesmente “gerar telas bonitas”. O Zanker procura compreender **o produto, o público, os objetivos, a arquitetura existente e as consequências de cada alteração**. Com base nisso, distingue uma correção localizada de um redesenho, preserva componentes e tokens já existentes e recomenda ou executa o menor conjunto de mudanças necessário.

A distribuição foi concebida como **plugin nativo**: Claude Code e Cursor recebem manifestos próprios, agente e skills; outros harnesses podem usar um instalador Go opcional de compatibilidade, executado uma única vez. O projeto consumidor não precisa de um comando global `zanker`, de compilador Go ou de um novo framework de UI.

A versão de referência v1.0.0 contém **33 skills**, **23 Knowledge Packs JSON** e **130 regras estruturadas**. Já oferece núcleo de descoberta, Studio local com alternativas HTML, sandbox HTML/React com Vite, inspeção e auditoria condicionadas às dependências disponíveis, utilitários básicos de mídia/ícones/motion, registro de decisões e documentação por referência. Parte da visão  como sandbox autônomo de Angular e Next.js com SSR/RSC, geração externa de imagens e validação visual E2E integral  continua planejada.

### 1.1 A proposta de valor

- **Entender antes de desenhar:** decisões visuais começam no usuário, no produto e no código existente.
- **Investigar antes de corrigir:** diagnosticar a causa de problemas de layout, estilo ou interação, em vez de acumular overrides CSS.
- **Visualizar antes de integrar:** explorar propostas e, quando a stack permitir, renderizar componentes isoladamente.
- **Validar antes de entregar:** registrar cenários, screenshots, testes, limitações e riscos de regressão.
- **Documentar sem criar acoplamento:** Visual Spec descreve o que foi criado, mas nunca se torna motor de geração de código.

## 2. Por que o Zanker existe

O projeto nasce do cansaço com interfaces feitas por IA que funcionam e mesmo assim não se preocupam com UX/UI. O resultado é slop: o mesmo degradê, o mesmo card, a mesma tipografia, o happy path sem estado vazio. Isso não é um modelo tentando desenhar e falhando. É um modelo que nunca recebeu design de produto como conhecimento que precisa aplicar, então cada escolha cai no padrão médio.

Uma IA que escreve frontend deveria ter esse conhecimento: ler o design system que já existe, entender público e conteúdo real, estruturar a tela antes da superfície e validar o que renderizou. UX e UI não são um acabamento depois do código. Fazem parte do trabalho.

No sentido oposto, um desenvolvedor que precisa corrigir um componente frequentemente depende de executar toda a aplicação, conectar um backend, reproduzir a autenticação e localizar manualmente qual arquivo controla um elemento. Isso torna a revisão visual lenta e propensa a regressões.

O Zanker foi concebido para enfrentar esses problemas como um sistema integrado: **investigação do produto + compreensão do frontend + geração visual orientada por contexto + execução controlada + verificação objetiva**.

### 2.1 Problemas que busca resolver

| Problema recorrente | Como o Zanker aborda |
|---|---|
| Interfaces de IA visualmente genéricas | Direção de arte orientada ao produto, critérios de composição e repertório de referências |
| Correções CSS que escondem o defeito | Visual Forensics, análise de DOM/estilos e investigação da causa raiz |
| Componentes duplicados ou inconsistentes | Descoberta do design system e priorização de reutilização |
| Dificuldade de visualizar apenas uma tela | Design Studio e Stack Sandbox com cenários isolados |
| Ícones repetitivos ou incoerentes | Curadoria semântica e preservação da família iconográfica |
| Animações excessivas ou sem propósito | Motion orientado à função, performance e movimento reduzido |
| Falta de evidências antes de concluir | Quality Gates, relatórios, screenshots e estado dos testes |
| Conhecimento visual perdido entre sessões | Registro de decisões, evidências e documentação vinculada ao projeto |

## 3. O que o Zanker é  e o que não é

### 3.1 O que é

O Zanker é um **subagente especializado**, ativado pelo harness principal quando a tarefa envolve experiência de usuário, interfaces, componentes ou qualidade visual. Ele opera sobre um repositório existente ou sobre uma nova experiência, usando **skills sob demanda** e referências curadas em JSON.

Combina quatro perspectivas profissionais: **designer de produto**, **diretor de arte**, **engenheiro frontend** e **investigador de qualidade visual**. Essas perspectivas compõem um único agente lógico; não é obrigatório executar quatro LLMs ou uma infraestrutura multiagente.

### 3.2 O que não é

- **Não é uma LLM própria.** Utiliza o modelo disponibilizado pelo Claude Code, Cursor ou outro harness.
- **Não é um SaaS ou uma plataforma centralizada obrigatória.** Sua distribuição principal é por plugin.
- **Não é uma biblioteca de componentes.** Reutiliza preferencialmente a UI do próprio produto.
- **Não é um substituto de Storybook, Figma ou Playwright.** Integra ou complementa essas ferramentas quando disponíveis.
- **Não é um gerador baseado em Visual Spec.** Visual Spec é exclusivamente documento e referência visual.
- **Não promete autonomia total ou conformidade automática.** Validação humana, testes reais e permissões continuam necessários.

## 4. Para quem foi construído

**Desenvolvedores frontend:** correções visuais, interpretação de design systems, refatoração controlada, responsividade e componentes reutilizáveis.

**Tech leads e arquitetos:** consistência entre aplicações, avaliação de impacto, padronização de componentes e evidências de qualidade.

**Designers de produto e UX/UI:** investigação de alternativas, direção visual, revisão de estados, adaptação a diferentes públicos e diálogo com a implementação.

**Equipes de produto:** tradução de objetivos e jornadas em interfaces mais claras, sem reduzir decisões a gosto pessoal.

**Times com sistemas legados ou monolitos:** possibilidade de analisar e pré-visualizar partes do frontend sem exigir, em todos os casos, o funcionamento de toda a aplicação.

## 5. Filosofia operacional

### 5.1 Produto antes da estética

O Zanker analisa quem utiliza a interface, o que tenta realizar, em quais condições e qual resultado é relevante. Uma tela para um analista experiente pode favorecer densidade informacional e rapidez; uma jornada financeira para o público geral pode exigir explicações, confiança e prevenção de erros.

O agente deve diferenciar **fatos comprovados, hipóteses e informações desconhecidas**. Não pode afirmar que houve pesquisa com usuários sem evidência. Perguntas adicionais são reservadas a incertezas que mudem decisões de forma relevante.

### 5.2 Código e design system como fontes de verdade

Em projetos existentes, o código e o comportamento observado descrevem a implementação real. O design system, os tokens e as diretrizes da marca orientam a identidade visual. Referências externas complementam esse contexto, mas não o substituem automaticamente.

### 5.3 Diagnóstico proporcional ao pedido

“Corrija o alinhamento desse botão” pede uma correção localizada; “redesenhe o dashboard” exige descoberta, comparação visual e aprovação. O agente não deve transformar uma alteração pequena em um redesign não solicitado.

### 5.4 Evidência em vez de aparência de certeza

O Zanker documenta o que foi observado, o que foi testado, o que não pôde ser testado e os riscos conhecidos. Screenshot não substitui teste de interação; teste automatizado não substitui avaliação humana de usabilidade.

## 6. Arquitetura de alto nível

```text
Harness de IA (Claude Code / Cursor / outros)
           |
     ZANKER SUBAGENT
     Orquestração e políticas
           |
     +-----+--------------------+
     |                          |
 Product & Project DNA     Knowledge Packs JSON
     |                          |
     +------------+-------------+
                  |
             Skills sob demanda
                  |
    +-------------+-------------------+
    |             |                   |
  Diagnose       Design             Create
  Forensics      Art Direction      Icons/Media/Motion
    |             |                   |
    +-------------+-------------------+
                  |
       Design Studio / Stack Sandbox
                  |
          Quality & Integration
                  |
       Decision Memory + Evidências
                  |
      Visual Spec (documentação apenas)
```

### 6.1 Camadas

| Camada | Responsabilidade |
|---|---|
| Harness | Prover o modelo, as ferramentas e a interação com o usuário |
| Zanker Core | Interpretar tarefa, aplicar políticas e selecionar skills |
| Product Intelligence | Contexto do produto, público, jornadas e objetivos |
| Project Intelligence | Reconhecimento do frontend, componentes, tokens e dependências |
| Knowledge Engine | Consulta seletiva dos 23 pacotes de conhecimento JSON |
| Design & Creation | Direção de arte, UI, conteúdo, iconografia, mídia e motion |
| Studio & Sandbox | Comparação visual e execução isolada dentro dos limites da stack |
| Quality Engine | Diagnóstico, testes, acessibilidade e evidências |
| Documentation & Memory | Decisões, referências, relatórios e documentação Visual Spec |

## 7. Inteligência de produto e de projeto

### 7.1 Product DNA

O Zanker busca compreender proposta de valor, público-alvo, experiência do usuário, tarefas principais, prioridades de negócio, tom de voz, acessibilidade, dispositivos e restrições regulatórias relevantes. Pode reunir essas informações em um `product.context.json`, identificando origem e nível de confiança.

O objetivo não é produzir personas fictícias e tratá-las como pesquisa: é conectar **decisões de design a necessidades verificáveis ou hipóteses transparentes**.

### 7.2 Project DNA

O Project DNA inspeciona o repositório em busca de framework, versões, gerenciador de pacotes, módulos, componentes, rotas, providers, tema, bibliotecas de UI, estilos, ícones e convenções. O resultado pode ser persistido em `.zanker/project.manifest.json`.

Na v1.0.0, o núcleo de inspeção está presente. A rastreabilidade profunda elemento visual → componente → arquivo de origem, para todas as stacks, ainda depende de adaptadores adicionais e da configuração do projeto.

### 7.3 Preservação da identidade

Ao atuar em um produto existente, o Zanker deve reutilizar fontes, paletas, tokens e componentes compartilhados, evitando recriação injustificada. Em projetos novos, pode propor um sistema inicial coerente e documentar escolhas explícitas de tipografia, cor, grid, iconografia e movimento.

## 8. Sistema de Skills e Knowledge Packs

### 8.1 Skills: como o agente age

Uma skill descreve **quando** determinada capacidade deve ser ativada, **o que consultar**, **como proceder**, **quais ferramentas usar** e **quais evidências entregar**. As skills seguem a convenção `SKILL.md` com metadados, instruções e arquivos auxiliares.

A v1.0.0 possui **33 skills**, distribuídas funcionalmente da seguinte maneira:

| Domínio | Skills principais |
|---|---|
| Discover | Product Discovery, Project DNA, Design System Discovery, UX Strategy |
| Diagnose | Frontend Inspection, Visual Forensics, Root Cause Analysis, Design Audit |
| Design | Art Direction, Visual Brainstorm, Information Architecture, Component Design, Design Tokens, Content Design |
| Create | Media Generation, Icon Curation, Motion Design |
| Prototype | Preview Server, Stack Sandbox, Scenario Engine, Dependency Mocking |
| Validate | Design Critique, Visual Regression, Responsive Audit, Accessibility Audit, Performance Audit, Quality Benchmark |
| Integrate | Safe Patching, Production Parity, Design System Evolution |
| Document & Learn | Visual Spec Documentation, Design Decisions, Reference Curation |

Não é necessário carregar todas as skills em uma tarefa: o Zanker utiliza **divulgação progressiva de contexto**, mantendo o orçamento de tokens sob controle.

### 8.2 Knowledge Packs: o que o agente consulta

O Knowledge Engine usa **23 arquivos temáticos JSON**, com **130 regras estruturadas**, organizados em assuntos como fundamentos visuais, pesquisa e produto, componentes, acessibilidade, padrões de plataforma, frontend, mídia e avaliação.

Cada regra pode expressar intenção, princípios, antipadrões, verificações e links de referência. Esse catálogo permite consulta determinística por tema, sem depender de um banco vetorial ou de um serviço externo de RAG. Uma busca semântica pode ser adicionada futuramente, sem mudar a fonte de conhecimento.

A base é uma curadoria operacional, não uma cópia integral de cursos pagos, livros ou documentação de terceiros. Deve ser mantida com controle de fontes, versões, pertinência e licenças.

## 9. Capacidades especializadas

### 9.1 Visual Forensics  investigação de interfaces

O Zanker busca reproduzir problemas de UI combinando código, HTML/DOM, estilos computados, viewport, estados e screenshots. Ele formula hipóteses, procura a causa raiz e avalia impacto em elementos compartilhados. Sua finalidade é evitar correções cosméticas que escondem falhas estruturais.

**Exemplo:** um modal ultrapassa a largura do iPhone. O Zanker deve investigar largura intrínseca, padding, min-width, conteúdo longo, container e regras responsivas antes de adicionar um `overflow: hidden` genérico.

### 9.2 Art Direction  direção de arte

Define hierarquia, composição, tipografia, cor, ritmo, espaço negativo e linguagem visual. Avalia o significado dos elementos e sua adequação à marca e ao usuário. “Premium” é tratado como **intenção, clareza e acabamento**, não como um conjunto fixo de gradientes, sombras e bordas.

### 9.3 Icon Curator  iconografia

Escolhe ícones pela semântica da ação, pela biblioteca já usada no projeto e pela consistência da família visual. Busca evitar tanto repetição sem sentido quanto mistura incoerente de estilos. O catálogo Iconify é uma referência possível; sua integração completa por busca/licenciamento ainda não está embutida no plugin.

### 9.4 Media Studio  recursos visuais

Produz ou prepara assets como SVG, ilustrações simples, placeholders e recursos raster otimizados. A v1.0.0 inclui geração procedural básica de SVG e suporte opcional a Sharp. Geração fotorrealista e vídeo dependem de serviços externos ainda não incluídos na distribuição.

### 9.5 Motion Director  movimento funcional

Orienta transições, feedback, hierarquia temporal, timelines e respeito a `prefers-reduced-motion`. O princípio é que animação deve explicar continuidade, resposta ou mudança de estado  não apenas decorar a interface. A implementação pode utilizar CSS ou bibliotecas existentes no projeto, conforme a necessidade.

### 9.6 Content Design e acessibilidade

A linguagem é parte da experiência. O Zanker considera rótulos, erros, mensagens de status, microcopy, linguagem inclusiva, localização e dados longos. Em acessibilidade, procura apoiar revisão de contraste, navegação por teclado, foco, semântica, nomes acessíveis e estados; não declara conformidade integral somente por testes automatizados.

## 10. Design Studio: explorar antes de implementar

O **Zanker Design Studio** é um servidor local de pré-visualização que permite exibir alternativas visuais, comparar direções e registrar decisões do usuário. Foi inspirado conceitualmente na experiência do Visual Companion do Superpowers; sua implementação não depende de copiar o projeto inteiro.

Uma solicitação como “quero modernizar nosso dashboard” pode seguir este percurso: compreender público e design system, criar duas ou três opções de composição, apresentá-las em HTML no navegador, coletar preferência e registrar o motivo da escolha.

**Na v1.0.0**, o Studio publica previews HTML e grava seleção/comentários em arquivos JSONL. O feedback ainda **não provoca automaticamente uma nova execução do modelo** sem um adaptador específico do harness. O objetivo de evolução é fechar esse ciclo de forma bidirecional.

## 11. Stack Sandbox: visualizar componentes isolados

O **Stack Sandbox** é a camada de execução voltada a visualizar um componente ou página sem exigir que toda a aplicação esteja operacional. A estratégia é preservar, sempre que possível, o framework, os estilos, os providers e os assets reais, usando fixtures ou mocks apenas para dependências externas.

Se o sistema utiliza React com Vite, o Zanker pode preparar um host isolado para renderizar componentes com dados de cenário. Se utiliza Angular ou Next.js com Server Components, a paridade depende de runners específicos ainda não distribuídos nesta versão.

### 11.1 Modos de uso previstos

| Modo | Finalidade | Situação na v1.0.0 |
|---|---|---|
| Concept | Explorar mockups HTML e direções visuais | Disponível no Studio |
| Component | Executar componente real e controlar props/fixtures | Disponível em HTML e React/Vite, com limitações |
| Page | Renderizar página com providers e mocks | Parcial; depende da stack |
| Integrated | Verificar a mudança na aplicação de origem | Executado com ferramentas do projeto/harness |

### 11.2 Cenários

Uma interface não pode ser avaliada apenas no estado ideal. Os cenários desejados incluem carregamento, vazio, erro, dados longos, permissões, tema claro/escuro, mobile, desktop, zoom, teclado e movimento reduzido.

### 11.3 Isolamento e segurança

O sandbox atual separa arquivos e usa proteções locais para o Studio, mas **não constitui uma fronteira robusta de segurança do sistema operacional**. Executar código de um repositório desconhecido continua exigindo aprovação e ambiente confiável. Não se deve passar secrets de produção, credenciais ou dados reais aos previews.

## 12. Quality Engine: qualidade verificável

O Zanker procura substituir o ciclo “implementar e presumir que ficou bom” por um fluxo de evidências. Quando as ferramentas estão disponíveis, pode apoiar screenshots em diferentes viewports, investigação de console/DOM/CSS e relatórios. Também propõe testes funcionais e de acessibilidade como Quality Gates.

### 12.1 Dimensões de avaliação

| Dimensão | O que observar |
|---|---|
| Adequação | A solução atende ao público e à tarefa? |
| UX e navegação | O caminho principal é compreensível e eficiente? |
| Direção visual | Hierarquia, ritmo, contraste, identidade e acabamento |
| Design system | Componentes, tokens e padrões preservados |
| Estados | Loading, empty, error, overflow e feedback |
| Responsividade | Layouts, containers, zoom e diferentes viewports |
| Acessibilidade | Teclado, foco, nomes, semântica, contraste e revisão humana |
| Performance | Carregamento de mídia, fontes, renderização e animações |
| Integração | Build, testes e regressões relevantes |

Na v1.0.0, a auditoria com Playwright depende de sua instalação no projeto. **A execução E2E abrangente com Axe, comparações de baseline e homologação visual humana ainda não está comprovada** no pacote distribuído.

### 12.2 Critério de conclusão

O relatório de uma tarefa deve apresentar: objetivo, contexto, arquivos alterados, decisões relevantes, evidências visuais disponíveis, testes executados, testes não executados, riscos, limitações e, quando aplicável, aprovação de direção visual. Uma nota estética não pode compensar falha funcional ou crítica de acessibilidade.

## 13. Visual Spec 1.0: documentação, nunca código-fonte

O Zanker pode criar documentação usando como referência a **Visual Spec 1.0**, disponível em `https://visualspec.dev/specification/1.0`.

Sua função é **descrever e visualizar** telas, componentes, estados, movimentos e decisões, relacionando documentos com o código real e screenshots. Ela não substitui React, Angular, CSS, assets, testes ou runtime. Tampouco determina que a implementação seja reconstruída para se adequar a um JSON antigo.

### 13.1 Regra de autoridade

1. **Fonte de verdade funcional:** código do repositório e comportamento validado.
2. **Fonte de verdade visual da marca:** design system e requisitos de produto.
3. **Evidências:** screenshots, pesquisas, decisões e testes.
4. **Referências:** skills, Knowledge Packs e normas aplicáveis.
5. **Visual Spec:** documentação visual e referência de consulta.

**Fluxo correto:** implementar ou analisar → validar → documentar com Visual Spec. Um documento conceitual pode existir antes, mas não vira fonte canônica para geração de código.

**Estado atual:** o plugin registra relações e referências documentais; ainda não executa validação abrangente dos documentos contra o schema oficial 1.0.

## 14. Memória e rastreabilidade

A memória do Zanker precisa preservar o **porquê** das decisões, não só o resultado final. O registro pode conter contexto de produto, opções avaliadas, alternativa aprovada, restrições, screenshots, componentes afetados, resultados de testes e pendências.

Na distribuição atual, decisões e feedback podem ser gravados em arquivos locais, incluindo JSONL. O Zanker também pode se beneficiar da infraestrutura de memória fornecida pelo harness. A integração com Overdrive/TurboVec é uma **possibilidade de adapter**, não uma dependência nativa da v1.0.0.

A memória jamais deve prevalecer automaticamente sobre o código atual: após mudanças no projeto, informações antigas precisam ser revalidadas.

## 15. Distribuição e instalação como plugin

A instalação principal é **nativa do harness**, não por um CLI do Zanker. O pacote contém manifestos, agente, skills, documentação, Knowledge Packs e scripts opcionais.

| Ambiente | Modelo de distribuição |
|---|---|
| Claude Code | Plugin com `.claude-plugin/plugin.json` e marketplace local |
| Cursor | Plugin com `.cursor-plugin/plugin.json`, agente e skills |
| OpenCode e genéricos | Instalador Go opcional de compatibilidade, uso único |
| Linux / Windows / macOS | Binários Go de compatibilidade distribuídos separadamente |

### 15.1 Claude Code  instalação local

```bash
claude plugin marketplace add /caminho/absoluto/zanker-plugin-v1.2
claude plugin install zanker@zanker-local
```

### 15.2 Cursor  instalação local

Copiar `` para `~/.cursor/plugins/local/zanker/` e recarregar o Cursor, observando eventuais restrições da configuração do workspace.

### 15.3 Runtime opcional

O plugin funciona como agente e catálogo de conhecimento sem Node. Para as **operações visuais locais**, o pacote atual usa scripts que requerem **Node.js 20+**; Playwright e Sharp são opcionais para tarefas específicas. Não há instalação global de `zanker` e o plugin não inicia servidores ao ser habilitado.

### 15.4 Estrutura resumida

```text
zanker-plugin/
├── .claude-plugin/marketplace.json
├── .cursor-plugin/marketplace.json
└── 
    ├── .claude-plugin/plugin.json
    ├── .cursor-plugin/plugin.json
    ├── agents/zanker.md
    ├── skills/                 # 33 skills
    ├── knowledge/              # 23 JSON packs
    ├── scripts/                # comandos locais opcionais
    ├── src/                    # runtime visual
    ├── schemas/
    ├── docs/
    └── tests/
```

## 16. Exemplos práticos de utilização

### 16.1 Corrigir um componente quebrado

**Pedido:** “Este formulário Angular fica desalinhado em telas pequenas.”

**Fluxo esperado:** mapear o componente e estilos, identificar o viewport e o estado que reproduzem a falha, investigar a causa no DOM/CSS, propor mudança localizada, executar testes relevantes na aplicação ou no runner nativo, comparar antes/depois e relatar limitações.

**Observação:** um sandbox Angular standalone ainda não está incluído; o Zanker deve usar o ambiente Angular existente até o adapter estar disponível.

### 16.2 Melhorar um dashboard

**Pedido:** “Quero um dashboard financeiro mais premium, mas adequado aos analistas que usam o sistema diariamente.”

**Fluxo esperado:** entender tarefas e densidade informacional, mapear componentes e tokens, apresentar alternativas de hierarquia, obter aprovação para mudanças amplas, implementar na stack do projeto, validar cenários e responsividade e registrar as decisões.

### 16.3 Criar landing page

**Pedido:** “Crie uma landing page com identidade própria para um novo produto.”

**Fluxo esperado:** identificar produto, público e proposta de valor; definir direção de arte e microcopy; escolher mídia e ícones coerentes; construir layout responsivo; revisar performance, acessibilidade e estados; entregar alterações revisáveis.

### 16.4 Documentar uma interface

**Pedido:** “Documente visualmente o fluxo de contratação e seus estados.”

**Fluxo esperado:** analisar páginas reais, capturar referências visuais, identificar estados e relações, registrar documentação compatível com a política Visual Spec e ligar os documentos ao código. **Não gerar ou reconstruir frontend a partir do Visual Spec.**

## 17. Segurança, licenciamento e governança

O Zanker deve priorizar execução controlada: não rodar scripts desconhecidos sem autorização, não instalar dependências silenciosamente, não expor secrets e não modificar indiscriminadamente código compartilhado. Mudanças devem ser revisáveis e proporcionais ao objetivo.

Ferramentas de terceiros  como Superpowers, UI UX Pro Max, Iconify, Playwright, MSW, Motion, GSAP e Sharp  são **referências ou integrações possíveis**, não código automaticamente incorporado no ZIP. A licença de cada ferramenta e de seus assets deve ser verificada antes de reutilização e distribuição.

A documentação e a metodologia do Zanker são uma síntese operacional própria, mantida com fontes, versões e licenças verificáveis.

## 18. Estado real da versão 1.0.0

Esta seção separa **entrega comprovada no pacote** de **evolução planejada**.

| Item | Estado verificado no pacote |
|---|---|
| Plugin nativo com manifestos Claude/Cursor | Presente; ativação nos próprios aplicativos não testada neste ambiente |
| Agente e 33 skills | Presentes e validados estruturalmente |
| 23 Knowledge Packs e 130 regras | Presentes e validados estruturalmente |
| Inspeção de repositório frontend | Implementada no runtime local |
| Studio HTML com escolhas e feedback | Implementado e testado via HTTP |
| Sandbox HTML e React/Vite | Implementado; React/Vite não passou por E2E completo neste build |
| Auditoria via Playwright | Implementação opcional; depende de instalação/browser |
| Diagnóstico DOM/CSS/screenshot | Disponível mediante ambiente e ferramentas compatíveis |
| Geração SVG e otimização opcional Sharp | Disponíveis |
| Mídia generativa avançada e vídeo | Não embutidos |
| Sandbox autônomo Angular/Next RSC/Vue/Nuxt/Svelte | Não implementado |
| Feedback que reinvoca automaticamente o harness | Não implementado |
| Testes E2E completos com Axe e regressão visual | Não concluídos neste pacote |
| Visual Spec com validação integral de schema | Não implementado; documentação por referência disponível |
| Isolamento de segurança por container/OS | Não implementado |

### 18.1 Evidências de testes existentes

O relatório distribuído em `TEST_REPORT.md`, datado de 12/10/2026, registra **22 testes Node do plugin aprovados** e validação estrutural das **33 skills / 23 packs / 130 regras**. Para o instalador Go opcional de compatibilidade, registra **100% de cobertura de instruções do pacote do instalador** com race detector. Isso **não significa** 100% de cobertura do runtime JavaScript, conformidade UX ou qualidade estética.

Os binários Go foram compilados para Linux, macOS e Windows, nas arquiteturas AMD64 e ARM64; nem todos foram executados nativamente. A captura headless com Chromium não foi concluída naquele ambiente. A ativação nativa dos plugins em instâncias reais dos harnesses também permanece como verificação do ambiente consumidor.

## 19. Roadmap recomendado

**Fase 1  Consolidar o plugin:** smoke tests em instalações reais de Claude Code e Cursor, atualização e desinstalação, integração com CI e rastreabilidade de versões.

**Fase 2  Validar a experiência visual:** Playwright executando no browser real, screenshots determinísticos, Axe, cenários e revisão de regressões por componente.

**Fase 3  Expandir sandboxes:** adapter Angular com providers/DI, adapter Next.js fiel a SSR/RSC, suporte adicional a Vue/Nuxt/SvelteKit e estratégia de mocks HTTP.

**Fase 4  Aprofundar design e mídia:** integração autorizada com provedores externos de imagens/vídeo, catálogo de ícones com licenças, assets de animação e avaliação multimodal mais rigorosa.

**Fase 5  Governança e escala:** isolamento seguro de execução, benchmarks humanos e automatizados, catálogo de decisões reaproveitáveis e documentação sincronizada por evidências.

Essas fases são prioridades de engenharia, não funcionalidades já entregues nem compromissos de prazo.

## 20. Como avaliar o sucesso do Zanker

O sucesso do Zanker não deve ser medido pelo número de telas geradas ou pela quantidade de skills. Os indicadores mais úteis são:

- **Tempo até diagnóstico:** quanto esforço é necessário para localizar e explicar um problema visual.
- **Tempo até primeira prévia útil:** rapidez para mostrar um componente ou alternativa verificável.
- **Taxa de reutilização:** porcentagem de mudanças que reaproveitam componentes e tokens corretos.
- **Regressões introduzidas:** defeitos visuais ou funcionais após uma modificação.
- **Qualidade percebida:** avaliação humana de hierarquia, identidade, clareza e consistência.
- **Usabilidade:** conclusão de tarefas, compreensão, erros e feedback de usuários reais quando disponíveis.
- **Rastreabilidade:** proporção de entregas acompanhadas de justificativa e evidência adequada.
- **Custos operacionais:** tempo, tokens, processamento e manutenção do sistema de referência.

As avaliações devem comparar projetos e tarefas reais, inclusive tarefas simples em que o agente precisa ser **discreto e conservador**.

## 21. Visão de longo prazo

A ambição do Zanker é tornar a qualidade visual uma capacidade contínua do desenvolvimento assistido por IA. O agente não será lembrado apenas por gerar uma boa landing page, mas por **compreender qualquer frontend, respeitar o produto, propor decisões melhores, enxergar o resultado e sustentar melhorias sem comprometer o sistema existente**.

Seu diferencial é integrar pensamento de produto, repertório visual e engenharia: **entender → investigar → conceber → visualizar → construir → validar → documentar**.

A arquitetura de plugin permite que essa inteligência acompanhe os fluxos e harnesses já utilizados pelos desenvolvedores, sem obrigar as equipes a adotar uma plataforma visual proprietária.

## 22. Glossário rápido

**Harness:** ambiente de IA que hospeda o modelo e executa ferramentas, como Claude Code ou Cursor.  
**Subagente:** especialista acionado pelo harness para uma classe de tarefas.  
**Skill:** instrução modular que orienta o agente sobre procedimentos e ferramentas.  
**Knowledge Pack:** arquivo JSON de regras e referências, consultado sob demanda.  
**Product DNA:** contexto de negócio, público, jornada e objetivos.  
**Project DNA:** contexto técnico, componentes, estilo e arquitetura do frontend.  
**Visual Forensics:** investigação de causas de problemas visuais com código, DOM, CSS e evidências.  
**Design Studio:** navegador local para explorar alternativas e registrar feedback.  
**Stack Sandbox:** ambiente de pré-visualização de código real, com limitações de paridade.  
**Quality Gate:** critério de verificação antes de considerar uma entrega concluída.  
**Visual Spec:** documento de representação e referência visual; nunca fonte de geração de código.

## 23. Referências e documentação do projeto

**Documentação interna distribuída no plugin**

- `AGENT.md`  missão, prioridades e políticas do agente.
- `docs/ARCHITECTURE.md`  camadas e fluxos.
- `docs/LIMITATIONS.md`  limitações da versão atual.
- `docs/QUALITY.md`  critérios de qualidade.
- `docs/VISUALSPEC_POLICY.md`  política de uso documental.
- `docs/PLUGIN_INSTALL.md`  distribuição e instalação.
- `TEST_REPORT.md`  resultados e limites de validação do pacote.

**Referências conceituais e técnicas**

- Agent Skills: https://agentskills.io/specification
- Visual Spec 1.0: https://visualspec.dev/specification/1.0
- Superpowers: https://github.com/obra/superpowers
- UI UX Pro Max: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
- Playwright: https://playwright.dev/
- Iconify: https://iconify.design/
- WCAG 2.2: https://www.w3.org/WAI/WCAG22/quickref/
- Apple Human Interface Guidelines: https://developer.apple.com/design/human-interface-guidelines/
- Material Design: https://m3.material.io/
- Nielsen Norman Group  heurísticas: https://www.nngroup.com/articles/ten-usability-heuristics/

---

**Definição final:** O Zanker é um plugin de IA especializado em UX/UI e engenharia visual que ajuda equipes a compreender produtos, investigar código frontend, criar experiências adequadas ao público, visualizar componentes, avaliar resultados e documentar decisões com evidências. Seu foco é **qualidade de experiência sustentada por contexto e execução real**, não apenas geração estética automatizada.
