import { ArrowLeft, GraduationCap, Map as MapIcon, Search, Filter, Globe, AlertCircle, Send, CheckCircle } from 'lucide-react';
import React, { useState } from 'react';
import { universities } from '../data';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [reportMessage, setReportMessage] = useState('');
  const [reportUniversity, setReportUniversity] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportStatus('submitting');

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          subject: "New Error Report from FindYourUni.eu",
          from_name: "Anonymous User",
          university: reportUniversity || "Not specified",
          message: reportMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReportStatus('success');
        setReportMessage('');
        setReportUniversity('');
        setTimeout(() => {
          setIsReportFormOpen(false);
          setReportStatus('idle');
        }, 3000);
      } else {
        alert("Something went wrong while sending your report. Please try again later.");
        setReportStatus('idle');
      }
    } catch {
      alert("Something went wrong while sending your report. Please check your internet connection.");
      setReportStatus('idle');
    }
  };

  return (
    <div className="h-[100dvh] overflow-y-auto bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b px-4 md:px-6 py-3 md:py-4 shadow-sm flex items-center gap-4 bg-white/90 backdrop-blur-md">
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-full hover:bg-slate-100 transition-colors text-slate-600"
          aria-label="Back to map"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-1.5 md:p-2 rounded-lg shadow-blue-200 shadow-lg shrink-0">
            <GraduationCap className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <h1 className="text-base md:text-xl font-bold tracking-tight leading-none" style={{ fontFamily: 'var(--font-display)' }}>
            About
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900" style={{ fontFamily: 'var(--font-display)' }}>
            Find your dream university in Europe
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            FindYourUni.eu is an interactive map and search engine designed to help prospective students discover the best universities across Europe.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold mb-6" style={{ fontFamily: 'var(--font-display)' }}>How to use the platform?</h3>
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded-xl h-fit shrink-0">
                <MapIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Explore the map</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Browse universities located in various cities and countries. Zoom in, zoom out, and click on markers to see details.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-violet-50 p-3 rounded-xl h-fit shrink-0">
                <Search className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Search</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Type the name of a university, city, or country in the search bar to instantly find institutions of interest.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-amber-50 p-3 rounded-xl h-fit shrink-0">
                <Filter className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Filter</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Use filters to narrow down results to a specific country or field of study.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-emerald-50 p-3 rounded-xl h-fit shrink-0">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Compare</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Check university positions in European and world rankings to make the best decision for your future.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Methodology / Data */}
        <section className="space-y-4">
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Where do we get our data?</h3>
          <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
            <p>
              Our database is based on the prestigious <strong>QS World University Rankings</strong>. We strive to regularly update university positions to provide reliable and trustworthy data.
            </p>
            <p>
              Please note that for European rankings from position 273 onwards, the universities are listed in the exact order they appear on the official QS website. This is because the global ranking assigns them to broader ranges (e.g., 701-710) rather than exact individual positions.
            </p>
            <p>
              The rankings take into account multiple factors, such as teaching quality, academic reputation, student-to-faculty ratio, and research impact.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="space-y-6">
          <h3 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Frequently Asked Questions</h3>
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-lg mb-2">Can I search for specific study programs or majors?</h4>
              <p className="text-slate-600 text-sm">Not yet, but we are actively working on it! Currently, you can use the filter menu to narrow down universities by broad specializations, but searching for specific degree programs will be added in the future.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-lg mb-2">How often are the rankings updated?</h4>
              <p className="text-slate-600 text-sm">We aim to update the data annually, right after the official publications of the major global university rankings.</p>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <h4 className="font-bold text-lg mb-2">I found an error in the data. What should I do?</h4>
              <p className="text-slate-600 text-sm mb-4">We would appreciate your report! You can easily let us know about any inaccuracies by using the form below.</p>
              
              {!isReportFormOpen ? (
                <button 
                  onClick={() => setIsReportFormOpen(true)}
                  className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>Report an error</span>
                </button>
              ) : (
                <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  {reportStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-green-600 gap-2">
                      <CheckCircle className="w-8 h-8" />
                      <p className="font-medium"><span>Thank you for your report!</span></p>
                      <p className="text-sm text-green-700/80"><span>We will review it shortly.</span></p>
                    </div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-3">
                      <div>
                        <label htmlFor="error-university" className="block text-sm font-medium text-slate-700 mb-1">
                          Which university is this about? (Optional)
                        </label>
                        <select
                          id="error-university"
                          value={reportUniversity}
                          onChange={(e) => setReportUniversity(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm bg-white"
                        >
                          <option value="">-- Select a university --</option>
                          {universities.map((uni) => (
                            <option key={uni.name} value={uni.name}>
                              {uni.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label htmlFor="error-details" className="block text-sm font-medium text-slate-700 mb-1">
                          What needs to be fixed?
                        </label>
                        <textarea 
                          id="error-details"
                          required
                          rows={3}
                          value={reportMessage}
                          onChange={(e) => setReportMessage(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm resize-none"
                          placeholder="E.g., The ranking for University X is incorrect..."
                        ></textarea>
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button 
                          type="button"
                          onClick={() => setIsReportFormOpen(false)}
                          className="px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
                        >
                          <span>Cancel</span>
                        </button>
                        <button 
                          type="submit"
                          disabled={reportStatus === 'submitting'}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          {reportStatus === 'submitting' ? <span>Sending...</span> : (
                            <>
                              <Send className="w-4 h-4" />
                              <span>Submit Report</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="text-center p-6 text-sm text-slate-500 bg-slate-50 border-t border-slate-200 mt-12">
        <p className="mb-2">© 2026 FindYourUni. All rights reserved. Data source: QS World University Rankings 2026.</p>
        <p>
          <button onClick={() => setShowTerms(true)} className="text-blue-600 hover:underline">Terms of Service</button> | 
          <button onClick={() => setShowPrivacy(true)} className="text-blue-600 hover:underline ml-1">Privacy Policy</button>
        </p>
      </footer>

      {/* Modals */}
      {showTerms && (
        <div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Terms of Service</h2>
            <div className="space-y-4 text-slate-600 text-sm">
              <p><strong>1. Intellectual Property</strong><br/>All code, design, architecture, and original content on this website are the exclusive property of FindYourUni and are protected by copyright © 2026. You may not copy, reproduce, or distribute any part of this application without explicit permission.</p>
              <p><strong>2. Data Scraping & Mining</strong><br/>Automated scraping, mining, extraction, or harvesting of data from this website is strictly prohibited. The data is provided for personal, non-commercial educational use only.</p>
              <p><strong>3. Reverse Engineering</strong><br/>You may not reverse engineer, decompile, or disassemble any part of this application's frontend or backend code.</p>
              <p><strong>4. Disclaimer</strong><br/>FindYourUni is an independent educational resource. Data is sourced from QS World University Rankings 2026. FindYourUni is not affiliated with QS Rankings or any university listed. Information is provided "as is" for educational purposes only.</p>
            </div>
            <button onClick={() => setShowTerms(false)} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Close</button>
          </div>
        </div>
      )}

      {showPrivacy && (
        <div className="fixed inset-0 bg-slate-900/50 z-[9999] flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl max-w-2xl w-full shadow-2xl">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Privacy Policy</h2>
            <div className="space-y-3 text-slate-600">
              <p>We use Vercel Analytics to collect anonymous, cookieless usage statistics. No personal data is collected.</p>
              <p>By using this website you agree to these terms.</p>
            </div>
            <button onClick={() => setShowPrivacy(false)} className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
