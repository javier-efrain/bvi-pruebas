"use strict";

function dibujarTarjetaRve(recurso) {
  const tarjeta = document.createElement("aside");
  tarjeta.className = "tarjeta-rve";
  tarjeta.dataset.resourceId = recurso.resource_id;
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "tarjeta-rve-abrir";
  boton.setAttribute("aria-label", `Abrir recurso experimental: ${recurso.title}`);
  boton.setAttribute("aria-haspopup", "dialog");
  const imagen = document.createElement("img");
  imagen.src = recurso.image.thumbnail.path;
  imagen.alt = ""; // El título del botón identifica la previsualización sin repetirlo.
  imagen.width = recurso.image.thumbnail.width;
  imagen.height = recurso.image.thumbnail.height;
  imagen.loading = "lazy";
  imagen.decoding = "async";
  const texto = document.createElement("span");
  const titulo = document.createElement("strong");
  titulo.textContent = recurso.title;
  const accion = document.createElement("span");
  accion.textContent = "Ver imagen y explicaciones";
  texto.append(titulo, accion);
  boton.append(imagen, texto);
  boton.addEventListener("click", () => abrirVisorRve(recurso, boton));
  const aviso = document.createElement("p");
  aviso.className = "tarjeta-rve-aviso";
  aviso.textContent = "Experimental · Pendiente de revisión · No publicable";
  tarjeta.append(boton, aviso);
  return tarjeta;
}
