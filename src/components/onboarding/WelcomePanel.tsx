import { useState, useRef, useEffect } from "react";
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
  { id: "dark", label: "Preto", color: "bg-[#1a1a1a]" },
  { id: "light", label: "Branco", color: "bg-[#e5e5e5]" },
  { id: "violet", label: "Violet", color: "bg-[#7C3AED]" },
  { id: "pink", label: "Pink", color: "bg-[#EC4899]" },
  { id: "emerald", label: "Emerald", color: "bg-[#10B981]" },
  { id: "blue", label: "Blue", color: "bg-[#3B82F6]" },
  { id: "fuchsia", label: "Fuchsia", color: "bg-[#D946EF]" },
];

export function WelcomePanel() {
  const { updateProfile, uploadAvatar } = useUserProfile();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>("dark");

  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ✅ Puxa email da sessão magic link
  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (data?.user?.email) {
        setEmail(data.user.email);
      }
    };
    loadUser();
  }, []);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("A imagem deve ter no máximo 5MB");
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onload = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const getInitials = () => {
    return firstName.charAt(0).toUpperCase() + lastName.charAt(0).toUpperCase() || "?";
  };

  const handleSubmit = async () => {
    const { data } = await supabase.auth.getUser();

    if (!data.user) {
      toast.error("Sessão inválida — abra novamente pelo link do email");
      return;
    }

    if (!firstName.trim()) {
      toast.error("Por favor, insira seu nome");
      return;
    }

    if (newPassword) {
      if (newPassword.length < 6) {
        toast.error("Senha mínima 6 caracteres");
        return;
      }

      if (newPassword !== confirmPassword) {
        toast.error("Senhas não coincidem");
        return;
      }
    }

    setSaving(true);

    try {
      if (newPassword) {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) throw error;
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
        account_status: "active",
      });

      toast.success("Bem-vindo ao Kairo 🚀");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar perfil");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
      <div className="absolute top-8 left-8">
        <img src={kairoLogo} alt="Kairo" className="h-12 w-12 rounded-lg" />
      </div>

      <div className="w-full max-w-lg mx-4 p-8 rounded-2xl border border-border bg-card max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col items-center space-y-6">
          {/* Email */}
          <div className="w-full">
            <Label>Email</Label>
            <Input value={email ?? ""} disabled className="mt-1.5 opacity-70 cursor-not-allowed" />
          </div>

          {/* Avatar */}
          <div onClick={handleAvatarClick} className="cursor-pointer">
            <Avatar className="h-24 w-24">
              <AvatarImage src={avatarPreview ?? undefined} />
              <AvatarFallback>{getInitials()}</AvatarFallback>
            </Avatar>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
          </div>

          <div className="w-full space-y-4">
            <Input placeholder="Nome" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            <Input placeholder="Sobrenome" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
            <Input placeholder="Telefone" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} />

            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Nova senha"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <Input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Confirmar senha"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <Button onClick={handleSubmit} disabled={saving} className="w-full">
            {saving ? <Loader2 className="animate-spin" /> : "Entrar"}
          </Button>
        </div>
      </div>
    </div>
  );
}
