const User = require('../models/User'); // Asegúrate de que la ruta sea correcta
const bcrypt = require('bcryptjs'); // Añade esta línea al inicio del archivo

exports.login = async (req, res) => {
    console.log("🔹 Datos recibidos en el backend:", req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        console.log("⚠️ Falta email o password");
        return res.status(400).json({ message: 'Email y contraseña son obligatorios.' });
    }

    try {
        const user = await User.findOne({ email });
        console.log("🔹 Usuario encontrado:", user);

        if (!user) {
            console.log("⚠️ Usuario no encontrado en la base de datos.");
            return res.status(400).json({ message: 'Usuario no encontrado' });
        }

        if (!user.password) {
            console.log("⚠️ El usuario no tiene contraseña almacenada.");
            return res.status(400).json({ message: 'Error en la base de datos: contraseña no definida' });
        }

        const isMatch = await user.comparePassword(password);
        console.log("🔹 ¿Contraseña correcta?", isMatch);

        if (!isMatch) {
            console.log("⚠️ Contraseña incorrecta.");
            return res.status(400).json({ message: 'Contraseña incorrecta' });
        }

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            user: { email: user.email, role: user.role }
        });

    } catch (error) {
        console.error("🚨 Error en el servidor:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

exports.register = async (req, res) => {
    console.log("🔹 Datos recibidos para registro:", req.body);
  
    const { email, password, role } = req.body;
  
    if (!email || !password || !role) {
        console.log("⚠️ Faltan datos para el registro.");
        return res.status(400).json({ message: 'Email, contraseña y rol son obligatorios.' });
    }
  
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("⚠️ Usuario ya registrado.");
            return res.status(400).json({ message: 'El usuario ya está registrado.' });
        }
  
        // Hash de la contraseña antes de guardarla
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
  
        const newUser = new User({ email, password: hashedPassword, role });
        await newUser.save();
  
        console.log("✅ Usuario registrado con éxito:", newUser.email);
        res.status(201).json({ message: 'Usuario registrado con éxito', user: { email: newUser.email, role: newUser.role } });
  
    } catch (error) {
        console.error("🚨 Error en el servidor:", error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
  };
  
  // Obtener todos los usuarios
exports.getUsers = async (req, res) => {
    try {
      const users = await User.find({}, { password: 0 }); // Excluir la contraseña
      console.log("🔹 Usuarios obtenidos:", users);
      res.status(200).json(users);
    } catch (error) {
      console.error("🚨 Error al obtener usuarios:", error);
      res.status(500).json({ message: 'Error al obtener usuarios' });
    }
  };
  
  // Eliminar un usuario
  exports.deleteUser = async (req, res) => {
    const { id } = req.params;
  
    try {
        const user = await User.findByIdAndDelete(id);
        if (!user) {
            console.log("⚠️ Usuario no encontrado.");
            return res.status(404).json({ 
                success: false, 
                message: 'Usuario no encontrado' 
            });
        }
  
        console.log("✅ Usuario eliminado:", user.email);
        res.status(200).json({ 
            success: true, 
            message: 'Usuario eliminado con éxito',
            data: { id: user._id }
        });
    } catch (error) {
        console.error("🚨 Error al eliminar usuario:", error);
        res.status(500).json({ 
            success: false, 
            message: 'Error al eliminar usuario',
            error: error.message 
        });
    }
};

  // authController.js - Método updateUser
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const { email, password, role } = req.body;

  try {
      // Verificar si el usuario existe
      const user = await User.findById(id);
      if (!user) {
          return res.status(404).json({ 
              success: false, 
              message: 'Usuario no encontrado' 
          });
      }

      // Preparar datos a actualizar
      const updateData = { email, role };

      // Si se proporcionó una nueva contraseña, hashearla
      if (password && password.length >= 6) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(password, salt);
          updateData.password = hashedPassword;
      }

      // Actualizar el usuario
      const updatedUser = await User.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
      ).select('-password'); // Excluir la contraseña de la respuesta

      res.status(200).json({ 
          success: true, 
          message: 'Usuario actualizado con éxito',
          data: updatedUser
      });

  } catch (error) {
      console.error("Error al actualizar usuario:", error);
      
      // Manejar errores de validación
      if (error.name === 'ValidationError') {
          return res.status(400).json({ 
              success: false, 
              message: 'Error de validación',
              errors: Object.values(error.errors).map(e => e.message) 
          });
      }
      
      // Manejar error de correo duplicado
      if (error.code === 11000) {
          return res.status(400).json({ 
              success: false, 
              message: 'El correo electrónico ya está en uso' 
          });
      }

      res.status(500).json({ 
          success: false, 
          message: 'Error en el servidor al actualizar usuario' 
      });
  }
};