# Guía de Despliegue en GitHub Pages

Esta guía te ayudará a subir tu aplicación Blazor a GitHub y configurar el despliegue automático.

## 1. Crea el Repositorio en GitHub

1.  Ve a [github.com/new](https://github.com/new).
2.  Ponle un nombre a tu repositorio (ej. `app-music`).
3.  **No** inicialices con README, .gitignore ni licencia (ya los hemos creado localmente).
4.  Haz clic en **Create repository**.

## 2. Vincula tu Proyecto Local con GitHub

Copia los comandos que te da GitHub, o ejecuta estos en tu terminal (reemplaza `TU_USUARIO` y `TU_REPO`):

```bash
# Cambiar el nombre de la rama a main (estándar actual)
git branch -M main

# Añadir el repositorio remoto
git remote add origin https://github.com/TU_USUARIO/TU_REPO.git

# Añadir todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: Configuración de despliegue en GH Pages"

# Subir a GitHub
git push -u origin main
```

## 3. Configura GitHub Pages

Una vez que hayas subido el código:

1.  En tu repositorio en GitHub, ve a **Settings** > **Pages**.
2.  En **Build and deployment** > **Source**, asegúrate de que esté seleccionado **Deploy from a branch**.
3.  En **Branch**, selecciona `gh-pages` (esta rama se creará automáticamente la primera vez que se ejecute el "Action") y la carpeta `/ (root)`.
4.  Dale a **Save**.

## 4. Notas Importantes

### El "404 Hack"
GitHub Pages no soporta nativamente aplicaciones SPA (Single Page Applications). Si navegas a una ruta secundaria (ej: `/musica`) y recargas la página, GitHub te dará un error 404.
Para solucionar esto, hemos implementado:
-   Un archivo `404.html` que redirige a `index.html`.
-   Un script en `index.html` que recupera la ruta original.

### Base Href
El archivo de configuración de GitHub Actions (`.github/workflows/deploy.yml`) se encarga automáticamente de cambiar el `<base href="/" />` por el nombre de tu repositorio (ej: `<base href="/app-music/" />`). No necesitas cambiarlo manualmente en tu código local.

### Dominio Personalizado
Si decides usar un dominio personalizado (ej. `www.mitu-musica.com`), deberás:
1.  Configurar el dominio en GitHub Settings.
2.  Modificar el workflow para que NO cambie el `base href`, ya que en dominios personalizados la raíz es `/`.

---
¡Listo! Una vez que hagas el `git push`, ve a la pestaña **Actions** en GitHub para ver el progreso de tu despliegue.
