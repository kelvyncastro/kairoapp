import { NotesPage, NotesFolder, Block } from '@/types/notes';

const PAGES_KEY = 'kairo_notes_pages';
const FOLDERS_KEY = 'kairo_notes_folders';

export function loadPages(): NotesPage[] {
  try {
    const data = localStorage.getItem(PAGES_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return getDefaultPages();
}

export function savePages(pages: NotesPage[]) {
  localStorage.setItem(PAGES_KEY, JSON.stringify(pages));
}

export function loadFolders(): NotesFolder[] {
  try {
    const data = localStorage.getItem(FOLDERS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return getDefaultFolders();
}

export function saveFolders(folders: NotesFolder[]) {
  localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
}

function uid(): string {
  return crypto.randomUUID();
}

function getDefaultFolders(): NotesFolder[] {
  return [
    { id: 'folder-1', name: 'Projetos', isExpanded: true, order: 0, createdAt: new Date().toISOString() },
    { id: 'folder-2', name: 'Anotacoes', isExpanded: true, order: 1, createdAt: new Date().toISOString() },
  ];
}

function getDefaultPages(): NotesPage[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'page-1',
      title: 'Rotina 2025',
      icon: '📋',
      folderId: 'folder-1',
      isFavorite: true,
      isArchived: false,
      status: 'published',
      tags: ['produtividade', 'rotina'],
      blocks: [
        { id: uid(), type: 'h1', content: 'Minha Rotina Diaria' },
        { id: uid(), type: 'text', content: 'Organizar o dia para maximizar a produtividade.' },
        { id: uid(), type: 'h2', content: 'Manha' },
        { id: uid(), type: 'checklist', content: 'Acordar as 06:00', meta: { checked: true } },
        { id: uid(), type: 'checklist', content: 'Beber agua (400ml)', meta: { checked: true } },
        { id: uid(), type: 'checklist', content: 'Meditacao 10 min', meta: { checked: false } },
        { id: uid(), type: 'h2', content: 'Tarde' },
        { id: uid(), type: 'bullet-list', content: 'Deep work (2h)' },
        { id: uid(), type: 'bullet-list', content: 'Reunioes / calls' },
        { id: uid(), type: 'divider', content: '' },
        { id: uid(), type: 'callout', content: 'Lembre-se: consistencia > intensidade!' },
      ],
      comments: [],
      activityLog: [{ id: uid(), action: 'criou', details: 'Pagina criada', timestamp: now }],
      versions: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'page-2',
      title: 'Metas 2026',
      icon: '🎯',
      folderId: 'folder-1',
      isFavorite: false,
      isArchived: false,
      status: 'draft',
      tags: ['metas', 'planejamento'],
      blocks: [
        { id: uid(), type: 'h1', content: 'Metas para 2026' },
        { id: uid(), type: 'text', content: 'Definir os principais objetivos do ano.' },
        { id: uid(), type: 'numbered-list', content: 'Ler 24 livros' },
        { id: uid(), type: 'numbered-list', content: 'Treinar 5x por semana' },
        { id: uid(), type: 'numbered-list', content: 'Economizar 20% da renda' },
        { id: uid(), type: 'quote', content: 'O sucesso e a soma de pequenos esforcos repetidos dia apos dia.' },
      ],
      comments: [],
      activityLog: [{ id: uid(), action: 'criou', details: 'Pagina criada', timestamp: now }],
      versions: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'page-3',
      title: 'Ideias de Projeto',
      icon: '💡',
      folderId: 'folder-2',
      isFavorite: true,
      isArchived: false,
      status: 'draft',
      tags: ['ideias'],
      blocks: [
        { id: uid(), type: 'h1', content: 'Banco de Ideias' },
        { id: uid(), type: 'text', content: 'Todas as ideias vao aqui, sem filtro.' },
        { id: uid(), type: 'bullet-list', content: 'App de habitos gamificado' },
        { id: uid(), type: 'bullet-list', content: 'Comunidade de produtividade' },
        { id: uid(), type: 'bullet-list', content: 'Criar painel de administracao' },
        { id: uid(), type: 'code', content: 'console.log("Hello World!")', meta: { language: 'javascript' } },
      ],
      comments: [
        { id: uid(), content: 'Priorizar a ideia do app de habitos!', author: 'Voce', parentId: null, isResolved: false, createdAt: now, updatedAt: now },
      ],
      activityLog: [
        { id: uid(), action: 'criou', details: 'Pagina criada', timestamp: now },
        { id: uid(), action: 'comentou', details: 'Adicionou um comentario', timestamp: now },
      ],
      versions: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function exportPageToMarkdown(page: NotesPage): string {
  let md = `# ${page.title}\n\n`;
  for (const block of page.blocks) {
    switch (block.type) {
      case 'h1': md += `# ${block.content}\n\n`; break;
      case 'h2': md += `## ${block.content}\n\n`; break;
      case 'h3': md += `### ${block.content}\n\n`; break;
      case 'text': md += `${block.content}\n\n`; break;
      case 'bullet-list': md += `- ${block.content}\n`; break;
      case 'numbered-list': md += `1. ${block.content}\n`; break;
      case 'checklist': md += `- [${block.meta?.checked ? 'x' : ' '}] ${block.content}\n`; break;
      case 'quote': md += `> ${block.content}\n\n`; break;
      case 'divider': md += `---\n\n`; break;
      case 'callout': md += `> 💡 ${block.content}\n\n`; break;
      case 'code': md += `\`\`\`${block.meta?.language || ''}\n${block.content}\n\`\`\`\n\n`; break;
      default: md += `${block.content}\n\n`;
    }
  }
  return md;
}

export function importMarkdownToBlocks(md: string): Block[] {
  const lines = md.split('\n');
  const blocks: Block[] = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) { i++; continue; }
    if (line.startsWith('### ')) {
      blocks.push({ id: uid(), type: 'h3', content: line.slice(4) });
    } else if (line.startsWith('## ')) {
      blocks.push({ id: uid(), type: 'h2', content: line.slice(3) });
    } else if (line.startsWith('# ')) {
      blocks.push({ id: uid(), type: 'h1', content: line.slice(2) });
    } else if (line.startsWith('- [x] ') || line.startsWith('- [ ] ')) {
      blocks.push({ id: uid(), type: 'checklist', content: line.slice(6), meta: { checked: line.includes('[x]') } });
    } else if (line.startsWith('- ')) {
      blocks.push({ id: uid(), type: 'bullet-list', content: line.slice(2) });
    } else if (/^\d+\.\s/.test(line)) {
      blocks.push({ id: uid(), type: 'numbered-list', content: line.replace(/^\d+\.\s/, '') });
    } else if (line.startsWith('> ')) {
      blocks.push({ id: uid(), type: 'quote', content: line.slice(2) });
    } else if (line.startsWith('---')) {
      blocks.push({ id: uid(), type: 'divider', content: '' });
    } else if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += (code ? '\n' : '') + lines[i];
        i++;
      }
      blocks.push({ id: uid(), type: 'code', content: code, meta: { language: lang || 'text' } });
    } else {
      blocks.push({ id: uid(), type: 'text', content: line });
    }
    i++;
  }
  return blocks;
}
