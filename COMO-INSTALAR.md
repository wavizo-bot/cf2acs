# ACS Digital no Android Studio (Capacitor)

Projeto Capacitor pronto para o app **ACS Digital** (arquivo único, 100% offline).
Não há bundler/Vite: o `pnpm run build` apenas copia `ACS-Digital.html` para `www/index.html`.

## Requisitos
- Node 18+ e pnpm
- Android Studio recente (com SDK 35 e JDK 17 — as versões atuais já trazem)
- Um aparelho Android via USB (com "Depuração USB" ativa) ou um emulador

## Primeira vez (neste diretório)

```bash
pnpm install
pnpm approve-builds                                  # aprove os scripts das deps do Capacitor
pnpm run build                                       # copia ACS-Digital.html -> www/index.html
npx cap add android                                  # UMA ÚNICA VEZ: cria a pasta android/
npx @capacitor/assets generate --android             # gera ícones e splash com a arte ACS
npx cap sync android
npx cap open android
```

No Android Studio: aguarde o Gradle Sync terminar, selecione o aparelho/emulador e clique em **Run ▶**.

Para gerar o APK de distribuição: **Build → Build Bundle(s)/APK(s) → Build APK(s)**.

## Rotina de atualização (quando o ACS-Digital.html mudar)

Substitua o arquivo `ACS-Digital.html` na raiz deste projeto e rode:

```bash
pnpm run build
npx cap sync android
npx cap open android
```

## Observações importantes

- **appId `br.acsdigital.app`** (em `capacitor.config.json`): é permanente após o primeiro
  build — troque ANTES da primeira compilação se quiser outro identificador.
- Os dados dos moradores ficam no **IndexedDB do WebView** e persistem no aparelho.
- O app funciona totalmente offline; nenhuma permissão de internet é necessária.
- `assets/icon-only.png` e `assets/splash.png` são a arte oficial (ícone anexado pelo usuário).
- O botão VOLTAR do app é interno; o botão físico do Android navega dentro do app
  e não fecha o aplicativo quando o menu está na tela (comportamento do escudo de histórico).
