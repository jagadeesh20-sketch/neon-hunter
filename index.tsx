import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  // StrictMode is temporarily disabled here because it causes Phaser to init twice rapidly,
  // which can cause context loss in some strict browser environments, though our cleanup handles it.
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
