// controllers/catalogController.test.js
const axios = require('axios');

// Mock axios before requiring catalogController
jest.mock('axios');

// Mock logger to avoid console output during tests
jest.mock('../utils/logger', () => ({
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
}));

// Now require catalogController after mocks are set up
const { triggerImport, getImportStatus } = require('./catalogController');

describe('CatalogController', () => {
    let mockReq;
    let mockRes;

    beforeEach(() => {
        jest.clearAllMocks();
        
        // Setup mock request and response objects
        mockReq = {
            headers: {
                'content-type': 'application/json',
                'authorization': 'Bearer test-token',
            },
            body: {},
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis(),
        };
    });

    describe('triggerImport', () => {
        it('should successfully proxy import request to saby-service', async () => {
            // Arrange
            const mockResponse = {
                status: 202,
                data: {
                    status: 'started',
                    message: 'Import started',
                },
            };

            axios.mockResolvedValue(mockResponse);

            // Act
            await triggerImport(mockReq, mockRes);

            // Assert
            expect(axios).toHaveBeenCalledWith({
                method: 'POST',
                url: expect.stringContaining('/api/catalog/import'),
                headers: expect.objectContaining({
                    'content-type': 'application/json',
                    'authorization': 'Bearer test-token',
                }),
                data: {},
                timeout: 10000,
            });
            expect(mockRes.status).toHaveBeenCalledWith(202);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'started',
                message: 'Import started',
            });
        });

        it('should return 409 when import is already in progress', async () => {
            // Arrange
            const mockError = {
                response: {
                    status: 409,
                    data: {
                        error: {
                            code: 'IMPORT_IN_PROGRESS',
                            message: 'Import is already running',
                        },
                    },
                },
            };

            axios.mockRejectedValue(mockError);

            // Act
            await triggerImport(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(409);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: {
                    code: 'IMPORT_IN_PROGRESS',
                    message: 'Import is already running',
                },
            });
        });

        it('should return 503 when saby-service is unavailable', async () => {
            // Arrange
            const mockError = {
                code: 'ECONNREFUSED',
                message: 'Connection refused',
            };

            axios.mockRejectedValue(mockError);

            // Act
            await triggerImport(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Catalog import service is currently unavailable. Please try again later.',
                },
            });
        });

        it('should return 500 for unexpected errors', async () => {
            // Arrange
            const mockError = new Error('Unexpected error');

            axios.mockRejectedValue(mockError);

            // Act
            await triggerImport(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An error occurred while triggering the catalog import.',
                },
            });
        });
    });

    describe('getImportStatus', () => {
        it('should successfully proxy status request to saby-service', async () => {
            // Arrange
            const mockResponse = {
                status: 200,
                data: {
                    status: 'completed',
                    categoriesCreated: 10,
                    categoriesUpdated: 5,
                    productsCreated: 50,
                    productsUpdated: 20,
                    startedAt: '2024-01-01T00:00:00Z',
                    completedAt: '2024-01-01T00:05:00Z',
                },
            };

            axios.mockResolvedValue(mockResponse);

            // Act
            await getImportStatus(mockReq, mockRes);

            // Assert
            expect(axios).toHaveBeenCalledWith({
                method: 'GET',
                url: expect.stringContaining('/api/catalog/import/status'),
                headers: expect.objectContaining({
                    'content-type': 'application/json',
                    'authorization': 'Bearer test-token',
                }),
                timeout: 5000,
            });
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                status: 'completed',
                categoriesCreated: 10,
                categoriesUpdated: 5,
                productsCreated: 50,
                productsUpdated: 20,
                startedAt: '2024-01-01T00:00:00Z',
                completedAt: '2024-01-01T00:05:00Z',
            });
        });

        it('should return 503 when saby-service is unavailable', async () => {
            // Arrange
            const mockError = {
                code: 'ENOTFOUND',
                message: 'Service not found',
            };

            axios.mockRejectedValue(mockError);

            // Act
            await getImportStatus(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(503);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Catalog import service is currently unavailable. Please try again later.',
                },
            });
        });

        it('should forward error responses from saby-service', async () => {
            // Arrange
            const mockError = {
                response: {
                    status: 500,
                    data: {
                        error: {
                            code: 'INTERNAL_ERROR',
                            message: 'Database connection failed',
                        },
                    },
                },
            };

            axios.mockRejectedValue(mockError);

            // Act
            await getImportStatus(mockReq, mockRes);

            // Assert
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'Database connection failed',
                },
            });
        });
    });
});
