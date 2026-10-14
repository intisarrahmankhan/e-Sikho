import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NotesAndResources from '@/components/courses/NotesAndResources';
import * as resourceActions from '@/actions/resource';

vi.mock('@/actions/resource', () => ({
  addLessonResource: vi.fn(),
}));

describe('NotesAndResources UI Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state correctly', () => {
    render(<NotesAndResources moduleId="m1" currentUserId="u1" />);
    expect(screen.getByText('No notes found for this module yet. Be the first to share!')).toBeInTheDocument();
  });

  it('allows adding a new note', async () => {
    (resourceActions.addLessonResource as any).mockResolvedValue({ 
      success: true, 
      resource: { 
        _id: 'r1', 
        title: 'My Title', 
        content: 'My Content', 
        isPublic: true, 
        createdAt: new Date().toISOString() 
      } 
    });

    render(<NotesAndResources moduleId="m1" currentUserId="u1" />);
    
    const titleInput = screen.getByPlaceholderText('Note Title');
    const contentInput = screen.getByPlaceholderText('Type your study notes here...');
    const checkbox = screen.getByLabelText('Make public to community');
    const button = screen.getByText('Publish Note');

    fireEvent.change(titleInput, { target: { value: 'My Title' } });
    fireEvent.change(contentInput, { target: { value: 'My Content' } });
    fireEvent.click(checkbox);
    
    fireEvent.click(button);

    expect(screen.getByText('Saving...')).toBeInTheDocument();

    await waitFor(() => {
      expect(resourceActions.addLessonResource).toHaveBeenCalledWith({
        title: 'My Title',
        content: 'My Content',
        moduleId: 'm1',
        userId: 'u1',
        isPublic: true,
      });
      expect(screen.getByText('Note securely added and sanitized!')).toBeInTheDocument();
      expect(screen.getByText('My Title')).toBeInTheDocument();
      expect(screen.getByText('My Content')).toBeInTheDocument();
    });
  });
});
