"use strict";

function dibujarSeparadorBanner(datos) {
  const bloque = document.createElement("header");
  bloque.className = "separador-banner";
  bloque.dataset.resourceId = datos.resource_id;
  const aviso = document.createElement("p");
  aviso.className = "separador-banner-aviso";
  aviso.textContent = datos.etiqueta_editorial;
  const titulo = document.createElement("h3");
  titulo.textContent = datos.titulo;
  const referencia = document.createElement("p");
  referencia.className = "separador-banner-referencia";
  referencia.textContent = datos.referencia;
  bloque.append(aviso, titulo, referencia);
  if (datos.descripcion) {
    const descripcion = document.createElement("p");
    descripcion.className = "separador-banner-descripcion";
    descripcion.textContent = datos.descripcion;
    bloque.append(descripcion);
  }
  return bloque;
}
