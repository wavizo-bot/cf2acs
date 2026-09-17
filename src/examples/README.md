# Exemplos de Arquivos CSV para Importação

Estes arquivos são modelos para teste da funcionalidade de importação do ACS Digital.

## 📁 Arquivos Disponíveis

| Arquivo | Descrição | Colunas Principais |
|---------|-----------|-------------------|
| `cadastro-individual-exemplo.csv` | Dados básicos de cadastro | Nome, DN, Mãe, Endereço, CNS, Sexo |
| `questionario-auto-referido-exemplo.csv` | Condições de saúde auto-declaradas | HAS, DM, Tabagismo, Gestante, etc. |
| `cadastros-detalhados-exemplo.csv` | Informações complementares | CPF, Telefone, Raça/Etnia, Cartão Cidadão |

## 🔍 Estrutura Detalhada

### 1. Cadastro Individual (Coluna E a P)

```csv
E: Nome Completo
F: Data de Nascimento
H: Nome da Mãe
J: Endereço (nome da rua/avenida)
K: Número da casa
O: CNS (Cartão Nacional de Saúde)
P: Sexo (M/F)
```

**Exemplo:**
```
MARIA DA SILVA SANTOS,15/03/1980,JOANA DA SILVA,RUA DAS FLORES,123,705001674139859,F
```

### 2. Questionário Auto-Referido (Coluna A a AD)

```csv
A: Nome Completo
B: Data de Nascimento
D: CNS
E: CPF
F: Sexo
G: Doença Cardíaca (SIM/NÃO)
I: Doença Respiratória (SIM/NÃO)
J: Domiciliado (SIM/NÃO)
K: Acamado (SIM/NÃO)
L: Gestante (SIM/NÃO)
M: Etílico Habitual (SIM/NÃO)
N: Drogas Habitual (SIM/NÃO)
O: Tabaco Habitual (SIM/NÃO)
P: HAS - Hipertensão (SIM/NÃO)
Y: DM - Diabetes Mellitus (SIM/NÃO)
Z: Câncer (SIM/NÃO)
AB: Hanseníase (SIM/NÃO)
AD: Tuberculose (SIM/NÃO)
```

**Exemplo:**
```
JOAO PEDRO OLIVEIRA,22/07/1975,707009890577730,98765432100,M,SIM,NÃO,SIM,NÃO,NÃO,SIM,NÃO,SIM,SIM,NÃO,NÃO,NÃO,NÃO
```

### 3. Cadastros Detalhados (Coluna B a X)

```csv
B: Nome Completo
C: Data de Nascimento
E: Sexo
F: Raça
G: Etnia
H: CPF
I: CNS
J: Cadastro (Cartão Cidadão)
K: Nome da Mãe
L: Nome do Pai
V: Telefone Residencial
W: Telefone Celular
X: Telefone para Recados
```

**Exemplo:**
```
ANA PAULA FERREIRA,10/01/1990,F,BRANCA,NAO INFORMADA,11122233344,709601610721872,111222333,LUCIA FERREIRA,JOSE FERREIRA,(11) 5678-9012,(11) 91111-2222,(11) 4444-5555
```

## 🚀 Como Usar

### No Aplicativo:

1. Abra o **ACS Digital**
2. Na tela inicial, clique em **IMPORTAR**
3. Selecione os **3 arquivos CSV** (pode ser em qualquer ordem)
4. Aguarde o processamento (pode levar alguns segundos)
5. O app mostrará estatísticas:
   - Total de moradores importados
   - Quantos têm cadastro completo
   - Quantos estão com dados incompletos
   - Duplicatas encontradas (se houver)

### Para Testar:

1. **Baixe** estes arquivos de exemplo para seu computador/celular
2. **Importe** no app seguindo os passos acima
3. **Verifique** se os dados apareceram corretamente na tela MORADORES
4. **Teste** a busca por nome, endereço, CPF, CNS, etc.

## ⚠️ Notas Importantes

- ✅ **Dados fictícios**: Todos os nomes e números são inventados, não use dados reais de pacientes
- ✅ **Formato CSV**: Use vírgula (`,`) ou ponto-e-vírgula (`;`) como separador
- ✅ **Codificação**: Prefira UTF-8 para evitar problemas com acentos (ã, é, ç, etc.)
- ✅ **Colunas ignoradas**: O app só usa as colunas listadas acima, outras são descartadas
- ✅ **Endereço simplificado**: "Avenida Daniel Pellizzari, 456" vira "Daniel Pellizzari, 456"

## 🔎 Detectando Duplicados

O sistema tenta identificar pessoas duplicadas usando:

1. **CNS igual** → Mesma pessoa (identificador único nacional)
2. **CPF + Nome + Data de Nascimento iguais** → Provavelmente mesma pessoa
3. **Nome + Data de Nascimento iguais** → Possível duplicata (requer confirmação)

Se encontrar duplicados, eles aparecerão em:
**ACOMPANHAMENTO → AVISOS → Cadastros duplicados**

## 📊 Dados dos Exemplos

Os 5 moradores de exemplo incluem:

| Nome | Idade | Sexo | Condições | CNS |
|------|-------|------|-----------|-----|
| Maria da Silva Santos | 45 anos | F | HAS (Hipertensa) | 705001674139859 |
| João Pedro Oliveira | 50 anos | M | Cardiopata, Tabagista, Etílico, HAS | 707009890577730 |
| Ana Paula Ferreira | 35 anos | F | Gestante, DM (Diabética) | 709601610721872 |
| Carlos Eduardo Lima | 60 anos | M | Cardiopata, Respiratório, Tabagista, HAS, DM, Câncer, Tuberculose | 704600141041228 |
| Fernanda Costa Rocha | 37 anos | F | Sem condições registradas | 706002345678901 |

## 🛠️ Criando Seus Próprios Arquivos

Para criar novos arquivos de teste:

1. **Copie** um dos exemplos
2. **Edite** com Excel, LibreOffice Calc ou Google Sheets
3. **Salve** como CSV (UTF-8)
4. **Mantenha** o cabeçalho com letras das colunas (A,B,C...)
5. **Teste** a importação no app

## 📞 Suporte

Se tiver dúvidas sobre o formato dos arquivos:

1. Consulte o arquivo `GUIA-REFATORACAO.md` na raiz do projeto
2. Verifique a documentação oficial do SUS sobre exportação de dados
3. Entre em contato com a equipe de desenvolvimento

---

**Última atualização:** Setembro 2025  
**Versão dos exemplos:** 1.0
