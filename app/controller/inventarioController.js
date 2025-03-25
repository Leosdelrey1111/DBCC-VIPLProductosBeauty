const Inventario = require('../models/Inventario');
const mongoose = require('mongoose');

// Get all inventory items with enhanced error handling
exports.getInventario = async (req, res) => {
    try {
        const inventario = await Inventario.find().lean();
        
        if (!inventario || inventario.length === 0) {
            return res.status(404).json({ 
                success: false,
                message: "No se encontraron productos en el inventario" 
            });
        }

        // Format dates for display
        const inventarioFormateado = inventario.map(item => ({
            ...item,
            fechaCaducidadLote: item.fechaCaducidadLote ? item.fechaCaducidadLote.toISOString().split('T')[0] : ''
        }));

        res.status(200).json({
            success: true,
            data: inventarioFormateado
        });
    } catch (error) {
        console.error('Error en getInventario:', error);
        res.status(500).json({ 
            success: false,
            message: "Error al obtener el inventario",
            error: error.message 
        });
    }
};

// Create new inventory item with validation
exports.createInventario = async (req, res) => {
    try {
        // Validate required fields
        const requiredFields = [
            'loteCaja', 'nombreProducto', 'nombreProveedor',
            'cantidadCajasLote', 'stockExhibe', 'stockExhibeMin',
            'stockAlmacen', 'stockAlmacenMin', 'fechaCaducidadLote'
        ];
        
        const missingFields = requiredFields.filter(field => !req.body[field]);
        
        if (missingFields.length > 0) {
            return res.status(400).json({ 
                success: false,
                message: `Faltan campos requeridos: ${missingFields.join(', ')}` 
            });
        }

        // Validate date format
        const fechaCaducidad = new Date(req.body.fechaCaducidadLote);
        if (isNaN(fechaCaducidad.getTime())) {
            return res.status(400).json({
                success: false,
                message: "Formato de fecha no válido"
            });
        }

        // Create new inventory item
        const nuevoInventario = new Inventario({
            ...req.body,
            fechaCaducidadLote: fechaCaducidad
        });

        const inventarioGuardado = await nuevoInventario.save();

        res.status(201).json({
            success: true,
            message: "Inventario creado exitosamente",
            data: inventarioGuardado
        });
    } catch (error) {
        console.error('Error en createInventario:', error);
        res.status(500).json({
            success: false,
            message: "Error al crear el inventario",
            error: error.message
        });
    }
};

// Update inventory item
exports.actualizarInventario = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de inventario no válido"
            });
        }

        // Check if inventory exists
        const inventarioExistente = await Inventario.findById(id);
        if (!inventarioExistente) {
            return res.status(404).json({
                success: false,
                message: "Inventario no encontrado"
            });
        }

        // Prepare update data
        const updateData = { ...req.body };
        
        // Handle date conversion if present
        if (req.body.fechaCaducidadLote) {
            updateData.fechaCaducidadLote = new Date(req.body.fechaCaducidadLote);
            if (isNaN(updateData.fechaCaducidadLote.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Formato de fecha no válido"
                });
            }
        }

        const inventarioActualizado = await Inventario.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        );

        res.status(200).json({
            success: true,
            message: "Inventario actualizado exitosamente",
            data: inventarioActualizado
        });
    } catch (error) {
        console.error('Error en actualizarInventario:', error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar el inventario",
            error: error.message
        });
    }
};

// Delete inventory item
exports.eliminarInventario = async (req, res) => {
    try {
        const { id } = req.params;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de inventario no válido"
            });
        }

        const inventarioEliminado = await Inventario.findByIdAndDelete(id);
        
        if (!inventarioEliminado) {
            return res.status(404).json({
                success: false,
                message: "Inventario no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Inventario eliminado exitosamente",
            data: inventarioEliminado
        });
    } catch (error) {
        console.error('Error en eliminarInventario:', error);
        res.status(500).json({
            success: false,
            message: "Error al eliminar el inventario",
            error: error.message
        });
    }
};

// Update stock
exports.updateStockExhibe = async (req, res) => {
    try {
        const { id } = req.params;
        const { stockExhibe } = req.body;
        
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: "ID de inventario no válido"
            });
        }

        if (typeof stockExhibe !== 'number' || stockExhibe < 0) {
            return res.status(400).json({
                success: false,
                message: "Valor de stock no válido"
            });
        }

        const inventarioActualizado = await Inventario.findByIdAndUpdate(
            id,
            { stockExhibe },
            { new: true }
        );

        if (!inventarioActualizado) {
            return res.status(404).json({
                success: false,
                message: "Inventario no encontrado"
            });
        }

        res.status(200).json({
            success: true,
            message: "Stock actualizado exitosamente",
            data: inventarioActualizado
        });
    } catch (error) {
        console.error('Error en updateStockExhibe:', error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar el stock",
            error: error.message
        });
    }
};