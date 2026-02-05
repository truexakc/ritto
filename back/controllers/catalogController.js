const axios = require('axios');
const logger = require('../utils/logger');

// Get saby-service URL from environment or use default
const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';

/**
 * Proxy POST /api/catalog/import to saby-service
 */
const triggerImport = async (req, res) => {
    try {
        logger.log('📦 Proxying catalog import request to saby-service');
        
        const response = await axios({
            method: 'POST',
            url: `${SABY_SERVICE_URL}/api/catalog/import`,
            headers: {
                ...req.headers,
                host: undefined, // Remove host header to avoid conflicts
            },
            data: req.body,
            timeout: 10000, // 10 second timeout for the trigger request
        });

        logger.log('✅ Catalog import triggered successfully:', response.data);
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            logger.error('❌ Saby-service unavailable:', error.message);
            return res.status(503).json({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Catalog import service is currently unavailable. Please try again later.',
                },
            });
        }

        if (error.response) {
            // Forward the error response from saby-service
            logger.warn('⚠️ Saby-service returned error:', error.response.status, error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }

        logger.error('❌ Error proxying catalog import:', error.message);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while triggering the catalog import.',
            },
        });
    }
};

/**
 * Proxy GET /api/catalog/import/status to saby-service
 */
const getImportStatus = async (req, res) => {
    try {
        logger.log('📊 Proxying catalog import status request to saby-service');
        
        const response = await axios({
            method: 'GET',
            url: `${SABY_SERVICE_URL}/api/catalog/import/status`,
            headers: {
                ...req.headers,
                host: undefined, // Remove host header to avoid conflicts
            },
            timeout: 5000, // 5 second timeout for status request
        });

        logger.log('✅ Catalog import status retrieved successfully');
        res.status(response.status).json(response.data);
    } catch (error) {
        if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
            logger.error('❌ Saby-service unavailable:', error.message);
            return res.status(503).json({
                error: {
                    code: 'SERVICE_UNAVAILABLE',
                    message: 'Catalog import service is currently unavailable. Please try again later.',
                },
            });
        }

        if (error.response) {
            // Forward the error response from saby-service
            logger.warn('⚠️ Saby-service returned error:', error.response.status, error.response.data);
            return res.status(error.response.status).json(error.response.data);
        }

        logger.error('❌ Error proxying catalog import status:', error.message);
        res.status(500).json({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while retrieving the catalog import status.',
            },
        });
    }
};

module.exports = {
    triggerImport,
    getImportStatus,
};
