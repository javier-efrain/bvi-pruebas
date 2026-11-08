"use strict";

// Adaptadores de apertura separados del descubrimiento y del diseño del menú.
const accesoRecursos = {
  adaptadores: new Map([
    ["caja_contexto", { tipo: "Contexto", nombre: r => r.titulo }],
    ["caja_ensenanza", { tipo: "Enseñanza", nombre: r => r.titulo }],
    ["palabra_original", { tipo: "Palabra original", nombre: r => `${r.termino} · ${r.traduccion_breve}` }],
    ["bloque_exegetico", { tipo: "Análisis exegético", nombre: r => `${r.titulo} · ${r.pasaje}` }],
    ["comparacion_biblica", { tipo: "Comparación", nombre: r => r.titulo }],
    ["referencias_cruzadas", { tipo: "Referencias cruzadas", nombre: r => r.titulo || r.origen.referencia }],
    ["rve_experimental", { tipo: "Recurso visual", nombre: r => r.title, abrir: (r, origen) => abrirVisorRve(r, origen) }],
    ["nota_versiculo", { tipo: "Nota de versículo", nombre: r => r.titulo || r.referencia.visible, abrir: (r, origen) => abrirNotasVersiculo([r], origen) }],
    [undefined, { tipo: "Recurso editorial", nombre: r => r.title }]
  ]),
  opciones(entradas) {
    return entradas.filter(e => this.adaptadores.has(e.resource.type)).map(({ resource, placement }) => {
      const adaptador = this.adaptadores.get(resource.type);
      return { id: resource.resource_id, nombre: adaptador.nombre(resource), tipo: adaptador.tipo, placement,
        abrir: origen => adaptador.abrir ? adaptador.abrir(resource, origen) : abrirPanelRecurso(resource, origen) };
    });
  }
};

function crearDialogoRecursos(clase) {
  const dialogo = document.createElement("dialog"); dialogo.className = clase;
  const encabezado = document.createElement("h2"); encabezado.id = `${clase}-titulo`;
  dialogo.setAttribute("aria-labelledby", encabezado.id);
  const cerrar = document.createElement("button"); cerrar.type = "button"; cerrar.textContent = "Cerrar";
  cerrar.className = "acceso-recursos-cerrar";
  const contenido = document.createElement("div"); contenido.className = "acceso-recursos-contenido";
  const panel = { dialogo, encabezado, cerrar, contenido, origen: null, scroll: 0 };
  dialogo.append(encabezado, cerrar, contenido);
  cerrar.addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("cancel", e => { e.preventDefault(); dialogo.close(); });
  dialogo.addEventListener("close", () => {
    // Un evento de cierre encolado no debe afectar una apertura posterior.
    if (dialogo.open) return;
    if (panel.origen?.isConnected) panel.origen.focus({ preventScroll: true });
    window.scrollTo({ top: panel.scroll, behavior: "instant" }); panel.origen = null;
    if (!dialogo.open) contenido.replaceChildren();
  });
  dialogo.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const controles = [...dialogo.querySelectorAll("button:not(:disabled), select:not(:disabled), summary, [tabindex='0']")]
      .filter(n => !n.hidden && n.getAttribute("aria-hidden") !== "true" && n.getClientRects().length);
    const primero = controles[0], ultimo = controles[controles.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });
  document.body.append(dialogo);
  return panel;
}

function mostrarDialogoRecursos(panel, titulo, origen) {
  panel.origen = origen; panel.scroll = window.scrollY; panel.encabezado.textContent = titulo;
  if (!panel.dialogo.open) panel.dialogo.showModal();
  panel.contenido.scrollTop = 0; panel.cerrar.focus({ preventScroll: true });
}

let panelRecursoLectura = null, menuRecursosLectura = null;
function abrirPanelRecurso(recurso, origen) {
  if (!panelRecursoLectura) panelRecursoLectura = crearDialogoRecursos("recurso-lectura-panel");
  const componente = editorial.dibujarRecurso(recurso);
  if (componente.tagName === "DETAILS" || componente.tipo === "details") componente.open = true;
  panelRecursoLectura.contenido.replaceChildren(componente);
  mostrarDialogoRecursos(panelRecursoLectura, accesoRecursos.adaptadores.get(recurso.type).nombre(recurso), origen);
}

function dibujarAccesoRecursos(opciones, referencia) {
  const indicador = document.createElement("button"); indicador.type = "button";
  indicador.className = "acceso-recursos-indicador"; indicador.textContent = "＋";
  indicador.setAttribute("aria-label", `Recursos de ${referencia} (${opciones.length})`);
  indicador.setAttribute("aria-haspopup", "dialog");
  indicador.addEventListener("click", () => {
    if (!menuRecursosLectura) menuRecursosLectura = crearDialogoRecursos("acceso-recursos-menu");
    const lista = document.createElement("ul");
    for (const opcion of opciones) {
      const item = document.createElement("li"), boton = document.createElement("button"); boton.type = "button";
      boton.dataset.resourceId = opcion.id; boton.setAttribute("aria-haspopup", "dialog");
      const nombre = document.createElement("span"); nombre.textContent = opcion.nombre;
      const tipo = document.createElement("small"); tipo.textContent = opcion.tipo;
      boton.append(nombre, tipo); boton.addEventListener("click", () => opcion.abrir(boton));
      item.append(boton); lista.append(item);
    }
    menuRecursosLectura.contenido.replaceChildren(lista);
    mostrarDialogoRecursos(menuRecursosLectura, `Recursos · ${referencia}`, indicador);
  });
  return indicador;
}

// Presentación experimental, no un sistema completo de modos.
const presentacionLectura = {
  activa: true,
  antes(libro, capitulo, versiculo) {
    return editorial.placements.filter(p => p.anchor.book_id === editorial.librosCanonicos.get(libro)
      && p.anchor.chapter === capitulo && p.anchor.verse_number === versiculo && p.position === "before_verse")
      .map(p => editorial.resources.find(r => r.resource_id === p.resource_id))
      .filter(r => r?.type === "division_tematica").map(dibujarSeparadorTitulo);
  },
  indicador(libro, capitulo, versiculo) {
    const opciones = accesoRecursos.opciones(editorial.recursosPara(libro, capitulo, versiculo));
    return opciones.length ? dibujarAccesoRecursos(opciones, `${libros.get(libro).nombre} ${capitulo}:${versiculo}`) : null;
  }
};
