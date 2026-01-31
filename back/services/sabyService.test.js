// services/sabyService.test.js
const axios = require('axios');

// Mock axios before requiring sabyService
jest.mock('axios');

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

// Setup axios.create mock
const mockAxiosInstance = {
    post: jest.fn(),
    get: jest.fn(),
};

axios.create = jest.fn(() => mockAxiosInstance);
axios.get = jest.fn();

// Now require sabyService after mocks are set up
const sabyService = require('./sabyService');

describe('SabyService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('createOrder', () => {
        it('should successfully create an order with valid data', async () => {
            // Arrange
            const mockOrderData = {
                id: 123,
                customer_name: 'Иван Иванов',
                customer_phone: '+79991234567',
                customer_email: 'ivan@example.com',
                delivery_address: 'Москва, ул. Ленина, д. 10',
                is_pickup: false,
                payment_method: 'card',
                items: [
                    {
                        product_id: 1,
                        product_name: 'Суши сет',
                        quantity: 2,
                        unit_price: 500,
                    }
                ],
            };

            const mockResponse = {
                data: {
                    orderId: '550e8400-e29b-41d4-a716-446655440000',
                    externalId: 'SABY-12345',
                    status: 'created',
                    createdAt: '2024-01-31T15:04:05Z',
                    message: 'Order created successfully',
                }
            };

            mockAxiosInstance.post.mockResolvedValue(mockResponse);

            // Act
            const result = await sabyService.createOrder(mockOrderData);

            // Assert
            expect(result).toEqual(mockResponse.data);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
                product: 'delivery',
                customer: expect.objectContaining({
                    name: 'Иван Иванов',
                    phone: '+79991234567',
                }),
                nomenclatures: expect.arrayContaining([
                    expect.objectContaining({
                        name: 'Суши сет',
                        count: 2,
                        cost: 500,
                    })
                ]),
                delivery: expect.objectContaining({
                    isPickup: false,
                    paymentType: 'card',
                }),
            }));
        });

        it('should handle orders with minimal data', async () => {
            // Arrange
            const mockOrderData = {
                id: 456,
                customer_name: 'Test User',
                customer_phone: '+79999999999',
                total_amount: 1000,
            };

            const mockResponse = {
                data: {
                    orderId: 'test-order-id',
                    status: 'created',
                }
            };

            mockAxiosInstance.post.mockResolvedValue(mockResponse);

            // Act
            const result = await sabyService.createOrder(mockOrderData);

            // Assert
            expect(result).toEqual(mockResponse.data);
            expect(mockAxiosInstance.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
                nomenclatures: expect.arrayContaining([
                    expect.objectContaining({
                        externalId: 'default',
                        count: 1,
                        cost: 1000,
                    })
                ]),
            }));
        });

        it('should map payment types correctly', async () => {
            // Arrange
            const testCases = [
                { input: 'card', expected: 'card' },
                { input: 'credit_card', expected: 'card' },
                { input: 'online', expected: 'online' },
                { input: 'stripe', expected: 'online' },
                { input: 'cash', expected: 'cash' },
                { input: 'cash_on_delivery', expected: 'cash' },
                { input: 'unknown', expected: 'cash' },
            ];

            const mockResponse = {
                data: { orderId: 'test', status: 'created' }
            };

            mockAxiosInstance.post.mockResolvedValue(mockResponse);

            // Act & Assert
            for (const testCase of testCases) {
                const orderData = {
                    id: 1,
                    customer_name: 'Test',
                    customer_phone: '+79999999999',
                    payment_method: testCase.input,
                };

                await sabyService.createOrder(orderData);

                expect(mockAxiosInstance.post).toHaveBeenCalledWith('/orders', expect.objectContaining({
                    delivery: expect.objectContaining({
                        paymentType: testCase.expected,
                    }),
                }));
            }
        });

        it('should handle validation errors from SABY service', async () => {
            // Arrange
            const mockOrderData = {
                id: 789,
                customer_name: 'Test',
                customer_phone: 'invalid-phone',
            };

            const mockError = {
                response: {
                    status: 400,
                    data: {
                        error: {
                            code: 'VALIDATION_ERROR',
                            message: 'Invalid request payload',
                            details: [
                                {
                                    field: 'customer.phone',
                                    message: 'phone must be in E.164 format'
                                }
                            ]
                        }
                    }
                }
            };

            mockAxiosInstance.post.mockRejectedValue(mockError);

            // Act & Assert
            await expect(sabyService.createOrder(mockOrderData)).rejects.toThrow('SABY service error: Invalid request payload');
        });

        it('should handle service unavailable errors', async () => {
            // Arrange
            const mockOrderData = {
                id: 999,
                customer_name: 'Test',
                customer_phone: '+79999999999',
            };

            const mockError = {
                request: {},
                message: 'connect ECONNREFUSED 127.0.0.1:8080'
            };

            mockAxiosInstance.post.mockRejectedValue(mockError);

            // Act & Assert
            await expect(sabyService.createOrder(mockOrderData)).rejects.toThrow('SABY service unavailable');
        });

        it('should handle internal server errors', async () => {
            // Arrange
            const mockOrderData = {
                id: 111,
                customer_name: 'Test',
                customer_phone: '+79999999999',
            };

            const mockError = {
                response: {
                    status: 500,
                    data: {
                        error: {
                            code: 'INTERNAL_ERROR',
                            message: 'Internal server error'
                        }
                    }
                }
            };

            mockAxiosInstance.post.mockRejectedValue(mockError);

            // Act & Assert
            await expect(sabyService.createOrder(mockOrderData)).rejects.toThrow('SABY service error: Internal server error');
        });
    });

    describe('healthCheck', () => {
        it('should return true when service is healthy', async () => {
            // Arrange
            const mockResponse = {
                data: {
                    status: 'ok',
                    service: 'saby-service',
                    version: '1.0.0',
                }
            };

            axios.get = jest.fn().mockResolvedValue(mockResponse);

            // Act
            const result = await sabyService.healthCheck();

            // Assert
            expect(result).toBe(true);
            expect(axios.get).toHaveBeenCalledWith(
                expect.stringContaining('/health'),
                expect.objectContaining({ timeout: 5000 })
            );
        });

        it('should return false when service returns non-ok status', async () => {
            // Arrange
            const mockResponse = {
                data: {
                    status: 'degraded',
                }
            };

            axios.get = jest.fn().mockResolvedValue(mockResponse);

            // Act
            const result = await sabyService.healthCheck();

            // Assert
            expect(result).toBe(false);
        });

        it('should return false when service is unreachable', async () => {
            // Arrange
            axios.get = jest.fn().mockRejectedValue(new Error('ECONNREFUSED'));

            // Act
            const result = await sabyService.healthCheck();

            // Assert
            expect(result).toBe(false);
        });

        it('should handle timeout errors', async () => {
            // Arrange
            const timeoutError = new Error('timeout of 5000ms exceeded');
            timeoutError.code = 'ECONNABORTED';
            axios.get = jest.fn().mockRejectedValue(timeoutError);

            // Act
            const result = await sabyService.healthCheck();

            // Assert
            expect(result).toBe(false);
        });
    });

    describe('_mapNomenclatures', () => {
        it('should map order items correctly', () => {
            // Arrange
            const orderData = {
                items: [
                    {
                        product_id: 1,
                        product_name: 'Product 1',
                        quantity: 2,
                        unit_price: 100,
                        product_external_id: 'ext-1',
                    },
                    {
                        product_id: 2,
                        product_name: 'Product 2',
                        quantity: 1,
                        unit_price: 200,
                    }
                ]
            };

            // Act
            const result = sabyService._mapNomenclatures(orderData);

            // Assert
            expect(result).toHaveLength(2);
            expect(result[0]).toMatchObject({
                externalId: 'ext-1',
                id: 1,
                name: 'Product 1',
                count: 2,
                cost: 100,
            });
            expect(result[1]).toMatchObject({
                externalId: '2',
                id: 2,
                name: 'Product 2',
                count: 1,
                cost: 200,
            });
        });

        it('should return default nomenclature when no items provided', () => {
            // Arrange
            const orderData = {
                total_amount: 500,
            };

            // Act
            const result = sabyService._mapNomenclatures(orderData);

            // Assert
            expect(result).toHaveLength(1);
            expect(result[0]).toMatchObject({
                externalId: 'default',
                count: 1,
                cost: 500,
                name: 'Order',
            });
        });

        it('should handle items with modifiers', () => {
            // Arrange
            const orderData = {
                items: [
                    {
                        product_id: 1,
                        product_name: 'Pizza',
                        quantity: 1,
                        unit_price: 500,
                        modifiers: [
                            {
                                id: 10,
                                hierarchical_id: 100,
                                name: 'Extra Cheese',
                                count: 1,
                                cost: 50,
                            }
                        ]
                    }
                ]
            };

            // Act
            const result = sabyService._mapNomenclatures(orderData);

            // Assert
            expect(result[0].modifiers).toHaveLength(1);
            expect(result[0].modifiers[0]).toMatchObject({
                id: 10,
                hierarchicalId: 100,
                name: 'Extra Cheese',
                count: 1,
                cost: 50,
            });
        });
    });

    describe('_mapPaymentType', () => {
        it('should map various payment types correctly', () => {
            // Test cases
            const testCases = [
                { input: 'card', expected: 'card' },
                { input: 'CARD', expected: 'card' },
                { input: 'credit_card', expected: 'card' },
                { input: 'online', expected: 'online' },
                { input: 'stripe', expected: 'online' },
                { input: 'cash', expected: 'cash' },
                { input: 'cash_on_delivery', expected: 'cash' },
                { input: null, expected: 'cash' },
                { input: undefined, expected: 'cash' },
                { input: 'unknown_type', expected: 'cash' },
            ];

            testCases.forEach(({ input, expected }) => {
                const result = sabyService._mapPaymentType(input);
                expect(result).toBe(expected);
            });
        });
    });
});
