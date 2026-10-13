# Arquitetura do Zanker  v1.0

## Camadas

```text
Harness de IA (Claude/Cursor/Codex/OpenCode/Pi)
    └── Zanker AGENT.md / Skills Registry
        ├── Product Intelligence (Product DNA, pesquisa, hipóteses)
        ├── Project Intelligence (scan estático, componentes, tokens)
        ├── Knowledge Engine (index.json -> 23 JSON Packs -> 130 regras)
        ├── Diagnose (Visual Forensics + Playwright / DOM-CSS)
        ├── Design (Art Direction, UX Strategy, visual brainstorm)
        ├── Create (componentes no projeto, mídia, ícones, motion)
        ├── Prototype (Studio HTML / React-Vite Stack Sandbox)
        ├── Validate (screenshot, console, overflow, estados, revisão)
        ├── Integrate (patch revisável, validação no runtime real)
        └── Document & Learn (decisions.jsonl, Visual Spec reference)
```

## Fluxo A  correção visual

1. Identificar tela/elemento, contexto e viewport.
2. `project-dna` -> `frontend-inspection` -> `visual-forensics`.
3. Reproduzir defeito no navegador; associar computed CSS a regras/código.
4. Mínimo patch possível; rerenderizar, obter screenshots e validar regressões.
5. Integrar com evidências; documentar a decisão.

## Fluxo B  novo design

1. `product-discovery`: público, tarefas, contexto, hipóteses e restrições.
2. `ux-strategy`: outcomes, IA, fluxos e sucessos.
3. `project-dna` + `design-system-discovery`: preservar stack/tokens.
4. `art-direction` + `visual-brainstorm`: 2-3 propostas.
5. `preview-server` + feedback registrado e aprovação de direção.
6. Implementação real no projeto isolada por worktree.
7. `stack-sandbox` + `scenario-engine` + mocks/wrappers.
8. `visual-regression`, acessibilidade, responsividade, funcionalidade e performance.
9. Integração e decisão registrada.
10. Opcional: documentação Visual Spec 1.0, como anotação do artefato existente; nunca gera código.

## Dados e storage

| Artefato | Local | Papel |
|---|---|---|
| Knowledge Packs | `knowledge/<area>/*.json` | Referências e regras de design |
| Skills | `skills/<name>/SKILL.md` + `manifest.json` | Instruções para agente |
| Product DNA | `.zanker/product.context.json` | Contexto do produto, a produzir pelo agente |
| Project DNA | `.zanker/project.manifest.json` | Resultado do scanner estático |
| Studio feedback | `.zanker/studio/events-*.jsonl` | Alternativas e escolhas |
| Sandbox | `.zanker/sandboxes/<id>/` | Host gerado sem sobrescrever frontend |
| Screenshot + audit | `.zanker/reports/<id>/` | Evidências de browser |
| Diagnóstico | `.zanker/forensics/<id>/` | CSS/DOM/screenshot do elemento |
| Decisions | `.zanker/decisions.jsonl` | Histórico auditável |
| Visual documentation | `.zanker/documentation/<slug>/` | Referência a código, imagens e Visual Spec opcional |

## Interface entre Skill e execução

Uma skill define **quando** usar uma capacidade, **qual conhecimento** consultar, **como** executar e **que evidências** entregar. O CLI fornece operações determinísticas; o harness lê o projeto, toma decisões de design e escreve código. Não existe modelo LLM ou conexão automática a um provedor de imagem dentro do CLI.

## Proteções arquiteturais

- Studio em localhost com token de sessão; previews HTML em iframes sandboxed com CSP.
- Scanner ignora links simbólicos, dependências e pastas de build; não executa repositório durante discovery.
- `sandbox prepare` gera workspace local; `sandbox run` exige `--allow-execution` para o modo React/Vite.
- URL remota de audit requer opt-in.
- A confiança de pesquisa e a paridade do ambiente devem ser documentadas.
- Visual Spec **nunca** alimenta geração de código nem substitui a implementação real.

## Evolução de adaptadores

React/Vite e HTML são implementações reais. Para Angular, Next Server Components e outros frameworks, integrar runners da stack real via contratos descritos em `adapters/README.md`; não fingir paridade com JSX estático.
