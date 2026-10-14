import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DiscussionBoard from '@/components/courses/DiscussionBoard';
import * as commentActions from '@/actions/comment';

vi.mock('@/actions/comment', () => ({
  addComment: vi.fn(),
  toggleLikeComment: vi.fn(),
  flagSolution: vi.fn(),
}));

describe('DiscussionBoard UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockComments = [
    {
      _id: '1',
      content: 'This is a test question',
      userId: { _id: 'u1', name: 'Test User' },
      parentId: null,
      isSolution: false,
      likes: [],
      createdAt: new Date().toISOString(),
    }
  ];

  it('renders correctly with initial comments', () => {
    render(<DiscussionBoard lessonId="l1" currentUserId="u2" initialComments={mockComments} />);
    expect(screen.getByText('This is a test question')).toBeInTheDocument();
    expect(screen.getByText('Test User')).toBeInTheDocument();
  });

  it('allows posting a new question', async () => {
    (commentActions.addComment as any).mockResolvedValue({ 
      success: true, 
      comment: { _id: '2', content: 'New question', createdAt: new Date().toISOString() } 
    });

    render(<DiscussionBoard lessonId="l1" currentUserId="u2" />);
    
    const input = screen.getByPlaceholderText('Ask a question about this lesson...');
    fireEvent.change(input, { target: { value: 'New question' } });
    
    const postButton = screen.getByText('Post');
    fireEvent.click(postButton);

    await waitFor(() => {
      expect(commentActions.addComment).toHaveBeenCalledWith({
        content: 'New question',
        lessonId: 'l1',
        userId: 'u2',
        parentId: null
      });
      expect(screen.getByText('New question')).toBeInTheDocument();
    });
  });

  it('allows liking a comment', async () => {
    (commentActions.toggleLikeComment as any).mockResolvedValue({ success: true });

    render(<DiscussionBoard lessonId="l1" currentUserId="u2" initialComments={mockComments} />);
    
    const likeButton = screen.getByText('0');
    fireEvent.click(likeButton);

    await waitFor(() => {
      expect(commentActions.toggleLikeComment).toHaveBeenCalledWith('1', 'u2', 'l1');
      expect(screen.getByText('1')).toBeInTheDocument();
    });
  });

  it('allows flagging as solution', async () => {
    (commentActions.flagSolution as any).mockResolvedValue({ success: true });

    render(<DiscussionBoard lessonId="l1" currentUserId="u2" initialComments={mockComments} />);
    
    const flagButton = screen.getByText('Mark as Solution');
    fireEvent.click(flagButton);

    await waitFor(() => {
      expect(commentActions.flagSolution).toHaveBeenCalledWith('1', 'l1');
      expect(screen.getByText('Solution')).toBeInTheDocument();
    });
  });
});
