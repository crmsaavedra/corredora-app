const { Router } = require("express");
const router = Router();

const IndexController = require("../controllers/indexController");
const AuthController = require("../controllers/authController");

/* ============================
   RUTAS PÚBLICAS
   ============================ */

/* Inicio y Detalles */
router.get("/", IndexController.index);
router.get("/propiedad/:id", IndexController.propiedad);

/* Landings Informativas */
router.get("/personas", IndexController.landingUser);
router.get("/equipos", IndexController.landingTeam);

/* ============================
   PERFILES PÚBLICOS (Faltaban)
   ============================ */
// Estas funciones existían en tu IndexController pero no tenían ruta.
// Asegúrate de que los parámetros (:UserId, :TeamId) coincidan con lo que usas en el controlador.
router.get("/perfil/usuario/:UserId", IndexController.viewStudentProfile);
router.get("/perfil/equipo/:TeamId", IndexController.viewTeamProfile);

/* ============================
   CERRAR SESIÓN
   ============================ */
router.get("/logout", IndexController.logout);

module.exports = router;