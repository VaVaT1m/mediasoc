'use strict';

window.MediaSokTemplates = (() => {
  const utils = window.MediaSokUtils;

  function channelCardHtml(channel, index = 0, extraClass = '') {
    const normalized = utils.normalizeChannel(channel, index);
    const channelUrl = utils.channelUrl(normalized.slug);

    return `
      <article class="channel-card ${extraClass}" data-channel-card data-slug="${utils.escapeHtml(normalized.slug)}" data-channel-url="${utils.escapeHtml(channelUrl)}">
        <div class="channel-card__logo-wrap">
          <img class="channel-card__logo channel-card__logo--blob" src="${utils.escapeHtml(normalized.logo || utils.defaultLogo(index))}" alt="${utils.escapeHtml(normalized.name)}">
        </div>
        <h3 class="channel-card__title">${utils.escapeHtml(normalized.name)}</h3>
        <p class="channel-card__description">${utils.escapeHtml(normalized.shortDescription)}</p>
        <div class="channel-card__footer">
          <a class="btn btn-primary channel-card__button" href="${utils.escapeHtml(channelUrl)}" target="_blank" rel="noopener noreferrer">Смотреть</a>
          <div class="channel-card__footer-meta">
            <span class="pill">${utils.escapeHtml(utils.formatImplementation(normalized.implementation))}</span>
            <span class="pill pill-light pill-views"><img src="/assets/custom/eye.png" alt="">${utils.escapeHtml(String(normalized.views || 0))}</span>
          </div>
        </div>
      </article>
    `;
  }

  function emptyStateHtml(message = 'Ничего не найдено. Попробуйте изменить условия поиска.') {
    return `
      <div class="empty-state">
        <h3>Ничего не найдено</h3>
        <p>${utils.escapeHtml(message)}</p>
      </div>
    `;
  }

  function setLoading(root, isLoading) {
    if (!root) return;
    root.classList.toggle('is-loading', Boolean(isLoading));
  }

  return Object.freeze({
    channelCardHtml,
    emptyStateHtml,
    setLoading
  });
})();
