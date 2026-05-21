import { firebaseInitError, isFirebaseConfigured } from '../lib/firebase';

export default function FirebaseInitError() {
  if (!isFirebaseConfigured || !firebaseInitError) return null;

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm p-6">
        <h1 className="text-lg font-bold text-gray-900 mb-2">Firebase failed to start</h1>
        <p className="text-sm text-rose-600 break-words mb-4">{firebaseInitError}</p>
        <p className="text-xs text-gray-500">
          Try opening the app in Chrome instead of the IDE preview panel.
        </p>
      </div>
    </div>
  );
}
