"use strict";

/** Referencias informativas: no hay enlaces ni acciones de navegación. */
function dibujarReferenciasCruzadas(datos) {
  const crear = (tipo, clase, texto) => {
    const nodo = document.createElement(tipo);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };
  const caja = crear("aside", "referencias-cruzadas");
  caja.dataset.resourceId = datos.resource_id;
  caja.setAttribute("aria-label", datos.titulo || datos.origen.referencia);
  if (datos.titulo) caja.append(crear("h3", "", datos.titulo));
  caja.append(crear("p", "referencias-cruzadas-origen", datos.origen.referencia));
  caja.append(crear("p", "referencias-cruzadas-aviso", datos.aviso_revision));
  const lista = crear("ul", "referencias-cruzadas-lista");
  for (const referencia of datos.referencias) {
    const item = crear("li");
    item.append(crear("p", "referencias-cruzadas-referencia", referencia.referencia),
      crear("p", "referencias-cruzadas-relacion", referencia.relacion));
    lista.append(item);
  }
  caja.append(lista);
  return caja;
}
