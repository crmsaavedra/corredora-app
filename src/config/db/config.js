// Carga las variables del archivo .env si no están cargadas
require('dotenv').config(); 
const DB_HOST = process.env.MONGO_HOST || 'localhost';
const DB_NAME = process.env.MONGO_DB_NAME || 'ImpulsaCiencia';
const DB_USER = process.env.MONGO_USER;
const DB_PASSWORD = process.env.MONGO_PASSWORD;
const DB_PORT = process.env.MONGO_PORT || 27017;

let MONGO_URI;
const MONGO_QUERY = process.env.MONGO_QUERY || '?retryWrites=true';

if (process.env.MONGO_USER && process.env.MONGO_USER !== '0') {
    // Modo Producción / Atlas
    MONGO_URI = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&appName=ImpulsaCiencia`;
} else {
    // Modo Local
    MONGO_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

// Validación: Evita que la app arranque si falta la configuración crítica
if (!MONGO_URI) {
    console.warn("⚠ ADVERTENCIA: No se ha definido MONGO_URI en las variables de entorno. Usando localhost por defecto.");
}

module.exports = {
    // Usamos una función constructora de strings limpia
    USERS_URI: `${MONGO_URI}/users${MONGO_QUERY}`,
    PROPIEDADES_URI: `${MONGO_URI}/propiedades${MONGO_QUERY}`
};