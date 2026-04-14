'use strict';

(() => {
  const scope = window.MediaSokAddChannel;

  function renderContestList(ctx) {
    const { app, state, fields, elements } = ctx;
    const selected = fields.contest.value || '';

    elements.contestList.innerHTML = `
      ${state.contests.map((value) => `
        <label class="exact-option-item">
          <input type="checkbox" data-contest-value="${app.escapeHtml(value)}" ${selected === value ? 'checked' : ''}>
          <span>${app.escapeHtml(value)}</span>
        </label>
      `).join('')}
      <label class="exact-option-item exact-option-item--custom">
        <input type="checkbox" id="contest-custom-check" ${selected === '__custom' ? 'checked' : ''}>
        <span>Добавить новый конкурс</span>
        <input type="text" id="contest-custom-visible" placeholder="Название конкурса" value="${app.escapeHtml(fields.contestCustom.value)}">
      </label>
    `;

    elements.contestList.querySelectorAll('[data-contest-value]').forEach((input) => {
      input.addEventListener('change', () => {
        fields.contest.value = input.checked ? input.dataset.contestValue : '';
        if (input.checked) fields.contestCustom.value = '';
        renderContestList(ctx);
        scope.updateHint(ctx);
      });
    });

    const customCheck = elements.contestList.querySelector('#contest-custom-check');
    const customInput = elements.contestList.querySelector('#contest-custom-visible');

    customCheck?.addEventListener('change', () => {
      fields.contest.value = customCheck.checked ? '__custom' : '';
      if (!customCheck.checked) fields.contestCustom.value = '';
      renderContestList(ctx);
      scope.updateHint(ctx);
    });

    customInput?.addEventListener('focus', () => {
      fields.contest.value = '__custom';
      if (customCheck) customCheck.checked = true;
    });

    customInput?.addEventListener('input', () => {
      fields.contest.value = '__custom';
      fields.contestCustom.value = customInput.value;
      if (customCheck) customCheck.checked = true;
      elements.contestList.querySelectorAll('[data-contest-value]').forEach((item) => {
        item.checked = false;
      });
      scope.updateHint(ctx);
    });
  }

  function renderCategoryList(ctx) {
    const { app, state, fields, elements } = ctx;
    const selected = fields.category.value || '';
    const customSelected = selected === '__custom';

    elements.categoryList.innerHTML = `
      ${state.categories.map((value) => `
        <label class="exact-option-item">
          <input type="checkbox" data-category-value="${app.escapeHtml(value)}" ${selected === value ? 'checked' : ''}>
          <span>${app.escapeHtml(value)}</span>
        </label>
      `).join('')}
      <label class="exact-option-item exact-option-item--custom">
        <input type="checkbox" id="category-custom-check" ${customSelected ? 'checked' : ''}>
        <input type="text" id="category-custom-visible" placeholder="Введите категорию" value="${app.escapeHtml(fields.categoryCustom.value)}">
      </label>
    `;

    elements.categoryList.querySelectorAll('[data-category-value]').forEach((input) => {
      input.addEventListener('change', () => {
        fields.category.value = input.checked ? input.dataset.categoryValue : '';
        if (input.checked) fields.categoryCustom.value = '';
        renderCategoryList(ctx);
        scope.clearFieldError(elements.categoryList);
        scope.updateHint(ctx);
      });
    });

    const customCheck = elements.categoryList.querySelector('#category-custom-check');
    const customInput = elements.categoryList.querySelector('#category-custom-visible');

    customCheck?.addEventListener('change', () => {
      fields.category.value = customCheck.checked ? '__custom' : '';
      if (!customCheck.checked) fields.categoryCustom.value = '';
      renderCategoryList(ctx);
      scope.clearFieldError(elements.categoryList);
      scope.updateHint(ctx);
    });

    customInput?.addEventListener('focus', () => {
      fields.category.value = '__custom';
      if (customCheck) customCheck.checked = true;
    });

    customInput?.addEventListener('input', () => {
      fields.category.value = '__custom';
      fields.categoryCustom.value = customInput.value;
      if (customCheck) customCheck.checked = true;
      elements.categoryList.querySelectorAll('[data-category-value]').forEach((item) => {
        item.checked = false;
      });
      scope.clearFieldError(elements.categoryList);
      scope.updateHint(ctx);
    });
  }

  function renderNominationList(ctx) {
    const { app, fields, elements } = ctx;
    if (!elements.nominationList) return;

    const value = (fields.nomination.value || fields.nominationCustom.value || '').slice(0, 25);
    fields.nomination.value = value;
    fields.nominationCustom.value = value;

    elements.nominationList.innerHTML = `
      <label class="exact-nomination-field" for="nomination-custom-visible">
        <input
          type="text"
          id="nomination-custom-visible"
          class="exact-nomination-input"
          placeholder="Номинация"
          maxlength="25"
          value="${app.escapeHtml(value)}"
        >
      </label>
    `;

    const nominationInput = elements.nominationList.querySelector('#nomination-custom-visible');
    nominationInput?.addEventListener('input', () => {
      const nextValue = nominationInput.value.slice(0, 25);
      nominationInput.value = nextValue;
      fields.nomination.value = nextValue;
      fields.nominationCustom.value = nextValue;
      scope.clearFieldError(elements.nominationList);
    });
  }

  function renderRegionSummary(ctx, query = '') {
    const { app, state, elements } = ctx;
    elements.regionSummary.textContent = state.selectedRegions.length
      ? state.selectedRegions.join(', ')
      : 'Выберите регионы реализации';

    const q = String(query || '').trim().toLowerCase();
    const filteredRegions = state.regions.filter((region) => region.toLowerCase().includes(q));
    const hasExclusive = state.selectedRegions.some((item) => ['Всероссийский', 'Международный'].includes(item));
    const hasOther = state.selectedRegions.some((item) => !['Всероссийский', 'Международный'].includes(item));

    elements.regionsGrid.innerHTML = filteredRegions.length
      ? filteredRegions.map((region) => {
          const disabled =
            (hasExclusive && !state.selectedRegions.includes(region) && !['Всероссийский', 'Международный'].includes(region)) ||
            (hasOther && !state.selectedRegions.includes(region) && ['Всероссийский', 'Международный'].includes(region));

          return `
            <label class="exact-region-option ${disabled ? 'is-disabled' : ''}">
              <input type="checkbox" data-region="${app.escapeHtml(region)}" ${state.selectedRegions.includes(region) ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
              <span>${app.escapeHtml(region)}</span>
            </label>`;
        }).join('')
      : '<div class="exact-region-empty">Ничего не найдено</div>';

    elements.regionsGrid.querySelectorAll('[data-region]').forEach((input) => {
      input.addEventListener('change', () => {
        const region = input.dataset.region;
        if (input.checked) {
          if (['Всероссийский', 'Международный'].includes(region)) {
            state.selectedRegions = [region];
          } else {
            state.selectedRegions = state.selectedRegions.filter((item) => !['Всероссийский', 'Международный'].includes(item));
            if (!state.selectedRegions.includes(region)) {
              state.selectedRegions = [...state.selectedRegions, region];
            }
          }
        } else {
          state.selectedRegions = state.selectedRegions.filter((item) => item !== region);
        }
        renderRegionSummary(ctx, elements.regionSearchInput?.value || '');
        scope.clearFieldError(elements.regionSummary);
        scope.updateHint(ctx);
      });
    });
  }

  function renderProjectLinksSummary(ctx) {
    const { app, linkFields, elements } = ctx;
    const labels = [];

    Object.entries(linkFields.project).forEach(([key, input]) => {
      if (input.value.trim()) labels.push(app.SOCIAL_META[key]?.label || key);
    });

    elements.projectLinksSummary.textContent = labels.length ? labels.join(', ') : 'Ссылки на каналы';
  }

  function syncVisibleProjectFieldsFromHidden(ctx) {
    scope.visibleProjectInputs().forEach((input) => {
      const target = document.getElementById(input.dataset.syncTarget);
      if (target) input.value = target.value;
    });
    renderProjectLinksSummary(ctx);
  }

  function syncHiddenProjectField(ctx, input) {
    const target = document.getElementById(input.dataset.syncTarget);
    if (!target) return;
    target.value = input.value;
    renderProjectLinksSummary(ctx);
  }

  function renderStockGrid(ctx) {
    const isMobile = window.matchMedia('(max-width: 767px)').matches;
    const totalItems = isMobile ? 6 : 15;

    ctx.elements.stockGrid.innerHTML = Array.from({ length: totalItems }, (_, index) => {
      const url = `/uploads/logo${index + 1}.png`;
      return `<button class="stock-item ${ctx.state.selectedStock === url ? 'is-selected' : ''}" type="button" data-stock="${url}" aria-label="Стоковый логотип ${index + 1}"><span class="stock-item__shape" style="background-image:url('${url}')"></span></button>`;
    }).join('');

    ctx.elements.stockGrid.querySelectorAll('[data-stock]').forEach((button) => {
      button.addEventListener('click', () => {
        ctx.state.selectedStock = button.dataset.stock;
        renderStockGrid(ctx);
      });
    });
  }

  function populateForm(ctx, channel) {
    const { fields, linkFields, state, elements } = ctx;

    fields.name.value = channel.name || '';
    fields.shortDescription.value = channel.shortDescription || '';
    fields.fullDescription.value = channel.fullDescription || '';
    fields.nomination.value = channel.nomination || '';
    fields.authorName.value = channel.author?.name || '';
    fields.contactName.value = channel.contact?.name || '';
    if (fields.startDate) fields.startDate.value = channel.startDate || '';
    if (fields.endDate) fields.endDate.value = channel.endDate || '';

    state.selectedRegions = [...(channel.regions || [])];
    scope.setLogo(ctx, channel.logo || '');
    state.currentStatus = channel.status || 'pending';

    if (state.contests.includes(channel.contest)) {
      fields.contest.value = channel.contest;
      fields.contestCustom.value = '';
    } else if (channel.contest) {
      fields.contest.value = '__custom';
      fields.contestCustom.value = channel.contest;
    }

    if (state.categories.includes(channel.category || '')) {
      fields.category.value = channel.category || '';
      fields.categoryCustom.value = '';
    } else if (channel.category) {
      fields.category.value = '__custom';
      fields.categoryCustom.value = channel.category;
    } else {
      fields.category.value = '';
      fields.categoryCustom.value = '';
    }

    document.querySelectorAll('input[name="implementation-main"]').forEach((input) => {
      input.checked = input.value === channel.implementation;
    });
    document.querySelector('input[name="author-visible"][value="show"]').checked = channel.author?.visible !== false;
    document.querySelector('input[name="author-visible"][value="hide"]').checked = channel.author?.visible === false;

    Object.entries(linkFields.project).forEach(([key, input]) => {
      if (input) input.value = channel.links?.[key] || '';
    });
    Object.entries(linkFields.author).forEach(([key, input]) => {
      if (input) input.value = channel.author?.socials?.[key] || '';
    });
    Object.entries(linkFields.contact).forEach(([key, input]) => {
      if (input) input.value = channel.contact?.[key] || '';
    });

    syncVisibleProjectFieldsFromHidden(ctx);
    renderContestList(ctx);
    renderCategoryList(ctx);
    renderNominationList(ctx);
    renderRegionSummary(ctx, elements.regionSearchInput?.value || '');
    scope.syncPills();
    scope.syncImplementationDates(ctx);
    scope.updateHint(ctx);
  }

  async function loadOptions(ctx) {
    try {
      const channels = (await ctx.app.api('/channels?status=all')).map(ctx.app.normalizeChannel);
      ctx.state.contests = [...new Set([...ctx.state.contests, ...channels.map((item) => item.contest).filter(Boolean)])];
      ctx.state.categories = [...new Set([...ctx.state.categories, ...channels.map((item) => item.category).filter(Boolean)])];
      ctx.state.nominations = [...new Set([...ctx.state.nominations, ...channels.map((item) => item.nomination).filter(Boolean)])];
      ctx.state.regions = [...ctx.app.ALL_REGIONS];
    } catch (error) {
      console.warn('options fallback', error);
    }

    renderContestList(ctx);
    renderCategoryList(ctx);
    renderNominationList(ctx);
    renderRegionSummary(ctx, ctx.elements.regionSearchInput?.value || '');
    renderStockGrid(ctx);
    syncVisibleProjectFieldsFromHidden(ctx);
    scope.updateHint(ctx);
  }

  Object.assign(scope, {
    renderContestList,
    renderCategoryList,
    renderNominationList,
    renderRegionSummary,
    renderProjectLinksSummary,
    syncVisibleProjectFieldsFromHidden,
    syncHiddenProjectField,
    renderStockGrid,
    populateForm,
    loadOptions
  });
})();
