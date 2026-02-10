export type BlockType =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet-list'
  | 'numbered-list'
  | 'checklist'
  | 'quote'
  | 'divider'
  | 'callout'
  | 'code'
  | 'image'
  | 'table';

export interface BlockMeta {
  checked?: boolean;
  language?: string;
  url?: string;
  tableData?: string[][];
  indent?: number;
}

export interface Block {
  id: string;
  type: BlockType;
  content: string;
  meta?: BlockMeta;
}

export type PageStatus = 'draft' | 'published';

export interface NotesPage {
  id: string;
  title: string;
  icon: string;
  folderId: string | null;
  isFavorite: boolean;
  isArchived: boolean;
  status: PageStatus;
  tags: string[];
  blocks: Block[];
  comments: Comment[];
  activityLog: ActivityEntry[];
  versions: PageVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  content: string;
  author: string;
  parentId: string | null;
  isResolved: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityEntry {
  id: string;
  action: string;
  details: string;
  timestamp: string;
}

export interface PageVersion {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: string;
}

export interface NotesFolder {
  id: string;
  name: string;
  isExpanded: boolean;
  order: number;
  createdAt: string;
}

export interface NotesState {
  pages: NotesPage[];
  folders: NotesFolder[];
  selectedPageId: string | null;
  searchQuery: string;
}
