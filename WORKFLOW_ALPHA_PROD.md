# 🚀 Workflow Alpha + Producción

Sistema de dos entornos para evitar romper producción durante el desarrollo.

## 📋 Tabla de Contenidos

- [Resumen Rápido](#resumen-rápido)
- [Arquitectura](#arquitectura)
- [Configuración Inicial](#configuración-inicial)
- [Workflow Diario](#workflow-diario)
- [Comandos Útiles](#comandos-útiles)
- [Troubleshooting](#troubleshooting)

---

## ⚡ Resumen Rápido

```bash
# Desarrollo diario (trabaja en develop)
git checkout develop
# ... hacer cambios ...
./scripts/deploy-to-alpha.sh "feat: nueva funcionalidad"

# Cuando Alpha funcione bien, promover a Producción
./scripts/promote-to-production.sh
```

---

## 🏗️ Arquitectura

### Dos Ramas Git:

| Rama | Propósito | Deploy Automático |
|------|-----------|-------------------|
| **develop** | Desarrollo activo, features nuevas | → ALPHA |
| **main** | Código estable y probado | → PRODUCCIÓN |

### Dos Entornos en Render:

#### ALPHA (Staging)
- **Backend**: `club-management-backend-alpha.onrender.com`
- **Frontend**: `club-management-frontend-alpha.onrender.com`
- **Rama**: `develop`
- **Propósito**: Probar features antes de producción

#### PRODUCCIÓN
- **Backend**: `club-management-backend-tw9f.onrender.com`
- **Frontend**: `club-management-frontend.onrender.com`
- **Rama**: `main`
- **Propósito**: Servicio estable para usuarios finales

### Base de Datos:

**Compartida entre Alpha y Producción** (plan gratuito):
- ⚠️ Datos mezclados entre entornos
- ✅ Gratis
- 💡 Para separar BDs: $7/mes adicional

---

## 🔧 Configuración Inicial

### Paso 1: Crear Servicios Alpha en Render

1. Ve a https://dashboard.render.com
2. Haz clic en **"New +"** → **"Blueprint"**
3. Conecta tu repositorio: `franferrer12/club-management`
4. Selecciona el archivo: **`render.alpha.yaml`**
5. Dale un nombre al blueprint: "Club Management Alpha"
6. Haz clic en **"Apply"**

Render creará automáticamente:
- ✅ `club-management-backend-alpha`
- ✅ `club-management-frontend-alpha`

### Paso 2: Configurar Branch Filters

Para cada servicio **ALPHA**:
1. Ve a **Settings** del servicio
2. En **Branch**: Selecciona `develop`
3. En **Auto-Deploy**: Activa "Yes"
4. Guarda cambios

Para cada servicio **PRODUCCIÓN** (ya existentes):
1. Ve a **Settings** del servicio
2. En **Branch**: Selecciona `main`
3. En **Auto-Deploy**: Activa "Yes"
4. Guarda cambios

---

## 💼 Workflow Diario

### Opción 1: Usando Scripts Helper (Recomendado)

```bash
# 1. Desarrollar en develop
git checkout develop

# 2. Hacer cambios
# ... editar código ...

# 3. Deployar a Alpha
./scripts/deploy-to-alpha.sh "feat: agregar sistema de reportes"

# 4. Esperar ~5-8 minutos y verificar Alpha
# Backend:  https://club-management-backend-alpha.onrender.com/actuator/health
# Frontend: https://club-management-frontend-alpha.onrender.com

# 5. Si todo funciona, promover a Producción
./scripts/promote-to-production.sh
```

### Opción 2: Manualmente (Sin Scripts)

```bash
# Desarrollo en develop
git checkout develop
git add .
git commit -m "feat: nueva funcionalidad"
git push origin develop
# → Se despliega automáticamente en ALPHA

# Verificar Alpha funciona bien
# Backend:  curl https://club-management-backend-alpha.onrender.com/actuator/health
# Frontend: abrir https://club-management-frontend-alpha.onrender.com

# Promover a Producción
git checkout main
git pull origin main
git merge develop
git push origin main
# → Se despliega automáticamente en PRODUCCIÓN

# Volver a develop para seguir trabajando
git checkout develop
```

---

## 🛠️ Comandos Útiles

### Verificar Estado de los Entornos

```bash
# Alpha
curl https://club-management-backend-alpha.onrender.com/actuator/health

# Producción
curl https://club-management-backend-tw9f.onrender.com/actuator/health
```

### Ver Logs en Tiempo Real

```bash
# Desde Dashboard de Render
# 1. Selecciona el servicio
# 2. Pestaña "Logs"
# 3. Activa "Live tail"
```

### Rollback de Producción

Si algo sale mal en producción:

```bash
git checkout main
git log --oneline  # Ver commits recientes
git revert <commit-hash>  # Revertir el commit problemático
git push origin main
```

O volver a un commit específico:

```bash
git checkout main
git reset --hard <commit-hash-bueno>
git push origin main --force  # ⚠️ Usar con cuidado
```

### Sincronizar develop con main

Si main tiene hotfixes que develop no tiene:

```bash
git checkout develop
git merge main
git push origin develop
```

---

## 🎯 Casos de Uso Comunes

### Caso 1: Feature Nueva

```bash
git checkout develop
# ... desarrollar feature ...
./scripts/deploy-to-alpha.sh "feat: sistema de notificaciones"
# Verificar en Alpha
./scripts/promote-to-production.sh
```

### Caso 2: Bugfix Urgente en Producción

```bash
# Opción A: Fix en main directamente (emergencia)
git checkout main
# ... arreglar bug ...
git add .
git commit -m "fix: corregir bug crítico en login"
git push origin main

# Sincronizar fix a develop
git checkout develop
git merge main
git push origin develop

# Opción B: Fix normal (usar develop primero)
git checkout develop
# ... arreglar bug ...
./scripts/deploy-to-alpha.sh "fix: corregir bug en login"
# Verificar en Alpha
./scripts/promote-to-production.sh
```

### Caso 3: Múltiples Features en Paralelo

```bash
# Feature Branch (opcional, si quieres aislar más)
git checkout develop
git checkout -b feature/reportes
# ... desarrollar ...
git checkout develop
git merge feature/reportes
./scripts/deploy-to-alpha.sh "feat: sistema de reportes"
```

---

## ❗ Troubleshooting

### Error: "Build fallando en Alpha"

1. Revisa logs en Render Dashboard
2. Verifica que compile localmente:
   ```bash
   cd backend && ./mvnw clean compile -DskipTests
   ```
3. Si falla localmente, arregla y vuelve a pushear a develop

### Error: "Alpha funciona pero Producción falla"

Posibles causas:
- Variables de entorno diferentes
- BD compartida tiene datos corruptos
- Main no tiene el código más reciente de develop

Solución:
```bash
git checkout main
git merge develop --no-ff  # Forzar merge
git push origin main
```

### Error: "Olvidé probar en Alpha y rompí Producción"

Rollback rápido:
```bash
git checkout main
git log --oneline -5
git revert <commit-malo>
git push origin main
```

### Error: "Alpha y Prod tienen datos mezclados"

Esto es normal con BD compartida. Opciones:

1. **Ignorarlo** (plan gratuito)
2. **Crear segunda BD** ($7/mes):
   - Render Dashboard → New Database
   - Actualizar `render.alpha.yaml` con nueva BD
3. **Usar Railway/Supabase gratis** para BD de Alpha

---

## 📊 Tabla de Decisiones

| Situación | Acción | Rama |
|-----------|--------|------|
| Feature nueva | `deploy-to-alpha.sh` | develop |
| Bug crítico | Fix en main + sync a develop | main |
| Refactor grande | develop → alpha → prod | develop |
| Hotfix urgente | main directo | main |
| Cambio en DB schema | develop → alpha primero | develop |

---

## 🎓 Mejores Prácticas

1. **SIEMPRE** probar en Alpha primero
2. **NUNCA** pushear directo a main (excepto emergencias)
3. **Verificar** health checks antes de promover
4. **Documentar** cambios en commits
5. **Sincronizar** develop con main después de hotfixes

---

## 📝 Notas Importantes

- Los deploys en Render (plan gratuito) tardan **5-8 minutos**
- Alpha y Prod comparten la BD (plan gratuito)
- Los servicios se duermen después de **15 minutos** de inactividad
- El primer request después de sleep tarda **~50 segundos**

---

## 🆘 Ayuda

Si tienes problemas:

1. Revisa los logs en Render Dashboard
2. Verifica health checks de ambos entornos
3. Consulta este documento
4. Revisa TROUBLESHOOTING.md (si existe)

---

**Última actualización**: 2025-10-18
**Autor**: Claude Code + franferrer
