/* global browser */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import styles from './TranslationsPopup.module.css';

// status tłumaczenia

const statusManager = {
  _status: false,
  _listeners: [],

  get status() {
    return this._status;
  },

  set status(value) {
    this._status = value;
    this._listeners.forEach(listener => listener(value));
  },

  subscribe(listener) {
    this._listeners.push(listener);
  },

  unsubscribe(listener) {
    this._listeners = this._listeners.filter(l => l !== listener);
  }
};

// komponenty react

function ShadowContainer() {

  return (<>
  
  </>);
}

function TranslationsPopup({ close, word, rect }) {
  const style = {
    left: `${rect.left + window.scrollX}px`,
    top: `${rect.bottom + window.scrollY}px`,
  }

  return (
    <div className='popup-container' style={style}>
      <h1>{word}</h1>
      <button onClick={close}>Zamknij</button>
    </div>
  );
}

// deklaracje funkcji

const shadowHost = document.createElement('div');
const shadowRoot = shadowHost.attachShadow({ mode: 'closed' });
const root = createRoot(shadowRoot);
const link = document.createElement('link');
link.setAttribute('rel', 'stylesheet');
link.setAttribute('href', );
shadowRoot.appendChild(link);

const closePopup = () => {
  if (document.contains(shadowHost)) document.body.removeChild(shadowHost);
};

const openPopup = target => {
  document.body.appendChild(shadowHost);

  const rect = target.getBoundingClientRect();

  root.render(<TranslationsPopup close={closePopup} word={target.textContent} rect={rect} />);

  document.addEventListener('click', function handleClickOutside(event) {
    if (!shadowHost.contains(event.target) && event.target !== target) {
      closePopup();
      document.removeEventListener('click', handleClickOutside);
    }
  });
};

const highlightMatches = node => {
  const ignoredTagsList = ['SCRIPT', 'NOSCRIPT', 'STYLE', 'TEXTAREA'];

  if (node.nodeType === Node.DOCUMENT_NODE || node.nodeType === Node.ELEMENT_NODE) {
    if (!ignoredTagsList.includes(node.nodeName) && !/[a-z]/.test(node.nodeName)) {
      for (const childNode of node.childNodes) highlightMatches(childNode);
    }
  }
  else if (node.nodeType === Node.TEXT_NODE) {
    new Promise((resolve, reject) => {
      const regex = /\p{L}+/gmu;
      const parts = node.textContent.split(regex);
      const matches = node.textContent.match(regex);

      const replacement = document.createDocumentFragment();

      parts.map((part, index) => {
        const partNode = document.createTextNode(part);
        replacement.appendChild(partNode);

        if (matches && matches[index]) {
          const matchNode = document.createElement('em');
          matchNode.innerText = matches[index];
          matchNode.className = 'owlie-highlight';
          matchNode.addEventListener('click', event => {
            event.preventDefault();
            event.stopPropagation();
            openPopup(event.target);
          });
          replacement.appendChild(matchNode);
        }
      });

      resolve(replacement);
    })
    .then(replacement => {
      observer.takeRecords();
      observer.disconnect();
      node.replaceWith(replacement);
      observer.observe(document.body, { childList: true, subtree: true });
    })
    .catch(error => console.error(error));
  }
};

const removeHighlight = () => {
  document.querySelectorAll('em.owlie-highlight').forEach(elementNode => {
    const textNode = document.createTextNode(elementNode.textContent);
    elementNode.parentNode.replaceChild(textNode, elementNode);
  });
};

const toggleExtension = () => {
  const updatedStatus = !statusManager.status;
  statusManager.status = updatedStatus;

  if (updatedStatus) {
    highlightMatches(document.body);
  }
  else {
    removeHighlight();
    closePopup();
  }
  
  browser.runtime.sendMessage({ header: 'translationStatus', params: { status: updatedStatus } });

  return new Promise((resolve, reject) => {
    resolve(updatedStatus);
  });
};

const prioritizeLanguages = (languagesList, ...priorityLanguages) => {
  return [...new Set(priorityLanguages).intersection(new Set(languagesList)).union(new Set(languagesList))];
};

const cleanLanguages = (changedLanguage, changedLanguageValue) => {
  let response = {};

  if (changedLanguage === 'langFrom') {
    if (changedLanguageValue === languageTo) {
      response['languageTo'] = languageFrom;
      languageTo = languageFrom;
    }
    response['languageFrom'] = changedLanguageValue;
    languageFrom = changedLanguageValue;
  }
  else if (changedLanguage === 'langTo') {
    if (changedLanguageValue === languageFrom) {
      response['languageFrom'] = languageTo;
      languageFrom = languageTo;
    }
    response['languageTo'] = changedLanguageValue;
    languageTo = changedLanguageValue;
  }
  return response;
};

const messageListener = (message, sender, sendResponse) => {
  switch (message.header) {
    case 'getTranslationStatus':
      sendResponse({ status: statusManager.status });
      break;

    case 'switchButtonClicked':
      toggleExtension().then(status => {
        sendResponse({ status: status });
      }).catch(error => console.error(error));
      return true;

    case 'getLanguages':
      sendResponse({
        languagesFromList: languagesFromList,
        languagesToList: languagesToList,
        languageFrom: languageFrom,
        languageTo: languageTo
      });
      return true;

    case 'languageChanged':
      sendResponse(cleanLanguages(message.params.changedLanguage, message.params.changedLanguageValue));
      return true;

    default:
      break;
  }
};

// obserwacja zmian

const observer = new MutationObserver(mutations => {
  if (statusManager.status) {
    for (const mutation of mutations) { 
      for (const node of mutation.addedNodes) highlightMatches(node);
    }
  }
});

// deklaracje zmiennych

let languagesToList, languageTo, languagesFromList, languageFrom;

const availableLanguages = ['de', 'fr', 'pl', 'en', 'ru', 'ja', 'es'];

// wywołania funkcji

browser.runtime.onMessage.addListener(messageListener);

const sortedLanguagesToList = prioritizeLanguages(availableLanguages, navigator.language);
languagesToList = sortedLanguagesToList;
languageTo = sortedLanguagesToList[0];

browser.i18n.detectLanguage(document.body.innerText).then(result => {
  const sortedLanguagesFromList = prioritizeLanguages(
    availableLanguages,
    ...result.languages.map(language => language.language)
  );
  languagesFromList = sortedLanguagesFromList;
  languageFrom = sortedLanguagesFromList.filter(lang => lang !== sortedLanguagesToList[0])[0];
}).catch(error => console.error(error));