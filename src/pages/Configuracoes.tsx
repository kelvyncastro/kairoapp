import { ProfileSettings } from "@/components/settings/ProfileSettings";

export default function Configuracoes() {
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col -m-6 bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu perfil e preferências</p>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-6 py-5 max-w-4xl">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
