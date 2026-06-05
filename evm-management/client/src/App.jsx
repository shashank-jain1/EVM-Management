import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import AppRoutes from './routes';
import { ToastProvider } from './components/common/Toast';
import { LanguageProvider } from '@/components/common/LanguageContext';

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
