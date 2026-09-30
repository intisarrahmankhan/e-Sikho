import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import PaginatedUsersList from '../PaginatedUsersList';
import * as usersActions from '@/actions/users';

vi.mock('@/actions/users', () => ({
  getPaginatedUsers: vi.fn(),
}));

vi.mock('@/actions/admin', () => ({
  updateUserRole: vi.fn(),
  toggleUserSuspend: vi.fn(),
}));

describe('PaginatedUsersList Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially and then displays users', async () => {
    const mockUsers = [
      { id: '1', name: 'John Doe', email: 'john@example.com', role: 'STUDENT', status: 'APPROVED' },
    ];
    
    // @ts-ignore
    usersActions.getPaginatedUsers.mockResolvedValue({ users: mockUsers, total: 1 });

    render(<PaginatedUsersList />);
    
    // Should show loading text initially
    expect(screen.getByText('Loading users...')).toBeDefined();

    // Wait for the mock data to populate the table
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeDefined();
    });
    
    // Ensure data is displayed properly
    expect(screen.getByText('john@example.com')).toBeDefined();
    expect(screen.getByText('Promote to Instructor')).toBeDefined();
    
    // Check pagination footer
    expect(screen.getByText(/Showing/)).toBeDefined();
  });

  it('handles empty state when no users are found', async () => {
    // @ts-ignore
    usersActions.getPaginatedUsers.mockResolvedValue({ users: [], total: 0 });

    render(<PaginatedUsersList />);

    await waitFor(() => {
      expect(screen.getByText('No matching users found.')).toBeDefined();
    });
  });
});
