# 🔧 Instalación de Requisitos para Testing Local

## ❌ Problema Detectado

Tu sistema macOS **no tiene los requisitos necesarios** para ejecutar el backend Java:
- ❌ Java JDK 17+ no instalado
- ❌ Maven no instalado
- ❌ Homebrew no instalado (gestor de paquetes recomendado para macOS)

## ✅ Solución: Instalar Requisitos

### Opción 1: Instalar Homebrew + Java (RECOMENDADO)

Homebrew es el gestor de paquetes estándar para macOS que facilita la instalación de software.

#### Paso 1: Instalar Homebrew

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

#### Paso 2: Instalar Java 17 (OpenJDK)

```bash
brew install openjdk@17
```

#### Paso 3: Configurar Java en PATH

```bash
# Agregar a ~/.zshrc o ~/.bash_profile
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc

# Recargar configuración
source ~/.zshrc
```

#### Paso 4: Verificar instalación

```bash
java -version
# Debe mostrar: openjdk version "17.x.x"
```

#### Paso 5: Ejecutar testing local

```bash
cd /Users/franferrer/workspace/club-management
./start-local.sh
```

---

### Opción 2: Descargar Java Manualmente

Si no quieres usar Homebrew:

#### Paso 1: Descargar JDK 17

Ir a: https://adoptium.net/temurin/releases/?version=17

Descargar: **macOS / aarch64 (Apple Silicon)** o **x64 (Intel)** según tu Mac

#### Paso 2: Instalar el .pkg descargado

Hacer doble clic en el archivo `.pkg` y seguir el asistente.

#### Paso 3: Verificar instalación

```bash
java -version
# Debe mostrar: openjdk version "17.x.x"
```

#### Paso 4: Ejecutar testing local

```bash
cd /Users/franferrer/workspace/club-management
./start-local.sh
```

---

### Opción 3: Solo Testing de Frontend (sin Java)

Si **solo quieres probar el frontend** (sin backend local), puedes:

```bash
cd /Users/franferrer/workspace/club-management/frontend
npm install
npm run dev
```

**Limitación**: El frontend se conectará al backend de **producción** (Railway), no a uno local.

---

## 🔍 Verificar qué tienes instalado

```bash
# Verificar Java
java -version

# Verificar Maven (opcional si usas mvnw)
mvn -version

# Verificar Homebrew
brew --version

# Verificar Node.js (para frontend)
node -version

# Verificar npm
npm -version

# Verificar Docker
docker --version
```

---

## 📋 Checklist de Instalación

Antes de ejecutar `./start-local.sh`, verifica:

- [ ] Java 17+ instalado (`java -version`)
- [ ] Docker Desktop corriendo (`docker ps`)
- [ ] Node.js 18+ instalado (`node -v`)
- [ ] npm instalado (`npm -v`)
- [ ] Maven Wrapper presente (`ls backend/mvnw`)

---

## 🎯 Después de Instalar Java

Una vez instalado Java 17+:

```bash
cd /Users/franferrer/workspace/club-management
./start-local.sh
```

El script automáticamente:
1. ✅ Detectará Java
2. ✅ Usará Maven Wrapper (ya descargado)
3. ✅ Compilará el backend
4. ✅ Levantará PostgreSQL
5. ✅ Iniciará todo el sistema

---

## 🆘 Si Tienes Problemas

### Error: "Unable to locate a Java Runtime"
**Solución**: Instalar Java 17+ (ver Opción 1 o 2 arriba)

### Error: "JAVA_HOME not set"
```bash
# Para zsh (macOS Catalina+)
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc

# Para bash
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.bash_profile
source ~/.bash_profile
```

### Error: "mvnw: permission denied"
```bash
chmod +x /Users/franferrer/workspace/club-management/backend/mvnw
```

---

## 📞 Siguiente Paso

1. **Instala Java 17** usando Opción 1 (Homebrew) o Opción 2 (Manual)
2. **Ejecuta**: `./start-local.sh`
3. **Accede a**: http://localhost:5173/pos-dashboard

---

**Tiempo estimado de instalación**: 5-10 minutos

**¡Una vez instalado Java, el testing local funcionará perfectamente! 🚀**
