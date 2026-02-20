import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useUserProfile, AppTheme } from "@/contexts/UserProfileContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera, Loader2, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import kairoLogo from "@/assets/kairo-penguin.png";

const THEME_OPTIONS: { id: AppTheme; label: string; color: string }[] = [
  { id: 'dark', label: 'Preto', color: 'bg-[#1a1a1a]' },
  { id: 'light', label: 'Branco', color: 'bg-[#e5e5e5]' },
  { id: 'violet', label: 'Violet', color: 'bg-[#7C3AED]' },
  { id: 'pink', label: 'Pink', color: 'bg-[#EC4899]' },
  { id: 'emerald', label: 'Emerald', color: 'bg-[#10B981]' },
  { id: 'blue', label: 'Blue', color: 'bg-[#3B82F6]' },
  { id: 'fuchsia', label: 'Fuchsia', color: 'bg-[#D946EF]' },
];

export function WelcomePanel() {
  const { updateProfile, uploadAvatar } = useUserProfile();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>('dark');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const getInitials = () => {
    const first = firstName.charAt(0).toUpperCase();
    const last = lastName.charAt(0).toUpperCase();
    return first + last || '?';
  };

  const handleSubmit = async () => {
    if (!firstName.trim()) {
      toast.error('Por favor, insira seu nome');
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error('A senha deve ter pelo menos 6 caracteres');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('As senhas não coincidem');
        return;
      }
    }

    setSaving(true);

    try {
      // Update password if provided
      if (newPassword) {
        const { error: pwError } = await supabase.auth.updateUser({ password: newPassword });
        if (pwError) {
          toast.error('Erro ao definir senha: ' + pwError.message);
          setSaving(false);
          return;
        }
      }

      let avatarUrl = null;
      
      if (avatarFile) {
        avatarUrl = await uploadAvatar(avatarFile);
      }

      await updateProfile({
        first_name: firstName.trim(),
        last_name: lastName.trim() || null,
        birth_date: birthDate || null,
        phone_number: phoneNumber.trim() || null,
        app_theme: selectedTheme,
        avatar_url: avatarUrl,
        onboarding_completed: true,
        account_status: 'active',
      });

      toast.success('Bem-vindo ao Kairo!');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      toast.error('Erro ao salvar perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      {/* Logo */}
      <div className="absolute top-8 left-8">
        <img src={kairoLogo} alt="Kairo" className="h-12 w-12 rounded-lg" />
      </div>

      {/* Panel */}
      <div className="w-full max-w-lg mx-4 p-8 rounded-2xl border border-border bg-card max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center space-y-6">
          {/* Avatar Upload */}
          <div className="text-center">
            <Label className="text-sm text-muted-foreground mb-2 block">Foto de perfil</Label>
            <div 
              className="relative cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <Avatar className="h-24 w-24 border-2 border-border">
                <AvatarImage src={avatarPreview || undefined} />
                <AvatarFallback className="text-2xl bg-secondary text-foreground">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Form Fields */}
          <div className="w-full space-y-4">
            <div>
              <Label htmlFor="firstName" className="text-sm text-muted-foreground">Nome</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Seu nome"
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            <div>
              <Label htmlFor="lastName" className="text-sm text-muted-foreground">Sobrenome</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Seu sobrenome"
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            <div>
              <Label htmlFor="birthDate" className="text-sm text-muted-foreground">Data de nascimento</Label>
              <Input
                id="birthDate"
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber" className="text-sm text-muted-foreground">Telefone</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(00) 00000-0000"
                className="mt-1.5 bg-secondary border-border"
              />
            </div>

            {/* Password Fields */}
            <div>
              <Label htmlFor="newPassword" className="text-sm text-muted-foreground">Nova senha</Label>
              <div className="relative mt-1.5">
                <Input
                  id="newPassword"
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword" className="text-sm text-muted-foreground">Confirmar senha</Label>
              <div className="relative mt-1.5">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repita a senha"
                  className="bg-secondary border-border pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Theme Selection */}
          <div className="w-full">
            <Label className="text-sm text-muted-foreground">Cor do app</Label>
            <div className="flex items-center justify-center gap-3 mt-3">
              {THEME_OPTIONS.map((theme) => (
                <button
                  key={theme.id}
                  type="button"
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    "h-12 w-12 rounded-full transition-all",
                    theme.color,
                    selectedTheme === theme.id 
                      ? "ring-2 ring-offset-2 ring-offset-card ring-primary scale-110" 
                      : "hover:scale-105"
                  )}
                  title={theme.label}
                />
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={saving || !firstName.trim()}
            className="w-full h-12 text-base font-medium"
          >
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
