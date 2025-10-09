# Guía de Implementación - Sistema POS

## Checklist de Implementación

### Fase 1: Backend - Base de Datos

- [ ] **Crear migración V010__crear_tablas_pos.sql**
  - Ubicación: `backend/src/main/resources/db/migration/V010__crear_tablas_pos.sql`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 7
  - Verificar sintaxis SQL

- [ ] **Ejecutar migración**
  ```bash
  cd backend
  ./mvnw flyway:migrate
  # O simplemente iniciar la aplicación
  ./mvnw spring-boot:run
  ```

- [ ] **Verificar tablas creadas**
  ```sql
  \dt sesiones_venta
  \dt consumos_sesion
  \df actualizar_totales_sesion
  \df descontar_stock_consumo
  ```

---

### Fase 2: Backend - Entidades

- [ ] **Crear SesionVenta.java**
  - Ubicación: `backend/src/main/java/com/club/management/entity/SesionVenta.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 2.1

- [ ] **Crear ConsumoSesion.java**
  - Ubicación: `backend/src/main/java/com/club/management/entity/ConsumoSesion.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 2.2

- [ ] **Verificar imports**
  - Verificar que todos los imports estén disponibles
  - Verificar que Lombok esté configurado

---

### Fase 3: Backend - DTOs

- [ ] **Crear SesionVentaDTO.java**
  - Ubicación: `backend/src/main/java/com/club/management/dto/response/SesionVentaDTO.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 3.1

- [ ] **Crear ConsumoSesionDTO.java**
  - Ubicación: `backend/src/main/java/com/club/management/dto/response/ConsumoSesionDTO.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 3.2

- [ ] **Crear Request DTOs**
  - Ubicación: `backend/src/main/java/com/club/management/dto/request/`
  - Crear archivos:
    - `SesionVentaRequest.java`
    - `RegistrarConsumoRequest.java`
    - `CerrarSesionRequest.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 3.3

---

### Fase 4: Backend - Repositorios

- [ ] **Crear SesionVentaRepository.java**
  - Ubicación: `backend/src/main/java/com/club/management/repository/SesionVentaRepository.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 4.1

- [ ] **Crear ConsumoSesionRepository.java**
  - Ubicación: `backend/src/main/java/com/club/management/repository/ConsumoSesionRepository.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 4.2

---

### Fase 5: Backend - Servicios

- [ ] **Crear SesionVentaService.java**
  - Ubicación: `backend/src/main/java/com/club/management/service/SesionVentaService.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 5.1
  - **IMPORTANTE**: Verificar que EventoRepository exista o crear si es necesario

---

### Fase 6: Backend - Controller

- [ ] **Crear SesionVentaController.java**
  - Ubicación: `backend/src/main/java/com/club/management/controller/SesionVentaController.java`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 6.1

---

### Fase 7: Backend - Compilar y Verificar

- [ ] **Compilar backend**
  ```bash
  cd backend
  ./mvnw clean compile
  ```

- [ ] **Verificar errores de compilación**
  - Resolver imports faltantes
  - Verificar que todas las dependencias estén disponibles

- [ ] **Ejecutar tests (opcional en esta fase)**
  ```bash
  ./mvnw test
  ```

- [ ] **Iniciar backend**
  ```bash
  ./mvnw spring-boot:run
  ```

- [ ] **Verificar endpoints en Swagger**
  - Abrir: http://localhost:8080/swagger-ui/index.html
  - Buscar "sesiones-venta-controller"
  - Verificar que aparezcan todos los endpoints

---

### Fase 8: Frontend - Tipos TypeScript

- [ ] **Crear sesion-venta.types.ts**
  - Ubicación: `frontend/src/types/sesion-venta.types.ts`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 9

---

### Fase 9: Frontend - API Client

- [ ] **Crear sesiones-venta.api.ts**
  - Ubicación: `frontend/src/api/sesiones-venta.api.ts`
  - Copiar contenido de POS_SYSTEM_SPEC.md sección 10

---

### Fase 10: Frontend - Componentes Base

- [ ] **Crear directorio pos**
  ```bash
  mkdir -p frontend/src/components/pos
  mkdir -p frontend/src/pages/pos
  ```

- [ ] **Crear AbrirSesionModal.tsx**
  - Ubicación: `frontend/src/components/pos/AbrirSesionModal.tsx`
  - Ver diseño en sección 11 de este documento

- [ ] **Crear ProductoGrid.tsx**
  - Ubicación: `frontend/src/components/pos/ProductoGrid.tsx`
  - Ver diseño en sección 11 de este documento

- [ ] **Crear ConsumosList.tsx**
  - Ubicación: `frontend/src/components/pos/ConsumosList.tsx`
  - Ver diseño en sección 11 de este documento

- [ ] **Crear SesionActiva.tsx**
  - Ubicación: `frontend/src/components/pos/SesionActiva.tsx`
  - Ver diseño en sección 11 de este documento

---

### Fase 11: Frontend - Página Principal POS

- [ ] **Crear PosPage.tsx**
  - Ubicación: `frontend/src/pages/pos/PosPage.tsx`
  - Ver diseño en sección 12 de este documento

- [ ] **Crear SesionesListPage.tsx**
  - Ubicación: `frontend/src/pages/pos/SesionesListPage.tsx`
  - Página para ver historial de sesiones

---

### Fase 12: Frontend - Rutas

- [ ] **Agregar rutas en App.tsx o router**
  ```tsx
  import PosPage from '@/pages/pos/PosPage';
  import SesionesListPage from '@/pages/pos/SesionesListPage';

  // Agregar en las rutas protegidas:
  <Route path="/pos" element={<PosPage />} />
  <Route path="/sesiones" element={<SesionesListPage />} />
  ```

- [ ] **Agregar en menú de navegación**
  - Agregar ítem "POS" en el sidebar/navbar
  - Icon: puede ser ShoppingCart, CreditCard, o Store

---

### Fase 13: Testing Backend

- [ ] **Crear tests de servicio**
  - Ubicación: `backend/src/test/java/com/club/management/service/SesionVentaServiceTest.java`
  - Tests básicos:
    - Abrir sesión correctamente
    - No permitir múltiples sesiones abiertas por empleado
    - Registrar consumo descontando stock
    - Cerrar sesión actualiza totales

- [ ] **Crear tests de controller**
  - Ubicación: `backend/src/test/java/com/club/management/controller/SesionVentaControllerTest.java`
  - Tests de endpoints principales

---

### Fase 14: Testing Frontend

- [ ] **Crear tests de componentes**
  - `ProductoGrid.test.tsx`
  - `ConsumosList.test.tsx`

- [ ] **Crear tests de página**
  - `PosPage.test.tsx`

---

### Fase 15: Documentación

- [ ] **Actualizar README.md**
  - Agregar sección sobre sistema POS
  - Documentar flujo de uso

- [ ] **Crear POS_API_DOCS.md**
  - Documentar endpoints
  - Incluir ejemplos de requests/responses
  - Casos de uso comunes

---

### Fase 16: Pruebas Manuales

- [ ] **Flujo completo**
  1. Login como admin/gerente
  2. Navegar a /pos
  3. Abrir nueva sesión
  4. Buscar producto
  5. Agregar consumo (verificar stock se descuenta)
  6. Agregar más consumos
  7. Verificar totales se actualizan
  8. Cerrar sesión
  9. Verificar resumen final

- [ ] **Validaciones**
  - No se puede abrir 2 sesiones con mismo empleado
  - No se puede registrar consumo en sesión cerrada
  - No se puede registrar consumo con stock insuficiente
  - Productos inactivos no se pueden vender

---

## 11. Diseños de Componentes Frontend

### AbrirSesionModal.tsx

```tsx
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sesionesVentaApi } from '@/api/sesiones-venta.api';
import { empleadosApi } from '@/api/empleados.api';
import { eventosApi } from '@/api/eventos.api';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';

const schema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200),
  descripcion: z.string().optional(),
  empleadoId: z.number().optional(),
  eventoId: z.number().optional(),
  notas: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (sesion: any) => void;
}

export default function AbrirSesionModal({ open, onClose, onSuccess }: Props) {
  const queryClient = useQueryClient();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: `Sesión ${new Date().toLocaleDateString()}`,
    },
  });

  const { data: empleados } = useQuery({
    queryKey: ['empleados'],
    queryFn: empleadosApi.getAll,
  });

  const { data: eventos } = useQuery({
    queryKey: ['eventos', 'activos'],
    queryFn: () => eventosApi.getAll({ estado: 'ACTIVO' }),
  });

  const mutation = useMutation({
    mutationFn: sesionesVentaApi.abrirSesion,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sesiones-venta'] });
      toast.success('Sesión abierta correctamente');
      onSuccess(data);
      onClose();
      form.reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al abrir sesión');
    },
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Abrir Nueva Sesión POS</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nombre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de la sesión *</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ej: Turno noche viernes" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="empleadoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Empleado (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar empleado" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {empleados?.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id.toString()}>
                          {emp.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="eventoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Evento (opcional)</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(Number(value))}
                    value={field.value?.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar evento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {eventos?.map((evt) => (
                        <SelectItem key={evt.id} value={evt.id.toString()}>
                          {evt.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descripcion"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Abriendo...' : 'Abrir Sesión'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
```

### ProductoGrid.tsx

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productosApi } from '@/api/productos.api';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Package } from 'lucide-react';
import type { Producto } from '@/types/producto.types';

interface Props {
  onProductoClick: (producto: Producto) => void;
}

export default function ProductoGrid({ onProductoClick }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const { data: productos, isLoading } = useQuery({
    queryKey: ['productos', 'activos'],
    queryFn: () => productosApi.getAll({ activo: true }),
  });

  const productosFiltrados = productos?.filter(
    (p) =>
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      p.categoria.toLowerCase().includes(busqueda.toLowerCase())
  );

  const categorias = Array.from(
    new Set(productosFiltrados?.map((p) => p.categoria) || [])
  );

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar producto por nombre, código o categoría..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Cargando productos...
        </div>
      ) : (
        <div className="space-y-6">
          {categorias.map((categoria) => (
            <div key={categoria}>
              <h3 className="font-semibold mb-3 text-lg">{categoria}</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {productosFiltrados
                  ?.filter((p) => p.categoria === categoria)
                  .map((producto) => (
                    <Card
                      key={producto.id}
                      className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => onProductoClick(producto)}
                    >
                      <CardContent className="p-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center justify-center h-16 bg-muted rounded">
                            <Package className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm line-clamp-2">
                              {producto.nombre}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {producto.codigo}
                            </p>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-lg font-bold">
                              {producto.precioVenta.toFixed(2)}€
                            </span>
                            {producto.tipoVenta && (
                              <Badge variant="outline" className="text-xs">
                                {producto.tipoVenta}
                              </Badge>
                            )}
                          </div>
                          {producto.stockActual <= 0 ? (
                            <Badge variant="destructive" className="text-xs">
                              Sin stock
                            </Badge>
                          ) : producto.stockActual < producto.stockMinimo ? (
                            <Badge variant="secondary" className="text-xs">
                              Stock bajo
                            </Badge>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && productosFiltrados?.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No se encontraron productos
        </div>
      )}
    </div>
  );
}
```

### ConsumosList.tsx

```tsx
import { useQuery } from '@tanstack/react-query';
import { sesionesVentaApi } from '@/api/sesiones-venta.api';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface Props {
  sesionId: number;
}

export default function ConsumosList({ sesionId }: Props) {
  const { data: consumos, isLoading } = useQuery({
    queryKey: ['consumos-sesion', sesionId],
    queryFn: () => sesionesVentaApi.listarConsumosDeSesion(sesionId),
    refetchInterval: 5000, // Actualizar cada 5 segundos
  });

  if (isLoading) {
    return <div className="text-center py-4">Cargando consumos...</div>;
  }

  if (!consumos || consumos.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No hay consumos registrados aún
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Hora</TableHead>
            <TableHead>Producto</TableHead>
            <TableHead className="text-center">Cantidad</TableHead>
            <TableHead className="text-right">Precio Unit.</TableHead>
            <TableHead className="text-right">Subtotal</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {consumos.map((consumo) => (
            <TableRow key={consumo.id}>
              <TableCell className="text-sm text-muted-foreground">
                {formatDistanceToNow(new Date(consumo.fechaConsumo), {
                  addSuffix: true,
                  locale: es,
                })}
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{consumo.productoNombre}</p>
                  {consumo.tipoVenta && (
                    <Badge variant="outline" className="text-xs mt-1">
                      {consumo.tipoVenta}
                    </Badge>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-center">
                {consumo.cantidad.toFixed(0)}
              </TableCell>
              <TableCell className="text-right">
                {consumo.precioUnitario.toFixed(2)}€
              </TableCell>
              <TableCell className="text-right font-semibold">
                {consumo.subtotal.toFixed(2)}€
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

### SesionActiva.tsx

```tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Package, DollarSign } from 'lucide-react';
import type { SesionVenta } from '@/types/sesion-venta.types';

interface Props {
  sesion: SesionVenta;
}

export default function SesionActiva({ sesion }: Props) {
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{sesion.nombre}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Código: {sesion.codigo}
            </p>
            {sesion.empleadoNombre && (
              <p className="text-sm text-muted-foreground">
                Empleado: {sesion.empleadoNombre}
              </p>
            )}
          </div>
          <Badge variant="default">ABIERTA</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Duración</p>
              <p className="font-semibold">{sesion.duracionMinutos} min</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Items</p>
              <p className="font-semibold">{sesion.totalItems.toFixed(0)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="font-semibold text-lg">
                {sesion.valorTotal.toFixed(2)}€
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
```

---

## 12. Página Principal POS

### PosPage.tsx

```tsx
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sesionesVentaApi } from '@/api/sesiones-venta.api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Play, Square, Plus, Minus } from 'lucide-react';
import AbrirSesionModal from '@/components/pos/AbrirSesionModal';
import ProductoGrid from '@/components/pos/ProductoGrid';
import ConsumosList from '@/components/pos/ConsumosList';
import SesionActiva from '@/components/pos/SesionActiva';
import type { Producto } from '@/types/producto.types';
import type { SesionVenta } from '@/types/sesion-venta.types';

export default function PosPage() {
  const queryClient = useQueryClient();
  const [abrirSesionModal, setAbrirSesionModal] = useState(false);
  const [productoSeleccionado, setProductoSeleccionado] = useState<Producto | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [notasConsumo, setNotasConsumo] = useState('');
  const [cerrarSesionModal, setCerrarSesionModal] = useState(false);
  const [notasCierre, setNotasCierre] = useState('');

  const { data: sesionesAbiertas, isLoading } = useQuery({
    queryKey: ['sesiones-venta', 'abiertas'],
    queryFn: sesionesVentaApi.listarSesionesAbiertas,
    refetchInterval: 10000, // Actualizar cada 10 segundos
  });

  const sesionActiva = sesionesAbiertas?.[0];

  const registrarConsumoMutation = useMutation({
    mutationFn: (data: { sesionId: number; productoId: number; cantidad: number; notas?: string }) =>
      sesionesVentaApi.registrarConsumo(data.sesionId, {
        productoId: data.productoId,
        cantidad: data.cantidad,
        notas: data.notas,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones-venta'] });
      queryClient.invalidateQueries({ queryKey: ['consumos-sesion'] });
      queryClient.invalidateQueries({ queryKey: ['productos'] });
      toast.success('Consumo registrado correctamente');
      setProductoSeleccionado(null);
      setCantidad(1);
      setNotasConsumo('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al registrar consumo');
    },
  });

  const cerrarSesionMutation = useMutation({
    mutationFn: (data: { sesionId: number; notas?: string }) =>
      sesionesVentaApi.cerrarSesion(data.sesionId, { notas: data.notas }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sesiones-venta'] });
      toast.success('Sesión cerrada correctamente');
      setCerrarSesionModal(false);
      setNotasCierre('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al cerrar sesión');
    },
  });

  const handleProductoClick = (producto: Producto) => {
    if (!sesionActiva) {
      toast.error('Primero debes abrir una sesión');
      return;
    }
    setProductoSeleccionado(producto);
    setCantidad(1);
  };

  const handleRegistrarConsumo = () => {
    if (!sesionActiva || !productoSeleccionado) return;

    registrarConsumoMutation.mutate({
      sesionId: sesionActiva.id,
      productoId: productoSeleccionado.id,
      cantidad,
      notas: notasConsumo || undefined,
    });
  };

  const handleCerrarSesion = () => {
    if (!sesionActiva) return;

    cerrarSesionMutation.mutate({
      sesionId: sesionActiva.id,
      notas: notasCierre || undefined,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Sistema POS</h1>
        <div className="flex gap-2">
          {!sesionActiva ? (
            <Button onClick={() => setAbrirSesionModal(true)}>
              <Play className="h-4 w-4 mr-2" />
              Abrir Sesión
            </Button>
          ) : (
            <Button variant="destructive" onClick={() => setCerrarSesionModal(true)}>
              <Square className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Cargando...</div>
      ) : !sesionActiva ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              No hay ninguna sesión activa. Abre una nueva sesión para comenzar a registrar consumos.
            </p>
            <Button onClick={() => setAbrirSesionModal(true)}>
              <Play className="h-4 w-4 mr-2" />
              Abrir Nueva Sesión
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo: Productos */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Productos</CardTitle>
              </CardHeader>
              <CardContent>
                <ProductoGrid onProductoClick={handleProductoClick} />
              </CardContent>
            </Card>
          </div>

          {/* Panel derecho: Sesión y consumos */}
          <div className="space-y-6">
            <SesionActiva sesion={sesionActiva} />

            <Card>
              <CardHeader>
                <CardTitle>Consumos ({sesionActiva.totalConsumos})</CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                <ConsumosList sesionId={sesionActiva.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal abrir sesión */}
      <AbrirSesionModal
        open={abrirSesionModal}
        onClose={() => setAbrirSesionModal(false)}
        onSuccess={() => {}}
      />

      {/* Modal registrar consumo */}
      {productoSeleccionado && (
        <Dialog
          open={!!productoSeleccionado}
          onOpenChange={() => setProductoSeleccionado(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Registrar Consumo</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Producto</Label>
                <p className="font-semibold">{productoSeleccionado.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  Precio: {productoSeleccionado.precioVenta.toFixed(2)}€
                </p>
              </div>

              <div>
                <Label>Cantidad</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCantidad(Math.max(1, cantidad - 1))}
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <Input
                    type="number"
                    value={cantidad}
                    onChange={(e) => setCantidad(Math.max(1, Number(e.target.value)))}
                    className="text-center w-20"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => setCantidad(cantidad + 1)}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div>
                <Label>Subtotal</Label>
                <p className="text-2xl font-bold">
                  {(productoSeleccionado.precioVenta * cantidad).toFixed(2)}€
                </p>
              </div>

              <div>
                <Label>Notas (opcional)</Label>
                <Textarea
                  value={notasConsumo}
                  onChange={(e) => setNotasConsumo(e.target.value)}
                  placeholder="Agregar nota..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setProductoSeleccionado(null)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={handleRegistrarConsumo}
                  disabled={registrarConsumoMutation.isPending}
                >
                  {registrarConsumoMutation.isPending ? 'Registrando...' : 'Registrar'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal cerrar sesión */}
      <Dialog open={cerrarSesionModal} onOpenChange={setCerrarSesionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cerrar Sesión</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>¿Estás seguro de que deseas cerrar esta sesión?</p>

            {sesionActiva && (
              <div className="bg-muted p-4 rounded space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total consumos:</span>
                  <span className="font-semibold">{sesionActiva.totalConsumos}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total items:</span>
                  <span className="font-semibold">{sesionActiva.totalItems.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor total:</span>
                  <span className="font-bold text-lg">{sesionActiva.valorTotal.toFixed(2)}€</span>
                </div>
              </div>
            )}

            <div>
              <Label>Notas de cierre (opcional)</Label>
              <Textarea
                value={notasCierre}
                onChange={(e) => setNotasCierre(e.target.value)}
                placeholder="Agregar observaciones del cierre..."
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCerrarSesionModal(false)}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleCerrarSesion}
                disabled={cerrarSesionMutation.isPending}
              >
                {cerrarSesionMutation.isPending ? 'Cerrando...' : 'Cerrar Sesión'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 13. Comandos Rápidos

```bash
# Backend
cd backend
./mvnw clean install
./mvnw spring-boot:run

# Frontend
cd frontend
npm install
npm run dev

# Docker
docker-compose up -d postgres

# Base de datos
psql -U club_admin -d club_management -h localhost
\dt sesiones_venta
\dt consumos_sesion
SELECT * FROM sesiones_venta;
SELECT * FROM consumos_sesion;
```

---

**Listo para ejecutar en próxima sesión**
