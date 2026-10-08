'use client';

import React, { useMemo } from 'react';
import katex from 'katex';

interface LatexRendererProps {
  content: string;
  className?: string;
  inline?: boolean;
}

interface Segment {
  type: 'text' | 'inline-math' | 'block-math';
  value: string;
}

/**
 * Parses mixed text containing LaTeX delimiters into structured segments.
 * Supports:
 * - Block math: `$$...$$` or `\[...\]`
 * - Inline math: `$..$` or `\(...\)`
 * - Plain text (including Bengali Unicode)
 */
function parseMixedContent(raw: string): Segment[] {
  if (!raw) return [];

  const segments: Segment[] = [];
  // Regex to match block math ($$...$$ or \[...\]) or inline math ($...$ or \(...\))
  // We use non-greedy matches
  const mathRegex = /(\$\$[\s\S]*?\$\$|\\\[[\s\S]*?\\\]|\$(?!\$)[\s\S]*?\$|\\\([\s\S]*?\\\))/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = mathRegex.exec(raw)) !== null) {
    // Add text preceding the match
    if (match.index > lastIndex) {
      segments.push({
        type: 'text',
        value: raw.substring(lastIndex, match.index),
      });
    }

    const matchedStr = match[0];

    if (matchedStr.startsWith('$$') && matchedStr.endsWith('$$')) {
      segments.push({
        type: 'block-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('\\[') && matchedStr.endsWith('\\]')) {
      segments.push({
        type: 'block-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    } else if (matchedStr.startsWith('$') && matchedStr.endsWith('$')) {
      segments.push({
        type: 'inline-math',
        value: matchedStr.slice(1, -1).trim(),
      });
    } else if (matchedStr.startsWith('\\(') && matchedStr.endsWith('\\)')) {
      segments.push({
        type: 'inline-math',
        value: matchedStr.slice(2, -2).trim(),
      });
    }

    lastIndex = match.index + matchedStr.length;
  }

  // Trailing text
  if (lastIndex < raw.length) {
    segments.push({
      type: 'text',
      value: raw.substring(lastIndex),
    });
  }

  // If no math delimiters were found, but the string looks like pure LaTeX (starts with \ or contains _ or ^ with { }):
  if (segments.length === 1 && segments[0].type === 'text') {
    const trimmed = raw.trim();
    if (
      trimmed.startsWith('\\frac') ||
      trimmed.startsWith('\\sqrt') ||
      trimmed.startsWith('\\int') ||
      trimmed.startsWith('\\sum') ||
      trimmed.startsWith('\\lim') ||
      trimmed.startsWith('\\begin{')
    ) {
      return [{ type: 'inline-math', value: trimmed }];
    }
  }

  return segments;
}

/**
 * Safely renders LaTeX expression to HTML using KaTeX.
 */
function renderKatexToString(math: string, displayMode: boolean): string {
  try {
    return katex.renderToString(math, {
      displayMode,
      throwOnError: false,
      output: 'htmlAndMathml',
      strict: false,
    });
  } catch (err) {
    console.warn('KaTeX render error:', err);
    return `<span class="text-rose-500 font-mono text-xs">[LaTeX error: ${escapeHtml(math)}]</span>`;
  }
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * LatexRenderer: Renders text containing LaTeX math notation.
 * Example:
 * <LatexRenderer content="Solve for $x$: $2x^2 + 5x - 3 = 0$" />
 */
export function LatexRenderer({ content, className = '', inline = false }: LatexRendererProps) {
  const segments = useMemo(() => parseMixedContent(content || ''), [content]);

  if (!content) return null;

  return (
    <span className={`inline-latex-container ${className}`}>
      {segments.map((segment, index) => {
        if (segment.type === 'text') {
          return <span key={index}>{segment.value}</span>;
        }

        const isBlock = !inline && segment.type === 'block-math';
        const html = renderKatexToString(segment.value, isBlock);

        if (isBlock) {
          return (
            <div
              key={index}
              className="my-3 overflow-x-auto py-1 text-center"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        }

        return (
          <span
            key={index}
            className="inline-block px-1 align-middle"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </span>
  );
}

/**
 * Quick toolbar to insert LaTeX symbols into inputs or textareas.
 */
interface FormulaHelperProps {
  onInsert: (formula: string) => void;
}

export function LatexFormulaToolbar({ onInsert }: FormulaHelperProps) {
  const commonFormulas = [
    { label: 'x/y ভগ্নাংশ', code: '\\frac{a}{b}', preview: '\\frac{a}{b}' },
    { label: '√x বর্গমূল', code: '\\sqrt{x}', preview: '\\sqrt{x}' },
    { label: 'xⁿ ঘাত', code: 'x^{n}', preview: 'x^n' },
    { label: 'xₙ সাবস্ক্রিপ্ট', code: 'x_{n}', preview: 'x_n' },
    { label: '∫ ইন্টিগ্রাল', code: '\\int_{a}^{b} f(x) \\, dx', preview: '\\int f(x)dx' },
    { label: '∑ সামেশন', code: '\\sum_{i=1}^{n} x_i', preview: '\\sum x_i' },
    { label: 'π পাই', code: '\\pi', preview: '\\pi' },
    { label: 'θ থিটা', code: '\\theta', preview: '\\theta' },
    { label: 'α আলফা', code: '\\alpha', preview: '\\alpha' },
    { label: 'β বিটা', code: '\\beta', preview: '\\beta' },
    { label: 'λ ল্যাম্বডা', code: '\\lambda', preview: '\\lambda' },
    { label: '∞ অসীম', code: '\\infty', preview: '\\infty' },
    { label: '± প্লাস-মাইনাস', code: '\\pm', preview: '\\pm' },
    { label: '≤ লেস দেন', code: '\\le', preview: '\\le' },
    { label: '≥ গ্রেটার দেন', code: '\\ge', preview: '\\ge' },
    { label: '≠ নট ইকুয়াল', code: '\\neq', preview: '\\neq' },
    { label: '→ তীরচিহ্ন', code: '\\rightarrow', preview: '\\rightarrow' },
    { label: 'ম্যাট্রিক্স', code: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}', preview: '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}' },
    { label: 'লিম লিমিট', code: '\\lim_{x \\to 0} \\frac{\\sin x}{x}', preview: '\\lim_{x \\to 0}' },
  ];

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2.5 space-y-1.5">
      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1">
          <span className="text-primary-600 font-bold">LaTeX সূত্র শর্টকাট:</span> ক্লিক করে যোগ করুন
        </span>
        <span className="text-slate-400">ইনলাইন: $...$ | ব্লক: $$...$$</span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {commonFormulas.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onInsert(`$${item.code}$`)}
            className="px-2 py-1 text-xs bg-white hover:bg-primary-50 hover:text-primary-700 hover:border-primary-300 border border-slate-200 rounded-md font-mono transition shadow-2xs"
            title={item.code}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default LatexRenderer;
