module.exports = {
  apps : [{
    name: "aburto-propiedades",
    
    // 1. Reemplazo de "nodemon ./src/index.js":
    // PM2 ejecuta el script directamente y se encarga de revivirlo si cae.
    script: "./src/index.js",

    // 2. Reemplazo de "env-cmd -f ./src/config/app.env":
    // PM2 tiene una propiedad nativa para leer archivos .env específicos
    env_file: "./src/config/app.env",

    // Opcional: Si quieres que se reinicie al detectar cambios (como nodemon)
    // En producción se recomienda 'false', pero si estás probando ponlo en 'true'.
    watch: false,

    // Configuración robusta (lo que vimos antes)
    max_memory_restart: '1G',
    autorestart: true,
    
    // Variables extra que tengan prioridad sobre el archivo
    env: {
      NODE_ENV: "production"
    }
  }]
};