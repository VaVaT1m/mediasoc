'use strict';

(() => {
  const app = window.MediaSok;
  app.mountLayout({ hero: 'home' });

  const state = {
    channels: [],
    filtered: [],
    visibleCount: 6,
    filters: {
      search: '',
      contest: '',
      category: '',
      regions: [],
      regionMode: 'strict',
      implementation: ''
    }
  };

  const catalogRoot = document.getElementById('catalog-root');
  const emptyRoot = document.getElementById('empty-root');
  const showMoreRow = document.getElementById('show-more-row');
  const searchInput = document.getElementById('catalog-search');
  const filterModal = document.getElementById('filter-modal');
  const contestSelect = document.getElementById('filter-contest');
  const categorySelect = document.getElementById('filter-category');
  const regionSearch = document.getElementById('filter-region-search');
  const regionList = document.getElementById('filter-region-list');
  const allRegions = [...app.ALL_REGIONS];

  function applyFilters() {
    const q = state.filters.search.trim().toLowerCase();
    const qWords = q.split(/\s+/).filter(Boolean);

    state.filtered = state.channels.filter((item) => {
      const name = item.name.toLowerCase();
      const shortDescription = item.shortDescription.toLowerCase();
      const fullDescription = item.fullDescription.toLowerCase();
      const regions = item.regions || [];

      const searchOk = !qWords.length || qWords.every((word) =>
        name.includes(word) || shortDescription.includes(word) || fullDescription.includes(word)
      );

      const contestOk = !state.filters.contest || item.contest === state.filters.contest;
      const categoryOk = !state.filters.category || item.category === state.filters.category;
      const implementationOk = !state.filters.implementation || item.implementation === state.filters.implementation;

      const selectedRegions = state.filters.regions;
      let regionsOk = true;
      if (selectedRegions.length) {
        const lowerRegions = regions.map((entry) => entry.toLowerCase());
        const lowerSelected = selectedRegions.map((entry) => entry.toLowerCase());
        if (state.filters.regionMode === 'strict') {
          regionsOk = lowerRegions.length === lowerSelected.length && lowerSelected.every((entry) => lowerRegions.includes(entry));
        } else {
          regionsOk = lowerSelected.some((entry) => lowerRegions.includes(entry) || lowerRegions.includes('всероссийский') || lowerRegions.includes('международный'));
        }
      }

      return searchOk && contestOk && categoryOk && implementationOk && regionsOk;
    });

    renderCatalog();
  }

  function renderCatalog() {
    const visible = state.filtered.slice(0, state.visibleCount);
    catalogRoot.innerHTML = visible.map((channel, index) => app.channelCardHtml(channel, index)).join('');

    catalogRoot.querySelectorAll('[data-channel-card]').forEach((card) => {
      if (card.dataset.bound === '1') return;
      card.dataset.bound = '1';
      card.addEventListener('click', (event) => {
        if (event.target.closest('a, button, input, textarea, select, label')) return;
        const url = card.dataset.channelUrl;
        if (url) window.open(url, '_blank', 'noopener');
      });
    });

    const hasItems = state.filtered.length > 0;
    emptyRoot.classList.toggle('hidden', hasItems);
    catalogRoot.classList.toggle('hidden', !hasItems);
    showMoreRow.classList.toggle('hidden', state.filtered.length <= state.visibleCount || !hasItems);

    if (!hasItems) {
      emptyRoot.innerHTML = app.emptyStateHtml('Ничего не найдено. Попробуйте изменить условия поиска.');
    }
  }

  function buildSelect(select, items, placeholder) {
    select.innerHTML = `<option value="">${placeholder}</option>` + items.map((item) => `<option value="${app.escapeHtml(item)}">${app.escapeHtml(item)}</option>`).join('');
  }

  function renderRegions(regionQuery = '') {
    const filtered = allRegions.filter((item) => item.toLowerCase().includes(regionQuery.trim().toLowerCase()));
    const hasExclusive = state.filters.regions.some((item) => ['Всероссийский', 'Международный'].includes(item));
    const hasOther = state.filters.regions.some((item) => !['Всероссийский', 'Международный'].includes(item));
    regionList.innerHTML = filtered.length ? filtered.map((region) => {
      const disabled = (hasExclusive && !state.filters.regions.includes(region) && !['Всероссийский', 'Международный'].includes(region)) || (hasOther && !state.filters.regions.includes(region) && ['Всероссийский', 'Международный'].includes(region));
      return `
      <label class="region-option ${disabled ? 'is-disabled' : ''}">
        <input type="checkbox" data-region-option="${app.escapeHtml(region)}" ${state.filters.regions.includes(region) ? 'checked' : ''} ${disabled ? 'disabled' : ''}>
        <span>${app.escapeHtml(region)}</span>
      </label>`;
    }).join('') : '<div class="region-option-empty">Ничего не найдено</div>';

    regionList.querySelectorAll('[data-region-option]').forEach((input) => {
      input.addEventListener('change', () => {
        const region = input.dataset.regionOption;
        if (input.checked) {
          if (['Всероссийский', 'Международный'].includes(region)) {
            state.filters.regions = [region];
          } else {
            state.filters.regions = state.filters.regions.filter((entry) => !['Всероссийский', 'Международный'].includes(entry));
            if (!state.filters.regions.includes(region)) state.filters.regions = [...state.filters.regions, region];
          }
        } else {
          state.filters.regions = state.filters.regions.filter((entry) => entry !== region);
        }
        renderRegions(regionSearch.value);
      });
    });
  }

  function syncFilterControls() {
    contestSelect.value = state.filters.contest;
    categorySelect.value = state.filters.category;
    document.querySelectorAll('input[name="region-mode"]').forEach((input) => {
      input.checked = input.value === state.filters.regionMode;
      input.closest('.radio-pill').classList.toggle('is-active', input.checked);
    });
    document.querySelectorAll('input[name="implementation"]').forEach((input) => {
      input.checked = input.value === state.filters.implementation;
      input.closest('.radio-pill').classList.toggle('is-active', input.checked);
    });
    renderRegions(regionSearch.value);
  }

  function bindFilterModal() {
    document.getElementById('open-filter-modal').addEventListener('click', () => {
      syncFilterControls();
      filterModal.classList.add('is-open');
      document.body.classList.add('body-locked');
    });

    filterModal.addEventListener('click', (event) => {
      if (event.target.closest('[data-close-filter]')) {
        filterModal.classList.remove('is-open');
        document.body.classList.remove('body-locked');
      }
    });

    contestSelect.addEventListener('change', () => { state.filters.contest = contestSelect.value; });
    categorySelect.addEventListener('change', () => { state.filters.category = categorySelect.value; });
    regionSearch.addEventListener('input', () => renderRegions(regionSearch.value));

    document.querySelectorAll('[data-mode-pill] input[name="region-mode"]').forEach((input) => {
      input.addEventListener('change', () => {
        state.filters.regionMode = input.value;
        syncFilterControls();
      });
    });

    document.querySelectorAll('[data-status-pill] input[name="implementation"]').forEach((input) => {
      input.addEventListener('change', () => {
        state.filters.implementation = input.value;
        syncFilterControls();
      });
    });

    document.getElementById('apply-filters-button').addEventListener('click', () => {
      state.visibleCount = 6;
      applyFilters();
      filterModal.classList.remove('is-open');
      document.body.classList.remove('body-locked');
    });

    document.getElementById('reset-filters-button').addEventListener('click', () => {
      state.filters.contest = '';
      state.filters.category = '';
      state.filters.regions = [];
      state.filters.regionMode = 'strict';
      state.filters.implementation = '';
      syncFilterControls();
      applyFilters();
    });
  }

  async function loadChannels() {
    try {
      const data = await app.api('/channels');
      state.channels = (Array.isArray(data) ? data : []).map(app.normalizeChannel);
    } catch (error) {
      console.warn('channels fallback', error);
      state.channels = app.FALLBACK_CHANNELS.map(app.normalizeChannel);
      app.showToast('Не удалось получить данные от API.', 'error');
    }

    buildSelect(contestSelect, [...new Set(state.channels.map((item) => item.contest).filter(Boolean))], 'Выберите конкурс');
    buildSelect(categorySelect, [...new Set(state.channels.map((item) => item.category).filter(Boolean))], 'Выберите категорию');
    renderRegions(regionSearch?.value || '');
    applyFilters();
  }

  searchInput.addEventListener('input', () => {
    state.filters.search = searchInput.value;
    state.visibleCount = 6;
    applyFilters();
  });
  document.getElementById('catalog-search-button').addEventListener('click', () => {
    state.filters.search = searchInput.value;
    state.visibleCount = 6;
    applyFilters();
  });
  document.getElementById('show-more-button').addEventListener('click', () => {
    state.visibleCount += 6;
    renderCatalog();
  });

  bindFilterModal();
  loadChannels();
})();
