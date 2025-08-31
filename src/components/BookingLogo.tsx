import { Sparkles } from "lucide-react";

interface BookingLogoProps {
  className?: string;
  showText?: boolean;
}

export function BookingLogo({ className = "", showText = true }: BookingLogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-primary rounded-lg blur-sm opacity-75"></div>
        <div className="relative bg-gradient-primary p-2 rounded-lg">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
      {showText && (
        <span className="text-2xl font-bold text-gradient">
          BookingFy
        </span>
      )}
    </div>
  );
}