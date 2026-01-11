const bcrypt = require('bcrypt');
const passport = require('passport');
const fs = require("fs").promises; // Usamos la versión Promesa de FS
const path = require("path");
const { v4: uuidv4 } = require("uuid");

const { UserConnection, PropiedadesConnection } = require('../config/db/index');
const divisionTerritorial = require('../../public/divisionTerritorialChile.json');

class AdminController {

    static async panelAdmin(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;

            // .lean() es excelente para rendimiento si solo vas a leer
            const propiedades = await Propiedades.find({}).lean();
            res.render("view-admin", { "propiedades": propiedades });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error del servidor");
        }
    }

    static async editarPropiedad(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;

            const { id } = req.params;

            if (!id || id === "undefined") {
                return res.json({ "msg": "ID inválido" });
            }

            // CORRECCIÓN: Sin callback
            const propiedad = await Propiedades.findById(id).lean();

            if (!propiedad) return res.status(404).send("Propiedad no encontrada");

            res.render("editarPropiedad", { "propiedad": propiedad, "divisionTerritorial": divisionTerritorial });
        } catch (error) {
            console.error(error);
            res.status(500).send("Error al cargar propiedad");
        }
    }

    static async confirmarEdicionPropiedad(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;

            const data = req.body;

            // OPTIMIZACIÓN: Reemplazo del bucle for por un .find() más limpio
            // Nota: data.region viene como string o numero? Aseguramos comparacion
            const regionObj = divisionTerritorial.regiones.find((r, index) => index == (data.region - 1));
            const regionNombre = regionObj ? regionObj.region.nombre : "Desconocida";

            await Propiedades.findOneAndUpdate(
                { _id: data._id },
                {
                    $set: {
                        "nombre": data.nombre,
                        "descripcion": data.descripcion,
                        "tipo": data.tipo,
                        "detalles": {
                            "baños": data.detalles.baños,
                            "habitaciones": data.detalles.habitaciones,
                            "tipo_acuerdo": data.detalles.tipo_acuerdo,
                            "estado": data.detalles.estado,
                        },
                        "contacto": data.contacto,
                        "tipo_moneda": data.tipo_moneda,
                        "price": data.price,
                        "lugar": data.lugar,
                        "comuna": data.comuna,
                        "provincia": data.provincia,
                        "region": regionNombre,
                        "region_numero": data.region,
                    },
                }
            );

            res.json({ msg: "Propiedad actualizada" });
        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error al actualizar" });
        }
    }

    static async eliminarPropiedad(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;
            const data = req.body;

            // 1. Obtener la propiedad para saber qué fotos borrar
            const propiedad = await Propiedades.findById(data._id).lean();

            if (!propiedad) return res.json({ msg: "Propiedad no encontrada" });

            // 2. Eliminar de la BD
            await Propiedades.findOneAndDelete({ _id: data._id });

            // 3. Eliminar fotos del sistema de archivos de forma segura
            if (propiedad.fotos && propiedad.fotos.length > 0) {
                // Usamos Promise.all para borrar todas en paralelo y esperar a que termine
                await Promise.all(propiedad.fotos.map(async (fotoPath) => {
                    try {
                        // Limpieza de ruta: asumo que guardas algo como "/static/..."
                        const relativePath = fotoPath.replace("static", ""); 
                        // Usar path.join es más seguro que concatenar
                        const fullPath = path.join(global.dir, relativePath);
                        
                        await fs.unlink(fullPath);
                        console.log('File deleted:', fullPath);
                    } catch (err) {
                        // Si falla borrar una foto (ej. no existe), no detenemos el proceso, solo logueamos
                        console.warn(`No se pudo borrar el archivo: ${fotoPath}`, err.message);
                    }
                }));
                
                // Opcional: Borrar la carpeta contenedora si quedó vacía
                try {
                     const folderPath = path.join(global.dir, 'propiedades', data._id);
                     await fs.rmdir(folderPath).catch(() => {}); // Ignora error si no está vacía o no existe
                } catch (e) {}
            }

            res.json({ msg: "Propiedad eliminada" });

        } catch (error) {
            console.error(error);
            res.status(500).json({ msg: "Error al eliminar" });
        }
    }

    static async crearPropiedades(req, res) {
        // Renderiza la vista, no necesita conexión a DB a menos que valides sesión aquí
        res.render("crearPropiedades", { divisionTerritorial: divisionTerritorial });
    }

    static async envioPropiedades(req, res) {
        try {
            await PropiedadesConnection.connect();
            const Propiedades = PropiedadesConnection.db.models.Propiedades;
            const data = req.body;

            const regionObj = divisionTerritorial.regiones.find((r, index) => index == (data.region - 1));
            const regionNombre = regionObj ? regionObj.region.nombre : "Desconocida";

            const nuevaPropiedad = new Propiedades({
                nombre: data.nombre,
                descripcion: data.descripcion,
                tipo: data.tipo,
                detalles: {
                    baños: data.detalles.baños,
                    habitaciones: data.detalles.habitaciones,
                    tipo_acuerdo: data.detalles.tipo_acuerdo,
                    estado: data.detalles.estado,
                },
                contacto: data.contacto,
                tipo_moneda: data.tipo_moneda,
                price: data.price,
                lugar: data.lugar,
                comuna: data.comuna,
                provincia: data.provincia,
                region: regionNombre,
                region_numero: data.region,
                fotos: [] // Inicializamos vacío
            });

            // --- MANEJO DE IMÁGENES REFACTORIZADO ---
            const fotosPaths = [];
            
            // Directorio base para esta propiedad
            const propDir = path.join(global.dir, 'propiedades', nuevaPropiedad._id.toString());

            // mkdir con recursive: true crea toda la ruta si no existe y NO da error si ya existe
            await fs.mkdir(propDir, { recursive: true });

            if (data.fotos && Array.isArray(data.fotos)) {
                for (const foto of data.fotos) {
                    const fileId = uuidv4();
                    const fileName = `${fileId}.${foto.ext}`;
                    const filePath = path.join(propDir, fileName);
                    
                    // Convertir Base64 a Buffer nativo (más eficiente)
                    // Asumimos formato "data:image/png;base64,....."
                    const base64Data = foto.file.split(';base64,').pop();
                    
                    await fs.writeFile(filePath, base64Data, { encoding: 'base64' });
                    
                    // Guardamos la ruta pública (URL)
                    fotosPaths.push(`/static/propiedades/${nuevaPropiedad._id}/${fileName}`);
                }
            }

            nuevaPropiedad.fotos = fotosPaths;
            await nuevaPropiedad.save();

            res.json({ msg: "Propiedad creada" });

        } catch (error) {
            console.error("Error creando propiedad:", error);
            res.status(500).json({ msg: "Error al crear propiedad" });
        }
    }

    // --- ADMIN AUTH ---

    // IMPORTANTE: Agregar 'next' a los argumentos para que Passport funcione bien
    static loginAdmin(req, res, next) {
        const { email, password } = req.body;

        if (!email || !password) {
            req.flash('error', 'Rellena todos los datos');
            // return res.redirect('/loginAdmin'); 
            return res.status(400).send("Faltan datos"); 
        }

        passport.authenticate('local-login-admin', (err, user, info) => {
            if (err) {
                req.flash('error', info ? info.message : 'Error interno');
                return next(err); // Pasamos el error a Express
            }

            if (!user) {
                req.flash('error', info ? info.message : 'Usuario no encontrado');
                // return res.redirect('/loginAdmin');
                return res.status(401).send("Auth fallida");
            }

            req.logIn(user, (err) => {
                if (err) {
                    req.flash('error', 'Error al iniciar sesión');
                    return next(err);
                }
                // Login exitoso
                return res.redirect('/admin/inicio'); // Asegúrate que esta ruta exista
            });
        })(req, res, next);
    }

    static async postRegisterAdmin(req, res) {
        try {
            await UserConnection.connect();
            const Admin = UserConnection.db.models.Admin;
            const Users = UserConnection.db.models.Users;
            const { username, password } = req.body;

            // CORRECCIÓN: exists devuelve una promesa, no usa callback
            const existingAdmin = await Admin.exists({ username: username });
            
            if (existingAdmin) {
                req.flash("error", "Este admin ya existe");
                return res.redirect('/registroAdmin');
            }

            const hashedPassword = await bcrypt.hash(password, 10);

            const newAdmin = new Admin({
                username: username,
                password: hashedPassword
            });
            
            // Primero guardamos el Admin para tener su ID
            const savedAdmin = await newAdmin.save();

            const newUser = new Users({
                role: 'ADMIN',
                userId: savedAdmin._id
            });

            await newUser.save();

            return res.redirect('/');

        } catch (error) {
            console.error(error);
            res.redirect('/error');
        }
    }
}

module.exports = AdminController;