# FitForge — GymApp

App de gimnasio que te arma una **rutina semanal persistente** (Lunes a Domingo, no se cambia cada semana) con puntaje de optimización: volumen por músculo, descanso mínimo de 48 h entre sesiones del mismo músculo, frecuencia recomendada y reparto equilibrado del volumen entre días.

Existen **dos clientes** que comparten el mismo backend (Supabase):

- [`gym-app/`](./gym-app) — **Web** (Next.js 16 + React 19 + Tailwind v4)
- [`gym-app-mobile/`](./gym-app-mobile) — **Android nativo** (Expo SDK 54 + React Native 0.81 + NativeWind)

---

## Qué hace la app

### Flujo del usuario

1. **Login** (email + contraseña con código OTP de 6 dígitos, o Google OAuth).
2. **Onboarding**: nombre, objetivo (hipertrofia / fuerza / pérdida de peso / resistencia / fitness general), experiencia, días por semana.
3. Se crea automáticamente un **plan semanal** con 7 días vacíos (todos descanso).
4. **Rutinas**: el usuario elige una plantilla validada (Push Pull Legs, Upper/Lower, Full Body, Arnold Split) o construye la suya día por día.
5. **Agenda**: editor Lunes→Domingo. Cada día puede ser:
   - **Entreno** con nombre (ej. "Push"), músculos enfocados y ejercicios prescritos (series, reps, RIR).
   - **Descanso**.
6. **Hoy**: muestra la sesión del día actual según el plan, distinguiendo visualmente entre día de entreno o descanso.
7. **Progreso**: calendario mensual donde se registran sesiones reales (peso, reps, RIR) por fecha; cada ejercicio muestra **comparación con las últimas 3 sesiones** del mismo ejercicio.
8. **Análisis**: puntaje 0-100 ponderado de la agenda completa.
9. **Ajustes**: cuenta, perfil editable, preferencias (kg/lb, inicio de semana), borrar datos, versión.

### Lógica de optimización (el "cerebro" de la app)

Implementado en [`lib/optimization.ts`](./gym-app/lib/optimization.ts) (idéntico en web y mobile, lo importan ambos):

- **Volumen semanal por músculo**: suma series asignadas como músculo principal, más 0.5× las series donde sale como secundario. Compara con landmarks **MEV / MAV / MRV** ([`lib/volume.ts`](./gym-app/lib/volume.ts)).
- **Descanso mínimo**: para cada músculo trabajado más de un día, calcula el menor hueco (en horas, cíclico Domingo→Lunes) entre dos sesiones que lo trabajen. Si es < 48 h, dispara aviso.
- **Frecuencia 2**: para los músculos grandes (pecho, espalda, lats, deltoides laterales, bíceps, tríceps, cuádriceps, femorales, glúteos), recomienda al menos 2 sesiones por semana cuando el volumen lo justifica.
- **Distribución**: coeficiente de variación (CV) de las series totales por día de entreno. Mucho CV = días desbalanceados.
- **Puntaje global**: `volumen × 0.35 + descanso × 0.30 + frecuencia × 0.20 + distribución × 0.15`. Devuelve también la lista de avisos accionables.

### Estructura de datos (Supabase)

Schema completo en [`gym-app/supabase/schema.sql`](./gym-app/supabase/schema.sql). Tablas:

- `profiles` (1:1 con auth.users)
- `plans` → `plan_days` (7 por plan, 0=Lun..6=Dom) → `plan_exercises` (la prescripción)
- `workout_sessions` (1 por usuario por fecha) → `session_exercises` → `set_logs` (peso, reps, RIR)

Todo con **Row Level Security**: cada usuario solo ve sus propias filas.

---

## Setup para colaboradores

> Si te añadieron como colaborador del proyecto en Supabase, **NO crees tu propio proyecto**. Pídele al admin las dos variables (`SUPABASE_URL` + `ANON_KEY`) por canal privado y úsalas — todos compartimos los mismos datos en desarrollo.

### Requisitos

- **Node.js 20+** (recomendado v22 o v24)
- **npm 10+**
- Para mobile además: **Android Studio**, **JDK 17** (el que viene con Android Studio en `jbr/` es suficiente), y un **emulador AVD** o un dispositivo físico con USB debugging.

### Paso 1 — Clonar

```bash
git clone https://github.com/L1mItrIx/GymApp.git
cd GymApp
```

### Paso 2 — Variables de entorno

Hay **dos archivos** que crear (gitignorados, no vienen en el pull):

**Web:**
```bash
cp gym-app/.env.local.example gym-app/.env.local
```

Editar `gym-app/.env.local` con las claves que te pasó el admin:
```
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

**Mobile:**
```bash
cp gym-app-mobile/.env.example gym-app-mobile/.env
```

Editar `gym-app-mobile/.env` (mismo URL y key, distinto prefijo):
```
EXPO_PUBLIC_SUPABASE_URL=https://...supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
```

### Paso 3 — Web

```bash
cd gym-app
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### Paso 4 — Mobile

Con el emulador encendido (verifica con `adb devices`):

```bash
cd gym-app-mobile
npm install --legacy-peer-deps
npx expo prebuild --platform android --clean
npx expo run:android
```

La **primera compilación tarda 5-15 minutos** (Gradle baja ~500 MB). Las siguientes son rápidas.

Si `java -version` no muestra 17:
- Variable de entorno `JAVA_HOME` = `C:\Program Files\Android\Android Studio\jbr`
- Añadir `%JAVA_HOME%\bin` al inicio del `Path`
- Cerrar y reabrir terminal

---

## Cómo probar (flujo recomendado de QA)

Para que sepas si todo va bien, sigue este recorrido y reporta cualquier corte:

1. **Crear cuenta** (email + contraseña) → debes recibir un código de 6 dígitos por email → introducirlo → entrar.
2. **Onboarding** → rellenar todos los campos → "Continuar".
3. **Tab Rutinas** → seleccionar **"Push / Pull / Legs"** → tocar barra inferior **"Aplicar"** → confirmar.
4. **Tab Agenda** → debe mostrar las pestañas Lun-Dom coloreadas (verde descanso, índigo entreno) con los ejercicios cargados. Probar:
   - Cambiar entre días — la lista de "Tu sesión" debe refrescarse al saltar.
   - Tocar toggle "Descanso" en un día → ejercicios se borran.
   - Tocar "Entreno" otra vez → vuelve a quedar en blanco para añadir.
   - Cambiar series/reps con los `+ -`.
5. **Tab Hoy** → debe mostrar el banner correcto según si hoy es entreno o descanso.
6. **Registrar la sesión** desde Hoy → introducir pesos/reps/RIR → guardar → volver mañana, debe mostrar comparación con sesión anterior.
7. **Tab Progreso** → calendario con el día de hoy marcado en verde si registraste.
8. **Tab Ajustes → Análisis** → debe mostrar puntaje (>80 ideal con PPL bien hecho).
9. **Cerrar sesión** desde Ajustes → volver a entrar → todo persistido.

### Lo que conviene probar de borde

- Rotar el teléfono / cambiar a dark mode del sistema (la app es siempre oscura).
- Quedarse sin conexión a media edición (debería funcionar el optimismo de UI, persistir al volver).
- Crear varias cuentas distintas con el mismo Supabase (cada una debe ver solo sus propias rutinas — RLS).
- Aplicar Arnold Split → ver si el análisis te avisa de las largas sesiones (puede saltar warning de volumen alto en biceps/triceps).

---

## Cómo aportar

1. **Branch nuevo por cambio**:
   ```bash
   git checkout -b feat/lo-que-vayas-a-hacer
   ```
2. Hacer cambios + probar local (web y/o mobile según aplique).
3. Commit con mensaje claro:
   ```bash
   git add .
   git commit -m "feat(agenda): describir lo que cambia"
   ```
4. Push y abrir Pull Request:
   ```bash
   git push -u origin feat/lo-que-vayas-a-hacer
   ```
5. En el PR: describe qué cambia, qué probaste, screenshots si es UI.

### Cosas pendientes / ideas para mejorar

- [ ] Conectar la preferencia **kg/lb** del settings al logger (`/progress/[date]`) para mostrar la unidad escogida.
- [ ] Conectar el **inicio de semana** (Lun/Dom) al calendario de progreso.
- [ ] Notificaciones: recordatorio de la sesión del día.
- [ ] Exportar historial de sesiones a CSV.
- [ ] Edición/reordenamiento de ejercicios en la agenda (drag and drop).
- [ ] Gráfica de evolución de peso por ejercicio.
- [ ] Plantillas adicionales (Bro Split, 5/3/1, GZCL).
- [ ] Modo claro.

Si encuentras un bug, abre un issue en GitHub con: pasos para reproducir, qué esperabas vs. qué pasó, plataforma (web / mobile / Android version).

---

## Estructura del repo

```
GymApp/
├── gym-app/                    Next.js web client
│   ├── app/                    Rutas (App Router)
│   │   ├── login/              Login con email+OTP / Google
│   │   ├── onboarding/         Crear perfil
│   │   ├── today/              Sesión del día
│   │   ├── agenda/             Editor semanal Lun-Dom
│   │   ├── routines/           Plantillas
│   │   ├── progress/           Calendario y logger por fecha
│   │   ├── analysis/           Puntaje de optimización
│   │   ├── profile/            Editar perfil
│   │   └── auth/callback/      OAuth callback
│   ├── components/             UI compartida (Navbar, Card, Button, etc.)
│   ├── lib/                    Lógica de dominio
│   │   ├── types.ts            Tipos
│   │   ├── exercises.ts        Catálogo (~55 ejercicios con máquina/equipo)
│   │   ├── muscles.ts          Etiquetas y categorías
│   │   ├── volume.ts           Landmarks MEV/MAV/MRV + score
│   │   ├── optimization.ts     Algoritmo de la agenda
│   │   ├── templates.ts        PPL, Upper/Lower, Full Body, Arnold
│   │   └── supabase/           Cliente browser + server + proxy
│   ├── supabase/schema.sql     Esquema completo con RLS y triggers
│   └── proxy.ts                Auth proxy (Next.js 16)
│
├── gym-app-mobile/             Expo / React Native client
│   ├── app/
│   │   ├── (auth)/login.tsx    Login con OTP / Google
│   │   ├── (app)/              Tabs (Hoy, Agenda, Rutinas, Progreso, Ajustes)
│   │   ├── onboarding.tsx
│   │   └── _layout.tsx         Stack root con AuthProvider
│   ├── components/             RN UI + AuthGate
│   ├── lib/                    Misma lógica de dominio que web
│   │   └── supabase.ts         Cliente con AsyncStorage como sesión
│   ├── tailwind.config.js      NativeWind (Tailwind para RN)
│   ├── babel.config.js
│   └── metro.config.js
│
├── .gitignore
└── README.md
```

---

## Stack técnico

| Capa | Web | Mobile |
|------|-----|--------|
| Framework | Next.js 16 (App Router, Turbopack) | Expo SDK 54 |
| UI | React 19 + Tailwind v4 | React Native 0.81 + NativeWind v4 |
| Iconos | lucide-react | @expo/vector-icons (Ionicons) |
| Auth + DB | @supabase/ssr | @supabase/supabase-js + AsyncStorage |
| Routing | App Router (file-based) | Expo Router (file-based) |
| Tipo | TypeScript estricto | TypeScript estricto |

**Backend:** Supabase free tier (Postgres + Auth + RLS).

---

## Notas importantes

- **No commitear `.env.local` ni `.env`** — están en `.gitignore` por una razón. Las claves se comparten por canal privado.
- **Datos compartidos en dev**: como compartimos el mismo proyecto Supabase, las rutinas que crees también las verá el admin (cada uno ve solo las suyas por RLS, pero la DB es la misma).
- **Mobile sin assets de icono**: por ahora la app usa el icono por defecto de Expo. Antes de publicar al Play Store hay que añadir `assets/icon.png` (1024×1024) y descomentar las referencias en `app.json`.
- **Supabase email templates**: el template de "Confirm signup" debe usar `{{ .Token }}` (no `{{ .ConfirmationURL }}`) para que el código OTP funcione. Ya está configurado en el proyecto compartido.

¿Dudas? Pregunta al admin o abre un issue.
