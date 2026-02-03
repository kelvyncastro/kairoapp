import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";

interface RankingPublicIdCardProps {
  publicId: string | null;
  onCopy: () => void;
}

export function RankingPublicIdCard({ publicId, onCopy }: RankingPublicIdCardProps) {
  return (
    <div className="cave-card p-4 md:p-5">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">Seu ID público</p>
          <p className="text-lg md:text-2xl font-bold tracking-widest truncate">
            {publicId || "—"}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Compartilhe este ID para receber convites de rankings
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCopy}
          disabled={!publicId}
          className="shrink-0"
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar ID
        </Button>
      </div>
    </div>
  );
}
