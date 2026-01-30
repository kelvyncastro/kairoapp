import { Link } from "react-router-dom";
import { Folder, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface FolderGroup {
  folderId: string | null;
  folderName: string;
  folderColor: string | null;
  tasks: Array<{ id: string; title: string; priority: number }>;
}

interface PendingTasksByFolderProps {
  pendingTasksByFolder: FolderGroup[];
}

export function PendingTasksByFolder({ pendingTasksByFolder }: PendingTasksByFolderProps) {
  const totalPending = pendingTasksByFolder.reduce((sum, f) => sum + f.tasks.length, 0);

  return (
    <div className="cave-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold uppercase tracking-wider text-sm">Rotina de Hoje</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{totalPending} pendentes</span>
          <Link to="/rotina" className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
            Ver tudo <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>

      {pendingTasksByFolder.length > 0 ? (
        <ScrollArea className="max-h-[240px]">
          <div className="space-y-3 pr-2">
            {pendingTasksByFolder.map((folder) => {
              const key = folder.folderId || "no-folder";

              return (
                <div key={key}>
                  {/* Folder Header */}
                  <div className="flex items-center gap-2 py-1 px-1">
                    <Folder
                      className="h-4 w-4 shrink-0"
                      style={{ color: folder.folderColor || "currentColor" }}
                    />
                    <span
                      className="text-sm font-medium truncate flex-1"
                      style={{ color: folder.folderColor || "inherit" }}
                    >
                      {folder.folderName}
                    </span>
                    <span className="text-xs text-muted-foreground shrink-0">
                      {folder.tasks.length}
                    </span>
                  </div>

                  {/* Tasks List */}
                  <ul className="ml-5 space-y-1 mt-1">
                    {folder.tasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-center gap-2 text-sm py-1.5 px-2 rounded-md bg-secondary/30"
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
                </div>
              );
            })}
          </div>
        </ScrollArea>
      ) : (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-3">Tudo feito! 🎉</p>
          <Button asChild size="sm" variant="outline">
            <Link to="/rotina">Criar tarefa</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
