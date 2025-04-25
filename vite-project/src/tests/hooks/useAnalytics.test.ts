import { renderHook, act } from '@testing-library/react';
import { useAnalytics } from '../../hooks/useAnalytics';
import { analytics } from '../../services/supabase';

// Mock the Supabase analytics service
jest.mock('../../services/supabase', () => ({
  analytics: {
    trackVisit: jest.fn(),
    trackClick: jest.fn(),
  },
}));

describe('useAnalytics', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    // Mock sessionStorage
    Storage.prototype.getItem = jest.fn(() => 'test-visitor-id');
  });

  it('should track initial visit on mount', () => {
    renderHook(() => useAnalytics());

    expect(analytics.trackVisit).toHaveBeenCalledTimes(1);
    expect(analytics.trackVisit).toHaveBeenCalledWith(
      expect.objectContaining({
        entryPage: '/',
        userAgent: expect.any(String),
        sessionId: expect.any(String),
      })
    );
  });

  it('should track click events', async () => {
    // Render the hook
    renderHook(() => useAnalytics());

    // Simulate a click event
    const mockElement = document.createElement('button');
    mockElement.id = 'test-button';
    mockElement.className = 'test-class';
    mockElement.textContent = 'Test Button';

    await act(async () => {
      const clickEvent = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        clientX: 100,
        clientY: 200,
      });
      Object.defineProperty(clickEvent, 'target', { value: mockElement });
      document.dispatchEvent(clickEvent);
    });

    expect(analytics.trackClick).toHaveBeenCalledTimes(1);
    expect(analytics.trackClick).toHaveBeenCalledWith(
      expect.objectContaining({
        elementId: 'test-button',
        elementClass: 'test-class',
        elementText: 'Test Button',
        xPosition: 100,
        yPosition: 200,
      })
    );
  });

  it('should handle click tracking errors gracefully', async () => {
    // Mock console.error to prevent error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Mock trackClick to throw an error
    (analytics.trackClick as jest.Mock).mockRejectedValueOnce(new Error('Test error'));

    renderHook(() => useAnalytics());

    // Simulate a click event
    await act(async () => {
      document.dispatchEvent(new MouseEvent('click'));
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to track click:', expect.any(Error));
    consoleSpy.mockRestore();
  });
}); 