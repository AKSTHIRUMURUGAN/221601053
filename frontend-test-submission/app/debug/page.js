'use client';

import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { urlAPI } from '../services/api';
import ClientWrapper from '../components/ClientWrapper';

function DebugContent() {
  const { user, profile } = useAuth();
  const [debugResult, setDebugResult] = useState(null);
  const [debugIdResult, setDebugIdResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const debugShortcode = async (shortcode) => {
    setLoading(true);
    try {
      const result = await urlAPI.debugShortURL(shortcode);
      setDebugResult(result);
    } catch (error) {
      console.error('Debug error:', error);
      setDebugResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const debugById = async (id) => {
    setLoading(true);
    try {
      const result = await urlAPI.debugShortURLById(id);
      setDebugIdResult(result);
    } catch (error) {
      console.error('Debug ID error:', error);
      setDebugIdResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Please log in to access debug tools.</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Debug Tools</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">User Profile Data</h2>
          <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium mb-4">Debug Shortcode</h2>
          <div className="space-y-4">
            {profile?.shortenedUrls?.map((url) => (
              <div key={url._id} className="border p-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Shortcode: {url.shortcode}</span>
                  <button
                    onClick={() => debugShortcode(url.shortcode)}
                    disabled={loading}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? 'Debugging...' : 'Debug'}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Original: {url.originalURL}
                </div>
              </div>
            ))}
          </div>

          {debugResult && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Debug Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugResult, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <h2 className="text-lg font-medium mb-4">Debug by ID</h2>
          <div className="space-y-4">
            {profile?.shortenedUrls?.map((url) => (
              <div key={url._id} className="border p-4 rounded">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">ID: {url._id}</span>
                  <button
                    onClick={() => debugById(url._id)}
                    disabled={loading}
                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? 'Debugging...' : 'Debug ID'}
                  </button>
                </div>
                <div className="text-sm text-gray-600">
                  Shortcode: {url.shortcode} | Original: {url.originalURL}
                </div>
              </div>
            ))}
          </div>

          {debugIdResult && (
            <div className="mt-6">
              <h3 className="font-medium mb-2">Debug ID Result:</h3>
              <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
                {JSON.stringify(debugIdResult, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DebugPage() {
  return (
    <ClientWrapper>
      <DebugContent />
    </ClientWrapper>
  );
} 