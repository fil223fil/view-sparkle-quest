// Ядро Ленин - Full Apple Ecosystem Widget & Connection Data
import { WidgetData, ConnectionData, MiniWidgetData, WidgetSize } from './types';

let miniCounter = 0;
const createMiniWidgets = (items: { icon: string; label: string }[]): MiniWidgetData[] =>
  items.map((item) => ({ id: `mini-${++miniCounter}`, icon: item.icon, label: item.label }));

const pos = (x: number, y: number, z = 5) => ({ x: x * 1.5, y: y * 1.5, z });

export const INITIAL_WIDGETS: WidgetData[] = [
  // ═══ SYSTEM / AI CORE ═══
  { id: 'lmm-core', icon: '🧠', title: 'Apple Intelligence', subtitle: 'Центральный ИИ', priority: 'critical', category: 'system', size: 'large', infoLoad: 92, connects: ['siri', 'neural-engine', 'memory-bank', 'processing-queue'], miniWidgets: createMiniWidgets([{ icon: '⚡', label: 'Активация' }, { icon: '🔄', label: 'Синхронизация' }, { icon: '📊', label: 'Метрики' }]), position: pos(0, 0, 20), widgetData: { items: [{ icon: '🤖', label: 'ML Models', value: '12 активных' }, { icon: '📝', label: 'Контекст', value: '8.2K токенов' }, { icon: '⚡', label: 'Задержка', value: '45ms' }], progress: 92 } },

  { id: 'siri', icon: '🎙️', title: 'Siri', subtitle: 'Голосовой ассистент', priority: 'critical', category: 'system', size: 'medium', infoLoad: 88, connects: ['lmm-core', 'shortcuts', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }, { icon: '🌐', label: 'Язык' }]), position: pos(200, -200, 18), widgetData: { items: [{ icon: '🗣️', label: 'Включи музыку', value: '' }, { icon: '📅', label: 'Что в расписании?', value: '' }, { icon: '🏠', label: 'Включи свет', value: '' }] } },

  { id: 'neural-engine', icon: '🔮', title: 'Neural Engine', subtitle: 'Нейронный процессор', priority: 'high', category: 'system', size: 'medium', infoLoad: 95, connects: ['lmm-core', 'photos', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🌐', label: 'Сеть' }, { icon: '📈', label: 'ML' }]), position: pos(-200, 220, 22), widgetData: { progress: 95, items: [{ icon: '🧠', label: 'Модели', value: '16 TOPS' }, { icon: '📊', label: 'Inference', value: '12ms' }, { icon: '🔥', label: 'Нагрузка', value: '95%' }] } },

  { id: 'memory-bank', icon: '💾', title: 'iCloud', subtitle: 'Облачное хранилище', priority: 'high', category: 'system', size: 'medium', infoLoad: 78, connects: ['lmm-core', 'notes', 'photos', 'files'], miniWidgets: createMiniWidgets([{ icon: '☁️', label: 'Облако' }, { icon: '🔍', label: 'Поиск' }]), position: pos(-350, -100, 15), widgetData: { progress: 64, items: [{ icon: '📦', label: 'Использовано', value: '128/200 ГБ' }, { icon: '📷', label: 'Фото', value: '45 ГБ' }, { icon: '📁', label: 'Документы', value: '32 ГБ' }] } },

  { id: 'processing-queue', icon: '⚙️', title: 'Settings', subtitle: 'Настройки системы', priority: 'high', category: 'system', size: 'small', infoLoad: 30, connects: ['lmm-core'], miniWidgets: createMiniWidgets([{ icon: '🔧', label: 'Общие' }, { icon: '🔒', label: 'Приватность' }]), position: pos(360, 120, 12), widgetData: { items: [{ icon: '📶', label: 'WiFi', value: 'Вкл' }, { icon: '🔵', label: 'Bluetooth', value: 'Вкл' }] } },

  // ═══ PRODUCTIVITY ═══
  { id: 'calendar', icon: '📅', title: 'Calendar', subtitle: 'Расписание', priority: 'medium', category: 'productivity', size: 'large', infoLoad: 45, connects: ['tasks', 'reminders', 'mail'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Событие' }, { icon: '🔔', label: 'Уведомление' }]), position: pos(-420, 280, 8), widgetData: { events: [{ time: '10:00', title: 'Встреча с командой', color: '#FF3B30' }, { time: '14:00', title: 'Code Review', color: '#007AFF' }, { time: '16:00', title: 'Спринт', color: '#34C759' }] } },

  { id: 'tasks', icon: '✅', title: 'Reminders', subtitle: 'Задачи и списки', priority: 'medium', category: 'productivity', size: 'medium', infoLoad: 55, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }, { icon: '📋', label: 'Списки' }]), position: pos(450, -80, 7), widgetData: { items: [{ icon: '○', label: 'Купить продукты', value: '' }, { icon: '○', label: 'Позвонить маме', value: '' }, { icon: '●', label: 'Отправить отчёт', value: '✓' }], unread: 5 } },

  { id: 'notes', icon: '📝', title: 'Notes', subtitle: 'Заметки', priority: 'medium', category: 'productivity', size: 'small', infoLoad: 40, connects: ['memory-bank', 'files'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Новая' }, { icon: '📤', label: 'Экспорт' }]), position: pos(-480, -260, 6), widgetData: { unread: 23, items: [{ icon: '📝', label: 'Идеи для проекта...', value: '' }] } },

  { id: 'reminders', icon: '⏰', title: 'Clock', subtitle: 'Часы и таймеры', priority: 'low', category: 'productivity', size: 'small', infoLoad: 20, connects: ['calendar'], miniWidgets: createMiniWidgets([{ icon: '⏰', label: 'Будильник' }]), position: pos(-240, 420, 4), widgetData: { items: [{ icon: '⏰', label: '07:00', value: 'Пн-Пт' }] } },

  { id: 'files', icon: '📁', title: 'Files', subtitle: 'Файловый менеджер', priority: 'medium', category: 'productivity', size: 'small', infoLoad: 35, connects: ['memory-bank', 'notes'], miniWidgets: createMiniWidgets([{ icon: '📂', label: 'Папки' }, { icon: '☁️', label: 'iCloud' }]), position: pos(240, 360, 5), widgetData: { unread: 3, items: [{ icon: '📄', label: 'Отчёт.pdf', value: '' }] } },

  { id: 'shortcuts', icon: '⚡', title: 'Shortcuts', subtitle: 'Автоматизации', priority: 'medium', category: 'productivity', size: 'medium', infoLoad: 50, connects: ['siri', 'homekit'], miniWidgets: createMiniWidgets([{ icon: '🔄', label: 'Сценарий' }, { icon: '▶️', label: 'Запуск' }]), position: pos(520, 240, 6), widgetData: { items: [{ icon: '🏠', label: 'Дом', value: '' }, { icon: '🚗', label: 'В путь', value: '' }, { icon: '📊', label: 'Отчёт', value: '' }, { icon: '🔋', label: 'Экономия', value: '' }] } },

  { id: 'freeform', icon: '🎨', title: 'Freeform', subtitle: 'Доска идей', priority: 'low', category: 'productivity', size: 'small', infoLoad: 25, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '✏️', label: 'Рисование' }]), position: pos(-560, 100, 3), widgetData: { items: [{ icon: '🎨', label: 'Доска #1', value: '' }] } },

  // ═══ COMMUNICATION ═══
  { id: 'messages', icon: '💬', title: 'Messages', subtitle: 'iMessage', priority: 'high', category: 'communication', size: 'medium', infoLoad: 65, connects: ['lmm-core', 'facetime', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '✉️', label: 'Новое' }, { icon: '📎', label: 'Медиа' }]), position: pos(380, 320, 10), widgetData: { unread: 3, items: [{ icon: '👤', label: 'Мама', value: 'Привет! Как дела?' }, { icon: '👥', label: 'Работа', value: 'Встреча в 15:00' }, { icon: '👤', label: 'Анна', value: 'Фото 📷' }] } },

  { id: 'mail', icon: '📧', title: 'Mail', subtitle: 'Почта', priority: 'medium', category: 'communication', size: 'medium', infoLoad: 58, connects: ['messages', 'calendar', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📨', label: 'Входящие' }, { icon: '📤', label: 'Отправить' }]), position: pos(540, -220, 8), widgetData: { unread: 12, items: [{ icon: '📩', label: 'Ivan', value: 'Привет! Как...' }, { icon: '📩', label: 'Team', value: 'Meeting tomorrow...' }, { icon: '📩', label: 'Apple', value: 'Your receipt...' }] } },

  { id: 'facetime', icon: '📹', title: 'FaceTime', subtitle: 'Видеозвонки', priority: 'medium', category: 'communication', size: 'small', infoLoad: 30, connects: ['messages', 'contacts'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }, { icon: '👥', label: 'Группа' }]), position: pos(200, 450, 9), widgetData: { items: [{ icon: '📹', label: 'Мама', value: 'Вчера' }] } },

  { id: 'phone', icon: '📱', title: 'Phone', subtitle: 'Телефон', priority: 'high', category: 'communication', size: 'small', infoLoad: 42, connects: ['contacts', 'facetime'], miniWidgets: createMiniWidgets([{ icon: '📞', label: 'Вызов' }]), position: pos(-120, -420, 7), widgetData: { unread: 2, items: [{ icon: '📞', label: 'Пропущено', value: '2' }] } },

  { id: 'contacts', icon: '👤', title: 'Contacts', subtitle: 'Контакты', priority: 'low', category: 'communication', size: 'small', infoLoad: 22, connects: ['messages', 'mail', 'phone'], miniWidgets: createMiniWidgets([{ icon: '➕', label: 'Добавить' }]), position: pos(80, -340, 5), widgetData: { items: [{ icon: '👤', label: 'Мама', value: '📞 💬' }] } },

  // ═══ MEDIA & ENTERTAINMENT ═══
  { id: 'photos', icon: '📷', title: 'Photos', subtitle: 'Фотографии', priority: 'medium', category: 'media', size: 'large', infoLoad: 75, connects: ['memory-bank', 'neural-engine', 'camera'], miniWidgets: createMiniWidgets([{ icon: '🖼️', label: 'Галерея' }, { icon: '🤖', label: 'AI ретушь' }]), position: pos(-520, -140, 6), widgetData: { items: [{ icon: '🖼️', label: 'Все фото', value: '12,847' }, { icon: '📹', label: 'Видео', value: '234' }, { icon: '❤️', label: 'Избранное', value: '89' }, { icon: '🤖', label: 'Воспоминания', value: '12' }] } },

  { id: 'camera', icon: '📸', title: 'Camera', subtitle: 'Камера', priority: 'medium', category: 'media', size: 'small', infoLoad: 60, connects: ['photos', 'neural-engine'], miniWidgets: createMiniWidgets([{ icon: '🎞️', label: 'Видео' }, { icon: '🌃', label: 'Ночь' }]), position: pos(-380, -380, 8), widgetData: { items: [{ icon: '📸', label: 'Фото', value: '' }] } },

  { id: 'music', icon: '🎵', title: 'Apple Music', subtitle: 'Музыка', priority: 'medium', category: 'media', size: 'medium', infoLoad: 70, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '▶️', label: 'Плей' }, { icon: '📻', label: 'Радио' }]), position: pos(580, 80, 5), widgetData: { progress: 65, items: [{ icon: '🎵', label: 'Bohemian Rhapsody', value: 'Queen' }, { icon: '⏱️', label: '3:42', value: '5:55' }] } },

  { id: 'podcasts', icon: '🎙️', title: 'Podcasts', subtitle: 'Подкасты', priority: 'low', category: 'media', size: 'small', infoLoad: 35, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎧', label: 'Слушать' }]), position: pos(480, 400, 4), widgetData: { items: [{ icon: '🎙️', label: 'The Daily', value: '' }] } },

  { id: 'tv', icon: '📺', title: 'Apple TV+', subtitle: 'Видео и фильмы', priority: 'low', category: 'media', size: 'small', infoLoad: 45, connects: ['music'], miniWidgets: createMiniWidgets([{ icon: '🎬', label: 'Каталог' }]), position: pos(-580, 320, 3), widgetData: { items: [{ icon: '🎬', label: 'Severance', value: '' }] } },

  { id: 'books', icon: '📚', title: 'Books', subtitle: 'Книги', priority: 'low', category: 'media', size: 'small', infoLoad: 28, connects: ['notes'], miniWidgets: createMiniWidgets([{ icon: '📖', label: 'Читать' }]), position: pos(-440, 450, 3), widgetData: { progress: 42, items: [{ icon: '📖', label: 'Дюна', value: '42%' }] } },

  { id: 'news', icon: '📰', title: 'News', subtitle: 'Новости', priority: 'low', category: 'media', size: 'medium', infoLoad: 50, connects: ['siri'], miniWidgets: createMiniWidgets([{ icon: '📋', label: 'Лента' }]), position: pos(320, -380, 4), widgetData: { items: [{ icon: '📰', label: 'Apple представила...', value: 'Tech' }, { icon: '🌍', label: 'SpaceX запустила...', value: 'Science' }, { icon: '📈', label: 'Рынки растут...', value: 'Finance' }] } },

  // ═══ UTILITIES & SERVICES ═══
  { id: 'weather', icon: '🌤️', title: 'Weather', subtitle: 'Москва', priority: 'medium', category: 'utilities', size: 'large', infoLoad: 40, connects: ['calendar', 'siri'], miniWidgets: createMiniWidgets([{ icon: '📍', label: 'Локация' }, { icon: '🌡️', label: 'Прогноз' }]), position: pos(140, -480, 5), widgetData: { 
    temperature: 22, tempHigh: 26, tempLow: 18, condition: 'Солнечно', humidity: 45, wind: 3, feelsLike: 21, precipitation: 0,
    hourlyForecast: [
      { time: '12:00', temp: 22, icon: '☀️' }, { time: '13:00', temp: 23, icon: '🌤️' },
      { time: '14:00', temp: 24, icon: '☀️' }, { time: '15:00', temp: 25, icon: '☀️' },
      { time: '16:00', temp: 24, icon: '🌤️' },
    ]
  }},

  { id: 'maps', icon: '🗺️', title: 'Maps', subtitle: 'Карты Apple', priority: 'medium', category: 'utilities', size: 'medium', infoLoad: 55, connects: ['weather', 'siri'], miniWidgets: createMiniWidgets([{ icon: '🧭', label: 'Навигация' }, { icon: '📍', label: 'Места' }]), position: pos(-60, 500, 6), widgetData: { items: [{ icon: '🏠', label: 'Дом', value: '15 мин' }, { icon: '🏢', label: 'Работа', value: '35 мин' }, { icon: '🚦', label: 'Пробки', value: 'Немного' }] } },

  { id: 'wallet', icon: '💳', title: 'Wallet', subtitle: 'Apple Pay', priority: 'medium', category: 'utilities', size: 'small', infoLoad: 38, connects: ['safari'], miniWidgets: createMiniWidgets([{ icon: '💵', label: 'Оплата' }, { icon: '🎫', label: 'Билеты' }]), position: pos(620, -100, 4), widgetData: { items: [{ icon: '💳', label: '•••• 4532', value: '₽15,420' }] } },

  { id: 'health', icon: '❤️', title: 'Health', subtitle: 'Здоровье', priority: 'medium', category: 'utilities', size: 'large', infoLoad: 65, connects: ['fitness', 'siri'], miniWidgets: createMiniWidgets([{ icon: '💓', label: 'Пульс' }, { icon: '🏃', label: 'Шаги' }]), position: pos(-260, -500, 7), widgetData: { steps: 8432, calories: 542, progress: 84, exerciseMinutes: 25, standHours: 8, items: [{ icon: '❤️', label: 'Пульс', value: '72 уд/мин' }, { icon: '😴', label: 'Сон', value: '7.5 ч' }, { icon: '🚶', label: 'Дистанция', value: '5.2 км' }] } },

  { id: 'fitness', icon: '🏋️', title: 'Fitness', subtitle: 'Apple Fitness+', priority: 'low', category: 'utilities', size: 'medium', infoLoad: 48, connects: ['health'], miniWidgets: createMiniWidgets([{ icon: '🎯', label: 'Цели' }]), position: pos(-500, -440, 4), widgetData: { calories: 542, progress: 54, exerciseMinutes: 25, standHours: 8, items: [{ icon: '🔥', label: 'Движение', value: '542/1000' }, { icon: '💚', label: 'Упражнения', value: '25/30' }, { icon: '🩵', label: 'Вставание', value: '8/12' }] } },

  { id: 'safari', icon: '🧭', title: 'Safari', subtitle: 'Веб-браузер', priority: 'high', category: 'utilities', size: 'medium', infoLoad: 72, connects: ['lmm-core', 'wallet'], miniWidgets: createMiniWidgets([{ icon: '🔍', label: 'Поиск' }, { icon: '📑', label: 'Вкладки' }]), position: pos(-620, 0, 8), widgetData: { unread: 7, items: [{ icon: '📑', label: 'Вкладки', value: '7 открыто' }, { icon: '📖', label: 'Список чтения', value: '3' }, { icon: '⭐', label: 'Избранное', value: '12' }] } },

  { id: 'appstore', icon: '🛍️', title: 'App Store', subtitle: 'Магазин приложений', priority: 'medium', category: 'utilities', size: 'small', infoLoad: 42, connects: [], miniWidgets: createMiniWidgets([{ icon: '⬇️', label: 'Загрузить' }]), position: pos(560, -360, 3), widgetData: { unread: 4, items: [{ icon: '🔄', label: 'Обновления', value: '4' }] } },

  { id: 'homekit', icon: '🏠', title: 'Home', subtitle: 'Умный дом', priority: 'medium', category: 'utilities', size: 'medium', infoLoad: 33, connects: ['siri', 'shortcuts'], miniWidgets: createMiniWidgets([{ icon: '💡', label: 'Свет' }, { icon: '🌡️', label: 'Климат' }]), position: pos(400, 480, 5), widgetData: { items: [{ icon: '💡', label: 'Гостиная', value: 'Вкл' }, { icon: '💡', label: 'Спальня', value: 'Выкл' }, { icon: '🌡️', label: 'Температура', value: '22°C' }] } },

  { id: 'findmy', icon: '📍', title: 'Find My', subtitle: 'Локатор', priority: 'low', category: 'utilities', size: 'small', infoLoad: 25, connects: ['maps'], miniWidgets: createMiniWidgets([{ icon: '📡', label: 'AirTag' }]), position: pos(-600, -260, 3), widgetData: { items: [{ icon: '📱', label: '3 устройства', value: '' }] } },

  { id: 'translate', icon: '🌐', title: 'Translate', subtitle: 'Переводчик', priority: 'low', category: 'utilities', size: 'small', infoLoad: 30, connects: ['siri', 'safari'], miniWidgets: createMiniWidgets([{ icon: '🗣️', label: 'Голос' }]), position: pos(0, 560, 4), widgetData: { items: [{ icon: '🌐', label: 'EN → RU', value: '' }] } },
];

// Connection data — Apple ecosystem relationships
export const INITIAL_CONNECTIONS: ConnectionData[] = [
  { id: 'c1', from: 'lmm-core', to: 'siri', type: 'dataFlow', strength: 1.0 },
  { id: 'c2', from: 'lmm-core', to: 'neural-engine', type: 'dataFlow', strength: 0.95 },
  { id: 'c3', from: 'lmm-core', to: 'memory-bank', type: 'dataFlow', strength: 0.9 },
  { id: 'c4', from: 'lmm-core', to: 'safari', type: 'dataFlow', strength: 0.7 },
  { id: 'c5', from: 'lmm-core', to: 'messages', type: 'logicChain' },
  { id: 'c6', from: 'neural-engine', to: 'photos', type: 'dependency' },
  { id: 'c7', from: 'neural-engine', to: 'camera', type: 'dependency' },
  { id: 'c8', from: 'memory-bank', to: 'notes', type: 'dependency' },
  { id: 'c9', from: 'memory-bank', to: 'files', type: 'dependency' },
  { id: 'c10', from: 'memory-bank', to: 'photos', type: 'dependency' },
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
  { id: 'c21', from: 'siri', to: 'shortcuts', type: 'logicChain' },
  { id: 'c22', from: 'siri', to: 'homekit', type: 'logicChain' },
  { id: 'c23', from: 'siri', to: 'music', type: 'logicChain' },
  { id: 'c24', from: 'siri', to: 'weather', type: 'logicChain' },
  { id: 'c25', from: 'siri', to: 'maps', type: 'logicChain' },
  { id: 'c26', from: 'siri', to: 'health', type: 'logicChain' },
  { id: 'c27', from: 'siri', to: 'news', type: 'logicChain' },
  { id: 'c28', from: 'siri', to: 'translate', type: 'logicChain' },
  { id: 'c29', from: 'weather', to: 'calendar', type: 'causal' },
  { id: 'c30', from: 'health', to: 'fitness', type: 'causal' },
  { id: 'c31', from: 'camera', to: 'photos', type: 'causal' },
  { id: 'c32', from: 'reminders', to: 'calendar', type: 'temporal' },
  { id: 'c33', from: 'photos', to: 'memory-bank', type: 'semantic' },
  { id: 'c34', from: 'books', to: 'notes', type: 'semantic' },
  { id: 'c35', from: 'maps', to: 'weather', type: 'semantic' },
  { id: 'c36', from: 'wallet', to: 'safari', type: 'semantic' },
  { id: 'c37', from: 'findmy', to: 'maps', type: 'semantic' },
  { id: 'c38', from: 'freeform', to: 'notes', type: 'semantic' },
  { id: 'c39', from: 'neural-engine', to: 'lmm-core', type: 'metacognitive' },
  { id: 'c40', from: 'shortcuts', to: 'homekit', type: 'dataFlow', strength: 0.6 },
  { id: 'c41', from: 'translate', to: 'safari', type: 'dependency' },
];
