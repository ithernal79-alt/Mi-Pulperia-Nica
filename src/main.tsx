import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Registrar Service Worker para permitir funcionamiento local 100% sin internet
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('Nueva versión del sistema disponible.');
  },
  onOfflineReady() {
    console.log('Sistema de pulpería listo para trabajar sin conexión.');
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
