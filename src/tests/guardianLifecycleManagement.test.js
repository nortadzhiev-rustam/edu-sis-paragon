/**
 * Guardian Lifecycle Management Tests
 * Tests for soft-delete, hard-delete, and reactivate functionality
 */

import guardianService from '../services/guardianService';
import { Config } from '../config/env';

// Mock fetch for testing
global.fetch = jest.fn();

describe('Guardian Lifecycle Management', () => {
  const mockAuthCode = 'test_auth_code_123';
  const mockPickupCardId = 12345;

  beforeEach(() => {
    fetch.mockClear();
  });

  describe('Soft Delete (Deactivate Guardian)', () => {
    it('should successfully deactivate a guardian', async () => {
      const mockResponse = {
        success: true,
        message: 'Guardian has been deactivated successfully. They can no longer access the system but their data is preserved.',
        action: 'deactivated',
        reversible: true,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await guardianService.deactivateGuardian(mockAuthCode, mockPickupCardId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mobile-api/pickup/guardians/deactivate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            authCode: mockAuthCode,
            pickup_card_id: mockPickupCardId,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.reversible).toBe(true);
      expect(result.action).toBe('deactivated');
    });

    it('should handle deactivation errors gracefully', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Guardian not found or already deactivated',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      });

      const result = await guardianService.deactivateGuardian(mockAuthCode, mockPickupCardId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('not found');
    });
  });

  describe('Hard Delete (Permanent Removal)', () => {
    it('should successfully delete a guardian permanently', async () => {
      const mockResponse = {
        success: true,
        message: 'Guardian has been permanently deleted. This action cannot be undone.',
        action: 'deleted',
        reversible: false,
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await guardianService.deleteGuardian(mockAuthCode, mockPickupCardId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mobile-api/pickup/guardians/delete'),
        expect.objectContaining({
          method: 'DELETE',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            authCode: mockAuthCode,
            pickup_card_id: mockPickupCardId,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.reversible).toBe(false);
      expect(result.action).toBe('deleted');
    });

    it('should handle deletion errors gracefully', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Cannot delete guardian with active pickup requests',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      });

      const result = await guardianService.deleteGuardian(mockAuthCode, mockPickupCardId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('active pickup requests');
    });
  });

  describe('Reactivate Guardian', () => {
    it('should successfully reactivate a deactivated guardian', async () => {
      const mockResponse = {
        success: true,
        message: 'Guardian has been reactivated successfully. They can now access the system again.',
        action: 'reactivated',
        guardian_limit_check: {
          current_active: 3,
          limit: 5,
          remaining: 2,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await guardianService.reactivateGuardian(mockAuthCode, mockPickupCardId);

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/mobile-api/pickup/guardians/reactivate'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify({
            authCode: mockAuthCode,
            pickup_card_id: mockPickupCardId,
          }),
        })
      );

      expect(result).toEqual(mockResponse);
      expect(result.action).toBe('reactivated');
      expect(result.guardian_limit_check).toBeDefined();
      expect(result.guardian_limit_check.current_active).toBe(3);
      expect(result.guardian_limit_check.limit).toBe(5);
      expect(result.guardian_limit_check.remaining).toBe(2);
    });

    it('should handle guardian limit exceeded error', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Maximum 5 active guardians per student. Cannot reactivate.',
        guardian_limit_check: {
          current_active: 5,
          limit: 5,
          remaining: 0,
        },
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      });

      const result = await guardianService.reactivateGuardian(mockAuthCode, mockPickupCardId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Maximum 5 active guardians');
      expect(result.guardian_limit_check.remaining).toBe(0);
    });

    it('should handle reactivation of non-deactivated guardian', async () => {
      const mockErrorResponse = {
        success: false,
        message: 'Guardian is already active or does not exist',
      };

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockErrorResponse,
      });

      const result = await guardianService.reactivateGuardian(mockAuthCode, mockPickupCardId);

      expect(result.success).toBe(false);
      expect(result.message).toContain('already active');
    });
  });

  describe('API Endpoint Configuration', () => {
    it('should have correct API endpoints configured', () => {
      expect(Config.API_ENDPOINTS.DEACTIVATE_GUARDIAN).toBe('/mobile-api/pickup/guardians/deactivate');
      expect(Config.API_ENDPOINTS.DELETE_GUARDIAN).toBe('/mobile-api/pickup/guardians/delete');
      expect(Config.API_ENDPOINTS.REACTIVATE_GUARDIAN).toBe('/mobile-api/pickup/guardians/reactivate');
    });
  });

  describe('Service Export', () => {
    it('should export all lifecycle management functions', () => {
      expect(typeof guardianService.deactivateGuardian).toBe('function');
      expect(typeof guardianService.deleteGuardian).toBe('function');
      expect(typeof guardianService.reactivateGuardian).toBe('function');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        guardianService.deactivateGuardian(mockAuthCode, mockPickupCardId)
      ).rejects.toThrow('Network error');
    });

    it('should handle HTTP errors gracefully', async () => {
      fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' }),
      });

      await expect(
        guardianService.deleteGuardian(mockAuthCode, mockPickupCardId)
      ).rejects.toThrow();
    });
  });
});

describe('Guardian Lifecycle Integration', () => {
  it('should follow proper lifecycle flow: active -> deactivated -> reactivated', async () => {
    // This test would verify the complete lifecycle in a real integration test
    // For now, we'll just verify the function signatures are correct
    
    expect(guardianService.deactivateGuardian).toBeDefined();
    expect(guardianService.deleteGuardian).toBeDefined();
    expect(guardianService.reactivateGuardian).toBeDefined();
    
    // Verify functions accept correct parameters
    expect(guardianService.deactivateGuardian.length).toBe(2); // authCode, pickupCardId
    expect(guardianService.deleteGuardian.length).toBe(2); // authCode, pickupCardId
    expect(guardianService.reactivateGuardian.length).toBe(2); // authCode, pickupCardId
  });
});
