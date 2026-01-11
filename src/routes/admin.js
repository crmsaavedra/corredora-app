const { Router } = require("express");
const router = Router();

// Importamos AMBOS controladores
const AdminController = require("../controllers/adminController");
const AuthController = require("../controllers/authController"); // <--- AGREGADO

const checkSession = require("../middlewares/check-session"); 

const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'ADMIN') {
        return next();
    }
    req.flash('error', 'Acceso denegado. Se requieren permisos de administrador.');
    res.redirect('/admin/login'); // Redirigir al login del admin si falla
};

// ============================================================
// 1. RUTAS PÚBLICAS (ACCESO LIBRE)
// ============================================================
// Estas rutas DEBEN ir ANTES del middleware de seguridad.
// Asumiendo que en app.js usas app.use('/admin', ...), 
// estas rutas quedarán como: /admin/login y /admin/registro

// Login
router.get("/login", AuthController.viewLoginAdmin);
router.post("/login", AuthController.loginAdmin);

// Registro
router.get("/registro", AuthController.viewRegisterAdmin);
router.post("/registro", AuthController.postRegisterAdmin);


// ============================================================
// 2. BARRERA DE SEGURIDAD (MIDDLEWARES)
// ============================================================
// A partir de esta línea, Express verifica sesión y rol.
router.use(checkSession, isAdmin);


// ============================================================
// 3. RUTAS PRIVADAS (SOLO ADMINS)
// ============================================================

/* Dashboard (/admin/panel) */
router.get("/panel", AdminController.panelAdmin);

/* Inicio Admin (/admin/inicio) - Opcional, si usas otra vista */
router.get("/inicio", AdminController.panelAdmin); 

/* Editar Propiedad */
router.get("/panel/:id", AdminController.editarPropiedad);
router.post("/panel/:id", AdminController.confirmarEdicionPropiedad);

/* Eliminar Propiedad */
router.post("/panel/:id/eliminar", AdminController.eliminarPropiedad);

/* Crear Propiedades */
router.get("/crear-propiedad", AdminController.crearPropiedades);
router.post("/crear-propiedad", AdminController.envioPropiedades);

module.exports = router;