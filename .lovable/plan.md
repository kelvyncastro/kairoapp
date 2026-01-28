

## Plano: Corrigir Visualização das Tarefas

### Problemas Identificados

1. **Empty state ocupando a tela toda** - Quando não há tarefas, aparece uma tela grande com ícone "+" e botão "Nova Tarefa". Isso precisa ser removido.

2. **Múltiplos status por pasta** - A estrutura atual agrupa tarefas por status DENTRO de cada pasta, criando vários headers de status repetidos. Deve haver apenas um input de adicionar tarefa por pasta, sem separação por status.

---

### Mudanças Técnicas

#### 1. Remover Empty State (linhas 217-232)
Remover completamente o bloco que exibe "Nenhuma tarefa" com o botão grande.

#### 2. Simplificar TaskTable
Atualmente a função `TaskTable` (linhas 327-572) agrupa tarefas por status e renderiza múltiplos headers de status. Vou reestruturar para:

- Listar tarefas diretamente SEM agrupamento por status
- Manter apenas UM input inline "Adicionar Tarefa" no final da lista de cada pasta
- Remover os headers de status expandíveis dentro da tabela

#### 3. Nova Estrutura

```text
┌─────────────────────────────────────┐
│  📁 Pasta X                   5 tarefas │
├─────────────────────────────────────┤
│  Nome | Status | Data | Prioridade    │
│  ☐ Tarefa 1  | Em progresso | Hoje |  │
│  ☐ Tarefa 2  | Não iniciada | Amanhã  │
│  + Adicionar Tarefa                   │
└─────────────────────────────────────┘
```

---

### Arquivos a Modificar

**`src/components/tasks/TaskTableView.tsx`**

1. **Remover empty state** (linhas 217-232) - deletar o bloco com "Nenhuma tarefa"

2. **Simplificar TaskTable** - Reescrever para:
   - Remover agrupamento por status (`tasksByStatus`, `expandedStatuses`)
   - Renderizar lista simples de tarefas
   - Manter header de colunas uma vez só
   - Colocar InlineAddTask apenas uma vez no final

3. **Garantir que InlineAddTask apareça mesmo com 0 tarefas** - O input ficará visível independente de quantas tarefas existam na pasta

---

### Resultado Esperado

- Input inline "Adicionar Tarefa" aparece embaixo de cada pasta, mesmo sem tarefas
- Sem separação por status dentro da lista
- Visual limpo e direto igual ClickUp

