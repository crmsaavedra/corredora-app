// Carga las variables del archivo .env si no están cargadas
require('dotenv').config(); 

const BASE_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const MONGO_QUERY = process.env.MONGO_QUERY || '?retryWrites=true&w=majority';

// Validación: Evita que la app arranque si falta la configuración crítica
if (!process.env.MONGO_URI) {
    console.warn("⚠ ADVERTENCIA: No se ha definido MONGO_URI en las variables de entorno. Usando localhost por defecto.");
}

module.exports = {
    // Usamos una función constructora de strings limpia
    USERS_URI: `${BASE_URI}/users${MONGO_QUERY}`,
    PROPIEDADES_URI: `${BASE_URI}/propiedades${MONGO_QUERY}`
};