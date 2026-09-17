# Guia de Refatoração e Contribuição - ACS Digital

## 1. O Que é Refatorar?

**Refatorar** significa reorganizar e melhorar o código existente **sem alterar seu comportamento externo**. É como arrumar uma casa: você move os móveis para lugares mais lógicos, organiza os armários, mas a casa continua funcionando da mesma forma.

### Por que refatorar o ACS-Digital.html?

O arquivo atual tem **~3000 linhas** em um único arquivo HTML. Isso funciona, mas traz problemas:

- ❌ Difícil de manter (qualquer mudança exige rolar muito o arquivo)
- ❌ Difícil de testar (não dá para testar partes isoladas)
- ❌ Difícil de colaborar (duas pessoas mexendo no mesmo arquivo = conflitos)
- ❌ Carregamento lento (o navegador processa tudo de uma vez)

### Benefícios da refatoração em arquivos separados:

- ✅ **CSS separado** (`src/css/style.css`): Fácil de ajustar cores, fontes, layouts
- ✅ **JS separado** (`src/js/app.js`): Lógica da aplicação isolada
- ✅ **Módulos futuros**: Poderá dividir em `db.js`, `auth.js`, `import.js`, etc.
- ✅ **Build automático**: Usando Vite, o sistema junta tudo automaticamente para produção

---

## 2. Como Adicionar Arquivos CSV de Exemplo

Os funcionários precisam ver exemplos reais dos arquivos CSV que devem importar. Siga estes passos:

### Passo 1: Prepare os arquivos CSV

Crie 3 arquivos CSV com dados fictícios (use dados falsos para não expor informações reais):

```
cadastro-individual-exemplo.csv
questionario-auto-referido-exemplo.csv
cadastros-detalhados-exemplo.csv
```

### Passo 2: Coloque no repositório

```bash
# Copie seus arquivos para a pasta correta
cp /caminho/dos/seus/arquivos/*.csv /workspace/src/examples/

# Verifique se estão lá
ls -la /workspace/src/examples/
```

### Passo 3: Atualize o README dos exemplos

Crie ou edite o arquivo `/workspace/src/examples/README.md`:

```markdown
# Exemplos de Arquivos CSV para Importação

Estes arquivos são modelos para teste da funcionalidade de importação do ACS Digital.

## Estrutura dos Arquivos

### 1. cadastro-individual-exemplo.csv
Contém colunas A-Z com:
- Coluna E: Nome completo do morador
- Coluna F: Data de nascimento
- Coluna H: Nome da mãe
- Coluna J: Endereço (nome da rua)
- Coluna K: Número da casa
- Coluna O: CNS
- Coluna P: Sexo

### 2. questionario-auto-referido-exemplo.csv
Contém informações de saúde auto-referidas:
- Coluna A: Nome completo
- Coluna B: Data de nascimento
- Coluna D: CNS
- Coluna E: CPF
- Coluna F: Sexo
- Colunas G-Y: Condições de saúde (HAS, DM, Câncer, etc.)

### 3. cadastros-detalhados-exemplo.csv
Dados complementares de cadastro:
- Coluna B: Nome completo
- Coluna C: Data de nascimento
- Coluna H: CPF
- Coluna I: CNS
- Coluna J: Cartão cidadão (cadastro)
- Colunas V-X: Telefones

## Como Usar

1. Baixe os arquivos de exemplo
2. No app, vá em IMPORTAR
3. Selecione os 3 arquivos
4. O app irá processar e mostrar estatísticas

## Notas

- Os dados são FICTÍCIOS, criados apenas para demonstração
- As colunas não utilizadas pelo app podem estar presentes mas serão ignoradas
- O formato deve ser CSV com separador vírgula (,) ou ponto-e-vírgula (;)
```

### Passo 4: Faça commit e push

```bash
cd /workspace
git add src/examples/
git commit -m "Adiciona exemplos de CSV para importação"
git push origin main
```

### Passo 5: Atualize o build

Sempre que modificar os arquivos em `src/`, regenere o `ACS-Digital.html`:

```bash
# Se tiver npm instalado
npm run build

# Ou manualmente (Linux/Mac)
cat src/header.html src/css/style.css src/body-start.html src/js/app.js src/body-end.html > ACS-Digital.html

# Ou no Windows PowerShell
Get-Content src/header.html, src/css/style.css, src/body-start.html, src/js/app.js, src/body-end.html | Set-Content ACS-Digital.html
```

---

## 3. Substituindo Imagens Base64 por Emoticons

O código atual usa imagens em base64 (códigos longos). Vamos trocar por emoticons nativos.

### Onde estão as imagens atualmente?

No arquivo `ACS-Digital.html`, linha ~378:
```javascript
const APP_ICON = 'data:image/webp;base64,UklGRgYZAABXRU...'; // ícone oficial
```

E nas linhas ~1089 e ~1144 onde é usado:
```html
<img class="logo-img" alt="ACS Digital" src="'+APP_ICON+'">
```

### Como substituir por emoticon:

#### Opção A: Usar emoji direto (mais simples)

No lugar da imagem, use um emoji de saúde:

```javascript
// Remova a constante APP_ICON (ou mantenha comentada)
// const APP_ICON = 'data:image/webp;base64,...';

// No HTML, troque:
'<div class="logo-row"><img class="logo-img" alt="ACS Digital" src="'+APP_ICON+'">' +

// Por:
'<div class="logo-row"><span style="font-size:4rem">🏥</span>' +
```

#### Opção B: Criar logo com CSS (mais bonito)

Use o `.logo-mark` que já existe no CSS (linhas 315-319):

```html
<div class="logo-row">
  <div class="logo-mark">🏥</div>
  <div class="app-name">ACS Digital</div>
  <div class="app-sub">Saúde Comunitária</div>
</div>
```

#### Emojis sugeridos para substituir imagens:

| Original | Substituto | Uso |
|----------|------------|-----|
| 🏥 | Logo principal | Tela inicial |
| 👤 | Perfil de morador | Botões e ícones |
| 🏡 | Residência | Endereços |
| 📋 | Relatórios | Visita domiciliar |
| 🔔 | Avisos | Notificações |
| 📊 | Métricas | Estatísticas |
| ⚙️ | Configurações | Ajustes |
| 🔍 | Busca | Campo de pesquisa |
| ❌ | Limpar/Cancelar | Botões de ação |
| ✅ | Confirmar/Salvar | Ações positivas |
| 📱 | WhatsApp | Contato telefônico |
| 🖨️ | Imprimir | Relatórios |
| 📅 | Agenda/Consultas | Agendamentos |
| 🧪 | Exames | Guias de exame |
| 👶 | Criança | Puericultura |
| 🤰 | Gestante | Acompanhamento |

### Vantagens de usar emoticons:

- ✅ **Sem código extenso**: Um caractere vs milhares de caracteres base64
- ✅ **Nativo do sistema**: Cada dispositivo mostra seu estilo próprio
- ✅ **Acessível**: Leitores de tela entendem emojis
- ✅ **Responsivo**: Escala bem em qualquer tamanho
- ✅ **Manutenção zero**: Não precisa gerar/converter imagens

---

## 4. Cadastros Duplicados na Importação

### Situação atual:

O app **já detecta** cadastros incompletos e mostra na tela AVISOS. Mas os funcionários querem saber se **duplicados também são detectados**.

### Como funciona a detecção hoje:

No código de importação (~linha 500-700 do app.js), o sistema:

1. Lê os 3 arquivos CSV
2. Tenta montar PERFIL DE MORADOR usando:
   - **Prioridade 1**: CNS (único identificador)
   - **Prioridade 2**: CPF + nome completo + data de nascimento
   - **Prioridade 3**: Nome completo + data de nascimento (último recurso)

### O problema de duplicados:

Se duas planilhas têm:
- `MARIA SILVA, 15/03/1980` na Planilha A
- `MARIA SILVA, 15/03/1980` na Planilha B

O app **deveria** entender que é a mesma pessoa e **unificar** os dados, não criar dois perfis.

### Solução proposta:

Adicionar lógica de **deduplicação** durante a importação:

```javascript
// Pseudocódigo para detectar duplicados
function detectarDuplicados(moradores) {
  const vistos = new Map();
  const duplicados = [];
  
  moradores.forEach(m => {
    // Chave única: nome + data de nascimento
    const chave = (m.nome + '|' + m.dataNascimento).toUpperCase().trim();
    
    if (vistos.has(chave)) {
      // Encontrou duplicado!
      duplicados.push({
        morador: m,
        duplicadoDe: vistos.get(chave)
      });
      
      // Mesclar dados (unir informações das duas fontes)
      const original = vistos.get(chave);
      mesclarDados(original, m);
    } else {
      vistos.set(chave, m);
    }
  });
  
  return duplicados;
}
```

### Onde mostrar avisos de duplicados?

Na tela **ACOMPANHAMENTO → AVISOS**, adicionar:

```
⚠️ 3 cadastros duplicados encontrados
- MARIA SILVA, 15/03/1980 (CNS: 123 e 456)
- JOÃO SANTOS, 22/07/1975 (CPF: *** e ***)
- ANA OLIVEIRA, 10/01/1990 (mesmo nome e DN)

[👤 Ver perfil] [🏡 Ver endereço] [✅ Marcar como resolvido]
```

### Próximos passos:

1. **Verificar no código atual** se já existe detecção de duplicados
2. **Se não existir**, implementar a lógica acima
3. **Testar** com arquivos CSV que tenham duplicados intencionais
4. **Documentar** no README como o app lida com duplicados

---

## Resumo das Ações

### ✅ Já feito:
- Separei CSS em `src/css/style.css`
- Separei JS em `src/js/app.js`
- Criei estrutura de pastas `src/examples/`
- Criei README explicativo

### 📋 Para você fazer:

1. **Adicionar exemplos CSV**:
   ```bash
   # Coloque seus 3 arquivos CSV em src/examples/
   # Edite src/examples/README.md com detalhes
   git add src/examples/
   git commit -m "Adiciona exemplos de CSV"
   git push origin main
   ```

2. **Substituir imagens por emoticons**:
   - Editar `src/js/app.js`
   - Trocar `APP_ICON` por emoji 🏥
   - Atualizar HTML onde usa `<img>` para `<span>` ou `<div>`

3. **Verificar duplicados na importação**:
   - Buscar no código por "duplicado" ou "duplicate"
   - Se não existir, implementar detecção
   - Adicionar aviso na tela de AVISOS

4. **Gerar novo build**:
   ```bash
   # Após todas mudanças, regenerar ACS-Digital.html
   npm run build
   # Ou script manual conforme seu sistema
   ```

---

## Dúvidas Comuns

**P: Preciso saber programar para fazer isso?**
R: Não muito! Seguir os exemplos acima é copiar/colar e adaptar.

**P: E se eu quebrar algo?**
R: Use Git! Se algo der errado: `git checkout -- nome-do-arquivo`

**P: Como testo as mudanças?**
R: Após gerar novo `ACS-Digital.html`, abra no navegador ou no celular via Capacitor.

**P: Posso voltar atrás se não gostar?**
R: Sim! Git permite voltar para versões anteriores: `git revert HEAD`

---

**Precisa de ajuda com algum passo específico? Me avise!**
