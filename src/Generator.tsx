import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function Generator({
  title, setTitle,
  level, setLevel,
  subject, setSubject,
  duration, setDuration,
  score, setScore,
  examContent, setExamContent,
  solutionContent, setSolutionContent,
  onSave
}: any) {
  const [activeTab, setActiveTab] = useState<'exam' | 'solution'>('exam');

  const [isGeneratingExam, setIsGeneratingExam] = useState(false);
  const [isGeneratingSolution, setIsGeneratingSolution] = useState(false);

  const generateExamWithAI = async () => {
    setIsGeneratingExam(true);
    try {
      const res = await fetch('/api/exam/generate-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: examContent })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setExamContent(data.result);
      } else {
        alert(data.error || "បរាជ័យក្នុងការទទួលបានទិន្នន័យពី AI");
      }
    } catch (e) {
      alert("បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ Server");
    } finally {
      setIsGeneratingExam(false);
    }
  };

  const generateSolutionWithAI = async () => {
    setIsGeneratingSolution(true);
    try {
      const res = await fetch('/api/exam/generate-solution', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ examContent, content: solutionContent })
      });
      const data = await res.json();
      if (res.ok && data.result) {
        setSolutionContent(data.result);
      } else {
        alert(data.error || "បរាជ័យក្នុងការទទួលបានទិន្នន័យពី AI");
      }
    } catch (e) {
      alert("បរាជ័យក្នុងការភ្ជាប់ទៅកាន់ Server");
    } finally {
      setIsGeneratingSolution(false);
    }
  };

  const downloadAsWord = () => {
    const rawContent = activeTab === 'exam' ? examContent : solutionContent;
    const documentTitle = activeTab === 'exam' ? 'ប្រធានវិញ្ញាសា' : 'អត្រាកំណែ';

    // MathType supports raw LaTeX strings. If the math formulas are stripped 
    // of $ ... $ and $$ ... $$, MathType Toggle TeX will be able to convert them.
    let processedContent = rawContent.replace(/\$\$(.*?)\$\$/gs, ' $1 ');
    processedContent = processedContent.replace(/\$(.*?)\$/g, ' $1 ');
    
    // Create an HTML blob to make the Word document somewhat formatted
    const htmlContent = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${documentTitle}</title>
        <style>
          body { font-family: 'Khmer OS Battambang', 'Arial', sans-serif; font-size: 11pt; line-height: 1.5; color: #1e293b; background: white; }
          .question-box { background-color: #1e3a8a; color: white; padding: 10px; margin-top: 20px; font-weight: bold; }
          .hint-box { background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 15px; margin: 15px 0; }
          .solution-box { background-color: #d1fae5; color: #047857; font-weight: bold; padding: 8px 12px; margin-top: 20px; border: 1px solid #a7f3d0; border-radius: 4px; }
          .small-green-label { background-color: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; padding: 4px 8px; font-weight: bold; border-radius: 4px; display: inline-block; margin: 10px 0; }
        </style>
      </head>
      <body>
        <table style="width: 100%; border-bottom: 2px solid #1e3a8a; margin-bottom: 20px;" cellpadding="0" cellspacing="0">
          <tr>
            <td style="font-weight: bold; font-size: 10pt; vertical-align: top; width: 33%;">
              <p style="margin: 0 0 5px 0;">ក្រសួងអប់រំ យុវជន និងកីឡា</p>
              <p style="margin: 0;">មណ្ឌលប្រឡង ៖ ...................................</p>
            </td>
            <td style="text-align: center; vertical-align: top; width: 34%;">
              <h2 style="margin: 0 0 5px 0; font-size: 12pt; color: #1e3a8a;">${title}</h2>
              <p style="margin: 0; font-size: 10pt; font-weight: bold; color: #1e3a8a;">${level}</p>
            </td>
            <td style="text-align: right; font-weight: bold; font-size: 10pt; vertical-align: top; width: 33%;">
              <p style="margin: 0 0 5px 0;">លេខតុ ៖ .........................</p>
              <p style="margin: 0;">លេខបន្ទប់ ៖ .....................</p>
            </td>
          </tr>
        </table>

        <table style="width: 100%; border: 1px solid #1e3a8a; margin-bottom: 30px; background-color: #eff6ff; color: #1e3a8a; font-weight: bold; font-size: 10pt;" cellpadding="10" cellspacing="0">
          <tr>
            <td style="width: 50%; vertical-align: top; border-right: none;">
              <p style="margin: 0 0 10px 0;">មុខវិជ្ជា &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ៖ <span style="font-weight: normal; color: #1e293b;">${subject}</span></p>
              <p style="margin: 0 0 10px 0;">សម័យប្រឡង ៖ <span style="font-weight: normal; color: #1e293b;">...../...../២០២...</span></p>
              <p style="margin: 0;">ឈ្មោះបេក្ខជន ៖ <span style="font-weight: normal; color: #1e293b;">.........................................</span></p>
            </td>
            <td style="width: 50%; vertical-align: top;">
               <p style="margin: 0 0 10px 0;">រយៈពេល &nbsp;&nbsp;&nbsp; ៖ <span style="font-weight: normal; color: #1e293b;">${duration}</span></p>
               <p style="margin: 0 0 10px 0;">ពិន្ទុពេញ &nbsp;&nbsp;&nbsp;&nbsp; ៖ <span style="font-weight: normal; color: #1e293b;">${score}</span></p>
               <p style="margin: 0;">ហត្ថលេខា ៖ <span style="font-weight: normal; color: #1e293b;">............................</span></p>
            </td>
          </tr>
        </table>
        
        ${processedContent.split('\n').map(line => {
           let safeLine = line.replace(/</g, '&lt;').replace(/>/g, '&gt;');
           if (safeLine.startsWith('# ')) {
               return `<div class="small-green-label">${safeLine.substring(2)}</div>`;
           }
           if (safeLine.startsWith('## ')) {
               return `<div class="small-green-label">${safeLine.substring(3)}</div>`;
           }
           if (safeLine.startsWith('### ')) {
               return `<div class="question-box">${safeLine.substring(4)}</div>`;
           }
           if (safeLine.startsWith('&gt; ') || safeLine.startsWith('> ')) {
               let hintText = safeLine.startsWith('&gt; ') ? safeLine.substring(5) : safeLine.substring(2);
               return `<div class="hint-box">${hintText}</div>`;
           }
           if (safeLine.startsWith('#### ')) {
               return `<div class="solution-box">${safeLine.substring(5)}</div>`;
           }
           return `<p style="margin: 0; padding: 0;">${safeLine}</p>`;
        }).join('')}
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff', htmlContent], {
        type: 'application/msword'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const downloadAsPDF = () => {
    try {
      if (window.self !== window.top) {
        // Auto-open in new tab since we are in an iframe
        const newWindow = window.open(window.location.href, '_blank');
        if (newWindow) {
          // If popup blcoker didn't block it, do nothing, it works.
        } else {
          // If blocked, tell them how to do it manually or click a generated link.
          alert("សូមបញ្ជាក់៖ កម្មវិធី (Browser) របស់អ្នកបានបិទ (Block Pop-ups)។ សូមអនុញ្ញាតឱ្យបើកផ្ទាំងថ្មីសិន រួចចុចម្តងទៀត។");
        }
        return;
      }
      
      // If we are already in top window, trigger native print
      setTimeout(() => {
        window.print();
      }, 300);
    } catch (e) {
      alert("មានបញ្ហាក្នុងការបោះពុម្ព។ សូមសាកល្បងចុច Ctrl+P។");
    }
  };

  const autoFormatMarkdown = (content: string, isSolution: boolean) => {
    let text = content;
    
    // 0. Ensure block math $$ has new lines around it so it renders correctly
    text = text.replace(/([^\n])\$\$/g, '$1\n$$$');
    text = text.replace(/\$\$([^\n])/g, '$$$\n$1');

    // 1. Move point strings like (១៥ ពិន្ទុ) after the Roman Numeral if they are placed before
    text = text.replace(/(\(\s*[0-9១២៣៤៥៦៧៨៩០]+\s*ពិន្ទុ\s*\))\s*\**(I{1,3}|IV|V|VI{1,3}|IX|X)\**/g, '$2. $1');

    // 1.1 Convert bold Roman numerals `**I. ...**` or `I. ...` to headers
    text = text.replace(/^ *\*\*(I{1,3}|IV|V|VI{1,3}|IX|X)[\.\)ៈ]*\s*(.*?)\*\*/gm, '$1. $2');
    text = text.replace(/(I{1,3}|IV|V|VI{1,3}|IX|X)[\.\)ៈ]+\s*(.*)/g, (match, roman, rest) => {
        // Only convert to header if it's at the start of a line, or forcibly break it
        return `\n### ${roman}. ${rest}`;
    });

    // 1.5 Ensure sub-questions like ក., ខ., or 1., 2. are placed on new lines.
    text = text.replace(/([^\n])\s+([កខគឃងចឆជឈញដឋឌឍណតថទធនបផពភមយរលវសហឡអ][\.\)])\s+/g, '$1\n\n$2 ');
    text = text.replace(/([^\n])\s+([១២៣៤៥៦៧៨៩០0-9]+\s*[\.\)])\s+/g, '$1\n\n$2 ');

    // Fix spaces around $ which might break the inline math parser
    text = text.replace(/\$(\s+)(.*?)\$/g, '$$$2$$');
    text = text.replace(/\$(.*?)(\s+)\$/g, '$$$1$$');

    // 2. Wrap hints/notes in blockquotes (catch raw or bold variants)
    text = text.replace(/^ *\**(គន្លឹះ|ចំណាំ|Hint)\**[\sៈ៖]*(.*)/gm, '> $1៖ $2');

    // 3. Clean up and standardise solution headers if in solution mode
    if (isSolution) {
        let lines = text.split('\n');
        let outLines = [];

        for (let i = 0; i < lines.length; i++) {
           let line = lines[i];
           let isSolutionHeader = line.trim().match(/^(### I{1,3}|### IV|### V|### VI{1,3}|### IX|### X)/);
           
           outLines.push(line);
           if (isSolutionHeader) {
               // Check if the next non-empty line already contains some "ចម្លើយលម្អិត"
               let hasMatch = false;
               for (let j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                   if (lines[j].match(/^(####|##)\s*ចម្លើយលម្អិត/)) {
                      hasMatch = true;
                      break;
                   }
               }
               if (!hasMatch) {
                   outLines.push('## ចម្លើយលម្អិត');
               }
           }
        }
        text = outLines.join('\n');
    }

    // 4. Clean up excessive newlines
    text = text.replace(/\n{3,}/g, '\n\n');

    return text.trim();
  };

  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-4 max-w-[1280px] mx-auto overflow-hidden print:overflow-visible print:block print:max-w-none">
      {/* Editor sidebar */}
      <div className="w-full md:w-[400px] flex flex-col gap-4 overflow-y-auto pr-2 pb-6 shrink-0 print:hidden" style={{ scrollbarWidth: 'none' }}>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col gap-3">
          <h3 className="font-bold text-slate-800 text-sm border-b pb-2">ព័ត៌មានទូទៅនៃវិញ្ញាសា</h3>
          
          <div className="grid grid-cols-2 gap-2">
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">ចំណងជើងវិញ្ញាសា</label>
                <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-pink-400" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">កម្រិត/ថ្នាក់</label>
                <input value={level} onChange={e => setLevel(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-pink-400" />
             </div>
             <div className="col-span-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase">មុខវិជ្ជា</label>
                <input value={subject} onChange={e => setSubject(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-pink-400" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">រយៈពេល</label>
                <input value={duration} onChange={e => setDuration(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-pink-400" />
             </div>
             <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase">ពិន្ទុពេញ</label>
                <input value={score} onChange={e => setScore(e.target.value)} className="w-full border border-slate-200 rounded px-2 py-1 text-xs outline-none focus:border-pink-400" />
             </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-grow min-h-[350px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 text-sm">ប្រធានវិញ្ញាសា</h3>
            <div className="flex gap-2">
              <button 
                onClick={generateExamWithAI}
                disabled={isGeneratingExam}
                className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isGeneratingExam ? <span className="animate-pulse">⏳ កំពុងដំណើរការ...</span> : <span>🤖 រៀបចំដោយ AI</span>}
              </button>
              <button 
                onClick={() => setExamContent(autoFormatMarkdown(examContent, false))}
                className="text-[10px] bg-pink-50 text-pink-600 border border-pink-200 font-bold px-3 py-1 rounded-full hover:bg-pink-100 transition-colors shadow-sm cursor-pointer"
              >
                ✨ រៀបចំអូតូ (Auto Format)
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded mb-3 border border-slate-200">
             <span className="font-bold">គន្លឹះរៀបចំទម្រង់៖</span> អ្នកអាចរៀបចំអូតូ ឫសរសេរកូតដោយខ្លួនឯង<br/>
             <code>### I. (១៥ពិន្ទុ)</code> = បង្កើតប្រអប់លេខរៀងពណ៌ខៀវ<br/>
             <code>&gt; អក្សរ...</code> = បង្កើតប្រអប់គន្លឹះចំណាំ (Tip) ពណ៌លឿង
          </div>
          <textarea 
            value={examContent}
            onChange={(e) => setExamContent(e.target.value)}
            className="flex-grow w-full border border-slate-200 rounded text-xs p-3 font-mono outline-none focus:border-pink-400 resize-none h-[250px]"
            placeholder="Paste raw exam text here..."
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex flex-col flex-grow min-h-[350px]">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-slate-800 text-sm">អត្រាកំណែ</h3>
            <div className="flex gap-2">
              <button 
                onClick={generateSolutionWithAI}
                disabled={isGeneratingSolution}
                className="text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-200 font-bold px-3 py-1 rounded-full hover:bg-indigo-100 transition-colors shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
              >
                {isGeneratingSolution ? <span className="animate-pulse">⏳ កំពុងដំណើរការ...</span> : <span>🤖 គណនាដោយ AI</span>}
              </button>
              <button 
                onClick={() => setSolutionContent(autoFormatMarkdown(solutionContent, true))}
                className="text-[10px] bg-green-50 text-green-700 border border-green-200 font-bold px-3 py-1 rounded-full hover:bg-green-100 transition-colors shadow-sm cursor-pointer"
              >
                ✨ រៀបចំអូតូ (Auto Format)
              </button>
            </div>
          </div>
          <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded mb-3 border border-slate-200">
             <span className="font-bold">គន្លឹះរៀបចំទម្រង់៖</span> <br/>
             <code># របាយចម្លើយលម្អិត</code> ឬ <code>## ចម្លើយលម្អិត</code> = បង្កើតស្លាកពណ៌បៃតងតូច<br/>
             <code>#### ចំណាំ</code> = បង្កើតស្លាកពណ៌បៃតងលាយព័ណផ្កាឈូកពេញ១លំហាត់
          </div>
          <textarea 
            value={solutionContent}
            onChange={(e) => setSolutionContent(e.target.value)}
            className="flex-grow w-full border border-slate-200 rounded text-xs p-3 font-mono outline-none focus:border-green-400 resize-none h-[250px]"
            placeholder="Paste raw solution text here..."
          />
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-grow flex flex-col bg-[#F1F5F9] rounded-xl overflow-hidden shadow-inner border border-slate-200 h-full print:bg-white print:border-none print:shadow-none print:overflow-visible print:h-auto print:block">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-4 shrink-0 print:hidden">
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('exam')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'exam' ? 'bg-pink-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              មើលប្រធានវិញ្ញាសា
            </button>
            <button 
              onClick={() => setActiveTab('solution')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors ${activeTab === 'solution' ? 'bg-green-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              មើលអត្រាកំណែ
            </button>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSave}
              className="px-4 py-1.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-200 text-xs font-bold hover:bg-emerald-100 transition shadow-sm flex items-center gap-2"
            >
              <span>💾</span> រក្សាទុក (Save)
            </button>
            <button 
              onClick={downloadAsPDF}
              className="px-4 py-1.5 rounded bg-red-50 text-red-600 border border-red-200 text-xs font-bold hover:bg-red-100 transition shadow-sm flex items-center gap-2"
            >
              <span>📑</span> បោះពុម្ពជា PDF
            </button>
            <button 
              onClick={downloadAsWord}
              className="px-4 py-1.5 rounded bg-blue-50 text-blue-600 border border-blue-200 text-xs font-bold hover:bg-blue-100 transition shadow-sm flex items-center gap-2"
            >
              <span>📥</span> បោះពុម្ពជា Word (MathType)
            </button>
          </div>
        </div>
        
        <div className="flex-grow overflow-y-auto p-4 md:p-8 flex justify-center print:p-0 print:overflow-visible print:block" style={{ scrollbarWidth: 'none' }}>
           <div id="printable-area" className="bg-white w-full max-w-[800px] shadow-sm rounded border border-slate-200 p-8 md:p-12 text-[#1e293b] h-max min-h-[1056px] print:border-none print:shadow-none print:max-w-none print:p-0">
             
             {/* Print wrapper table for repeating headers/footers */}
             <table className="w-full">
                <thead className="print:table-header-group hidden">
                   <tr>
                      <td className="pt-2 pb-6 border-b border-transparent">
                         <div className="flex justify-between items-end text-sm font-bold text-slate-800 font-sans">
                             <div className="text-left w-1/3 text-md font-moul">វិទ្យាល័យ ព្រះ នរោត្តម សីហមុនី</div>
                             <div className="text-center w-1/3">មុខវិជ្ជាគណិតវិទ្យា</div>
                             <div className="text-right w-1/3 italic text-slate-500 font-normal">ទំព័រ...</div>
                         </div>
                      </td>
                   </tr>
                </thead>
                <tbody>
                   <tr>
                      <td>
              
              {/* Header Information */}
              <div className="flex justify-between border-b-2 border-blue-900 pb-2 mb-4">
                <div className="text-xs font-bold space-y-1">
                  <p>ក្រសួងអប់រំ យុវជន និងកីឡា</p>
                  <p>មណ្ឌលប្រឡង ៖ ...................................</p>
                </div>
                <div className="text-center">
                  <h2 className="font-moul text-sm text-blue-900 leading-relaxed">{title}</h2>
                  <p className="font-sans text-xs font-bold text-blue-900">{level}</p>
                </div>
                <div className="text-xs font-bold space-y-1 text-right">
                  <p>លេខតុ ៖ .........................</p>
                  <p>លេខបន្ទប់ ៖ .....................</p>
                </div>
              </div>

              {/* Box student info */}
              <div className="border border-blue-900 rounded p-4 flex mb-8 text-xs font-bold text-blue-900 bg-blue-50/30">
                 <div className="w-1/2 space-y-2">
                    <p>មុខវិជ្ជា <span className="ml-8 text-slate-800 font-normal">៖ {subject}</span></p>
                    <p>សម័យប្រឡង <span className="ml-1 text-slate-800 font-normal">៖ ...../...../២០២...</span></p>
                    <p>ឈ្មោះបេក្ខជន <span className="ml-1 text-slate-800 font-normal">៖ .........................................</span></p>
                 </div>
                 <div className="w-1/2 space-y-2">
                    <p>រយៈពេល <span className="ml-8 text-slate-800 font-normal">៖ {duration}</span></p>
                    <p>ពិន្ទុពេញ <span className="ml-7 text-slate-800 font-normal">៖ {score}</span></p>
                    <p>ហត្ថលេខា <span className="ml-4 text-slate-800 font-normal">៖ ............................</span></p>
                 </div>
              </div>

              {/* Content */}
              <div className="space-y-2">
                {activeTab === 'solution' && (
                   <div className="text-center mb-6">
                      <h3 className="font-bold text-lg text-slate-800">អត្រាកំណែពេញលេញ និងលម្អិត</h3>
                      <div className="w-24 h-1 bg-blue-900 mx-auto mt-2"></div>
                   </div>
                )}

                <div className="text-sm max-w-none text-slate-800 leading-relaxed markdown-container">
                   <ReactMarkdown 
                     remarkPlugins={[remarkMath]} 
                     rehypePlugins={[[rehypeKatex, { strict: false, throwOnError: false }]]}
                     components={{
                       h1: ({node, ...props}: any) => <h1 className="text-xs font-bold text-green-700 bg-green-100 inline-block px-2 py-1 mt-2 mb-3 rounded border border-green-200 print:break-inside-avoid" {...props} />,
                       h2: ({node, ...props}: any) => <h2 className="text-xs font-bold text-green-700 bg-green-100 inline-block px-2 py-1 mt-2 mb-3 rounded border border-green-200 print:break-inside-avoid" {...props} />,
                       h3: ({node, ...props}: any) => <h3 className="bg-blue-900 text-white font-bold py-1.5 px-4 rounded text-sm w-full mt-8 mb-4 shadow-sm block print:break-after-avoid" {...props} />,
                       h4: ({node, ...props}: any) => <h4 className="text-sm font-bold text-slate-800 bg-gradient-to-r from-emerald-400 to-pink-300 py-1.5 px-4 mt-4 mb-3 rounded shadow-sm block w-full border border-emerald-300 print:break-after-avoid" {...props} />,
                       blockquote: ({node, ...props}: any) => (
                         <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs p-4 rounded my-4 relative overflow-hidden shadow-sm print:break-inside-avoid">
                           <span className="absolute top-0 left-0 w-1 h-full bg-amber-400"></span>
                           <div className="font-bold flex items-center gap-1 mb-2 text-amber-700"><span className="text-amber-500 text-sm">💡</span> គន្លឹះចំណាំ៖</div>
                           <div className="opacity-90 space-y-2">{props.children}</div>
                         </div>
                       ),
                       p: ({node, ...props}: any) => <p className="mb-3 leading-relaxed text-sm whitespace-pre-wrap print:break-inside-avoid" {...props} />,
                       ul: ({node, ...props}: any) => <ul className="list-disc pl-6 mb-4 space-y-1 text-sm print:break-inside-avoid" {...props} />,
                       ol: ({node, ...props}: any) => <ol className="list-decimal pl-6 mb-4 space-y-1 text-sm print:break-inside-avoid" {...props} />,
                       hr: ({node, ...props}: any) => <hr className="my-6 border-slate-200 border-t-2 border-dashed print:hidden" {...props} />,
                       strong: ({node, ...props}: any) => <strong className="font-bold text-slate-900 leading-relaxed" {...props} />,
                       em: ({node, ...props}: any) => <em className="italic text-slate-600 leading-relaxed" {...props} />,
                     }}
                   >
                      {activeTab === 'exam' ? examContent : solutionContent}
                   </ReactMarkdown>
                </div>
              </div>
            
                      </td>
                   </tr>
                </tbody>
                <tfoot className="print:table-footer-group hidden">
                   <tr>
                      <td className="pt-6 pb-2 border-t border-transparent">
                         <div className="flex justify-between items-start text-sm font-bold text-slate-500 font-sans mt-8">
                             <div className="text-left w-1/3 text-slate-800">បង្រៀនដោយ លោកគ្រូ ឆយ សុវ៉ាន់ណេត</div>
                             <div className="text-center w-1/3 text-slate-800 font-moul">សាលា គួរ</div>
                             <div className="text-right w-1/3 font-sans">016 567 437</div>
                         </div>
                      </td>
                   </tr>
                </tfoot>
             </table>
           </div>
        </div>
      </div>
    </div>
  );
}
