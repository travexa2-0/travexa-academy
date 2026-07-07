# TRAVEXA — Documento de Negocio
**Pencom Travexa SAS · Yesica Edith Robles (CEO) + Nicolás Belinco (CTO)**
**Quilmes / Vicente López, Buenos Aires · Junio 2026 · Confidencial**
**Actualizado:** Sesión 8 — 7 Julio 2026

---

## 1. QUÉ ES TRAVEXA

Plataforma digital B2B para el mercado turístico argentino. Conecta tres actores:

- **Operadores** (mayoristas, receptivos, seguros, escuelas) → cargan productos y capacitaciones
- **Agencias y asesores freelance** → buscan, comparan, cotizan y gestionan sus ventas
- **Viajero final** → llega a la web pública, contacta a un asesor, cierra fuera de Travexa

**El valor real no es la tecnología.** Es la combinación de:
1. Acceso al mercado mayorista a través del **legajo RNAV/EVT** que ya tiene Travexa (la mayoría de freelancers y agencias chicas no puede comprarle a un operador sin ese legajo).
2. Conocimiento de cuál operador elegir para cada destino.
3. Formación aplicada.

> **Travexa es el cerebro del asesor de viajes argentino.**

---

## 2. LA RED CONSTRUIDA HOY

| Actor | Cantidad | Estado |
|---|---|---|
| Operadores mayoristas contactados | 89 | En red |
| Operadores con productos activos en catálogo | 15 | Activos |
| Seguros de viaje | 4 | Aliados |
| Escuelas de formación | 3 | Aliadas |
| Vendedores freelance registrados | 80 | Registrados |
| Agencias registradas | 50 | Registradas |
| Facturado 2026 | $62M ARS | Retenido Travexa: ~$1.994.000 |

Crecimiento 100% orgánico. Mercado disponible: 7.181 agencias en el RNAV. Travexa tiene menos del 1%.

**El moat real tiene tres capas:**
1. **Legajo RNAV/EVT** — regulatorio, no se replica rápido. Sin él, un freelance no puede comprarle a un mayorista.
2. **Comunidad y reputación** — chica pero muy fiel, construida por Yesica con años de trabajo en el rubro.
3. **Grafo de precios** — cada flyer, WhatsApp y oferta ingerida por la IA lo construye. Cuando esté maduro, Travexa será la única fuente de verdad del precio real del trade turístico argentino.

---

## 3. LA SOCIEDAD

| Rol | Persona | Área de incumbencia |
|---|---|---|
| CEO / Negocio | Yesica Edith Robles | Marketing, ventas, operadores, partners, academia, comunidad |
| CTO | Nicolás Belinco | Stack técnico, infraestructura, producto, IA |

- **Pencom Travexa SAS** — en proceso de constitución (junio 2026)
- Sociedad 50/50. Vesting a 4 años con cliff completo (ver Acuerdo de Socios).
- Yesica full-time. Nicolás part-time (~4hs/día) hasta cumplir condición de transición a full-time.
- Instrumento constitutivo y Acuerdo de Socios firmados — en revisión con contadora.

---

## 4. ARQUITECTURA DE MARCA

| Entidad | Descripción | URL | Estado |
|---|---|---|---|
| **Travexa B2B** | Herramienta del trade turístico | travexa.com.ar | ✅ En producción |
| **Travexa Academy** | Formación del trade, con Home pública propia | academy.travexa.com.ar (prod: travexa-academy.vercel.app) | ✅ En producción — dominio propio (academy.travexa.com.ar) pendiente de cutover, ver Travexa_Tecnico.md |
| **Travexa B2C** | Marketplace público para viajero final | travexa.com.ar (sección pública) | 🔴 Diferido a F5 |
| **Pencom Travel** | Agencia directa al pasajero con IA, marca separada | pencomtravel.com.ar | 🔴 Diferido a F5 |
| **Yesica Robles** | Marca personal B2B, impulsa el ecosistema | @yesicaroblesturismo | ✅ Orgánico |

**Decisión estratégica confirmada:** Travexa B2C y Pencom Travel se construyen solo en F5, cuando haya base sólida de usuarios, caja y datos. No antes.

**Principio clave:** Travexa B2B se mantiene como infraestructura neutral en la que el trade confía. Pencom Travel es el canal de venta directa — no compite con los freelancers de Travexa.

**Nomenclatura interna (Sesión 14 técnica):** al hablar de la relación entre Academy y el producto B2B se usa el nombre **"Travexa Marketplace"**, no "B2B" — así quedó reflejado en el producto (sección de gamificación de la Home de Academy, que explica por qué formarse en Academy ayuda a vender más del lado Marketplace) y debería usarse de forma consistente en cualquier material de cara al usuario de ahí en más.

---

## 5. MODELO DE MONETIZACIÓN

### Prioridad de modelos (en este orden)

**Línea 1 — Membresías (PRIORIDAD MÁXIMA — encender ya)**

| Plan | Precio ARS | Referencia USD | subscription_status |
|---|---|---|---|
| Explorador | Gratis | — | freemium |
| Guía | $42.000/mes | ~USD 40/mes | active |
| Capitán | $65.000/mes | ~USD 60/mes | team |

- Explorador: solo para los early adopters que no quieran pagar. Nuevos usuarios van directo a Guía o Capitán.
- Los 80 vendedores + 50 agencias = 130 usuarios que hoy no pagan nada. Este es el primer objetivo.
- La razón por la que pagan: acceso a operadores + catálogo + capacitaciones.
- Early adopters: 30% de descuento de por vida sobre ARS.

**Línea 2 — Comisión de intermediación (Camino 2 — mantener pero no priorizar)**

Travexa intermedia la venta cuando el asesor lo solicita. Split actual: 60% asesor / 40% Travexa. Este modelo se mantiene porque hoy es la única forma de acceso real a mayoristas para la mayoría de los freelancers, pero el objetivo es que las membresías sean el ingreso principal.

⚠️ Este modelo requiere la SAS + RI + régimen especial de agencias de viajes (IVA sobre comisión, no sobre bruto) para ser viable fiscalmente.

**Línea 3 — Academy Travexa (en desarrollo activo, Home pública ya en producción)**

Contenido grabado por Yesica + influencers aliados del rubro con contenido y comunidad propia. Los influencers suman contenido a la plataforma bajo marca Travexa, con revenue share. Ellos traen su comunidad; Travexa les da estructura y plataforma.

**Modelo confirmado (distinto al de Travexa B2B):** registro gratuito, sin planes ni suscripciones. El usuario paga por lo que consume — curso individual, vivencial (viaje educativo grupal) o evento, cada uno con pago único. No repite el modelo de membresías de la Línea 1; son negocios separados con lógica de precio distinta.

**⚠️ Actualización de canal de cobro para vivenciales (Sesión 8 — Julio 2026):** los vivenciales dejaron de cobrarse/facturarse dentro de la plataforma. El cierre de venta se gestiona 100% por WhatsApp directo con Yesica (botón "Quiero anotarme" en la página del vivencial, con mensaje pre-armado, dirigido al WhatsApp Business de Travexa). Yesica administra la transferencia (bancaria, fuera de Mercado Pago) y registra manualmente en el backoffice los pagos recibidos —seña y/o saldo, con comprobante y fecha—, que descuentan del total automáticamente. El viajero también puede subir su propio comprobante desde su perfil, sujeto a la aprobación de Yesica. Esto es consistente con el principio ya vigente de no ser merchant of record de plata de terceros mientras la SAS no esté operativa con el régimen fiscal correcto (ver Directriz #1 más abajo). Los **cursos** (montos bajos, no los grandes montos de un viaje) sí siguen previstos para cobrarse vía Mercado Pago dentro de la plataforma, apenas se cargue `MP_ACCESS_TOKEN` (ver Travexa_Tecnico.md).

**Estado técnico (actualizado Sesión 15 técnica):** infraestructura completa (Supabase propia, edge functions de pago con Mercado Pago para cursos, gamificación XP/Créditos, sistema de referidos). Onboarding obligatorio de usuarios nuevos ya en producción. Catálogo, perfil, vivencial y backoffice de administración ya construidos y en producción. Home pública en producción. El flujo de gestión de vivenciales por WhatsApp + carga manual de pagos en backoffice también está deployado en producción (`travexa-academy.vercel.app`), pendiente de una primera revisión visual end-to-end por parte del equipo.

**Falta construir la vidriera pública donde el alumno efectivamente canjea créditos (`/beneficios`)** — hoy solo existe el lado de administración del catálogo. Falta activar Google OAuth en producción (parcialmente resuelto, ver `Travexa_Tecnico.md`) y SMTP propio antes de abrir a usuarios reales en volumen.

**Línea 4 — SaaS para Operadores (F4)**

Operadores chicos sin distribución entran gratis. Travexa monetiza con datos de demanda que les vende a los operadores y con el volumen que generan para la plataforma. Operadores grandes: a definir.

**Línea 5 — Pencom Travel / B2C (F5 — diferido)**

---

## 6. FLUJO DE UNA VENTA HOY

### Camino 1 — Asesor opera solo
Solo disponible para agencias con documentación propia que puedan comprarle directamente a operadores. Minoría (<5% de la base actual).

```
Busca en catálogo → contacta operador directo → cotiza y cierra con pasajero
Ingreso Travexa: membresía mensual únicamente
```

### Camino 2 — Travexa intermedia (uso real del 70%+ de la base)

```
1. El freelancer reserva en el sistema del operador (usa credenciales de Travexa)
2. Yesica contacta al viajero, confirma vacante con el operador
3. Yesica cobra al viajero (por Mercado Pago o transferencia, factura Travexa)
4. Yesica transfiere al operador su parte
5. Yesica transfiere al freelancer su parte (60%)
6. Travexa retiene 40% de la comisión del operador

Ingreso Travexa: 40% de comisión + membresía mensual
```

⚠️ **Riesgo operativo identificado:** credenciales compartidas entre 70+ freelancers. Si el operador las bloquea, cae toda la red. Requiere capa técnica intermedia (F2-F3).

---

## 7. ESTRATEGIA DE IA

### Prioridad por impacto ÷ esfuerzo

**F2 — Motor de ingesta (primera IA a construir)**
- Fuente: WhatsApp, flyers (imágenes/PDF), webs de operadores
- Proceso: Claude Haiku extrae → estructura el producto → inserta en Supabase con estado "pendiente"
- Orquestación: n8n
- Resultado: catálogo que se carga solo, sin persona dedicada a hacerlo a mano
- Efecto secundario: construye el grafo de precios (el moat de datos)

**F2 — Segundo cerebro de Yesica**
- Base de conocimiento de Yesica cargada en Supabase con pgvector (RAG)
- El vendedor pregunta en el dashboard → Claude busca en la base + catálogo vivo → responde
- Toggle para Yesica: puede elegir consulta por consulta si responde la IA o la atiende ella
- Cuando Yesica "toma" una consulta, puede buscar en portales de operadores y agregar su comisión
- Herramientas: Claude API (Haiku para volumen, Sonnet para casos complejos) + pgvector + n8n

**F4 — Asistente de cotización y venta**
- El vendedor arma un paquete desde Travexa sin tocar los portales de operadores
- Primero paquetes cerrados. Después viajes a medida (donde más se vende)
- Portales target: AERO, Freeway — primero pedir API/XML; scraping como plan B

**F4 — Conexión asistida a portales de operadores**
- Primero: verificar si AERO y Freeway tienen API directa para agencias (es el camino correcto)
- Si no: automatización del login con cola (una sesión por vez para no disparar detección de bots)
- Transparente para el vendedor: no sale de Travexa
- ⚠️ A definir: modelo de cobro al vendedor por uso (por membresía o por uso)

### Herramientas de IA confirmadas

| Herramienta | Uso |
|---|---|
| Claude Haiku | Extracción de flyers/WhatsApp/webs — alto volumen, bajo costo |
| Claude Sonnet | Casos complejos, segundo cerebro, asistente de venta |
| n8n | Orquestación de workflows (ingesta, notificaciones, automatizaciones) |
| Supabase pgvector | Base vectorial para el segundo cerebro de Yesica |
| WhatsApp Business API | Trigger de ingesta de ofertas de operadores. También ahora canal de cierre de venta de vivenciales de Academy (ver Sección 5) |
| Claude in Chrome | Exploración asistida de portales de operadores (plan B si no hay API); también usado por Claude IA para revisión visual directa de previews de Vercel |
| Cowork | Tareas no-dev del equipo (clasificar, limpiar, supervisar ingesta) |

---

## 8. HOJA DE RUTA — TRAVEXA 2.0

### F0 — Base (semanas 1-4) — AHORA
| Tarea | Responsable |
|---|---|
| Constitución SAS con contadora | Yesica |
| Evaluar régimen especial IVA agencias de viajes | Yesica + Contadora |
| Transferencia legajo RNAV a la SAS | Yesica + Contadora |
| Supabase propia creada, datos migrados a sandbox | Nico |
| Documento para contadora entregado | Claude ✅ |

### F1 — Membresía (mes 1)
| Tarea | Responsable |
|---|---|
| Feature gating real por plan | Nico |
| Comunicación formal a los 71 early adopters | Yesica |
| Prender membresías Guía y Capitán | Nico |
| Primer módulo de Academy en vivo | Yesica |
| Primer influencer sumado a Academy | Yesica |
| **Home pública de Academy en producción** | Nico + Claude ✅ |
| **Vivenciales: cierre de venta por WhatsApp + carga manual de pagos en backoffice, en producción** | Nico + Claude ✅ |

### F2 — Ingesta IA + segundo cerebro (mes 1-2)
| Tarea | Responsable |
|---|---|
| Pipeline n8n + Claude para WhatsApp/flyers/webs | Nico |
| Segundo cerebro de Yesica con pgvector | Nico + Claude |
| Pantalla de conciliación de pagos en dashboard | Nico |
| Yesica redirige tiempo liberado a soporte y ventas | Yesica |
| Captación activa de más operadores al sistema | Yesica |

### F3 — Migración (mes 2-3)
| Tarea | Responsable |
|---|---|
| Entorno Vercel + Supabase propia con funciones básicas | Nico |
| Corte de dominio a Vercel | Nico |
| Lovable se apaga | Nico |
| Iterar el resto de funciones ya en producción | Nico + Claude |

### F4 — Venta asistida con IA (mes 3-6)
| Tarea | Responsable |
|---|---|
| Asistente de cotización | Claude + Nico |
| Contacto con AERO/Freeway para API | Yesica |
| Conexión asistida a portales (API o plan B) | Nico |
| Primeros operadores chicos en modelo SaaS gratuito | Yesica |

### F5 — Expansión (6+ meses)
- Travexa B2C marketplace (cuando haya 200+ asesores activos)
- Pencom Travel con venta directa asistida por IA
- Integración TWAS (cuando TWAS tenga tracción propia)

### LO QUE NO SE TOCA AHORA
- Rediseño visual
- App mobile
- Cobro al operador por visibilidad
- Integración TWAS
- B2C marketplace
- Pencom Travel

---

## 9. CONTEXTO COMPETITIVO

| Competidor | Relación |
|---|---|
| TIP, Delfos, OLA | Plataformas de un solo operador — diferente categoría |
| Travel Compositor | SaaS pero caro y sin conocimiento local |
| Mercado Turismo | Potencial competidor directo — no lanzó aún |

**Respuesta al riesgo competitivo:** velocidad + contratos firmados + el moat de tres capas (legajo RNAV + comunidad + grafo de precios). Los 89 operadores y la comunidad no se replican rápido.

---

## 10. INTEGRACIÓN TWAS

**Qué es TWAS:** red de negocios locales con app iOS/Android, sistema de puntos y CRM. Es de Nicolás, separado de Travexa.
**Visión a futuro:** integración pos-viaje tipo TripAdvisor — el viajero genera puntos canjeables en negocios locales de su destino.
**Timing:** no desarrollar hasta que ambas plataformas tengan volumen estable. No está en el roadmap actual.
**Regla:** TWAS no es activo de Travexa salvo acuerdo expreso por escrito entre los socios.

---

## 11. DIRECTRICES DE NEGOCIO (invariantes del proyecto)

Estas directrices aplican a todas las decisiones. No se debaten en cada sesión.

1. **Travexa no es merchant of record de plata de pasajeros** hasta que la SAS esté operativa con el régimen fiscal correcto.
2. **El ingreso recurrente (membresías) tiene prioridad sobre el ingreso variable (comisiones).** Toda decisión de producto que no alimente el MRR pasa a segundo plano.
3. **No reemplazar a los freelancers — potenciarlos.** La IA hace el trabajo pesado; ellos mantienen la relación y cierran. La venta directa con IA va en Pencom Travel, separada.
4. **Toda feature nueva debe alimentar el grafo de precios o el lock-in del workflow.** Si no hace ninguna de las dos, no se construye ahora.
5. **Los operadores grandes no pagan.** El modelo es: gratis para ellos, monetización vía datos y membresías del lado de la demanda.
6. **El legajo RNAV es el activo regulatorio más valioso.** Protegerlo técnicamente (no más credenciales compartidas sin capa intermedia) es tan urgente como cualquier feature.
7. **Pensa en USD, facturá en ARS.** Precios referenciados en USD, cobrados en ARS al tipo de cambio del momento.
8. **Ninguna pieza de producto o marketing muestra prueba social, estadísticas o testimonios inventados.** Se muestra el dato real (aunque sea chico) o no se muestra nada — establecido a raíz del lanzamiento de la Home de Academy (Sesión 14 técnica), aplica a todo el ecosistema de ahí en más.
9. **Los vivenciales de Academy no se cobran dentro de la plataforma.** La venta se cierra por WhatsApp directo con Yesica y el registro de pagos (seña/saldo, con comprobante) es manual en el backoffice — establecido en Sesión 15 técnica. Los cursos y eventos de Academy sí usan Mercado Pago dentro de la plataforma.

---

## 12. SITUACIÓN LEGAL Y FISCAL

| Item | Estado |
|---|---|
| Pencom Travexa SAS | 🟡 En proceso de constitución |
| Régimen fiscal: RI + especial agencias de viajes | 🟡 A confirmar con contadora |
| Transferencia legajo RNAV a la SAS | 🟡 A gestionar |
| Instrumento constitutivo | ✅ Redactado |
| Acuerdo de socios | ✅ Redactado |
| Documento para contadora | ✅ Entregado |

---

*Pencom Travexa SAS · Julio 2026 · Uso interno confidencial*
*Actualizar con cada sesión y con cada decisión nueva de negocio.*
