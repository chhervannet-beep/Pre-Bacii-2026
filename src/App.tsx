/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import Generator from './Generator';

const defaultData = [
  { name: 'ចំនួនកុំផ្លិច', score: 15, time: 18, color: '#EC4899', emoji: '🔢', details: ['ដោះស្រាយសមីការដឺក្រេទីពីរ', 'សរសេរជាទម្រង់ត្រីកោណមាត្រ', 'ប្រើទ្រឹស្តីបទដឺម័រគណនាស្វ័យគុណ'] },
  { name: 'លីមីត', score: 15, time: 18, color: '#06B6D4', emoji: '📉', details: ['លីមីតត្រីកោណមាត្ររាង ០/០', 'លីមីតអសនិទានរាង អានន្តដកអានន្ត', 'លីមីតអនុគមន៍អ៊ិចស្ប៉ូណង់ស្យែល'] },
  { name: 'អាំងតេក្រាល', score: 15, time: 18, color: '#8B5CF6', emoji: '⎰', details: ['អាំងតេក្រាលពហុធាធម្មតា', 'អាំងតេក្រាលប្តូរអថេរ (លោការីត)', 'អាំងតេក្រាលដោយផ្នែក (ត្រីកោណមាត្រ)'] },
  { name: 'សមីការ ឌីផេរ៉ង់ស្យែល', score: 15, time: 18, color: '#F59E0B', emoji: 'ⅆ', details: ['សមីការលីនេអ៊ែរលំដាប់ទី២ អូម៉ូសែន', 'ករណីមានឫសឌុប', 'រកចម្លើយពិសេសតាមលក្ខខណ្ឌបន្ទាត់ប៉ះ'] },
  { name: 'ប្រូបាប', score: 15, time: 18, color: '#10B981', emoji: '🎲', details: ['ការចាប់យកព្រមគ្នា (ប្រើបន្សំ)', 'ព្រឹត្តិការណ៍ចាប់បានពណ៌ដូចគ្នា', 'ព្រឹត្តិការណ៍ចាប់បានពណ៌ខុសគ្នា'] },
  { name: 'សិក្សា អនុគមន៍', score: 30, time: 36, color: '#F43F5E', emoji: '📈', details: ['អនុគមន៍សនិទានភាគយកដឺក្រេ២ ភាគបែងដឺក្រេ១', 'រកអាស៊ីមតូតឈរ និងទ្រេត', 'សិក្សាអថេរភាព និងបង្ហាញផ្ចិតឆ្លុះ', 'សង់ក្រាប និងអាស៊ីមតូត'] },
  { name: 'ធរណីមាត្រ និង កោនិច', score: 20, time: 24, color: '#3B82F6', emoji: '🔺', details: ['ផ្នែកកោនិច៖ បំពេញការេទ្វេធាដើម្បីរកសមីការស្តង់ដា', 'ធរណីមាត្រក្នុងលំហ៖ គណនាផលគុណវ៉ិចទ័រ', 'សរសេរសមីការប្លង់ និងសមីការប៉ារ៉ាម៉ែតបន្ទាត់'] },
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-slate-100 shadow-lg rounded-lg text-sm text-slate-700 font-sans">
        <p className="font-semibold mb-1">{payload[0].payload.name}</p>
        <p>{payload[0].dataKey === 'score' ? 'ពិន្ទុ' : 'នាទី'}: <span className="font-bold">{payload[0].value}</span></p>
      </div>
    );
  }
  return null;
};

import { auth, googleAuthProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, User } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<'dashboard' | 'generator' | 'history'>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });
    return unsub;
  }, []);

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleAuthProvider);
    } catch (error) {
      console.error("Sign in failed", error);
    }
  };

  const [title, setTitle] = useState("វិញ្ញាសាគណិតវិទ្យា កម្រិតពិបាក");
  const [level, setLevel] = useState("គណិតវិទ្យា (កម្រិតពិបាក - Advanced Level)");
  const [subject, setSubject] = useState("គណិតវិទ្យា (ថ្នាក់វិទ្យាសាស្ត្រ)");
  const [duration, setDuration] = useState("១៥០ នាទី");
  const [score, setScore] = useState("១២៥");

  const [history, setHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  // Load history from API (fallback to localStorage if not configured)
  useEffect(() => {
    const loadHistory = async () => {
      setIsLoadingHistory(true);
      if (user) {
        try {
          const token = await user.getIdToken();
          const res = await fetch('/api/history', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (res.ok) {
            const data = await res.json();
            setHistory(data);
          } else {
            loadLocalHistory();
          }
        } catch (e) {
          console.error("Fetch history error:", e);
          loadLocalHistory();
        }
      } else {
        loadLocalHistory();
      }
      setIsLoadingHistory(false);
    };

    const loadLocalHistory = () => {
      const saved = localStorage.getItem('exam_history');
      if (saved) {
        try {
          setHistory(JSON.parse(saved));
        } catch (e) {
          setHistory([]);
        }
      }
    };

    loadHistory();
  }, [user]);

  const saveToHistory = async () => {
    const newItem = {
      id: Date.now(),
      title,
      level,
      subject,
      duration,
      score,
      examContent,
      solutionContent,
      data,
      date: new Date().toISOString()
    };

    if (user) {
      try {
        const token = await user.getIdToken();
        const res = await fetch('/api/history', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(newItem)
        });
        
        if (!res.ok) {
          console.error("Error saving to Cloud SQL");
          alert("បរាជ័យក្នុងការរក្សាទុកទៅ Cloud SQL។ (Failed to save to Cloud SQL)");
          saveLocally(newItem);
        } else {
          setHistory(prev => [newItem, ...prev]);
          alert('រក្សាទុកប្រវត្តិទៅ Cloud SQL បានជោគជ័យ! (Saved to Cloud SQL successfully)');
        }
      } catch (e) {
        console.error("Cloud SQL save error:", e);
        saveLocally(newItem);
      }
    } else {
      saveLocally(newItem);
    }
  };

  const saveLocally = (newItem: any) => {
    setHistory((prevHistory) => {
      const newHistory = [newItem, ...prevHistory];
      localStorage.setItem('exam_history', JSON.stringify(newHistory));
      return newHistory;
    });
    alert('រក្សាទុកប្រវត្តិក្នុង Local Storage បានជោគជ័យ! (Saved to Local Storage successfully)');
  };

  const deleteFromHistory = async (id: number) => {
    if (!confirm("តើលោកគ្រូពិតជាចង់លុបវិញ្ញាសានេះចេញពីប្រវត្តិមែនទេ?")) return;

    if (user) {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`/api/history/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          console.error("Error deleting from Cloud SQL");
          alert("បរាជ័យក្នុងការលុបពី Cloud SQL។ (Failed to delete from Cloud SQL)");
          deleteLocally(id);
        } else {
          setHistory(prev => prev.filter(h => h.id !== id));
        }
      } catch (e) {
        console.error("Cloud SQL delete error:", e);
        deleteLocally(id);
      }
    } else {
      deleteLocally(id);
    }
  };

  const deleteLocally = (id: number) => {
    setHistory((prevHistory) => {
      const newHistory = prevHistory.filter(h => h.id !== id);
      localStorage.setItem('exam_history', JSON.stringify(newHistory));
      return newHistory;
    });
  };

  const exportHistoryJSON = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `bacii_math_exams_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      alert("បរាជ័យក្នុងការនាំចេញទិន្នន័យ។");
    }
  };

  const importHistoryJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (e.target.files && e.target.files[0]) {
      fileReader.readAsText(e.target.files[0], "UTF-8");
      fileReader.onload = async (event) => {
        try {
          const parsed = JSON.parse(event.target?.result as string);
          if (Array.isArray(parsed)) {
            // Deduplicate incoming vs state?
            // Actually, let's just create a merged list with the existing ones
            let newUnique: any[] = [];
            setHistory((prev) => {
              const merged = [...parsed, ...prev];
              // De-duplicate by id or title+date
              newUnique = merged.filter((item, index, self) =>
                index === self.findIndex((t) => t.id === item.id || (t.title === item.title && t.date === item.date))
              );
              localStorage.setItem('exam_history', JSON.stringify(newUnique));
              return newUnique;
            });
            
            if (user) {
              try {
                 const token = await user.getIdToken();
                 const res = await fetch('/api/history/upsert', {
                    method: 'PUT',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(parsed)
                 });
                 if (!res.ok) console.error("Error upserting to Cloud SQL:", res);
              } catch(e) {
                 console.error("Cloud SQL upsert exception:", e);
              }
            }

            alert("នាំចូលប្រវត្តិបានជោគជ័យពេញលេញ! (Imported successfully)");
            e.target.value = ""; // reset input
          } else {
            alert("ទម្រង់ឯកសារមិនត្រឹមត្រូវទេ។ (Invalid file format)");
          }
        } catch (err) {
          alert("ការអានឯកសារបរាជ័យ។ (Failed to read JSON file)");
        }
      };
    }
  };

  const [examContent, setExamContent] = useState(`### I. (១៥ ពិន្ទុ)
គណនាលីមីតខាងក្រោម៖

ក. $A = \\lim_{x \\to 0} \\frac{\\sqrt{1+x} - \\sqrt{1-x}}{x}$

ខ. $B = \\lim_{x \\to +\\infty} \\left( \\frac{x+2}{x-1} \\right)^{2x}$

> ក. អាចបន្ថែមគុណកន្សោមឆ្លាស់។
> ខ. ជាទម្រង់រាងមិនកំណត់ $1^\\infty$ អាចប្រើលោការីត ឬរូបមន្ត $e$។

### II. (១៥ ពិន្ទុ)
១. ដោះស្រាយសមីការ $(E): z^2 - 2\\sqrt{3}z + 4 = 0$ ក្នុងសំណុំចំនួនកុំផ្លិច $\\mathbb{C}$ តាង $z_1$ និង $z_2$ ជាឫសនៃសមីការ។
`);

  const [solutionContent, setSolutionContent] = useState(`### I. គណនាលីមីត
## ចម្លើយលម្អិត
ក. គណនា $A = \\lim_{x \\to 0} \\frac{\\sqrt{1+x} - \\sqrt{1-x}}{x}$
ជារាង ០/០ 

$$A = \\lim_{x \\to 0} \\frac{(\\sqrt{1+x} - \\sqrt{1-x})(\\sqrt{1+x} + \\sqrt{1-x})}{x(\\sqrt{1+x} + \\sqrt{1-x})}$$
$$A = \\lim_{x \\to 0} \\frac{1+x - (1-x)}{x(\\sqrt{1+x} + \\sqrt{1-x})} = \\frac{2}{\\sqrt{1}+\\sqrt{1}} = 1$$
ដូចនេះ $A = 1$

### II. ដោះស្រាយសមីការ
## ចម្លើយលម្អិត
$$\\Delta' = (-\\sqrt{3})^2 - 4 = 3 - 4 = -1 = i^2$$
$$z_1 = \\sqrt{3} - i, z_2 = \\sqrt{3} + i$$`);

  const [data, setData] = useState(defaultData);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const analyzeExam = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/exam/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: examContent, totalTime: parseInt(duration) || 150 })
      });
      const resData = await res.json();
      if (res.ok && resData.result && resData.result.length > 0) {
        setData(resData.result);
      } else {
        alert(resData.error || "បរាជ័យក្នុងការទទួលបានទិន្នន័យពី AI");
      }
    } catch (e) {
      alert("បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ Server");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const calculateTotalTime = () => data.reduce((acc, curr) => acc + curr.time, 0);
  const calculateTotalScore = () => data.reduce((acc, curr) => acc + curr.score, 0);

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] overflow-hidden text-[#1e293b] font-sans print:h-auto print:overflow-visible print:bg-white">
      <header className="h-16 shrink-0 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10 w-full print:hidden">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-pink-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">⨋</div>
            <div>
                <h1 className="text-lg font-bold text-slate-800 leading-tight">វិភាគវិញ្ញាសាទី ០៩</h1>
                <p className="hidden md:block text-[10px] uppercase tracking-wider font-semibold text-slate-500">Mathematics Exam Analytical Dashboard</p>
            </div>
        </div>
        <nav className="hidden md:flex items-center gap-4 text-[13px] font-moul text-slate-500 text-center">
            <button onClick={() => setView('dashboard')} className={`hover:text-cyan-500 transition-colors ${view === 'dashboard' ? 'text-pink-500' : ''}`}>ទិដ្ឋភាពទូទៅ</button>
            <button onClick={() => setView('history')} className={`hover:text-amber-500 transition-colors ${view === 'history' ? 'text-pink-500' : ''}`}>ប្រវត្តិ (History)</button>
            <button onClick={() => setView('generator')} className={`border border-pink-500 px-4 py-1.5 rounded transition-colors ${view === 'generator' ? 'bg-pink-500 text-white' : 'text-pink-500 hover:bg-pink-50'}`}>រៀបចំវិញ្ញាសា</button>
            {!user ? (
               <button onClick={signIn} className="text-white bg-slate-800 hover:bg-slate-700 px-4 py-1.5 rounded text-xs font-sans font-bold shadow-sm transition">Sign In</button>
            ) : (
               <div className="flex items-center gap-2 border-l border-slate-200 pl-4">
                 {user.photoURL && <img src={user.photoURL} alt="Avatar" className="w-6 h-6 rounded-full" referrerPolicy="no-referrer" />}
                 <span className="text-xs font-sans font-medium text-slate-700">{user.displayName || user.email}</span>
               </div>
            )}
        </nav>
      </header>

      {view === 'dashboard' && (
        <main className="flex-grow flex flex-col lg:flex-row p-6 gap-6 overflow-hidden max-w-[1280px] mx-auto w-full">
        <aside className="w-full lg:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-6" style={{ scrollbarWidth: 'none' }}>
            <section id="overview" className="flex flex-col gap-4 shrink-0">
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
                    <div className="flex justify-between items-start mb-2">
                      <h2 className="text-lg font-bold text-slate-900 leading-tight">
                          យុទ្ធសាស្ត្រត្រៀមប្រឡង <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-cyan-500">គណិតវិទ្យាថ្នាក់ទី១២</span>
                      </h2>
                      <button onClick={analyzeExam} disabled={isAnalyzing} className="px-3 py-1 bg-pink-50 text-pink-600 border border-pink-200 rounded-full text-[10px] font-bold hover:bg-pink-100 transition shadow-sm whitespace-nowrap" title="វិភាគទិន្នន័យ (Analyze Data with AI)">
                        {isAnalyzing ? "⏳ កំពុងវិភាគ..." : "🤖 វិភាគទិន្នន័យពីវិញ្ញាសា"}
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-relaxed italic">
                        ការរៀបចំយុទ្ធសាស្ត្រមុនពេលប្រឡងគឺជារឿងសំខាន់បំផុត។ ផ្ទាំងព័ត៌មានអន្តរកម្មនេះ ត្រូវបានរចនាឡើងដើម្បីជួយសិស្សានុសិស្សវិភាគលើទម្ងន់ពិន្ទុ និងបែងចែកពេលវេលាប្រកបដោយប្រសិទ្ធភាព ផ្អែកលើវិញ្ញាសាទី ០៩ (កម្រិតស្តង់ដារ-មធ្យម)។
                    </p>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-t-2 border-t-pink-500 flex flex-col justify-between">
                        <div className="text-lg mb-1 opacity-80">🎯</div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ពិន្ទុពេញ</div>
                            <div className="text-lg font-black text-slate-800">{calculateTotalScore()}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-t-2 border-t-cyan-500 flex flex-col justify-between">
                        <div className="text-lg mb-1 opacity-80">⏱️</div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">នាទីសរុប</div>
                            <div className="text-lg font-black text-slate-800">{calculateTotalTime()}</div>
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-3 border-t-2 border-t-violet-500 flex flex-col justify-between">
                        <div className="text-lg mb-1 opacity-80">📚</div>
                        <div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ប្រធានបទធំៗ</div>
                            <div className="text-lg font-black text-slate-800">{data.length}</div>
                        </div>
                    </div>
                </div>
            </section>

            <section id="distribution" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-[300px] shrink-0">
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <span>📊</span> របាយពិន្ទុតាមប្រធានបទ
                    </h3>
                    <p className="text-slate-400 mt-1 text-[10px] italic leading-relaxed">
                        សិក្សាអនុគមន៍មានទម្ងន់ពិន្ទុខ្ពស់ជាងគេ។
                    </p>
                </div>
                <div className="flex-grow w-full relative min-h-[150px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data}
                        dataKey="score"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius="50%"
                        outerRadius="80%"
                        paddingAngle={2}
                      >
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend 
                        layout="vertical" 
                        verticalAlign="bottom" 
                        align="center"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
            </section>

            <section id="time-strategy" className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 flex flex-col min-h-[300px] shrink-0">
                <div className="mb-4">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <span>⏳</span> ការបែងចែកពេលវេលា
                    </h3>
                    <p className="text-slate-400 mt-1 text-[10px] italic leading-relaxed">
                        * ប៉ាន់ស្មាន៖ ១ ពិន្ទុ ស្មើនឹង ១.២ នាទី
                    </p>
                </div>
                <div className="flex-grow w-full relative min-h-[150px] -ml-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data}
                      layout="vertical"
                      margin={{ top: 5, right: 10, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                      <XAxis type="number" tick={{ fill: '#64748B', fontSize: 10 }} />
                      <YAxis dataKey="name" type="category" width={100} tick={{ fill: '#475569', fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="time" radius={[0, 4, 4, 0]}>
                        {data.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
            </section>
        </aside>

        <div className="w-full lg:w-2/3 flex flex-col gap-6 overflow-y-auto pr-2 pb-6" style={{ scrollbarWidth: 'none' }}>
            <section id="topics" className="flex flex-col gap-4">
                <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <span>📚</span> សេចក្តីលម្អិតនៃប្រធានបទនីមួយៗ
                    </h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {data.map((topic, index) => {
                     const isLarge = topic.score >= 20; // Example metric to stretch the card
                     // Determine some styling based on index or color
                     return (
                        <div key={index} className={`bg-white border rounded-xl p-4 flex flex-col justify-between shadow-sm relative transition-colors ${isLarge ? 'col-span-1 sm:col-span-2 border-2' : 'border-slate-200'}`} style={isLarge ? { borderColor: topic.color } : {}}>
                            <div className="flex justify-between items-start mb-2">
                                <div className="p-2 rounded-lg text-lg" style={{ backgroundColor: `${topic.color}20`, color: topic.color }}>{topic.emoji || '📚'}</div>
                                <span className="text-[10px] font-bold px-2 py-1 rounded shadow-sm text-white" style={{ backgroundColor: topic.color }}>{topic.score} ពិន្ទុ</span>
                            </div>
                            <h4 className="font-bold text-sm" style={{ color: isLarge ? topic.color : '#1e293b' }}>{topic.name}</h4>
                            
                            {topic.details && topic.details.length > 0 && (
                               <ul className="text-[11px] text-slate-500 mt-2 italic leading-tight space-y-1">
                                  {topic.details.map((detail, dIdx) => (
                                     <li key={dIdx}>• {detail}</li>
                                  ))}
                               </ul>
                            )}
                        </div>
                     )
                  })}
                </div>
            </section>
            
            <footer className="mt-8 text-slate-400 py-4 text-xs">
                <p>ការវិភាគ និងទិន្នន័យដកស្រង់ចេញពី &quot;វិញ្ញាសាទី ០៩ ៖ គណិតវិទ្យា (កម្រិតស្តង់ដារ-មធ្យម)&quot;</p>
            </footer>
        </div>
      </main>
      )}

      {view === 'history' && (
         <main className="flex-grow flex flex-col p-6 gap-6 overflow-hidden max-w-[1280px] mx-auto w-full">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
               <div>
                  <h2 className="text-xl font-bold text-slate-800">ប្រវត្តិវិញ្ញាសាដែលបានរក្សាទុក (History)</h2>
                  <p className="text-xs text-slate-500 mt-1">គ្រប់គ្រង និងទាញយកប្រធានវិញ្ញាសាដែលបានបង្កើតទុកឡើងវិញ</p>
               </div>
               <div className="flex flex-wrap gap-2">
                  <button 
                     onClick={exportHistoryJSON} 
                     className="px-3.5 py-2 bg-pink-50 text-pink-700 hover:bg-pink-100 border border-pink-200 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                     <span>📥</span> ទាញយកឯកសាររក្សាទុក (Backup JSON)
                  </button>
                  <label className="px-3.5 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1.5">
                     <span>📤</span> ផ្ទុកឯកសារចូលវិញ (Import JSON)
                     <input 
                        type="file" 
                        accept=".json" 
                        onChange={importHistoryJSON} 
                        className="hidden" 
                     />
                  </label>
               </div>
            </div>

            {/* Dynamic Context Notice */}
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-4 flex gap-3 text-xs leading-relaxed items-start shadow-sm">
               <span className="text-lg">{user ? '✅' : '⚠️'}</span>
               <div>
                  {user ? (
                    <>
                      <p className="font-bold text-green-900 mb-1">ទិន្នន័យត្រូវបានរក្សាទុកក្នុង Cloud SQL ដោយសុវត្ថិភាព!</p>
                      <p>ឥឡូវនេះប្រវត្តិវិញ្ញាសាត្រូវបានរក្សាទុកនៅលើ Cloud ដោយមិនបាត់បង់ទេ ទោះបើកពីឧបករណ៍ណាក៏ដោយ។</p>
                    </>
                  ) : (
                    <div className="space-y-2">
                      <p className="font-bold text-amber-900 mb-1">កំពុងរក្សាទុកក្នុង Local Storage បណ្តោះអាសន្ន (Local Storage Mode)៖</p>
                      <p>
                        ការរក្សាទុកប្រវត្តិនេះប្រើប្រាស់ Browser Cache។ ទិន្នន័យអាចនឹងត្រូវបាត់បង់ប្រសិនបើអ្នក Clear Browsing History ឬប្តូរឧបករណ៍។
                      </p>
                      <p className="font-bold border-t border-amber-200 pt-2 mt-2">
                        👉 សូម <button onClick={signIn} className="underline text-blue-600 font-bold hover:text-blue-800">Sign In (ចូលប្រើ)</button> ដើម្បីរក្សាទិន្នន័យជាមួយប្រព័ន្ធ Cloud SQL របស់យើងដោយស្វ័យប្រវត្តិ។
                      </p>
                    </div>
                  )}
               </div>
            </div>

            <div className="flex-grow overflow-y-auto w-full flex flex-col gap-4">
               {isLoadingHistory ? (
                  <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed border-slate-300">
                    កំពុងទាញយកទិន្នន័យប្រវត្តិ...
                  </div>
               ) : history.length === 0 ? (
                  <div className="text-center text-slate-500 py-10 bg-white rounded-xl border border-dashed border-slate-300">មិនទាន់មានទិន្នន័យប្រវត្តិទេ (No history found)</div>
               ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                     {history.map((item, index) => (
                        <div key={item.id || index} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3 hover:border-pink-300 transition-colors">
                           <h3 className="font-bold text-slate-800 text-sm truncate">{item.title}</h3>
                           <div className="text-[10px] text-slate-500 space-y-1">
                              <p>មុខវិជ្ជា៖ {item.subject}</p>
                              <p>កម្រិត៖ {item.level}</p>
                              <p>កាលបរិច្ឆេទ៖ {new Date(item.date).toLocaleString('en-GB')}</p>
                           </div>
                           <div className="flex justify-end gap-2 mt-2">
                              <button 
                                 onClick={() => {
                                    setTitle(item.title);
                                    setLevel(item.level);
                                    setSubject(item.subject);
                                    setDuration(item.duration);
                                    setScore(item.score);
                                    setExamContent(item.examContent || '');
                                    setSolutionContent(item.solutionContent || '');
                                    if (item.data) setData(item.data);
                                    setView('generator');
                                 }}
                                 className="px-3 py-1 bg-pink-50 text-pink-600 rounded text-xs font-bold hover:bg-pink-100 transition shadow-sm cursor-pointer"
                              >បើកសារថ្មី (Open)</button>
                              <button 
                                 onClick={() => deleteFromHistory(item.id)}
                                 className="px-3 py-1 bg-red-50 text-red-600 rounded text-xs font-bold hover:bg-red-100 transition shadow-sm cursor-pointer"
                              >លុប (Delete)</button>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </main>
      )}

      {view === 'generator' && (
         <Generator 
            title={title} setTitle={setTitle}
            level={level} setLevel={setLevel}
            subject={subject} setSubject={setSubject}
            duration={duration} setDuration={setDuration}
            score={score} setScore={setScore}
            examContent={examContent} setExamContent={setExamContent}
            solutionContent={solutionContent} setSolutionContent={setSolutionContent}
            onSave={saveToHistory}
         />
      )}
    </div>
  );
}
