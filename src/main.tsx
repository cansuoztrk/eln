import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { useView } from './core/store/viewStore';
import { useDesign } from './core/store/designStore';
import { worldApi } from './world/worldApi';

// Test hook for automated end-to-end checks (enabled only with ?e2e=1 or in dev).
if (import.meta.env.DEV || new URLSearchParams(window.location.search).has('e2e')) {
  (window as unknown as { __aslan: unknown }).__aslan = { useView, useDesign, worldApi };
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
