"use strict";

/** Crea una caja a partir de { titulo, texto, referencia }, sin insertarla. */
function dibujarCajaContexto(datos) {
  const caja = document.createElement("aside");
  caja.className = "caja-contexto";
  caja.setAttribute("aria-label", datos.titulo);

  const titulo = document.createElement("h3");
  titulo.textContent = datos.titulo;
  const texto = document.createElement("p");
  texto.textContent = datos.texto;
  const referencia = document.createElement("p");
  referencia.className = "caja-contexto-referencia";
  referencia.textContent = datos.referencia;

  caja.append(titulo, texto, referencia);
  return caja;
}
