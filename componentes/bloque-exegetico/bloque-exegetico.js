"use strict";

let secuenciaBloqueExegetico = 0;

/** Contenido editorial separado; desplegable nativo y pestañas con foco móvil. */
function dibujarBloqueExegetico(datos) {
  const crear = (tipo, clase, texto) => {
    const elemento = document.createElement(tipo);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  };
  const prefijo = `bloque-exegetico-${++secuenciaBloqueExegetico}`;
  const bloque = crear("details", "bloque-exegetico");
  bloque.dataset.resourceId = datos.resource_id;
  bloque.open = false;
  const resumen = crear("summary", "bloque-exegetico-resumen");
  for (const [clase, texto] of [["titulo", datos.titulo], ["pasaje", datos.pasaje],
    ["invitacion", datos.invitacion], ["revision", datos.etiqueta_revision]]) {
    resumen.append(crear("span", `bloque-exegetico-${clase}`, texto));
  }
  const contenido = crear("div", "bloque-exegetico-contenido");
  contenido.append(crear("p", "bloque-exegetico-aviso", datos.aviso_revision));
  const lista = crear("div", "bloque-exegetico-pestanas");
  lista.setAttribute("role", "tablist");
  lista.setAttribute("aria-label", datos.titulo);
  const botones = [], paneles = [];
  const seleccionar = indice => {
    botones.forEach((boton, i) => {
      boton.setAttribute("aria-selected", String(i === indice));
      boton.tabIndex = i === indice ? 0 : -1;
      paneles[i].hidden = i !== indice;
    });
  };
  datos.secciones.forEach((seccion, i) => {
    const boton = crear("button", "", seccion.titulo);
    boton.type = "button";
    boton.id = `${prefijo}-tab-${i}`;
    boton.setAttribute("role", "tab");
    boton.setAttribute("aria-controls", `${prefijo}-panel-${i}`);
    const panel = crear("section", "bloque-exegetico-panel");
    panel.id = `${prefijo}-panel-${i}`;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", boton.id);
    panel.tabIndex = 0;
    panel.append(crear("h4", "", seccion.titulo));
    for (const parrafo of seccion.parrafos) panel.append(crear("p", "", parrafo));
    panel.append(crear("p", "bloque-exegetico-referencias", seccion.referencias.join(" · ")));
    boton.addEventListener("click", () => seleccionar(i));
    boton.addEventListener("keydown", evento => {
      let destino;
      if (evento.key === "ArrowRight") destino = (i + 1) % botones.length;
      else if (evento.key === "ArrowLeft") destino = (i + botones.length - 1) % botones.length;
      else if (evento.key === "Home") destino = 0;
      else if (evento.key === "End") destino = botones.length - 1;
      else return;
      evento.preventDefault(); seleccionar(destino); botones[destino].focus();
    });
    botones.push(boton); paneles.push(panel); lista.append(boton);
  });
  seleccionar(0);
  contenido.append(lista, ...paneles);
  const fuentes = crear("details", "bloque-exegetico-fuentes");
  fuentes.append(crear("summary", "", datos.etiqueta_fuentes));
  const referencias = crear("ul");
  for (const fuente of datos.sources) referencias.append(crear("li", "", `${fuente.title} · ${fuente.location}`));
  fuentes.append(referencias, crear("p", "", datos.nota_revision));
  contenido.append(fuentes);
  bloque.append(resumen, contenido);
  return bloque;
}
