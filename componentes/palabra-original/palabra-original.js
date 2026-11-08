"use strict";

/** Desplegable nativo: el navegador resuelve apertura, cierre y teclado. */
function dibujarPalabraOriginal(datos) {
  const tarjeta = document.createElement("details");
  tarjeta.className = "palabra-original";
  tarjeta.dataset.resourceId = datos.resource_id;
  tarjeta.open = false;
  const crear = (tipo, clase, texto) => {
    const elemento = document.createElement(tipo);
    if (clase) elemento.className = clase;
    if (texto !== undefined) elemento.textContent = texto;
    return elemento;
  };
  const resumen = crear("summary", "palabra-original-resumen");
  const termino = crear("span", "palabra-original-termino", datos.termino);
  termino.lang = datos.idioma.codigo;
  termino.dir = datos.idioma.direccion;
  const transliteracion = crear("span", "palabra-original-transliteracion", datos.transliteracion);
  const traduccion = crear("span", "palabra-original-traduccion", datos.traduccion_breve);
  const idioma = crear("span", "palabra-original-idioma", datos.idioma.nombre);
  const revision = crear("span", "palabra-original-revision", datos.etiqueta_revision);
  resumen.append(termino, transliteracion, traduccion, idioma, revision);
  const contenido = crear("div", "palabra-original-contenido");
  contenido.append(crear("p", "palabra-original-aviso", datos.aviso_revision));
  const seccion = (titulo, texto, clase) => {
    const bloque = crear("div", clase);
    bloque.append(crear("h4", "", titulo), crear("p", "", texto));
    return bloque;
  };
  contenido.append(seccion("Significado léxico", datos.significado_lexico, "palabra-original-lexico"));
  const formas = crear("div", "palabra-original-formas");
  const lista = crear("ul");
  for (const forma of datos.formas_en_versiculo) {
    const item = crear("li");
    const original = crear("span", "", forma.texto);
    original.lang = datos.idioma.codigo; original.dir = datos.idioma.direccion;
    item.append(original, document.createTextNode(` · ${forma.gramatica}`));
    lista.append(item);
  }
  formas.append(crear("h4", "", "Formas en el versículo"), crear("p", "", datos.nota_forma), lista);
  contenido.append(formas);
  contenido.append(seccion("Interpretación contextual", datos.interpretacion_contextual, "palabra-original-contexto"));
  contenido.append(seccion("Aporte a la lectura", datos.aporte_interpretacion, "palabra-original-aporte"));
  const referencias = crear("p", "palabra-original-referencias", datos.referencias.join(" · "));
  contenido.append(referencias);
  // Las fuentes se presentan como texto: no generan solicitudes externas al abrir.
  const fuentes = crear("div", "palabra-original-fuentes");
  const fuentesLista = crear("ul");
  for (const fuente of datos.sources) fuentesLista.append(crear("li", "", `${fuente.title} · ${fuente.location}`));
  fuentes.append(crear("h4", "", "Fuentes consultadas"), fuentesLista);
  contenido.append(fuentes);
  tarjeta.append(resumen, contenido);
  return tarjeta;
}
