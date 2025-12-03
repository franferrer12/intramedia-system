# ⚡ Quick Start: Sistema Alpha + Producción

## 🎯 Lo Esencial en 2 Minutos

### 1. Configurar Alpha en Render (Solo UNA VEZ)

```bash
1. Ve a: https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Selecciona: franferrer12/club-management
4. Archivo: render.alpha.yaml
5. Click "Apply"
```

✅ Esto crea automáticamente:
- `club-management-backend-alpha`
- `club-management-frontend-alpha`

### 2. Workflow Diario

```bash
# En develop (desarrollo)
./scripts/deploy-to-alpha.sh "feat: mi nueva funcionalidad"

# Esperar 5-8 min, verificar Alpha funcione bien
# Luego promover a Producción:
./scripts/promote-to-production.sh
```

## 📌 URLs

| Entorno | Backend | Frontend |
|---------|---------|----------|
| **ALPHA** | [club-management-backend-alpha.onrender.com](https://club-management-backend-alpha.onrender.com) | [club-management-frontend-alpha.onrender.com](https://club-management-frontend-alpha.onrender.com) |
| **PROD** | [club-management-backend-tw9f.onrender.com](https://club-management-backend-tw9f.onrender.com) | [club-management-frontend.onrender.com](https://club-management-frontend.onrender.com) |

## 🚨 Regla de Oro

**NUNCA pushear directo a `main`** (excepto emergencias)

**SIEMPRE**:
1. Desarrollar en `develop`
2. Deploy a Alpha
3. Verificar funcione
4. Promover a Producción

---

**Documentación completa**: Ver `WORKFLOW_ALPHA_PROD.md`
