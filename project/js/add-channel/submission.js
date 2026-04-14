'use strict';

(() => {
  const scope = window.MediaSokAddChannel;

  function applyFieldValidation(ctx, payload) {
    const { fields, elements, linkFields } = ctx;

    scope.resetFieldErrors();
    if (payload.name.length < 3 || payload.name.length > 85) scope.markFieldError(fields.name);
    if (payload.shortDescription.length < 5 || payload.shortDescription.length > 150) {
      scope.markFieldError(document.querySelector('.exact-textarea--short'));
    }
    if (payload.fullDescription && (payload.fullDescription.length < 5 || payload.fullDescription.length > 1000)) {
      scope.markFieldError(document.querySelector('.exact-textarea--full'));
    }
    if (!payload.category) scope.markFieldError(elements.categoryList);
    if (!payload.regions.length) scope.markFieldError(elements.regionSummary);
    if (!Object.keys(payload.links).length) scope.markFieldError(elements.projectLinksSummary);
    if (!payload.contact.name) scope.markFieldError(fields.contactName);
    if (payload.implementation === 'Реализуется') {
      if (!payload.startDate) scope.markFieldError(fields.startDate);
      if (!payload.endDate) scope.markFieldError(fields.endDate);
    }

    const contactWithoutName = Object.entries(payload.contact).filter(([key, value]) => key !== 'name' && value);
    if (!contactWithoutName.length) {
      scope.markFieldError(document.querySelector('.exact-link-select--contact'));
    }

    const inputsToCheck = [
      ...Object.values(linkFields.project),
      ...Object.values(linkFields.author),
      ...Object.values(linkFields.contact),
      ...scope.visibleProjectInputs()
    ].filter(Boolean);

    inputsToCheck.forEach((input) => {
      const value = input.value.trim();
      const type = input.dataset.linkType;
      if (value && type && !ctx.app.isLinkValidForType(value, type)) {
        scope.markFieldError(input);
        const stack = input.closest('.exact-links-stack');
        if (stack) scope.markFieldError(stack);
        if (stack?.classList.contains('exact-links-stack--contact')) {
          scope.markFieldError(document.querySelector('.exact-link-select--contact'));
        }
        if (input.closest('#project-links-modal')) {
          scope.markFieldError(elements.projectLinksSummary);
        }
      }
    });
  }

  function captchaIsValid(ctx) {
    if (ctx.moderationMode) return true;
    const tokenInput = document.querySelector('#captcha-container input[name="smart-token"]');
    return Boolean(tokenInput?.value || window.__smartCaptchaPassed);
  }

  function resetCaptcha() {
    const tokenInput = document.querySelector('#captcha-container input[name="smart-token"]');
    if (tokenInput) tokenInput.value = '';
    window.__smartCaptchaPassed = false;
    if (window.smartCaptcha && typeof window.smartCaptcha.reset === 'function' && window.__smartCaptchaWidgetId) {
      try {
        window.smartCaptcha.reset(window.__smartCaptchaWidgetId);
      } catch (error) {
        console.warn('captcha reset failed', error);
      }
    }
  }

  function buildPayload(ctx) {
    const { fields, state, linkFields } = ctx;

    const payload = {
      name: fields.name.value.trim(),
      logo: state.logo,
      shortDescription: fields.shortDescription.value.trim(),
      fullDescription: fields.fullDescription.value.trim(),
      category: scope.currentCategoryValue(ctx),
      nomination: scope.currentNominationValue(ctx),
      implementation: scope.implementationValue(),
      regions: [...state.selectedRegions],
      contest: scope.currentContestValue(ctx),
      contestDraft: fields.contest.value === '__custom' ? fields.contestCustom.value.trim() : '',
      startDate: fields.startDate?.value || '',
      endDate: fields.endDate?.value || '',
      links: {},
      contact: { name: fields.contactName.value.trim() },
      author: {
        name: fields.authorName.value.trim(),
        socials: {},
        visible: scope.authorVisible()
      }
    };

    Object.entries(linkFields.project).forEach(([key, input]) => {
      if (input?.value.trim()) payload.links[key] = ctx.app.normalizeUrl(input.value.trim(), key);
    });
    Object.entries(linkFields.author).forEach(([key, input]) => {
      if (input?.value.trim()) payload.author.socials[key] = ctx.app.normalizeUrl(input.value.trim(), key);
    });
    Object.entries(linkFields.contact).forEach(([key, input]) => {
      if (input?.value.trim()) payload.contact[key] = ctx.app.normalizeUrl(input.value.trim(), key);
    });

    return payload;
  }

  function validatePayload(ctx, payload) {
    const { fields, linkFields } = ctx;
    const errors = [];

    if (payload.name.length < 3 || payload.name.length > 85) errors.push('Название должно содержать от 3 до 85 символов');
    if (payload.shortDescription.length < 5 || payload.shortDescription.length > 150) errors.push('Краткое описание должно содержать от 5 до 150 символов');
    if (payload.fullDescription && (payload.fullDescription.length < 5 || payload.fullDescription.length > 1000)) {
      errors.push('Подробное описание должно содержать от 5 до 1000 символов');
    }
    if (!payload.category) errors.push('Укажите категорию проекта');
    if (!payload.contest) errors.push('Укажите конкурс');
    if (!payload.regions.length) errors.push('Выберите хотя бы один регион');
    if (!Object.keys(payload.links).length) errors.push('Добавьте ссылку на Telegram, VK или другой канал');
    if (!payload.contact.name) errors.push('Укажите контакт для связи с модератором');

    if (payload.implementation === 'Реализуется') {
      if (!payload.startDate || !payload.endDate) {
        errors.push('Укажите даты начала и завершения проекта.');
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const start = payload.startDate ? new Date(payload.startDate) : null;
      const end = payload.endDate ? new Date(payload.endDate) : null;
      if (start && start < today) errors.push('Дата начала не может быть раньше сегодняшней даты.');
      if (end && end <= today) errors.push('Дата завершения должна быть позже сегодняшней даты.');
      if (start && end && end < start) errors.push('Дата завершения должна быть позже даты начала.');
    }

    const contactWithoutName = Object.entries(payload.contact).filter(([key, value]) => key !== 'name' && value);
    if (!contactWithoutName.length) errors.push('Укажите контакт для связи с модератором');

    if (!ctx.moderationMode) {
      if (!fields.agreement1.checked || !fields.agreement2.checked) errors.push('Подтвердите согласие на обработку данных');
      if (!captchaIsValid(ctx)) errors.push('Пройдите проверку, чтобы отправить форму');
    }

    const inputsToCheck = [
      ...Object.values(linkFields.project),
      ...Object.values(linkFields.author),
      ...Object.values(linkFields.contact),
      ...scope.visibleProjectInputs()
    ].filter(Boolean);

    inputsToCheck.forEach((input) => {
      const value = input.value.trim();
      const type = input.dataset.linkType;
      if (value && type && !ctx.app.isLinkValidForType(value, type)) {
        errors.push(`Поле «${input.placeholder || type}» заполнено в неверном формате.`);
      }
    });

    return [...new Set(errors)];
  }

  function showErrors(ctx, errors) {
    if (!errors.length) {
      ctx.elements.errorsRoot.classList.add('hidden');
      ctx.elements.errorsRoot.innerHTML = '';
      return;
    }

    ctx.elements.errorsRoot.classList.remove('hidden');
    ctx.elements.errorsRoot.innerHTML = `<ul class="validation-list">${errors.map((item) => `<li>${ctx.app.escapeHtml(item)}</li>`).join('')}</ul>`;
    ctx.elements.errorsRoot.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  async function uploadLogo(ctx, file) {
    if (!file) return;
    if (!/image\/(png|jpeg)/.test(file.type) || file.size > 5 * 1024 * 1024) {
      ctx.app.showToast('Загрузите изображение в формате JPG или PNG (до 5 МБ)', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/channels/upload', { method: 'POST', body: formData });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Ошибка загрузки');
      scope.setLogo(ctx, payload.url);
      ctx.app.showToast('Логотип загружен.', 'success');
    } catch (error) {
      ctx.app.showToast(error.message || 'Не удалось загрузить логотип.', 'error');
    }
  }

  async function loadEditableChannel(ctx) {
    if (!ctx.editSlug) return;
    try {
      const channel = ctx.app.normalizeChannel(await ctx.app.api(`/channels/slug/${encodeURIComponent(ctx.editSlug)}`));
      scope.populateForm(ctx, channel);
    } catch (error) {
      ctx.app.showToast('Не удалось загрузить карточку для редактирования.', 'error');
    }
  }

  async function submitForm(ctx) {
    const payload = buildPayload(ctx);
    const errors = validatePayload(ctx, payload);
    applyFieldValidation(ctx, payload);
    showErrors(ctx, errors);
    if (errors.length) return;

    try {
      if (ctx.moderationMode && ctx.editSlug) {
        if (!ctx.app.isTokenFresh(ctx.token)) {
          ctx.app.setStoredToken('');
          throw new Error('Сессия модератора истекла. Вернитесь на страницу модерации и войдите заново.');
        }

        try {
          await ctx.app.api(`/channels/${encodeURIComponent(ctx.editSlug)}`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${ctx.token}` },
            body: JSON.stringify(payload)
          });
        } catch (error) {
          if (error.status === 401) {
            ctx.app.setStoredToken('');
            throw new Error('Токен модератора недействителен. Вернитесь на страницу модерации и войдите заново.');
          }
          throw error;
        }

        ctx.app.showToast('Карточка обновлена.', 'success');
        return;
      }

      const captchaToken = document.querySelector('#captcha-container input[name="smart-token"]')?.value || '';
      const result = await ctx.app.api('/channels', {
        method: 'POST',
        body: JSON.stringify({ ...payload, captchaToken })
      });

      ctx.app.setStoredPendingPreview({
        name: payload.name,
        logo: payload.logo || ctx.app.defaultLogo(0),
        slug: result.slug
      });
      resetCaptcha();
      ctx.elements.successModal.classList.add('is-open');
      document.body.classList.add('body-locked');
      ctx.app.showToast('Ваш проект отправлен на модерацию. Изменить данные можно только после согласования с модератором.', 'success');
    } catch (error) {
      ctx.app.showToast(error.message || 'Не удалось сохранить карточку.', 'error');
    }
  }

  Object.assign(scope, {
    applyFieldValidation,
    captchaIsValid,
    resetCaptcha,
    buildPayload,
    validatePayload,
    showErrors,
    uploadLogo,
    loadEditableChannel,
    submitForm
  });
})();
