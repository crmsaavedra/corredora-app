// Aseguramos que las variables de entorno estén cargadas primero
require('dotenv').config(); 

const http = require('http');
const path = require('path');
const chalk = require("chalk");

// Importamos la app de Express
const app = require('./app');

// --- 1. CONFIGURACIÓN ROBUSTA DE RUTAS ---
// Definimos global.dir ANTES de iniciar nada, usando path.join para compatibilidad (Windows/Linux)
// Esto apunta a la carpeta 'public' en la raíz de tu proyecto
global.dir = path.join(__dirname, '../public');

// --- 2. CONFIGURACIÓN DEL PUERTO ---
// Fallback a 3000 si no existe la variable de entorno
const APP_PORT = process.env.PORT || 3000;

// Crear servidor HTTP
const httpServer = http.createServer(app);

// --- 3. INICIAR SERVIDOR ---
httpServer.listen(APP_PORT, () => {
    // Quitamos 'async' porque no hay 'await' aquí dentro.
    
    // Solo limpiamos consola en desarrollo para no perder logs de errores en producción
    if (process.env.MODE === 'DEVELOPMENT') {
        console.clear();
    }

    // Logs informativos con estilo
    console.log(
        chalk.hex('#FFCA76').inverse(` CorredoraAburtoPropiedades-WebApp `),
        `is running.`
    );
    
    console.log(
        `Maintained by`,
        chalk.hex('#6969ff').inverse(` Cristian Saavedra `),
        `👨‍💻`
    );

    console.log(
        `Copyright ©️`,
        String(new Date().getFullYear()), // getUTCFullYear() es innecesario para el año actual visual
        chalk.hex('#6969ff').inverse(` Corredora Aburto Propiedades `),
        `, All rights reserved.`
    );

    console.log(
        chalk.inverse.white(` Status: `),
        `Server running 🚀 on port`,
        chalk.hex('#82FFF8').inverse(` ${APP_PORT} `)
    );
    
    console.log(chalk.gray(`Public Dir: ${global.dir}`));
});

// Manejo de errores a nivel de servidor (ej: puerto ocupado)
httpServer.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
        console.error(chalk.red.bold(`✘ El puerto ${APP_PORT} está ocupado.`));
    } else {
        console.error(chalk.red.bold(`✘ Error fatal en el servidor:`), error);
    }
    process.exit(1);
});