"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-purple-50 to-white">
          <div className="text-center p-8">
            <h1 className="text-4xl font-bold text-purple-900 mb-4">
              Something went wrong
            </h1>
            <p className="text-gray-600 mb-6">
              We&apos;ve been notified and are working on a fix.
            </p>
            <button
              onClick={reset}
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
