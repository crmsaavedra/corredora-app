const checkSession = (req, res, next) => {
    // req.isAuthenticated() es el método estándar de Passport 
    // para verificar si la sesión es válida y está activa.
    if (req.isAuthenticated()) {
        return next();
    }
    
    // Opcional: Podrías guardar la URL a la que intentaban ir para 
    // redirigirlos allí después de loguearse (returnTo).
    // req.session.returnTo = req.originalUrl; 

    res.redirect('/');
};

module.exports = checkSession;