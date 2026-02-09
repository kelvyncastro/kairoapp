import NumberFlow from "@number-flow/react";
import { cn } from "@/lib/utils";

interface AnimatedNumberProps {
  value: number;
  currency?: boolean;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedNumber({
  value,
  currency = false,
  decimals,
  prefix,
  suffix,
  className,
}: AnimatedNumberProps) {
  const resolvedDecimals = decimals ?? (currency ? 2 : 0);

  return (
    <span className={cn("tabular-nums", className)}>
      {prefix}
      <NumberFlow
        value={value}
        format={
          currency
            ? {
                style: "currency",
                currency: "BRL",
                minimumFractionDigits: resolvedDecimals,
                maximumFractionDigits: resolvedDecimals,
              }
            : {
                style: "decimal",
                minimumFractionDigits: resolvedDecimals,
                maximumFractionDigits: resolvedDecimals,
              }
        }
        locales="pt-BR"
      />
      {suffix}
    </span>
  );
}
