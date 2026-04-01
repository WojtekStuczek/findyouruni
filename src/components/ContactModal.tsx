import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Plus, CircleCheck as CheckCircle2, Loader as Loader2, ChevronDown } from 'lucide-react';
import { universities } from '../data';

const allCountries = Array.from(new Set(universities.map(u => u.country))).sort();

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUniversities?: string;
}

export function ContactModal({ isOpen, onClose, initialUniversities = '' }: ContactModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    country: '',
    message: ''
  });

  const [selectedUnis, setSelectedUnis] = useState<string[]>([]);
  const [uniSearch, setUniSearch] = useState('');
  const [showUniSuggestions, setShowUniSuggestions] = useState(false);
  
  const [showCountrySuggestions, setShowCountrySuggestions] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const uniDropdownRef = useRef<HTMLDivElement>(null);
  const countryDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '',
        lastName: '',
        email: '',
        country: '',
        message: ''
      });
      setSelectedUnis(initialUniversities ? [initialUniversities] : []);
      setUniSearch('');
      setShowUniSuggestions(false);
      setShowCountrySuggestions(false);
      setIsSubmitting(false);
      setIsSuccess(false);
    }
  }, [isOpen, initialUniversities]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (uniDropdownRef.current && !uniDropdownRef.current.contains(event.target as Node)) {
        setShowUniSuggestions(false);
      }
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target as Node)) {
        setShowCountrySuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  const handleAddUni = (uniName: string) => {
    const nameToAdd = uniName.trim();
    if (nameToAdd && !selectedUnis.includes(nameToAdd)) {
      setSelectedUnis([...selectedUnis, nameToAdd]);
    }
    setUniSearch('');
    setShowUniSuggestions(false);
  };

  const handleRemoveUni = (uniName: string) => {
    setSelectedUnis(selectedUnis.filter(u => u !== uniName));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          subject: "New University Application Assistance Request",
          from_name: "University Finder App",
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          country: formData.country,
          universities: selectedUnis.length > 0 ? selectedUnis.join(', ') : 'None specified',
          message: formData.message,
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setIsSuccess(true);
      } else {
        throw new Error(result.message || "Failed to send message");
      }
    } catch (error) {
      console.error("Error sending email:", error);
      alert("Wystąpił błąd podczas wysyłania wiadomości. Spróbuj ponownie później.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const filteredUnis = universities
    .filter(u => u.name.toLowerCase().includes(uniSearch.toLowerCase()) && !selectedUnis.includes(u.name))
    .slice(0, 5);

  const filteredCountries = allCountries
    .filter(c => c.toLowerCase().includes(formData.country.toLowerCase()))
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-[3000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90dvh]">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <h2 className="font-bold text-lg text-slate-800">Application Assistance</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {isSuccess ? (
          <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-2">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800"><span>Message Sent!</span></h3>
            <p className="text-sm text-slate-500">
              <span>Thank you for reaching out. We have received your request and will contact you at </span><span className="font-medium text-slate-700">{formData.email}</span><span> shortly.</span>
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
            >
              <span>Close</span>
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 overflow-y-auto custom-scrollbar pb-24">
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">First Name</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      required
                      value={formData.firstName}
                      onChange={handleChange}
                      className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                      placeholder="John"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Last Name</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      required
                      value={formData.lastName}
                      onChange={handleChange}
                      className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                      placeholder="Doe"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                    placeholder="john.doe@example.com"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="relative" ref={countryDropdownRef}>
                  <label htmlFor="country" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Country of Origin</label>
                  <div className="relative">
                    <input
                      type="text"
                      id="country"
                      name="country"
                      required
                      value={formData.country}
                      onChange={(e) => {
                        handleChange(e);
                        setShowCountrySuggestions(true);
                      }}
                      onFocus={() => setShowCountrySuggestions(true)}
                      className="w-full text-sm p-2.5 pr-10 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                      placeholder="Search country..."
                      disabled={isSubmitting}
                      autoComplete="off"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  </div>
                  
                  {showCountrySuggestions && filteredCountries.length > 0 && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden max-h-48 overflow-y-auto">
                      {filteredCountries.map(country => (
                        <button
                          key={country}
                          type="button"
                          onClick={() => {
                            setFormData(prev => ({ ...prev, country }));
                            setShowCountrySuggestions(false);
                          }}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                        >
                          {country}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Universities of Interest</label>
                  
                  {selectedUnis.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {selectedUnis.map(uni => (
                        <span key={uni} className="flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-medium">
                          {uni}
                          <button type="button" onClick={() => handleRemoveUni(uni)} className="hover:text-blue-900 transition-colors" disabled={isSubmitting}>
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="relative" ref={uniDropdownRef}>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={uniSearch}
                        onChange={(e) => {
                          setUniSearch(e.target.value);
                          setShowUniSuggestions(true);
                        }}
                        onFocus={() => setShowUniSuggestions(true)}
                        className="flex-1 text-sm p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 disabled:opacity-50"
                        placeholder="Search and add universities..."
                        disabled={isSubmitting}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddUni(uniSearch);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleAddUni(uniSearch)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2.5 rounded-lg border border-slate-200 transition-colors flex items-center justify-center disabled:opacity-50"
                        title="Add university"
                        disabled={isSubmitting}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {showUniSuggestions && uniSearch && filteredUnis.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                        {filteredUnis.map(uni => (
                          <button
                            key={uni.name}
                            type="button"
                            onClick={() => handleAddUni(uni.name)}
                            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors flex flex-col"
                          >
                            <span className="font-medium">{uni.name}</span>
                            <span className="text-xs text-slate-400">{uni.country}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <label htmlFor="message" className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full text-sm p-2.5 rounded-lg border border-slate-200 bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 resize-none disabled:opacity-50"
                    placeholder="Tell us how we can help you..."
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] border-t border-slate-100 bg-slate-50 flex justify-end">
              <button
                type="submit"
                form="contact-form"
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors shadow-md shadow-blue-200"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
