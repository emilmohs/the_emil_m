"use client";
import { useState } from "react";

type StudentType = {
  id: string;
  firstName: string;
  lastName: string;
  classId: string | null;
};

type AssessmentType = {
  id: string;
  category: string;
  value: string;
  intervention: string | null;
  quarter: string;
};

export default function PrintExport({ 
  student, 
  teacherName, 
  assessments,
  availableQuarters = ["Q1_2026", "Q2_2026", "Q3_2026", "Q4_2026"]
}: { 
  student: StudentType; 
  teacherName: string; 
  assessments: AssessmentType[];
  availableQuarters?: string[];
}) {
  const quarters = availableQuarters;
  const [exportMode, setExportMode] = useState<"single" | "compare">("single");
  const [singleQuarter, setSingleQuarter] = useState(quarters[0] || "");
  const [compareQ1, setCompareQ1] = useState(quarters[1] || quarters[0] || "");
  const [compareQ2, setCompareQ2] = useState(quarters[0] || "");

  const handlePrint = (type: "full" | "intervention") => {
    const today = new Date().toLocaleDateString("de-DE");

    let printHTML = `
      <!DOCTYPE html>
      <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Export ${student.firstName} ${student.lastName}</title>
          <style>
            @media print { @page { margin: 15mm; } }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 2em; color: #111827; line-height: 1.5; font-size: 12px; }
            h1 { font-size: 20px; border-bottom: 2px solid #111827; padding-bottom: 12px; margin-bottom: 20px; }
            .header-info { display: flex; justify-content: space-between; font-weight: 600; margin-bottom: 24px; background: #f3f4f6; padding: 12px; border-radius: 8px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 1em; font-size: 12px; }
            th, td { border: 1px solid #d1d5db; padding: 8px; text-align: left; }
            th { background: #f9fafb; font-weight: bold; color: #374151; }
            .critical { color: #b91c1c; font-weight: 600; }
            .diff-up { color: #15803d; font-weight: bold; }
            .diff-down { color: #b91c1c; font-weight: bold; }
          </style>
        </head>
        <body>
          <h1>${exportMode === 'compare' ? 'Vergleichsbericht ('+compareQ1.replace('_', ' ')+' vs. '+compareQ2.replace('_', ' ')+')' : (type === 'full' ? 'Kompetenzbericht ('+singleQuarter.replace('_', ' ')+')' : 'Förderbericht ('+singleQuarter.replace('_', ' ')+')')}</h1>
          <div class="header-info">
            <div>Schüler/in: ${student.firstName} ${student.lastName}</div>
            <div>Klasse: ${student.classId || '-'}</div>
            <div>Lehrkraft: ${teacherName}</div>
            <div>Datum: ${today}</div>
          </div>
    `;

    if (exportMode === "single") {
      const filtered = assessments.filter(a => a.quarter === singleQuarter && (type === "intervention" ? Number(a.value) < 5 : true));
      if (filtered.length === 0) {
        printHTML += '<p>Keine Einträge vorhanden.</p>';
      } else {
        printHTML += `
          <table>
            <thead>
              <tr>
                <th>Kompetenzbereich</th>
                <th style="width: 80px; text-align: center;">Score</th>
                ${type === 'intervention' ? '<th>Fördermaßnahme</th>' : ''}
              </tr>
            </thead>
            <tbody>
              ${filtered.map(a => `
                <tr>
                  <td>${a.category}</td>
                  <td style="text-align: center; font-weight: bold;" class="${Number(a.value) < 5 ? 'critical' : ''}">${a.value} / 10</td>
                  ${type === 'intervention' ? `<td class="critical">${a.intervention || '<i>Keine Maßnahme eingetragen!</i>'}</td>` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>`;
      }
    } else {
      // Comparison Mode!
      // Group by category mapping both quarters
      const categories = new Set(assessments.map(a => a.category));
      const mapQ1 = new Map(assessments.filter(a => a.quarter === compareQ1).map(a => [a.category, a]));
      const mapQ2 = new Map(assessments.filter(a => a.quarter === compareQ2).map(a => [a.category, a]));

      printHTML += `
        <table>
          <thead>
            <tr>
              <th>Kompetenzbereich</th>
              <th style="width: 80px; text-align: center;">${compareQ1.replace('_', ' ')}</th>
              <th style="width: 80px; text-align: center;">${compareQ2.replace('_', ' ')}</th>
              <th style="width: 80px; text-align: center;">Trend</th>
            </tr>
          </thead>
          <tbody>
      `;
      
      Array.from(categories).sort().forEach(cat => {
        const v1 = mapQ1.get(cat) ? Number(mapQ1.get(cat)!.value) : null;
        const v2 = mapQ2.get(cat) ? Number(mapQ2.get(cat)!.value) : null;
        
        // Skip if both are missing
        if (v1 === null && v2 === null) return;
        
        let diffStr = "-";
        let diffClass = "";
        if (v1 !== null && v2 !== null) {
          const diff = v2 - v1;
          if (diff > 0) { diffStr = `+${diff}`; diffClass = "diff-up"; }
          else if (diff < 0) { diffStr = `${diff}`; diffClass = "diff-down"; }
          else { diffStr = "±0"; }
        }

        printHTML += `
          <tr>
            <td>${cat}</td>
            <td style="text-align: center;">${v1 !== null ? v1 : '-'}</td>
            <td style="text-align: center; font-weight: bold;">${v2 !== null ? v2 : '-'}</td>
            <td style="text-align: center;" class="${diffClass}">${diffStr}</td>
          </tr>
        `;
      });
      
      printHTML += `</tbody></table>`;
    }

    printHTML += `</body></html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printHTML);
      printWin.document.close();
      setTimeout(() => { printWin.focus(); printWin.print(); setTimeout(() => printWin.close(), 500); }, 250);
    } else alert("Bitte Popups zulassen.");
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 flex flex-col gap-6">
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Export & Drucken</h3>
          <p className="text-xs text-gray-500">Generiere Berichte oder vergleiche Quartale.</p>
        </div>
        
        <div className="flex bg-gray-100 rounded-xl p-1 w-fit">
          <button 
            onClick={() => setExportMode("single")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${exportMode === "single" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Einzel-Quartal
          </button>
          <button 
            onClick={() => setExportMode("compare")}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${exportMode === "compare" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            Vergleich
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {exportMode === "single" ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold text-gray-400 uppercase">Quartal:</span>
            <select 
              value={singleQuarter} 
              onChange={e => setSingleQuarter(e.target.value)}
              className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold bg-gray-50"
            >
              {quarters.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
            </select>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <select value={compareQ1} onChange={e => setCompareQ1(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold bg-gray-50">
              {quarters.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
            </select>
            <span className="text-gray-400 font-bold text-xs">vs.</span>
            <select value={compareQ2} onChange={e => setCompareQ2(e.target.value)} className="border border-gray-200 rounded-lg px-2 py-1 text-xs font-bold bg-gray-50">
              {quarters.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
            </select>
          </div>
        )}

        {exportMode === "single" ? (
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => handlePrint("full")} className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl font-bold text-xs transition-colors">Voll-Profil</button>
            <button onClick={() => handlePrint("intervention")} className="px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl font-bold text-xs transition-colors">Förderung</button>
          </div>
        ) : (
          <button onClick={() => handlePrint("full")} className="w-full px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md transition-colors">
            Bericht drucken
          </button>
        )}
      </div>
    </div>
  );
}
