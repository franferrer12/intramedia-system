# Intra Media - App Móvil para DJs

Aplicación móvil React Native (Expo) para que los DJs puedan gestionar sus solicitudes, ver eventos y administrar su perfil.

## 🚀 Características

- **Autenticación JWT**: Login seguro compartido con el backend principal
- **Solicitudes**: Los DJs pueden crear y gestionar sus solicitudes
- **Eventos**: Vista de calendario con todos los eventos asignados
- **Perfil**: Información personal y estadísticas del DJ
- **Notificaciones**: Sistema de notificaciones push (FCM)
- **Diseño Moderno**: UI/UX nativa con Expo y React Navigation

## 📱 Tecnologías

- React Native con Expo SDK 51
- React Navigation 6 (Stack + Bottom Tabs)
- Axios para llamadas API
- AsyncStorage para almacenamiento local
- Expo Notifications para push notifications
- Ionicons para iconografía

## 🛠️ Instalación

### Prerrequisitos

- Node.js 18+ y npm
- Expo CLI: `npm install -g expo-cli`
- Expo Go app en tu dispositivo móvil (iOS/Android)

### Pasos

1. Instalar dependencias:
```bash
cd mobile-app
npm install
```

2. Configurar la URL del backend:
Edita `src/services/api.js` y cambia `API_BASE_URL`:
```javascript
const API_BASE_URL = 'http://TU_IP_LOCAL:3001/api'; // Para desarrollo
// const API_BASE_URL = 'https://tu-backend.com/api'; // Para producción
```

**Nota**: Para testing en dispositivo físico, usa tu IP local (no localhost):
```javascript
const API_BASE_URL = 'http://192.168.1.100:3001/api';
```

3. Iniciar el servidor de desarrollo:
```bash
npm start
```

4. Abrir en tu dispositivo:
- Escanea el código QR con Expo Go (Android) o Camera (iOS)
- O presiona `a` para Android emulator, `i` para iOS simulator

## 📂 Estructura del Proyecto

```
mobile-app/
├── App.js                      # Punto de entrada
├── index.js                    # Registro raíz
├── app.json                    # Configuración Expo
├── src/
│   ├── screens/               # Pantallas principales
│   │   ├── LoginScreen.js
│   │   ├── RequestsScreen.js
│   │   ├── CreateRequestScreen.js
│   │   ├── EventsScreen.js
│   │   └── ProfileScreen.js
│   ├── components/            # Componentes reutilizables
│   ├── navigation/            # Configuración de navegación
│   │   └── AppNavigator.js
│   ├── contexts/              # Contextos React
│   │   └── AuthContext.js
│   └── services/              # Servicios y API
│       └── api.js
└── assets/                    # Imágenes e iconos

```

## 🔐 Autenticación

La app usa el mismo sistema JWT del backend principal:

1. El usuario inicia sesión con email y contraseña
2. El backend devuelve un token JWT
3. El token se almacena en AsyncStorage
4. Todas las peticiones incluyen el token en el header Authorization

## 📊 Endpoints Utilizados

```
POST   /api/auth/login          - Login
GET    /api/auth/me             - Verificar sesión
GET    /api/requests            - Listar solicitudes
POST   /api/requests            - Crear solicitud
GET    /api/eventos             - Listar eventos
GET    /api/djs/:id             - Perfil del DJ
GET    /api/djs/:id/stats       - Estadísticas del DJ
```

## 🎨 Pantallas

### 1. Login
- Formulario de email y contraseña
- Validación de campos
- Manejo de errores

### 2. Solicitudes (Requests)
- Lista de todas las solicitudes del DJ
- Filtros por estado (pendiente, aprobada, rechazada, etc.)
- Pull to refresh
- Botón flotante para crear nueva solicitud

### 3. Crear Solicitud
- Formulario con título, descripción y prioridad
- Validación en tiempo real
- Contador de caracteres

### 4. Eventos
- Calendario de eventos asignados
- Información detallada (fecha, hora, local, precio)
- Estados visuales (próximo, programado, finalizado)

### 5. Perfil
- Información del DJ
- Estadísticas (eventos, solicitudes, ingresos)
- Configuración y logout

## 🔔 Notificaciones Push

El sistema de notificaciones está configurado pero requiere:

1. Configurar Firebase Cloud Messaging (FCM)
2. Añadir credenciales en `app.json`
3. Implementar el servicio de notificaciones en el backend

## 🧪 Testing

```bash
# Testing en iOS Simulator
npm run ios

# Testing en Android Emulator
npm run android

# Testing en Web
npm run web
```

## 📦 Build para Producción

### Android APK
```bash
eas build --platform android --profile preview
```

### iOS IPA
```bash
eas build --platform ios --profile preview
```

## 🔄 Integración con Backend

La app se conecta al backend Express.js en puerto 3001. Asegúrate de que:

1. El backend esté corriendo: `cd backend && npm run dev`
2. La base de datos PostgreSQL esté activa
3. Las variables de entorno estén configuradas

## 🐛 Troubleshooting

### "Network Error" al hacer login
- Verifica que el backend esté corriendo
- Usa tu IP local en vez de localhost
- Verifica que no haya firewall bloqueando el puerto 3001

### "Cannot connect to Metro"
```bash
# Limpia caché y reinicia
expo start -c
```

### Problemas con dependencias
```bash
# Limpia node_modules y reinstala
rm -rf node_modules package-lock.json
npm install
```

## 📝 Notas Adicionales

- El sistema comparte la misma base de datos PostgreSQL que el backend web
- Los JWT tokens son compatibles entre la app móvil y el backoffice web
- La app funciona offline con AsyncStorage para caché básico

## 🚧 Próximas Mejoras

- [ ] Notificaciones push reales con FCM
- [ ] Modo offline completo con caché
- [ ] Edición de perfil desde la app
- [ ] Chat integrado con managers
- [ ] Galería de fotos de eventos
- [ ] Estadísticas detalladas con gráficos

## 📄 Licencia

Uso interno - Intra Media System

## 👥 Contacto

Para soporte técnico contactar al equipo de desarrollo.
