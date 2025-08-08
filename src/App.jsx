import React, { useMemo, useState } from "react";
import { Download, Trash2, Sun, Moon, ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect } from "react";
// ===== Date utilities =====
const MONTH_NAMES = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
function addDays(date, n) { const d = new Date(date); d.setDate(d.getDate() + n); return d; }
function startOfMonth(date) { return new Date(date.getFullYear(), date.getMonth(), 1); }
function endOfMonth(date) { return new Date(date.getFullYear(), date.getMonth() + 1, 0); }
function isoDay(d) { const wd = d.getDay(); return wd === 0 ? 7 : wd; }
function startOfWeek(date, { weekStartsOn = 1 } = {}) { const d = new Date(date); const current = isoDay(d); const diff = ((current - weekStartsOn + 7) % 7); return addDays(d, -diff); }
function endOfWeek(date, { weekStartsOn = 1 } = {}) { const start = startOfWeek(date, { weekStartsOn }); return addDays(start, 6); }
function isSameMonth(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth(); }
function isSameDay(a, b) { return a.toDateString() === b.toDateString(); }
function pad(n) { return n < 10 ? "0" + n : String(n); }
function format(date, pattern) { const y = date.getFullYear(); const m = date.getMonth(); const d = date.getDate(); return pattern.replace(/yyyy/g, String(y)).replace(/MM/g, pad(m + 1)).replace(/dd/g, pad(d)).replace(/d(?![a-zA-Z])/g, String(d)).replace(/MMMM/g, MONTH_NAMES[m]); }

function useMonthMatrix(viewDate) {
  return useMemo(() => {
    const startMonth = startOfMonth(viewDate);
    const endMonthDate = endOfMonth(viewDate);
    const start = startOfWeek(startMonth, { weekStartsOn: 1 });
    const end = endOfWeek(endMonthDate, { weekStartsOn: 1 });
    const days = [];
    let current = start;
    while (current <= end) { days.push(current); current = addDays(current, 1); }
    return days;
  }, [viewDate]);
}

function downloadFile(filename, mime, text) {
  const blob = new Blob([text], { type: mime + ";charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.rel = "noopener";
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 800);
}

const FONT_STACK = 'Arial, Helvetica, sans-serif';

function MonthView({ date, selected, onToggle, darkMode }) {
  const days = useMonthMatrix(date);
  const weeks = useMemo(() => { const out = []; for (let i = 0; i < days.length; i += 7) out.push(days.slice(i, i + 7)); return out; }, [days]);

  const cubeBase = darkMode
    ? "relative select-none rounded-md border border-gray-500 bg-gray-600 text-gray-100 shadow-md"
    : "relative select-none rounded-md border border-gray-400 bg-gray-200 text-gray-700 shadow-md";

  return (
    <div className={`min-w-full px-1`}>
      <div className={`grid grid-cols-7 gap-2 font-bold text-xs ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>
        {"Mon Tue Wed Thu Fri Sat Sun".split(" ").map((d) => (
          <div key={d} className="text-center">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 mt-2">
        {weeks.map((w, wi) => (
          <React.Fragment key={wi}>
            {w.map((cellDate) => {
              const key = format(cellDate, "yyyy-MM-dd");
              const inMonth = isSameMonth(cellDate, date);
              const isToday = isSameDay(cellDate, new Date());
              const isSelected = selected.has(key);
              const selectedClasses = isSelected
                ? (darkMode
                  ? "bg-orange-700/70 border-orange-600 text-white"
                  : "bg-orange-300/90 border-orange-400 text-orange-900")
                : (darkMode
                  ? "bg-gray-600 border-gray-500 text-gray-100 hover:bg-orange-800/40"
                  : "bg-gray-200 border-gray-300 text-gray-700 hover:bg-orange-100");
              return (
                <button
                  key={key}
                  onClick={() => onToggle(cellDate)}
                  className={`${cubeBase} ${selectedClasses} aspect-square w-full flex flex-col items-center justify-center ${inMonth ? '' : 'opacity-40'}`}
                >
                  <span className="text-lg font-extrabold">{format(cellDate, "d")}</span>
                  {isToday && !isSelected && (
                    <span className={`text-[10px] ${darkMode ? 'text-gray-300' : 'text-gray-500'}`}>TODAY</span>
                  )}
                </button>
              );
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [viewDate, setViewDate] = useState(() => new Date());
  const [selected, setSelected] = useState(() => {
    const saved = getCookie("selectedDays");
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });
  const [hint, setHint] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setCookie("selectedDays", JSON.stringify(Array.from(selected)), 365);
  }, [selected]);

  function toggle(date) {
    const key = format(date, "yyyy-MM-dd");
    setSelected((prev) => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; });
  }

  const selectedArray = useMemo(() => Array.from(selected).sort(), [selected]);

  function exportCSV() {
    const rows = ["date", ...selectedArray];
    const csv = rows.map(r => /[",]/.test(r) ? '"' + r.replace(/"/g, '""') + '"' : r).join("\n");
    downloadFile(`selected-dates-${format(viewDate, "yyyy-MM")}.csv`, "text/csv", csv);
    setHint("Exported CSV"); setTimeout(() => setHint(""), 1500);
  }

  function setCookie(name, value, days) {
    const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
  }

  function getCookie(name) {
    const cookies = document.cookie.split(";").map(c => c.trim());
    for (let c of cookies) {
      if (c.startsWith(name + "=")) {
        return decodeURIComponent(c.substring(name.length + 1));
      }
    }
    return null;
  }

  function clearSelection() { setSelected(new Set()); }

  const chromeBg = darkMode ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-700';
  const panelBg = darkMode ? 'border-gray-500 bg-gray-600' : 'border-gray-300 bg-gray-50';
  const buttonBase = darkMode
    ? "flex items-center gap-1 rounded-md border border-gray-500 bg-gray-600 text-gray-100 shadow-md px-3 py-2 hover:bg-gray-500 active:scale-[0.98]"
    : "flex items-center gap-1 rounded-md border border-gray-400 bg-gray-200 text-gray-700 shadow-md px-3 py-2 hover:bg-gray-300 active:scale-[0.98]";

  return (
    <div className={`min-h-screen p-4 flex justify-center ${chromeBg}`} style={{ fontFamily: FONT_STACK }}>
      <div className="mx-auto max-w-4xl">
        <header className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-bold tracking-widest">
            {`${MONTH_NAMES[viewDate.getMonth()].toUpperCase()} ${viewDate.getFullYear()}`}
          </h1>
        </header>
        <div className={`border rounded-md overflow-hidden ${panelBg}`}>
          <div className="px-3 py-3">
            <MonthView date={viewDate} selected={selected} onToggle={toggle} darkMode={darkMode} />
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm">
          <div className="flex items-center gap-2">
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1))} className={buttonBase} title="Previous Month">
              <ArrowLeft size={16} />
            </button>
            <button onClick={() => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1))} className={buttonBase} title="Next Month">
              <ArrowRight size={16} />
            </button>
            <button onClick={exportCSV} className={buttonBase} title="Export CSV">
              <Download size={16} />
            </button>
            <button onClick={clearSelection} className={buttonBase} title="Clear">
              <Trash2 size={16} />
            </button>
            <button onClick={() => setDarkMode((v) => !v)} className={buttonBase} title={darkMode ? 'Light mode' : 'Dark mode'}>
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div>{hint}</div>
        </div>
      </div>
    </div>
  );
}
