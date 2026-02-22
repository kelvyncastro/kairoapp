import { NotesPage, NotesFolder } from '@/types/notes';
import { supabase } from '@/integrations/supabase/client';

// Legacy localStorage keys for migration
const PAGES_KEY = 'kairo_notes_pages_v2';
const FOLDERS_KEY = 'kairo_notes_folders';
const MIGRATED_KEY = 'kairo_notes_migrated_to_db';

export function stripHtml(html: string): string {
  const div = document.createElement('div');
  div.innerHTML = html;
  return div.textContent || div.innerText || '';
}

// Check if there's local data that needs migration
export function hasLocalData(): boolean {
  if (localStorage.getItem(MIGRATED_KEY)) return false;
  const pages = localStorage.getItem(PAGES_KEY) || localStorage.getItem('kairo_notes_pages');
  const folders = localStorage.getItem(FOLDERS_KEY);
  return !!(pages || folders);
}

// Get local data for migration
export function getLocalPages(): NotesPage[] {
  try {
    const data = localStorage.getItem(PAGES_KEY);
    if (data) return JSON.parse(data);
    const oldData = localStorage.getItem('kairo_notes_pages');
    if (oldData) return JSON.parse(oldData);
  } catch {}
  return [];
}

export function getLocalFolders(): NotesFolder[] {
  try {
    const data = localStorage.getItem(FOLDERS_KEY);
    if (data) return JSON.parse(data);
  } catch {}
  return [];
}

export function markAsMigrated() {
  localStorage.setItem(MIGRATED_KEY, 'true');
}

// --- Supabase operations ---

export async function loadFoldersFromDb(userId: string): Promise<NotesFolder[]> {
  const { data, error } = await supabase
    .from('notes_folders')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data || []).map(f => ({
    id: f.id,
    name: f.name,
    isExpanded: f.is_expanded,
    order: f.sort_order,
    createdAt: f.created_at,
  }));
}

export async function loadPagesFromDb(userId: string): Promise<NotesPage[]> {
  const { data, error } = await supabase
    .from('notes_pages')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return (data || []).map(p => ({
    id: p.id,
    title: p.title,
    icon: p.icon,
    folderId: p.folder_id,
    parentId: (p as any).parent_id || null,
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
  }));
}

export async function upsertFolder(userId: string, folder: NotesFolder): Promise<string> {
  const { data, error } = await supabase
    .from('notes_folders')
    .upsert({
      id: folder.id,
      user_id: userId,
      name: folder.name,
      is_expanded: folder.isExpanded,
      sort_order: folder.order,
    }, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function deleteFolderFromDb(folderId: string) {
  const { error } = await supabase.from('notes_folders').delete().eq('id', folderId);
  if (error) throw error;
}

export async function upsertPage(userId: string, page: NotesPage): Promise<string> {
  const { data, error } = await supabase
    .from('notes_pages')
    .upsert({
      id: page.id,
      user_id: userId,
      title: page.title,
      icon: page.icon,
      folder_id: page.folderId,
      parent_id: page.parentId,
      is_favorite: page.isFavorite,
      is_archived: page.isArchived,
      status: page.status,
      tags: page.tags,
      content: page.content,
      comments: page.comments as any,
      activity_log: page.activityLog as any,
      versions: page.versions as any,
    } as any, { onConflict: 'id' })
    .select('id')
    .single();

  if (error) throw error;
  return data.id;
}

export async function deletePageFromDb(pageId: string) {
  const { error } = await supabase.from('notes_pages').delete().eq('id', pageId);
  if (error) throw error;
}

export async function migrateLocalToDb(userId: string) {
  const localFolders = getLocalFolders();
  const localPages = getLocalPages();

  // Migrate folders first (pages reference them)
  const folderIdMap = new Map<string, string>();
  for (const folder of localFolders) {
    const { data } = await supabase
      .from('notes_folders')
      .insert({
        user_id: userId,
        name: folder.name,
        is_expanded: folder.isExpanded,
        sort_order: folder.order,
      })
      .select('id')
      .single();
    if (data) folderIdMap.set(folder.id, data.id);
  }

  // Migrate pages with updated folder references
  for (const page of localPages) {
    const newFolderId = page.folderId ? folderIdMap.get(page.folderId) || null : null;
    await supabase
      .from('notes_pages')
      .insert({
        user_id: userId,
        title: page.title,
        icon: page.icon,
        folder_id: newFolderId,
        is_favorite: page.isFavorite,
        is_archived: page.isArchived,
        status: page.status,
        tags: page.tags || [],
        content: page.content || '<p></p>',
        comments: (page.comments || []) as any,
        activity_log: (page.activityLog || []) as any,
        versions: (page.versions || []) as any,
      });
  }

  markAsMigrated();
}
