import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Asigură-te că ai acest fișier, altfel șterge linia

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
