'use strict';

window.MediaSok = (() => {
  const data = window.MediaSokData;
  const apiModule = window.MediaSokApi;
  const utils = window.MediaSokUtils;
  const storage = window.MediaSokStorage;
  const ui = window.MediaSokUi;
  const layout = window.MediaSokLayout;
  const templates = window.MediaSokTemplates;

  return Object.freeze({
    API_BASE: data.API_BASE,
    FALLBACK_CHANNELS: data.FALLBACK_CHANNELS,
    SOCIAL_META: data.SOCIAL_META,
    ALL_REGIONS: data.ALL_REGIONS,
    api: apiModule.api,
    escapeHtml: utils.escapeHtml,
    safeDecode: utils.safeDecode,
    slugFromPath: utils.slugFromPath,
    queryParam: utils.queryParam,
    channelIdentifierFromLocation: utils.channelIdentifierFromLocation,
    channelUrl: utils.channelUrl,
    moderationEditUrl: utils.moderationEditUrl,
    normalizeChannel: utils.normalizeChannel,
    normalizeUrl: utils.normalizeUrl,
    isLinkValidForType: utils.isLinkValidForType,
    socialEntries: utils.socialEntries,
    socialLinksHtml: utils.socialLinksHtml,
    formatImplementation: utils.formatImplementation,
    parseJwtPayload: utils.parseJwtPayload,
    isTokenFresh: utils.isTokenFresh,
    defaultLogo: utils.defaultLogo,
    mountLayout: layout.mountLayout,
    bindGlobalUi: ui.bindGlobalUi,
    openHowItWorks: ui.openHowItWorks,
    closeHowItWorks: ui.closeHowItWorks,
    showToast: ui.showToast,
    getStoredToken: storage.getStoredToken,
    setStoredToken: storage.setStoredToken,
    channelCardHtml: templates.channelCardHtml,
    emptyStateHtml: templates.emptyStateHtml,
    setLoading: templates.setLoading,
    shouldIncreaseView: storage.shouldIncreaseView,
    markViewed: storage.markViewed,
    getStoredPendingPreview: storage.getStoredPendingPreview,
    setStoredPendingPreview: storage.setStoredPendingPreview,
    clearStoredPendingPreview: storage.clearStoredPendingPreview
  });
})();
