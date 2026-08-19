# Base de datos de Finanzas Personales

## Decisión

La aplicación está preparada para PostgreSQL mediante Supabase. Esta combinación permite usar la misma información desde la web y, más adelante, desde una aplicación para iPhone. Supabase aporta autenticación y una API sobre PostgreSQL, mientras que las reglas financieras permanecen en la aplicación.

La conexión remota no se activa automáticamente. Hasta que exista un proyecto Supabase y una sesión de usuario, la aplicación continúa usando `localStorage` como repositorio local.

## Modelo

| Tabla | Responsabilidad |
|---|---|
| `user_settings` | Configuración personal y periodo seleccionado |
| `categories` | Categorías propias del usuario |
| `payment_methods` | Medios de pago, incluido SINPE Móvil |
| `incomes` | Salarios en USD y tipo de cambio aplicado al recibirlos |
| `fixed_expenses` | Gastos recurrentes en CRC o USD con distribución Q1/Q2 |
| `planned_payment_plans` | Compra o deuda completa que se paga en cuotas |
| `planned_payments` | Pago único o mensualidad concreta de un plan |
| `expenses` | Gastos reales y la bolsa salarial que los financia |
| `saving_plans` | Metas de ahorro recurrentes |
| `saving_entries` | Aportes de ahorro planeados y reales |

Cada registro financiero tiene dos identificadores:

- `id`: identificador de PostgreSQL.
- `client_id`: identificador creado en el dispositivo para evitar duplicados al sincronizar.

## Seguridad

Todas las tablas tienen Row Level Security habilitado. Las políticas comparan `auth.uid()` con `user_id`, por lo que un usuario autenticado solo puede leer y modificar sus propias filas. También hay relaciones compuestas que impiden enlazar una categoría, salario o plan perteneciente a otra persona.

## Activación

1. Crear un proyecto en Supabase.
2. Aplicar `supabase/migrations/202608190001_initial_finance_schema.sql` mediante una migración.
3. Copiar `.env.example` a `.env.local` y completar la URL y la llave publicable del proyecto.
4. Implementar la pantalla de inicio de sesión.
5. Después de iniciar sesión, llamar `importLocalState` una sola vez para migrar los datos actuales del navegador.
6. Cambiar el repositorio activo de local a Supabase y añadir sincronización por operación.

La importación preparada es idempotente: volver a ejecutarla actualiza los mismos registros gracias a `client_id`, en vez de crear copias.
