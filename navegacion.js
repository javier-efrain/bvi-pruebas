"use strict";

// Cada destino declara su pantalla en el HTML; el lector permanece montado.
const destinos = [...document.querySelectorAll("[data-pantalla]")].map(boton => ({
  id: boton.dataset.pantalla,
  boton,
  pantalla: document.getElementById(boton.getAttribute("aria-controls")),
  desplazamiento: 0
}));
let pantallaActual = "biblia";

function mostrarPantalla(id, moverFoco = false) {
  const destino = destinos.find(item => item.id === id);
  if (!destino || (moverFoco && id === pantallaActual)) return;
  const anterior = destinos.find(item => item.id === pantallaActual);
  if (moverFoco && anterior) anterior.desplazamiento = window.scrollY;
  for (const item of destinos) {
    const activa = item === destino;
    item.pantalla.hidden = !activa;
    if (activa) item.boton.setAttribute("aria-current", "page");
    else item.boton.removeAttribute("aria-current");
  }
  pantallaActual = id;
  if (moverFoco) {
    destino.pantalla.querySelector("h1, h2").focus({ preventScroll: true });
    window.scrollTo({ top: destino.desplazamiento, behavior: "instant" });
  }
}

for (const destino of destinos) {
  destino.boton.addEventListener("click", () => mostrarPantalla(destino.id, true));
}
mostrarPantalla("biblia");
