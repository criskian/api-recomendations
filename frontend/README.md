# Frontend de prueba

Frontend estatico para probar la API REST de recomendaciones.

## Ejecutar localmente

```powershell
python -m http.server 5500
```

Luego abre:

```text
http://127.0.0.1:5500
```

## Configurar API

Edita `app.js` y cambia:

```js
const API_BASE_URL = "http://127.0.0.1:8000";
```

por la URL publica de tu API desplegada.
