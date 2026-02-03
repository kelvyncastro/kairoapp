import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { Trophy, Crown, Medal, Star, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RankingParticipant } from "@/types/ranking";
import { cn } from "@/lib/utils";

interface RankingWinnerCelebrationProps {
  winner: RankingParticipant | null;
  podium: RankingParticipant[];
  rankingName: string;
  onClose: () => void;
}

// Function to play celebration sound
async function playCelebrationSound() {
  try {
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-sfx`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ 
          prompt: "Epic orchestral victory music with magical sparkles and triumphant horns, uplifting celebration melody",
          duration: 5
        }),
      }
    );

    if (!response.ok) {
      console.error("Failed to generate celebration sound:", response.status);
      return;
    }

    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.volume = 0.7;
    await audio.play();
    
    // Clean up the object URL after playing
    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
    };
  } catch (error) {
    console.error("Error playing celebration sound:", error);
  }
}

export function RankingWinnerCelebration({ 
  winner, 
  podium, 
  rankingName, 
  onClose 
}: RankingWinnerCelebrationProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showPodium, setShowPodium] = useState(false);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    if (winner) {
      setIsVisible(true);
      
      // Play celebration sound (only once)
      if (!soundPlayedRef.current) {
        soundPlayedRef.current = true;
        playCelebrationSound();
      }
      
      // Delay podium animation
      setTimeout(() => setShowPodium(true), 800);
      
      // Fire confetti
      const duration = 4000;
      const end = Date.now() + duration;

      const colors = ["#fbbf24", "#f59e0b", "#d97706", "#fef3c7", "#fcd34d"];

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.7 },
          colors,
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.7 },
          colors,
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();

      // Center burst for winner
      setTimeout(() => {
        confetti({
          particleCount: 150,
          spread: 120,
          origin: { x: 0.5, y: 0.4 },
          colors,
          startVelocity: 35,
          gravity: 0.8,
        });
      }, 500);

      // Extra celebration burst
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.3, y: 0.6 },
          colors: ["#a855f7", "#8b5cf6", "#c084fc"],
        });
        confetti({
          particleCount: 80,
          spread: 100,
          origin: { x: 0.7, y: 0.6 },
          colors: ["#22c55e", "#16a34a", "#4ade80"],
        });
      }, 1200);
    }
  }, [winner]);

  const handleClose = () => {
    setIsVisible(false);
    setShowPodium(false);
    soundPlayedRef.current = false; // Reset so sound can play again if reopened
    setTimeout(onClose, 300);
  };

  if (!winner) return null;

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  const getPositionLabel = (position: number) => {
    switch (position) {
      case 0:
        return "1º Lugar";
      case 1:
        return "2º Lugar";
      case 2:
        return "3º Lugar";
      default:
        return `${position + 1}º Lugar`;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-md"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative bg-gradient-to-b from-card to-card/95 border border-border rounded-3xl p-8 max-w-lg mx-4 text-center shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background glow effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-transparent to-transparent pointer-events-none" />
            
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-4 right-4 z-10"
              onClick={handleClose}
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Floating stars decoration */}
            <motion.div
              className="absolute top-6 left-6"
              animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </motion.div>
            <motion.div
              className="absolute top-10 right-10"
              animate={{ rotate: [0, -15, 15, 0], scale: [1, 1.2, 1] }}
              transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
            <motion.div
              className="absolute bottom-20 left-8"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            >
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            </motion.div>

            {/* Trophy animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", damping: 12 }}
              className="relative mx-auto mb-6"
            >
              <motion.div
                className="absolute inset-0 rounded-full blur-2xl opacity-60"
                style={{
                  background: "radial-gradient(circle, #fbbf24 0%, transparent 70%)"
                }}
                animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.7, 0.4] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              <motion.div
                className="relative w-20 h-20 rounded-full bg-gradient-to-br from-yellow-500 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30"
                animate={{ 
                  boxShadow: [
                    "0 0 20px rgba(251, 191, 36, 0.3)",
                    "0 0 40px rgba(251, 191, 36, 0.5)",
                    "0 0 20px rgba(251, 191, 36, 0.3)"
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Trophy className="h-10 w-10 text-yellow-100" />
              </motion.div>
            </motion.div>

            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="text-3xl font-bold mb-1 bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600 bg-clip-text text-transparent">
                🏆 Ranking Finalizado!
              </h2>
              <p className="text-muted-foreground text-sm mb-6">
                {rankingName}
              </p>
            </motion.div>

            {/* Winner highlight */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
              className="relative mb-8"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-yellow-400/30 to-yellow-500/20 rounded-2xl blur-xl" />
              <div className="relative bg-gradient-to-br from-yellow-500/10 to-yellow-600/5 border-2 border-yellow-500/30 rounded-2xl p-6">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Crown className="h-8 w-8 text-yellow-500 mx-auto mb-3" />
                </motion.div>
                
                <div className="flex items-center justify-center gap-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.7, type: "spring" }}
                  >
                    <Avatar className="h-20 w-20 border-4 border-yellow-500/50 shadow-lg shadow-yellow-500/20">
                      <AvatarImage src={winner.user_profile?.avatar_url || undefined} />
                      <AvatarFallback className="text-2xl bg-gradient-to-br from-yellow-500 to-yellow-600 text-yellow-100">
                        {winner.user_profile?.first_name?.charAt(0) || '?'}
                      </AvatarFallback>
                    </Avatar>
                  </motion.div>
                </div>
                
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="mt-4"
                >
                  <h3 className="text-xl font-bold text-yellow-500">
                    {winner.user_profile?.first_name || 'Vencedor'} {winner.user_profile?.last_name || ''}
                  </h3>
                  <p className="text-muted-foreground text-sm">Campeão(ã) do Ranking</p>
                  <div className="mt-2 inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-500 px-3 py-1 rounded-full text-sm font-semibold">
                    <Trophy className="h-4 w-4" />
                    {winner.total_points.toFixed(1)} pontos
                  </div>
                </motion.div>
              </div>
            </motion.div>

            {/* Podium */}
            <AnimatePresence>
              {showPodium && podium.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-3"
                >
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Classificação Final
                  </p>
                  <div className="space-y-2">
                    {podium.slice(0, 3).map((participant, index) => (
                      <motion.div
                        key={participant.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.15 }}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-xl transition-all",
                          index === 0 
                            ? "bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30" 
                            : index === 1 
                            ? "bg-gradient-to-r from-gray-400/10 to-gray-500/5 border border-gray-400/20"
                            : "bg-gradient-to-r from-orange-600/10 to-orange-700/5 border border-orange-600/20"
                        )}
                      >
                        <div className={cn(
                          "h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold",
                          index === 0 && "bg-yellow-500/20 text-yellow-500",
                          index === 1 && "bg-gray-400/20 text-gray-400",
                          index === 2 && "bg-orange-600/20 text-orange-600"
                        )}>
                          {getPositionIcon(index)}
                        </div>
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={participant.user_profile?.avatar_url || undefined} />
                          <AvatarFallback className="text-sm">
                            {participant.user_profile?.first_name?.charAt(0) || '?'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-sm">
                            {participant.user_profile?.first_name || 'Usuário'} {participant.user_profile?.last_name || ''}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {getPositionLabel(index)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className={cn(
                            "font-bold text-sm",
                            index === 0 && "text-yellow-500",
                            index === 1 && "text-gray-400",
                            index === 2 && "text-orange-600"
                          )}>
                            {participant.total_points.toFixed(1)}
                          </p>
                          <p className="text-xs text-muted-foreground">pontos</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Close button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-6"
            >
              <Button onClick={handleClose} className="w-full gap-2 bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-yellow-100">
                <Sparkles className="h-4 w-4" />
                Continuar
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
