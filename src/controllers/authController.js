const bcrypt = require('bcrypt');
const passport = require('passport');
const { UserConnection } = require('../config/db/index');

class AuthController {

    // ==========================================
    //  VISTAS (GET)
    // ==========================================

    /**
     * Renderiza la vista de Login.
     * Si ya está logueado, lo manda al panel.
     */
    static viewLoginAdmin(req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/admin/inicio');
        }
        // Renderiza 'loginAdmin.ejs'
        res.render('loginAdmin');
    }

    /**
     * Renderiza la vista de Registro de Admin.
     * Si ya está logueado, lo manda al panel.
     */
    static viewRegisterAdmin(req, res) {
        if (req.isAuthenticated()) {
            return res.redirect('/admin/inicio');
        }

        // Si en el POST usas req.flash('username', ...), aquí lo recuperas
        // para que el campo no se borre si hubo un error.
        const prevUsername = req.flash('username')[0] || "";

        res.render('registroAdmin', {
            username: prevUsername
        });
    }


    // ==========================================
    //  LÓGICA (POST)
    // ==========================================

    /**
     * Procesa el Login de administradores.
     */
    static loginAdmin(req, res, next) {
        const { username, password } = req.body;

        if (!username || !password) {
            req.flash('error', 'Rellena todos los datos');
            return res.redirect('/admin/login');
        }

        passport.authenticate('local-login-admin', (err, user, info) => {
            if (err) {
                req.flash('error', info ? info.message : 'Error interno');
                return next(err); 
            }

            if (!user) {
                req.flash('error', info ? info.message : 'Credenciales incorrectas');
                return res.redirect('/admin/login');
            }

            req.logIn(user, (err) => {
                if (err) {
                    req.flash('error', 'Error al crear la sesión');
                    return next(err);
                }
                
                return res.redirect('/admin/inicio'); 
            });
            
        })(req, res, next);
    }

    /**
     * Procesa el Registro de un nuevo Admin.
     */
    static async postRegisterAdmin(req, res) {
        try {
            await UserConnection.connect();
            const Admin = UserConnection.db.models.Admin;
            const Users = UserConnection.db.models.Users;

            const { username, password } = req.body;

            const adminExists = await Admin.exists({ username: username });

            if (adminExists) {
                req.flash("error", "Este admin ya existe");
                // Guardamos el usuario intentado para repoblar el form en el GET
                req.flash("username", username); 
                return res.redirect('/admin/registro');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAdmin = new Admin({ 
                username: username,
                password: hashedPassword
            });
            
            const savedAdmin = await newAdmin.save();

            const newUser = new Users({
                role: 'ADMIN',
                roleModel: 'Admin',
                userId: savedAdmin._id
            });

            await newUser.save();

            req.flash("success", "Administrador registrado correctamente. Por favor inicia sesión.");
            return res.redirect('/admin/login'); // Mejor redirigir al login que al home

        } catch (error) {
            console.error("Error en registro admin:", error);
            req.flash("error", "Ocurrió un error inesperado");
            res.redirect('/admin/registro'); // Redirigir al registro en caso de error, no a /error
        }
    }
}

module.exports = AuthController;