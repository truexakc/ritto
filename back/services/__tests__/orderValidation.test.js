/**
 * Order Validation Tests
 * Tests for validateOrderData and isValidPhoneFormat functions
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6
 */

const { validateOrderData, isValidPhoneFormat } = require('../orderValidation');

describe('Order Validation Service', () => {
  describe('isValidPhoneFormat', () => {
    it('should accept valid phone numbers starting with +', () => {
      expect(isValidPhoneFormat('+79991234567')).toBe(true);
      expect(isValidPhoneFormat('+1234567890')).toBe(true);
      expect(isValidPhoneFormat('+123')).toBe(true);
    });

    it('should reject phone numbers not starting with +', () => {
      expect(isValidPhoneFormat('79991234567')).toBe(false);
      expect(isValidPhoneFormat('89991234567')).toBe(false);
    });

    it('should reject phone numbers with non-digit characters', () => {
      expect(isValidPhoneFormat('+7999-123-45-67')).toBe(false);
      expect(isValidPhoneFormat('+7 999 123 45 67')).toBe(false);
      expect(isValidPhoneFormat('+7(999)1234567')).toBe(false);
    });

    it('should reject empty or invalid inputs', () => {
      expect(isValidPhoneFormat('')).toBe(false);
      expect(isValidPhoneFormat(null)).toBe(false);
      expect(isValidPhoneFormat(undefined)).toBe(false);
      expect(isValidPhoneFormat(123)).toBe(false);
    });
  });

  describe('validateOrderData', () => {
    it('should validate a correct order with delivery', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'delivery',
        delivery_address: 'ул. Тестовая, д. 1',
        items: [
          { product_id: 1, nomNumber: '00001', quantity: 2 }
        ]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate a correct order with pickup', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'pickup',
        items: [
          { product_id: 1, nomNumber: '00001', quantity: 1 }
        ]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject order without phone', () => {
      const orderData = {
        delivery_method: 'delivery',
        delivery_address: 'Test address',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Phone is required'
      });
    });

    it('should reject order with invalid phone format', () => {
      const orderData = {
        phone: '89991234567',
        delivery_method: 'delivery',
        delivery_address: 'Test address',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'phone',
        message: 'Phone must start with + and contain only digits'
      });
    });

    it('should reject order without delivery_method', () => {
      const orderData = {
        phone: '+79991234567',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'delivery_method',
        message: 'Delivery method is required'
      });
    });

    it('should reject order without delivery_address when delivery_method is delivery', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'delivery',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'delivery_address',
        message: 'Delivery address is required for delivery method'
      });
    });

    it('should not require delivery_address when delivery_method is pickup', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'pickup',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject order without items', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'pickup'
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items',
        message: 'Items array is required'
      });
    });

    it('should reject order with empty items array', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'pickup',
        items: []
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'items',
        message: 'Order must contain at least one item'
      });
    });

    it('should reject order with items missing nomNumber', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'pickup',
        items: [
          { product_id: 1, quantity: 2 }
        ]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => 
        e.field === 'items' && e.message.includes('missing nomNumber')
      )).toBe(true);
    });

    it('should report multiple validation errors', () => {
      const orderData = {
        delivery_method: 'delivery',
        items: []
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });

    it('should reject invalid delivery_method values', () => {
      const orderData = {
        phone: '+79991234567',
        delivery_method: 'invalid',
        items: [{ product_id: 1, nomNumber: '00001', quantity: 1 }]
      };

      const result = validateOrderData(orderData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'delivery_method',
        message: 'Delivery method must be "delivery" or "pickup"'
      });
    });
  });
});
