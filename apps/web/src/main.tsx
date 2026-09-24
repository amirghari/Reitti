import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Self-hosted via @fontsource — no request leaves the device for a font. The
// design export loads these two from Google Fonts; that is the one thing from it
// that can never be copied, because a font request leaks an IP on every page
// load and the promise here is that answers never leave the device.
import '@fontsource-variable/fraunces';
import '@fontsource-variable/inter';

import App from './App';
import './styles.css';

const container = document.getElementById('root');
if (!container) throw new Error('Missing #root');

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
