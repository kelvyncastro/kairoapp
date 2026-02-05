import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSound } from "@/contexts/SoundContext";

export function SoundToggleButton() {
  const { soundEnabled, toggleSound } = useSound();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSound}
          className="relative"
        >
          {soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5 text-muted-foreground" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{soundEnabled ? "Som ativado" : "Som desativado"}</p>
      </TooltipContent>
    </Tooltip>
  );
}
