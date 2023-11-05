import { createBrowserRouter } from 'react-router-dom';
import App from './App';

export const router = createBrowserRouter([
  {
    path: '/',
    children: [{ index: true, element: <App /> }],
  },
]);
