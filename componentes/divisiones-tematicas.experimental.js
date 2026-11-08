"use strict";

// Banco de prueba aislado: no implementa modos globales ni guarda preferencias.
document.getElementById("prueba-divisiones").addEventListener("change", evento => {
  editorial.presentacionDivisiones = ["lectura", "estudio", "devocional"].includes(evento.target.value)
    ? evento.target.value : "lectura";
  // Solo reemplaza separadores: conserva el estado de los demás componentes.
  for (const nodo of document.querySelectorAll("#capitulo > .separador-titulo, #capitulo > .separador-banner")) {
    const datos = editorial.resources.find(r => r.resource_id === nodo.dataset.resourceId);
    nodo.replaceWith(editorial.dibujarDivision(datos));
  }
});
