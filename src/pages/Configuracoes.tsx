import { ProfileSettings } from "@/components/settings/ProfileSettings";

export default function Configuracoes() {
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 mb-6">
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Personalize sua experiência no Kairo
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="max-w-4xl">
          <ProfileSettings />
        </div>
      </div>
    </div>
  );
}
