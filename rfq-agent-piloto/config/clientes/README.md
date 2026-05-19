# Configuraciones por cliente

Cada archivo en este directorio corresponde a la configuración de costes de un taller cliente.

## Convención de nombres

El nombre del archivo debe coincidir con la parte local de la dirección de email a la que
el taller reenvía sus RFQs, después del prefijo `rfq-`:

| Dirección de entrada       | Archivo de config             |
|---------------------------|-------------------------------|
| `rfq-tallerabc@rfq-agent.com`  | `tallerabc.json`         |
| `rfq-mecanizados-norte@rfq-agent.com` | `mecanizados-norte.json` |
| `rfq@rfq-agent.com`       | usa el config por defecto     |

## Cómo añadir un nuevo cliente

1. Copia `../../../ejemplos/rfq-simple/config-taller.json` con el nombre del cliente
2. Edita los precios, márgenes y datos de empresa del taller
3. Configura en Resend una dirección de receiving `rfq-[cliente]@rfq-agent.com`
4. El sistema cargará automáticamente la config correcta al recibir emails en esa dirección

## Datos que necesitas recoger del taller (onboarding ~45 min)

- Nombre, CIF, email, teléfono
- Tarifas €/hora por operación (torno CNC, fresado, soldadura, etc.)
- Precios de materiales habituales (€/kg)
- Márgenes por complejidad (%)
- Overhead, IVA, plazo estándar, condiciones de pago
