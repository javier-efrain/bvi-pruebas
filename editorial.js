"use strict";

// Adaptador experimental: no es un validador del contrato editorial v0.3.
const editorial = {
  resources: [],
  placements: [],
  // Correspondencia explícita entre referencia canónica y numeración del JSON RV1909.
  librosCanonicos: new Map([[41, "MRK"], [48, "GAL"]]),

  async cargar(...rutas) {
    const estado = document.getElementById("estado-editorial");
    estado.textContent = "Cargando contenido editorial…";
    try {
      const archivos = await Promise.all(rutas.map(async ruta => {
        const respuesta = await fetch(ruta);
        if (!respuesta.ok) throw new Error(`HTTP ${respuesta.status}`);
        return respuesta.json();
      }));
      if (!archivos.every(datos => datos
        && datos.schema === "bvi.editorial.demo.experimental.v0.1"
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
          || ids.has(recurso.resource_id) || recurso.status !== "borrador") {
          throw new Error("Recurso de demostración inválido.");
        }
        if (recurso.type === "caja_contexto") {
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

  tarjetasPara(libro, capitulo, versiculo) {
    const coincidencias = this.placements.filter(({ anchor }) =>
      anchor.book_id === this.librosCanonicos.get(libro)
      && anchor.chapter === capitulo && anchor.verse_number === versiculo
    );
    return coincidencias.map(ubicacion => {
      const recurso = this.resources.find(item => item.resource_id === ubicacion.resource_id);
      if (recurso.type === "caja_contexto") return dibujarCajaContexto(recurso);
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
    });
  }
};
