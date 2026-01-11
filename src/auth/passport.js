const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcrypt");
const { UserConnection } = require("../config/db/index");

// =========================================================================
// ESTRATEGIA EXCLUSIVA PARA ADMINISTRADORES
// =========================================================================

passport.use("local-login-admin", new LocalStrategy(
    { 
        usernameField: "username", // El admin usa 'username', no email
        passwordField: "password" 
    },
    async (username, password, done) => {
        try {
            await UserConnection.connect();
            const Admin = UserConnection.db.models.Admin;
            const Users = UserConnection.db.models.Users;

            // 1. Buscar en la colección de Admins
            // IMPORTANTE: .select('+password') es necesario porque en el modelo 
            // definimos select: false por seguridad.
            const adminData = await Admin.findOne({ username: username }).select('+password');

            if (!adminData) {
                return done(null, false, { message: "El usuario administrador no existe." });
            }

            // 2. Buscar el usuario "pivote" en la tabla Users
            // Esto es necesario porque Passport serializa el _id de esta tabla, no la de Admin.
            const userSession = await Users.findOne({ userId: adminData._id });

            if (!userSession) {
                return done(null, false, { message: "Error crítico: El usuario no tiene referencia en la tabla principal." });
            }

            // 3. Verificar Contraseña
            const match = await bcrypt.compare(password, adminData.password);

            if (match) {
                // Éxito: Retornamos el usuario de la tabla Users para la sesión
                return done(null, userSession, { message: "Bienvenido al Panel de Administración." });
            } else {
                return done(null, false, { message: "La contraseña es incorrecta." });
            }

        } catch (err) {
            console.error("Error crítico en login Admin:", err);
            return done(err, false, { message: "Error interno del servidor." });
        }
    }
));


// =========================================================================
// SERIALIZACIÓN DE SESIÓN (COOKIES)
// =========================================================================

// Guarda el ID del usuario en la cookie
passport.serializeUser((user, done) => {
    done(null, user._id);
});

// Recupera los datos del usuario usando el ID de la cookie
passport.deserializeUser(async (id, done) => {
    try {
        await UserConnection.connect();
        const Users = UserConnection.db.models.Users;
        
        const user = await Users.findById(id);
        
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

module.exports = passport;