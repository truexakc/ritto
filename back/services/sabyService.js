// services/sabyService.js
const axios = require('axios');
const logger = require('../utils/logger');

const SABY_SERVICE_URL = process.env.SABY_SERVICE_URL || 'http://saby-service:8080';

/**
 * Service for interacting with the SABY Go microservice
 */
class SabyService {
    constructor() {
        this.client = axios.create({
            baseURL: `${SABY_SERVICE_URL}/api/v1`,
            timeout: 35000, // 35 seconds - longer than Go service timeout (30s)
            headers: {
                'Content-Type': 'application/json',
            }
        });
    }

    /**
     * Creates an order in the SABY system via the Go microservice
     * @param {Object} orderData - Order data from Node.js backend
     * @returns {Promise<Object>} Order response from SABY service
     * @throws {Error} If order creation fails
     */
    async createOrder(orderData) {
        try {
            logger.log('📦 Creating order in SABY:', orderData.id);
            
            // Map Node.js order data to SABY API format
            const sabyRequest = {
                product: 'delivery',
                pointId: orderData.point_id || 176, // Default point ID
                comment: orderData.comment || '',
                customer: {
                    externalId: orderData.customer_id ? String(orderData.customer_id) : undefined,
                    name: orderData.customer_name || orderData.name || '',
                    lastname: orderData.customer_lastname || '',
                    patronymic: orderData.customer_patronymic || '',
                    email: orderData.customer_email || orderData.email || '',
                    phone: orderData.customer_phone || orderData.phone || '',
                },
                datetime: orderData.delivery_datetime || new Date().toISOString(),
                promocode: orderData.promocode || '',
                promocodeV2: orderData.promocode_v2 || '',
                nomenclatures: this._mapNomenclatures(orderData),
                delivery: {
                    isPickup: orderData.is_pickup || false,
                    addressJSON: orderData.address_json || '',
                    addressFull: orderData.delivery_address || orderData.address || '',
                    persons: orderData.persons || 1,
                    district: orderData.district || 0,
                    changeAmount: orderData.change_amount || 0,
                    paymentType: this._mapPaymentType(orderData.payment_method),
                    shopURL: orderData.shop_url || '',
                    successURL: orderData.success_url || '',
                    errorURL: orderData.error_url || '',
                },
            };

            const response = await this.client.post('/orders', sabyRequest);

            logger.log('✅ Order created in SABY:', response.data);
            return response.data;
        } catch (error) {
            return this._handleError(error, 'create order');
        }
    }

    /**
     * Maps order items to SABY nomenclatures format
     * @param {Object} orderData - Order data
     * @returns {Array} Array of nomenclatures
     * @private
     */
    _mapNomenclatures(orderData) {
        const items = orderData.items || orderData.order_items || [];
        
        if (!Array.isArray(items) || items.length === 0) {
            // Return a default nomenclature if no items provided
            return [{
                externalId: 'default',
                count: 1,
                cost: orderData.total_amount || 0,
                name: 'Order',
                priceListId: 108, // Default price list ID
            }];
        }

        return items.map(item => ({
            externalId: item.product_external_id || item.external_id || String(item.product_id || item.id),
            id: item.product_id || item.id || 0,
            nomNumber: item.nom_number || '',
            count: item.quantity || 1,
            cost: parseFloat(item.unit_price || item.price || 0),
            name: item.product_name || item.name || '',
            modifiers: this._mapModifiers(item.modifiers),
            priceListId: item.price_list_id || 108, // Default price list ID
            hierarchicalId: item.hierarchical_id || 0,
            serialNumbers: item.serial_numbers || [],
        }));
    }

    /**
     * Maps modifiers to SABY format
     * @param {Array} modifiers - Modifiers array
     * @returns {Array} Mapped modifiers
     * @private
     */
    _mapModifiers(modifiers) {
        if (!Array.isArray(modifiers) || modifiers.length === 0) {
            return [];
        }

        return modifiers.map(mod => ({
            id: mod.id || 0,
            hierarchicalId: mod.hierarchical_id || 0,
            count: mod.count || 1,
            cost: parseFloat(mod.cost || 0),
            name: mod.name || '',
        }));
    }

    /**
     * Maps Node.js payment method to SABY payment type
     * @param {string} paymentMethod - Payment method from Node.js
     * @returns {string} SABY payment type (card, online, cash)
     * @private
     */
    _mapPaymentType(paymentMethod) {
        const method = (paymentMethod || 'cash').toLowerCase();
        
        // Map various payment method names to SABY types
        const mapping = {
            'card': 'card',
            'credit_card': 'card',
            'debit_card': 'card',
            'online': 'online',
            'stripe': 'online',
            'payment_online': 'online',
            'cash': 'cash',
            'cash_on_delivery': 'cash',
        };

        return mapping[method] || 'cash';
    }

    /**
     * Handles errors from SABY service
     * @param {Error} error - Error object
     * @param {string} operation - Operation description
     * @throws {Error} Formatted error
     * @private
     */
    _handleError(error, operation) {
        if (error.response) {
            // SABY service returned an error response
            const errorData = error.response.data;
            const errorMessage = errorData?.error?.message || errorData?.message || 'Unknown error';
            const errorCode = errorData?.error?.code || 'UNKNOWN_ERROR';
            
            logger.error(`❌ SABY service error (${operation}):`, {
                status: error.response.status,
                code: errorCode,
                message: errorMessage,
                details: errorData?.error?.details || []
            });

            const err = new Error(`SABY service error: ${errorMessage}`);
            err.statusCode = error.response.status;
            err.code = errorCode;
            err.details = errorData?.error?.details || [];
            throw err;
        } else if (error.request) {
            // Request was made but no response received
            logger.error(`❌ Failed to connect to SABY service (${operation}):`, error.message);
            
            const err = new Error(`SABY service unavailable: ${error.message}`);
            err.statusCode = 503;
            err.code = 'SERVICE_UNAVAILABLE';
            throw err;
        } else {
            // Something else happened
            logger.error(`❌ Error in SABY service client (${operation}):`, error.message);
            
            const err = new Error(`SABY service client error: ${error.message}`);
            err.statusCode = 500;
            err.code = 'CLIENT_ERROR';
            throw err;
        }
    }

    /**
     * Checks the health of the SABY service
     * @returns {Promise<boolean>} True if service is healthy, false otherwise
     */
    async healthCheck() {
        try {
            const response = await axios.get(`${SABY_SERVICE_URL}/health`, {
                timeout: 5000
            });
            
            const isHealthy = response.data.status === 'ok';
            
            if (isHealthy) {
                logger.log('✅ SABY service is healthy');
            } else {
                logger.warn('⚠️ SABY service health check returned non-ok status:', response.data);
            }
            
            return isHealthy;
        } catch (error) {
            logger.error('❌ SABY service health check failed:', error.message);
            return false;
        }
    }
}

// Export singleton instance
module.exports = new SabyService();
