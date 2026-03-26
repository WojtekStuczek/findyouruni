import { ArrowLeft, GraduationCap, Map as MapIcon, Search, Filter, Globe, AlertCircle, Send, CheckCircle } from 'lucide-react';
import { useState } from 'react';

interface AboutPageProps {
  onBack: () => void;
}

export function AboutPage({ onBack }: AboutPageProps) {
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [reportStatus, setReportStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [reportMessage, setReportMessage] = useState('');

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportStatus('submitting');
    
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    
    if (!accessKey) {
      alert("Brak klucza API Web3Forms. Skonfiguruj zmienną środowiskową VITE_WEB3FORMS_ACCESS_KEY w ustawieniach aplikacji.");
      setReportStatus('idle');
      return;
    }

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          access_key: accessKey,
          subject: "New Error Report from FindYourUni.eu",
          from_name: "Anonymous User",
          message: reportMessage,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setReportStatus('success');
        setReportMessage('');
        setTimeout(() => {
          setIsReportFormOpen(false);
          setReportStatus('idle');
        }, 3000);
      } else {
        alert("Wystąpił błąd podczas wysyłania zgłoszenia. Spróbuj ponownie później.");
        setReportStatus('idle');
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Wystąpił błąd podczas wysyłania zgłoszenia. Sprawdź połączenie z internetem.");
      setReportStatus('idle');
    }
  };

  return (
    <div className="h-screen overflow-y-auto bg-slate-50 text-slate-900">
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
          <h1 className="text-base md:text-xl font-bold tracking-tight leading-none">
            About
          </h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 py-8 md:py-12 space-y-12">
        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900">
            Find your dream university in Europe
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            FindYourUni.eu is an interactive map and search engine designed to help prospective students discover the best universities across Europe.
          </p>
        </section>

        {/* How it works */}
        <section className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-2xl font-bold mb-6">How to use the platform?</h3>
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
              <div className="bg-blue-50 p-3 rounded-xl h-fit shrink-0">
                <Search className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Search</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Type the name of a university, city, or country in the search bar to instantly find institutions of interest.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded-xl h-fit shrink-0">
                <Filter className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-lg mb-1">Filter</h4>
                <p className="text-slate-600 text-sm leading-relaxed">Use filters to narrow down results to a specific country or field of study.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-blue-50 p-3 rounded-xl h-fit shrink-0">
                <Globe className="w-6 h-6 text-blue-600" />
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
          <h3 className="text-2xl font-bold">Where do we get our data?</h3>
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
          <h3 className="text-2xl font-bold">Frequently Asked Questions (FAQ)</h3>
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
                  Report an error
                </button>
              ) : (
                <div className="mt-4 bg-slate-50 p-4 rounded-lg border border-slate-200 animate-in fade-in slide-in-from-top-2">
                  {reportStatus === 'success' ? (
                    <div className="flex flex-col items-center justify-center py-4 text-green-600 gap-2">
                      <CheckCircle className="w-8 h-8" />
                      <p className="font-medium">Thank you for your report!</p>
                      <p className="text-sm text-green-700/80">We will review it shortly.</p>
                    </div>
                  ) : (
                    <form onSubmit={handleReportSubmit} className="space-y-3">
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
                          Cancel
                        </button>
                        <button 
                          type="submit"
                          disabled={reportStatus === 'submitting'}
                          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg font-medium text-sm transition-colors"
                        >
                          {reportStatus === 'submitting' ? 'Sending...' : (
                            <>
                              <Send className="w-4 h-4" />
                              Submit Report
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
    </div>
  );
}
