import { useState, useRef, useEffect } from "react";
import { useUserProfile, AppTheme } from "@/contexts/UserProfileContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSound } from "@/contexts/SoundContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Camera, 
  Loader2, 
  LogOut, 
  Copy, 
  User,
  Palette,
  Bell,
  Shield,
  Volume2,
  VolumeX,
  Smartphone,
  Monitor,
  Mail,
  Calendar,
  Trophy,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { ThemeSelector } from "./ThemeSelector";
import { SettingsSection } from "./SettingsSection";
import { SettingsToggle } from "./SettingsToggle";
import { motion, AnimatePresence } from "framer-motion";

export function ProfileSettings() {
  const { profile, updateProfile, uploadAvatar, getInitials } = useUserProfile();
  const { user, signOut } = useAuth();
  const { soundEnabled, toggleSound } = useSound();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedTheme, setSelectedTheme] = useState<AppTheme>('dark');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Notification preferences (local state for now)
  const [notifyTasks, setNotifyTasks] = useState(true);
  const [notifyHabits, setNotifyHabits] = useState(true);
  const [notifyGoals, setNotifyGoals] = useState(true);
  const [notifyRanking, setNotifyRanking] = useState(true);

  // Load current profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
      setBirthDate(profile.birth_date || '');
      setPhoneNumber(profile.phone_number || '');
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
      phoneNumber !== (profile.phone_number || '') ||
      selectedTheme !== profile.app_theme ||
      avatarFile !== null;
    
    setHasChanges(changed);
  }, [firstName, lastName, birthDate, phoneNumber, selectedTheme, avatarFile, profile]);

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
        phone_number: phoneNumber.trim() || null,
        app_theme: selectedTheme,
        avatar_url: avatarUrl,
      });

      setAvatarFile(null);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar perfil');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyId = () => {
    if (profile?.public_id) {
      navigator.clipboard.writeText(profile.public_id);
      toast.success('ID copiado para a área de transferência!');
    }
  };

  return (
    <div className="space-y-6">
      {/* Tabs Navigation */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="w-full justify-start bg-muted/50 p-1 h-auto flex-wrap gap-1">
          <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-background">
            <User className="h-4 w-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2 data-[state=active]:bg-background">
            <Palette className="h-4 w-4" />
            <span className="hidden sm:inline">Aparência</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2 data-[state=active]:bg-background">
            <Bell className="h-4 w-4" />
            <span className="hidden sm:inline">Notificações</span>
          </TabsTrigger>
          <TabsTrigger value="account" className="gap-2 data-[state=active]:bg-background">
            <Shield className="h-4 w-4" />
            <span className="hidden sm:inline">Conta</span>
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="mt-6 space-y-6">
          <SettingsSection 
            title="Informações Pessoais" 
            description="Atualize suas informações de perfil"
            icon={User}
          >
            <div className="flex flex-col md:flex-row gap-8">
              {/* Avatar */}
              <div className="flex flex-col items-center">
                <motion.div 
                  className="relative cursor-pointer group"
                  onClick={handleAvatarClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Avatar className="h-32 w-32 border-4 border-border shadow-xl">
                    <AvatarImage src={avatarPreview || undefined} className="object-cover" />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary/20 to-primary/5 text-foreground font-bold">
                      {getPreviewInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                    <Camera className="h-8 w-8 text-white" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-primary rounded-full shadow-lg">
                    <Camera className="h-4 w-4 text-primary-foreground" />
                  </div>
                </motion.div>
                <p className="text-xs text-muted-foreground mt-3">Clique para alterar</p>
                <p className="text-xs text-muted-foreground">Máximo 5MB</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Fields */}
              <div className="flex-1 space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-sm font-medium">Nome</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="Seu nome"
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-sm font-medium">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Seu sobrenome"
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    Data de nascimento
                  </Label>
                  <Input
                    id="birthDate"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="h-11 max-w-xs"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    E-mail
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={user?.email || ''}
                      disabled
                      className="h-11 max-w-md bg-muted/50"
                    />
                    <div className="flex items-center gap-1.5 text-xs text-emerald-500">
                      <CheckCircle2 className="h-4 w-4" />
                      Verificado
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-sm font-medium flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    Telefone
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="h-11 max-w-xs"
                  />
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="mt-6 space-y-6">
          <SettingsSection 
            title="Tema do Aplicativo" 
            description="Escolha o visual que mais combina com você"
            icon={Palette}
          >
            <ThemeSelector 
              selectedTheme={selectedTheme} 
              onThemeChange={setSelectedTheme} 
            />
          </SettingsSection>

          <SettingsSection 
            title="Sons e Feedback" 
            description="Configure os sons e vibrações do aplicativo"
            icon={Volume2}
          >
            <div className="space-y-1">
              <SettingsToggle
                label="Efeitos sonoros"
                description="Tocar sons ao completar tarefas e hábitos"
                icon={soundEnabled ? Volume2 : VolumeX}
                checked={soundEnabled}
                onCheckedChange={toggleSound}
              />
            </div>
          </SettingsSection>

          <SettingsSection 
            title="Preferências de Exibição" 
            description="Personalize como o conteúdo é exibido em cada dispositivo"
            icon={Monitor}
          >
            <div className="space-y-6">
              {/* Desktop Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Desktop</h4>
                </div>
                <div className="pl-6 space-y-1 border-l-2 border-border">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Sidebar lateral expansível com menu completo e tooltips no modo recolhido.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mobile Settings */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-primary" />
                  <h4 className="font-medium text-sm">Mobile</h4>
                </div>
                <div className="pl-6 space-y-1 border-l-2 border-border">
                  <div className="p-3 rounded-lg bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Navegação inferior com efeito spotlight e menu lateral acessível pelo botão de hambúrguer.
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Preview */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="aspect-[4/3] rounded-lg border border-border bg-muted/20 p-3 flex flex-col">
                  <div className="flex gap-2 flex-1">
                    <div className="w-1/4 bg-primary/20 rounded-md" />
                    <div className="flex-1 bg-muted/50 rounded-md" />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Desktop</p>
                </div>
                <div className="aspect-[4/3] rounded-lg border border-border bg-muted/20 p-3 flex flex-col">
                  <div className="flex-1 bg-muted/50 rounded-md" />
                  <div className="h-3 bg-primary/20 rounded-md mt-2" />
                  <p className="text-[10px] text-muted-foreground text-center mt-2">Mobile</p>
                </div>
              </div>
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-6 space-y-6">
          <SettingsSection 
            title="Notificações do App" 
            description="Escolha quais notificações você deseja receber"
            icon={Bell}
          >
            <div className="space-y-1">
              <SettingsToggle
                label="Tarefas"
                description="Lembretes de tarefas pendentes e vencidas"
                icon={CheckCircle2}
                checked={notifyTasks}
                onCheckedChange={setNotifyTasks}
              />
              <SettingsToggle
                label="Hábitos"
                description="Lembretes para completar seus hábitos diários"
                icon={Calendar}
                checked={notifyHabits}
                onCheckedChange={setNotifyHabits}
              />
              <SettingsToggle
                label="Metas"
                description="Atualizações de progresso e conquistas"
                icon={AlertCircle}
                checked={notifyGoals}
                onCheckedChange={setNotifyGoals}
              />
              <SettingsToggle
                label="Ranking"
                description="Mudanças de posição e novos participantes"
                icon={Trophy}
                checked={notifyRanking}
                onCheckedChange={setNotifyRanking}
              />
            </div>
          </SettingsSection>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account" className="mt-6 space-y-6">
          <SettingsSection 
            title="Identificação" 
            description="Seu identificador único no Kairo"
            icon={Shield}
          >
            {profile?.public_id && (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Input
                    value={profile.public_id}
                    disabled
                    className="max-w-xs bg-muted/50 font-mono text-sm h-11"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleCopyId}
                    className="h-11 w-11"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Compartilhe este ID para que outros usuários possam te encontrar em rankings e competições.
                </p>
              </div>
            )}
          </SettingsSection>

          <SettingsSection 
            title="Sessão" 
            description="Gerencie sua sessão atual"
            icon={LogOut}
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                variant="destructive" 
                onClick={signOut}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Sair da conta
              </Button>
            </div>
          </SettingsSection>
        </TabsContent>
      </Tabs>

      {/* Floating Save Button */}
      <AnimatePresence>
        {hasChanges && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50"
          >
            <Button
              onClick={handleSave}
              disabled={saving || !firstName.trim()}
              size="lg"
              className="shadow-2xl shadow-primary/30 gap-2 px-8"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Salvar alterações
                </>
              )}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
