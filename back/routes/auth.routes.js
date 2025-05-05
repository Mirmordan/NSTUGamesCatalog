// routes/auth.routes.js
//                                                                  -- Зависимости
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
//                                                          -- Регистрация и авторизация --

// POST /api/auth/register 
router.post('/register', authController.register);

// POST /api/auth/login
router.post('/login', authController.login);

//                                                                    Экспорт
module.exports = router;