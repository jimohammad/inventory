import React from "react";
import { LucideIcon } from "lucide-react";

interface MacButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  icon?: LucideIcon;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "gradient";
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
    gradient: disabled
      ? "bg-slate-700/50 text-slate-500 cursor-not-allowed"
      : `bg-black/90 
         hover:bg-black/80 hover:backdrop-blur-sm 
         hover:shadow-lg hover:shadow-purple-500/30 
         hover:border hover:border-purple-500/40
         hover:before:opacity-100 hover:before:bg-gradient-to-r 
         hover:before:from-purple-500/0 hover:before:via-pink-500/20 
         hover:before:to-orange-500/0`,
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
              variant === "gradient" && !disabled
                ? "group-hover/btn:drop-shadow-[0_0_8px_rgba(168,85,247,0.6)]"
                : !disabled
                ? "group-hover/btn:drop-shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                : ""
            } ${
              variant === "gradient" && !disabled
                ? "bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent"
                : ""
            }`}
          />
        )}
        <span
          className={`${
            variant === "gradient" && !disabled
              ? "bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent font-bold"
              : ""
          }`}
        >
          {children}
        </span>
      </div>
    </button>
  );
}
