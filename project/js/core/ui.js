'use strict';

window.MediaSokUi = (() => {
  const data = window.MediaSokData;

  function ensureToastRoot() {
    const existing = document.querySelector('.toast-stack');
    if (existing) return existing;
    const root = document.createElement('div');
    root.className = 'toast-stack';
    document.body.appendChild(root);
    return root;
  }

  function showToast(message, variant = 'default') {
    const root = ensureToastRoot();
    const item = document.createElement('div');
    item.className = `toast toast-${variant}`;
    item.textContent = message;
    root.appendChild(item);
    window.setTimeout(() => item.classList.add('toast-visible'), 10);
    window.setTimeout(() => {
      item.classList.remove('toast-visible');
      window.setTimeout(() => item.remove(), 200);
    }, 3200);
  }

  function setCookieAccepted() {
    localStorage.setItem(data.COOKIE_KEY, '1');
    document.querySelector('.cookie-banner')?.remove();
  }

  function ensureCookieBanner() {
    if (localStorage.getItem(data.COOKIE_KEY) === '1') return;
    if (document.querySelector('.cookie-banner')) return;

    const banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML = `
      <div class="cookie-banner__text">Мы используем файлы cookie для защиты от спама. Продолжая использовать сайт, вы соглашаетесь с этим.</div>
      <button class="btn btn-primary cookie-banner__button" type="button">Принять</button>
    `;
    banner.querySelector('button')?.addEventListener('click', setCookieAccepted);
    document.body.appendChild(banner);
  }

  function ensureHowItWorksModal() {
    let overlay = document.querySelector('.how-modal');
    if (overlay) return overlay;

    overlay = document.createElement('div');
    overlay.className = 'how-modal';
    overlay.innerHTML = `
      <div class="how-modal__backdrop" data-close-how></div>
      <div class="how-modal__panel how-modal__panel--custom">
        <div class="how-modal__card">
          <button class="how-modal__close" type="button" aria-label="Закрыть" data-close-how>×</button>
          <div class="how-modal__layout">
            <div class="how-modal__copy">
              <h2 class="how-modal__heading">Как это работает</h2>
              <p class="how-modal__text">«Медиасок» — это простой способ найти полезные инициативы и добавить свою. Все проекты проходят модерацию, чтобы в итоге оставалось только проверенное и актуальное.</p>
              <p class="how-modal__text">Вы можете:</p>
              <ol class="how-modal__list">
                <li>Найти интересующее на главной странице, через поиск или через фильтры.</li>
                <li>Добавить свой проект — заполните форму и отправьте на модерацию, после проверки он появится в общем каталоге.</li>
                <li>Делиться тем, что заинтересовало, помогать другим находить крутые проекты и добавлять свои.</li>
              </ol>
              <button class="btn btn-primary how-modal__confirm" type="button" data-close-how>Понятно</button>
            </div>
            <div class="how-modal__visual" aria-hidden="true">
              <img class="how-modal__sq" src="/assets/sq_main.png" alt="">
            </div>
          </div>
        </div>
      </div>
    `;

    overlay.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-how]')) {
        overlay.classList.remove('is-open');
        document.body.classList.remove('body-locked');
      }
    });

    document.body.appendChild(overlay);
    return overlay;
  }

  function openHowItWorks() {
    const modal = ensureHowItWorksModal();
    modal.classList.add('is-open');
    document.body.classList.add('body-locked');
  }

  function closeHowItWorks() {
    const modal = ensureHowItWorksModal();
    modal.classList.remove('is-open');
    document.body.classList.remove('body-locked');
  }

  function bindGlobalUi() {
    document.querySelectorAll('[data-how-button]').forEach((button) => {
      if (button.dataset.bound === '1') return;
      button.dataset.bound = '1';
      button.addEventListener('click', openHowItWorks);
    });

    const topbar = document.querySelector('.topbar');
    if (topbar && document.body.classList.contains('enable-scroll-topbar')) {
      const handler = () => {
        topbar.classList.toggle('topbar-scrolled', window.scrollY > 140);
      };
      handler();
      window.addEventListener('scroll', handler, { passive: true });
    }

    ensureCookieBanner();

    document.querySelectorAll('img').forEach((img) => img.setAttribute('draggable', 'false'));

    if (!document.body.dataset.dragBound) {
      document.body.dataset.dragBound = '1';
      document.addEventListener('dragstart', (event) => {
        if (event.target instanceof HTMLImageElement) event.preventDefault();
      });
    }
  }

  return Object.freeze({
    showToast,
    ensureCookieBanner,
    ensureHowItWorksModal,
    openHowItWorks,
    closeHowItWorks,
    bindGlobalUi
  });
})();
