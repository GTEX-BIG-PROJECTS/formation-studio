import React from 'react';
import ReactDOM from 'react-dom/client';
import { Analytics } from '@vercel/analytics/react';
import FormationStudio from './FormationStudio';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <FormationStudio />
    <Analytics />
  </React.StrictMode>
);
