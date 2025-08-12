

import { WebContainer } from '@webcontainer/api';
import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion'; // Ensure motion is imported for animations

// Utility function to conditionally join Tailwind CSS classes.
// This is a common pattern for handling dynamic classes.
function cn(...inputs: (string | undefined | null | boolean)[]) {
  return inputs.filter(Boolean).join(' ');
}

interface PreviewFrameProps {
  files: any[];
  webContainer: WebContainer | null; // Allow webContainer to be null initially
}

// --- Inline SVG Icons (replacing lucide-react for self-containment) ---

// Custom Spinner SVG (replaces Loader2)
const CustomSpinner = () => (
  <svg
    className="w-full h-full text-blue-500"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 2v4" />
    <path d="M12 18v4" />
    <path d="M4.93 4.93l2.83 2.83" />
    <path d="M16.24 16.24l2.83 2.83" />
    <path d="M2 12h4" />
    <path d="M18 12h4" />
    <path d="M4.93 19.07l2.83-2.83" />
    <path d="M16.24 7.76l2.83-2.83" />
  </svg>
);

// Custom Alert Octagon SVG (replaces AlertOctagon)
const CustomAlertOctagon = () => (
  <svg
    className="h-12 w-12 text-red-500 mx-auto"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"></polygon>
    <line x1="12" y1="8" x2="12" y2="12"></line>
    <line x1="12" y1="16" x2="12.01" y2="16"></line>
  </svg>
);

// Custom Refresh Icon SVG (replaces RefreshCw)
const CustomRefreshCw = () => (
  <svg
    className="h-5 w-5"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10"></polyline>
    <polyline points="1 20 1 14 7 14"></polyline>
    <path d="M3.5 15.2a9 9 0 0 1 0-10.4c1.6-2.5 4.4-4 7.5-4h.5c4.7 0 8.5 3.8 8.5 8.5a8.5 8.5 0 0 1-8.5 8.5c-2.6 0-4.9-1.2-6.5-3.2"></path>
  </svg>
);


// --- UI Components ---

// Loading State Component
const LoadingState = ({ message }: { message: string }) => (
  <div className="text-center p-8 flex flex-col items-center justify-center gap-5">
    {/* Enhanced spinner for premium feel */}
    <motion.div
      initial={{ rotate: 0 }}
      animate={{ rotate: 360 }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
      className="relative w-16 h-16"
    >
      <CustomSpinner /> {/* Using custom SVG spinner */}
      <span className="absolute inset-0 rounded-full border-2 border-transparent border-t-blue-300 animate-spin-slow"></span>
    </motion.div>
    <p className="text-gray-200 font-semibold text-lg">{message}</p>
    <p className="text-sm text-gray-400">This might take a moment depending on dependencies.</p>
  </div>
);

// Error Display Component
const ErrorDisplay = ({ error, onRetry }: { error: string; onRetry: () => void }) => (
  <div className="text-center p-8 bg-gradient-to-br from-red-900/20 to-gray-900/20 rounded-xl border border-red-800/40 shadow-xl max-w-lg mx-auto">
    <CustomAlertOctagon /> {/* Using custom SVG alert octagon */}
    <h3 className="text-red-400 font-bold text-xl mb-3">Preview Error Encountered</h3>
    <p className="text-gray-300 text-base leading-relaxed mb-6">{error}</p>
    <button
      onClick={onRetry}
      className="inline-flex items-center gap-3 px-6 py-3 bg-red-700/40 hover:bg-red-700/60 text-gray-100 rounded-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 focus:ring-offset-gray-950 shadow-md"
    >
      <CustomRefreshCw /> {/* Using custom SVG refresh icon */}
      <span className="font-semibold">Try Again</span>
    </button>
  </div>
);

// --- Main PreviewFrame Component ---

export function PreviewFrame({ files, webContainer }: PreviewFrameProps) {
  const [url, setUrl] = useState<string>('');
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState<boolean>(false); // Tracks if webcontainer is fully ready for preview
  const [retryAttempt, setRetryAttempt] = useState(0); // Renamed for clarity

  // Helper function to handle npm install process
  const handleInstall = useCallback(async () => {
    if (!webContainer) {
      setError('WebContainer not initialized.');
      return false;
    }
    setLoadingMessage('Installing dependencies...');
    try {
      const installProcess = await webContainer.spawn('npm', ['install']);

      // Stream the install output to console (optional, for debugging)
      installProcess.output.pipeTo(
        new WritableStream({
          write() { /* console.log(`[npm install]: ${data}`); */ },
        })
      );

      const installExitCode = await installProcess.exit;

      if (installExitCode !== 0) {
        setError(
          `npm install failed with exit code ${installExitCode}. Please check your package.json or dependency versions.`
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('NPM Install failed:', err);
      setError(`Failed to install dependencies: ${err instanceof Error ? err.message : 'Unknown error'}.`);
      return false;
    }
  }, [webContainer]); // Dependency on webContainer

  // Helper function to handle dev server startup
  const handleDevStart = useCallback(async () => {
    if (!webContainer) {
      setError('WebContainer not initialized for dev server.');
      return false;
    }
    setLoadingMessage('Starting development server...');
    try {
      const devProcess = await webContainer.spawn('npm', ['run', 'dev', '--', '--host']);

      devProcess.output.pipeTo(
        new WritableStream({
          write() { /* console.log(`[npm run dev]: ${data}`); */ },
        })
      );

      // Listen for the server-ready event from WebContainer
      webContainer.on('server-ready', (port, serverUrl) => {
        // console.log(`Server ready at ${serverUrl} (port ${port})`);
        setUrl(serverUrl);
        setIsReady(true); // Mark as ready when URL is available
        setLoadingMessage(''); // Clear loading message
        setError(null); // Clear any previous errors
      });

      return true;
    } catch (err) {
      console.error('Failed to start dev server:', err);
      setError(`Failed to start development server: ${err instanceof Error ? err.message : 'Unknown error'}. Ensure 'npm run dev' script is correctly defined.`);
      return false;
    }
  }, [webContainer]); // Dependency on webContainer

  // Main function to orchestrate the preview setup
  const startPreviewEnvironment = useCallback(async () => {
    setError(null); // Clear errors at the start of a new attempt
    setIsReady(false); // Reset ready state
    setUrl(''); // Clear previous URL
    setLoadingMessage('Initializing WebContainer...'); // Initial loading message

    if (!webContainer || files.length === 0) {
      // Defer execution if webContainer isn't ready or files are empty
      // This might happen on initial render before webContainer is fully loaded
      setLoadingMessage('Waiting for files and WebContainer...');
      return;
    }

    try {
      const installSuccess = await handleInstall();
      if (!installSuccess) {
        setLoadingMessage(''); // Clear loading message on install failure
        return;
      }

      const devStartSuccess = await handleDevStart();
      if (!devStartSuccess) {
        setLoadingMessage(''); // Clear loading message on dev start failure
        return;
      }

    } catch (err) {
      console.error('Overall preview setup failed:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';

      if (errorMessage.includes('SharedArrayBuffer') || errorMessage.includes('crossOriginIsolated')) {
        setError(
          'Your browser might require **Cross-Origin Isolation** for the preview. Please ensure `Cross-Origin-Opener-Policy` and `Cross-Origin-Embedder-Policy` headers are set on the serving domain. Try restarting the dev server or using a different browser (e.g., latest Chrome/Firefox).'
        );
      } else {
        setError(`Failed to set up preview environment: ${errorMessage}.`);
      }
      setLoadingMessage(''); // Clear loading message on overall failure
    }
  }, [webContainer, files.length, handleInstall, handleDevStart]); // Dependencies for useCallback

  // Effect to trigger the preview setup
  useEffect(() => {
    startPreviewEnvironment();
  }, [startPreviewEnvironment, retryAttempt]); // Trigger when `startPreviewEnvironment` changes or `retryAttempt` increases

  // Handler for retry button
  const handleRetry = () => {
    setRetryAttempt(prev => prev + 1); // Increment to trigger useEffect
  };

  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center bg-gray-950 rounded-xl overflow-hidden border border-gray-800 shadow-lg">
      {/* Loading state overlay */}
      {(loadingMessage || (!isReady && !error)) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm z-10 transition-opacity duration-500 ease-out opacity-100">
          <LoadingState message={loadingMessage || 'Preparing preview...'} />
        </div>
      )}

      {/* Error state overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950/80 backdrop-blur-sm z-10 transition-opacity duration-500 ease-out opacity-100 p-4">
          <ErrorDisplay error={error} onRetry={handleRetry} />
        </div>
      )}

      {/* Iframe for the preview */}
      <iframe
        src={url || 'about:blank'} // Use 'about:blank' as a fallback for empty URL
        className={cn(
          "w-full h-full border-0 rounded-xl",
          "transition-opacity duration-700 ease-in-out", // Smooth fade-in
          isReady && !error ? "opacity-100" : "opacity-0" // Control opacity based on ready state
        )}
        title="Wilder Live Preview"
        sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; payment; usb; xr-spatial-tracking"
      />
    </div>
  );
}
