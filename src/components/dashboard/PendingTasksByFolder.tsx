import { useState } from "react";
import { Link } from "react-router-dom";
import { Folder, ArrowRight, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FolderGroup {
  folderId: string | null;
  folderName: string;
  folderColor: string | null;
  tasks: Array<{ id: string; title: string; priority: number }>;
}

interface PendingTasksByFolderProps {
  pendingTasksByFolder: FolderGroup[];
  embedded?: boolean;
}

export function PendingTasksByFolder({ pendingTasksByFolder, embedded = false }: PendingTasksByFolderProps) {
  const totalPending = pendingTasksByFolder.reduce((sum, f) => sum + f.tasks.length, 0);
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(new Set());

  const toggleFolder = (folderId: string) => {
    setCollapsedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const content = (
    <>
      {pendingTasksByFolder.length > 0 ? (
        <div className={cn(embedded ? "flex-1 overflow-y-auto pr-1" : "h-[240px] overflow-y-auto pr-1")}>
          <div className="space-y-2">
            {pendingTasksByFolder.map((folder) => {
              const key = folder.folderId || "no-folder";
              const isCollapsed = collapsedFolders.has(key);
              const folderColor = folder.folderColor || "hsl(var(--muted-foreground))";

              return (
                <div 
                  key={key}
                  className="rounded-lg overflow-hidden"
                  style={{ backgroundColor: `${folderColor}15` }}
                >
                  {/* Folder Header */}
                  <button
                    onClick={() => toggleFolder(key)}
                    className="w-full flex items-center gap-2 py-2 px-3 hover:bg-secondary/30 transition-colors"
                  >
                    {isCollapsed ? (
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                    )}
                    <Folder
                      className="h-4 w-4 shrink-0"
                      style={{ color: folderColor }}
                    />
                    <span
                      className="text-sm font-medium truncate flex-1 text-left"
                      style={{ color: folderColor }}
                    >
                      {folder.folderName}
                    </span>
                    <span 
                      className="text-xs font-medium shrink-0 px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${folderColor}25`, color: folderColor }}
                    >
                      {folder.tasks.length}
                    </span>
                  </button>

                  {/* Tasks List */}
                  {!isCollapsed && (
                    <ul className="px-3 pb-2 space-y-1">
                      {folder.tasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md bg-background/50"
                        >
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0",
                              task.priority === 3
                                ? "bg-destructive"
                                : task.priority === 2
                                ? "bg-warning"
                                : task.priority === 1
                                ? "bg-primary"
                                : "bg-muted-foreground"
                            )}
                          />
                          <span className="truncate">{task.title}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className={cn("flex flex-col items-center justify-center", embedded ? "flex-1" : "py-6")}>
          <p className="text-sm text-muted-foreground mb-3">Tudo feito! 🎉</p>
          <Button asChild size="sm" variant="outline">
            <Link to="/rotina">Criar tarefa</Link>
          </Button>
        </div>
      )}
    </>
  );

  if (embedded) {
    return (
      <>
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-muted-foreground">{totalPending} pendentes</span>
        </div>
        {content}
      </>
    );
  }

  return (
    <div className="cave-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold uppercase tracking-wider text-sm">Tarefas do Dia</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{totalPending} pendentes</span>
          <Link to="/rotina" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
      {content}
    </div>
  );
}
