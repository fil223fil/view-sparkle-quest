// Ядро Ленин - Full Apple Ecosystem Widget & Connection Data
import { WidgetData, ConnectionData, MiniWidgetData } from './types';

let miniCounter = 0;
const createMiniWidgets = (items: { icon: string; label: string }[]): MiniWidgetData[] =>
  items.map((item) => ({ id: `mini-${++miniCounter}`, icon: item.icon, label: item.label }));

// Spread widgets across the field with varied positions
const pos = (x: number, y: number, z = 5) => ({ x, y, z });

export const INITIAL_WIDGETS: WidgetData[] = [
  // ═══ SYSTEM / AI CORE ═══
  { id: 'lmm-core', icon: '🧠', title: 'Apple Intelligence', subtitle: 'Центральный ИИ', priority: 'critical', category: 'system', infoLoad: 92, connects: ['siri', 'neural-engine', 'memory-bank', 'processing-queue'], miniWidgets: createMiniWidgets([{ icon: '⚡', label: 'Активация' }, { icon: '🔄', label: 'Синхронизация' }, { icon: '📊', label: 'Метрики' }]), position: pos(0, 0, 20) },
  { id: 'siri', icon: '🎙️', title: 'Siri', subtitle: 'Голосовой ассистент', priority: 'critical', category: 'system', infoLoad: 88, connects: ['lmm-core', 'shortcuts', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }, { icon: '🌐', label: 'Язык' }]), position: pos(120, -150, 18) },
  { id: 'neural-engine', icon: '🔮', title: 'Neural Engine', subtitle: 'Нейронный процессор', priority: 'high', category: 'system', infoLoad: 95, connects: ['lmm-core', 'photos', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🌐', label: 'Сеть' }, { icon: '📈', label: 'ML' }]), position: pos(-130, 170, 22) },
  { id: 'memory-bank', icon: '💾', title: 'iCloud', subtitle: 'Облачное хранилище', priority: 'high', category: 'system', infoLoad: 78, connects: ['lmm-core', 'notes', 'photos', 'files'], miniWidgets: createMiniWidgets([{ icon: '☁️', label: 'Облако' }, { icon: '🔍', label: 'Поиск' }]), position: pos(-250, -80, 15) },
  { id: 'processing-queue', icon: '⚙️', title: 'Settings', subtitle: 'Настройки системы', priority: 'high', category: 'system', infoLoad: 30, connects: ['lmm-core'], miniWidgets: createMiniWidgets([{ icon: '🔧', label: 'Общие' }, { icon: '🔒', label: 'Приватность' }]), position: pos(260, 90, 12) },

  // ═══ PRODUCTIVITY ═══
  { id: 'calendar', icon: '📅', title: 'Calendar', subtitle: 'Расписание', priority: 'medium', category: 'productivity', infoLoad: 45, connects: ['tasks', 'reminders', 'mail'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Событие' }, { icon: '🔔', label: 'Уведомление' }]), position: pos(-320, 200, 8) },
  { id: 'tasks', icon: '✅', title: 'Reminders', subtitle: 'Задачи и списки', priority: 'medium', category: 'productivity', infoLoad: 55, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }, { icon: '📋', label: 'Списки' }]), position: pos(350, -50, 7) },
  { id: 'notes', icon: '📝', title: 'Notes', subtitle: 'Заметки', priority: 'medium', category: 'productivity', infoLoad: 40, connects: ['memory-bank', 'files'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Новая' }, { icon: '📤', label: 'Экспорт' }]), position: pos(-380, -200, 6) },
  { id: 'reminders', icon: '🔔', title: 'Clock', subtitle: 'Часы и таймеры', priority: 'low', category: 'productivity', infoLoad: 20, connects: ['calendar'], miniWidgets: createMiniWidgets([{ icon: '⏰', label: 'Будильник' }]), position: pos(-180, 320, 4) },
  { id: 'files', icon: '📁', title: 'Files', subtitle: 'Файловый менеджер', priority: 'medium', category: 'productivity', infoLoad: 35, connects: ['memory-bank', 'notes'], miniWidgets: createMiniWidgets([{ icon: '📂', label: 'Папки' }, { icon: '☁️', label: 'iCloud' }]), position: pos(180, 280, 5) },
  { id: 'shortcuts', icon: '⚡', title: 'Shortcuts', subtitle: 'Автоматизации', priority: 'medium', category: 'productivity', infoLoad: 50, connects: ['siri', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🔄', label: 'Сценарий' }, { icon: '▶️', label: 'Запуск' }]), position: pos(420, 180, 6) },
  { id: 'freeform', icon: '🎨', title: 'Freeform', subtitle: 'Доска идей', priority: 'low', category: 'productivity', infoLoad: 25, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Рисование' }]), position: pos(-450, 80, 3) },

  // ═══ COMMUNICATION ═══
  { id: 'messages', icon: '💬', title: 'Messages', subtitle: 'iMessage', priority: 'high', category: 'communication', infoLoad: 65, connects: ['lmm-core', 'facetime', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '✉️', label: 'Новое' }, { icon: '📎', label: 'Медиа' }]), position: pos(300, 250, 10) },
  { id: 'mail', icon: '📧', title: 'Mail', subtitle: 'Почта', priority: 'medium', category: 'communication', infoLoad: 58, connects: ['messages', 'calendar', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📨', label: 'Входящие' }, { icon: '📤', label: 'Отправить' }]), position: pos(430, -180, 8) },
  { id: 'facetime', icon: '📹', title: 'FaceTime', subtitle: 'Видеозвонки', priority: 'medium', category: 'communication', infoLoad: 30, connects: ['messages', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }, { icon: '👥', label: 'Группа' }]), position: pos(150, 350, 9) },
  { id: 'phone', icon: '📱', title: 'Phone', subtitle: 'Телефон', priority: 'high', category: 'communication', infoLoad: 42, connects: ['contacts', 'facetime'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }]), position: pos(-100, -320, 7) },
  { id: 'contacts', icon: '👤', title: 'Contacts', subtitle: 'Контакты', priority: 'low', category: 'communication', infoLoad: 22, connects: ['messages', 'mail', 'phone'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }]), position: pos(50, -260, 5) },

  // ═══ MEDIA & ENTERTAINMENT ═══
  { id: 'photos', icon: '📷', title: 'Photos', subtitle: 'Фотографии', priority: 'medium', category: 'media', infoLoad: 75, connects: ['memory-bank', 'neural-engine', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🖼️', label: 'Галерея' }, { icon: '🤖', label: 'AI ретушь' }]), position: pos(-420, -100, 6) },
  { id: 'camera', icon: '📸', title: 'Camera', subtitle: 'Камера', priority: 'medium', category: 'media', infoLoad: 60, connects: ['photos', 'neural-engine'], miniWidgets: createMiniWidgets([{ icon: '🎞️', label: 'Видео' }, { icon: '🌃', label: 'Ночь' }]), position: pos(-300, -300, 8) },
  { id: 'music', icon: '🎵', title: 'Apple Music', subtitle: 'Музыка', priority: 'medium', category: 'media', infoLoad: 70, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '▶️', label: 'Плей' }, { icon: '📻', label: 'Радио' }]), position: pos(480, 50, 5) },
  { id: 'podcasts', icon: '🎙️', title: 'Podcasts', subtitle: 'Подкасты', priority: 'low', category: 'media', infoLoad: 35, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎧', label: 'Слушать' }]), position: pos(380, 320, 4) },
  { id: 'tv', icon: '📺', title: 'Apple TV+', subtitle: 'Видео и фильмы', priority: 'low', category: 'media', infoLoad: 45, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎬', label: 'Каталог' }]), position: pos(-480, 250, 3) },
  { id: 'books', icon: '📚', title: 'Books', subtitle: 'Книги', priority: 'low', category: 'media', infoLoad: 28, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '📖', label: 'Читать' }]), position: pos(-350, 350, 3) },
  { id: 'news', icon: '📰', title: 'News', subtitle: 'Новости', priority: 'low', category: 'media', infoLoad: 50, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '📋', label: 'Лента' }]), position: pos(250, -300, 4) },

  // ═══ UTILITIES & SERVICES ═══
  { id: 'weather', icon: '🌤️', title: 'Weather', subtitle: 'Погода', priority: 'medium', category: 'utilities', infoLoad: 40, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '📍', label: 'Локация' }, { icon: '🌡️', label: 'Прогноз' }]), position: pos(100, -380, 5) },
  { id: 'maps', icon: '🗺️', title: 'Maps', subtitle: 'Карты Apple', priority: 'medium', category: 'utilities', infoLoad: 55, connects: ['weather', 'siri'], miniWidgets: createMiniWidgets([{ icon: '🧭', label: 'Навигация' }, { icon: '📍', label: 'Места' }]), position: pos(-50, 400, 6) },
  { id: 'wallet', icon: '💳', title: 'Wallet', subtitle: 'Apple Pay', priority: 'medium', category: 'utilities', infoLoad: 38, connects: ['safari'], miniWidgets: createMiniWidgets([{ icon: '💵', label: 'Оплата' }, { icon: '🎫', label: 'Билеты' }]), position: pos(500, -80, 4) },
  { id: 'health', icon: '❤️', title: 'Health', subtitle: 'Здоровье', priority: 'medium', category: 'utilities', infoLoad: 65, connects: ['fitness', 'siri'], miniWidgets: createMiniWidgets([{ icon: '💓', label: 'Пульс' }, { icon: '🏃', label: 'Шаги' }]), position: pos(-200, -400, 7) },
  { id: 'fitness', icon: '🏋️', title: 'Fitness', subtitle: 'Apple Fitness+', priority: 'low', category: 'utilities', infoLoad: 48, connects: ['health'], miniWidgets: createMiniWidgets([{ icon: '🎯', label: 'Цели' }]), position: pos(-400, -350, 4) },
  { id: 'safari', icon: '🧭', title: 'Safari', subtitle: 'Веб-браузер', priority: 'high', category: 'utilities', infoLoad: 72, connects: ['lmm-core', 'wallet'], miniWidgets: createMiniWidgets([{ icon: '🔍', label: 'Поиск' }, { icon: '📑', label: 'Вкладки' }]), position: pos(-500, 0, 8) },
  { id: 'appstore', icon: '🛍️', title: 'App Store', subtitle: 'Магазин приложений', priority: 'medium', category: 'utilities', infoLoad: 42, connects: [], miniWidgets: createMiniWidgets([{ icon: '⬇️', label: 'Загрузить' }]), position: pos(450, -280, 3) },
  { id: 'homekit', icon: '🏠', title: 'Home', subtitle: 'Умный дом', priority: 'medium', category: 'utilities', infoLoad: 33, connects: ['siri', 'shortcuts'], miniWidgets: createMiniWidgets([{ icon: '💡', label: 'Свет' }, { icon: '🌡️', label: 'Климат' }]), position: pos(320, 400, 5) },
  { id: 'findmy', icon: '📍', title: 'Find My', subtitle: 'Локатор', priority: 'low', category: 'utilities', infoLoad: 25, connects: ['maps'], miniWidgets: createMiniWidgets([{ icon: '📡', label: 'AirTag' }]), position: pos(-480, -200, 3) },
  { id: 'translate', icon: '🌐', title: 'Translate', subtitle: 'Переводчик', priority: 'low', category: 'utilities', infoLoad: 30, connects: ['siri', 'safari'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }]), position: pos(0, 450, 4) },
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
