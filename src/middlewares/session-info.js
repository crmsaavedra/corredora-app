// Quitamos el 'async'. Es una operación síncrona simple.
function setCustomSessionInfo(req, res, next) {
    // Pasa la sesión a todas las vistas
    res.locals.session = req.session;
    
    // Pasa el usuario a todas las vistas. 
    // Si no hay usuario, asignamos null explícitamente para evitar 'undefined'
    res.locals.user = req.user || null;

    next();
};

module.exports = { setCustomSessionInfo };