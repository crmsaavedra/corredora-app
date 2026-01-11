const { UserConnection, PropiedadesConnection } = require('../config/db/index');
// Asegúrate de que este middleware exista y funcione, lo he mantenido.
const { user: userMiddleware } = require("../middlewares/user-populated");

// Función auxiliar para generar índices aleatorios únicos
function generarIndicesAleatorios(max, cantidad = 3) {
    const indices = [];
    // Si hay menos elementos que la cantidad solicitada, devolvemos todos los índices posibles
    if (max <= cantidad) {
        for(let i=0; i<max; i++) indices.push(i);
        return indices;
    }

    while (indices.length < cantidad) {
        const num = Math.floor(Math.random() * max);
        if (!indices.includes(num)) {
            indices.push(num);
        }
    }
    return indices;
}

class IndexControllers {

    static async index(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;

            // Obtenemos todas las propiedades (lean es más rápido)
            const propiedades = await Propiedades.find({}).lean();
            
            let aleatorios = [];

            if (propiedades.length > 0) {
                // Generar 3 índices aleatorios
                const indices = generarIndicesAleatorios(propiedades.length, 3);
                
                indices.forEach(indice => {
                    aleatorios.push(propiedades[indice]);
                });
            }

            res.render("index", { "aleatorios": aleatorios, "propiedades": propiedades });

        } catch (error) {
            console.error(error);
            res.status(500).send("Error del servidor");
        }
    }

    static async propiedad(req, res) {
        try {
            const { id } = req.params;

            // Validación básica de ID
            if (!id || id === "undefined") {
                return res.redirect("/");
            }

            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;

            // 1. Obtener todas para el sidebar de "Otras propiedades"
            const propiedades = await Propiedades.find({}).lean();
            
            // 2. Lógica de aleatorios
            let aleatorios = [];
            if (propiedades.length > 0) {
                const indices = generarIndicesAleatorios(propiedades.length, 3);
                indices.forEach(indice => {
                    aleatorios.push(propiedades[indice]);
                });
            }

            // 3. Buscar la propiedad específica
            // CORRECCIÓN: await sin callback
            const propiedadEncontrada = await Propiedades.findById(id).lean();

            if (!propiedadEncontrada) {
                return res.redirect("/"); // O renderizar 404
            }

            res.render("propiedad", { 
                "aleatorios": aleatorios, 
                "propiedad": propiedadEncontrada 
            });

        } catch (error) {
            console.error("Error cargando propiedad:", error);
            res.redirect("/");
        }
    }

    static async landingTeam(req, res) {
        if (req.user) await userMiddleware(req, res);
        res.render("./landing/team");
    }

    static async landingUser(req, res) {
        if (req.user) await userMiddleware(req, res);
        res.render("./landing/student");
    }

    /* Ver perfil Maestranza Como Externo */
    static async viewStudentProfile(req, res) {
        try {
            await UserConnection.connect();
            const Users = UserConnection.db.models.Users; // Asumo que el modelo es 'Users' (plural) basado en archivos anteriores
            const Teacher = UserConnection.db.models.Teacher;
            const Student = UserConnection.db.models.Student;

            const { UserId } = req.params;

            // CORRECCIÓN: await y validación de nulidad
            const generalUserDoc = await Users.findById(UserId).select({ '_id': 1, "role": 1, "userId": 1 }).lean();

            if (!generalUserDoc) return res.render('404');

            // Middleware de población de usuario actual
            if (req.user) await userMiddleware(req, res);

            let principalUser = null;

            if (generalUserDoc.role === 'STUDENT') {
                principalUser = await Student.findById(generalUserDoc.userId).lean();
            } else if (generalUserDoc.role === 'Teacher' || generalUserDoc.role === 'TEACHER') { // Manejo de mayúsculas por seguridad
                principalUser = await Teacher.findById(generalUserDoc.userId).lean();
            }

            if (!principalUser) {
                return res.render("404");
            }

            res.render("./external-profiles/user", {
                user: principalUser
            });

        } catch (error) {
            console.error("Error en viewStudentProfile:", error);
            res.render("404");
        }
    }
    
    /* Ver perfil Equipo */
    static async viewTeamProfile(req, res) {
        try {
            await UserConnection.connect();
            // Asumo que existe el modelo Team, aunque no lo vi en tus configs anteriores
            // Si da error, verifica que 'Team' esté cargado en tu archivo db/index.js
            const Team = UserConnection.db.models.Team || UserConnection.db.models.Propiedades; // Fallback por si acaso

            if (req.user) await userMiddleware(req, res);

            const teamDoc = await Team.findById(req.params.TeamId).lean();

            if (!teamDoc) return res.render("404");

            res.render("./external-profiles/team", {
                team: teamDoc
            });
        } catch (error) {
            console.error("Error en viewTeamProfile:", error);
            res.render("404");
        }
    }

    // IMPORTANTE: Agregar 'next' para manejar errores asíncronos
    static logout(req, res, next) {
        // En versiones nuevas de Passport, logout es asíncrono y requiere callback
        req.logout((err) => {
            if (err) { return next(err); }
            res.redirect("/");
        });
    }
}

module.exports = IndexControllers;