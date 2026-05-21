import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary.tsx';
import FirebaseInitError from './components/FirebaseInitError.tsx';
import { AuthProvider } from './context/AuthContext.tsx';
import { isPreviewUiMode } from './lib/appMode.ts';
import { firebaseInitError, isFirebaseConfigured } from './lib/firebase.ts';

const root = createRoot(document.getElementById('root')!);

if (isFirebaseConfigured && !isPreviewUiMode() && firebaseInitError) {
  root.render(
    <StrictMode>
      <FirebaseInitError />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
