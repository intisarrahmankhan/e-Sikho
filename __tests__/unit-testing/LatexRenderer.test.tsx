import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LatexRenderer, LatexFormulaToolbar } from '@/components/exam/LatexRenderer';

describe('LatexRenderer component', () => {
  it('renders plain Bengali text properly', () => {
    const { container } = render(<LatexRenderer content="সাধারণ বাংলা প্রশ্নমালা" />);
    expect(container.textContent).toContain('সাধারণ বাংলা প্রশ্নমালা');
  });

  it('renders inline math with KaTeX', () => {
    const { container } = render(<LatexRenderer content="সমীকরণটি হলো $E = mc^2$ যা বিখ্যাত।" />);
    expect(container.textContent).toContain('সমীকরণটি হলো');
    // KaTeX outputs elements with class "katex"
    const katexElement = container.querySelector('.katex');
    expect(katexElement).toBeInTheDocument();
  });

  it('renders display block math correctly', () => {
    const { container } = render(
      <LatexRenderer content="মান নির্ণয় করো:\n$$\\int_{0}^{\\pi} \\sin(x) \\, dx$$" />
    );
    expect(container.textContent).toContain('মান নির্ণয় করো:');
    const katexDisplay = container.querySelector('.katex-display');
    expect(katexDisplay).toBeInTheDocument();
  });

  it('handles invalid or unclosed math gracefully without crashing', () => {
    const { container } = render(
      <LatexRenderer content="অসম্পূর্ণ সূত্র $\\frac{a}{ এবং সাধারণ টেক্সট" />
    );
    expect(container).toBeInTheDocument();
  });

  it('renders formula toolbar with quick insert shortcuts', () => {
    let inserted = '';
    render(<LatexFormulaToolbar onInsert={(val) => (inserted = val)} />);
    const fractionBtn = screen.getByText(/ভগ্নাংশ/i);
    expect(fractionBtn).toBeInTheDocument();
  });
});
