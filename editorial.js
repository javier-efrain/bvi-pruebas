"use strict";

// Adaptador experimental: no es un validador del contrato editorial v0.3.
const editorial = {
  resources: [],
  placements: [],
  presentacionDivisiones: "lectura",
  dibujarDivision(datos) {
    return ["estudio", "devocional"].includes(this.presentacionDivisiones)
      ? dibujarSeparadorBanner(datos) : dibujarSeparadorTitulo(datos);
  },
  // Correspondencia explícita entre referencia canónica y numeración del JSON RV1909.
  librosCanonicos: new Map([[41, "MRK"], [48, "GAL"]]),

  async cargar(...rutas) {
    const estado = document.getElementById("estado-editorial");
    estado.textContent = "Cargando contenido editorial…";
    try {
      // El catálogo permite agregar recursos sin editar el lector. Cero rutas sigue
      // significando cero cargas editoriales, como en la copia pública estable.
      let fuentes = rutas;
      if (rutas.length) {
        const respuestaCatalogo = await fetch("contenido/editorial/catalogo.experimental.json");
        if (!respuestaCatalogo.ok) throw new Error(`HTTP ${respuestaCatalogo.status}`);
        const catalogo = await respuestaCatalogo.json();
        if (catalogo?.schema !== "bvi.editorial.catalog.experimental.v0.1" || catalogo.publication_allowed !== false
          || !Array.isArray(catalogo.files) || !catalogo.files.every(r => typeof r === "string"
            && /^contenido\/editorial\/[a-z0-9.-]+\.json$/.test(r) && !r.includes(".."))) {
          throw new Error("Catálogo editorial experimental inválido.");
        }
        // Extensión experimental sin alterar el catálogo JSON previo.
        fuentes = [...new Set([...rutas, ...catalogo.files, "contenido/editorial/galatas5-devocionales.experimental.json"])];
      }
      const archivos = await Promise.all(fuentes.map(async ruta => {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        return respuesta.json();
      }));
      if (!archivos.every(datos => datos
        && ["bvi.editorial.demo.experimental.v0.1", "bvi.rve.extraction.experimental.v0.1"].includes(datos.schema)
        && (datos.schema !== "bvi.rve.extraction.experimental.v0.1" || datos.publication_allowed === false)
        && Array.isArray(datos.resources) && Array.isArray(datos.placements))) {
        throw new Error("Formato editorial experimental inválido.");
      }
      const datos = {
        resources: archivos.flatMap(archivo => archivo.resources),
        placements: archivos.flatMap(archivo => archivo.placements)
      };
      const ids = new Set();
      for (const recurso of datos.resources) {
        if (!recurso || typeof recurso.resource_id !== "string" || !recurso.resource_id
          || ids.has(recurso.resource_id)) {
          throw new Error("Recurso de demostración inválido.");
        }
        if (recurso.type === "rve_experimental") {
          const rutaValida = (imagen, carpeta, extension) => imagen
            && typeof imagen.path === "string"
            && new RegExp(`^contenido/imagenes/galatas5/${carpeta}/[a-z0-9-]+\\.${extension}$`).test(imagen.path)
            && Number.isInteger(imagen.width) && imagen.width > 0
            && Number.isInteger(imagen.height) && imagen.height > 0;
          const puntos = new Set();
          if (recurso.status !== "pendiente_revision" || recurso.publication_allowed !== false
            || typeof recurso.title !== "string" || !recurso.title.trim()
            || !rutaValida(recurso.image?.original, "originales", "png")
            || !rutaValida(recurso.image?.thumbnail, "miniaturas", "jpg")
            || !Array.isArray(recurso.points) || !recurso.points.length
            || !recurso.points.every(p => p && typeof p.point_id === "string" && p.point_id
              && !puntos.has(p.point_id) && puntos.add(p.point_id)
              && typeof p.name === "string" && typeof p.description === "string")) {
            throw new Error("Recurso visual experimental inválido.");
          }
        } else if (recurso.status !== "borrador") {
          throw new Error("Estado editorial inválido.");
        } else if (recurso.type === "devocional_seccion") {
          const texto = v => typeof v === "string" && v.trim().length > 0;
          if (recurso.publication_allowed !== false
            || ![recurso.section_id, recurso.titulo, recurso.descripcion, recurso.accion_abrir, recurso.aviso_revision,
              recurso.explicacion, recurso.reflexion, recurso.aplicacion, recurso.procedencia].every(texto)
            || !recurso.etiquetas || !["explicacion", "reflexion", "aplicacion"].every(k => texto(recurso.etiquetas[k]))
            || !["biblical_review", "exegetical_review", "editorial_review"].every(k => recurso.editorial_review?.[k] === "pendiente")) {
            throw new Error("Devocional experimental inválido.");
          }
        } else if (recurso.type === "nota_versiculo") {
          const texto = v => typeof v === "string" && v.trim().length > 0;
          const r = recurso.referencia;
          if (recurso.publication_allowed !== false || !r || !this.librosCanonicos.has(r.book)
            || !Number.isInteger(r.chapter) || r.chapter < 1 || !Number.isInteger(r.verse) || r.verse < 1
            || ![r.visible, recurso.texto, recurso.aviso_revision, recurso.procedencia].every(texto)
            || (recurso.titulo !== undefined && !texto(recurso.titulo))
            || recurso.editorial_review?.exegetical_review !== "pendiente") throw new Error("Nota de versículo inválida.");
        } else if (recurso.type === "referencias_cruzadas") {
          const texto = v => typeof v === "string" && v.trim().length > 0;
          const identificador = r => r && Number.isInteger(r.book) && r.book >= 1 && r.book <= 66
            && Number.isInteger(r.chapter) && r.chapter > 0 && Number.isInteger(r.verse) && r.verse > 0 && texto(r.referencia);
          const claves = new Set();
          if (recurso.publication_allowed !== false || (recurso.titulo !== undefined && !texto(recurso.titulo))
            || !identificador(recurso.origen) || !texto(recurso.aviso_revision)
            || !Array.isArray(recurso.referencias) || !recurso.referencias.length
            || !recurso.referencias.every(r => {
              if (!identificador(r) || !texto(r.relacion)) return false;
              const clave = `${r.book}:${r.chapter}:${r.verse}`;
              if (claves.has(clave)) return false;
              claves.add(clave); return true;
            })) throw new Error("Referencias cruzadas experimentales inválidas.");
        } else if (recurso.type === "comparacion_biblica") {
          const texto = v => typeof v === "string" && v.trim().length > 0;
          const textos = v => Array.isArray(v) && v.length > 0 && v.every(texto);
          if (recurso.publication_allowed !== false || !texto(recurso.titulo) || !texto(recurso.aviso_revision)
            || !recurso.etiquetas || !["observaciones", "explicacion", "referencias", "conclusion"].every(k => texto(recurso.etiquetas[k]))
            || !Array.isArray(recurso.elementos) || recurso.elementos.length < 2
            || !recurso.elementos.every(e => e && texto(e.encabezado) && textos(e.observaciones) && texto(e.explicacion) && textos(e.referencias))
            || (recurso.conclusion !== undefined && !texto(recurso.conclusion))
            || !Array.isArray(recurso.sources) || !recurso.sources.length || !recurso.sources.every(f => f && texto(f.title) && texto(f.location))
            || recurso.editorial_review?.biblical_review !== "pendiente" || recurso.editorial_review?.editorial_review !== "pendiente") {
            throw new Error("Comparación bíblica experimental inválida.");
          }
        } else if (recurso.type === "division_tematica") {
          if (recurso.publication_allowed !== false
            || ![recurso.titulo, recurso.referencia, recurso.etiqueta_editorial].every(v => typeof v === "string" && v.trim())
            || !Number.isInteger(recurso.rango?.inicio) || recurso.rango.inicio < 1
            || !Number.isInteger(recurso.rango?.fin) || recurso.rango.fin < recurso.rango.inicio
            || (recurso.descripcion !== undefined && (typeof recurso.descripcion !== "string" || !recurso.descripcion.trim()))) {
            throw new Error("División temática experimental inválida.");
          }
        } else if (recurso.type === "bloque_exegetico") {
          const textoValido = v => typeof v === "string" && v.trim().length > 0;
          if (recurso.publication_allowed !== false
            || ![recurso.titulo, recurso.pasaje, recurso.invitacion, recurso.etiqueta_revision,
              recurso.aviso_revision, recurso.etiqueta_fuentes, recurso.nota_revision].every(textoValido)
            || !Array.isArray(recurso.secciones) || recurso.secciones.length !== 3
            || !recurso.secciones.every((s, i) => s && s.id === ["contexto", "analisis", "interpretacion"][i]
              && textoValido(s.titulo) && Array.isArray(s.parrafos) && s.parrafos.length && s.parrafos.every(textoValido)
              && Array.isArray(s.referencias) && s.referencias.length && s.referencias.every(textoValido))
            || !Array.isArray(recurso.sources) || !recurso.sources.length
            || !recurso.sources.every(f => f && textoValido(f.title) && textoValido(f.location))
            || !recurso.editorial_review || recurso.editorial_review.biblical_review !== "pendiente"
            || recurso.editorial_review.editorial_review !== "pendiente") {
            throw new Error("Bloque exegético experimental inválido.");
          }
        } else if (recurso.type === "palabra_original") {
          const textoValido = v => typeof v === "string" && v.trim().length > 0;
          const idioma = recurso.idioma;
          if (recurso.publication_allowed !== false
            || ![recurso.termino, recurso.transliteracion, recurso.traduccion_breve, recurso.etiqueta_revision, recurso.aviso_revision,
              recurso.significado_lexico, recurso.nota_forma, recurso.interpretacion_contextual, recurso.aporte_interpretacion].every(textoValido)
            || !idioma || !textoValido(idioma.nombre) || !["grc", "he"].includes(idioma.codigo)
            || idioma.direccion !== (idioma.codigo === "he" ? "rtl" : "ltr")
            || !Array.isArray(recurso.formas_en_versiculo) || !recurso.formas_en_versiculo.length
            || !recurso.formas_en_versiculo.every(f => f && textoValido(f.texto) && textoValido(f.gramatica))
            || !Array.isArray(recurso.referencias) || !recurso.referencias.length || !recurso.referencias.every(textoValido)
            || !Array.isArray(recurso.sources) || !recurso.sources.length
            || !recurso.sources.every(f => f && textoValido(f.title) && textoValido(f.location))) {
            throw new Error("Palabra original experimental inválida.");
          }
        } else if (recurso.type === "caja_ensenanza") {
          const textoValido = v => typeof v === "string" && v.trim().length > 0;
          if (recurso.publication_allowed !== false
            || ![recurso.titulo, recurso.explicacion, recurso.aviso_revision].every(textoValido)
            || !Array.isArray(recurso.referencias) || !recurso.referencias.length || !recurso.referencias.every(textoValido)
            || (recurso.aplicacion !== undefined && !textoValido(recurso.aplicacion))
            || (recurso.conclusion !== undefined && !textoValido(recurso.conclusion))) {
            throw new Error("Caja de enseñanza inválida.");
          }
        } else if (recurso.type === "caja_contexto") {
          if (![recurso.titulo, recurso.texto, recurso.referencia].every(
            valor => typeof valor === "string" && valor.trim().length > 0
          )) throw new Error("Caja de contexto inválida.");
        } else if (recurso.type !== undefined || typeof recurso.title !== "string"
          || typeof recurso.comprehension_problem !== "string"
          || typeof recurso.review_notice !== "string") {
          throw new Error("Recurso de demostración inválido.");
        }
        ids.add(recurso.resource_id);
      }
      const seccionesDevocionales = new Set();
      for (const recurso of datos.resources.filter(r => r.type === "devocional_seccion")) {
        const seccion = datos.resources.find(r => r.resource_id === recurso.section_id && r.type === "division_tematica");
        if (!seccion || seccionesDevocionales.has(recurso.section_id)
          || datos.placements.filter(p => p.resource_id === seccion.resource_id && p.position === "before_verse").length !== 1
          || datos.placements.some(p => p.resource_id === recurso.resource_id)) throw new Error("Sección devocional inválida o repetida.");
        seccionesDevocionales.add(recurso.section_id);
      }
      const ubicaciones = new Set();
      for (const ubicacion of datos.placements) {
        const ancla = ubicacion?.anchor;
        if (!ubicacion || typeof ubicacion.placement_id !== "string"
          || ubicaciones.has(ubicacion.placement_id) || !ids.has(ubicacion.resource_id)
          || !ancla || ![...this.librosCanonicos.values()].includes(ancla.book_id)
          || !Number.isInteger(ancla.chapter) || ancla.chapter < 1
          || !Number.isInteger(ancla.verse_number) || ancla.verse_number < 1) {
          throw new Error("Ubicación editorial inválida.");
        }
        ubicaciones.add(ubicacion.placement_id);
        const recurso = datos.resources.find(r => r.resource_id === ubicacion.resource_id);
        if (recurso.type === "nota_versiculo" && (ubicacion.position !== "verse_note"
          || ubicacion.status !== "borrador" || ubicacion.publication_allowed !== false
          || ancla.book_id !== this.librosCanonicos.get(recurso.referencia.book)
          || ancla.chapter !== recurso.referencia.chapter || ancla.verse_number !== recurso.referencia.verse)) {
          throw new Error("Ubicación de nota inválida.");
        }
        if (recurso.type === "division_tematica" && (ubicacion.position !== "before_verse"
          || ubicacion.status !== "borrador" || ubicacion.publication_allowed !== false
          || ancla.verse_number !== recurso.rango.inicio)) throw new Error("Ubicación de división inválida.");
        if (["caja_ensenanza", "palabra_original", "bloque_exegetico", "comparacion_biblica", "referencias_cruzadas"].includes(recurso.type) && (ubicacion.position !== "after_verse"
          || ubicacion.publication_allowed !== false || ubicacion.status !== "borrador")) {
          throw new Error("Ubicación de enseñanza inválida.");
        }
        if (ubicacion.order !== undefined && !Number.isInteger(ubicacion.order)) throw new Error("Orden editorial inválido.");
        if (recurso.type === "rve_experimental" && (ubicacion.position !== "after_verse"
          || ubicacion.publication_allowed !== false || ubicacion.status !== "pendiente_revision")) {
          throw new Error("Ubicación de recurso visual inválida.");
        }
      }
      this.resources = datos.resources;
      this.placements = datos.placements;
      estado.textContent = "";
    } catch (error) {
      this.resources = [];
      this.placements = [];
      estado.textContent = "No pudimos cargar el contenido editorial. Podés seguir leyendo la Biblia; recargá la página para reintentar.";
      console.error("Error editorial:", error);
    }
  },

  indicadorNotasPara(libro, capitulo, versiculo) {
    const ids = [...new Set(this.placements.filter(p => p.position === "verse_note"
      && p.anchor.book_id === this.librosCanonicos.get(libro) && p.anchor.chapter === capitulo
      && p.anchor.verse_number === versiculo).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)
        || a.placement_id.localeCompare(b.placement_id)).map(p => p.resource_id))];
    return ids.length ? dibujarIndicadorNotas(ids.map(id => this.resources.find(r => r.resource_id === id))) : null;
  },

  // Descubrimiento independiente de menús, tarjetas y futuros modos.
  recursosPara(libro, capitulo, versiculo) {
    const vistos = new Set();
    return this.placements.filter(p => p.anchor.book_id === this.librosCanonicos.get(libro)
      && p.anchor.chapter === capitulo && p.anchor.verse_number === versiculo)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.placement_id.localeCompare(b.placement_id))
      .map(placement => ({ placement, resource: this.resources.find(r => r.resource_id === placement.resource_id) }))
      .filter(({ resource }) => resource && resource.type !== "division_tematica"
        && !vistos.has(resource.resource_id) && vistos.add(resource.resource_id));
  },

  tarjetasPara(libro, capitulo, versiculo, posicion = "after_verse") {
    const coincidencias = this.placements.filter(({ anchor, position }) =>
      (position ?? "after_verse") === posicion &&
      anchor.book_id === this.librosCanonicos.get(libro)
      && anchor.chapter === capitulo && anchor.verse_number === versiculo
    ).sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.placement_id.localeCompare(b.placement_id));
    return coincidencias.map(ubicacion => this.dibujarRecurso(this.resources.find(item => item.resource_id === ubicacion.resource_id)));
  },

  dibujarRecurso(recurso) {
      if (recurso.type === "referencias_cruzadas") return dibujarReferenciasCruzadas(recurso);
      if (recurso.type === "comparacion_biblica") return dibujarComparacionBiblica(recurso);
      if (recurso.type === "division_tematica") return this.dibujarDivision(recurso);
      if (recurso.type === "caja_contexto") return dibujarCajaContexto(recurso);
      if (recurso.type === "caja_ensenanza") return dibujarCajaEnsenanza(recurso);
      if (recurso.type === "bloque_exegetico") return dibujarBloqueExegetico(recurso);
      if (recurso.type === "palabra_original") return dibujarPalabraOriginal(recurso);
      if (recurso.type === "rve_experimental") return dibujarTarjetaRve(recurso);
      const tarjeta = document.createElement("aside");
      tarjeta.className = "tarjeta-editorial";
      tarjeta.setAttribute("aria-label", "Recurso editorial de demostración");
      const titulo = document.createElement("h3");
      titulo.textContent = recurso.title;
      const pregunta = document.createElement("p");
      pregunta.textContent = recurso.comprehension_problem;
      const aviso = document.createElement("p");
      aviso.className = "aviso-editorial";
      aviso.textContent = recurso.review_notice;
      tarjeta.append(titulo, pregunta, aviso);
      return tarjeta;
  }
};
