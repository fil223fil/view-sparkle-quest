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
    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-background/20 backdrop-blur-md rounded-full px-4 py-2 border border-border/20">
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-10 w-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-background/30"
      >
        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </Button>
      
      <div className="w-px h-6 bg-border/30" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-10 w-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-background/30"
      >
        <RotateCcw className="h-5 w-5" />
      </Button>
      
      <div className="w-px h-6 bg-border/30" />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        className="h-10 w-10 rounded-full text-foreground/80 hover:text-foreground hover:bg-background/30"
      >
        <Maximize className="h-5 w-5" />
      </Button>
    </div>
  );
};
