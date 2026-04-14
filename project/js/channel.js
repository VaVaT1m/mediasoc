'use strict';

(() => {
  const app = window.MediaSok;
  app.mountLayout({ hero: 'simple', title: '', includeAddButton: false });

  const root = document.getElementById('channel-root');
  const slug = app.channelIdentifierFromLocation();
  const back = document.getElementById('detail-back');

  if (back) {
    back.addEventListener('click', (event) => {
      event.preventDefault();
      if (window.history.length > 1) window.history.back();
      else window.location.href = '/';
    });
  }

  function iconPath(key) {
    const map = {
      telegram: '/assets/project-social/tg.png',
      vk: '/assets/project-social/vk.png',
      email: '/assets/project-social/email.png',
      youtube: '/assets/project-social/youtube.png',
      site: '/assets/project-social/web.png',
      phone: '/assets/project-social/phone.png',
      max: '/assets/project-social/max.png'
    };
    return map[key] || '';
  }

  function socialIconLinks(sourceObject, extraClass = '') {
    const entries = app.socialEntries(sourceObject);
    if (!entries.length) return '';

    return `<div class="project-socials ${extraClass}">${entries.map((entry) => `
      <a class="project-social project-social--${entry.key}" href="${app.escapeHtml(entry.href)}" target="_blank" rel="noopener noreferrer" aria-label="${app.escapeHtml(entry.meta.label)}">
        <img class="project-social__icon" src="${app.escapeHtml(iconPath(entry.key))}" alt="">
      </a>
    `).join('')}</div>`;
  }

  function sectionTitle(icon, text, extraClass='') {
    return `<h2 class="project-section__title ${extraClass}"><img src="${icon}" alt="">${text}</h2>`;
  }

  function statPill(text, extraClass = '') {
    return `<span class="project-pill ${extraClass}">${app.escapeHtml(text)}</span>`;
  }

  function renderChannel(channel) {
    const contacts = channel.contact || {};
    const author = channel.author || { name: '', socials: {}, visible: false };
    const regionItems = channel.regions || [];
    const hasManyRegions = regionItems.length > 3;
    const visibleRegions = hasManyRegions ? regionItems.slice(0, 3) : regionItems;
    const hiddenRegions = hasManyRegions ? regionItems.slice(3) : [];
    const regions = visibleRegions.map((region) => `<span class="project-pill">${app.escapeHtml(region)}</span>`).join('');
    const hiddenRegionsHtml = hiddenRegions.map((region) => `<span class="project-pill project-pill--hidden-region hidden">${app.escapeHtml(region)}</span>`).join('');
    const projectSocials = socialIconLinks(channel.links, 'project-head__socials');
    const authorSocials = socialIconLinks(author.socials, 'project-person__socials');
    const contactSocials = socialIconLinks(contacts, 'project-person__socials');
    const categoryLabel = channel.category || 'Категория';
    const viewsLabel = String(channel.views || 0);

    root.innerHTML = `
      <article class="project-view">
        <div class="project-head">
          <div class="project-head__logo-col">
            <img class="project-head__logo" src="${app.escapeHtml(channel.logo || app.defaultLogo(0))}" alt="${app.escapeHtml(channel.name)}">
            ${projectSocials}
          </div>

          <div class="project-head__content">
            <h1 class="project-head__title">${app.escapeHtml(channel.name)}</h1>
            <div class="project-head__badges">
              <span class="project-pill project-pill--with-grid">${app.escapeHtml(categoryLabel)}</span>
              <span class="project-pill project-pill--views"><img src="/assets/custom/eye.png" alt="">Просмотров: ${app.escapeHtml(viewsLabel)}</span>
            </div>
            <p class="project-head__summary">${app.escapeHtml(channel.shortDescription || '')}</p>
            ${channel.nomination ? `<p class="project-head__summary project-head__summary--secondary">${app.escapeHtml(channel.nomination)}</p>` : ''}
          </div>
        </div>

        <section class="project-section">
          ${sectionTitle('/assets/section-icons/contest-arrow.png', 'Конкурс', 'project-section__title--contest')}
          <ul class="project-info-list">
            <li><img src="/assets/section-icons/arrow-right-circle.png" alt="">${app.escapeHtml(channel.contest || 'Название конкурса')}</li>
            <li><img src="/assets/section-icons/hash.png" alt="">${app.escapeHtml(channel.nomination || 'Номинация')}</li>
            <li><img src="/assets/section-icons/calendar.png" alt="">${app.escapeHtml(app.formatImplementation(channel.implementation))}</li>${channel.startDate || channel.endDate ? `<li><img src="/assets/section-icons/calendar.png" alt="">${app.escapeHtml([channel.startDate, channel.endDate].filter(Boolean).join(' — '))}</li>` : ''}
          </ul>
        </section>

        <section class="project-section">
          ${sectionTitle('/assets/form-screen/region-icon.png', 'Регион', 'project-section__title--region')}
          <div class="project-region-row">
            ${regions || '<span class="project-pill">Не указан</span>'}${hiddenRegionsHtml}
            <button class="project-region-more ${hasManyRegions ? '' : 'is-static'}" type="button" aria-label="Показать ещё"><img src="/assets/section-icons/arrow-right-circle.png" alt=""></button>
          </div>
        </section>

        <section class="project-section">
          ${sectionTitle('/assets/mobile/textleft.png', 'Описание', 'project-section__title--description')}
          <div class="project-description-text">${app.escapeHtml(channel.fullDescription || channel.shortDescription || 'Описание проекта пока не добавлено.')}</div>
        </section>

        <section class="project-people">
          ${author.visible && author.name ? `
            <div class="project-person-wrap">
              ${sectionTitle('/assets/section-icons/personplus.png', 'Автор проекта', 'project-section__title--author')}
              <div class="project-person">
                <div class="project-person__icon project-person__icon--author"><img src="/assets/people/author.png" alt=""></div>
                <div class="project-person__content">
                  <div class="project-person__name">${app.escapeHtml(author.name)}</div>
                  ${authorSocials}
                </div>
              </div>
            </div>
          ` : ''}

          <div class="project-person-wrap">
            ${sectionTitle('/assets/section-icons/fe_question.png', 'По всем вопросам', 'project-section__title--contact')}
            <div class="project-person">
              <div class="project-person__icon project-person__icon--contact"><img src="/assets/people/contact.png" alt=""></div>
              <div class="project-person__content">
                <div class="project-person__name">${app.escapeHtml(contacts.name || 'Контактное лицо')}</div>
                ${contactSocials || '<div class="project-empty">Контакты не указаны</div>'}
              </div>
            </div>
          </div>
        </section>
      </article>
    `;

    const regionMore = root.querySelector('.project-region-more');
    if (regionMore) {
      regionMore.addEventListener('click', () => {
        root.querySelectorAll('.project-pill--hidden-region').forEach((node) => node.classList.toggle('hidden'));
        regionMore.classList.toggle('is-open');
      });
    }
  }

  async function increaseView(slugValue) {
    if (!app.shouldIncreaseView(slugValue)) return;
    try {
      await app.api(`/channels/${encodeURIComponent(slugValue)}/view`, { method: 'POST' });
      app.markViewed(slugValue);
    } catch (error) {
      console.warn('view update failed', error);
    }
  }

  async function loadChannel() {
    try {
      const channel = app.normalizeChannel(await app.api(`/channels/slug/${encodeURIComponent(slug)}`));
      renderChannel(channel);
      await increaseView(channel.slug);
    } catch (error) {
      console.warn('channel load error', error);
      const fallback = app.FALLBACK_CHANNELS.find((item) => item.slug === slug);
      if (fallback) {
        renderChannel(app.normalizeChannel(fallback));
        return;
      }
      window.location.replace('/404.html');
    }
  }

  loadChannel();
})();
