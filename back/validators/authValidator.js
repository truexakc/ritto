const { body } = require('express-validator');

exports.registerValidation = [
    body('email').isEmail().withMessage('Введите корректный email'),
    body('password')
        .isLength({ min: 6 })
        .withMessage('Пароль должен содержать минимум 6 символов'),
];

exports.loginValidation = [
    body('email').isEmail().withMessage('Некорректный email'),
    body('password').notEmpty().withMessage('Пароль обязателен'),
];
