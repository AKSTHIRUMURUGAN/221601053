'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { urlAPI } from '../services/api';
import ClientWrapper from '../components/ClientWrapper';

function SpamCheckerContent() {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [suspiciousUrl, setSuspiciousUrl] = useState('');
  const [analysisResult, setAnalysisResult] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && initialized && !loading && !user) {
      router.push('/login');
    }
  }, [user, router, mounted, initialized, loading]);

  const analyzeUrl = async () => {
    if (!suspiciousUrl.trim()) {
      setError('Please enter a URL to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError('');
    setSuccess('');
    setAnalysisResult(null);

    try {
      // First check URL security
      const securityCheck = await urlAPI.checkURLSecurity(suspiciousUrl);
      
      // Analyze redirect chain
      const redirectAnalysis = await analyzeRedirectChain(suspiciousUrl);
      
      setAnalysisResult({
        originalUrl: suspiciousUrl,
        securityCheck,
        redirectChain: redirectAnalysis.redirectChain,
        finalUrl: redirectAnalysis.finalUrl,
        isSuspicious: securityCheck.safe === false || redirectAnalysis.isSuspicious,
        recommendations: generateRecommendations(securityCheck, redirectAnalysis)
      });

      setSuccess('Analysis completed!');
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to analyze URL');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const analyzeRedirectChain = async (url) => {
    const redirectChain = [];
    let currentUrl = url;
    let isSuspicious = false;
    let finalUrl = url;
    const maxRedirects = 10;

    try {
      for (let i = 0; i < maxRedirects; i++) {
        const response = await fetch('/api/analyze-redirect', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: currentUrl }),
        });

        if (!response.ok) {
          break;
        }

        const data = await response.json();
        
        redirectChain.push({
          step: i + 1,
          url: currentUrl,
          statusCode: data.statusCode,
          redirectUrl: data.redirectUrl,
          isSuspicious: data.isSuspicious
        });

        if (data.isSuspicious) {
          isSuspicious = true;
        }

        if (!data.redirectUrl) {
          finalUrl = currentUrl;
          break;
        }

        currentUrl = data.redirectUrl;
      }
    } catch (error) {
      console.error('Error analyzing redirect chain:', error);
    }

    return {
      redirectChain,
      finalUrl,
      isSuspicious
    };
  };

  const generateRecommendations = (securityCheck, redirectAnalysis) => {
    const recommendations = [];

    if (!securityCheck.safe) {
      recommendations.push(`🚨 Security Issue: ${securityCheck.reason}`);
    }

    if (redirectAnalysis.isSuspicious) {
      recommendations.push('⚠️ Suspicious redirect chain detected');
    }

    if (redirectAnalysis.redirectChain.length > 5) {
      recommendations.push('⚠️ Too many redirects - potential redirect loop');
    }

    const finalDomain = new URL(redirectAnalysis.finalUrl).hostname;
    const originalDomain = new URL(suspiciousUrl).hostname;
    
    if (finalDomain !== originalDomain) {
      recommendations.push(`⚠️ Final destination (${finalDomain}) differs from original (${originalDomain})`);
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ URL appears safe');
    }

    return recommendations;
  };

  const createSafeShortUrl = async () => {
    if (!analysisResult) return;

    try {
      const result = await urlAPI.createShortURL({
        url: analysisResult.finalUrl,
        validity: 60 // 1 hour validity for safety
      });
      
      setSuccess(`Safe short URL created: ${result.shortLink}`);
    } catch (error) {
      setError('Failed to create safe short URL');
    }
  };

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
              <span className="h-8 w-8 text-red-600 text-2xl">🛡️</span>
              <h1 className="ml-2 text-xl font-semibold text-gray-900">Spam Link Checker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/dashboard"
                className="flex items-center px-3 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <span className="mr-1">🔗</span>
                Dashboard
              </a>
              <div className="flex items-center text-sm text-gray-700">
                <span className="mr-1">👤</span>
                {user.name}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Main Form */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Analyze Suspicious Link</h2>
            <p className="mt-1 text-sm text-gray-600">
              Paste a suspicious link from spam emails or messages to analyze its redirect chain and final destination.
            </p>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="suspiciousUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Suspicious URL
                </label>
                <input
                  type="url"
                  id="suspiciousUrl"
                  value={suspiciousUrl}
                  onChange={(e) => setSuspiciousUrl(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="https://suspicious-link.com/redirect"
                />
              </div>
              <button
                onClick={analyzeUrl}
                disabled={isAnalyzing || !suspiciousUrl.trim()}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <span className="mr-2">🔍</span>
                    Analyze Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Analysis Results */}
        {analysisResult && (
          <div className="space-y-6">
            {/* Security Summary */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Security Analysis</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Original URL:</span>
                    <span className="text-sm text-gray-900 break-all">{analysisResult.originalUrl}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Final Destination:</span>
                    <span className="text-sm text-gray-900 break-all">{analysisResult.finalUrl}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Security Status:</span>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      analysisResult.isSuspicious 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {analysisResult.isSuspicious ? '⚠️ Suspicious' : '✅ Safe'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Redirect Chain */}
            {analysisResult.redirectChain.length > 0 && (
              <div className="bg-white rounded-lg shadow">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">Redirect Chain</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {analysisResult.redirectChain.map((step, index) => (
                      <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-xs font-medium text-blue-600">{step.step}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="text-sm font-medium text-gray-900 break-all">{step.url}</span>
                            {step.isSuspicious && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                Suspicious
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {step.statusCode} {step.redirectUrl && `→ ${step.redirectUrl}`}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Recommendations</h3>
              </div>
              <div className="p-6">
                <div className="space-y-2">
                  {analysisResult.recommendations.map((rec, index) => (
                    <div key={index} className="flex items-start space-x-2">
                      <span className="text-sm">{rec}</span>
                    </div>
                  ))}
                </div>
                
                {!analysisResult.isSuspicious && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <button
                      onClick={createSafeShortUrl}
                      className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                    >
                      <span className="mr-2">🔗</span>
                      Create Safe Short URL
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SpamCheckerPage() {
  return (
    <ClientWrapper>
      <SpamCheckerContent />
    </ClientWrapper>
  );
} 