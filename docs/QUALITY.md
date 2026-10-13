# Quality Gates e benchmark

## Rubrica de revisão humana (100 pontos)

| Dimensão | Peso | Exemplo de evidência |
|---|---:|---|
| Adequação ao público e à tarefa | 20 | Entrevista ou hipótese declarada, jornada e teste de tarefa |
| Usabilidade e arquitetura da informação | 15 | Teste de navegação, estados e prevenção de erro |
| Qualidade visual e direção de arte | 15 | Screenshot, hierarquia, consistência e composição |
| Acessibilidade | 15 | Axe se disponível, teclado, leitor de telas, contraste e revisão manual |
| Fidelidade ao design system | 10 | Tokens, APIs e uso de componentes existentes |
| Responsividade e estado | 10 | Capturas multi-viewport, zoom, empty/error/loading |
| Performance | 5 | Mídia, fontes, Web Vitals reais quando disponíveis |
| Manutenibilidade e integração | 10 | Diff pequeno, testes, ausência de duplicação |

Uma nota total não substitui gates obrigatórios. Por exemplo, uma falha crítica de teclado ou vazamento de informação bloqueia entrega independentemente de nota estética.

## Critérios de bloqueio

- Alteração introduz regressão funcional crítica.
- UI impede conclusão da tarefa em viewport suportado.
- Componente essencial não pode ser operado por teclado onde exigível.
- Secrets, dados privados ou assets sem licença autorizada entram no pacote.
- Mudança visual de grande alcance não é aprovada pelo usuário.
- Testes ausentes são relatados como "passaram".
- Preview isolado é descrito como equivalente à produção sem validação integrada.

## Benchmark mínimo

1. Corrigir modal mobile com CSS herdado conflitante.
2. Projetar tabela densa para analista experiente sem perder acessibilidade.
3. Criar formulário guiado para usuário iniciante, com validações e estados.
4. Criar uma landing page de identidade distintiva com assets originais e budget de mídia.
5. Alterar componente global sem quebrar outros consumidores.
6. Reproduzir estados loading/empty/error em sandbox independente.
7. Explicar uma escolha iconográfica e oferecer movimento reduzido.

Fixar versões do projeto, ambiente, fonte, browser, viewports e fixtures. Usar julgadores humanos ou avaliações cegas independentes. Registrar failures, não apenas média estética. `bash {PLUGIN_ROOT}/scripts/audit.sh` gera evidências parciais; não faz pontuação visual automática.
