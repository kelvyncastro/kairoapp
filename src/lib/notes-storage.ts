import { NotesPage, NotesFolder, Block } from '@/types/notes';

const PAGES_KEY = 'kairo_notes_pages_v2';
const FOLDERS_KEY = 'kairo_notes_folders';

function blocksToHtml(blocks: Block[]): string {
  let html = '';
  for (const block of blocks) {
    switch (block.type) {
      case 'h1': html += `<h1>${block.content}</h1>`; break;
      case 'h2': html += `<h2>${block.content}</h2>`; break;
      case 'h3': html += `<h3>${block.content}</h3>`; break;
      case 'text': html += `<p>${block.content || ''}</p>`; break;
      case 'bullet-list': html += `<ul><li><p>${block.content}</p></li></ul>`; break;
      case 'numbered-list': html += `<ol><li><p>${block.content}</p></li></ol>`; break;
      case 'checklist':
        html += `<ul data-type="taskList"><li data-type="taskItem" data-checked="${block.meta?.checked ? 'true' : 'false'}"><label><input type="checkbox" ${block.meta?.checked ? 'checked' : ''}><span></span></label><div><p>${block.content}</p></div></li></ul>`;
        break;
      case 'quote': html += `<blockquote><p>${block.content}</p></blockquote>`; break;
      case 'divider': html += `<hr>`; break;
      case 'callout': html += `<blockquote><p>💡 ${block.content}</p></blockquote>`; break;
      case 'code': html += `<pre><code>${block.content}</code></pre>`; break;
      default: html += `<p>${block.content}</p>`;
    }
  }
  return html;
}

export function loadPages(): NotesPage[] {
  try {
    const data = localStorage.getItem(PAGES_KEY);
    if (data) {
      const pages = JSON.parse(data) as NotesPage[];
      // Migrate any pages that have blocks but no content
      return pages.map(p => {
        if (!p.content && p.blocks && p.blocks.length > 0) {
          return { ...p, content: blocksToHtml(p.blocks) };
        }
        return p;
      });
    }
    // Try loading from old key and migrate
    const oldData = localStorage.getItem('kairo_notes_pages');
    if (oldData) {
      const oldPages = JSON.parse(oldData) as any[];
      const migrated = oldPages.map(p => ({
        ...p,
        content: p.content || blocksToHtml(p.blocks || []),
        versions: (p.versions || []).map((v: any) => ({
          ...v,
          content: v.content || blocksToHtml(v.blocks || []),
        })),
      }));
      savePages(migrated);
      return migrated;
    }
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
      content: '<h1>Minha Rotina Diaria</h1><p>Organizar o dia para maximizar a produtividade.</p><h2>Manha</h2><ul data-type="taskList"><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Acordar as 06:00</p></div></li><li data-type="taskItem" data-checked="true"><label><input type="checkbox" checked><span></span></label><div><p>Beber agua (400ml)</p></div></li><li data-type="taskItem" data-checked="false"><label><input type="checkbox"><span></span></label><div><p>Meditacao 10 min</p></div></li></ul><h2>Tarde</h2><ul><li><p>Deep work (2h)</p></li><li><p>Reunioes / calls</p></li></ul><hr><blockquote><p>Lembre-se: consistencia > intensidade!</p></blockquote>',
      comments: [],
      activityLog: [{ id: crypto.randomUUID(), action: 'criou', details: 'Pagina criada', timestamp: now }],
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
      content: '<h1>Metas para 2026</h1><p>Definir os principais objetivos do ano.</p><ol><li><p>Ler 24 livros</p></li><li><p>Treinar 5x por semana</p></li><li><p>Economizar 20% da renda</p></li></ol><blockquote><p>O sucesso e a soma de pequenos esforcos repetidos dia apos dia.</p></blockquote>',
      comments: [],
      activityLog: [{ id: crypto.randomUUID(), action: 'criou', details: 'Pagina criada', timestamp: now }],
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
      content: '<h1>Banco de Ideias</h1><p>Todas as ideias vao aqui, sem filtro.</p><ul><li><p>App de habitos gamificado</p></li><li><p>Comunidade de produtividade</p></li><li><p>Criar painel de administracao</p></li></ul><pre><code>console.log("Hello World!")</code></pre>',
      comments: [],
      activityLog: [{ id: crypto.randomUUID(), action: 'criou', details: 'Pagina criada', timestamp: now }],
      versions: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}
