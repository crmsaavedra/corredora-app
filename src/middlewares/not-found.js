const notFoundHandler = (req, res) => {
    // Renderiza la vista '404' (asumiendo que usas EJS/Pug/HBS)
    // y envía el código de estado correcto al navegador.
    res.status(404).render('404', { 
        url: req.originalUrl // Opcional: para mostrar qué URL falló
    });
};

module.exports = notFoundHandler;