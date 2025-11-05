/* global browser */

function updateBrowserAction(tabId) {
  try {
    browser.tabs.sendMessage(tabId, { header: 'getTranslationStatus' }).then(response => {
      setBrowserAction(response.status);
    });
  } 
	catch (error) {
    setBrowserAction(false);
  }
}

function setBrowserAction(status) {
  browser.browserAction.setIcon({ path: `./owlie${status ? '' : '-asleep'}.svg` });
}

browser.tabs.onUpdated.addListener(tabId => updateBrowserAction(tabId));
browser.tabs.onActivated.addListener(activeInfo => updateBrowserAction(activeInfo.tabId));

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.header) {
    case 'translationStatus':
      setBrowserAction(message.params.status);
      break;

    default:
      break;
  }
});