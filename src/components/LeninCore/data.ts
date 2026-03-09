// Ядро Ленин - Full Apple Ecosystem Widget & Connection Data
import { WidgetData, ConnectionData, MiniWidgetData, WidgetSize } from './types';

let miniCounter = 0;
const createMiniWidgets = (items: { icon: string; label: string }[]): MiniWidgetData[] =>
  items.map((item) => ({ id: `mini-${++miniCounter}`, icon: item.icon, label: item.label }));

// Spread widgets across the field with varied positions
const pos = (x: number, y: number, z = 5) => ({ x, y, z });

export const INITIAL_WIDGETS: WidgetData[] = [
  // ═══ SYSTEM / AI CORE ═══ (Large widgets for core services)
  { id: 'lmm-core', icon: '🧠', title: 'Apple Intelligence', subtitle: 'Центральный ИИ', priority: 'critical', category: 'system', size: 'large', infoLoad: 92, connects: ['siri', 'neural-engine', 'memory-bank', 'processing-queue'], miniWidgets: createMiniWidgets([{ icon: '⚡', label: 'Активация' }, { icon: '🔄', label: 'Синхронизация' }, { icon: '📊', label: 'Метрики' }]), position: pos(0, 0, 20), widgetData: { items: [{ icon: '🤖', label: 'ML Models', value: '12 активных' }, { icon: '📝', label: 'Контекст', value: '8.2K токенов' }, { icon: '⚡', label: 'Задержка', value: '45ms' }] } },
  
  { id: 'siri', icon: '🎙️', title: 'Siri', subtitle: 'Голосовой ассистент', priority: 'critical', category: 'system', size: 'medium', infoLoad: 88, connects: ['lmm-core', 'shortcuts', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }, { icon: '🌐', label: 'Язык' }]), position: pos(200, -200, 18) },
  
  { id: 'neural-engine', icon: '🔮', title: 'Neural Engine', subtitle: 'Нейронный процессор', priority: 'high', category: 'system', size: 'medium', infoLoad: 95, connects: ['lmm-core', 'photos', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🌐', label: 'Сеть' }, { icon: '📈', label: 'ML' }]), position: pos(-200, 220, 22) },
  
  { id: 'memory-bank', icon: '💾', title: 'iCloud', subtitle: 'Облачное хранилище', priority: 'high', category: 'system', size: 'medium', infoLoad: 78, connects: ['lmm-core', 'notes', 'photos', 'files'], miniWidgets: createMiniWidgets([{ icon: '☁️', label: 'Облако' }, { icon: '🔍', label: 'Поиск' }]), position: pos(-350, -100, 15), widgetData: { items: [{ icon: '📦', label: 'Использовано', value: '128 ГБ' }, { icon: '🔄', label: 'Синхронизация', value: 'Активна' }] } },
  
  { id: 'processing-queue', icon: '⚙️', title: 'Settings', subtitle: 'Настройки системы', priority: 'high', category: 'system', size: 'small', infoLoad: 30, connects: ['lmm-core'], miniWidgets: createMiniWidgets([{ icon: '🔧', label: 'Общие' }, { icon: '🔒', label: 'Приватность' }]), position: pos(360, 120, 12) },

  // ═══ PRODUCTIVITY ═══ (Mixed sizes)
  { id: 'calendar', icon: '📅', title: 'Calendar', subtitle: 'Расписание', priority: 'medium', category: 'productivity', size: 'large', infoLoad: 45, connects: ['tasks', 'reminders', 'mail'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Событие' }, { icon: '🔔', label: 'Уведомление' }]), position: pos(-420, 280, 8), widgetData: { events: [{ time: '10:00', title: 'Встреча с командой', color: '#FF3B30' }, { time: '14:00', title: 'Code Review', color: '#007AFF' }, { time: '16:00', title: 'Спринт', color: '#34C759' }] } },
  
  { id: 'tasks', icon: '✅', title: 'Reminders', subtitle: 'Задачи и списки', priority: 'medium', category: 'productivity', size: 'medium', infoLoad: 55, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }, { icon: '📋', label: 'Списки' }]), position: pos(450, -80, 7), widgetData: { items: [{ icon: '○', label: 'Купить продукты', value: '' }, { icon: '○', label: 'Позвонить маме', value: '' }, { icon: '○', label: 'Отправить отчёт', value: '' }] } },
  
  { id: 'notes', icon: '📝', title: 'Notes', subtitle: 'Заметки', priority: 'medium', category: 'productivity', size: 'small', infoLoad: 40, connects: ['memory-bank', 'files'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Новая' }, { icon: '📤', label: 'Экспорт' }]), position: pos(-480, -260, 6) },
  
  { id: 'reminders', icon: '⏰', title: 'Clock', subtitle: 'Часы и таймеры', priority: 'low', category: 'productivity', size: 'small', infoLoad: 20, connects: ['calendar'], miniWidgets: createMiniWidgets([{ icon: '⏰', label: 'Будильник' }]), position: pos(-240, 420, 4) },
  
  { id: 'files', icon: '📁', title: 'Files', subtitle: 'Файловый менеджер', priority: 'medium', category: 'productivity', size: 'small', infoLoad: 35, connects: ['memory-bank', 'notes'], miniWidgets: createMiniWidgets([{ icon: '📂', label: 'Папки' }, { icon: '☁️', label: 'iCloud' }]), position: pos(240, 360, 5) },
  
  { id: 'shortcuts', icon: '⚡', title: 'Shortcuts', subtitle: 'Автоматизации', priority: 'medium', category: 'productivity', size: 'medium', infoLoad: 50, connects: ['siri', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🔄', label: 'Сценарий' }, { icon: '▶️', label: 'Запуск' }]), position: pos(520, 240, 6), widgetData: { items: [{ icon: '🏠', label: 'Дом', value: '' }, { icon: '🚗', label: 'В путь', value: '' }, { icon: '📊', label: 'Отчёт', value: '' }] } },
  
  { id: 'freeform', icon: '🎨', title: 'Freeform', subtitle: 'Доска идей', priority: 'low', category: 'productivity', size: 'small', infoLoad: 25, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Рисование' }]), position: pos(-560, 100, 3) },

  // ═══ COMMUNICATION ═══
  { id: 'messages', icon: '💬', title: 'Messages', subtitle: 'iMessage', priority: 'high', category: 'communication', size: 'medium', infoLoad: 65, connects: ['lmm-core', 'facetime', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '✉️', label: 'Новое' }, { icon: '📎', label: 'Медиа' }]), position: pos(380, 320, 10), widgetData: { unread: 3 } },
  
  { id: 'mail', icon: '📧', title: 'Mail', subtitle: 'Почта', priority: 'medium', category: 'communication', size: 'medium', infoLoad: 58, connects: ['messages', 'calendar', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📨', label: 'Входящие' }, { icon: '📤', label: 'Отправить' }]), position: pos(540, -220, 8), widgetData: { unread: 12, items: [{ icon: '📩', label: 'Ivan', value: 'Привет! Как...' }, { icon: '📩', label: 'Team', value: 'Meeting tomorrow...' }] } },
  
  { id: 'facetime', icon: '📹', title: 'FaceTime', subtitle: 'Видеозвонки', priority: 'medium', category: 'communication', size: 'small', infoLoad: 30, connects: ['messages', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }, { icon: '👥', label: 'Группа' }]), position: pos(200, 450, 9) },
  
  { id: 'phone', icon: '📱', title: 'Phone', subtitle: 'Телефон', priority: 'high', category: 'communication', size: 'small', infoLoad: 42, connects: ['contacts', 'facetime'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }]), position: pos(-120, -420, 7) },
  
  { id: 'contacts', icon: '👤', title: 'Contacts', subtitle: 'Контакты', priority: 'low', category: 'communication', size: 'small', infoLoad: 22, connects: ['messages', 'mail', 'phone'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }]), position: pos(80, -340, 5) },

  // ═══ MEDIA & ENTERTAINMENT ═══
  { id: 'photos', icon: '📷', title: 'Photos', subtitle: 'Фотографии', priority: 'medium', category: 'media', size: 'large', infoLoad: 75, connects: ['memory-bank', 'neural-engine', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🖼️', label: 'Галерея' }, { icon: '🤖', label: 'AI ретушь' }]), position: pos(-520, -140, 6) },
  
  { id: 'camera', icon: '📸', title: 'Camera', subtitle: 'Камера', priority: 'medium', category: 'media', size: 'small', infoLoad: 60, connects: ['photos', 'neural-engine'], miniWidgets: createMiniWidgets([{ icon: '🎞️', label: 'Видео' }, { icon: '🌃', label: 'Ночь' }]), position: pos(-380, -380, 8) },
  
  { id: 'music', icon: '🎵', title: 'Apple Music', subtitle: 'Музыка', priority: 'medium', category: 'media', size: 'medium', infoLoad: 70, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '▶️', label: 'Плей' }, { icon: '📻', label: 'Радио' }]), position: pos(580, 80, 5), widgetData: { items: [{ icon: '🎵', label: 'Сейчас', value: 'Bohemian Rhapsody' }, { icon: '👤', label: 'Исполнитель', value: 'Queen' }] } },
  
  { id: 'podcasts', icon: '🎙️', title: 'Podcasts', subtitle: 'Подкасты', priority: 'low', category: 'media', size: 'small', infoLoad: 35, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎧', label: 'Слушать' }]), position: pos(480, 400, 4) },
  
  { id: 'tv', icon: '📺', title: 'Apple TV+', subtitle: 'Видео и фильмы', priority: 'low', category: 'media', size: 'small', infoLoad: 45, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎬', label: 'Каталог' }]), position: pos(-580, 320, 3) },
  
  { id: 'books', icon: '📚', title: 'Books', subtitle: 'Книги', priority: 'low', category: 'media', size: 'small', infoLoad: 28, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '📖', label: 'Читать' }]), position: pos(-440, 450, 3) },
  
  { id: 'news', icon: '📰', title: 'News', subtitle: 'Новости', priority: 'low', category: 'media', size: 'medium', infoLoad: 50, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '📋', label: 'Лента' }]), position: pos(320, -380, 4), widgetData: { items: [{ icon: '📰', label: 'Top', value: 'Apple представила...' }] } },

  // ═══ UTILITIES & SERVICES ═══
  { id: 'weather', icon: '🌤️', title: 'Weather', subtitle: 'Москва', priority: 'medium', category: 'utilities', size: 'large', infoLoad: 40, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '📍', label: 'Локация' }, { icon: '🌡️', label: 'Прогноз' }]), position: pos(140, -480, 5), widgetData: { 
    temperature: 22, 
    tempHigh: 26, 
    tempLow: 18, 
    condition: 'Солнечно', 
    humidity: 45, 
    wind: 3, 
    feelsLike: 21, 
    precipitation: 0,
    hourlyForecast: [
      { time: '12:00', temp: 22, icon: '☀️' },
      { time: '13:00', temp: 23, icon: '🌤️' },
      { time: '14:00', temp: 24, icon: '☀️' },
      { time: '15:00', temp: 25, icon: '☀️' },
      { time: '16:00', temp: 24, icon: '🌤️' },
    ]
  }},
  
  { id: 'maps', icon: '🗺️', title: 'Maps', subtitle: 'Карты Apple', priority: 'medium', category: 'utilities', size: 'medium', infoLoad: 55, connects: ['weather', 'siri'], miniWidgets: createMiniWidgets([{ icon: '🧭', label: 'Навигация' }, { icon: '📍', label: 'Места' }]), position: pos(-60, 500, 6) },
  
  { id: 'wallet', icon: '💳', title: 'Wallet', subtitle: 'Apple Pay', priority: 'medium', category: 'utilities', size: 'small', infoLoad: 38, connects: ['safari'], miniWidgets: createMiniWidgets([{ icon: '💵', label: 'Оплата' }, { icon: '🎫', label: 'Билеты' }]), position: pos(620, -100, 4) },
  
  { id: 'health', icon: '❤️', title: 'Health', subtitle: 'Здоровье', priority: 'medium', category: 'utilities', size: 'large', infoLoad: 65, connects: ['fitness', 'siri'], miniWidgets: createMiniWidgets([{ icon: '💓', label: 'Пульс' }, { icon: '🏃', label: 'Шаги' }]), position: pos(-260, -500, 7), widgetData: { steps: 8432, calories: 542, progress: 84, items: [{ icon: '❤️', label: 'Пульс', value: '72 уд/мин' }, { icon: '😴', label: 'Сон', value: '7.5 ч' }] } },
  
  { id: 'fitness', icon: '🏋️', title: 'Fitness', subtitle: 'Apple Fitness+', priority: 'low', category: 'utilities', size: 'medium', infoLoad: 48, connects: ['health'], miniWidgets: createMiniWidgets([{ icon: '🎯', label: 'Цели' }]), position: pos(-500, -440, 4), widgetData: { calories: 542, progress: 54 } },
  
  { id: 'safari', icon: '🧭', title: 'Safari', subtitle: 'Веб-браузер', priority: 'high', category: 'utilities', size: 'medium', infoLoad: 72, connects: ['lmm-core', 'wallet'], miniWidgets: createMiniWidgets([{ icon: '🔍', label: 'Поиск' }, { icon: '📑', label: 'Вкладки' }]), position: pos(-620, 0, 8) },
  
  { id: 'appstore', icon: '🛍️', title: 'App Store', subtitle: 'Магазин приложений', priority: 'medium', category: 'utilities', size: 'small', infoLoad: 42, connects: [], miniWidgets: createMiniWidgets([{ icon: '⬇️', label: 'Загрузить' }]), position: pos(560, -360, 3) },
  
  { id: 'homekit', icon: '🏠', title: 'Home', subtitle: 'Умный дом', priority: 'medium', category: 'utilities', size: 'medium', infoLoad: 33, connects: ['siri', 'shortcuts'], miniWidgets: createMiniWidgets([{ icon: '💡', label: 'Свет' }, { icon: '🌡️', label: 'Климат' }]), position: pos(400, 480, 5), widgetData: { items: [{ icon: '💡', label: 'Гостиная', value: 'Вкл' }, { icon: '🌡️', label: 'Температура', value: '22°C' }] } },
  
  { id: 'findmy', icon: '📍', title: 'Find My', subtitle: 'Локатор', priority: 'low', category: 'utilities', size: 'small', infoLoad: 25, connects: ['maps'], miniWidgets: createMiniWidgets([{ icon: '📡', label: 'AirTag' }]), position: pos(-600, -260, 3) },
  
  { id: 'translate', icon: '🌐', title: 'Translate', subtitle: 'Переводчик', priority: 'low', category: 'utilities', size: 'small', infoLoad: 30, connects: ['siri', 'safari'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }]), position: pos(0, 560, 4) },
];

// Connection data — Apple ecosystem relationships
export const INITIAL_CONNECTIONS: ConnectionData[] = [
  // === Core AI Data Flow ===
  { id: 'c1', from: 'lmm-core', to: 'siri', type: 'dataFlow', strength: 1.0 },
  { id: 'c2', from: 'lmm-core', to: 'neural-engine', type: 'dataFlow', strength: 0.95 },
  { id: 'c3', from: 'lmm-core', to: 'memory-bank', type: 'dataFlow', strength: 0.9 },
  { id: 'c4', from: 'lmm-core', to: 'safari', type: 'dataFlow', strength: 0.7 },
  { id: 'c5', from: 'lmm-core', to: 'messages', type: 'logicChain' },

  // === Dependencies ===
  { id: 'c6', from: 'neural-engine', to: 'photos', type: 'dependency' },
  { id: 'c7', from: 'neural-engine', to: 'camera', type: 'dependency' },
  { id: 'c8', from: 'memory-bank', to: 'notes', type: 'dependency' },
  { id: 'c9', from: 'memory-bank', to: 'files', type: 'dependency' },
  { id: 'c10', from: 'memory-bank', to: 'photos', type: 'dependency' },

  // === Context Links ===
  { id: 'c11', from: 'calendar', to: 'tasks', type: 'contextLink' },
  { id: 'c12', from: 'calendar', to: 'reminders', type: 'contextLink' },
  { id: 'c13', from: 'calendar', to: 'mail', type: 'contextLink' },
  { id: 'c14', from: 'messages', to: 'mail', type: 'contextLink' },
  { id: 'c15', from: 'messages', to: 'facetime', type: 'contextLink' },
  { id: 'c16', from: 'messages', to: 'contacts', type: 'contextLink' },
  { id: 'c17', from: 'phone', to: 'contacts', type: 'contextLink' },
  { id: 'c18', from: 'phone', to: 'facetime', type: 'contextLink' },
  { id: 'c19', from: 'music', to: 'podcasts', type: 'contextLink' },
  { id: 'c20', from: 'music', to: 'tv', type: 'contextLink' },

  // === Siri Logic Chains ===
  { id: 'c21', from: 'siri', to: 'shortcuts', type: 'logicChain' },
  { id: 'c22', from: 'siri', to: 'homekit', type: 'logicChain' },
  { id: 'c23', from: 'siri', to: 'music', type: 'logicChain' },
  { id: 'c24', from: 'siri', to: 'weather', type: 'logicChain' },
  { id: 'c25', from: 'siri', to: 'maps', type: 'logicChain' },
  { id: 'c26', from: 'siri', to: 'health', type: 'logicChain' },
  { id: 'c27', from: 'siri', to: 'news', type: 'logicChain' },
  { id: 'c28', from: 'siri', to: 'translate', type: 'logicChain' },

  // === Causal ===
  { id: 'c29', from: 'weather', to: 'calendar', type: 'causal' },
  { id: 'c30', from: 'health', to: 'fitness', type: 'causal' },
  { id: 'c31', from: 'camera', to: 'photos', type: 'causal' },

  // === Temporal ===
  { id: 'c32', from: 'reminders', to: 'calendar', type: 'temporal' },

  // === Semantic ===
  { id: 'c33', from: 'photos', to: 'memory-bank', type: 'semantic' },
  { id: 'c34', from: 'books', to: 'notes', type: 'semantic' },
  { id: 'c35', from: 'maps', to: 'weather', type: 'semantic' },
  { id: 'c36', from: 'wallet', to: 'safari', type: 'semantic' },
  { id: 'c37', from: 'findmy', to: 'maps', type: 'semantic' },
  { id: 'c38', from: 'freeform', to: 'notes', type: 'semantic' },

  // === Metacognitive ===
  { id: 'c39', from: 'neural-engine', to: 'lmm-core', type: 'metacognitive' },
  { id: 'c40', from: 'shortcuts', to: 'homekit', type: 'dataFlow', strength: 0.6 },
  { id: 'c41', from: 'translate', to: 'safari', type: 'dependency' },
];