"use strict";

/** Crea y devuelve un versículo sin insertarlo en la página. */
function dibujarVersiculo(versiculo) {
  const elemento = document.createElement("p");
  elemento.className = "versiculo";

  const numero = document.createElement("span");
  numero.className = "versiculo-numero";
  numero.textContent = String(versiculo.numero);

  const texto = document.createElement("span");
  texto.className = "versiculo-texto";
  texto.textContent = versiculo.texto;

  elemento.append(numero, document.createTextNode(" "), texto);
  return elemento;
}

/** Recibe { versiculos: [{ numero, texto }] } y reemplaza el capítulo visible. */
function dibujarCapitulo(capitulo) {
  const contenedor = document.getElementById("capitulo");
  const fragmento = document.createDocumentFragment();

  // Ordena una copia para conservar intactos los datos de origen.
  const versiculosOrdenados = [...capitulo.versiculos].sort(
    (primero, segundo) => primero.numero - segundo.numero
  );

  for (const versiculo of versiculosOrdenados) {
    fragmento.append(dibujarVersiculo(versiculo));
    fragmento.append(...editorial.tarjetasPara(
      capitulo.libro, capitulo.numeroCapitulo, versiculo.numero
    ));
  }

  contenedor.replaceChildren(fragmento);
}

// Índice en memoria: libro -> capítulos -> versículos del JSON original.
const libros = new Map();
const selectorLibro = document.getElementById("libro");
const selectorCapitulo = document.getElementById("numero-capitulo");
const claveLectura = "bvi.ultimaLectura";

function recuperarLectura() {
  try {
    const lectura = JSON.parse(localStorage.getItem(claveLectura));
    if (lectura && Number.isInteger(lectura.libro) && Number.isInteger(lectura.capitulo)
      && libros.get(lectura.libro)?.capitulos.has(lectura.capitulo)) return lectura;
  } catch { /* Datos inválidos o almacenamiento no disponible: Mateo 1. */ }
  return { libro: 40, capitulo: 1 };
}

function crearOpcion(valor, etiqueta) {
  const opcion = document.createElement("option");
  opcion.value = String(valor);
  opcion.textContent = etiqueta;
  return opcion;
}

/** Adapta los datos al formato visual sin alterar los textos originales. */
function cargarCapitulo(libro, numeroCapitulo) {
  const datosLibro = libros.get(libro);
  const seleccion = datosLibro.capitulos.get(numeroCapitulo);
  dibujarCapitulo({
    libro,
    numeroCapitulo,
    versiculos: seleccion.map(versiculo => ({
      numero: versiculo.verse,
      texto: versiculo.text
    }))
  });
  document.getElementById("titulo-capitulo").textContent =
    `${datosLibro.nombre} ${numeroCapitulo}`;
  try {
    localStorage.setItem(claveLectura, JSON.stringify({ libro, capitulo: numeroCapitulo }));
  } catch { /* Se conserva la lectura actual en memoria si no se puede guardar. */ }
}

function actualizarCapitulos(libro, numeroInicial) {
  const fragmento = document.createDocumentFragment();
  const numeros = [...libros.get(libro).capitulos.keys()].sort((a, b) => a - b);
  for (const numero of numeros) {
    fragmento.append(crearOpcion(numero, String(numero)));
  }
  selectorCapitulo.replaceChildren(fragmento);
  selectorCapitulo.value = String(numeros.includes(numeroInicial) ? numeroInicial : numeros[0]);
  cargarCapitulo(libro, Number(selectorCapitulo.value));
}

selectorLibro.addEventListener("change", () => {
  actualizarCapitulos(Number(selectorLibro.value));
});
selectorCapitulo.addEventListener("change", () => {
  cargarCapitulo(Number(selectorLibro.value), Number(selectorCapitulo.value));
});

/** Descarga la Biblia una sola vez e inicializa los controles desde sus datos. */
async function iniciarLector(ruta) {
  const contenedor = document.getElementById("capitulo");
  contenedor.setAttribute("aria-busy", "true");
  contenedor.textContent = "Cargando libros y capítulos…";

  try {
    const respuesta = await fetch(ruta);
    if (!respuesta.ok) {
      throw new Error(`No se pudo cargar el capítulo: HTTP ${respuesta.status}`);
    }

    const biblia = await respuesta.json();
    if (!biblia || !Array.isArray(biblia.verses) || biblia.verses.length === 0) {
      throw new Error("El archivo no tiene el formato de Biblia esperado.");
    }

    for (const versiculo of biblia.verses) {
      if (!versiculo || !Number.isInteger(versiculo.book) || versiculo.book < 1
        || !Number.isInteger(versiculo.chapter) || versiculo.chapter < 1
        || !Number.isInteger(versiculo.verse) || versiculo.verse < 1
        || typeof versiculo.text !== "string" || typeof versiculo.book_name !== "string") {
        throw new Error("El archivo contiene versículos con formato inválido.");
      }
      if (!libros.has(versiculo.book)) {
        libros.set(versiculo.book, { nombre: versiculo.book_name, capitulos: new Map() });
      }
      const capitulos = libros.get(versiculo.book).capitulos;
      if (!capitulos.has(versiculo.chapter)) {
        capitulos.set(versiculo.chapter, []);
      }
      capitulos.get(versiculo.chapter).push(versiculo);
    }

    const fragmento = document.createDocumentFragment();
    for (const numero of [...libros.keys()].sort((a, b) => a - b)) {
      fragmento.append(crearOpcion(numero, libros.get(numero).nombre));
    }
    selectorLibro.replaceChildren(fragmento);
    await editorial.cargar();
    const lecturaInicial = recuperarLectura();
    selectorLibro.value = String(lecturaInicial.libro);
    actualizarCapitulos(lecturaInicial.libro, lecturaInicial.capitulo);
    selectorLibro.disabled = false;
    selectorCapitulo.disabled = false;
  } catch (error) {
    contenedor.textContent = "No pudimos cargar el capítulo. Comprobá tu conexión y recargá la página para volver a intentarlo.";
    console.error("Error al cargar el capítulo:", error);
  } finally {
    contenedor.setAttribute("aria-busy", "false");
  }
}

// Inicio: el script diferido se ejecuta después de cargar el HTML.
iniciarLector("contenido/rv_1909.json");
