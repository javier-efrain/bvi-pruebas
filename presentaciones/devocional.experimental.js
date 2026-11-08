"use strict";

/** Un cuerpo compartido: la variante solo cambia el contenedor de apertura. */
function dibujarContenidoDevocional(datos) {
  const contenido = document.createElement("div"); contenido.className = "devocional-contenido";
  const aviso = document.createElement("p"); aviso.className = "devocional-aviso"; aviso.textContent = datos.aviso_revision;
  contenido.append(aviso);
  for (const campo of ["explicacion", "reflexion", "aplicacion"]) {
    const seccion = document.createElement("section"), titulo = document.createElement("h3"), texto = document.createElement("p");
    titulo.textContent = datos.etiquetas[campo]; texto.textContent = datos[campo];
    seccion.append(titulo, texto); contenido.append(seccion);
  }
  const fuente = document.createElement("p"); fuente.className = "devocional-procedencia"; fuente.textContent = datos.procedencia;
  contenido.append(fuente);
  return contenido;
}

let panelDevocional = null;
function dibujarRecorridoDevocional(datos) {
  const recorrido = document.createElement("div"); recorrido.className = "devocional-recorrido";
  const contenido = dibujarContenidoDevocional(datos);
  const secciones = [...contenido.children].filter(n => n.tagName === "SECTION" || n.tipo === "section");
  const pasos = ["Comprender", "Reflexionar", "Aplicar"];
  const navegacion = document.createElement("nav"); navegacion.setAttribute("aria-label", "Pasos del devocional");
  const lista = document.createElement("ol"); lista.className = "devocional-pasos";
  const items = pasos.map(nombre => { const li = document.createElement("li"); li.textContent = nombre; lista.append(li); return li; });
  navegacion.append(lista);
  const estado = document.createElement("p"); estado.className = "devocional-estado"; estado.setAttribute("role", "status");
  const controles = document.createElement("div"); controles.className = "devocional-controles";
  const anterior = document.createElement("button"), siguiente = document.createElement("button");
  anterior.type = siguiente.type = "button";
  anterior.className = "devocional-anterior"; siguiente.className = "devocional-siguiente";
  anterior.textContent = "Anterior"; siguiente.textContent = "Siguiente";
  controles.append(anterior, siguiente);
  let paso = 0;
  const mostrar = (indice, enfocar = false) => {
    paso = Math.min(2, Math.max(0, indice));
    secciones.forEach((seccion, i) => {
      seccion.hidden = i !== paso;
      if (i === paso) items[i].setAttribute("aria-current", "step");
      else items[i].removeAttribute("aria-current");
    });
    estado.textContent = `${pasos[paso]} · ${paso + 1} de 3`;
    anterior.disabled = paso === 0; siguiente.disabled = paso === 2;
    if (enfocar) {
      const encabezado = secciones[paso].children[0]; encabezado.tabIndex = -1;
      encabezado.focus({ preventScroll: true });
      if (panelDevocional) panelDevocional.dialogo.scrollTop = 0;
    }
  };
  anterior.addEventListener("click", () => mostrar(paso - 1, true));
  siguiente.addEventListener("click", () => mostrar(paso + 1, true));
  mostrar(0);
  recorrido.append(navegacion, estado, contenido, controles);
  return recorrido;
}

function dibujarTarjetaDevocional(datos, variante) {
  const expandible = variante === "expandible";
  const tarjeta = document.createElement(expandible ? "details" : "aside"); tarjeta.className = "devocional-tarjeta";
  tarjeta.dataset.resourceId = datos.resource_id; tarjeta.dataset.sectionId = datos.section_id;
  const abrir = document.createElement(expandible ? "summary" : "button"); abrir.className = "devocional-abrir";
  if (!expandible) { abrir.type = "button"; abrir.setAttribute("aria-haspopup", "dialog"); }
  for (const [clase, valor] of [["titulo", datos.titulo], ["descripcion", datos.descripcion],
    ["accion", datos.accion_abrir], ["aviso", datos.aviso_revision]]) {
    const texto = document.createElement("span"); texto.className = `devocional-${clase}`; texto.textContent = valor; abrir.append(texto);
  }
  tarjeta.append(abrir);
  if (expandible) {
    tarjeta.open = false;
    let creado = false;
    tarjeta.addEventListener("toggle", () => {
      if (tarjeta.open && !creado) { tarjeta.append(dibujarContenidoDevocional(datos)); creado = true; }
    });
  } else {
    abrir.addEventListener("click", () => {
      if (!panelDevocional) panelDevocional = crearDialogoRecursos("devocional-panel");
      panelDevocional.contenido.replaceChildren(dibujarRecorridoDevocional(datos));
      mostrarDialogoRecursos(panelDevocional, datos.titulo, abrir);
    });
  }
  return tarjeta;
}

const presentacionDevocional = {
  separadores: { dibujarConImagen: null },
  secciones: [], vistos: new Set(),
  iniciar() { this.vistos.clear(); },
  obtenerSecciones(libro, capitulo) {
    return editorial.placements.filter(p => p.position === "before_verse"
      && p.anchor.book_id === editorial.librosCanonicos.get(libro) && p.anchor.chapter === capitulo)
      .map(p => ({ ubicacion: p, division: editorial.resources.find(r => r.resource_id === p.resource_id) }))
      .filter(s => s.division?.type === "division_tematica")
      .sort((a, b) => a.division.rango.inicio - b.division.rango.inicio || a.division.resource_id.localeCompare(b.division.resource_id));
  },
  antes(libro, capitulo, versiculo) {
    this.secciones = this.obtenerSecciones(libro, capitulo);
    return this.secciones.filter(s => s.division.rango.inicio === versiculo && !this.vistos.has(s.division.resource_id)
      && this.vistos.add(s.division.resource_id)).map(s => this.separadores.dibujarConImagen?.(s.division) || dibujarSeparadorBanner(s.division));
  },
  indicador() { return null; },
  despues(libro, capitulo, versiculo) {
    return this.secciones.filter(s => s.division.rango.fin === versiculo).flatMap(s =>
      editorial.resources.filter(r => r.type === "devocional_seccion" && r.section_id === s.division.resource_id
        && !this.vistos.has(r.resource_id) && this.vistos.add(r.resource_id))
        .map(r => dibujarTarjetaDevocional(r, "ventana")));
  }
};
