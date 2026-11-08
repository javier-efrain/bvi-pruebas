"use strict";

/** Contenido editorial recibido como datos; no interpreta referencias ni cambia el lector. */
function dibujarCajaEnsenanza(datos) {
  const caja = document.createElement("aside");
  caja.className = "caja-ensenanza";
  caja.dataset.resourceId = datos.resource_id;
  caja.setAttribute("aria-label", datos.titulo);
  const crear = (tipo, clase, texto) => {
    const elemento = document.createElement(tipo);
    if (clase) elemento.className = clase;
    elemento.textContent = texto;
    return elemento;
  };
  caja.append(crear("h3", "caja-ensenanza-titulo", datos.titulo));
  caja.append(crear("p", "caja-ensenanza-aviso", datos.aviso_revision));
  const sentido = document.createElement("div");
  sentido.className = "caja-ensenanza-sentido";
  sentido.append(crear("h4", "", "Sentido del pasaje"), crear("p", "", datos.explicacion));
  caja.append(sentido);
  if (datos.aplicacion) {
    const aplicacion = document.createElement("div");
    aplicacion.className = "caja-ensenanza-aplicacion";
    aplicacion.append(crear("h4", "", "Aplicación práctica"), crear("p", "", datos.aplicacion));
    caja.append(aplicacion);
  }
  const referencias = document.createElement("div");
  referencias.className = "caja-ensenanza-referencias";
  const lista = document.createElement("ul");
  for (const referencia of datos.referencias) lista.append(crear("li", "", referencia));
  referencias.append(crear("h4", "", "Referencias bíblicas"), lista);
  caja.append(referencias);
  if (datos.conclusion) {
    const conclusion = document.createElement("div");
    conclusion.className = "caja-ensenanza-conclusion";
    conclusion.append(crear("h4", "", "Conclusión"), crear("p", "", datos.conclusion));
    caja.append(conclusion);
  }
  return caja;
}
