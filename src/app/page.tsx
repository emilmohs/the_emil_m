import Link from "next/link";
import { ShieldCheck, Zap, Layers, ChevronRight } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-indigo-100">
      
      {/* Navbar Option */}
      <nav className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/novum/Logo_full_Novum.png" 
              alt="Novum Logo" 
              className="h-10 w-auto"
            />
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
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
            Gemeinsam die <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-700 to-emerald-600">
              Entwicklung begleiten
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 font-medium max-w-2xl mx-auto leading-relaxed mt-6">
            Novum ist die digitale Plattform unserer Schule zur Dokumentation individueller Lernprozesse. Wir schaffen Transparenz und Fokus für die bestmögliche Förderung Ihres Kindes.
          </p>

          <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              href="/auth/signin"
              className="group flex items-center gap-2 px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-lg shadow-xl transition-all hover:scale-[1.02] active:scale-95"
            >
              Zum internen Bereich
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* Information Section for Parents */}
        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-3 gap-8 mt-32 relative z-10 text-left">
          
          {/* Info 1: Why? */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Warum Dokumentation?</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Um jedes Kind optimal zu fördern, halten wir Lernfortschritte und pädagogische Beobachtungen fest. Dies dient als fundierte Basis für Elterngespräche und die individuelle Lernplanung.
            </p>
          </div>

          {/* Info 2: Privacy */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Sicherheit & Privatsphäre</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Sämtliche Daten werden nach höchsten Sicherheitsstandards verschlüsselt. Wir arbeiten streng DSGVO-konform, um die Privatsphäre Ihres Kindes und Ihrer Familie zu schützen.
            </p>
          </div>

          {/* Info 3: Transparency */}
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-6">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Transparenz</h3>
            <p className="text-slate-500 leading-relaxed text-sm">
              Durch die strukturierte Erfassung behalten Lehrkräfte und Schule den Überblick über die Entwicklungsschritte. So stellen wir sicher, dass kein Kind aus dem Blickfeld gerät.
            </p>
          </div>

        </div>

        {/* Compliance & Responsibility Info */}
        <div className="max-w-4xl mx-auto mt-24 bg-slate-100/50 border border-slate-200 rounded-3xl p-8 text-center">
          <div className="flex justify-center mb-4">
             <ShieldCheck className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-4">Datensicherheit & Verantwortung</h3>
          <p className="text-sm text-slate-600 leading-relaxed max-w-2xl mx-auto">
            Sämtliche personenbezogenen Daten werden lokal auf der Infrastruktur der Schule gespeichert. 
            Die Datenhoheit liegt vollständig beim Betreiber (der Schule). Zum Schutz der Privatsphäre 
            werden Passwörter nach aktuellen Industriestandards gehasht. Die Absicherung der 
            Datenübertragung (HTTPS) sowie der Schutz des Servers liegen im Verantwortungsbereich 
            der bereitstellenden Institution.
          </p>
        </div>
      </main>

      {/* Footer Minimal */}
      <footer className="py-8 text-center text-slate-400 text-sm border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} Novum. Alle Rechte vorbehalten.
      </footer>
    </div>
  );
}
