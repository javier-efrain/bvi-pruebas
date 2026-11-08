"use strict";

/** Organización visual de Estudio; no altera las ubicaciones editoriales. */
const presentacionEstudio = {
  complementarios: new Set(["bloque_exegetico", "palabra_original", "referencias_cruzadas", "comparacion_biblica", "nota_versiculo"]),
  separadores: { dibujarConImagen: null },
  // Asignación de presentación autorizada; el ancla editorial original sigue en 5:13.
  cierresEnsenanza: new Map([["BVI-ENSENANZA-GAL-5-13", "BVI-DIVISION-GAL-5-13-15"]]),
  vistos: new Set(),
  iniciar() { this.vistos.clear(); },
  entradas(libro, capitulo, versiculo) { return editorial.recursosPara(libro, capitulo, versiculo); },
  secciones(libro, capitulo) {
    return editorial.placements.filter(p => p.position === "before_verse"
      && p.anchor.book_id === editorial.librosCanonicos.get(libro) && p.anchor.chapter === capitulo)
      .map(p => editorial.resources.find(r => r.resource_id === p.resource_id))
      .filter(r => r?.type === "division_tematica")
      .sort((a, b) => a.rango.inicio - b.rango.inicio || a.resource_id.localeCompare(b.resource_id));
  },
  contextoDeSeccion(entrada, division, libro, capitulo) {
    const r = entrada.resource;
    if (r.type !== "caja_contexto") return false;
    const referencia = r.referencia?.trim().replace(/\.$/, "").replace(/-/g, "–");
    return entrada.placement.anchor.verse_number === division.rango.inicio
      && referencia === `${libros.get(libro).nombre} ${capitulo}:${division.rango.inicio}–${division.rango.fin}`;
  },
  consumir(recurso) {
    if (this.vistos.has(recurso.resource_id)) return false;
    this.vistos.add(recurso.resource_id); return true;
  },
  antes(libro, capitulo, versiculo) {
    const nodos = [];
    for (const division of this.secciones(libro, capitulo).filter(r => r.rango.inicio === versiculo)) {
      if (!this.consumir(division)) continue;
      nodos.push(this.separadores.dibujarConImagen?.(division) || dibujarSeparadorBanner(division));
      for (const entrada of this.entradas(libro, capitulo, versiculo)) {
        if (this.contextoDeSeccion(entrada, division, libro, capitulo) && this.consumir(entrada.resource)) {
          nodos.push(this.tarjetaResumen(entrada.resource));
        }
      }
    }
    return nodos;
  },
  despues(libro, capitulo, versiculo) {
    const nodos = [];
    for (const { resource } of this.entradas(libro, capitulo, versiculo)) {
      if (this.complementarios.has(resource.type) || this.cierresEnsenanza.has(resource.resource_id) || !this.consumir(resource)) continue;
      if (resource.type === "rve_experimental") {
        const tarjeta = dibujarTarjetaRve(resource);
        tarjeta.className += " estudio-rve"; nodos.push(tarjeta);
      } else nodos.push(this.tarjetaResumen(resource));
    }
    for (const division of this.secciones(libro, capitulo).filter(r => r.rango.fin === versiculo)) {
      for (const [id, seccionId] of this.cierresEnsenanza) {
        const recurso = editorial.resources.find(r => r.resource_id === id);
        if (seccionId === division.resource_id && recurso?.type === "caja_ensenanza" && this.consumir(recurso)) {
          nodos.push(this.tarjetaResumen(recurso));
        }
      }
    }
    return nodos;
  },
  indicador(libro, capitulo, versiculo) {
    const entradas = this.entradas(libro, capitulo, versiculo)
      .filter(e => this.complementarios.has(e.resource.type) && this.consumir(e.resource));
    const opciones = accesoRecursos.opciones(entradas);
    if (!opciones.length) return null;
    const boton = dibujarAccesoRecursos(opciones, `${libros.get(libro).nombre} ${capitulo}:${versiculo}`);
    boton.className += " estudio-complementarios";
    return boton;
  },
  tarjetaResumen(recurso) {
    const adaptador = accesoRecursos.adaptadores.get(recurso.type);
    const tarjeta = document.createElement("aside"); tarjeta.className = "estudio-resumen";
    tarjeta.dataset.resourceId = recurso.resource_id;
    const boton = document.createElement("button"); boton.type = "button";
    boton.className = "estudio-resumen-abrir"; boton.setAttribute("aria-haspopup", "dialog");
    const titulo = document.createElement("span"); titulo.className = "estudio-resumen-titulo"; titulo.textContent = adaptador.nombre(recurso);
    const tipo = document.createElement("span"); tipo.className = "estudio-resumen-tipo"; tipo.textContent = adaptador.tipo;
    const resumen = document.createElement("span"); resumen.className = "estudio-resumen-texto";
    const texto = recurso.texto || recurso.explicacion || recurso.comprehension_problem || "";
    resumen.textContent = texto.length > 160 ? `${texto.slice(0, 160)}…` : texto;
    boton.append(titulo, tipo, resumen);
    boton.addEventListener("click", () => abrirPanelRecurso(recurso, boton));
    tarjeta.append(boton); return tarjeta;
  }
};


const presentacionesExperimentales = {
  actual: "lectura",
  obtener() { return this.actual === "devocional" ? presentacionDevocional : this.actual === "estudio" ? presentacionEstudio : presentacionLectura; },
  cambiar(valor) {
    if (!["lectura", "estudio", "devocional"].includes(valor) || !libros.size) return;
    const versos = [...document.querySelectorAll("#capitulo .versiculo")];
    const ancla = versos.find(n => n.getBoundingClientRect().bottom > 0) || versos[0];
    const numero = ancla?.dataset.verseNumber, offset = ancla?.getBoundingClientRect().top;
    const scroll = window.scrollY;
    this.actual = valor;
    cargarCapitulo(Number(selectorLibro.value), Number(selectorCapitulo.value));
    const nuevo = [...document.querySelectorAll("#capitulo .versiculo")].find(n => n.dataset.verseNumber === numero);
    if (nuevo && numero) window.scrollTo({ top: window.scrollY + nuevo.getBoundingClientRect().top - offset, behavior: "instant" });
    else window.scrollTo({ top: scroll, behavior: "instant" });
  }
};
document.getElementById("presentacion-experimental").addEventListener("change", evento => {
  presentacionesExperimentales.cambiar(evento.target.value);
});
