// routes/authRoutes.js
const express = require('express');
const authController = require('../controller/authController');
const router = express.Router();

// Rutas existentes
router.post('/login', authController.login);
router.post('/register', authController.register);

// Nuevas rutas para gestionar usuarios
router.get('/users', authController.getUsers); // Obtener todos los usuarios
router.put('/users/:id', authController.updateUser); // Actualizar un usuario
router.delete('/users/:id', authController.deleteUser); // Eliminar un usuario

module.exports = router;