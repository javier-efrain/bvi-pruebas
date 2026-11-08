"use strict";

let panelNotaVersiculo = null;

/** Un solo indicador por versículo; agrupa las notas ya ordenadas del catálogo. */
function dibujarIndicadorNotas(notas) {
  const boton = document.createElement("button");
  boton.type = "button";
  boton.className = "nota-versiculo-indicador";
  boton.textContent = "ⓘ";
  boton.setAttribute("aria-label", `Ver notas de ${notas[0].referencia.visible} (${notas.length})`);
  boton.setAttribute("aria-haspopup", "dialog");
  boton.setAttribute("aria-controls", "nota-versiculo-panel");
  boton.addEventListener("click", () => abrirNotasVersiculo(notas, boton));
  return boton;
}

function abrirNotasVersiculo(notas, origen) {
  if (!panelNotaVersiculo) {
    const dialogo = document.createElement("dialog");
    dialogo.id = "nota-versiculo-panel";
    dialogo.className = "nota-versiculo-panel";
    dialogo.setAttribute("aria-labelledby", "nota-versiculo-encabezado");
    const titulo = document.createElement("h2"); titulo.id = "nota-versiculo-encabezado";
    const cerrar = document.createElement("button"); cerrar.type = "button";
    cerrar.className = "nota-versiculo-cerrar"; cerrar.textContent = "Cerrar notas";
    const contenido = document.createElement("div"); contenido.className = "nota-versiculo-contenido";
    contenido.tabIndex = 0;
    contenido.setAttribute("role", "region"); contenido.setAttribute("aria-labelledby", titulo.id);
    dialogo.append(titulo, cerrar, contenido);
    const panel = { dialogo, titulo, cerrar, contenido, origen: null, scroll: 0 };
    cerrar.addEventListener("click", () => dialogo.close());
    dialogo.addEventListener("cancel", evento => { evento.preventDefault(); dialogo.close(); });
    dialogo.addEventListener("close", () => {
      if (panel.origen?.isConnected) panel.origen.focus({ preventScroll: true });
      window.scrollTo({ top: panel.scroll, behavior: "instant" });
      panel.origen = null;
    });
    dialogo.addEventListener("keydown", evento => {
      if (evento.key !== "Tab") return;
      if (evento.shiftKey && document.activeElement === cerrar) {
        evento.preventDefault(); contenido.focus();
      } else if (!evento.shiftKey && document.activeElement === contenido) {
        evento.preventDefault(); cerrar.focus();
      }
    });
    document.body.append(dialogo);
    panelNotaVersiculo = panel;
  }
  const panel = panelNotaVersiculo;
  panel.origen = origen; panel.scroll = window.scrollY;
  panel.titulo.textContent = notas[0].referencia.visible;
  const fragmento = document.createDocumentFragment();
  const crear = (tipo, clase, texto) => {
    const nodo = document.createElement(tipo); nodo.className = clase; nodo.textContent = texto; return nodo;
  };
  for (const nota of notas) {
    const articulo = document.createElement("article"); articulo.dataset.noteId = nota.resource_id;
    if (nota.titulo) articulo.append(crear("h3", "", nota.titulo));
    articulo.append(crear("p", "nota-versiculo-aviso", nota.aviso_revision),
      crear("p", "nota-versiculo-texto", nota.texto),
      crear("p", "nota-versiculo-procedencia", nota.procedencia));
    fragmento.append(articulo);
  }
  panel.contenido.replaceChildren(fragmento);
  panel.contenido.scrollTop = 0;
  if (!panel.dialogo.open) panel.dialogo.showModal();
  panel.cerrar.focus({ preventScroll: true });
}
