import { useState, useCallback, useRef, useEffect } from 'react';
import { NotesPage, NotesFolder, PageVersion, Comment as NComment } from '@/types/notes';
import {
  loadPagesFromDb, loadFoldersFromDb,
  upsertPage, upsertFolder,
  deletePageFromDb, deleteFolderFromDb,
  hasLocalData, migrateLocalToDb,
} from '@/lib/notes-storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

function uid(): string { return crypto.randomUUID(); }

export function useNotesStore() {
  const { user } = useAuth();
  const [pages, setPages] = useState<NotesPage[]>([]);
  const [folders, setFolders] = useState<NotesFolder[]>([]);
  const [sharedPages, setSharedPages] = useState<(NotesPage & { permission: 'view' | 'edit'; ownerName?: string })[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'idle'>('idle');
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  const savingRef = useRef(false);

  // Load data from DB on mount
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    const init = async () => {
      try {
        // Check if local data needs migration
        if (hasLocalData()) {
          await migrateLocalToDb(user.id);
          toast.success('Notas migradas para a nuvem!');
        }

        const [dbFolders, dbPages] = await Promise.all([
          loadFoldersFromDb(user.id),
          loadPagesFromDb(user.id),
        ]);

        // Load shared notes
        const { data: sharesData } = await supabase
          .from('notes_shares')
          .select('page_id, permission, owner_id')
          .eq('shared_with_id', user.id);

        let sharedNotes: (NotesPage & { permission: 'view' | 'edit'; ownerName?: string })[] = [];
        if (sharesData && sharesData.length > 0) {
          const pageIds = sharesData.map(s => s.page_id);
          const { data: sharedPagesData } = await supabase
            .from('notes_pages')
            .select('*')
            .in('id', pageIds);

          // Get owner names
          const ownerIds = [...new Set(sharesData.map(s => s.owner_id))];
          const { data: ownerProfiles } = await supabase
            .from('user_profiles')
            .select('user_id, first_name')
            .in('user_id', ownerIds);

          const ownerMap = new Map((ownerProfiles || []).map(p => [p.user_id, p.first_name]));
          const shareMap = new Map(sharesData.map(s => [s.page_id, s]));

          sharedNotes = (sharedPagesData || []).map(p => {
            const share = shareMap.get(p.id);
            return {
              id: p.id,
              title: p.title,
              icon: p.icon,
              folderId: p.folder_id,
              isFavorite: p.is_favorite,
              isArchived: p.is_archived,
              status: p.status as 'draft' | 'published',
              tags: p.tags || [],
              content: p.content,
              comments: (p.comments as any) || [],
              activityLog: (p.activity_log as any) || [],
              versions: (p.versions as any) || [],
              createdAt: p.created_at,
              updatedAt: p.updated_at,
              permission: (share?.permission || 'view') as 'view' | 'edit',
              ownerName: ownerMap.get(share?.owner_id || '') || undefined,
            };
          });
        }

        if (!cancelled) {
          setFolders(dbFolders);
          setPages(dbPages);
          setSharedPages(sharedNotes);
          setLoading(false);
        }
      } catch (e) {
        console.error('Error loading notes:', e);
        if (!cancelled) setLoading(false);
      }
    };

    init();
    return () => { cancelled = true; };
  }, [user]);

  const selectedPage = pages.find(p => p.id === selectedPageId) || null;

  // Save a page to DB (debounced for content updates)
  const savePageToDb = useCallback(async (page: NotesPage) => {
    if (!user) return;
    try {
      await upsertPage(user.id, page);
    } catch (e) {
      console.error('Error saving page:', e);
    }
  }, [user]);

  const saveFolderToDb = useCallback(async (folder: NotesFolder) => {
    if (!user) return;
    try {
      await upsertFolder(user.id, folder);
    } catch (e) {
      console.error('Error saving folder:', e);
    }
  }, [user]);

  const debouncedSave = useCallback((updater: (prev: NotesPage[]) => NotesPage[]) => {
    setSaveStatus('saving');
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPages(prev => {
        const next = updater(prev);
        // Find changed page and save
        const changedPage = next.find((p, i) => prev[i] && p !== prev[i]) || next[0];
        if (changedPage) savePageToDb(changedPage);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
        return next;
      });
    }, 400);
  }, [savePageToDb]);

  const addActivity = (pageId: string, action: string, details: string) => {
    setPages(prev => prev.map(p => p.id === pageId ? {
      ...p,
      activityLog: [...p.activityLog, { id: uid(), action, details, timestamp: new Date().toISOString() }],
    } : p));
  };

  const createPage = useCallback(async (folderId?: string | null) => {
    if (!user) return null;
    const newPage: NotesPage = {
      id: uid(), title: 'Sem titulo', icon: '📄',
      folderId: folderId || null, isFavorite: false, isArchived: false,
      status: 'draft', tags: [],
      content: '<p></p>',
      comments: [], activityLog: [{ id: uid(), action: 'criou', details: 'Pagina criada', timestamp: new Date().toISOString() }],
      versions: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    setPages(prev => [newPage, ...prev]);
    setSelectedPageId(newPage.id);
    await savePageToDb(newPage);
    toast.success('Nota criada!');
    return newPage;
  }, [user, savePageToDb]);

  const deletePage = useCallback(async (pageId: string) => {
    setPages(prev => prev.filter(p => p.id !== pageId));
    if (selectedPageId === pageId) setSelectedPageId(null);
    await deletePageFromDb(pageId);
    toast.success('Nota excluida!');
  }, [selectedPageId]);

  const duplicatePage = useCallback(async (pageId: string) => {
    if (!user) return;
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
    await savePageToDb(dup);
    toast.success('Nota duplicada!');
  }, [pages, user, savePageToDb]);

  const updateAndSavePage = useCallback((pageId: string, updater: (p: NotesPage) => NotesPage) => {
    setPages(prev => {
      const next = prev.map(p => p.id === pageId ? updater(p) : p);
      const updated = next.find(p => p.id === pageId);
      if (updated) savePageToDb(updated);
      return next;
    });
  }, [savePageToDb]);

  const archivePage = useCallback((pageId: string) => {
    updateAndSavePage(pageId, p => ({ ...p, isArchived: !p.isArchived, updatedAt: new Date().toISOString() }));
    if (selectedPageId === pageId) setSelectedPageId(null);
    toast.success('Nota arquivada!');
  }, [selectedPageId, updateAndSavePage]);

  const toggleFavorite = useCallback((pageId: string) => {
    updateAndSavePage(pageId, p => ({ ...p, isFavorite: !p.isFavorite, updatedAt: new Date().toISOString() }));
  }, [updateAndSavePage]);

  const updatePageTitle = useCallback((pageId: string, title: string) => {
    updateAndSavePage(pageId, p => ({ ...p, title, updatedAt: new Date().toISOString() }));
  }, [updateAndSavePage]);

  const updatePageIcon = useCallback((pageId: string, icon: string) => {
    updateAndSavePage(pageId, p => ({ ...p, icon, updatedAt: new Date().toISOString() }));
  }, [updateAndSavePage]);

  const updatePageFolder = useCallback((pageId: string, folderId: string | null) => {
    updateAndSavePage(pageId, p => ({ ...p, folderId, updatedAt: new Date().toISOString() }));
  }, [updateAndSavePage]);

  const updatePageStatus = useCallback((pageId: string, status: 'draft' | 'published') => {
    updateAndSavePage(pageId, p => ({ ...p, status, updatedAt: new Date().toISOString() }));
    addActivity(pageId, 'alterou status', `Status alterado para ${status}`);
  }, [updateAndSavePage]);

  const updatePageTags = useCallback((pageId: string, tags: string[]) => {
    updateAndSavePage(pageId, p => ({ ...p, tags, updatedAt: new Date().toISOString() }));
  }, [updateAndSavePage]);

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
    updateAndSavePage(pageId, p => ({ ...p, versions: [...p.versions, version] }));
    addActivity(pageId, 'salvou versao', 'Versao salva');
    toast.success('Versao salva!');
  }, [pages, updateAndSavePage]);

  const restoreVersion = useCallback((pageId: string, versionId: string) => {
    updateAndSavePage(pageId, p => {
      const version = p.versions.find(v => v.id === versionId);
      if (!version) return p;
      return { ...p, content: version.content, updatedAt: new Date().toISOString() };
    });
    addActivity(pageId, 'restaurou versao', 'Versao restaurada');
    toast.success('Versao restaurada!');
  }, [updateAndSavePage]);

  const addComment = useCallback((pageId: string, content: string, parentId: string | null = null) => {
    const comment: NComment = {
      id: uid(), content, author: 'Voce', parentId,
      isResolved: false,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    updateAndSavePage(pageId, p => ({ ...p, comments: [...p.comments, comment] }));
    addActivity(pageId, 'comentou', 'Adicionou um comentario');
  }, [updateAndSavePage]);

  const deleteComment = useCallback((pageId: string, commentId: string) => {
    updateAndSavePage(pageId, p => ({ ...p, comments: p.comments.filter(c => c.id !== commentId && c.parentId !== commentId) }));
  }, [updateAndSavePage]);

  const resolveComment = useCallback((pageId: string, commentId: string) => {
    updateAndSavePage(pageId, p => ({
      ...p, comments: p.comments.map(c => c.id === commentId ? { ...c, isResolved: !c.isResolved } : c)
    }));
  }, [updateAndSavePage]);

  const createFolder = useCallback(async (name: string) => {
    if (!user) return null;
    const folder: NotesFolder = { id: uid(), name, isExpanded: true, order: folders.length, createdAt: new Date().toISOString() };
    setFolders(prev => [...prev, folder]);
    await saveFolderToDb(folder);
    toast.success('Pasta criada!');
    return folder;
  }, [folders, user, saveFolderToDb]);

  const deleteFolder = useCallback(async (folderId: string) => {
    setFolders(prev => prev.filter(f => f.id !== folderId));
    setPages(prev => prev.map(p => p.folderId === folderId ? { ...p, folderId: null } : p));
    await deleteFolderFromDb(folderId);
    toast.success('Pasta excluida!');
  }, []);

  const renameFolder = useCallback((folderId: string, name: string) => {
    setFolders(prev => {
      const next = prev.map(f => f.id === folderId ? { ...f, name } : f);
      const updated = next.find(f => f.id === folderId);
      if (updated) saveFolderToDb(updated);
      return next;
    });
  }, [saveFolderToDb]);

  const toggleFolder = useCallback((folderId: string) => {
    setFolders(prev => prev.map(f => f.id === folderId ? { ...f, isExpanded: !f.isExpanded } : f));
  }, []);

  const filteredPages = pages.filter(p => {
    if (p.isArchived) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return p.title.toLowerCase().includes(q) || (p.content || '').toLowerCase().includes(q);
  });

  return {
    pages, folders, selectedPageId, selectedPage, searchQuery, saveStatus, loading,
    filteredPages,
    setSelectedPageId, setSearchQuery,
    createPage, deletePage, duplicatePage, archivePage,
    toggleFavorite, updatePageTitle, updatePageIcon, updatePageFolder, updatePageStatus,
    updatePageTags, updateContent,
    saveVersion, restoreVersion,
    addComment, deleteComment, resolveComment,
    createFolder, deleteFolder, renameFolder, toggleFolder,
  };
}
