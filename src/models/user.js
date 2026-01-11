const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

module.exports = function(db){

    // --- ADMIN SCHEMA ---
    const adminSchema = new Schema({
        username: { 
            type: String, 
            required: true, 
            unique: true, // EVITA duplicados
            trim: true    // Elimina espacios en blanco al inicio/final
        },
        password: { 
            type: String, 
            required: true,
            select: false // SEGURIDAD: No devuelve la pass en las consultas por defecto
        },
    }, { timestamps: true }); 

    // Verificamos si ya existe para evitar errores en re-conexiones
    // Cambié la colección a 'admins' (plural) por convención, pero 'admin' funciona.
    if (!db.models.Admin) {
        db.model('Admin', adminSchema, 'admin');
    }

    // --- USERS SCHEMA (Tabla pivote/relacional) ---
    const usersSchema = new Schema({
        role: { 
            type: String, 
            required: true,
            enum: ['ADMIN'] // Validar roles permitidos
        },
        userId: { 
            type: Schema.Types.ObjectId, 
            required: true,
            // IMPORTANTE: 'refPath' permite que este ID apunte a 
            // diferentes colecciones (Admin, Student, Teacher) dinámicamente.
            // Si no usas esto, el .populate() que tenías en otros archivos fallará.
            refPath: 'roleModel' 
        },
        // Campo auxiliar para ayudar a Mongoose a saber qué modelo poblar
        roleModel: {
            type: String,
            required: true,
            enum: ['Admin'] // Nombres exactos de tus modelos
        }
    }, { timestamps: true });

    if (!db.models.Users) {
        db.model('Users', usersSchema, 'users');
    }
}