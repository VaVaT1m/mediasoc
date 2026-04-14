'use strict';

window.MediaSokData = (() => {
  const API_BASE = '/api';
  const VIEW_TTL_MS = 24 * 60 * 60 * 1000;
  const COOKIE_KEY = 'mediasok_cookie_accepted';
  const USER_AGREEMENT_PDF = '/docs/user-agreement.pdf';
  const PRIVACY_POLICY_PDF = '/docs/privacy-policy.pdf';
  const VIEW_KEY = 'mediasok_viewed_channels';
  const MOD_TOKEN_KEY = 'mediasok_moderator_token';
  const PENDING_PREVIEW_KEY = 'mediasok_pending_preview';

  const FALLBACK_CHANNELS = [
    {
      id: 'sample-1',
      slug: 'nordwibe',
      name: 'Nordwibe',
      logo: '/assets/uploads/logo1.png',
      shortDescription: 'Сервис по умному поиску соседей для совместной аренды жилья.',
      fullDescription:
        'Сервис по умному поиску соседей для совместной аренды жилья — это современная платформа, которая помогает людям находить подходящих компаньонов для жизни на одной территории. Алгоритм анализирует интересы, привычки, стиль жизни и предпочтения пользователей, предлагая наиболее совместимые пары или группы.',
      category: 'IT-проект',
      nomination: 'Поиск соседа — проще, чем кажется',
      implementation: 'Реализуется',
      regions: ['Курск', 'Москва', 'Санкт-Петербург'],
      contest: 'Название конкурса',
      links: {
        telegram: 'https://t.me/nordwibe',
        vk: 'https://vk.com/nordwibe',
        site: 'https://nordwibe.com'
      },
      contact: {
        telegram: 'https://t.me/vlad_mediasok'
      },
      author: {
        name: 'Сазонов Даниил Александрович',
        socials: {
          telegram: 'https://t.me/daniil'
        },
        visible: true
      },
      views: 120,
      status: 'approved',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'sample-2',
      slug: 'longer-card-title-designed-for-an-85-symbol-name',
      name: 'Longer Card Title Designed for an 85-symbol name',
      logo: '/assets/uploads/logo2.png',
      shortDescription: 'Фестиваль молодёжных медиаформатов и авторских документальных историй.',
      fullDescription:
        'Открытая площадка для молодых команд, где можно показать свой проект, найти единомышленников и получить обратную связь от профессионального сообщества.',
      category: 'Фестиваль',
      nomination: 'Лучший социальный проект',
      implementation: 'Реализован',
      regions: ['Всероссийский'],
      contest: 'Спасибо!',
      links: {
        site: 'https://example.com'
      },
      contact: {
        email: 'mailto:hello@example.com'
      },
      author: {
        name: '',
        socials: {},
        visible: false
      },
      views: 87,
      status: 'approved',
      dateAdded: new Date().toISOString()
    },
    {
      id: 'sample-3',
      slug: 'media-school',
      name: 'Медиашкола',
      logo: '/assets/uploads/logo3.png',
      shortDescription: 'Образовательная программа для редакторов, блогеров и команд молодёжных медиа.',
      fullDescription:
        'Практические интенсивы по работе с контентом, визуальным стилем, аналитикой и продвижением медиапроектов.',
      category: 'Форум',
      nomination: 'Лучшее образовательное решение',
      implementation: 'Бессрочно',
      regions: ['Курск'],
      contest: 'Название конкурса',
      links: {
        telegram: 'https://t.me/mediaschool'
      },
      contact: {
        vk: 'https://vk.com/mediaschool'
      },
      author: {
        name: 'Автор скрыт',
        socials: {},
        visible: false
      },
      views: 54,
      status: 'approved',
      dateAdded: new Date().toISOString()
    }
  ];

  const ALL_REGIONS = [
    'Всероссийский',
    'Международный',
    'Республика Адыгея',
    'Республика Башкортостан',
    'Республика Бурятия',
    'Республика Алтай',
    'Республика Дагестан',
    'Республика Ингушетия',
    'Кабардино-Балкарская Республика',
    'Республика Калмыкия',
    'Республика Карачаево-Черкесия',
    'Республика Карелия',
    'Республика Коми',
    'Республика Марий Эл',
    'Республика Мордовия',
    'Республика Саха (Якутия)',
    'Республика Северная Осетия-Алания',
    'Республика Татарстан',
    'Республика Тыва',
    'Удмуртская Республика',
    'Республика Хакасия',
    'Чеченская Республика',
    'Чувашская Республика',
    'Алтайский край',
    'Краснодарский край',
    'Красноярский край',
    'Приморский край',
    'Ставропольский край',
    'Хабаровский край',
    'Амурская область',
    'Архангельская область',
    'Астраханская область',
    'Белгородская область',
    'Брянская область',
    'Владимирская область',
    'Волгоградская область',
    'Вологодская область',
    'Воронежская область',
    'Ивановская область',
    'Иркутская область',
    'Калининградская область',
    'Калужская область',
    'Камчатский край',
    'Кемеровская область',
    'Кировская область',
    'Костромская область',
    'Курганская область',
    'Курская область',
    'Ленинградская область',
    'Липецкая область',
    'Магаданская область',
    'Московская область',
    'Мурманская область',
    'Нижегородская область',
    'Новгородская область',
    'Новосибирская область',
    'Омская область',
    'Оренбургская область',
    'Орловская область',
    'Пензенская область',
    'Пермский край',
    'Псковская область',
    'Ростовская область',
    'Рязанская область',
    'Самарская область',
    'Саратовская область',
    'Сахалинская область',
    'Свердловская область',
    'Смоленская область',
    'Тамбовская область',
    'Тверская область',
    'Томская область',
    'Тульская область',
    'Тюменская область',
    'Ульяновская область',
    'Челябинская область',
    'Забайкальский край',
    'Ярославская область',
    'г. Москва',
    'г. Санкт-Петербург',
    'Еврейская автономная область',
    'Ненецкий автономный округ',
    'Ханты-Мансийский автономный округ - Югра',
    'Чукотский автономный округ',
    'Ямало-Ненецкий автономный округ',
    'Республика Крым',
    'г. Севастополь',
    'Донецкая Народная Республика (ДНР)',
    'Луганская Народная Республика (ЛНР)',
    'Запорожская область',
    'Херсонская область'
  ];

  const SOCIAL_META = {
    telegram: { short: 'TG', label: 'Telegram', cls: 'tg' },
    vk: { short: 'VK', label: 'VK', cls: 'vk' },
    youtube: { short: 'YT', label: 'YouTube', cls: 'yt' },
    site: { short: 'WEB', label: 'Сайт', cls: 'site' },
    email: { short: 'Email', label: 'Email', cls: 'mail' },
    phone: { short: 'Телефон', label: 'Телефон', cls: 'phone' },
    max: { short: 'MAX', label: 'MAX', cls: 'max' }
  };

  return Object.freeze({
    API_BASE,
    VIEW_TTL_MS,
    COOKIE_KEY,
    USER_AGREEMENT_PDF,
    PRIVACY_POLICY_PDF,
    VIEW_KEY,
    MOD_TOKEN_KEY,
    PENDING_PREVIEW_KEY,
    FALLBACK_CHANNELS,
    ALL_REGIONS,
    SOCIAL_META
  });
})();
