# Finanzas Personales

Aplicación React para administrar ingresos en USD, conversiones a CRC, gastos fijos, pagos planeados, gastos reales y ahorro por quincena.

## Desarrollo

```bash
npm install
npm run dev
```

## Verificación

```bash
npm test
npm run build
```

## Base de datos

El esquema PostgreSQL está en `supabase/migrations`. La aplicación continúa funcionando localmente hasta que se configuren Supabase Auth y las variables de `.env.example`.

La arquitectura y el proceso de activación están documentados en `docs/database.md`.

## Publicación gratuita

El proyecto incluye `.github/workflows/deploy-pages.yml` para publicarse automáticamente en GitHub Pages cada vez que se actualiza la rama `main`.

Antes de la primera publicación:

1. Crear un repositorio público en GitHub y subir este proyecto.
2. Agregar los secretos `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en **Settings > Secrets and variables > Actions**.
3. Elegir **GitHub Actions** en **Settings > Pages > Build and deployment > Source**.
4. Copiar la dirección publicada en Supabase, dentro de **Authentication > URL Configuration**, tanto en **Site URL** como en **Redirect URLs**.

El flujo calcula automáticamente la ruta del repositorio y la usa como retorno de las confirmaciones de correo. `.env.local`, la contraseña de PostgreSQL y cualquier clave privada permanecen fuera del repositorio.
