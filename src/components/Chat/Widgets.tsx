import React from 'react';
import { Sun, Calendar, Heart } from 'lucide-react';
import type { WidgetResponse } from '@/types/chat';

export const WidgetDisplay: React.FC<{ widget: WidgetResponse }> = ({ widget }) => {
  switch (widget.type) {
    case 'weather':
      return <WeatherWidget data={widget.data} />;
    case 'calendar':
      return <CalendarWidget data={widget.data} />;
    case 'health':
      return <HealthWidget data={widget.data} />;
    default:
      return null;
  }
};

const WeatherWidget: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <div className="mt-3 rounded-xl bg-gradient-to-br from-[hsl(211,100%,50%)] to-[hsl(211,100%,35%)] p-4">
    <div className="flex items-center gap-3">
      <Sun className="h-12 w-12 text-[hsl(45,100%,65%)]" />
      <div>
        <p className="text-3xl font-bold text-foreground">{data.temp}°</p>
        <p className="text-sm opacity-80">{data.condition}</p>
      </div>
    </div>
    <div className="mt-3 flex gap-4 text-sm opacity-80">
      <span>💧 {data.humidity}%</span>
      <span>💨 {data.wind} м/с</span>
    </div>
  </div>
);

const CalendarWidget: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <div className="mt-3 rounded-xl bg-secondary p-4">
    <div className="mb-3 flex items-center gap-2">
      <Calendar className="h-5 w-5 text-destructive" />
      <span className="font-semibold text-foreground">Сегодня</span>
    </div>
    <div className="space-y-2">
      {data.events?.map((event: any) => (
        <div key={event.id} className="flex items-center gap-2 text-sm">
          <div className="h-2 w-2 rounded-full bg-destructive" />
          <span className="text-muted-foreground">{event.time}</span>
          <span className="text-foreground">{event.title}</span>
        </div>
      ))}
    </div>
  </div>
);

const HealthWidget: React.FC<{ data: Record<string, any> }> = ({ data }) => (
  <div className="mt-3 rounded-xl bg-secondary p-4">
    <div className="mb-3 flex items-center gap-2">
      <Heart className="h-5 w-5 text-[hsl(var(--apple-pink))]" />
      <span className="font-semibold text-foreground">Активность</span>
    </div>
    <div className="grid grid-cols-3 gap-2 text-center">
      <div className="rounded-lg bg-muted p-2">
        <p className="text-lg font-bold text-[hsl(var(--apple-pink))]">{data.steps?.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground">шагов</p>
      </div>
      <div className="rounded-lg bg-muted p-2">
        <p className="text-lg font-bold text-[hsl(var(--apple-orange))]">{data.calories}</p>
        <p className="text-xs text-muted-foreground">ккал</p>
      </div>
      <div className="rounded-lg bg-muted p-2">
        <p className="text-lg font-bold text-[hsl(var(--apple-teal))]">{data.distance}</p>
        <p className="text-xs text-muted-foreground">км</p>
      </div>
    </div>
  </div>
);
