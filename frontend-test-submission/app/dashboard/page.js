'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { urlAPI } from '../services/api';

export default function DashboardPage() {
  const { user, profile, logout, refreshProfile, loading, initialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [formData, setFormData] = useState({
    url: '',
    shortcode: '',
    validity: 30,
  });
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [copiedUrl, setCopiedUrl] = useState('');
  const [editingUrl, setEditingUrl] = useState(null);
  const [editFormData, setEditFormData] = useState({
    url: '',
    validity: 30,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [urlSecurityCheck, setUrlSecurityCheck] = useState({ safe: true, reason: '' });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    // Only redirect if mounted, initialized, not loading, and no user
    if (mounted && initialized && !loading && !user) {
      router.push('/login');
    }
  }, [user, router, mounted, initialized, loading]);

  // Ensure profile data is loaded when user is available
  useEffect(() => {
    if (mounted && user && !profile) {
      refreshProfile().catch(console.error);
    }
  }, [user, profile, mounted, refreshProfile]);

  // Check URL security when URL changes
  useEffect(() => {
    const checkSecurity = async () => {
      if (formData.url && formData.url.length > 10) {
        try {
          const result = await urlAPI.checkURLSecurity(formData.url);
          setUrlSecurityCheck(result);
        } catch (error) {
          setUrlSecurityCheck({ safe: false, reason: 'Failed to check URL security' });
        }
      } else {
        setUrlSecurityCheck({ safe: true, reason: '' });
      }
    };

    const timeoutId = setTimeout(checkSecurity, 1000);
    return () => clearTimeout(timeoutId);
  }, [formData.url]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await urlAPI.createShortURL(formData);
      setSuccess('URL shortened successfully!');
      setFormData({ url: '', shortcode: '', validity: 30 });
      setUrlSecurityCheck({ safe: true, reason: '' });
      await refreshProfile(); // Refresh to show new URL
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to shorten URL');
    } finally {
      setFormLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedUrl(text);
      setTimeout(() => setCopiedUrl(''), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  const deleteURL = async (id) => {
    if (confirm('Are you sure you want to delete this URL?')) {
      try {
        const result = await urlAPI.deleteURL(id);
        await refreshProfile();
        setSuccess(result.wasExpired 
          ? 'Expired URL deleted successfully!' 
          : 'URL deleted successfully!'
        );
        setError(''); // Clear any previous errors
      } catch (error) {
        console.error('Delete error:', error);
        setError(error.response?.data?.message || 'Failed to delete URL. Please try again.');
        setSuccess(''); // Clear any previous success messages
      }
    }
  };

  const startEdit = (url) => {
    setEditingUrl(url);
    const isExpired = new Date(url.expiryDate) < new Date();
    
    // For expired URLs, set validity to 60 minutes by default
    const defaultValidity = isExpired ? 60 : Math.ceil((new Date(url.expiryDate) - new Date()) / (1000 * 60));
    
    setEditFormData({
      url: url.originalURL,
      validity: Math.max(defaultValidity, 1), // Ensure at least 1 minute
    });
  };

  const cancelEdit = () => {
    setEditingUrl(null);
    setEditFormData({ url: '', validity: 30 });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await urlAPI.updateShortURL(editingUrl._id, editFormData);
      setSuccess(result.wasExpired 
        ? 'Expired URL updated and reactivated successfully!' 
        : 'URL updated successfully!'
      );
      setEditingUrl(null);
      setEditFormData({ url: '', validity: 30 });
      await refreshProfile();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update URL');
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value,
    });
  };

  const extendExpiredURL = async (url) => {
    if (confirm('Do you want to extend this expired URL by 60 minutes?')) {
      try {
        const result = await urlAPI.updateShortURL(url._id, { validity: 60 });
        await refreshProfile();
        setSuccess('Expired URL extended successfully!');
        setError('');
      } catch (error) {
        setError(error.response?.data?.message || 'Failed to extend URL');
        setSuccess('');
      }
    }
  };

  // Show loading state until component is mounted, auth is initialized, and user is loaded
  if (!mounted || !initialized || loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <span className="h-8 w-8 text-blue-600 text-2xl">🔗</span>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">URL Shortener</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/spam-checker"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-1">🛡️</span>
                Spam Checker
              </a>
              <div className="flex items-center text-sm text-gray-700">
                <span className="mr-1">👤</span>
                {user.name}
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-1">🚪</span>
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 text-green-600 px-4 py-3 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-blue-600 text-xl">🔗</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total URLs</p>
                <p className="text-2xl font-semibold text-gray-900">{profile?.totalUrls || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <span className="text-green-600 text-xl">📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Clicks</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {profile?.shortenedUrls?.reduce((total, url) => total + (url.clicks?.length || 0), 0) || 0}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <span className="text-purple-600 text-xl">⏰</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active URLs</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {profile?.shortenedUrls?.filter(url => new Date(url.expiryDate) > new Date()).length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* URL Shortener Form */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Shorten New URL</h2>
          </div>
          <div className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
                    Original URL *
                  </label>
                  <input
                    type="url"
                    id="url"
                    name="url"
                    required
                    value={formData.url}
                    onChange={handleChange}
                    className={`block w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      formData.url && !urlSecurityCheck.safe ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="https://example.com"
                  />
                  {formData.url && !urlSecurityCheck.safe && (
                    <p className="mt-1 text-sm text-red-600">
                      ⚠️ {urlSecurityCheck.reason}
                    </p>
                  )}
                  {formData.url && urlSecurityCheck.safe && urlSecurityCheck.reason && (
                    <p className="mt-1 text-sm text-green-600">
                      ✅ {urlSecurityCheck.reason}
                    </p>
                  )}
                </div>
                <div>
                  <label htmlFor="shortcode" className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Shortcode (optional)
                  </label>
                  <input
                    type="text"
                    id="shortcode"
                    name="shortcode"
                    value={formData.shortcode}
                    onChange={handleChange}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="my-custom-link"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="validity" className="block text-sm font-medium text-gray-700 mb-2">
                  Validity (minutes)
                </label>
                <input
                  type="number"
                  id="validity"
                  name="validity"
                  min="1"
                  value={formData.validity}
                  onChange={handleChange}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                disabled={formLoading || (formData.url && !urlSecurityCheck.safe)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {formLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Shortening...
                  </>
                ) : (
                  <>
                    <span className="mr-2">➕</span>
                    Shorten URL
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* URLs List */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Your URLs</h2>
          </div>
          <div className="p-6">
            {!profile?.shortenedUrls || profile.shortenedUrls.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-4xl mb-4 block">🔗</span>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No URLs yet</h3>
                <p className="mt-1 text-sm text-gray-500">Get started by shortening your first URL.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {profile.shortenedUrls.map((url) => {
                  const isExpired = new Date(url.expiryDate) < new Date();
                  const shortUrl = `https://two21601053.onrender.com/${url.shortcode}`;
                  const isEditing = editingUrl?._id === url._id;
                  
                  return (
                    <div key={url._id} className="border border-gray-200 rounded-lg p-4">
                      {isEditing ? (
                        // Edit Form
                        <form onSubmit={handleEditSubmit} className="space-y-4">
                          {new Date(url.expiryDate) < new Date() && (
                            <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded-lg text-sm">
                              ⚠️ This URL has expired. You can update it to reactivate it.
                            </div>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Original URL
                              </label>
                              <input
                                type="url"
                                name="url"
                                required
                                value={editFormData.url}
                                onChange={handleEditChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Validity (minutes)
                              </label>
                              <input
                                type="number"
                                name="validity"
                                min="1"
                                value={editFormData.validity}
                                onChange={handleEditChange}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              type="submit"
                              disabled={editLoading}
                              className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
                            >
                              {editLoading ? (
                                <>
                                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <span className="mr-1">💾</span>
                                  {new Date(url.expiryDate) < new Date() ? 'Reactivate' : 'Save'}
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={cancelEdit}
                              className="flex items-center px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors text-sm"
                            >
                              <span className="mr-1">❌</span>
                              Cancel
                            </button>
                          </div>
                        </form>
                      ) : (
                        // Display Mode
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 mb-2">
                              <h3 className="text-sm font-medium text-gray-900 truncate">
                                {url.shortcode}
                              </h3>
                              {isExpired && (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                  Expired
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 truncate mb-2">
                              {url.originalURL}
                            </p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>Created: {new Date(url.createdAt).toLocaleDateString()}</span>
                              <span>Expires: {new Date(url.expiryDate).toLocaleDateString()}</span>
                              <span>Clicks: {url.clicks?.length || 0}</span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => copyToClipboard(shortUrl)}
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Copy URL"
                            >
                              {copiedUrl === shortUrl ? (
                                <span className="text-green-600">✅</span>
                              ) : (
                                <span>📋</span>
                              )}
                            </button>
                            <a
                              href={shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                              title="Open URL"
                            >
                              <span>🔗</span>
                            </a>
                            {isExpired && (
                              <button
                                onClick={() => extendExpiredURL(url)}
                                className="p-2 text-gray-400 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
                                title="Extend URL"
                              >
                                <span>⏰</span>
                              </button>
                            )}
                            <button
                              onClick={() => startEdit(url)}
                              className="p-2 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
                              title="Edit URL"
                            >
                              <span>✏️</span>
                            </button>
                            <button
                              onClick={() => deleteURL(url._id)}
                              className="p-2 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                              title="Delete URL"
                            >
                              <span>🗑️</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 