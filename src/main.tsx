import React from 'react';
import { createRoot } from 'react-dom/client';
import { MyrialeApp } from './app/MyrialeApp';
import './styles.css';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Myriale app root element was not found.');
}

createRoot(root).render(
  <React.StrictMode>
    <MyrialeApp historyMode="browser" showDebugPanel={false} />
  </React.StrictMode>,
);
