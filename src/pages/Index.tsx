import { LeninCore } from '@/components/LeninCore';
import { ChatView } from '@/components/Chat/ChatView';

const Index = () => {
  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 3D Фон / Ядро */}
      <div className="absolute inset-0 z-0">
        <LeninCore />
      </div>
      
      {/* Чат-интерфейс поверх 3D сцены (справа) */}
      <div className="pointer-events-none absolute inset-0 z-10 flex justify-end">
        <div className="pointer-events-auto w-full max-w-md border-l border-white/10 bg-background/60 shadow-2xl backdrop-blur-xl">
          <ChatView />
        </div>
      </div>
    </div>
  );
};

export default Index;
