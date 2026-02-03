import { useState, useRef, useEffect } from "react";
import { useUserProfile, AppTheme } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Check, LogOut, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const THEME_OPTIONS: { id: AppTheme; label: string; color: string; ring: string }[] = [
  { id: 'dark', label: 'Preto/Cinza', color: 'bg-[#1a1a1a]', ring: 'ring-gray-500' },
  { id: 'light', label: 'Branco', color: 'bg-[#e5e5e5]', ring: 'ring-gray-300' },
  { id: 'blue', label: 'Azul', color: 'bg-[#3b82f6]', ring: 'ring-blue-500' },
  { id: 'pink', label: 'Rosa', color: 'bg-[#ec4899]', ring: 'ring-pink-500' },
  { id: 'purple', label: 'Roxo', color: 'bg-[#8b5cf6]', ring: 'ring-purple-500' },
  { id: 'red', label: 'Vermelho', color: 'bg-[#ef4444]', ring: 'ring-red-500' },
];

export function ProfileSettings() {
  const { profile, updateProfile, uploadAvatar, getInitials } = useUserProfile();
  const { user, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>('dark');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setBirthDate(profile.birth_date || '');
      setSelectedTheme(profile.app_theme);
      setAvatarPreview(profile.avatar_url);
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    
    const changed = 
      firstName !== (profile.first_name || '') ||
      lastName !== (profile.last_name || '') ||
      birthDate !== (profile.birth_date || '') ||
      selectedTheme !== profile.app_theme ||
      avatarFile !== null;
    
    setHasChanges(changed);
  }, [firstName, lastName, birthDate, selectedTheme, avatarFile, profile]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const getPreviewInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return first + last || getInitials();
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error('Por favor, insira seu nome');
      return;
    }

    setSaving(true);

    try {
      let avatarUrl = profile?.avatar_url || null;
      
      if (avatarFile) {
        const newUrl = await uploadAvatar(avatarFile);
        if (newUrl) avatarUrl = newUrl;
      }

      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birth_date: birthDate || null,
        app_theme: selectedTheme,
        avatar_url: avatarUrl,
      });

      setAvatarFile(null);
      toast.success('Perfil atualizado!');
    } catch (error) {
      toast.error('Erro ao salvar perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Profile Section */}
      <div className="cave-card p-6">
        <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Perfil</h2>
        
        <div className="flex flex-col md:flex-row gap-8">
          {/* Avatar */}
          <div className="flex flex-col items-center">
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-28 w-28 border-2 border-border">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-3xl bg-secondary text-foreground">
                  {getPreviewInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Clique para alterar</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Fields */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Nome</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="lastName">Sobrenome</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Seu sobrenome"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="birthDate">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1.5 max-w-xs"
              />
            </div>

            <div>
              <Label>E-mail</Label>
              <Input
                value={user?.email || ''}
                disabled
                className="mt-1.5 max-w-md bg-muted"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Theme Section */}
      <div className="cave-card p-6">
        <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Aparência</h2>
        
        <div>
          <Label className="mb-4 block">Cor do aplicativo</Label>
          <div className="flex flex-wrap gap-4">
            {THEME_OPTIONS.map((theme) => (
              <button
                key={theme.id}
                type="button"
                onClick={() => setSelectedTheme(theme.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg border transition-all",
                  selectedTheme === theme.id 
                    ? "border-primary bg-accent" 
                    : "border-border hover:border-muted-foreground"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-full transition-all",
                  theme.color,
                  selectedTheme === theme.id && "ring-2 ring-offset-2 ring-offset-card ring-primary"
                )} />
                <span className="text-xs text-muted-foreground">{theme.label}</span>
                {selectedTheme === theme.id && (
                  <Check className="h-4 w-4 text-success" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {hasChanges && (
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !firstName.trim()}
            className="min-w-32"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar alterações'
            )}
          </Button>
        </div>
      )}

      {/* Account Section */}
      <div className="cave-card p-6">
        <h2 className="text-lg font-bold uppercase tracking-wider mb-6">Conta</h2>
        
        <Button variant="destructive" onClick={signOut}>
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </div>
    </div>
  );
}
