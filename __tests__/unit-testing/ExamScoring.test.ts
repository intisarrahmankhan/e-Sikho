import { describe, it, expect } from 'vitest';

describe('Exam grading logic', () => {
  const sampleQuestions = [
    { question: 'What is $2+2$?', options: ['$3$', '$4$', '$5$'], correctAnswer: 1, marks: 1 },
    { question: 'Integral of $\\cos(x)$?', options: ['$\\sin(x)$', '$-\\sin(x)$'], correctAnswer: 0, marks: 2 },
    { question: 'Solve $x^2 = 9$', options: ['$3$', '$\\pm 3$', '$-3$'], correctAnswer: 1, marks: 1 },
  ];

  it('calculates perfect score when all answers are correct', () => {
    const studentAnswers: Record<number, number> = { 0: 1, 1: 0, 2: 1 };
    let score = 0;
    const totalMarks = sampleQuestions.reduce((sum, q) => sum + q.marks, 0);

    sampleQuestions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correctAnswer) {
        score += q.marks;
      }
    });

    const percentage = Math.round((score / totalMarks) * 100);
    const passed = score >= Math.ceil(totalMarks * 0.5);

    expect(score).toBe(4);
    expect(totalMarks).toBe(4);
    expect(percentage).toBe(100);
    expect(passed).toBe(true);
  });

  it('handles partial answers and wrong answers correctly', () => {
    const studentAnswers: Record<number, number> = { 0: 1, 1: 1 /* wrong */, 2: -1 /* skipped */ };
    let score = 0;
    const totalMarks = sampleQuestions.reduce((sum, q) => sum + q.marks, 0);

    sampleQuestions.forEach((q, idx) => {
      if (studentAnswers[idx] === q.correctAnswer) {
        score += q.marks;
      }
    });

    const percentage = Math.round((score / totalMarks) * 100);
    const passed = score >= 3; // pass mark 3

    expect(score).toBe(1); // only Q0 correct
    expect(percentage).toBe(25);
    expect(passed).toBe(false);
  });
});
