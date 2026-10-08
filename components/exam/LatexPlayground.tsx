'use client';

import React, { useState } from 'react';
import { LatexRenderer, LatexFormulaToolbar } from './LatexRenderer';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Sparkles, Code2, Eye, Copy, Check } from 'lucide-react';

const PRESETS = [
  {
    title: 'দ্বিঘাত সূত্র (Quadratic Formula)',
    code: 'দ্বিঘাত সমীকরণ $ax^2 + bx + c = 0$ এর সমাধান হলো:\n$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$',
  },
  {
    title: 'ক্যালকুলাস ইন্টিগ্রাল (Definite Integral)',
    code: 'মান নির্ণয় করো: $$\\int_{0}^{\\pi} \\sin(x) \\, dx = [-\\cos(x)]_{0}^{\\pi} = 2$$',
  },
  {
    title: 'আইলারের অভেদ (Euler\'s Identity)',
    code: 'বিশ্বের সবচেয়ে সুন্দর গাণিতিক সমীকরণ:\n$$e^{i\\pi} + 1 = 0$$',
  },
  {
    title: 'ম্যাট্রিক্স গুণন (Matrix Multiplication)',
    code: 'ম্যাট্রিক্স রূপান্তর:\n$$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix} \\begin{pmatrix} x \\\\ y \\end{pmatrix} = \\begin{pmatrix} ax + by \\\\ cx + dy \\end{pmatrix}$$',
  },
  {
    title: 'অ্যালগরিদম জটিলতা (Big-O Notation)',
    code: 'মার্জ সর্টের সেরা ও সাধারণ সময় জটিলতা $O(n \\log n)$, যেখানে মেমরি জটিলতা $O(n)$।',
  },
];

export function LatexPlayground() {
  const [input, setInput] = useState(PRESETS[0].code);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInsert = (formula: string) => {
    setInput((prev) => prev + (prev.endsWith(' ') ? '' : ' ') + formula);
  };

  return (
    <Card className="border border-slate-200 bg-white shadow-sm overflow-hidden rounded-2xl">
      <CardHeader className="p-5 pb-3 border-b border-slate-100 bg-slate-50/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary-600" />
            <span>LaTeX ম্যাথ রেন্ডারিং প্লে-গ্রাউন্ড ও লাইভ প্রিভিউ</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-8 gap-1.5 border-slate-200"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'কপি হয়েছে' : 'কোড কপি'}</span>
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-5 space-y-4">
        {/* Preset sample buttons */}
        <div className="space-y-1.5">
          <span className="text-xs font-semibold text-slate-500">নমুনা সমীকরণ নির্বাচন করুন:</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setInput(p.code)}
                className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-200 text-slate-700 transition"
              >
                {p.title}
              </button>
            ))}
          </div>
        </div>

        {/* Toolbar */}
        <LatexFormulaToolbar onInsert={handleInsert} />

        {/* Editor & Live Preview Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Code2 className="h-4 w-4 text-slate-500" />
                <span>ইনপুট লিখুন (বাংলা টেক্সট + LaTeX $..$ বা $$..$$)</span>
              </span>
            </div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={6}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 font-mono text-xs text-slate-800 focus:bg-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition"
              placeholder="এখানে বাংলা টেক্সট এবং গাণিতিক সূত্র লিখুন, যেমন: মান নির্ণয় করো $f(x) = x^2 + 5$"
            />
          </div>

          {/* Live Rendered Output */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
              <span className="flex items-center gap-1.5">
                <Eye className="h-4 w-4 text-emerald-600" />
                <span>লাইভ রেন্ডার প্রিভিউ (KaTeX)</span>
              </span>
              <span className="text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                তাৎক্ষণিক রেন্ডারিং
              </span>
            </div>
            <div className="h-[148px] overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 shadow-inner flex items-center justify-center">
              {input.trim() ? (
                <div className="w-full text-center">
                  <LatexRenderer content={input} />
                </div>
              ) : (
                <span className="text-slate-400 text-xs italic">
                  কিছু লিখলে এখানে রেন্ডার করা প্রিভিউ দেখা যাবে...
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default LatexPlayground;
