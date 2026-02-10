const { mapPaymentMethod, formatDateTimeForSBIS } = require('../sabyIntegration');

describe('Saby Integration - Checkpoint Tests', () => {
  describe('mapPaymentMethod', () => {
    it('should map card payment method correctly', () => {
      expect(mapPaymentMethod('card')).toBe('card');
    });

    it('should map cash payment method correctly', () => {
      expect(mapPaymentMethod('cash')).toBe('cash');
    });

    it('should map online payment method to card', () => {
      expect(mapPaymentMethod('online')).toBe('card');
    });

    it('should default to card for unknown payment methods', () => {
      expect(mapPaymentMethod('unknown')).toBe('card');
      expect(mapPaymentMethod(null)).toBe('card');
      expect(mapPaymentMethod(undefined)).toBe('card');
    });
  });

  describe('formatDateTimeForSBIS', () => {
    it('should format date in correct format "гггг-мм-дд чч:мм:сс"', () => {
      const testDate = new Date('2024-02-10T15:30:45');
      const formatted = formatDateTimeForSBIS(testDate);
      
      // Should match format: YYYY-MM-DD HH:MM:SS
      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
    });

    it('should add 24 hours to the provided date', () => {
      const testDate = new Date('2024-02-10T15:30:00');
      const formatted = formatDateTimeForSBIS(testDate);
      
      // Expected date should be 2024-02-11 15:30:00
      expect(formatted).toBe('2024-02-11 15:30:00');
    });

    it('should handle month/year boundaries correctly', () => {
      const testDate = new Date('2024-12-31T23:59:59');
      const formatted = formatDateTimeForSBIS(testDate);
      
      // Should roll over to next year
      expect(formatted).toBe('2025-01-01 23:59:59');
    });
  });
});
