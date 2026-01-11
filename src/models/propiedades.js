const mongoose = require('mongoose');
const Schema   = mongoose.Schema;

module.exports = function(db){
    const propiedadesSchema = new Schema({
        "nombre": { type: String, required: true }, // CORREGIDO: 'required'
        "descripcion": { type: String, required: true },

        "tipo":  { type: String, required: true }, // Venta, Arriendo, etc.
        
        "detalles":{
            // Usar Number permite buscar: "baños > 2"
            "baños": { type: Number, default: 0 }, 
            "habitaciones": { type: Number, default: 0 },
            "tipo_acuerdo": { type: String, required: true },
            "estado": { type: String } // Nuevo, Usado, etc.
        },

        "contacto": { type: String, required: true },

        // Definición explícita de array de strings (URLs de fotos)
        "fotos": { type: [String], default: [] },

        "tipo_moneda": { type: String, required: true }, // CLP, UF, USD
        
        // CORREGIDO: Number para poder ordenar por precio
        "price": { type: Number, required: true }, 
        
        // Si es un booleano (publicado SI/NO), usa Boolean
        "publicado": { type: Boolean, default: true }, 
        
        "venta": { type: String }, // Quizás esto es redundante con 'tipo'?

        "lugar": { type: String, required: true }, // Dirección calle

        "comuna":{ type: String, required: true },
        "provincia":{ type: String, required: true },
        "region":{ type: String, required: true },
        
        // CORREGIDO: Number para usarlo en lógica (como el índice del array de regiones)
        "region_numero":{ type: Number, required: true }, 

    }, { timestamps: true }); 

    // Es buena práctica retornar el modelo
    return db.model('Propiedades', propiedadesSchema, 'propiedades');
}