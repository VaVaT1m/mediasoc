'use strict';

window.MediaSokStorage = (() => {
  const data = window.MediaSokData;

  function getStoredToken() {
    return localStorage.getItem(data.MOD_TOKEN_KEY) || '';
  }

  function setStoredToken(value) {
    if (!value) localStorage.removeItem(data.MOD_TOKEN_KEY);
    else localStorage.setItem(data.MOD_TOKEN_KEY, value);
  }

  function getStoredPendingPreview() {
    try {
      return JSON.parse(localStorage.getItem(data.PENDING_PREVIEW_KEY) || 'null');
    } catch {
      return null;
    }
  }

  function setStoredPendingPreview(value) {
    localStorage.setItem(data.PENDING_PREVIEW_KEY, JSON.stringify(value));
  }

  function clearStoredPendingPreview() {
    localStorage.removeItem(data.PENDING_PREVIEW_KEY);
  }

  function viewedMap() {
    try {
      return JSON.parse(localStorage.getItem(data.VIEW_KEY) || '{}');
    } catch {
      return {};
    }
  }

  function shouldIncreaseView(slug) {
    const map = viewedMap();
    const ts = Number(map[slug] || 0);
    return !ts || Date.now() - ts > data.VIEW_TTL_MS;
  }

  function markViewed(slug) {
    const map = viewedMap();
    map[slug] = Date.now();
    localStorage.setItem(data.VIEW_KEY, JSON.stringify(map));
  }

  return Object.freeze({
    getStoredToken,
    setStoredToken,
    getStoredPendingPreview,
    setStoredPendingPreview,
    clearStoredPendingPreview,
    shouldIncreaseView,
    markViewed
  });
})();
