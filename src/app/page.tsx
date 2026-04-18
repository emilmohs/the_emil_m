import Link from "next/link";
import { ShieldCheck, Zap, Layers, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Navbar Option */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              I
            </div>
            <span className="font-bold text-xl tracking-tight text-slate-900">ILE</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/auth/signin"
              className="text-sm font-semibold text-slate-600 hover:text-indigo-600 transition-colors hidden sm:block"
            >
              Für Schulen
            </Link>
            <Link 
              href="/auth/signin"
              className="px-5 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-full shadow-sm hover:shadow-md transition-all active:scale-95 flex items-center gap-1"
            >
              Login
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="relative flex flex-col items-center pt-24 pb-32 px-6 lg:px-8 text-center overflow-hidden">
        
        {/* Soft Background Blob */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-200/40 rounded-full blur-[100px] -z-10 pointer-events-none" />
        <div className="absolute top-20 left-10 w-[300px] h-[300px] bg-teal-100/50 rounded-full blur-[80px] -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-widest uppercase mb-4 shadow-sm">
            Das Digitale Klassenbuch
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Individuelle Lernentwicklung <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-teal-500">
              einfach dokumentiert
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mt-6">
            Spare wertvolle Zeit im Schulalltag. 100% Datenschutzkonform, Fokus auf den Schüler, und sichere Planung in einer modernen Plattform.
          </p>

          <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth/signin"
              className="group flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-lg shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 active:scale-95"
            >
              Jetzt Anmelden / Login
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Feature Cards Section */}
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-3 gap-8 mt-32 relative z-10 text-left">
          
          {/* Card 1 */}
          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <ShieldCheck className="w-7 h-7" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Datenschutz</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Streng DSGVO-konform und sicher entwickelt für den Einsatz an deutschen Schulen. 
              Deine Daten bleiben privat.
            </p>
          </div>

          {/* Card 2 */}
          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Zap className="w-7 h-7" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Effizienz</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Blitzschnelle Dokumentation von Lernfortschritten im Klassen- oder Einzelkontext. 
              Mehr Zeit für das Unterrichten.
            </p>
          </div>

          {/* Card 3 */}
          <div className="group bg-white p-8 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="w-14 h-14 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform">
              <Layers className="w-7 h-7" strokeWidth={2} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Übersicht</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Alle Förderpläne, Berichte und pädagogischen Notizen an einem zentralen, interaktiven Ort gebündelt.
            </p>
          </div>

        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} ILE School Software. Alle Rechte vorbehalten.
      </footer>
    </div>
  );
}
