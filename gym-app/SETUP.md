# FitForge — Setup

## 1. Crear el proyecto en Supabase

1. Ve a [supabase.com](https://supabase.com) → **New project**.
2. Anota la **Project URL** y la **anon public key** (Settings → API).
3. Abre **SQL Editor → New query**, pega el contenido de `supabase/schema.sql`, ejecuta.

## 2. Habilitar Google OAuth

1. **Supabase Dashboard → Authentication → Providers → Google → Enable**.
2. Necesitas un **Client ID** y **Client Secret** de Google Cloud:
   - [console.cloud.google.com](https://console.cloud.google.com) → **APIs & Services → Credentials → Create credentials → OAuth client ID**.
   - Application type: **Web application**.
   - **Authorized redirect URIs**: copia la URL que te muestra Supabase (algo como `https://<tu-ref>.supabase.co/auth/v1/callback`).
3. Pega el Client ID y Secret en Supabase → Save.
4. **Supabase Dashboard → Authentication → URL Configuration**:
   - Site URL: `http://localhost:3000` (en producción cambia por tu dominio).
   - Redirect URLs: añade `http://localhost:3000/auth/callback`.

## 3. Variables de entorno

Crea `.env.local` en la raíz de `gym-app/`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<tu-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<tu-anon-key>
```

## 4. Correr la app

```bash
cd gym-app
npm install
npm run dev
```

Abre `http://localhost:3000`. La primera vez te pedirá registrarte o iniciar sesión.

## 5. ¿Y los datos del localStorage anterior?

La app ya **no usa localStorage**. Todo vive en Supabase y queda asociado a tu cuenta. Los datos antiguos del navegador pueden borrarse (o quedarse, no se leen).

## 6. Deploy

- Vercel: importa el repo, define las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en el dashboard, despliega.
- Después actualiza **Site URL** y **Redirect URLs** en Supabase con tu dominio de producción.
