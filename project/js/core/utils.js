'use strict';

window.MediaSokUtils = (() => {
  const data = window.MediaSokData;

  function escapeHtml(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function safeDecode(value) {
    try {
      return decodeURIComponent(String(value || ''));
    } catch {
      return String(value || '');
    }
  }

  function slugFromPath() {
    const parts = window.location.pathname.split('/').filter(Boolean);
    return safeDecode(parts[parts.length - 1] || '');
  }

  function queryParam(name) {
    return safeDecode(new URLSearchParams(window.location.search).get(name) || '');
  }

  function channelIdentifierFromLocation() {
    return queryParam('slug') || slugFromPath();
  }

  function channelUrl(slug) {
    const value = String(slug || '').trim();
    return value ? `/channel.html?slug=${encodeURIComponent(value)}` : '/channel.html';
  }

  function moderationEditUrl(slug) {
    const value = String(slug || '').trim();
    return value ? `/add-channel.html?edit=${encodeURIComponent(value)}&mode=moderation` : '/add-channel.html?mode=moderation';
  }

  function normalizeChannel(channel, index = 0) {
    const source = channel || {};
    const author = source.author || (source.meta && source.meta.author) || {};

    return {
      id: source.id || `fallback-${index}`,
      slug: source.slug || source.id || `fallback-${index}`,
      name: source.name || 'Без названия',
      logo: source.logo || '',
      shortDescription: source.shortDescription || source.short_description || '',
      fullDescription: source.fullDescription || source.full_description || '',
      views: Number(source.views || 0),
      category: source.category || '',
      nomination: source.nomination || '',
      implementation: source.implementation || 'Реализуется',
      startDate: source.startDate || source.start_date || '',
      endDate: source.endDate || source.end_date || '',
      regions: Array.isArray(source.regions) ? source.regions : [],
      contest: source.contest || '',
      links: source.links || {},
      contact: source.contact || {},
      author: {
        name: author.name || '',
        socials: author.socials || {},
        visible: author.visible !== false
      },
      status: String(source.status || 'approved').toLowerCase(),
      dateAdded: source.dateAdded || source.date_added || '',
      moderatorId: source.moderatorId || source.moderator_id || '',
      dateModerated: source.dateModerated || source.date_moderated || ''
    };
  }

  function defaultLogo(index = 0) {
    const logoNumber = (index % 15) + 1;
    return `/uploads/logo${logoNumber}.png`;
  }

  function normalizeUrl(value, type = 'site') {
    const raw = String(value || '').trim();
    if (!raw) return '';

    if (/^(mailto:|tel:)/i.test(raw)) return raw;
    if (/^https?:\/\//i.test(raw)) return raw;

    if (type === 'email') return `mailto:${raw.replace(/^mailto:/i, '')}`;
    if (type === 'phone') return `tel:${raw.replace(/^tel:/i, '').replace(/\s+/g, '')}`;

    if (type === 'telegram') {
      if (raw.startsWith('@')) return `https://t.me/${raw.slice(1)}`;
      if (/^t\.me\//i.test(raw)) return `https://${raw}`;
      return `https://t.me/${raw.replace(/^\/+/, '')}`;
    }

    if (type === 'vk') {
      const normalized = raw.replace(/^@/, '');
      if (/^vk\.com\//i.test(normalized)) return `https://${normalized}`;
      return `https://vk.com/${normalized.replace(/^\/+/, '')}`;
    }

    if (type === 'youtube') {
      if (/^(youtu\.be|youtube\.com)\//i.test(raw)) return `https://${raw}`;
      return `https://youtube.com/${raw.replace(/^\/+/, '')}`;
    }

    return `https://${raw.replace(/^\/+/, '')}`;
  }

  function isLinkValidForType(value, type) {
    if (!value) return true;
    const raw = String(value).trim();
    if (!raw) return true;

    if (type === 'telegram') return /^(@|https?:\/\/t\.me\/|t\.me\/)/i.test(raw);
    if (type === 'vk') return /^(@|https?:\/\/vk\.com\/|vk\.com\/)/i.test(raw);
    if (type === 'max') return /^(@|https?:\/\/max\.ru\/|max\.ru\/)/i.test(raw);
    if (type === 'youtube') return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i.test(raw);
    if (type === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw.replace(/^mailto:/i, ''));
    if (type === 'phone') return /^[+()\-\d\s]{6,}$/.test(raw.replace(/^tel:/i, ''));
    return /^(https?:\/\/)?[\w.-]+\.[a-z]{2,}/i.test(raw);
  }

  function socialEntries(sourceObject) {
    return Object.entries(sourceObject || {})
      .filter(([key, value]) => key in data.SOCIAL_META && String(value || '').trim())
      .map(([key, value]) => ({
        key,
        href: normalizeUrl(value, key),
        meta: data.SOCIAL_META[key]
      }));
  }

  function socialLinksHtml(sourceObject, extraClass = '') {
    const entries = socialEntries(sourceObject);
    if (!entries.length) return '';

    return `<div class="social-row ${extraClass}">${entries.map((entry) => `
      <a class="social-chip social-${entry.meta.cls}" href="${escapeHtml(entry.href)}" target="_blank" rel="noopener noreferrer" aria-label="${escapeHtml(entry.meta.label)}">${escapeHtml(entry.meta.short)}</a>
    `).join('')}</div>`;
  }

  function formatImplementation(value) {
    if (!value) return 'Реализуется';
    const map = {
      active: 'Реализуется',
      done: 'Реализован',
      endless: 'Бессрочно'
    };
    return map[value] || value;
  }

  function decodeBase64Url(value) {
    const normalized = String(value || '')
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(String(value || '').length / 4) * 4, '=');

    const binary = window.atob(normalized);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function parseJwtPayload(token) {
    const value = String(token || '').trim();
    if (!value) return null;

    const parts = value.split('.');
    if (parts.length < 2) return null;

    try {
      return JSON.parse(decodeBase64Url(parts[1]));
    } catch {
      return null;
    }
  }

  function isTokenFresh(token, skewSeconds = 30) {
    const payload = parseJwtPayload(token);
    if (!payload) return false;
    if (typeof payload.exp !== 'number') return true;
    const now = Math.floor(Date.now() / 1000);
    return payload.exp > now + skewSeconds;
  }

  return Object.freeze({
    escapeHtml,
    safeDecode,
    slugFromPath,
    queryParam,
    channelIdentifierFromLocation,
    channelUrl,
    moderationEditUrl,
    normalizeChannel,
    defaultLogo,
    normalizeUrl,
    isLinkValidForType,
    socialEntries,
    socialLinksHtml,
    formatImplementation,
    parseJwtPayload,
    isTokenFresh
  });
})();
