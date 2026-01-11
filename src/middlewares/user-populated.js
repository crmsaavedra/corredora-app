const { UserConnection } = require('../config/db/index');

// --- FUNCIONES HELPER INDIVIDUALES ---

const userStudent = async (userId) => {
    try {
        await UserConnection.connect();
        const Student = UserConnection.db.models.Student;

        // CORRECCIÓN: 
        // 1. findById(userId) directo, sin objeto {_id: userId}.
        // 2. Sin callback (async/await puro).
        const student = await Student.findById(userId)
            .select({ "_id": 1, "username": 1, "email": 1, "team": 1, "role": 1 })
            .populate("team", { "_id": 1, "name": 1 })
            .lean();

        return student;
    } catch (error) {
        console.error("Error buscando Student:", error);
        return null;
    }
}

const userTeacher = async (userId) => {
    try {
        await UserConnection.connect();
        const Teacher = UserConnection.db.models.Teacher;

        const teacher = await Teacher.findById(userId)
            .select({ "_id": 1, "username": 1, "email": 1, "role": 1 })
            .populate("team", { "_id": 1, "name": 1 }) // Asumo que Teacher también tiene team, según tu código original
            .lean();

        return teacher;
    } catch (error) {
        console.error("Error buscando Teacher:", error);
        return null;
    }
}

const userAdmin = async (userId) => {
    try {
        await UserConnection.connect();
        const Admin = UserConnection.db.models.Admin;

        const user = await Admin.findById(userId)
            .select({ "_id": 1, "username": 1, "role": 1 })
            .lean();

        return user;
    } catch (error) {
        console.error("Error buscando Admin:", error);
        return null;
    }
}

// --- FUNCIONES DE LÓGICA DE NEGOCIO ---

async function userPopulated(id, role) {
    if (!id || !role) return null;

    let myUser = null;

    // Normalizamos el rol a mayúsculas para evitar errores de comparación
    const roleUpper = role.toUpperCase();

    if (roleUpper === 'STUDENT') myUser = await userStudent(id);
    else if (roleUpper === 'TEACHER') myUser = await userTeacher(id);
    else if (roleUpper === 'ADMIN') myUser = await userAdmin(id);

    return myUser;
}


// Esta función parece actuar como un Middleware o Helper para poblar res.locals
async function user(req, res) {
    // PROTECCIÓN: Si no hay usuario en sesión, no hacemos nada.
    // Evita el error "Cannot read property 'role' of undefined"
    if (!req.user || !req.user.userId) {
        res.locals.user = null;
        return;
    }

    const { role, userId } = req.user;
    const roleUpper = role ? role.toUpperCase() : '';

    let fullUser = null;

    if (roleUpper === 'STUDENT') fullUser = await userStudent(userId);
    else if (roleUpper === 'TEACHER') fullUser = await userTeacher(userId);
    else if (roleUpper === 'ADMIN') fullUser = await userAdmin(userId);

    // Asignamos el usuario completo a las variables locales de la respuesta
    res.locals.user = fullUser;
}

module.exports = { user, userPopulated };