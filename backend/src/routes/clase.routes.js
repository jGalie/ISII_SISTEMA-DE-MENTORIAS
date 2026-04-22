const { Router } = require('express');

/**
 * Capa de rutas para el recurso clase.
 *
 * Su responsabilidad es vincular cada verbo HTTP con el metodo del controller
 * correspondiente. No valida reglas de negocio ni accede a datos, porque esas
 * tareas pertenecen a capas posteriores.
 */
function crearRutasClase({ claseController }) {
  const router = Router();

  // Se mantiene una API REST clara: listar, obtener, crear, actualizar y borrar
  // clases a partir del mismo recurso base /clases.
  router.get('/', claseController.listar);
  router.get('/:id', claseController.obtenerPorId);
  router.post('/', claseController.crear);
  router.put('/:id', claseController.actualizar);
  router.delete('/:id', claseController.eliminar);

  return router;
}

module.exports = {
  crearRutasClase,
};
