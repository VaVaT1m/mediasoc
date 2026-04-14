'use strict';

window.MediaSokApi = (() => {
  const data = window.MediaSokData;

  async function api(path, options = {}) {
    const headers = Object.assign(
      {
        'Content-Type': 'application/json'
      },
      options.headers || {}
    );

    const response = await fetch(`${data.API_BASE}${path}`, {
      ...options,
      headers
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
      ? await response.json().catch(() => ({}))
      : await response.text().catch(() => '');

    if (!response.ok) {
      const error = new Error((payload && payload.message) || (payload && payload.error) || 'Ошибка запроса');
      error.payload = payload;
      error.status = response.status;
      throw error;
    }

    return payload;
  }

  return Object.freeze({ api });
})();
