const mongoose = require('mongoose');
const chalk = require("chalk");
const { USERS_URI, PROPIEDADES_URI } = require('./config');

// Opciones base para Mongoose 6+
const optionsMongoose = {
    // autoIndex: false, // Recomendado en producción para rendimiento
    // maxPoolSize: 10, // Ajustar según carga
};

class UserConnection {
    // Usamos campos estáticos modernos
    static db = null;
    static connectionPromise = null;

    static async connect() {
        // 1. Si ya hay conexión establecida, retornarla.
        if (this.db) return this.db;

        // 2. Si ya hay una conexión EN PROCESO, retornar esa misma promesa
        // (Esto arregla la condición de carrera)
        if (this.connectionPromise) return this.connectionPromise;

        // 3. Crear la promesa de conexión
        this.connectionPromise = (async () => {
            try {
                // mongoose.createConnection devuelve una instancia inmediatamente, 
                // pero .asPromise() asegura que esperamos a que esté lista.
                const connection = await mongoose.createConnection(USERS_URI, optionsMongoose).asPromise();

                // Cargar modelos
                require('../../models/user')(connection);

                this.db = connection;
                console.log(chalk.green("✔ Conectado a base de datos: Usuarios"));
                return this.db;
            } catch (error) {
                // Limpiamos la promesa para permitir reintentos si falla
                this.connectionPromise = null;
                console.error(chalk.red("✘ Error conectando a Usuarios:"), error);
                // IMPORTANTE: Lanzar el error para que la app sepa que falló
                throw error; 
            }
        })();

        return this.connectionPromise;
    }
}

class PropiedadesConnection {
    static db = null;
    static connectionPromise = null;

    static async connect() {
        if (this.db) return this.db;
        if (this.connectionPromise) return this.connectionPromise;

        this.connectionPromise = (async () => {
            try {
                const connection = await mongoose.createConnection(PROPIEDADES_URI, optionsMongoose).asPromise();

                // Cargar modelos
                require('../../models/propiedades')(connection);

                this.db = connection;
                console.log(chalk.green("✔ Conectado a base de datos: Propiedades"));
                return this.db;
            } catch (error) {
                this.connectionPromise = null;
                console.error(chalk.red("✘ Error conectando a Propiedades:"), error);
                throw error;
            }
        })();

        return this.connectionPromise;
    }
}

module.exports = { UserConnection, PropiedadesConnection };