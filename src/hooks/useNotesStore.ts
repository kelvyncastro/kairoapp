import { useState, useCallback, useRef, useEffect } from 'react';
import { NotesPage, NotesFolder, PageVersion, Comment as NComment } from '@/types/notes';
import { loadPages, savePages, loadFolders, saveFolders } from '@/lib/notes-storage';
import { toast } from 'sonner';

function uid(): string { return crypto.randomUUID(); }

const PAGE_EMOJIS = ['📋','📝','📌','💡','🎯','🚀','⭐','✨','🔥','💼','📚','🏠','💰','🎨','🎵','📊','📈','🗂️','📂','🗒️','✏️','🔑','💎','📦','📱','💻','🎮','🧠','🌟','🎉','🎁','🛠️','⚡','🌈','🍀','🎸','☕','📖','🧩','🔮'];

function randomPageEmoji(): string {
  return PAGE_EMOJIS[Math.floor(Math.random() * PAGE_EMOJIS.length)];
}

export function useNotesStore() {
  const [pages, setPages] = useState<NotesPage[]>(() => loadPages());
  const [folders, setFolders] = useState<NotesFolder[]>(() => loadFolders());
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => { savePages(pages); }, [pages]);
  useEffect(() => { saveFolders(folders); }, [folders]);

  const selectedPage = pages.find(p => p.id === selectedPageId) || null;

  const debouncedSave = useCallback((updater: (prev: NotesPage[]) => NotesPage[]) => {
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPages(updater);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 400);
  }, []);

  const addActivity = (pageId: string, action: string, details: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? {
      ...p,
      activityLog: [...p.activityLog, { id: uid(), action, details, timestamp: new Date().toISOString() }],
    } : p));
  };

  const createPage = useCallback((folderId?: string | null) => {
    const newPage: NotesPage = {
      id: uid(), title: 'Sem titulo', icon: randomPageEmoji(),
      folderId: folderId || null, isFavorite: false, isArchived: false,
      status: 'draft', tags: [],
      content: '<p></p>',
      comments: [], activityLog: [{ id: uid(), action: 'criou', details: 'Pagina criada', timestamp: new Date().toISOString() }],
      versions: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setPages(prev => [newPage, ...prev]);
    setSelectedPageId(newPage.id);
    toast.success('Nota criada!');
    return newPage;
  }, []);

  const deletePage = useCallback((pageId: string) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedPageId === pageId) setSelectedPageId(null);
    toast.success('Nota excluida!');
  }, [selectedPageId]);

  const duplicatePage = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const dup: NotesPage = {
      ...JSON.parse(JSON.stringify(page)),
      id: uid(),
      title: `${page.title} (copia)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      comments: [], activityLog: [{ id: uid(), action: 'criou', details: 'Pagina duplicada', timestamp: new Date().toISOString() }],
      versions: [],
    };
    setPages(prev => [dup, ...prev]);
    setSelectedPageId(dup.id);
    toast.success('Nota duplicada!');
  }, [pages]);

  const archivePage = useCallback((pageId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, isArchived: !p.isArchived, updatedAt: new Date().toISOString() } : p));
    if (selectedPageId === pageId) setSelectedPageId(null);
    toast.success('Nota arquivada!');
  }, [selectedPageId]);

  const toggleFavorite = useCallback((pageId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() } : p));
  }, []);

  const updatePageTitle = useCallback((pageId: string, title: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, title, updatedAt: new Date().toISOString() } : p));
  }, []);

  const updatePageIcon = useCallback((pageId: string, icon: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, icon, updatedAt: new Date().toISOString() } : p));
  }, []);

  const updatePageFolder = useCallback((pageId: string, folderId: string | null) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, folderId, updatedAt: new Date().toISOString() } : p));
  }, []);

  const updatePageStatus = useCallback((pageId: string, status: 'draft' | 'published') => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, status, updatedAt: new Date().toISOString() } : p));
    addActivity(pageId, 'alterou status', `Status alterado para ${status}`);
  }, []);

  const updatePageTags = useCallback((pageId: string, tags: string[]) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, tags, updatedAt: new Date().toISOString() } : p));
  }, []);

  const updateContent = useCallback((pageId: string, content: string) => {
    debouncedSave(prev => prev.map(p => p.id === pageId ? { ...p, content, updatedAt: new Date().toISOString() } : p));
  }, [debouncedSave]);

  const saveVersion = useCallback((pageId: string) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const version: PageVersion = {
      id: uid(), title: page.title,
      content: page.content,
      createdAt: new Date().toISOString(),
    };
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, versions: [...p.versions, version] } : p));
    addActivity(pageId, 'salvou versao', 'Versao salva');
    toast.success('Versao salva!');
  }, [pages]);

  const restoreVersion = useCallback((pageId: string, versionId: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const version = p.versions.find(v => v.id === versionId);
      if (!version) return p;
      return { ...p, content: version.content, updatedAt: new Date().toISOString() };
    }));
    addActivity(pageId, 'restaurou versao', 'Versao restaurada');
    toast.success('Versao restaurada!');
  }, []);

  const addComment = useCallback((pageId: string, content: string, parentId: string | null = null) => {
    const comment: NComment = {
      id: uid(), content, author: 'Voce', parentId,
      isResolved: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, comments: [...p.comments, comment] } : p));
    addActivity(pageId, 'comentou', 'Adicionou um comentario');
  }, []);

  const deleteComment = useCallback((pageId: string, commentId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? { ...p, comments: p.comments.filter(c => c.id !== commentId && c.parentId !== commentId) } : p));
  }, []);

  const resolveComment = useCallback((pageId: string, commentId: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? {
      ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, isResolved: !c.isResolved } : c)
    } : p));
  }, []);

  const createFolder = useCallback((name: string) => {
    const folder: NotesFolder = { id: uid(), name, isExpanded: true, order: folders.length, createdAt: new Date().toISOString() };
    setFolders(prev => [...prev, folder]);
    toast.success('Pasta criada!');
    return folder;
  }, [folders]);

  const deleteFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setPages(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
    toast.success('Pasta excluida!');
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, name } : f));
  }, []);

  const toggleFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f));
  }, []);

  const updateFolderIcon = useCallback((folderId: string, icon: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, icon } : f));
  }, []);

  const filteredPages = pages.filter(p => {
    if (p.isArchived) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q);
  });

  return {
    pages, folders, selectedPageId, selectedPage, searchQuery, saveStatus,
    filteredPages,
    setSelectedPageId, setSearchQuery,
    createPage, deletePage, duplicatePage, archivePage,
    toggleFavorite, updatePageTitle, updatePageIcon, updatePageFolder, updatePageStatus,
    updatePageTags, updateContent,
    saveVersion, restoreVersion,
    addComment, deleteComment, resolveComment,
    createFolder, deleteFolder, renameFolder, toggleFolder, updateFolderIcon,
  };
}
