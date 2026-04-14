'use strict';

window.MediaSokAddChannel = (() => {
  function createContext(app, options = {}) {
    const params = new URLSearchParams(window.location.search);
    const editSlug = options.editSlug ?? params.get('edit') ?? '';
    const moderationMode = options.moderationMode ?? params.get('mode') === 'moderation';
    const rawToken = options.token ?? app.getStoredToken();
    const token = moderationMode && app.isTokenFresh(rawToken) ? rawToken : '';

    if (moderationMode && rawToken && !token) {
      app.setStoredToken('');
    }

    const fields = {
      name: document.getElementById('name-input'),
      contest: document.getElementById('contest-select'),
      contestCustom: document.getElementById('contest-custom'),
      category: document.getElementById('category-select'),
      categoryCustom: document.getElementById('category-custom'),
      fullDescription: document.getElementById('full-description'),
      startDate: document.getElementById('start-date'),
      endDate: document.getElementById('end-date'),
      shortDescription: document.getElementById('short-description'),
      nomination: document.getElementById('nomination-input'),
      nominationCustom: document.getElementById('nomination-custom'),
      authorName: document.getElementById('author-name'),
      contactName: document.getElementById('contact-name'),
      agreement1: document.getElementById('agreement-1'),
      agreement2: document.getElementById('agreement-2')
    };

    const linkFields = {
      project: {
        telegram: document.getElementById('project-telegram'),
        vk: document.getElementById('project-vk'),
        youtube: document.getElementById('project-youtube'),
        site: document.getElementById('project-site')
      },
      author: {
        telegram: document.getElementById('author-telegram'),
        vk: document.getElementById('author-vk'),
        site: document.getElementById('author-site')
      },
      contact: {
        telegram: document.getElementById('contact-telegram'),
        vk: document.getElementById('contact-vk'),
        email: document.getElementById('contact-email'),
        phone: document.getElementById('contact-phone')
      }
    };

    const elements = {
      form: document.getElementById('channel-form'),
      logoPreview: document.getElementById('logo-preview'),
      contestList: document.getElementById('contest-list'),
      categoryList: document.getElementById('category-list'),
      nominationList: document.getElementById('nomination-list'),
      implementationDates: document.getElementById('implementation-dates'),
      stockModal: document.getElementById('stock-modal'),
      stockGrid: document.getElementById('stock-grid'),
      successModal: document.getElementById('success-modal'),
      errorsRoot: document.getElementById('form-errors'),
      moderationNotice: document.getElementById('moderation-notice'),
      projectLinksSummary: document.getElementById('project-links-summary'),
      regionSummary: document.getElementById('region-summary'),
      regionsGrid: document.getElementById('regions-grid'),
      regionDropdown: document.getElementById('region-dropdown'),
      regionSearchInput: document.getElementById('region-search-input'),
      formHint: document.getElementById('form-hint'),
      exactCanvas: document.getElementById('exact-add-canvas'),
      stockOpenButton: document.getElementById('open-stock-modal'),
      stockApplyButton: document.getElementById('apply-stock-button'),
      logoFileInput: document.getElementById('logo-file-input'),
      projectLinksModal: document.getElementById('project-links-modal'),
      authorLinksModal: document.getElementById('author-links-modal'),
      contactLinksModal: document.getElementById('contact-links-modal'),
      addCustomRegionButton: document.getElementById('add-custom-region'),
      captchaContainer: document.getElementById('captcha-container')
    };

    const state = {
      contests: [],
      categories: ['Форум', 'Фестиваль', 'IT-проект', 'Мероприятие', 'Социальный проект', 'Медиа и журналистика', 'Образование', 'Спорт', 'Патриотические проекты', 'Волонтерство'],
      nominations: [],
      regions: [...app.ALL_REGIONS],
      selectedRegions: [],
      selectedStock: '',
      logo: '',
      currentStatus: 'pending'
    };

    return {
      app,
      editSlug,
      moderationMode,
      token,
      params,
      state,
      fields,
      linkFields,
      elements
    };
  }

  function updateExactFormScale() {
    const mobile = window.matchMedia('(max-width: 767px)').matches;
    const viewport = window.innerWidth || document.documentElement.clientWidth || 0;
    const scale = mobile ? 1 : Math.min(1, Math.max(0.1, (viewport - 40) / 1110));
    document.documentElement.style.setProperty('--exact-form-scale', String(scale));
  }

  function initializePage(ctx) {
    localStorage.setItem('mediasok_cookie_accepted', '1');
    document.body.classList.toggle('moderation-edit-mode', ctx.moderationMode);
    ctx.app.mountLayout({ hero: 'simple', title: '' });

    if (ctx.moderationMode) {
      document.querySelector('.exact-captcha-wrap')?.remove();
      document.querySelectorAll('.exact-agreement').forEach((node) => node.remove());
      ctx.elements.errorsRoot?.classList.add('exact-errors--moderation');
      if (ctx.elements.moderationNotice) {
        ctx.elements.moderationNotice.classList.remove('hidden');
        ctx.elements.moderationNotice.textContent = ctx.editSlug
          ? 'Режим модерации: сохранение отправляет изменения в backend.'
          : 'Режим модерации: можно открыть карточку по ссылке вида /add-channel?edit=<slug>&mode=moderation.';
      }
    } else if (ctx.elements.moderationNotice) {
      ctx.elements.moderationNotice.classList.remove('hidden');
      ctx.elements.moderationNotice.textContent = 'Заполните обязательные поля. После отправки заявка будет проверена модератором. Публикация занимает до 3 рабочих дней.';
    }

    updateExactFormScale();
    window.addEventListener('resize', updateExactFormScale);
  }

  function setLogo(ctx, url) {
    ctx.state.logo = url || '';
    if (ctx.elements.logoPreview) {
      ctx.elements.logoPreview.src = ctx.state.logo || '/assets/form-screen/vector-placeholder.png';
    }
  }

  function authorVisible() {
    return document.querySelector('input[name="author-visible"][value="show"]')?.checked !== false;
  }

  function toggleAuthorVisible(ctx) {
    const show = document.querySelector('input[name="author-visible"][value="show"]');
    const hide = document.querySelector('input[name="author-visible"][value="hide"]');
    if (!show || !hide) return;

    const next = !show.checked;
    show.checked = next;
    hide.checked = !next;
    document.querySelector('[data-toggle-author-visibility]')?.classList.toggle('is-dimmed', !next);
    ctx.app.showToast(next ? 'Автор проекта будет виден на странице проекта.' : 'Автор скрыт от публичного просмотра.', 'success');
  }

  function implementationValue() {
    return document.querySelector('input[name="implementation-main"]:checked')?.value || 'Реализуется';
  }

  function syncPills() {
    document.querySelectorAll('.exact-pill').forEach((pill) => {
      const input = pill.querySelector('input');
      pill.classList.toggle('is-active', Boolean(input?.checked));
    });
  }

  function visibleProjectInputs() {
    return document.querySelectorAll('[data-sync-target]');
  }

  function currentContestValue(ctx) {
    return ctx.fields.contest.value === '__custom'
      ? ctx.fields.contestCustom.value.trim()
      : ctx.fields.contest.value.trim();
  }

  function currentCategoryValue(ctx) {
    return ctx.fields.category.value === '__custom'
      ? ctx.fields.categoryCustom.value.trim()
      : ctx.fields.category.value.trim();
  }

  function currentNominationValue(ctx) {
    return (ctx.fields.nomination.value || ctx.fields.nominationCustom.value || '').trim().slice(0, 25);
  }

  function updateDesktopOffsets(ctx, openKind = '') {
    const canvas = ctx.elements.exactCanvas;
    if (!canvas) return;
    canvas.classList.remove('has-author-links', 'has-contact-links');
    if (window.innerWidth < 768) return;
    if (openKind === 'author') canvas.classList.add('has-author-links');
    if (openKind === 'contact') canvas.classList.add('has-contact-links');
  }

  function clearFieldError(element) {
    element?.classList.remove('field-invalid');
    if (element?.querySelector) {
      element.querySelectorAll('input, textarea').forEach((item) => item.classList.remove('field-invalid'));
    }
  }

  function markFieldError(element) {
    element?.classList.add('field-invalid');
    if (element?.matches && element.matches('input, textarea')) {
      element.classList.add('field-invalid');
    }
  }

  function resetFieldErrors() {
    document.querySelectorAll('.field-invalid').forEach((item) => item.classList.remove('field-invalid'));
  }

  function updateHint(ctx) {
    if (ctx.elements.formHint) ctx.elements.formHint.textContent = '';
  }

  function closeRegionDropdown(ctx) {
    ctx.elements.regionDropdown?.classList.add('hidden');
    clearFieldError(ctx.elements.regionSummary);
    updateHint(ctx);
  }

  function syncImplementationDates(ctx) {
    const showDates = implementationValue() === 'Реализуется';
    ctx.elements.implementationDates?.classList.toggle('hidden', !showDates);
    ctx.elements.exactCanvas?.classList.toggle('has-dates', showDates);
  }

  return {
    createContext,
    initializePage,
    updateExactFormScale,
    setLogo,
    authorVisible,
    toggleAuthorVisible,
    implementationValue,
    syncPills,
    visibleProjectInputs,
    currentContestValue,
    currentCategoryValue,
    currentNominationValue,
    updateDesktopOffsets,
    clearFieldError,
    markFieldError,
    resetFieldErrors,
    updateHint,
    closeRegionDropdown,
    syncImplementationDates
  };
})();
