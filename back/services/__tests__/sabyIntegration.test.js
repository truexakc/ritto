const { mapPaymentMethod, formatDateTimeForSBIS } = require('../sabyIntegration');
const { getAddressJSON } = require('../addressService');
const axios = require('axios');

// Мокаем axios для тестирования
jest.mock('axios');

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

  describe('getAddressJSON', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return addressJSON and addressFull from Saby API on success', async () => {
      const mockAddress = 'Ярославль, Московский проспект, д. 12А';
      const mockResponse = {
        data: {
          addresses: [
            {
              addressJSON: '{"Address":"Ярославль, Московский проспект, д. 12А","Locality":"Ярославль","Coordinates":{"Lat":57.611,"Lon":39.881}}',
              addressFull: 'Ярославль, Московский проспект, д. 12А'
            }
          ]
        }
      };

      axios.get.mockResolvedValue(mockResponse);

      const result = await getAddressJSON(mockAddress);

      expect(result).toHaveProperty('addressJSON');
      expect(result).toHaveProperty('addressFull');
      expect(typeof result.addressJSON).toBe('string');
      expect(typeof result.addressFull).toBe('string');
      expect(result.addressJSON).toBe(mockResponse.data.addresses[0].addressJSON);
      expect(result.addressFull).toBe(mockResponse.data.addresses[0].addressFull);
    });

    it('should return fallback addressJSON and addressFull on API error', async () => {
      const mockAddress = 'Ярославль, Кондратово, Садовое кольцо, 14';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);

      expect(result).toHaveProperty('addressJSON');
      expect(result).toHaveProperty('addressFull');
      expect(typeof result.addressJSON).toBe('string');
      expect(typeof result.addressFull).toBe('string');
      expect(result.addressFull).toBe(mockAddress);
      
      // Проверяем, что addressJSON - валидный JSON
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON).toHaveProperty('Address');
      expect(parsedJSON.Address).toBe(mockAddress);
    });

    it('should extract Locality from address in fallback mode', async () => {
      const mockAddress = 'Ярославль, Кондратово, Садовое кольцо, 14';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);
      
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON).toHaveProperty('Locality');
      expect(parsedJSON.Locality).toBe('Ярославль');
    });

    it('should extract Locality from first part if it looks like a city', async () => {
      const mockAddress = 'Улица Ленина, 5';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);
      
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON).toHaveProperty('Address');
      expect(parsedJSON.Address).toBe(mockAddress);
      // Эвристика определит "Улица Ленина" как Locality (первая часть без цифр)
      expect(parsedJSON.Locality).toBe('Улица Ленина');
    });

    it('should not add Locality if address has only one part', async () => {
      const mockAddress = 'Тестовая улица';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);
      
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON).toHaveProperty('Address');
      expect(parsedJSON.Address).toBe(mockAddress);
      // Locality не должно быть, так как адрес состоит из одной части
      expect(parsedJSON.Locality).toBeUndefined();
    });

    it('should not add Locality if first part contains digits', async () => {
      const mockAddress = '123, Улица Ленина, 5';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);
      
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON).toHaveProperty('Address');
      // Locality не должно быть, так как первая часть содержит цифры
      expect(parsedJSON.Locality).toBeUndefined();
    });

    it('should handle empty response from API', async () => {
      const mockAddress = 'Тестовый адрес';
      
      axios.get.mockResolvedValue({
        data: {
          addresses: []
        }
      });

      const result = await getAddressJSON(mockAddress);

      // Должен использовать fallback
      expect(result).toHaveProperty('addressJSON');
      expect(result).toHaveProperty('addressFull');
      expect(result.addressFull).toBe(mockAddress);
      
      const parsedJSON = JSON.parse(result.addressJSON);
      expect(parsedJSON.Address).toBe(mockAddress);
    });

    it('should ensure addressJSON is always a string', async () => {
      const mockAddress = 'Москва, Тверская, 1';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);

      expect(typeof result.addressJSON).toBe('string');
      // Проверяем, что это валидный JSON
      expect(() => JSON.parse(result.addressJSON)).not.toThrow();
    });

    it('should ensure addressFull is always a string', async () => {
      const mockAddress = 'Санкт-Петербург, Невский проспект, 10';
      
      axios.get.mockRejectedValue(new Error('API Error'));

      const result = await getAddressJSON(mockAddress);

      expect(typeof result.addressFull).toBe('string');
      expect(result.addressFull.length).toBeGreaterThan(0);
    });
  });
});
