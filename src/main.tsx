import '@assets/css/index.css';
import { createRoot } from 'react-dom/client';
import { AppProviders } from './providers';

createRoot(document.getElementById('root')!).render(<AppProviders />);
