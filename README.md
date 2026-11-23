# Autocompletador SQL

Aplicación web sencilla que sugiere continuaciones SQL usando frecuencias de trigramas. No requiere instalar paquetes ni entrenar una red neuronal.

## Probar localmente

El navegador debe cargar `LLMFINETUNNING.txt` mediante HTTP; abrir `index.html` directamente como archivo no permite esa carga.

Desde esta carpeta ejecuta:

```powershell
python -m http.server 8080
```

Luego abre <http://localhost:8080>.

## Uso

- Escribe una consulta SQL en el editor.
- Las sugerencias se calculan a partir de las dos palabras anteriores.
- Pulsa `Tab` o selecciona una sugerencia para insertarla.

Las consultas de `LLMFINETUNNING.txt` se usan como corpus. Las sentencias `CREATE TABLE` se excluyen y los textos y números se normalizan antes de contar las continuaciones.

## Publicación

El proyecto es estático y puede publicarse con GitHub Pages desde la rama `main`, carpeta raíz (`/`).
