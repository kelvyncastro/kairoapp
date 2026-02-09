import React, { InputHTMLAttributes, useState } from 'react';
import { cn } from "@/lib/utils";

interface NeonCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
  size?: number;
  rounded?: boolean;
  onCheckedChange?: (checked: boolean) => void;
}

const NeonCheckbox: React.FC<NeonCheckboxProps> = ({
  label,
  className = '',
  checked: controlledChecked,
  defaultChecked,
  onChange,
  onCheckedChange,
  size = 20,
  rounded = true,
  ...props
}) => {
  const [internalChecked, setInternalChecked] = useState(defaultChecked || false);

  const isControlled = controlledChecked !== undefined;
  const isChecked = isControlled ? controlledChecked : internalChecked;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isControlled) {
      setInternalChecked(e.target.checked);
    }
    onChange?.(e);
    onCheckedChange?.(e.target.checked);
  };

  const borderRadius = rounded ? 'rounded-full' : 'rounded-sm';

  return (
    <label
      className={cn("inline-flex items-center gap-2 cursor-pointer select-none shrink-0", className)}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={isChecked}
        onChange={handleChange}
        {...props}
      />

      <div className="relative" style={{ width: `${size}px`, height: `${size}px` }}>
        {/* Main checkbox shape */}
        <div
          className={cn(
            "w-full h-full border-2 transition-all duration-300 relative overflow-hidden",
            borderRadius,
            isChecked
              ? "bg-primary border-primary shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
              : "border-muted-foreground/30 hover:border-primary/60"
          )}
        >
          {/* Checkmark */}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className={cn(
              "absolute inset-0 w-full h-full p-0.5 transition-all duration-300",
              isChecked ? "opacity-100 scale-100" : "opacity-0 scale-50"
            )}
          >
            <path
              d="M6 12.5L10 16.5L18 8.5"
              stroke="hsl(var(--primary-foreground))"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                strokeDasharray: 24,
                strokeDashoffset: isChecked ? 0 : 24,
                transition: 'stroke-dashoffset 0.4s ease-out 0.1s',
              }}
            />
          </svg>

          {/* Animated border flows */}
          {isChecked && (
            <div className={cn("absolute inset-0 overflow-hidden", borderRadius)}>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="absolute bg-primary/60"
                  style={{
                    ...(i === 0 ? { top: 0, left: '-100%', width: '100%', height: '2px', animation: 'neonBorderFlow1 0.6s linear' } : {}),
                    ...(i === 1 ? { top: '-100%', right: 0, width: '2px', height: '100%', animation: 'neonBorderFlow2 0.6s linear 0.15s' } : {}),
                    ...(i === 2 ? { bottom: 0, right: '-100%', width: '100%', height: '2px', animation: 'neonBorderFlow3 0.6s linear 0.3s' } : {}),
                    ...(i === 3 ? { bottom: '-100%', left: 0, width: '2px', height: '100%', animation: 'neonBorderFlow4 0.6s linear 0.45s' } : {}),
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Particle explosion effect */}
        {isChecked && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Ring pulse */}
            {[0, 1, 2].map((i) => (
              <div
                key={`ring-${i}`}
                className={cn("absolute inset-0 border border-primary/40", borderRadius)}
                style={{
                  animation: `neonRingPulse 0.6s ease-out ${i * 0.1}s forwards`,
                }}
              />
            ))}

            {/* Particles */}
            {[...Array(8)].map((_, i) => {
              const angle = (i * 360) / 8;
              const rad = (angle * Math.PI) / 180;
              const distance = size * 0.8;
              return (
                <div
                  key={`particle-${i}`}
                  className="absolute w-1 h-1 rounded-full bg-primary"
                  style={{
                    top: '50%',
                    left: '50%',
                    '--x': `${Math.cos(rad) * distance}px`,
                    '--y': `${Math.sin(rad) * distance}px`,
                    animation: `neonParticleExplosion 0.5s ease-out ${i * 0.02}s forwards`,
                  } as React.CSSProperties}
                />
              );
            })}

            {/* Sparks */}
            {[...Array(4)].map((_, i) => (
              <div
                key={`spark-${i}`}
                className="absolute top-1/2 left-1/2 w-0.5 h-2 bg-primary/80 rounded-full"
                style={{
                  '--r': `${i * 90}deg`,
                  animation: `neonSparkFlash 0.4s ease-out ${i * 0.05}s forwards`,
                  transformOrigin: 'center',
                } as React.CSSProperties}
              />
            ))}
          </div>
        )}
      </div>

      {label && (
        <span className="text-sm text-foreground">{label}</span>
      )}

      <style>{`
        @keyframes neonBorderFlow1 {
          0% { transform: translateX(0); }
          100% { transform: translateX(200%); }
        }
        @keyframes neonBorderFlow2 {
          0% { transform: translateY(0); }
          100% { transform: translateY(200%); }
        }
        @keyframes neonBorderFlow3 {
          0% { transform: translateX(0); }
          100% { transform: translateX(-200%); }
        }
        @keyframes neonBorderFlow4 {
          0% { transform: translateY(0); }
          100% { transform: translateY(-200%); }
        }
        @keyframes neonParticleExplosion {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0; }
          20% { opacity: 1; }
          100% {
            transform: translate(
              calc(-50% + var(--x, 20px)),
              calc(-50% + var(--y, 20px))
            ) scale(0);
            opacity: 0;
          }
        }
        @keyframes neonRingPulse {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2); opacity: 0; }
        }
        @keyframes neonSparkFlash {
          0% {
            transform: rotate(var(--r, 0deg)) translateX(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: rotate(var(--r, 0deg)) translateX(${size}px) scale(0);
            opacity: 0;
          }
        }
      `}</style>
    </label>
  );
};

export { NeonCheckbox };
