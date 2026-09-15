# Atualizar o ACS Digital, marcar nova versão e publicar

## Contexto
O ZIP enviado traz uma versão **mais recente** do app em arquivo único (`ACS-Digital.html`, de 14/09) do que a que o site serve hoje. Além disso, o app já tenta registrar um "assistente de atualização" (`sw.js`), mas esse arquivo **não existe** no projeto — então hoje nada avisa quem já abriu o app que saiu versão nova.

## O que será feito

1. **Trocar o app pela versão nova**
   Substituir `public/acs-digital.html` pelo `ACS-Digital.html` do ZIP.

2. **Marcar a versão**
   Adicionar um número de versão visível ao app (ex.: `2026.09.15`) e um pequeno arquivo `public/version.json` com essa mesma versão, que o app consulta.

3. **Avisar quem já usava a versão anterior**
   - Criar `public/sw.js` com nome de cache versionado: busca sempre a versão mais nova na rede e usa o cache só quando está sem internet (mantendo o funcionamento offline).
   - Quando uma versão nova for detectada, mostrar uma faixa discreta no app: "Nova versão disponível — toque para atualizar". Ao tocar, o app recarrega já na versão nova.
   - Quem abrir pela primeira vez recebe direto a versão nova.

4. **Publicar**
   Publicar o projeto para que a versão nova e o aviso de atualização fiquem no ar em https://cf2acs.lovable.app.

## Observações
- Os dados dos moradores ficam guardados no aparelho e **não são apagados** pela atualização.
- Navegadores que já cacheavam a versão antiga podem levar alguns segundos na primeira abertura para detectar a nova e mostrar o aviso.
- Para o app Android, a atualização continua sendo pelo caminho descrito no `COMO-INSTALAR.md` do ZIP (trocar o HTML e rodar `pnpm run build` + `npx cap sync android`).
