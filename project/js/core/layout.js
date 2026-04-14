'use strict';

window.MediaSokLayout = (() => {
  const data = window.MediaSokData;
  const utils = window.MediaSokUtils;
  const ui = window.MediaSokUi;

  function renderSocialLinks(extraClass = '') {
    return `
      <div class="topbar__socials ${extraClass}">
        <a href="mailto:help@mediasoc.ru" class="topbar__social-link" aria-label="Email"><img src="/assets/layout-social/email.png" alt=""></a>
        <a href="https://vk.com/mediasoc_public" target="_blank" rel="noopener noreferrer" class="topbar__social-link" aria-label="VK"><img src="/assets/layout-social/vk.png" alt=""></a>
        <a href="https://t.me/mediasoc_public" target="_blank" rel="noopener noreferrer" class="topbar__social-link" aria-label="Telegram"><img src="/assets/layout-social/tg.png" alt=""></a>
      </div>
    `;
  }

  function renderTopBar(options = {}) {
    const {
      compact = false,
      includeAddButton = false,
      addButtonText = 'Добавить проект',
      mobileSimple = false
    } = options;

    return `
      <div class="topbar ${compact ? 'topbar-compact' : ''} ${mobileSimple ? 'topbar-mobile-simple' : ''}">
        <div class="container topbar__inner">
          <a class="topbar__brand" href="/" aria-label="На главную">
            <img src="/assets/desktop/logo.png" alt="Медиасок">
          </a>
          <div class="topbar__meta"></div>
          <div class="topbar__spacer"></div>
          ${renderSocialLinks()}
          <button class="topbar__ghost topbar__ghost--wide" type="button" data-how-button>Как это работает</button>
          ${includeAddButton ? `<a class="topbar__ghost topbar__ghost-primary topbar__ghost--wide" href="/add-channel">${utils.escapeHtml(addButtonText)}</a>` : ''}
          <div class="topbar__dots" aria-hidden="true"></div>
        </div>
      </div>
    `;
  }

  function renderHomeHero() {
    return `
      <section class="hero hero--home">
        <div class="hero__bg"></div>
        ${renderTopBar({ includeAddButton: true, mobileSimple: true })}
        <div class="container hero__content">
          <h1 class="hero__title">Твоя подборка полезных проектов в одном месте</h1>
          <p class="hero__subtitle">Мы поддерживаем всех, кто создаёт и развивает инициативы на пользу людям — особенно молодых авторов, которые активно пробуют свои силы в различных конкурсах. Чтобы такие проекты не оставались незамеченными, мы собрали их здесь: находите, вдохновляйтесь и подключайтесь.</p>
          <a class="hero__cta" href="/add-channel">Добавить проект</a>
          <button class="hero__mobile-how" type="button" data-how-button>Как это работает</button>
          ${renderSocialLinks('hero__mobile-socials')}
        </div>
      </section>
    `;
  }

  function renderSimpleHero(pageTitle = '', options = {}) {
    const { includeAddButton = false } = options;
    return `
      <section class="simple-hero">
        <div class="simple-hero__bg"></div>
        ${renderTopBar({ compact: true, includeAddButton })}
        ${pageTitle ? `<div class="container simple-hero__title-row"><h1 class="simple-hero__title">${utils.escapeHtml(pageTitle)}</h1></div>` : ''}
      </section>
    `;
  }

  function renderFooter() {
    return `
      <footer class="footer">
        <div class="footer__bg"></div>
        <div class="container footer__inner">
          <div class="footer__left">
            <a href="/" class="footer__brand"><img src="/assets/desktop/logo.png" alt="Медиасок"></a>
            <div class="footer__copy"><a href="https://nordwibe.com" target="_blank" rel="noopener noreferrer">Сделано с Nordwibe</a></div>
          </div>
          <div class="footer__right">
            <button class="topbar__ghost topbar__ghost--wide footer__how" type="button" data-how-button>Как это работает</button>
            <div class="footer__socials">
              <a href="mailto:help@mediasoc.ru" class="topbar__social-link" aria-label="Email"><img src="/assets/layout-social/email.png" alt=""></a>
              <a href="https://vk.com/mediasoc_public" target="_blank" rel="noopener noreferrer" class="topbar__social-link" aria-label="VK"><img src="/assets/layout-social/vk.png" alt=""></a>
              <a href="https://t.me/mediasoc_public" target="_blank" rel="noopener noreferrer" class="topbar__social-link" aria-label="Telegram"><img src="/assets/layout-social/tg.png" alt=""></a>
            </div>
            <div class="footer__links">
              <a href="${data.USER_AGREEMENT_PDF}" target="_blank" rel="noopener noreferrer">Пользовательское соглашение</a>
              <a href="${data.PRIVACY_POLICY_PDF}" target="_blank" rel="noopener noreferrer">Политика конфиденциальности</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  function mountLayout({ hero = 'home', title = '', includeAddButton = false } = {}) {
    const headerRoot = document.querySelector('[data-layout-header]');
    const footerRoot = document.querySelector('[data-layout-footer]');
    if (headerRoot) {
      headerRoot.innerHTML = hero === 'home' ? renderHomeHero() : renderSimpleHero(title, { includeAddButton });
    }
    if (footerRoot) {
      footerRoot.innerHTML = renderFooter();
    }
    ui.bindGlobalUi();
  }

  return Object.freeze({
    renderSocialLinks,
    renderTopBar,
    renderHomeHero,
    renderSimpleHero,
    renderFooter,
    mountLayout
  });
})();
