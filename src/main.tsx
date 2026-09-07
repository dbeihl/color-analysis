import { createRoot } from 'react-dom/client';
import './knowledge/load';
import './styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Missing application root');
createRoot(root).render(null);
