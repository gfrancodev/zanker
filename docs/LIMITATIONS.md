> Plugin nativo Claude/Cursor v1.0.0. Nota: o suporte a outros harnesses via instalador Go é um modo de compatibilidade separado.

# Estado real, dependências e limitações  1.0

## Implementado e executável no pacote

- Ferramentas Node locais via `scripts/bridge.mjs`: inspect, studio, sandbox, audit, diagnose, media e validate; sem CLI global.
- 33 Agent Skills com `SKILL.md` e manifesto operacional, e 23 Knowledge Packs com 130 regras.
- Studio HTTP local com alternativas HTML, session token, escolhas e comentários JSONL.
- Sandbox isolado para HTML autônomo; sandbox React/Vite com arquivos gerados, props fixtures, wrapper e estilo global configuráveis.
- Diagnóstico DOM/computed CSS/screenshot e auditoria multi-viewport quando Playwright está instalado.
- Curadoria básica de ícones por semântica, presets motion, gerador de ilustração SVG e otimizador raster Sharp opcional.
- Registro de decisões e documentação Visual Spec por referência de arquivo/hash, sem conversão.

## Não implementado nesta versão

- Um modelo LLM próprio ou execução autônoma de agentes sem um harness de IA conectado.
- Sandbox standalone fiel para Angular, Next Server Components, Nuxt, Vue, SvelteKit e quaisquer projetos complexos com bundler customizado. É possível auditar URLs desses apps levantados no ambiente original.
- Geração de imagem fotorrealista, voz ou vídeo sem integração a provedor externo.
- Pipeline independente de validação Visual Spec 1.0 contra schema oficial; somente valida sintaxe JSON de arquivos referenciados.
- Sistema de reconhecimento semântico multimodal embutido; a LLM do harness avalia visualmente screenshots.
- Garantia de cobertura WCAG completa, performance de campo, detecção de todo bug visual ou equivalência de produção.
- Storybook como dependência embutida, geração de patch/PR automática, sincronização Figma ou dados de analytics reais.
- Verificação de licenças por API de todos os providers de ícones.
- Validação end-to-end em navegador real do sandbox React neste ambiente de build (sem node_modules/playwright disponíveis).

## Roadmap técnico recomendado

P0: validar React/Vite em projetos reais com aliases/providers/temas; habilitar suite Playwright CI com browser fixo.

P1: adapter standalone Angular; adapter Next que respeite SSR/RSC, auth/fixtures; interceptação MSW; acessibilidade via Axe integrada; rastreamento React source map.

P2: integração autorizada com geradores de mídia (imagem/vídeo), busca Iconify com licença, crítica visual multimodal por harness, painel de diff humano.

P3: produção multi-projeto, catálogo de decisões cross-harness, integração com telemetry, benchmarking com avaliadores humanos e governança de atualização das fontes.
