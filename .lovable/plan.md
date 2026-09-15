# Atualizar o ACS Digital com o arquivo do ZIP

## Contexto
Você enviou o arquivo `acs-android-capacitor.zip`. Dentro dele está uma versão **mais recente** do app em arquivo único (`ACS-Digital.html`, de 14/09), que é mais nova do que a versão que o projeto web está servindo hoje (`public/acs-digital.html`).

## O que será feito
1. Substituir `public/acs-digital.html` pela versão nova do ZIP (`ACS-Digital.html` do ZIP — o `www/index.html` do ZIP é idêntico a ela).
2. Verificar no preview que o app abre normalmente (o site é um embrulho que mostra esse arquivo em tela cheia; nada mais muda).

## Depois
- O site publicado só mostra a versão nova quando você clicar em **Publicar** novamente.
- Se você também quiser atualizar o app Android, o procedimento está no `COMO-INSTALAR.md` do próprio ZIP (substituir `ACS-Digital.html` na pasta do projeto Android e rodar `pnpm run build` + `npx cap sync android`).
