"use strict";

function dibujarSeparadorTitulo(datos) {
  const bloque = document.createElement("header");
  bloque.className = "separador-titulo";
  bloque.dataset.resourceId = datos.resource_id;
  const aviso = document.createElement("p");
  aviso.className = "separador-titulo-aviso";
  aviso.textContent = datos.etiqueta_editorial;
  const titulo = document.createElement("h3");
  titulo.textContent = datos.titulo;
  const referencia = document.createElement("p");
  referencia.className = "separador-titulo-referencia";
  referencia.textContent = datos.referencia;
  bloque.append(aviso, titulo, referencia);
  return bloque;
}
