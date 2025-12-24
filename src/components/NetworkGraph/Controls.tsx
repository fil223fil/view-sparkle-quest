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
      className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-2 rounded-[22px] transition-all duration-300 hover:scale-105"
      style={{
        background: 'linear-gradient(135deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.06) 100%)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: `
          0 8px 32px rgba(0,0,0,0.3),
          inset 0 1px 0 rgba(255,255,255,0.1),
          inset 0 -1px 0 rgba(0,0,0,0.1)
        `
      }}
    >
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
        style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif' }}
      >
        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </Button>
      
      <div className="w-px h-7 bg-white/10 mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
      
      <div className="w-px h-7 bg-white/10 mx-1" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        className="h-11 w-11 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-all duration-200"
      >
        <Maximize className="h-5 w-5" />
      </Button>
    </div>
  );
};
