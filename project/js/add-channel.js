'use strict';

(() => {
  const app = window.MediaSok;
  const form = window.MediaSokAddChannel;
  const params = new URLSearchParams(window.location.search);
  const ctx = form.createContext(app, {
    editSlug: params.get('edit') || '',
    moderationMode: params.get('mode') === 'moderation',
    token: app.getStoredToken()
  });

  form.initializePage(ctx);

  function openBodyLockedModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('is-open');
    document.body.classList.add('body-locked');
  }

  function closeBodyLockedModal(modal) {
    if (!modal) return;
    modal.classList.add('hidden');
    modal.classList.remove('is-open');
    document.body.classList.remove('body-locked');
  }

  function bindStockModal() {
    ctx.elements.stockOpenButton?.addEventListener('click', () => {
      ctx.elements.stockModal.classList.add('is-open');
      document.body.classList.add('body-locked');
    });

    ctx.elements.stockModal?.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-stock]')) {
        ctx.elements.stockModal.classList.remove('is-open');
        document.body.classList.remove('body-locked');
      }
    });

    ctx.elements.stockApplyButton?.addEventListener('click', () => {
      if (ctx.state.selectedStock) form.setLogo(ctx, ctx.state.selectedStock);
      ctx.elements.stockModal.classList.remove('is-open');
      document.body.classList.remove('body-locked');
    });

    ctx.elements.logoFileInput?.addEventListener('change', (event) => {
      form.uploadLogo(ctx, event.target.files?.[0]);
    });
  }

  function openProjectLinksModal() {
    openBodyLockedModal(ctx.elements.projectLinksModal);
  }

  function syncVisibleModalFields(prefix) {
    document.querySelectorAll(`#${prefix}-links-modal [data-sync-target]`).forEach((input) => {
      const target = document.getElementById(input.dataset.syncTarget);
      if (target) input.value = target.value;
    });
  }

  function openLinksModal(kind) {
    const modal = document.getElementById(`${kind}-links-modal`);
    if (!modal) return;
    syncVisibleModalFields(kind);
    openBodyLockedModal(modal);
    form.updateDesktopOffsets(ctx, kind);
  }

  function bindProjectLinks() {
    ctx.elements.projectLinksSummary?.addEventListener('click', openProjectLinksModal);
    document.querySelector('.exact-section--links-project .exact-section-title')?.addEventListener('click', openProjectLinksModal);

    ctx.elements.projectLinksModal?.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-project-links]')) {
        closeBodyLockedModal(ctx.elements.projectLinksModal);
      }
    });

    form.visibleProjectInputs().forEach((input) => {
      input.addEventListener('input', () => {
        form.syncHiddenProjectField(ctx, input);
        form.clearFieldError(ctx.elements.projectLinksSummary);
        form.clearFieldError(input);
      });
    });
  }

  function bindPersonLinkModals() {
    document.querySelectorAll('[data-toggle-links]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.stopPropagation();
        openLinksModal(button.dataset.toggleLinks);
      });
    });

    ['author', 'contact'].forEach((kind) => {
      const modal = document.getElementById(`${kind}-links-modal`);
      modal?.addEventListener('click', (event) => {
        if (event.target.closest(`[data-close-${kind}-links]`)) {
          closeBodyLockedModal(modal);
          form.updateDesktopOffsets(ctx, '');
        }
      });

      modal?.querySelectorAll('[data-sync-target]').forEach((input) => {
        input.addEventListener('input', () => {
          const target = document.getElementById(input.dataset.syncTarget);
          if (target) target.value = input.value;
          form.clearFieldError(input);
          form.clearFieldError(document.querySelector(`.exact-link-select--${kind}`));
        });
      });
    });
  }

  function bindRegionControls() {
    const toggleRegionDropdown = (event) => {
      event.stopPropagation();
      ctx.elements.regionDropdown?.classList.toggle('hidden');
    };

    ctx.elements.regionSummary?.addEventListener('click', toggleRegionDropdown);
    document.querySelector('.exact-section--region .exact-section-title')?.addEventListener('click', toggleRegionDropdown);
    ctx.elements.addCustomRegionButton?.addEventListener('click', (event) => {
      event.preventDefault();
      form.closeRegionDropdown(ctx);
    });
    ctx.elements.regionSearchInput?.addEventListener('input', () => {
      form.renderRegionSummary(ctx, ctx.elements.regionSearchInput.value);
    });
    ctx.elements.regionSearchInput?.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        form.closeRegionDropdown(ctx);
      }
    });

    document.addEventListener('click', () => {
      form.closeRegionDropdown(ctx);
    });
    ctx.elements.regionDropdown?.addEventListener('click', (event) => event.stopPropagation());
  }

  function bindImplementationControls() {
    document.querySelectorAll('input[name="implementation-main"]').forEach((input) => {
      input.addEventListener('change', () => {
        form.syncPills();
        form.syncImplementationDates(ctx);
        form.updateHint(ctx);
      });
    });
  }

  function bindFieldValidation() {
    document.querySelector('[data-toggle-author-visibility]')?.addEventListener('click', () => {
      form.toggleAuthorVisible(ctx);
    });

    [
      ctx.fields.name,
      ctx.fields.shortDescription,
      ctx.fields.fullDescription,
      ctx.fields.authorName,
      ctx.fields.contactName,
      ctx.fields.startDate,
      ctx.fields.endDate
    ]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener('input', () => {
          form.clearFieldError(input.closest('.exact-textarea') || input.closest('.exact-line-label--contact') || input);
          form.updateHint(ctx);
        });
      });

    [
      ...Object.values(ctx.linkFields.author),
      ...Object.values(ctx.linkFields.contact),
      ...Object.values(ctx.linkFields.project),
      ...form.visibleProjectInputs()
    ]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener('input', () => {
          const value = input.value.trim();
          const type = input.dataset.linkType;
          form.clearFieldError(input);
          if (value && type && !app.isLinkValidForType(value, type)) {
            form.markFieldError(input);
          }
          if (input.closest('#project-links-modal')) {
            if (value && type && !app.isLinkValidForType(value, type)) {
              form.markFieldError(ctx.elements.projectLinksSummary);
            } else {
              form.clearFieldError(ctx.elements.projectLinksSummary);
            }
          }
          form.updateHint(ctx);
        });
      });

    [ctx.fields.startDate, ctx.fields.endDate]
      .filter(Boolean)
      .forEach((input) => {
        input.addEventListener('input', () => {
          form.clearFieldError(input);
          const value = input.value;
          if (!value) return;
          const date = new Date(value);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (date < today) form.markFieldError(input);
          if (
            ctx.fields.startDate?.value &&
            ctx.fields.endDate?.value &&
            new Date(ctx.fields.endDate.value) < new Date(ctx.fields.startDate.value)
          ) {
            form.markFieldError(ctx.fields.startDate);
            form.markFieldError(ctx.fields.endDate);
          }
        });
      });
  }

  function bindFormSubmit() {
    ctx.elements.form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      await form.submitForm(ctx);
    });
  }

  function initSmartCaptcha() {
    const tryInitSmartCaptcha = () => {
      const captchaContainer = ctx.elements.captchaContainer;
      if (window.__smartCaptchaWidgetId || !captchaContainer) return;

      const configuredSiteKey = (window.MEDIASOK_YANDEX_CLIENT_KEY || captchaContainer.dataset.sitekey || '').trim();
      const hasRealKey = configuredSiteKey && configuredSiteKey !== 'CHANGE_ME_YANDEX_CLIENT_KEY';

      if (!hasRealKey) {
        captchaContainer.innerHTML = `
          <div class="exact-captcha-fallback">
            <div class="exact-captcha-fallback__title">Проверка</div>
            <div class="exact-captcha-fallback__text">Пройдите проверку, чтобы подтвердить, что вы не робот.</div>
          </div>
        `;
        captchaContainer.classList.add('is-fallback');
        return;
      }

      if (window.smartCaptcha) {
        try {
          window.__smartCaptchaWidgetId = window.smartCaptcha.render('captcha-container', {
            sitekey: configuredSiteKey,
            callback: () => {
              window.__smartCaptchaPassed = true;
            }
          });
        } catch (error) {
          console.warn('captcha init failed', error);
        }
      }
    };

    const smartCaptchaInitTimer = window.setInterval(() => {
      tryInitSmartCaptcha();
      if (window.__smartCaptchaWidgetId) window.clearInterval(smartCaptchaInitTimer);
    }, 500);

    window.setTimeout(tryInitSmartCaptcha, 0);
  }

  bindStockModal();
  bindProjectLinks();
  bindPersonLinkModals();
  bindRegionControls();
  bindImplementationControls();
  bindFieldValidation();
  bindFormSubmit();
  initSmartCaptcha();

  form.loadOptions(ctx)
    .then(() => form.loadEditableChannel(ctx))
    .then(() => {
      form.setLogo(ctx, ctx.state.logo);
      form.syncPills();
      form.syncImplementationDates(ctx);
      form.updateDesktopOffsets(ctx, '');
      window.addEventListener('resize', () => {
        form.updateDesktopOffsets(
          ctx,
          document.querySelector('[data-toggle-links][aria-expanded="true"]')?.dataset.toggleLinks || ''
        );
        form.renderStockGrid(ctx);
      });
    });
})();
