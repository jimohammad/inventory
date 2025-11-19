import React from "react";
import { LucideIcon } from "lucide-react";

interface MacButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  type?: "button" | "submit" | "reset";
}

/**
 * MacButton - Reusable button component with Mac-style effects
 * Features: gradient glow, backdrop blur, smooth transitions, icon glow
 */
export function MacButton({
  onClick,
  disabled = false,
  icon: Icon,
  children,
  variant = "primary",
  className = "",
  type = "button",
}: MacButtonProps) {
  const baseClasses = `
    h-16 px-6 rounded-xl font-semibold text-base transition-all duration-300 
    relative overflow-hidden group/btn
    before:absolute before:inset-0 before:rounded-xl before:opacity-0 
    before:transition-opacity before:duration-500
  `;

  const variantClasses = {
    primary: disabled
      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
      : `bg-slate-800/80 text-emerald-400 
         hover:bg-slate-800/50 hover:backdrop-blur-sm 
         hover:shadow-lg hover:shadow-emerald-500/20 
         hover:border hover:border-emerald-500/30
         hover:before:opacity-100 hover:before:bg-gradient-to-r 
         hover:before:from-emerald-400/0 hover:before:via-emerald-400/20 
         hover:before:to-emerald-400/0`,
    secondary: disabled
      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
      : `bg-slate-700/80 text-teal-400 
         hover:bg-slate-700/50 hover:backdrop-blur-sm 
         hover:shadow-lg hover:shadow-teal-500/20 
         hover:border hover:border-teal-500/30
         hover:before:opacity-100 hover:before:bg-gradient-to-r 
         hover:before:from-teal-400/0 hover:before:via-teal-400/20 
         hover:before:to-teal-400/0`,
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
    >
      <div className="flex items-center justify-center gap-3 relative z-10">
        {Icon && (
          <Icon
            className={`h-5 w-5 transition-all duration-300 ${
              !disabled ? "group-hover/btn:drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]" : ""
            }`}
          />
        )}
        <span>{children}</span>
      </div>
    </button>
  );
}
