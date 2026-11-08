"use strict";

function dibujarComparacionBiblica(datos) {
  const crear = (tipo, clase, texto) => {
    const nodo = document.createElement(tipo);
    if (clase) nodo.className = clase;
    if (texto !== undefined) nodo.textContent = texto;
    return nodo;
  };
  const caja = crear("aside", "comparacion-biblica");
  caja.dataset.resourceId = datos.resource_id;
  caja.setAttribute("aria-label", datos.titulo);
  caja.append(crear("h3", "", datos.titulo), crear("p", "comparacion-biblica-aviso", datos.aviso_revision));
  const elementos = crear("div", "comparacion-biblica-elementos");
  for (const elemento of datos.elementos) {
    const columna = crear("section", "comparacion-biblica-elemento");
    columna.setAttribute("aria-label", elemento.encabezado);
    columna.append(crear("h4", "", elemento.encabezado));
    const observaciones = crear("div", "comparacion-biblica-observaciones");
    observaciones.append(crear("h5", "", datos.etiquetas.observaciones));
    const lista = crear("ul");
    for (const texto of elemento.observaciones) lista.append(crear("li", "", texto));
    observaciones.append(lista);
    const explicacion = crear("div", "comparacion-biblica-explicacion");
    explicacion.append(crear("h5", "", datos.etiquetas.explicacion), crear("p", "", elemento.explicacion));
    const referencias = crear("div", "comparacion-biblica-referencias");
    referencias.append(crear("h5", "", datos.etiquetas.referencias));
    const referenciasLista = crear("ul");
    for (const referencia of elemento.referencias) referenciasLista.append(crear("li", "", referencia));
    referencias.append(referenciasLista);
    columna.append(observaciones, explicacion, referencias);
    elementos.append(columna);
  }
  caja.append(elementos);
  if (datos.conclusion) {
    const conclusion = crear("div", "comparacion-biblica-conclusion");
    conclusion.append(crear("h4", "", datos.etiquetas.conclusion), crear("p", "", datos.conclusion));
    caja.append(conclusion);
  }
  return caja;
}
