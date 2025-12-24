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
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-0.5 px-1.5 py-1.5 rounded-full transition-all duration-500"
      style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(50px) saturate(150%)',
        WebkitBackdropFilter: 'blur(50px) saturate(150%)',
        border: '0.5px solid rgba(255,255,255,0.12)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.25)'
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/8 transition-all duration-300"
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/8 transition-all duration-300"
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        className="h-10 w-10 rounded-full text-white/70 hover:text-white hover:bg-white/8 transition-all duration-300"
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
};
