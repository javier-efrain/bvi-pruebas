"use strict";

// Registrar únicamente temas con su CSS cargado desde index.html.
const temasDisponibles = [
  { id: "neon-cosmos", nombre: "Neon Cosmos", categoria: "Modernos" },
  { id: "aurora-expresivo", nombre: "Aurora Expresivo", categoria: "Modernos" }
];
const claveTema = "bvi.tema";
const selectorTema = document.getElementById("tema");
let temaInicial = "neon-cosmos";
try {
  const guardado = localStorage.getItem(claveTema);
  if (temasDisponibles.some(tema => tema.id === guardado)) temaInicial = guardado;
} catch { /* Tema predeterminado si el almacenamiento no está disponible. */ }

function aplicarTema(id, guardar = false) {
  const tema = temasDisponibles.find(tema => tema.id === id);
  if (!tema) return;
  document.documentElement.dataset.tema = tema.id;
  selectorTema.value = tema.id;
  if (guardar) {
    try { localStorage.setItem(claveTema, tema.id); } catch { /* Preferencia solo en memoria. */ }
  }
}

selectorTema.replaceChildren();
for (const categoria of ["Modernos", "Clásicos"]) {
  const grupo = document.createElement("optgroup");
  grupo.label = categoria;
  const opciones = temasDisponibles.filter(tema => tema.categoria === categoria);
  grupo.disabled = opciones.length === 0;
  for (const tema of opciones) {
    const opcion = document.createElement("option");
    opcion.value = tema.id;
    opcion.textContent = tema.nombre;
    grupo.append(opcion);
  }
  selectorTema.append(grupo);
}
aplicarTema(temaInicial);
selectorTema.addEventListener("change", () => aplicarTema(selectorTema.value, true));
