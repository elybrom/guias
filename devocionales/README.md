# Devocionales diarios

App: [`index.html`](./index.html) (GitHub Pages: https://elybrom.github.io/guias/devocionales/).

La app carga este archivo con `fetch('diarios.json?t=' + Date.now())` (`cache: 'no-store'`). Muestra la entrada cuya `date` coincide con **hoy en America/Mexico_City** (`YYYY-MM-DD`). Si aún no hay entrada para hoy, muestra la más reciente con fecha menor o igual a hoy.

## Cómo publicar el devocional del día

1. Redacta **una** entrada nueva (calidad completa, no un resumen corto).
2. Añádela al **final** del arreglo en `diarios.json`. No borres entradas anteriores (son el archivo).
3. No inventes texto bíblico ni datos. Citas breves en **Reina-Valera 1960**, comprobadas (p. ej. en [Bible Gateway RVR1960](https://www.biblegateway.com/)). Distingue observación, interpretación, contexto, doctrina y aplicación. El texto describe; no siempre aprueba.
4. La secuencia lee **libros enteros, un capítulo por día**, en orden canónico, empezando el **2026-11-12** con **Jueces 1**. Sigue Jueces 2, 3, … 21; después **Rut 1**, y así sucesivamente (Rut, 1 Samuel, 2 Samuel, …). Si un día cubre un tramo breve de más de un capítulo, usa el arreglo `chapters`.
5. Confirma que `date` sea el día de publicación en America/Mexico_City, que el enlace `bible_gateway` apunte al pasaje correcto en `version=RVR1960`, y que el JSON siga siendo un arreglo válido (`python3 -m json.tool diarios.json`).
6. Desde el repo `elybrom/guias`:

```bash
git add devocionales/diarios.json
git -c user.name=elybrom -c user.email=elybrom@users.noreply.github.com commit -m "Devocional: Jueces N (YYYY-MM-DD)"
git push
```

Sustituye el mensaje por el libro, capítulo y fecha reales. No toques otras carpetas del repo.

## Formato de cada entrada

El archivo es un **arreglo JSON** de objetos. Campos:

| Campo | Tipo | Obligatorio | Descripción |
|---|---|---|---|
| `date` | string | sí | Fecha `YYYY-MM-DD` (America/Mexico_City). |
| `book` | string | sí | Nombre del libro en español, como en RVR1960 (`Jueces`, `Rut`, `1 Samuel`, `Salmos`, …). |
| `chapters` | número o arreglo de números | sí | Capítulo(s) del día. Un día normal: `[1]`. Un tramo: `[19, 20, 21]`. |
| `title` | string | sí | Título del devocional. |
| `contexto_historico` | string | sí | Marco histórico y cultural (período, lugar, situación). Sin fechas inventadas. |
| `resumen` | string | sí | Resumen fiel del relato; no añadas lo que el texto no dice. |
| `versiculo_clave` | objeto | sí | Cita RVR1960 exacta. Subcampos: `referencia` (p. ej. `"Jueces 1:1-2"`), `texto` (palabra por palabra), `version` (`"RVR1960"`). |
| `pasajes_dificiles` | string | sí | Qué dice y qué **no** dice el texto; precisiones (nombres, lugares, malentendidos frecuentes). |
| `conexiones` | string | sí | Referencias cruzadas y cómo se relacionan. |
| `observacion` | string | sí | Lo que el texto *dice*, antes de interpretar. |
| `interpretacion` | string | sí | Sentido en su contexto, con cautela. |
| `doctrina` | string | sí | Enseñanza teológica fundada en el pasaje, sin forzar. |
| `aplicacion` | string | sí | Cómo vivir la Palabra hoy, distinguida de la doctrina. |
| `preguntas` | arreglo de strings | sí | 3 o 4 preguntas de reflexión. |
| `oracion` | string | sí | Oración breve, concreta, ligada al pasaje. |
| `bible_gateway` | string | sí | URL al texto completo: `https://www.biblegateway.com/passage/?search=Jueces+1&version=RVR1960` (ajusta libro y capítulo). |

### Ejemplo mínimo de estructura

```json
[
  {
    "date": "2026-11-12",
    "book": "Jueces",
    "chapters": [1],
    "title": "Después de Josué: la conquista incompleta",
    "contexto_historico": "...",
    "resumen": "...",
    "versiculo_clave": {
      "referencia": "Jueces 1:1-2",
      "texto": "Aconteció después de la muerte de Josué...",
      "version": "RVR1960"
    },
    "pasajes_dificiles": "...",
    "conexiones": "...",
    "observacion": "...",
    "interpretacion": "...",
    "doctrina": "...",
    "aplicacion": "...",
    "preguntas": ["¿…?", "¿…?"],
    "oracion": "Señor Jehová, … amén.",
    "bible_gateway": "https://www.biblegateway.com/passage/?search=Jueces+1&version=RVR1960"
  }
]
```

La primera entrada (2026-11-12, Jueces 1) ya está escrita en este archivo como modelo de calidad. Copia su profundidad, no solo sus claves.

## Relación con la app

- Marcar el devocional de hoy como leído alimenta la **racha** (`localStorage`) y, si el pasaje es un capítulo de un libro ya desplegado (p. ej. Jueces), también el progreso de ese capítulo.
- El libro de **Jueces** está desarrollado entero, capítulo por capítulo, dentro de `index.html` (introducción, contexto, mapa, línea de tiempo, quizzes). El JSON diario no sustituye esa guía: es la lectura de cada día, en secuencia.
- Tras un `git push`, GitHub Pages puede tardar un minuto. La app usa cache-busting para no quedar atrapada en un `diarios.json` viejo.
