import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// MSW worker for browser (development)
export const worker = setupWorker(...handlers);
