/* global browser */

import React from 'react';
import { useState, useEffect } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';

function SwitchButton({ status, onClick }) {
  const buttonLabels = {
    disabled: 'Tłumacz',
    pending: 'Trwa tłumaczenie...',
    translated: 'Wyłącz tłumaczenie'
  }

  return (
    <button type="submit" className="btn btn-custom w-100" onClick={onClick}>
      {buttonLabels[status]}
    </button>
  );
}

function LanguageSelect({ id, languages, selectedLanguage, onChange }) {
  const [selectedValue, setSelectedValue] = useState(selectedLanguage);

  const handleChange = event => {
    setSelectedValue(event.target.value);
    if (onChange) {
      onChange(event.target.id, event.target.value);
    }
  }

  return (
    <select id={id} value={selectedLanguage} className="form-select select-custom" onChange={handleChange}>
      {languages.map(language => (
        <option key={language} value={language}>{language}</option>
      ))}
    </select>
  )
}

function App() {
  const [translationStatus, setTranslationStatus] = useState('disabled');

  const [languageFrom, setLanguageFrom] = useState('');
  const [languageTo, setLanguageTo] = useState('');
  const [languagesFromList, setLanguagesFromList] = useState([]);
  const [languagesToList, setLanguagesToList] = useState([]);

  const handleSwitchButtonClick = () => {
    if (translationStatus === 'disabled') setTranslationStatus('pending');
    sendMessage('content', { header: 'switchButtonClicked' }, response => {
      setTranslationStatus(response.status ? 'translated' : 'disabled');
    });
  }

  const handleLanguageSelectChange = (changedLanguage, changedLanguageValue) => {
    sendMessage('content', {
      header: 'languageChanged',
      params: { changedLanguage: changedLanguage, changedLanguageValue: changedLanguageValue }
    }, response => {
      if (response.languageFrom) { setLanguageFrom(response.languageFrom) }
      if (response.languageTo) { setLanguageTo(response.languageTo) }
    });
  }

  const sendMessage = (target, message, messageHandler) => {
    if (target === 'content') {
      browser.tabs.query({ currentWindow: true, active: true }).then(tabs => {
        for (let tab of tabs) {
          browser.tabs.sendMessage(tab.id, message).then(messageHandler);
        }
      }).catch(error => console.error(error));
    }
  }

  useEffect(() => {
    sendMessage('content', { header: 'getLanguages' }, response => {
      setLanguagesFromList(response.languagesFromList);
      setLanguagesToList(response.languagesToList);
      setLanguageFrom(response.languageFrom);
      setLanguageTo(response.languageTo);
    });
    sendMessage('content', { header: 'getTranslationStatus' }, response => {
      setTranslationStatus(response.status ? 'translated' : 'disabled');
    });
  }, []);

  return (<>
    <nav className="navbar p-2 navbar-expand-lg navbar-light navbar-custom">
      <div className="container-fluid">
        <h1>Owlie</h1>
        <div className="d-flex align-items-center">
          <a href="#" className="nav-link">
            <i className="bi bi-gear-fill"></i>
          </a>
          <a href="#" className="nav-link">
            <i className="bi bi-person-fill"></i>
          </a>
        </div>
      </div>
    </nav>

    <div className="container p-2">
      <div className="row">
        <div className="col">
          <label htmlFor="langFrom" className="form-label">Z:</label>
          <LanguageSelect 
            id="langFrom" 
            languages={languagesFromList}
            selectedLanguage={languageFrom}
            onChange={handleLanguageSelectChange}
          />
        </div>
        <div className="col">
        <label htmlFor="langTo" className="form-label">Na:</label>
          <LanguageSelect 
            id="langTo" 
            languages={languagesToList}
            selectedLanguage={languageTo}
            onChange={handleLanguageSelectChange}
          />
        </div>
      </div>
      <SwitchButton status={translationStatus} onClick={handleSwitchButtonClick} />
    </div>

    <div className="container p-2 additional-options">
      z: {languageFrom}, na: {languageTo}, status: {translationStatus}
    </div>
  </>);
}

export default App;