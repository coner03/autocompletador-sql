const editor = document.getElementById("editor");
const lista = document.getElementById("lista");
const estado = document.getElementById("estado");

const trigramas = new Map();
let patronesCargados = 0;

function limpiarTokens(texto) {
  let consulta = texto.toLowerCase().trim();
  consulta = consulta.replace(/'[^\']*'/g, "<str>");
  consulta = consulta.replace(/\b\d+(?:\.\d+)?\b/g, "<num>");
  consulta = consulta.replace(/([(),;=])/g, " $1 ");
  return consulta.split(/\s+/).filter(Boolean);
}

async function cargarConsultas() {
  try {
    const respuesta = await fetch("LLMFINETUNNING.txt");
    if (!respuesta.ok) throw new Error("No se pudo cargar el archivo de consultas.");

    const contenido = await respuesta.text();
    let dentroCreate = false;

    for (const lineaOriginal of contenido.split(/\r?\n/)) {
      const linea = lineaOriginal.trim();
      if (!linea || linea.startsWith("--")) continue;

      if (linea.toUpperCase().startsWith("CREATE TABLE")) dentroCreate = true;
      if (dentroCreate) {
        if (linea.endsWith(");")) dentroCreate = false;
        continue;
      }

      const tokens = ["<start>", "<start>", ...limpiarTokens(linea)];
      if (tokens.length < 5) continue;

      for (let i = 0; i < tokens.length - 2; i++) {
        const clave = `${tokens[i]}\u0000${tokens[i + 1]}`;
        if (!trigramas.has(clave)) trigramas.set(clave, new Map());

        const siguientes = trigramas.get(clave);
        const siguiente = tokens[i + 2];
        siguientes.set(siguiente, (siguientes.get(siguiente) || 0) + 1);
        patronesCargados++;
      }
    }

    estado.textContent = `${trigramas.size} contextos y ${patronesCargados} patrones cargados`;
  } catch (error) {
    estado.textContent = error.message;
  }
}

function obtenerSugerencias() {
  const texto = editor.value;
  const tokens = limpiarTokens(texto);

  if (tokens.length === 0) return [];

  const ultimoEspacio = /\s$/.test(texto);
  let palabrasContexto = ["<start>", "<start>", ...tokens];
  let prefijo = "";

  if (!ultimoEspacio) {
    prefijo = palabrasContexto.pop();
  }

  const dosAnteriores = palabrasContexto.slice(-2);
  const clave = `${dosAnteriores[0]}\u0000${dosAnteriores[1]}`;
  let siguientes = trigramas.get(clave);

  if (!siguientes) return [];

  return [...siguientes.entries()]
    .filter(([palabra]) => !prefijo || palabra.startsWith(prefijo))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 5);
}

function mostrarSugerencias() {
  const sugerencias = obtenerSugerencias();
  lista.replaceChildren();

  if (sugerencias.length === 0) {
    const vacio = document.createElement("span");
    vacio.className = "empty";
    vacio.textContent = "Sin sugerencias para este contexto";
    lista.appendChild(vacio);
    return;
  }

  for (const [palabra, frecuencia] of sugerencias) {
    const boton = document.createElement("button");
    boton.type = "button";
    boton.className = "suggestion";
    boton.dataset.palabra = palabra;
    boton.innerHTML = `${palabra}<span class="count">${frecuencia}</span>`;
    boton.addEventListener("click", () => aceptar(palabra));
    lista.appendChild(boton);
  }
}

function aceptar(palabra) {
  if (!/\s$/.test(editor.value)) {
    const inicio = Math.max(editor.selectionStart - (editor.value.slice(0, editor.selectionStart).match(/[^\s]+$/)?.[0].length || 0), 0);
    editor.setRangeText(`${palabra} `, inicio, editor.selectionEnd, "end");
  } else {
    editor.setRangeText(`${palabra} `, editor.selectionStart, editor.selectionEnd, "end");
  }
  editor.focus();
  mostrarSugerencias();
}

editor.addEventListener("input", mostrarSugerencias);

editor.addEventListener("keydown", (event) => {
  if (event.key !== "Tab") return;
  const primera = lista.querySelector(".suggestion");
  if (!primera) return;
  event.preventDefault();
  aceptar(primera.dataset.palabra);
});

cargarConsultas();
