# Política de integração Visual Spec 1.0

Especificação informada pelo criador: **https://visualspec.dev/specification/1.0**.

**Este pacote usa Visual Spec somente para documentação e referência visual.**

Permitido:
- Referenciar documentos Visual Spec existentes ligados a um componente real.
- Registrar screenshots, propósito, estados, interações e links de código na documentação.
- Produzir documentação descritiva sobre uma tela criada, mediante consulta e validação separada da especificação.
- Usar um visualizador externo de documentos Visual Spec para visualização da documentação, sem transposição do resultado ao runtime da aplicação.

Proibido:
- Converter Visual Spec JSON para JSX, CSS, HTML, Angular templates ou arquivos de produção.
- Recriar uma implementação a partir da documentação Visual Spec como fonte de verdade.
- Marcar a UI como funcional ou testada somente por existir um documento Visual Spec.
- Tratar especificação ou renderer Visual Spec como requisito de runtime de componentes.

O script local `bash {PLUGIN_ROOT}/scripts/document.sh` apenas cria um registro com links, hash SHA-256 e status do documento; não interpreta o conteúdo como componentes nem valida o schema. A página oficial da especificação **não pôde ser inspecionada automaticamente no ambiente de construção do pacote**, portanto o Zanker não afirma produzir JSON plenamente conforme a 1.0 sem uma etapa posterior de validação independente.

Ordem de autoridade: **código real > design system do projeto > evidência de runtime > documentação Visual Spec**.
