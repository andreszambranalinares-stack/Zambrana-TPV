# FuturesAcademy — Simulador Educativo de Futuros

Aplicación web educativa para aprender a operar futuros del Nasdaq-100 y S&P 500 con dinero ficticio.

> **Aviso importante:** Simulador exclusivamente educativo. Sin dinero real. El trading de futuros apalancados conlleva alto riesgo de pérdida; la mayoría de traders minoristas pierde dinero. Esto no es asesoramiento financiero.

## Características

- 📊 **Terminal de trading** con gráfico de velas en tiempo real (simulado o real)
- 💼 **Cuenta paper** con $10.000 ficticios, gestión de margen y drawdown
- 🎓 **Academia** con 6 lecciones completas sobre futuros y gestión de riesgo
- 📋 **Diario** con historial de operaciones, estadísticas y curva de equity
- ▶ **Modo Replay** para practicar sobre datos históricos
- 🛡️ Stop-Loss obligatorio y alertas de riesgo configurables

## Contratos disponibles

| Contrato | Subyacente | Valor punto | Valor tick | Margen aprox. |
|----------|-----------|-------------|------------|---------------|
| MNQ | Nasdaq-100 | $2 | $0,50 | $1.650 |
| NQ | Nasdaq-100 | $20 | $5,00 | $16.500 |
| MES | S&P 500 | $5 | $1,25 | $1.400 |
| ES | S&P 500 | $50 | $12,50 | $14.000 |

## Desarrollo local

### Requisitos

- Node.js 20+
- npm 10+

### Instalación

```bash
cd futures-academy
npm install
npm run dev
```

La app arranca en `http://localhost:5173` con datos simulados. **No necesitas ninguna API key.**

### Comandos disponibles

```bash
npm run dev        # servidor de desarrollo con HMR
npm run build      # genera dist/ para producción
npm run preview    # sirve el build localmente
npm run typecheck  # verifica tipos TypeScript
```

## Despliegue en Netlify

### Opción 1: Desde la UI de Netlify

1. Conecta tu repositorio GitHub en [app.netlify.com](https://app.netlify.com)
2. Netlify detecta `netlify.toml` automáticamente:
   - **Base directory:** `futures-academy`
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. Haz clic en **Deploy site** — funciona sin ninguna variable de entorno

### Opción 2: Netlify CLI

```bash
npm install -g netlify-cli
netlify login
cd futures-academy
netlify deploy --prod
```

## Datos reales (opcional)

Por defecto la app usa precios simulados (movimiento browniano geométrico). Para activar datos reales de mercado:

1. Crea una cuenta gratuita en [twelvedata.com](https://twelvedata.com)
2. Obtén tu API key gratuita (800 peticiones/día en el plan gratuito)
3. En Netlify: **Site settings → Environment variables**
   - Nombre: `MARKET_API_KEY`
   - Valor: tu API key de Twelve Data
4. Redespliega el sitio

Una vez configurado, el botón **SIM** en la barra superior del gráfico te permite alternar a **REAL**.
Si la API no está disponible (límite de peticiones, sin conexión, key no configurada), la app vuelve automáticamente a simulación con un aviso visible.

### Desarrollo local con datos reales

Crea un archivo `.env` en `futures-academy/` (no lo subas a git):

```
MARKET_API_KEY=tu_key_aqui
```

Luego usa el Netlify CLI en modo dev:

```bash
netlify dev   # arranca en http://localhost:8888
```

Sin Netlify CLI, la llamada a `/.netlify/functions/market-proxy` fallará en local y la app usará simulación automáticamente.

## Estructura del proyecto

```
futures-academy/
├── netlify/
│   └── functions/
│       └── market-proxy.ts    # Proxy serverless (oculta MARKET_API_KEY)
├── src/
│   ├── components/
│   │   ├── chart/             # TradingChart, ChartToolbar, PositionOverlay
│   │   ├── orderPanel/        # OrderPanel con SL obligatorio y alerta de riesgo
│   │   ├── positions/         # PositionsTable con cierre rápido
│   │   ├── account/           # AccountPanel, ResetAccountModal
│   │   ├── journal/           # StatCards, EquityCurveChart, TradeRow
│   │   ├── academy/           # LessonCard, LessonView, QuizQuestion
│   │   ├── layout/            # AppShell, Sidebar, MobileNav, DisclaimerBanner
│   │   └── ui/                # Modal, Toast
│   ├── constants/
│   │   ├── contracts.ts       # Specs MNQ/NQ/MES/ES
│   │   └── academy.ts         # Contenido de las 6 lecciones
│   ├── hooks/
│   │   ├── useChart.ts        # Monta/destruye lightweight-charts
│   │   ├── useMarketFeed.ts   # Conecta GBM o datos reales al gráfico
│   │   ├── useOrderExecution.ts  # SL/TP automáticos en cada tick
│   │   └── useRiskGuard.ts    # Alerta cuando el trade arriesga >2% del equity
│   ├── pages/                 # Terminal, Cuenta, Diario, Academia, Replay
│   ├── services/
│   │   ├── gbmGenerator.ts    # Generador de precios sintéticos (GBM)
│   │   ├── futuresEngine.ts   # Cálculo P&L, margen, comisiones
│   │   ├── orderExecutor.ts   # Ejecuta órdenes y SL/TP
│   │   └── marketDataService.ts  # Cliente del proxy de datos reales
│   ├── store/                 # Zustand: market, account, trade, academy, replay
│   └── types/                 # Interfaces TypeScript compartidas
├── .env.example               # Plantilla de variables de entorno
├── netlify.toml               # Configuración de despliegue Netlify
└── README.md
```

## Privacidad y seguridad

- La `MARKET_API_KEY` **nunca se expone al cliente**. Solo existe en el servidor (Netlify Function).
- No se recopilan datos de usuario. Todo el progreso se guarda en `localStorage` del navegador.
- No hay backend propio ni base de datos.
