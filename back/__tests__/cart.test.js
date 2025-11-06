const request = require('supertest');
const { app, server } = require('../server');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

// Очищаем базу данных перед каждым тестом
beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Cart.deleteMany({});

    // Создаем тестового пользователя и продукт
    const user = await User.create({
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'password123',
    });

    await Product.create({
        _id: '64c72f9b9e15a0030f25a9c2',
        name: 'Test Product',
        price: 10.0,
        stock: 100,
        category: 'Test Category',
        description: 'This is a test product',
    });

    // Сохраняем токен пользователя
    userToken = await user.generateAuthToken();
});

// Закрываем сервер после выполнения всех тестов
afterAll(() => {
    if (server) {
        server.close();
    }
});

describe('Cart API', () => {
    it('should add a product to the cart', async () => {
        const res = await request(app)
            .post('/api/cart/add')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                productId: '64c72f9b9e15a0030f25a9c2',
                quantity: 1,
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('items');
    });

    it('should get the cart', async () => {
        const res = await request(app)
            .get('/api/cart')
            .set('Authorization', `Bearer ${userToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('items');
    });

    it('should remove a product from the cart', async () => {
        const res = await request(app)
            .post('/api/cart/remove')
            .set('Authorization', `Bearer ${userToken}`)
            .send({
                productId: '64c72f9b9e15a0030f25a9c2',
            });
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('items');
    });
});
