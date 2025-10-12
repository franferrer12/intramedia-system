# 🔗 Sistema de Vinculación POS - Diseño Optimizado

**Problema Identificado:** Railway WAF bloquea autenticación directa con UUID/PIN
**Solución:** Vinculación desde backoffice con tokens temporales + QR Code

---

## 🎯 Nueva Arquitectura de Vinculación

### Flujo Completo

```
┌────────────────────────────────────────────────────────────────┐
│                    BACKOFFICE (Admin/Gerente)                   │
│                                                                 │
│  1. Admin crea/edita dispositivo POS                           │
│  2. Sistema genera TOKEN DE EMPAREJAMIENTO temporal (1 hora)  │
│  3. Admin puede:                                               │
│     - Mostrar QR Code en pantalla                             │
│     - Copiar enlace directo                                    │
│     - Enviar por email/WhatsApp                               │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
            TOKEN: eyJ1dWlkIjoi...IiwiZXhwIjoxNzYwMzEyMDAwfQ
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    TERMINAL POS (Dispositivo)                   │
│                                                                 │
│  OPCIÓN A: Escanear QR Code                                   │
│     - Cámara del dispositivo escanea QR                       │
│     - Extrae token del QR                                     │
│     - Envía token a /api/dispositivos-pos/vincular-por-token │
│                                                                 │
│  OPCIÓN B: Enlace Directo                                     │
│     - Admin abre enlace en navegador del dispositivo          │
│     - URL: /pos-terminal/pair?token=eyJ1dWlk...              │
│     - Automáticamente vincula y guarda credenciales           │
│                                                                 │
│  OPCIÓN C: Código Manual                                      │
│     - Admin dicta código corto (6 dígitos): 842-931           │
│     - Empleado ingresa en terminal                            │
│     - Sistema busca token asociado                            │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
                              ↓
┌────────────────────────────────────────────────────────────────┐
│                    VINCULACIÓN EXITOSA                          │
│                                                                 │
│  1. Terminal guarda en LocalStorage:                           │
│     - deviceUUID                                               │
│     - deviceToken (JWT de larga duración - 30 días)           │
│     - deviceConfig (categorías, permisos, etc.)               │
│                                                                 │
│  2. Terminal redirige a login con PIN                         │
│  3. Empleado ingresa PIN de 4 dígitos                         │
│  4. Sistema autentica y abre sesión POS                       │
│                                                                 │
└────────────────────────────────────────────────────────────────┘
```

---

## 📊 Base de Datos - Actualización

### Nueva columna en `dispositivos_pos`

```sql
ALTER TABLE dispositivos_pos
ADD COLUMN pairing_token VARCHAR(500),
ADD COLUMN pairing_token_expires_at TIMESTAMP,
ADD COLUMN pairing_code VARCHAR(10) UNIQUE, -- Código corto de 6-10 dígitos
ADD COLUMN asignacion_permanente BOOLEAN DEFAULT false, -- Si el dispositivo tiene empleado fijo
ADD COLUMN modo_tablet_compartida BOOLEAN DEFAULT false; -- Si varios empleados usan el dispositivo

-- Índice para búsqueda rápida por código de emparejamiento
CREATE INDEX idx_dispositivos_pos_pairing_code ON dispositivos_pos(pairing_code) WHERE pairing_code IS NOT NULL;
CREATE INDEX idx_dispositivos_pos_pairing_token_expires ON dispositivos_pos(pairing_token_expires_at) WHERE pairing_token_expires_at IS NOT NULL;

COMMENT ON COLUMN dispositivos_pos.pairing_token IS 'Token JWT temporal para vincular dispositivo (expira en 1 hora)';
COMMENT ON COLUMN dispositivos_pos.pairing_code IS 'Código corto de 6-10 caracteres para emparejamiento manual';
COMMENT ON COLUMN dispositivos_pos.asignacion_permanente IS 'Si true, el dispositivo tiene un empleado fijo asignado';
COMMENT ON COLUMN dispositivos_pos.modo_tablet_compartida IS 'Si true, varios empleados pueden usar el dispositivo con Quick Start';
```

---

## 🔑 Backend - Nuevos Endpoints

### 1. Generar Token de Emparejamiento

**Endpoint:** `POST /api/dispositivos-pos/{id}/generar-token-pairing`
**Rol:** ADMIN, GERENTE
**Request:** Ninguno
**Response:**

```json
{
  "token": "eyJ1dWlkIjoiMjVmOWViNWUtNDE0MS00NzUxLWI5MmMtZWNlNjcxNzA4YTE4IiwiZXhwIjoxNzYwMzEyMDAwfQ.ABc123...",
  "pairingCode": "842-931",
  "expiresAt": "2025-10-13T01:00:00",
  "qrCodeData": "https://club-management.app/pos-terminal/pair?token=eyJ1dWlk...",
  "directLink": "https://club-management.app/pos-terminal/pair?token=eyJ1dWlk..."
}
```

### 2. Vincular Dispositivo por Token

**Endpoint:** `POST /api/dispositivos-pos/vincular-por-token`
**Auth:** **SIN AUTENTICACIÓN** (endpoint público)
**Request:**

```json
{
  "token": "eyJ1dWlkIjoiMjVmOWViNWUtNDE0MS00NzUxLWI5MmMtZWNlNjcxNzA4YTE4IiwiZXhwIjoxNzYwMzEyMDAwfQ..."
}
```

**Response:**

```json
{
  "success": true,
  "deviceUUID": "25f9eb5e-4141-4751-b92c-ece671708a18",
  "deviceToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJkZXZpY2U6MjVmOWViNWUiLCJpYXQiOjE3NjAzMDc0NDgsImV4cCI6MTc2MjkwMDAwMH0...", // Token de 30 días
  "device": {
    "id": 5,
    "uuid": "25f9eb5e-4141-4751-b92c-ece671708a18",
    "nombre": "Caja Principal",
    "tipo": "CAJA",
    "ubicacion": "Entrada",
    "config": {
      "categoriasPredeterminadas": ["BEBIDAS", "SNACKS"],
      "tieneLectorBarras": true,
      "permisos": { "puede_descuentos": false }
    }
  }
}
```

### 3. Vincular por Código Corto

**Endpoint:** `POST /api/dispositivos-pos/vincular-por-codigo`
**Auth:** **SIN AUTENTICACIÓN**
**Request:**

```json
{
  "pairingCode": "842-931"
}
```

**Response:** Igual que vincular por token

### 4. Vincular con Quick Start (Empleado)

**Endpoint:** `POST /api/dispositivos-pos/vincular-quick-start`
**Auth:** **SIN AUTENTICACIÓN**
**Request:**

```json
{
  "employeeIdentifier": "empleado@club.com" // Email o DNI
}
```

**Response:**

```json
{
  "success": true,
  "deviceUUID": "auto-generated-uuid",
  "deviceToken": "...",
  "device": {
    "id": 10,
    "uuid": "auto-generated",
    "nombre": "Terminal Temporal - Maria García",
    "tipo": "MOVIL",
    "empleadoAsignadoId": 15,
    "temporal": true
  },
  "employee": {
    "id": 15,
    "nombre": "Maria García",
    "rol": "ENCARGADO"
  }
}
```

---

## 🎨 Frontend - Backoffice

### Componente: `DevicePairingModal.tsx`

```tsx
import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, QrCode, Link, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Props {
  device: DispositivoPOS;
  open: boolean;
  onClose: () => void;
}

export function DevicePairingModal({ device, open, onClose }: Props) {
  const [pairingData, setPairingData] = useState<PairingData | null>(null);
  const [loading, setLoading] = useState(false);

  const generatePairingToken = async () => {
    setLoading(true);
    try {
      const data = await dispositivosPosApi.generarTokenPairing(device.id);
      setPairingData(data);
      toast.success('Token de emparejamiento generado');
    } catch (error) {
      toast.error('Error generando token');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const shareViaWhatsApp = () => {
    const message = `Vincula tu terminal POS "${device.nombre}":\n\n` +
      `Código: ${pairingData?.pairingCode}\n` +
      `O abre este enlace: ${pairingData?.directLink}\n\n` +
      `El enlace expira en 1 hora.`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Vincular Dispositivo: {device.nombre}</DialogTitle>
        </DialogHeader>

        {!pairingData ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <p className="text-muted-foreground text-center">
              Genera un código de emparejamiento temporal para vincular este dispositivo
            </p>
            <Button onClick={generatePairingToken} loading={loading}>
              Generar Código de Emparejamiento
            </Button>
          </div>
        ) : (
          <Tabs defaultValue="qr">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="qr">
                <QrCode className="mr-2 h-4 w-4" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="link">
                <Link className="mr-2 h-4 w-4" />
                Enlace
              </TabsTrigger>
              <TabsTrigger value="code">
                <MessageSquare className="mr-2 h-4 w-4" />
                Código
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="flex flex-col items-center gap-4">
              <div className="bg-white p-8 rounded-lg shadow-sm">
                <QRCodeSVG
                  value={pairingData.qrCodeData}
                  size={300}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Escanea este código desde la cámara del dispositivo POS
              </p>
              <p className="text-xs text-red-500">
                Expira en: {new Date(pairingData.expiresAt).toLocaleString()}
              </p>
            </TabsContent>

            <TabsContent value="link" className="flex flex-col gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Enlace Directo</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={pairingData.directLink}
                    readOnly
                    className="flex-1 px-3 py-2 border rounded-md bg-gray-50 text-sm"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => copyToClipboard(pairingData.directLink)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Abre este enlace en el navegador del dispositivo para vincularlo automáticamente
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => copyToClipboard(pairingData.directLink)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  Copiar Enlace
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={shareViaWhatsApp}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar por WhatsApp
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="code" className="flex flex-col items-center gap-4">
              <div className="text-center space-y-2">
                <label className="text-sm font-medium">Código de Emparejamiento</label>
                <div className="text-6xl font-bold tracking-widest text-primary">
                  {pairingData.pairingCode}
                </div>
                <p className="text-sm text-muted-foreground">
                  Ingresa este código manualmente en el dispositivo
                </p>
              </div>

              <Button
                variant="outline"
                onClick={() => copyToClipboard(pairingData.pairingCode)}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copiar Código
              </Button>

              <p className="text-xs text-red-500">
                Expira en: {new Date(pairingData.expiresAt).toLocaleString()}
              </p>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
}
```

---

## 📱 Frontend - Terminal POS

### Página: `/pos-terminal/pair`

```tsx
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, XCircle, QrCode, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { dispositivosPosApi } from '@/api/dispositivos-pos.api';

export function PosTerminalPairPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'idle' | 'pairing' | 'success' | 'error'>('idle');
  const [method, setMethod] = useState<'qr' | 'code' | 'link'>('link');
  const [pairingCode, setPairingCode] = useState('');

  // Si viene token en la URL, vincular automáticamente
  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      setMethod('link');
      pairByToken(token);
    }
  }, [searchParams]);

  const pairByToken = async (token: string) => {
    setStatus('pairing');
    try {
      const result = await dispositivosPosApi.vincularPorToken({ token });

      // Guardar en localStorage
      localStorage.setItem('deviceUUID', result.deviceUUID);
      localStorage.setItem('deviceToken', result.deviceToken);
      localStorage.setItem('deviceConfig', JSON.stringify(result.device.config));

      setStatus('success');
      toast.success(`Dispositivo "${result.device.nombre}" vinculado correctamente`);

      // Redirigir al login después de 2 segundos
      setTimeout(() => {
        navigate('/pos-terminal/login');
      }, 2000);

    } catch (error) {
      setStatus('error');
      toast.error('Error al vincular dispositivo');
    }
  };

  const pairByCode = async () => {
    if (!pairingCode.trim()) {
      toast.error('Ingresa el código de emparejamiento');
      return;
    }

    setStatus('pairing');
    try {
      const result = await dispositivosPosApi.vincularPorCodigo({ pairingCode });

      localStorage.setItem('deviceUUID', result.deviceUUID);
      localStorage.setItem('deviceToken', result.deviceToken);
      localStorage.setItem('deviceConfig', JSON.stringify(result.device.config));

      setStatus('success');
      toast.success(`Dispositivo "${result.device.nombre}" vinculado correctamente`);

      setTimeout(() => {
        navigate('/pos-terminal/login');
      }, 2000);

    } catch (error) {
      setStatus('error');
      toast.error('Código inválido o expirado');
    }
  };

  const startQRScan = () => {
    // Iniciar cámara para escanear QR
    setMethod('qr');
    // Implementar con react-qr-scanner o similar
  };

  if (status === 'pairing') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-16 w-16 animate-spin text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Vinculando dispositivo...</h2>
          <p className="text-gray-400">Por favor espera</p>
        </div>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <CheckCircle2 className="h-24 w-24 text-green-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">¡Vinculación exitosa!</h2>
          <p className="text-gray-400 mb-4">Redirigiendo al login...</p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-center">
          <XCircle className="h-24 w-24 text-red-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Error en la vinculación</h2>
          <p className="text-gray-400 mb-6">El código puede haber expirado o ser inválido</p>
          <Button onClick={() => setStatus('idle')}>
            Intentar nuevamente
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 p-8">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-8">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          Vincular Terminal POS
        </h1>

        <div className="space-y-4">
          <Button
            variant="outline"
            className="w-full h-20 text-lg"
            onClick={startQRScan}
          >
            <QrCode className="mr-3 h-8 w-8" />
            Escanear Código QR
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-600" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-gray-800 px-2 text-gray-400">O ingresa el código</span>
            </div>
          </div>

          <div className="space-y-2">
            <Input
              type="text"
              placeholder="Código de emparejamiento (ej: 842-931)"
              value={pairingCode}
              onChange={(e) => setPairingCode(e.target.value)}
              className="h-14 text-lg text-center tracking-widest"
              maxLength={10}
            />
            <Button
              onClick={pairByCode}
              className="w-full h-14 text-lg"
              disabled={!pairingCode.trim()}
            >
              <Keyboard className="mr-2 h-6 w-6" />
              Vincular con Código
            </Button>
          </div>
        </div>

        <div className="mt-8 text-center text-sm text-gray-400">
          <p>Solicita un código de emparejamiento a tu administrador</p>
        </div>
      </div>
    </div>
  );
}
```

---

## 🚀 Ventajas de este Diseño

### ✅ Seguridad
1. **Tokens temporales** (1 hora de expiración)
2. **No expone UUIDs ni PINs** en requests
3. **Tokens de dispositivo** de larga duración (30 días) se renuevan automáticamente
4. **Auditoría completa** de todas las vinculaciones

### ✅ Usabilidad
1. **Tres formas de vincular**: QR, enlace directo, código manual
2. **Sin necesidad de escribir UUIDs** largos
3. **Proceso guiado** paso a paso
4. **Mobile-friendly** (funciona en tablets/móviles)

### ✅ Escalabilidad
1. **No depende de Railway WAF** - usa tokens generados en backend
2. **Funciona offline** después de vinculación inicial
3. **Múltiples dispositivos** pueden vincularse simultáneamente
4. **Quick Start** para empleados sin dispositivo asignado

### ✅ Flexibilidad
1. **Asignación permanente**: Dispositivo fijo con empleado fijo (ej: Caja Principal → María)
2. **Tablet compartida**: Varios empleados usan el mismo dispositivo
3. **Quick Start**: Empleado sin dispositivo genera uno temporal con su email/DNI

---

## 📝 Próximos Pasos

### Prioridad Alta
1. ✅ Implementar backend endpoints de vinculación
2. ✅ Crear `DevicePairingModal` en backoffice
3. ✅ Crear `/pos-terminal/pair` page
4. ✅ Integrar QR Code generator/scanner
5. ✅ Testing completo del flujo

### Prioridad Media
6. ✅ Implementar Quick Start para empleados
7. ✅ Auto-renovación de tokens de dispositivo
8. ✅ Panel de dispositivos vinculados en backoffice

### Prioridad Baja
9. ✅ Notificaciones push de vinculación
10. ✅ Analytics de uso por dispositivo

---

**Documento creado:** 13 Octubre 2025
**Estado:** Diseño completo - Listo para implementación
**Estimación:** 2-3 días de desarrollo
