"use strict";

// Un solo visor, creado bajo demanda. El diálogo nativo aísla el resto de la página.
let visorRve = null;
function crearVisorRve() {
  const dialogo = document.createElement("dialog");
  dialogo.className = "visor-rve";
  dialogo.setAttribute("aria-labelledby", "visor-rve-titulo");
  dialogo.setAttribute("aria-describedby", "visor-rve-aviso");
  const crear = (tipo, clase, texto) => {
    const elemento = document.createElement(tipo);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  };
  const boton = texto => { const b = crear("button", "", texto); b.type = "button"; return b; };
  const cabecera = crear("header", "visor-rve-cabecera");
  const titulo = crear("h2"); titulo.id = "visor-rve-titulo";
  const cerrar = boton("Cerrar"); cerrar.autofocus = true;
  cabecera.append(titulo, cerrar);
  const aviso = crear("p", "visor-rve-aviso", "Experimental · Pendiente de revisión editorial y derechos · No publicable");
  aviso.id = "visor-rve-aviso";
  const imagenPanel = crear("div", "visor-rve-imagen-panel");
  imagenPanel.tabIndex = 0;
  imagenPanel.setAttribute("role", "region");
  imagenPanel.setAttribute("aria-label", "Imagen ampliable. Usá dos dedos, los controles de zoom o las flechas para desplazarla.");
  const capa = crear("div", "visor-rve-imagen-capa");
  const imagen = crear("img"); imagen.draggable = false;
  capa.append(imagen); imagenPanel.append(capa);
  const controles = crear("div", "visor-rve-controles");
  controles.setAttribute("role", "group"); controles.setAttribute("aria-label", "Ampliación de imagen");
  const menos = boton("−"), mas = boton("+"), restablecer = boton("Restablecer");
  menos.setAttribute("aria-label", "Reducir imagen"); mas.setAttribute("aria-label", "Ampliar imagen");
  const porcentaje = crear("output"); porcentaje.setAttribute("aria-live", "polite");
  controles.append(menos, porcentaje, mas, restablecer);
  const estado = crear("p", "visor-rve-estado"); estado.setAttribute("role", "status");
  const detalles = crear("section", "visor-rve-detalles");
  const etiqueta = crear("label", "", "Explicación"); etiqueta.htmlFor = "visor-rve-explicacion";
  const selector = crear("select"); selector.id = "visor-rve-explicacion";
  const nombre = crear("h3");
  const descripcion = crear("div", "visor-rve-descripcion");
  descripcion.tabIndex = 0;
  descripcion.setAttribute("role", "region"); descripcion.setAttribute("aria-label", "Texto completo de la explicación");
  const paginas = crear("div", "visor-rve-paginas");
  const anterior = boton("Anterior"), siguiente = boton("Siguiente");
  anterior.setAttribute("aria-label", "Explicación anterior"); siguiente.setAttribute("aria-label", "Explicación siguiente");
  const indice = crear("output"); indice.setAttribute("aria-live", "polite");
  paginas.append(anterior, indice, siguiente);
  detalles.append(etiqueta, selector, nombre, descripcion, paginas);
  dialogo.append(cabecera, aviso, imagenPanel, controles, estado, detalles);
  document.body.append(dialogo);

  let recurso = null, origen = null, punto = 0, zoom = 1, distanciaInicial = 0, zoomInicial = 1;
  let centro = { x: 0, y: 0 }, overflowAnterior = "";
  function ampliar(valor, ancla = { x: imagenPanel.clientWidth / 2, y: imagenPanel.clientHeight / 2 }) {
    const previo = zoom;
    zoom = Math.min(4, Math.max(1, valor));
    const x = imagenPanel.scrollLeft + ancla.x, y = imagenPanel.scrollTop + ancla.y;
    capa.style.width = `${zoom * 100}%`;
    imagenPanel.scrollLeft = x * zoom / previo - ancla.x;
    imagenPanel.scrollTop = y * zoom / previo - ancla.y;
    porcentaje.textContent = `${Math.round(zoom * 100)} %`;
    menos.disabled = zoom <= 1; mas.disabled = zoom >= 4;
  }
  function mostrarPunto(numero) {
    punto = Math.min(recurso.points.length - 1, Math.max(0, numero));
    const explicacion = recurso.points[punto];
    selector.value = String(punto);
    nombre.textContent = explicacion.name;
    descripcion.textContent = explicacion.description; // Sin cortes, resúmenes ni normalización.
    descripcion.scrollTop = 0;
    indice.textContent = `${punto + 1} / ${recurso.points.length}`;
    anterior.disabled = punto === 0; siguiente.disabled = punto === recurso.points.length - 1;
  }
  cerrar.addEventListener("click", () => dialogo.close());
  dialogo.addEventListener("cancel", evento => { evento.preventDefault(); dialogo.close(); });
  dialogo.addEventListener("close", () => {
    imagen.removeAttribute("src"); // Soltar la referencia a la imagen grande al cerrar.
    document.body.style.overflow = overflowAnterior;
    recurso = null; distanciaInicial = 0;
    if (origen?.isConnected) origen.focus({ preventScroll: true });
  });
  dialogo.addEventListener("keydown", evento => {
    if (evento.key !== "Tab") return;
    const controlesActivos = [...dialogo.querySelectorAll('button:not([disabled]), select:not([disabled]), [tabindex="0"]')];
    const primero = controlesActivos[0], ultimo = controlesActivos.at(-1);
    if (evento.shiftKey && document.activeElement === primero) { evento.preventDefault(); ultimo.focus(); }
    else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primero.focus(); }
  });
  menos.addEventListener("click", () => ampliar(zoom - .25));
  mas.addEventListener("click", () => ampliar(zoom + .25));
  restablecer.addEventListener("click", () => { ampliar(1); imagenPanel.scrollTo(0, 0); });
  selector.addEventListener("change", () => mostrarPunto(Number(selector.value)));
  anterior.addEventListener("click", () => mostrarPunto(punto - 1));
  siguiente.addEventListener("click", () => mostrarPunto(punto + 1));
  imagen.addEventListener("load", () => { estado.textContent = ""; });
  imagen.addEventListener("error", () => { estado.textContent = "No pudimos cargar la imagen. Cerrá el recurso y volvé a intentarlo; las explicaciones siguen disponibles."; });
  const distancia = toques => Math.hypot(toques[0].clientX - toques[1].clientX, toques[0].clientY - toques[1].clientY);
  imagenPanel.addEventListener("touchstart", evento => {
    if (evento.touches.length !== 2) return;
    evento.preventDefault(); distanciaInicial = distancia(evento.touches); zoomInicial = zoom;
    const rect = imagenPanel.getBoundingClientRect();
    centro = { x: (evento.touches[0].clientX + evento.touches[1].clientX) / 2 - rect.left,
      y: (evento.touches[0].clientY + evento.touches[1].clientY) / 2 - rect.top };
  }, { passive: false });
  imagenPanel.addEventListener("touchmove", evento => {
    if (evento.touches.length !== 2 || !distanciaInicial) return;
    evento.preventDefault(); ampliar(zoomInicial * distancia(evento.touches) / distanciaInicial, centro);
  }, { passive: false });
  imagenPanel.addEventListener("touchend", evento => { if (evento.touches.length < 2) distanciaInicial = 0; });
  imagenPanel.addEventListener("touchcancel", () => { distanciaInicial = 0; });
  return {
    abrir(datos, disparador) {
      if (dialogo.open) return;
      recurso = datos; origen = disparador;
      titulo.textContent = datos.title;
      selector.replaceChildren(...datos.points.map((p, i) => { const opcion = crear("option", "", p.name); opcion.value = String(i); return opcion; }));
      imagen.alt = `${datos.title} · Infografía experimental pendiente de revisión`;
      imagen.width = datos.image.original.width; imagen.height = datos.image.original.height;
      estado.textContent = "Cargando imagen…";
      zoom = 1; ampliar(1); mostrarPunto(0);
      overflowAnterior = document.body.style.overflow; document.body.style.overflow = "hidden";
      dialogo.showModal(); cerrar.focus(); imagenPanel.scrollTo(0, 0);
      imagen.src = datos.image.original.path; // Solo aquí se solicita el original.
    }
  };
}

function abrirVisorRve(recurso, origen) {
  if (!visorRve) visorRve = crearVisorRve();
  visorRve.abrir(recurso, origen);
}
