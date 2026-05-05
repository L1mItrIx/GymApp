# Dockerfile para compilar APK de Android (Expo / React Native)
# Salida: android/app/build/outputs/apk/debug/app-debug.apk
FROM eclipse-temurin:17-jdk-jammy

ENV DEBIAN_FRONTEND=noninteractive \
    ANDROID_HOME=/opt/android-sdk \
    ANDROID_SDK_ROOT=/opt/android-sdk \
    NODE_VERSION=20.x \
    GRADLE_OPTS="-Dorg.gradle.daemon=false -Xmx4g"

# --- Dependencias base ---
RUN apt-get update && apt-get install -y --no-install-recommends \
        curl unzip git bash ca-certificates wget python3 build-essential \
    && rm -rf /var/lib/apt/lists/*

# --- Node 20 ---
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# --- Android command-line tools ---
RUN mkdir -p ${ANDROID_HOME}/cmdline-tools \
    && cd ${ANDROID_HOME}/cmdline-tools \
    && wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip -O tools.zip \
    && unzip -q tools.zip \
    && mv cmdline-tools latest \
    && rm tools.zip

ENV PATH="${PATH}:${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${ANDROID_HOME}/emulator"

# --- SDK packages (acepta licencias e instala lo necesario para RN/Expo) ---
RUN yes | sdkmanager --licenses > /dev/null \
    && sdkmanager --install \
        "platform-tools" \
        "platforms;android-34" \
        "platforms;android-35" \
        "build-tools;34.0.0" \
        "build-tools;35.0.0" \
        "ndk;26.1.10909125" \
        "cmake;3.22.1"

WORKDIR /app

# Cache de deps node
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi

# Resto del proyecto
COPY . .

# Si el proyecto Expo no tiene la carpeta android lista, regenerarla
# (comenta esta línea si tu carpeta android ya está bien configurada)
# RUN npx expo prebuild --platform android --no-install

# Compilar APK debug por defecto. Cambia a assembleRelease si quieres release.
WORKDIR /app/android
RUN chmod +x ./gradlew || true

CMD ["./gradlew", "assembleDebug", "--no-daemon", "--stacktrace"]
