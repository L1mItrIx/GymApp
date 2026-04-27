# FitForge — GymApp

Monorepo con dos proyectos:

- [`gym-app/`](./gym-app) — **Web** (Next.js 16 + React 19 + Tailwind v4 + Supabase).
- [`gym-app-mobile/`](./gym-app-mobile) — **Android nativo** (Expo SDK 54 + React Native + NativeWind).

Ambos comparten la lógica de dominio (catálogo de ejercicios, MEV/MAV/MRV, optimización de agenda).

## Setup rápido

### 1. Backend — Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → pega el contenido de [`gym-app/supabase/schema.sql`](./gym-app/supabase/schema.sql) → **Run**.
3. **Authentication → Providers → Google** → habilita y pega Client ID/Secret de Google Cloud (instrucciones en [`gym-app/SETUP.md`](./gym-app/SETUP.md)).
4. **Project Settings → API Keys** → copia la *publishable / anon key*.

### 2. Web

```bash
cd gym-app
cp .env.local.example .env.local
# edita .env.local con tu URL y anon key de Supabase
npm install
npm run dev
```

Abre `http://localhost:3000`.

### 3. Mobile (Android)

Requisitos: Android Studio + JDK 17 + emulador o dispositivo físico.

```bash
cd gym-app-mobile
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
npx expo run:android
```

La primera compilación tarda 5-15 minutos (Gradle).

> Mobile usa Supabase con AsyncStorage como adaptador de sesión.

## Estructura

```
Proyecto/
├── gym-app/              # Next.js web
│   ├── app/              # Rutas (App Router)
│   ├── components/       # UI
│   ├── lib/              # types, exercises, muscles, volume, optimization, templates
│   ├── lib/supabase/     # Cliente y proxy de Supabase
│   ├── supabase/schema.sql  # Esquema completo de la DB
│   └── SETUP.md          # Instrucciones detalladas
├── gym-app-mobile/       # Expo / RN
│   ├── app/              # Rutas (Expo Router)
│   ├── components/       # UI nativa
│   └── lib/              # Misma lógica de dominio
└── .gitignore
```

## Funcionalidades principales (web)

- Auth con email/contraseña y Google OAuth (Supabase).
- **Agenda semanal persistente** Lun→Dom (no se cambia cada semana).
- **Plantillas** Push/Pull/Legs, Upper/Lower, Full Body — o crea la tuya desde cero.
- **Optimización**: descanso ≥ 48 h por músculo, frecuencia 2 recomendada, distribución equilibrada del volumen, puntaje 0-100.
- **Logging por sesión**: calendario, registra peso/reps/RIR (todo opcional), comparación con últimas 3 sesiones del mismo ejercicio.
