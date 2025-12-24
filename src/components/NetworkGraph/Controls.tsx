import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Maximize } from 'lucide-react';

interface ControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onFullscreen: () => void;
}

export const Controls = ({ isPaused, onTogglePause, onReset, onFullscreen }: ControlsProps) => {
  return (
    <div 
      className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-[28px] transition-all duration-700"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.04) 100%)',
        backdropFilter: 'blur(80px) saturate(200%) brightness(1.1)',
        WebkitBackdropFilter: 'blur(80px) saturate(200%) brightness(1.1)',
        border: '0.5px solid rgba(255,255,255,0.15)',
        boxShadow: `
          0 8px 40px rgba(0,0,0,0.5),
          0 2px 8px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(255,255,255,0.02)
        `
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white transition-all duration-300 relative group"
        style={{
          background: isPaused ? 'rgba(10, 132, 255, 0.2)' : 'transparent',
        }}
      >
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          }}
        />
        {isPaused ? <Play className="h-4.5 w-4.5 relative z-10" /> : <Pause className="h-4.5 w-4.5 relative z-10" />}
      </Button>
      
      <div className="w-px h-6 bg-white/10" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white transition-all duration-300 relative group"
      >
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          }}
        />
        <RotateCcw className="h-4.5 w-4.5 relative z-10" />
      </Button>
      
      <div className="w-px h-6 bg-white/10" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white transition-all duration-300 relative group"
      >
        <div 
          className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
          }}
        />
        <Maximize className="h-4.5 w-4.5 relative z-10" />
      </Button>
    </div>
  );
};
