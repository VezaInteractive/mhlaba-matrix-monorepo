"use client";

import { useAppStore } from "@/store/useAppStore";
import { CITY_INTEL } from "./RightPanel";
import { X, Calendar as CalendarIcon, MapPin, User, Mail, Send, CheckCircle2, Bed, Bath, Maximize } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function RealEstateModal() {
  const { showRealEstateModal, setShowRealEstateModal, activePOI } = useAppStore();

  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!showRealEstateModal || !activePOI) return null;

  const cityData = CITY_INTEL[activePOI];
  if (!cityData || !cityData.property) return null;

  const prop = cityData.property;

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  // Get days in month (quick hack: 0th day of next month is last day of current month)
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
       alert("Please select an inspection date on the calendar.");
       return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setShowRealEstateModal(false);
      }, 4000);
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-auto p-12">
      {/* Deep Blur Background */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-2xl transition-opacity" 
        onClick={() => setShowRealEstateModal(false)}
      />

      {/* Main Modal Container */}
      <div className="relative w-full max-w-7xl h-[85vh] bg-[#0b0f19]/90 border border-t-[#E3B341] border-b-[#E3B341]/30 border-x-[#E3B341]/50 rounded-2xl shadow-[0_0_80px_-20px_rgba(227,179,65,0.4)] overflow-hidden flex flex-col md:flex-row animate-in zoom-in-95 duration-500">

        {/* Global Lighting Accents */}
        <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-[#E3B341] to-transparent opacity-80" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#E3B341]/10 blur-[120px] rounded-full pointer-events-none" />

        {/* LEFT PANEL: Imagery & Specs */}
        <div className="w-full md:w-[55%] h-full relative group">
          <img 
            src={prop.imageUrl} 
            alt={prop.title}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-[20s] group-hover:scale-110 opacity-80 mix-blend-luminosity hover:mix-blend-normal"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b0f19] via-[#0b0f19]/40 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0f19]/90 to-transparent" />

          {/* Golden Corner Accents */}
          <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-[#E3B341]/80" />
          <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-[#E3B341]/80" />

          <div className="absolute bottom-12 left-12 right-12 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#E3B341]" />
              <span className="font-mono text-sm tracking-[0.2em] text-[#E3B341] uppercase">{cityData.name} SIGNATURE ESTATES</span>
            </div>
            
            <h1 className="text-5xl font-display font-light text-white tracking-widest uppercase leading-tight">
              {prop.title}
            </h1>
            
            <div className="text-4xl font-mono text-[#E3B341] font-bold mt-2">
              {prop.price} <span className="text-sm font-normal text-muted tracking-widest ml-2 uppercase">Global Market Value</span>
            </div>

            <p className="text-white/70 font-sans text-lg leading-relaxed mt-4 max-w-xl">
              {prop.description}
            </p>

            {/* Architecture Metrics Grid */}
            <div className="grid grid-cols-3 gap-6 mt-6 border-t border-[#E3B341]/20 pt-8">
              <div className="flex items-center gap-3">
                <Bed className="w-6 h-6 text-[#E3B341]" />
                <div className="flex flex-col">
                  <span className="font-mono text-2xl text-white">{prop.beds}</span>
                  <span className="text-[10px] text-muted tracking-widest uppercase">Bedrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Bath className="w-6 h-6 text-[#E3B341]" />
                <div className="flex flex-col">
                  <span className="font-mono text-2xl text-white">{prop.baths}</span>
                  <span className="text-[10px] text-muted tracking-widest uppercase">Bathrooms</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Maximize className="w-6 h-6 text-[#E3B341]" />
                <div className="flex flex-col">
                  <span className="font-mono text-2xl text-white">{prop.sqft}</span>
                  <span className="text-[10px] text-muted tracking-widest uppercase">Square Feet</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Booking & Agent Intercom */}
        <div className="w-full md:w-[45%] h-full bg-[#0b0f19] border-l border-[#E3B341]/20 p-12 flex flex-col relative z-20 overflow-y-auto custom-scrollbar">
          
          <button 
            onClick={() => setShowRealEstateModal(false)}
            className="absolute top-8 right-8 p-2 bg-white/5 border border-white/10 rounded-full hover:bg-[#E3B341] hover:text-black hover:border-transparent transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 mb-10">
            <div className="w-16 h-16 rounded-full bg-[#E3B341]/10 border border-[#E3B341] flex items-center justify-center p-1">
              <img src="https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=256&q=80" alt={prop.agentName} className="w-full h-full object-cover rounded-full filter grayscale" />
            </div>
            <div className="flex flex-col">
              <span className="text-[#E3B341] text-[10px] font-mono tracking-[0.2em] uppercase">Executive Broker</span>
              <span className="text-xl font-display text-white tracking-widest">{prop.agentName}</span>
            </div>
          </div>

          {!isSuccess ? (
            <form onSubmit={handleBooking} className="flex flex-col gap-8 animate-in fade-in zoom-in duration-500">
              
              {/* Interactive Calendar Sector */}
              <div className="flex flex-col gap-4">
                <h3 className="font-mono text-sm tracking-widest text-muted uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                  <CalendarIcon className="w-4 h-4 text-[#E3B341]" />
                  Schedule Private Viewing
                </h3>

                <div className="bg-black/40 border border-[#E3B341]/20 rounded-xl p-6">
                  {/* Calendar Header */}
                  <div className="flex justify-between items-center mb-6">
                    <div className="font-display text-xl tracking-widest text-[#E3B341]">
                       {new Date().toLocaleString('default', { month: 'long' }).toUpperCase()} {currentYear}
                    </div>
                  </div>
                  
                  {/* Days of Week */}
                  <div className="grid grid-cols-7 gap-1 mb-2 text-center text-[10px] font-mono text-muted">
                    {['SU', 'MO', 'TU', 'WE', 'TH', 'FR', 'SA'].map(d => <div key={d}>{d}</div>)}
                  </div>
                  
                  {/* Day Grid */}
                  <div className="grid grid-cols-7 gap-2">
                    {Array.from({ length: firstDay }).map((_, i) => (
                      <div key={`empty-${i}`} className="h-10 rounded-md bg-transparent" />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const isPast = day < new Date().getDate();
                      const isSelected = selectedDate === day;
                      return (
                        <button
                          key={day}
                          type="button"
                          disabled={isPast}
                          onClick={() => setSelectedDate(day)}
                          className={cn(
                            "h-10 rounded-md flex items-center justify-center font-mono text-sm transition-all border",
                            isPast 
                              ? "bg-transparent text-white/10 border-transparent cursor-not-allowed"
                              : isSelected
                                ? "bg-[#E3B341] text-black border-[#E3B341] shadow-[0_0_15px_rgba(227,179,65,0.6)] font-bold scale-110"
                                : "bg-white/5 text-white/70 border-white/10 hover:border-[#E3B341]/50 hover:bg-[#E3B341]/10"
                          )}
                        >
                          {day}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Data Input Fields */}
              <div className="flex flex-col gap-5">
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-[#E3B341] transition-colors" />
                  <input required type="text" placeholder="FULL NAME" className="w-full bg-black/40 border-b border-white/20 px-12 py-4 text-white font-mono text-sm focus:outline-none focus:border-[#E3B341] transition-colors rounded-t-md" />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted group-focus-within:text-[#E3B341] transition-colors" />
                  <input required type="email" placeholder="EMAIL ADDRESS" className="w-full bg-black/40 border-b border-white/20 px-12 py-4 text-white font-mono text-sm focus:outline-none focus:border-[#E3B341] transition-colors rounded-t-md" />
                </div>
              </div>

              <button 
                type="submit"
                disabled={isSubmitting}
                className="mt-4 w-full bg-gradient-to-r from-[#E3B341] to-[#D4A017] text-black font-display font-bold uppercase tracking-[0.2em] py-5 rounded-lg flex items-center justify-center gap-3 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(227,179,65,0.4)] transition-all disabled:opacity-50 disabled:hover:scale-100"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                    TRANSMITTING...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    CONFIRM PRIVATE VIEWING
                  </>
                )}
              </button>

            </form>
          ) : (
             <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in fade-in duration-[1s]">
                <CheckCircle2 className="w-24 h-24 text-[#E3B341] mb-6 drop-shadow-[0_0_20px_rgba(227,179,65,0.8)]" />
                <h3 className="font-display text-4xl text-white tracking-widest uppercase mb-2">ACCESS GRANTED</h3>
                <p className="font-mono text-[#E3B341] max-w-[280px] leading-relaxed text-sm">
                  Your coordinates have been securely logged. Executive Protocol Initiated.
                </p>
             </div>
          )}

        </div>
      </div>
    </div>
  );
}
