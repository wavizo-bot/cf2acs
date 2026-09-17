# ACS Digital - Código Fonte

Este diretório contém o código fonte modularizado do aplicativo ACS Digital.

## Estrutura

```
src/
├── css/
│   └── style.css      # Estilos completos da aplicação
├── js/
│   └── app.js         # Lógica principal da aplicação
└── examples/          # Exemplos de arquivos CSV para importação
    └── .gitkeep
```

## Como usar os arquivos separados

### Para desenvolvimento

Durante o desenvolvimento, você pode editar os arquivos em `src/css/style.css` e `src/js/app.js` separadamente.

### Para produção (build)

Para gerar o arquivo único `ACS-Digital.html` a partir dos arquivos separados, use o script de build:

```bash
npm run build
```

Ou manualmente, concatene os arquivos:

```bash
# No Linux/Mac
cat src/header.html src/css/style.css src/body.html src/js/app.js src/footer.html > ACS-Digital.html

# No Windows (PowerShell)
Get-Content src/header.html, src/css/style.css, src/body.html, src/js/app.js, src/footer.html | Set-Content ACS-Digital.html
```

## Adicionando exemplos de CSV

Para adicionar amostras de arquivos CSV no repositório:

1. Coloque seus arquivos CSV no diretório `src/examples/`
2. Nomeie-os de forma descritiva, por exemplo:
   - `cadastro-individual-exemplo.csv`
   - `questionario-auto-referido-exemplo.csv`
   - `cadastros-detalhados-exemplo.csv`
3. Adicione um arquivo `README.md` neste diretório explicando a estrutura de cada CSV
4. Faça commit e push para o repositório:

```bash
git add src/examples/
git commit -m "Adiciona exemplos de arquivos CSV para importação"
git push origin main
```

## Estrutura dos arquivos CSV

Os três arquivos CSV esperados são:

### 1. CADASTRO - ANÁLISE DETALHADA
Colunas utilizadas:
- E: nome completo do morador
- F: data de nascimento do morador
- H: nome da mãe do morador
- J: endereço do morador
- K: número da casa do morador
- O: CNS
- P: sexo

### 2. INFORMAÇÕES QUESTIONÁRIO AUTO REFERIDO
Colunas utilizadas:
- A: nome completo
- B: data de nascimento
- D: CNS
- E: CPF
- F: sexo
- G: Doença Cardíaca
- I: Doença Respiratória
- J: Domiciliado
- K: Acamado
- L: Gestante
- M: Etílico habitual
- N: Drogas habitual
- O: Tabaco habitual
- P: HAS
- Y: DM
- Z: Câncer
- AB: Hanseníase
- AD: Tuberculose

### 3. CADASTROS DETALHADOS
Colunas utilizadas:
- B: nome completo
- C: data de nascimento
- E: sexo
- F: raça
- G: etnia
- H: CPF
- I: CNS
- J: cadastro (cartão cidadão)
- K: nome da mãe
- L: nome do pai
- M: país de origem
- V: telefone residencial
- W: telefone celular
- X: telefone para recados

## Próximos passos para refatoração

1. **Remover imagens base64** e substituir por emoticons nativos
2. **Dividir app.js** em módulos menores:
   - `db.js` - Funções do IndexedDB
   - `auth.js` - Autenticação e senha
   - `import.js` - Importação de CSV
   - `area.js` - Gestão de área de atuação
   - `moradores.js` - Busca e listagem de moradores
   - `filtros.js` - Sistema de filtros
   - `avisos.js` - Gestão de avisos
   - `guias.js` - Guias de exame
   - `agendamentos.js` - Agendamento de consultas
   - `visitas.js` - Visita domiciliar
   - `tema.js` - Configurações de tema
3. **Configurar Vite** para bundling automático
4. **Adicionar testes** unitários
