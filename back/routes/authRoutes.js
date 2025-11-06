const express = require('express');
const {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    getMe
} = require('../controllers/authController');

const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');
const {registerValidation, loginValidation} = require("../validators/authValidator");
const {validationResult} = require("express-validator");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 5,
    message: { message: 'Слишком много попыток входа. Попробуйте позже.' }
});

router.post('/register', registerValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    registerUser(req, res, next);
});

router.post('/login', loginLimiter, loginValidation, (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    loginUser(req, res, next);
});
router.post('/refresh', refreshToken);
router.post('/logout', logoutUser);

// 👇 новый маршрут
router.get('/me', protect, getMe);

module.exports = router;
