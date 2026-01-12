require('dotenv').config();
const path = require('path');
const express = require('express');
const flash = require('express-flash');
const session = require('express-session');
const MongoDbStore = require('connect-mongodb-session')(session);
const passport = require('passport');
const cors = require('cors');
const morgan = require('morgan');
const expressLayout = require('express-ejs-layouts');

// Inicializar App
const app = express();
app.enable('trust proxy');

// --- 1. CONFIGURACIÓN DE BASE DE DATOS (Sin Globals) ---
const DB_HOST = process.env.MONGO_HOST || 'localhost';
const DB_NAME = process.env.MONGO_DB_NAME || 'ImpulsaCiencia';
const DB_USER = process.env.MONGO_USER;
const DB_PASSWORD = process.env.MONGO_PASSWORD;
const DB_PORT = process.env.MONGO_PORT || 27017;

let MONGO_URI;

console.log(process.env.MONGO_USER);

if (process.env.MONGO_USER && process.env.MONGO_USER !== '0') {
    // Modo Producción / Atlas
    MONGO_URI = `mongodb+srv://${DB_USER}:${DB_PASSWORD}@${DB_HOST}/${DB_NAME}?retryWrites=true&appName=ImpulsaCiencia`;
} 
else {

    // Modo Local
    MONGO_URI = `mongodb://${DB_HOST}:${DB_PORT}/${DB_NAME}`;
}

// Exportamos la URI en app.locals por si alguna vista la necesita
app.locals.dbUri = MONGO_URI;


// --- 2. MIDDLEWARES BÁSICOS ---
// Límite alto para permitir subida de imágenes en base64 (Mantenido en 500mb)
app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors());
app.use(flash());


// --- 3. LOGGING (Morgan) ---
const morganMode = process.env.MODE === 'PRODUCTION' ? 'combined' : 'dev';
app.use(morgan(morganMode));


// --- 4. CONFIGURACIÓN DE SESIONES ---
const mongoStore = new MongoDbStore({
    uri: MONGO_URI,
    collection: 'sessions',
    expires: 1000 * 60 * 60 * 24 * 14 // 2 semanas
});

mongoStore.on('error', function(error) {
    console.error("Error en MongoDbStore de sesiones:", error);
});

app.use(session({
    secret: process.env.COOKIE_SECRET || 'mi_secreto_super_seguro',
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: { 
        maxAge: 1000 * 60 * 60 * 24 * 365, // 1 Año
        httpOnly: true,
        secure: process.env.MODE === 'PRODUCTION' // Solo HTTPS en producción
    }
}));


// --- 5. AUTENTICACIÓN (Passport) ---
require('./auth/passport'); 

app.use(passport.initialize());
app.use(passport.session());


// --- 6. VIEW ENGINE & LAYOUTS ---
app.set('views', path.join(__dirname, 'templates/views'));
app.set('view engine', 'ejs');

app.use(expressLayout);
app.set('layout', path.join(__dirname, 'templates/layouts/default'));
app.set('layout extractScripts', true);
app.set('layout extractStyles', true);


// --- 7. ARCHIVOS ESTÁTICOS ---
app.use("/static", express.static(path.join(__dirname, '../public')));


// --- 8. VARIABLES GLOBALES PARA VISTAS ---
const { setCustomSessionInfo } = require('./middlewares/session-info');
app.use(setCustomSessionInfo);

app.locals.link = process.env.HOST;
app.locals.port = process.env.PORT || 3000;


// --- 9. RUTAS ---
const indexRoutes = require('./routes/index');
const adminRoutes = require('./routes/admin');

app.use('/', indexRoutes); 
app.use('/admin', adminRoutes); 


// --- 10. MANEJO DE ERRORES (404 y 500) ---

// Middleware 404 (Página no encontrada)
// Se ejecuta solo si ninguna ruta anterior coincidió
app.use((req, res, next) => {
    // Renderizamos la vista '404.ejs' creada anteriormente.
    // layout: false asegura que se use el HTML completo de la vista 404
    res.status(404).render('404', { layout: false, pageTitle: 'Página no encontrada' });
});

// Middleware de Error General (500)
// Captura errores lanzados con next(err) o crashes síncronos
app.use((err, req, res, next) => {
    console.error("🔥 ERROR DEL SERVIDOR:", err.stack);
    
    // Renderizamos la vista '500.ejs'.
    // Importante: layout: false para evitar que el layout intente cargar datos que podrían no existir por el error.
    res.status(500).render('500', { 
        layout: false,
        pageTitle: 'Error del Servidor',
        error: process.env.MODE === 'DEV' ? err : {} // En producción no mostramos el stack al usuario
    });
});

module.exports = app;