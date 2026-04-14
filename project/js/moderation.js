'use strict';

(() => {
  const app = window.MediaSok;
  app.mountLayout({ hero: 'simple', title: 'Модерация' });

  const loginBlock = document.getElementById('moderation-login');
  const appBlock = document.getElementById('moderation-app');
  const root = document.getElementById('moderation-root');
  const emptyRoot = document.getElementById('moderation-empty');
  const tabs = [...document.querySelectorAll('[data-mod-tab]')];
  const initialToken = app.getStoredToken();
  const state = {
    tab: 'pending',
    token: app.isTokenFresh(initialToken) ? initialToken : '',
    channels: []
  };

  if (initialToken && !state.token) {
    app.setStoredToken('');
  }

  function firstContactLink(channel) {
    const authorLinks = channel.author?.socials || {};
    const contactLinks = channel.contact || {};
    return [...Object.values(authorLinks), ...Object.entries(contactLinks).filter(([key]) => key !== 'name').map(([, value]) => value)]
      .find(Boolean) || '';
  }

  function copyApprovalText(channel) {
    const url = `${window.location.origin}${app.channelUrl(channel.slug)}`;
    const text = `Ваш канал "${channel.name}" прошел модерацию и опубликован: ${url}.`;
    navigator.clipboard.writeText(text).then(() => {
      app.showToast('Текст уведомления скопирован.', 'success');
    }).catch(() => {
      app.showToast(text, 'default');
    });
  }

  function dropInvalidToken(message = 'Сессия модератора истекла. Войдите заново.') {
    state.token = '';
    app.setStoredToken('');
    updateAuthUi();
    app.showToast(message, 'error');
  }

  async function actionRequest(path, method = 'POST') {
    if (!app.isTokenFresh(state.token)) {
      dropInvalidToken();
      throw new Error('Сессия модератора истекла');
    }

    try {
      return await app.api(path, {
        method,
        headers: { Authorization: `Bearer ${state.token}` }
      });
    } catch (error) {
      if (error.status === 401) {
        dropInvalidToken(error.message === 'Invalid token'
          ? 'Токен модератора недействителен. Войдите заново.'
          : 'Сессия модератора истекла. Войдите заново.');
      }
      throw error;
    }
  }

  async function refresh() {
    try {
      const data = await app.api('/channels?status=all');
      state.channels = (Array.isArray(data) ? data : []).map(app.normalizeChannel);
      render();
    } catch (error) {
      console.warn(error);
      app.showToast('Не удалось загрузить список каналов.', 'error');
    }
  }

  function visibleChannels() {
    if (state.tab === 'pending') return state.channels.filter((item) => item.status === 'pending');
    return state.channels.filter((item) => item.status === 'approved');
  }

  function updateChannelStatus(slug, nextStatus) {
    let changed = false;
    state.channels = state.channels.map((item) => {
      if (item.slug !== slug) return item;
      changed = true;
      return {
        ...item,
        status: nextStatus
      };
    });
    return changed;
  }

  function removeChannel(slug) {
    const next = state.channels.filter((item) => item.slug !== slug);
    const changed = next.length !== state.channels.length;
    state.channels = next;
    return changed;
  }

  async function syncAfterAction() {
    try {
      await refresh();
    } catch (error) {
      console.warn('moderation sync failed', error);
    }
  }

  function render() {
    const items = visibleChannels();
    tabs.forEach((button) => button.classList.toggle('is-active', button.dataset.modTab === state.tab));

    if (!items.length) {
      root.innerHTML = '';
      emptyRoot.classList.remove('hidden');
      emptyRoot.innerHTML = app.emptyStateHtml(state.tab === 'pending' ? 'Нет заявок, ожидающих модерации.' : 'Нет опубликованных каналов.');
      return;
    }

    emptyRoot.classList.add('hidden');
    root.innerHTML = items.map((channel, index) => `
      <div class="channel-card moderation-card" data-mod-open="${app.escapeHtml(channel.slug)}">
        <div class="channel-card__logo-wrap">
          <img class="channel-card__logo" src="${app.escapeHtml(channel.logo || app.defaultLogo(index))}" alt="${app.escapeHtml(channel.name)}">
        </div>
        <h3 class="channel-card__title">${app.escapeHtml(channel.name)}</h3>
        <p class="channel-card__description">${app.escapeHtml(channel.shortDescription)}</p>
        <div class="pill">${app.escapeHtml(channel.status)}</div>
        <div class="moderation-card__actions">
          ${state.tab === 'pending' ? `
            <button class="btn btn-primary btn-small" type="button" data-approve="${app.escapeHtml(channel.slug)}">Добавить</button>
            <button class="btn btn-danger btn-small" type="button" data-reject="${app.escapeHtml(channel.slug)}">Отклонить</button>
          ` : ''}
          <a class="btn btn-secondary btn-small" href="${app.escapeHtml(app.moderationEditUrl(channel.slug))}">Редактировать</a>
          ${state.tab === 'approved' ? `<button class="btn btn-danger btn-small" type="button" data-delete="${app.escapeHtml(channel.slug)}">Удалить</button>` : ''}
          <button class="btn btn-secondary btn-small" type="button" data-copy="${app.escapeHtml(channel.slug)}">Скопировать уведомление</button>
          <button class="btn btn-secondary btn-small" type="button" data-contact="${app.escapeHtml(channel.slug)}">Контактная информация</button>
        </div>
      </div>
    `).join('');

    root.querySelectorAll('[data-approve]').forEach((button) => button.addEventListener('click', async () => {
      const slug = button.dataset.approve;
      if (!window.confirm('Вы уверены? Карточка будет опубликована.')) return;

      button.disabled = true;
      try {
        await actionRequest(`/channels/${encodeURIComponent(slug)}/approve`);
        updateChannelStatus(slug, 'approved');
        state.tab = 'approved';
        render();
        app.showToast('Карточка опубликована и перенесена в добавленные.', 'success');
        syncAfterAction();
      } catch (error) {
        button.disabled = false;
        app.showToast(error.message || 'Не удалось опубликовать карточку.', 'error');
      }
    }));

    root.querySelectorAll('[data-reject]').forEach((button) => button.addEventListener('click', async () => {
      const slug = button.dataset.reject;
      if (!window.confirm('Вы уверены? Заявка будет отклонена и скрыта из списка ожидающих.')) return;

      button.disabled = true;
      try {
        await actionRequest(`/channels/${encodeURIComponent(slug)}/reject`);
        updateChannelStatus(slug, 'rejected');
        render();
        app.showToast('Карточка отклонена.', 'success');
        syncAfterAction();
      } catch (error) {
        button.disabled = false;
        app.showToast(error.message || 'Не удалось отклонить карточку.', 'error');
      }
    }));

    root.querySelectorAll('[data-delete]').forEach((button) => button.addEventListener('click', async () => {
      const slug = button.dataset.delete;
      if (!window.confirm('Удалить уже добавленный канал?')) return;

      button.disabled = true;
      try {
        await actionRequest(`/channels/${encodeURIComponent(slug)}`, 'DELETE');
        removeChannel(slug);
        render();
        app.showToast('Канал удалён.', 'success');
        syncAfterAction();
      } catch (error) {
        button.disabled = false;
        app.showToast(error.message || 'Не удалось удалить карточку.', 'error');
      }
    }));

    root.querySelectorAll('[data-copy]').forEach((button) => button.addEventListener('click', () => {
      const channel = state.channels.find((item) => item.slug === button.dataset.copy);
      if (channel) copyApprovalText(channel);
    }));

    root.querySelectorAll('[data-contact]').forEach((button) => button.addEventListener('click', () => {
      const channel = state.channels.find((item) => item.slug === button.dataset.contact);
      const href = channel ? firstContactLink(channel) : '';
      if (href) {
        window.open(href, '_blank', 'noopener');
      } else {
        app.showToast('Контактная информация не указана.', 'error');
      }
    }));

    root.querySelectorAll('[data-mod-open]').forEach((card) => card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, textarea, select, label')) return;
      const slug = card.dataset.modOpen;
      if (slug) window.location.href = app.channelUrl(slug);
    }));
  }

  function updateAuthUi() {
    const isAuthed = Boolean(state.token);
    loginBlock.classList.toggle('hidden', isAuthed);
    appBlock.classList.toggle('hidden', !isAuthed);
    if (isAuthed) refresh();
  }

  document.getElementById('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    const login = document.getElementById('login-input').value.trim();
    const password = document.getElementById('password-input').value;
    try {
      const result = await app.api('/login', { method: 'POST', body: JSON.stringify({ login, password }) });
      state.token = result.token;
      app.setStoredToken(result.token);
      app.showToast('Вход выполнен.', 'success');
      updateAuthUi();
    } catch (error) {
      app.showToast(error.message || 'Ошибка авторизации.', 'error');
    }
  });

  document.getElementById('fill-demo-login').addEventListener('click', () => {
    document.getElementById('login-input').value = 'alex92';
    document.getElementById('password-input').value = 'Zx7!mK3p';
  });

  document.getElementById('logout-button').addEventListener('click', () => {
    state.token = '';
    app.setStoredToken('');
    updateAuthUi();
  });

  tabs.forEach((button) => button.addEventListener('click', () => {
    state.tab = button.dataset.modTab;
    render();
  }));

  updateAuthUi();
})();
