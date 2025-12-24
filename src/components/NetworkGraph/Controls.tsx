import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Maximize, ArrowLeft } from 'lucide-react';

interface ControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  onFullscreen: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
}

export const Controls = ({ isPaused, onTogglePause, onReset, onFullscreen, canGoBack, onGoBack }: ControlsProps) => {
  return (
    <div 
      className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-500"
      style={{
        background: 'rgba(40, 40, 40, 0.8)',
        border: '1px solid rgba(88, 196, 221, 0.2)',
      }}
    >
      {/* Кнопка назад */}
      {canGoBack && (
        <>
          <Button
            variant="ghost"
            size="icon"
            onClick={onGoBack}
            className="h-9 w-9 rounded-md transition-all duration-300"
            style={{
              color: '#58C4DD',
              background: 'rgba(88, 196, 221, 0.15)',
            }}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          
          <div className="w-px h-5" style={{ background: 'rgba(88, 196, 221, 0.2)' }} />
        </>
      )}

      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="h-9 w-9 rounded-md transition-all duration-300"
        style={{
          color: isPaused ? '#58C4DD' : 'rgba(255,255,255,0.7)',
          background: isPaused ? 'rgba(88, 196, 221, 0.15)' : 'transparent',
        }}
      >
        {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
      </Button>
      
      <div className="w-px h-5" style={{ background: 'rgba(88, 196, 221, 0.2)' }} />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onReset}
        className="h-9 w-9 rounded-md transition-all duration-300 hover:bg-white/5"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        <RotateCcw className="h-4 w-4" />
      </Button>
      
      <div className="w-px h-5" style={{ background: 'rgba(88, 196, 221, 0.2)' }} />
      
      <Button
        variant="ghost"
        size="icon"
        onClick={onFullscreen}
        className="h-9 w-9 rounded-md transition-all duration-300 hover:bg-white/5"
        style={{ color: 'rgba(255,255,255,0.7)' }}
      >
        <Maximize className="h-4 w-4" />
      </Button>
    </div>
  );
};
