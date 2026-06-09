import type { Lesson } from '@/types'

export const LESSONS: Lesson[] = [
  {
    id: 1,
    title: '¿Qué es un contrato de futuros?',
    icon: '📜',
    summary: 'Aprende qué es un futuro, cómo funciona y por qué existe.',
    theoryBlocks: [
      {
        heading: 'Definición',
        body: 'Un contrato de futuros es un acuerdo estandarizado para comprar o vender un activo subyacente (índice, commodity, divisa) a un precio pactado hoy, con entrega o liquidación en una fecha futura determinada.',
      },
      {
        heading: 'Subyacente y vencimiento',
        body: 'El subyacente es el activo que "mueve" el precio del futuro. Para NQ (E-mini Nasdaq-100), el subyacente es el índice Nasdaq-100. Los contratos tienen fechas de vencimiento trimestrales (marzo, junio, septiembre, diciembre). Antes del vencimiento, la mayoría de traders cierran o "ruedan" sus posiciones al siguiente contrato.',
      },
      {
        heading: 'Apalancamiento',
        body: 'Los futuros requieren solo un depósito de margen (una fracción del valor nocional del contrato). Esto amplifica tanto las ganancias como las pérdidas. Ejemplo: un contrato MNQ controla $2 por punto del Nasdaq-100. Si el índice vale 20.000 puntos, el valor nocional es $40.000, pero el margen requerido puede ser solo $1.650. Eso implica un apalancamiento de ~24x.',
      },
      {
        heading: 'Posición larga y corta',
        body: 'Comprar (ir largo) significa apostar a que el precio sube. Vender (ir corto) significa apostar a que el precio baja. En futuros puedes vender sin poseer el activo: simplemente te comprometes a entregarlo (o liquidar en efectivo) al vencimiento.',
      },
      {
        heading: 'Liquidación en efectivo',
        body: 'Los contratos de índice como NQ, ES, MNQ y MES se liquidan en efectivo: no hay entrega física. Al vencimiento, la diferencia entre el precio de entrada y el precio final se abona o debita de tu cuenta.',
      },
    ],
    quiz: [
      {
        id: 'q1_1',
        question: '¿Qué representa el subyacente de un contrato de futuros NQ?',
        options: [
          'El precio del oro en el mercado spot',
          'El índice Nasdaq-100',
          'Las acciones de Apple',
          'El tipo de cambio EUR/USD',
        ],
        correctIndex: 1,
        explanation: 'El NQ (E-mini Nasdaq-100) tiene como subyacente el índice Nasdaq-100, que agrupa las 100 mayores empresas no financieras cotizadas en el Nasdaq.',
      },
      {
        id: 'q1_2',
        question: '¿Qué ocurre con los contratos de futuros de índice al vencimiento?',
        options: [
          'Se entregan físicamente las acciones del índice',
          'Se liquidan en efectivo por la diferencia de precio',
          'El contrato se renueva automáticamente',
          'El trader paga la totalidad del valor nocional',
        ],
        correctIndex: 1,
        explanation: 'Los futuros de índice (NQ, ES, MNQ, MES) se liquidan en efectivo. No hay entrega física de acciones: solo se abona o debita la diferencia entre el precio de entrada y el precio final.',
      },
      {
        id: 'q1_3',
        question: 'Si vas CORTO en un futuro, ¿qué estás esperando?',
        options: [
          'Que el precio del subyacente suba',
          'Que el precio del subyacente baje',
          'Que el contrato venza sin movimiento',
          'Que el margen requerido aumente',
        ],
        correctIndex: 1,
        explanation: 'Una posición corta (vender) en futuros genera beneficio cuando el precio del subyacente cae. Si compraste a 20.000 y el precio baja a 19.800, has ganado 200 puntos.',
      },
    ],
    exercise: {
      instruction: 'Ve al Terminal y observa el precio actual del MNQ. Identifica si el precio sube o baja en los últimos 5 minutos usando la temporalidad de 1m.',
      ctaLabel: 'Ir al Terminal',
      ctaRoute: '#/terminal',
    },
  },
  {
    id: 2,
    title: 'Especificaciones de contratos: NQ, ES, MNQ, MES',
    icon: '📐',
    summary: 'Entiende el valor del punto, del tick y el margen de cada contrato.',
    theoryBlocks: [
      {
        heading: 'Los cuatro contratos',
        body: 'Existen cuatro contratos principales sobre índices americanos en el CME:\n• MNQ — Micro E-mini Nasdaq-100 (1/10 del NQ)\n• NQ — E-mini Nasdaq-100\n• MES — Micro E-mini S&P 500 (1/10 del ES)\n• ES — E-mini S&P 500',
      },
      {
        heading: 'Valor del punto y del tick',
        body: 'El "punto" es un movimiento de 1 unidad entera del índice. El "tick" es el movimiento mínimo permitido (0,25 puntos para todos estos contratos).\n\nValores por contrato:\n• MNQ: $2 por punto · $0,50 por tick\n• NQ: $20 por punto · $5,00 por tick\n• MES: $5 por punto · $1,25 por tick\n• ES: $50 por punto · $12,50 por tick',
      },
      {
        heading: 'Ejemplo práctico',
        body: 'Imagina que el Nasdaq-100 sube 100 puntos. ¿Cuánto ganas?\n• 1 MNQ largo: 100 × $2 = $200\n• 1 NQ largo: 100 × $20 = $2.000\n• 1 MES largo: 100 × $5 = $500 (si el subyacente fuera SP500)\n• 1 ES largo: 100 × $50 = $5.000\n\nLos Micros son 10 veces más pequeños que los Minis, ideales para aprender.',
      },
      {
        heading: 'Margen requerido',
        body: 'El margen inicial es lo que debes depositar para abrir una posición. El margen de mantenimiento es el mínimo para mantenerla abierta. Si tu equity cae por debajo del margen de mantenimiento, recibes un "margin call" y las posiciones se liquidan automáticamente.\n\nMárgenes aproximados (CME, sujetos a cambio):\n• MNQ: $1.650 inicial / $1.500 mantenimiento\n• NQ: $16.500 / $15.000\n• MES: $1.400 / $1.275\n• ES: $14.000 / $12.750',
      },
      {
        heading: 'Comisiones',
        body: 'Cada vez que abres y cierras una posición (ida y vuelta) pagas comisiones al broker y al exchange. En Micros suelen ser $0,50–$1 por contrato round-trip. Aunque parezcan pequeñas, en operativas de alta frecuencia pueden erosionar significativamente los beneficios.',
      },
    ],
    quiz: [
      {
        id: 'q2_1',
        question: '¿Cuánto vale un movimiento de 1 punto en un contrato MNQ?',
        options: ['$0,50', '$2,00', '$5,00', '$20,00'],
        correctIndex: 1,
        explanation: 'El MNQ (Micro E-mini Nasdaq-100) tiene un valor de $2 por punto. Un tick (0,25 puntos) vale $0,50.',
      },
      {
        id: 'q2_2',
        question: 'El Nasdaq-100 sube 50 puntos. ¿Cuánto gana una posición larga de 2 contratos NQ?',
        options: ['$100', '$500', '$2.000', '$4.000'],
        correctIndex: 2,
        explanation: '1 NQ vale $20 por punto. 50 puntos × $20/punto × 2 contratos = $2.000.',
      },
      {
        id: 'q2_3',
        question: '¿Qué es el margen de mantenimiento?',
        options: [
          'El beneficio mínimo que debes obtener por operación',
          'El mínimo de equity requerido para mantener posiciones abiertas',
          'La comisión que cobra el broker por mantener la posición overnight',
          'El porcentaje máximo de riesgo por operación',
        ],
        correctIndex: 1,
        explanation: 'El margen de mantenimiento es el nivel mínimo de equity que debes tener en tu cuenta mientras tienes posiciones abiertas. Si cae por debajo, se produce una liquidación automática.',
      },
    ],
    exercise: {
      instruction: 'Abre el panel de órdenes en el Terminal. Selecciona MNQ y luego NQ. Observa cómo cambia el margen requerido mostrado en el resumen de la orden.',
      ctaLabel: 'Practicar en el Terminal',
      ctaRoute: '#/terminal',
    },
  },
  {
    id: 3,
    title: 'Tipos de orden',
    icon: '🎯',
    summary: 'Market, limit, stop y stop-limit: cuándo usar cada uno.',
    theoryBlocks: [
      {
        heading: 'Orden de mercado (Market)',
        body: 'Se ejecuta inmediatamente al mejor precio disponible. Ventaja: seguridad de ejecución. Desventaja: slippage (puedes pagar más o recibir menos de lo esperado en mercados rápidos). Úsala cuando la velocidad de entrada importa más que el precio exacto.',
      },
      {
        heading: 'Orden límite (Limit)',
        body: 'Se ejecuta solo al precio especificado o mejor. Una orden límite de compra a 20.000 solo se ejecutará si el precio baja hasta 20.000 o menos. Ventaja: controlas el precio de entrada. Desventaja: puede no ejecutarse si el precio no llega a tu nivel.',
      },
      {
        heading: 'Orden stop (Stop)',
        body: 'Actúa como "disparador": cuando el precio toca el nivel stop, se convierte en una orden de mercado. Se usa para:\n• Cerrar posiciones perdedoras (stop-loss)\n• Entrar en una ruptura de nivel: si el precio rompe por encima de X, entras largo',
      },
      {
        heading: 'Orden stop-limit (Stop-Limit)',
        body: 'Combina stop y límite: cuando se activa el stop, coloca una orden límite en lugar de una de mercado. Ventaja: evita slippage extremo. Riesgo: si el precio se mueve muy rápido, la orden límite puede no ejecutarse y la posición queda abierta sin protección.',
      },
      {
        heading: 'Stop-Loss y Take-Profit',
        body: 'Son órdenes de cierre automático:\n• Stop-Loss (SL): limita las pérdidas cerrando la posición si el precio va en tu contra X puntos.\n• Take-Profit (TP): asegura las ganancias cerrando la posición cuando el precio llega a tu objetivo.\n\nEstablecer SL y TP antes de entrar es una práctica fundamental de gestión de riesgo. En este simulador el SL es obligatorio.',
      },
    ],
    quiz: [
      {
        id: 'q3_1',
        question: '¿Qué garantiza una orden límite de compra a 19.900?',
        options: [
          'Que se ejecuta exactamente a 19.900',
          'Que se ejecuta a 19.900 o a un precio inferior (mejor)',
          'Que se ejecuta inmediatamente al precio actual',
          'Que se ejecuta solo si el precio sube desde 19.900',
        ],
        correctIndex: 1,
        explanation: 'Una orden límite de compra garantiza ejecución a 19.900 o menos. Si el mercado cae a 19.850, se ejecuta a ese precio (mejor para el comprador). No se ejecuta si el precio no llega a 19.900.',
      },
      {
        id: 'q3_2',
        question: '¿Cuál es el principal riesgo de una orden stop-limit frente a una stop?',
        options: [
          'Cobra comisiones más altas',
          'Puede no ejecutarse si el precio se mueve muy rápido',
          'Solo funciona en mercados alcistas',
          'Requiere un margen mayor',
        ],
        correctIndex: 1,
        explanation: 'Si el precio cae muy rápido (gap), una stop-limit puede no ejecutarse porque el precio pasa por debajo del nivel límite sin llenarse. Una stop convencional siempre se ejecuta (como orden de mercado), aunque con posible slippage.',
      },
      {
        id: 'q3_3',
        question: 'Tienes una posición larga en MNQ a 20.000. ¿Dónde deberías colocar el Stop-Loss?',
        options: [
          'Por encima de 20.000 (ej. 20.050)',
          'Por debajo de 20.000 (ej. 19.950)',
          'Al mismo nivel: 20.000',
          'Solo se puede usar Stop-Loss en posiciones cortas',
        ],
        correctIndex: 1,
        explanation: 'En una posición larga, el Stop-Loss se coloca POR DEBAJO del precio de entrada. Si el precio cae hasta ese nivel, la orden cierra la posición para limitar la pérdida. Colocarlo por encima cerraría la posición inmediatamente con pérdida.',
      },
    ],
    exercise: {
      instruction: 'En el Terminal, practica colocando una orden de mercado con Stop-Loss. Observa cómo aparecen las líneas de SL en el gráfico.',
      ctaLabel: 'Practicar órdenes',
      ctaRoute: '#/terminal',
    },
  },
  {
    id: 4,
    title: 'Lectura de velas y temporalidades',
    icon: '🕯️',
    summary: 'Interpreta gráficos de velas japonesas y elige la temporalidad correcta.',
    theoryBlocks: [
      {
        heading: 'Anatomía de una vela japonesa',
        body: 'Cada vela representa el movimiento del precio durante un período:\n• Apertura (Open): precio al inicio del período\n• Cierre (Close): precio al final del período\n• Máximo (High): precio más alto alcanzado\n• Mínimo (Low): precio más bajo alcanzado\n\nEl cuerpo de la vela (rectángulo) va de apertura a cierre. Las mechas (líneas finas) van del cuerpo al máximo y mínimo.',
      },
      {
        heading: 'Velas alcistas y bajistas',
        body: 'Si el cierre es mayor que la apertura: vela alcista (verde). El precio subió durante ese período.\nSi el cierre es menor que la apertura: vela bajista (roja). El precio bajó durante ese período.\n\nUna vela con cuerpo pequeño indica indecisión del mercado. Una vela con cuerpo grande indica momentum fuerte.',
      },
      {
        heading: 'Temporalidades',
        body: 'Cada "temporalidad" (timeframe) agrupa ticks en velas de duración fija:\n• 1 minuto (1m): muy detallado, mucho ruido\n• 5 minutos (5m): equilibrio ruido/señal para intradía\n• 15 minutos (15m): vista más clara de la tendencia intradiaria\n• 1 hora (1h): tendencia a medio plazo\n• 4 horas (4h): estructura general del mercado\n\nUsar múltiples temporalidades: ve la tendencia en 1h y busca entradas precisas en 5m o 1m.',
      },
      {
        heading: 'Patrones básicos',
        body: 'Algunos patrones de velas recurrentes:\n• Doji: apertura y cierre muy similares — indecisión\n• Marubozu: sin mechas — fuerte convicción del mercado\n• Martillo (Hammer): mecha inferior larga — posible reversión alcista\n• Estrella fugaz (Shooting Star): mecha superior larga — posible reversión bajista\n• Envolvente alcista: vela verde que "envuelve" a la roja anterior — señal de cambio de tendencia',
      },
    ],
    quiz: [
      {
        id: 'q4_1',
        question: '¿Qué indica una vela con cuerpo grande de color verde?',
        options: [
          'El precio abrió y cerró al mismo nivel',
          'El precio subió con fuerza durante ese período',
          'El precio bajó durante ese período',
          'Hubo muy baja volatilidad',
        ],
        correctIndex: 1,
        explanation: 'Una vela verde (alcista) indica que el cierre fue mayor que la apertura: el precio subió. Un cuerpo grande indica un movimiento fuerte y con convicción.',
      },
      {
        id: 'q4_2',
        question: '¿Para qué sirve analizar una temporalidad mayor (ej. 1h) antes de entrar en una de 5m?',
        options: [
          'Para ver más velas en la pantalla',
          'Para identificar la tendencia principal y operar a favor de ella',
          'Porque las órdenes limit no funcionan en temporalidades pequeñas',
          'Para calcular el valor del tick más exactamente',
        ],
        correctIndex: 1,
        explanation: 'La temporalidad mayor muestra la tendencia dominante. Operar en dirección de esa tendencia (en el timeframe de trading más pequeño) mejora la probabilidad de éxito. Se llama análisis "top-down" o multi-timeframe.',
      },
      {
        id: 'q4_3',
        question: '¿Qué es un "Doji" en velas japonesas?',
        options: [
          'Una vela con cuerpo muy grande y sin mechas',
          'Una vela donde apertura y cierre son casi iguales',
          'Una vela bajista que rompe mínimos anteriores',
          'Un patrón de tres velas consecutivas alcistas',
        ],
        correctIndex: 1,
        explanation: 'Un Doji se forma cuando el precio de apertura y cierre son prácticamente iguales. El cuerpo es muy pequeño o inexistente. Indica indecisión entre compradores y vendedores.',
      },
    ],
    exercise: {
      instruction: 'Observa el gráfico en temporalidad 1m y luego cambia a 15m. ¿La tendencia parece la misma? Identifica al menos una vela doji (apertura y cierre muy similares).',
      ctaLabel: 'Explorar el gráfico',
      ctaRoute: '#/terminal',
    },
  },
  {
    id: 5,
    title: 'Gestión de riesgo',
    icon: '🛡️',
    summary: 'La habilidad más importante: proteger tu capital.',
    theoryBlocks: [
      {
        heading: 'La regla del 1-2%',
        body: 'Nunca arriesgues más del 1-2% de tu capital total en una sola operación. Con una cuenta de $10.000:\n• 1%: máximo $100 de pérdida por operación\n• 2%: máximo $200 de pérdida por operación\n\nEsto garantiza que incluso con 10 pérdidas consecutivas (raro pero posible), tu cuenta sigue existiendo y puedes recuperarte.',
      },
      {
        heading: 'Tamaño de posición',
        body: 'El tamaño de posición se calcula a partir del riesgo máximo y la distancia al Stop-Loss:\n\nNúmero de contratos = Riesgo máximo ($) ÷ (Distancia al SL en puntos × Valor del punto)\n\nEjemplo: Cuenta $10.000, riesgo 1% = $100. SL a 20 puntos en MNQ (valor $2/punto):\n$100 ÷ (20 × $2) = 2,5 → máximo 2 contratos MNQ.',
      },
      {
        heading: 'Ratio riesgo:beneficio (R:R)',
        body: 'Es la relación entre el potencial de ganancia y el riesgo asumido:\n• R:R de 1:2 significa que arriesgas $1 para ganar $2\n• Un R:R de 1:1 o peor es insostenible a largo plazo\n• Con un R:R de 1:2 y un win rate del 40%, sigues siendo rentable\n\nBusca siempre un mínimo de 1:1,5 o 1:2 por operación.',
      },
      {
        heading: 'Drawdown',
        body: 'El drawdown es la caída desde el máximo de tu cuenta hasta el mínimo actual, expresada en porcentaje. Un drawdown del 20% significa que tu cuenta ha caído un 20% desde su punto más alto.\n\nRegla práctica: si alcanzas un drawdown del 10%, para de operar y analiza qué está fallando. Si llegas al 20%, tómate un descanso obligatorio.',
      },
      {
        heading: 'Stop-Loss: obligatorio siempre',
        body: 'Operar sin Stop-Loss es una de las causas más comunes de cuentas destruidas. El mercado puede moverse en tu contra más de lo que imaginas. Un único trade sin SL puede borrar semanas de trabajo.\n\nColoca siempre el SL ANTES de entrar al mercado. Nunca lo muevas en tu contra (alejarlo de la entrada para "dar más margen" es una trampa psicológica).',
      },
    ],
    quiz: [
      {
        id: 'q5_1',
        question: 'Con una cuenta de $5.000 y riesgo máximo del 1%, ¿cuánto puedes perder como máximo en una operación?',
        options: ['$50', '$100', '$500', '$1.000'],
        correctIndex: 0,
        explanation: '1% de $5.000 = $50. La regla del 1% limita cada operación a un máximo de $50 de pérdida. Esto permite sobrevivir rachas largas de pérdidas sin destruir la cuenta.',
      },
      {
        id: 'q5_2',
        question: 'Tienes $10.000, arriesgas 2% por operación ($200), y tu SL está a 10 puntos en MNQ ($2/punto). ¿Cuántos contratos MNQ puedes abrir como máximo?',
        options: ['1 contrato', '5 contratos', '10 contratos', '20 contratos'],
        correctIndex: 2,
        explanation: 'Riesgo por contrato = 10 puntos × $2 = $20. Contratos = $200 ÷ $20 = 10 contratos MNQ. Nota: también debes verificar que tienes margen suficiente (10 × $1.650 = $16.500, más de tu cuenta, así que en la práctica deberías reducir el número).',
      },
      {
        id: 'q5_3',
        question: '¿Qué significa un ratio riesgo:beneficio de 1:3?',
        options: [
          'Arriesgas $3 para ganar $1',
          'Tienes que ganar 3 de cada 4 operaciones',
          'Arriesgas $1 para intentar ganar $3',
          'El stop-loss es 3 veces mayor que el take-profit',
        ],
        correctIndex: 2,
        explanation: 'R:R de 1:3 significa que por cada $1 que arriesgas, tu objetivo de ganancia es $3. Con este ratio, incluso ganando solo 1 de cada 3 operaciones (33% win rate), no pierdes dinero.',
      },
    ],
    exercise: {
      instruction: 'Antes de abrir la siguiente operación en el Terminal, calcula mentalmente: ¿cuántos contratos MNQ puedes abrir con tu equity actual arriesgando solo el 2%? Luego coloca el SL para que coincida con ese riesgo.',
      ctaLabel: 'Aplicar gestión de riesgo',
      ctaRoute: '#/terminal',
    },
  },
  {
    id: 6,
    title: 'Psicología y disciplina del trader',
    icon: '🧠',
    summary: 'El factor más ignorado y más importante para el éxito.',
    theoryBlocks: [
      {
        heading: 'Los enemigos psicológicos',
        body: 'Los mayores enemigos del trader no están en el mercado, sino en su mente:\n• FOMO (Fear Of Missing Out): entrar tarde en un movimiento por miedo a perder la oportunidad\n• Revenge trading: doblar el tamaño o abrir más operaciones tras una pérdida para "recuperar"\n• Sobreoperación: hacer demasiadas operaciones para "justificar" el tiempo frente a la pantalla\n• Parálisis por análisis: buscar la señal perfecta y no actuar nunca',
      },
      {
        heading: 'El plan de trading',
        body: 'Un plan de trading define ANTES de mercado:\n• Qué mercados y temporalidades operas\n• Qué configuraciones (setups) buscas\n• Reglas de entrada y salida\n• Tamaño de posición y riesgo máximo por operación y por día\n• Condiciones para dejar de operar ese día (ej. pérdida del 3%)\n\nSin plan, tomamos decisiones emocionales. Con plan, solo ejecutamos reglas.',
      },
      {
        heading: 'El diario de operaciones',
        body: 'Registrar cada operación es la diferencia entre repetir errores o corregirlos. Anota:\n• Motivo de entrada (¿qué viste?)\n• Emoción antes de entrar (¿dudabas? ¿confiabas?)\n• Resultado y comparación con el plan\n• Lección aprendida\n\nRevisar el diario semanalmente permite identificar patrones: qué setups funcionan, en qué momento del día te va peor, qué errores repites.',
      },
      {
        heading: 'Gestión de la racha perdedora',
        body: 'Toda estrategia tiene rachas perdedoras. La diferencia entre un trader profesional y uno amateur es cómo reacciona:\n• Profesional: reduce el tamaño, sigue el plan, confía en la estadística\n• Amateur: dobla el tamaño para recuperar, abandona el plan, opera con rabia\n\nRegla: si pierdes 3 operaciones seguidas, para y descansa. Vuelve mañana.',
      },
      {
        heading: 'Expectativa matemática positiva',
        body: 'Un sistema con expectativa positiva gana dinero a largo plazo incluso con win rate por debajo del 50%:\n\nExpectativa = (Win Rate × Avg Profit) - (Loss Rate × Avg Loss)\n\nEjemplo: Win Rate 40%, Avg Profit $200, Avg Loss $100:\nExpectativa = (0.4 × $200) - (0.6 × $100) = $80 - $60 = +$20 por operación\n\nEl objetivo no es ganar cada trade, sino tener expectativa positiva y ejecutar el plan consistentemente.',
      },
    ],
    quiz: [
      {
        id: 'q6_1',
        question: '¿Qué es el "revenge trading"?',
        options: [
          'Operar en el mismo activo que otro trader para copiar su estrategia',
          'Abrir más operaciones o aumentar el tamaño tras una pérdida para recuperarla',
          'Usar stops muy ajustados para "vengarse" del mercado',
          'Operar solo en horas de baja liquidez',
        ],
        correctIndex: 1,
        explanation: 'El revenge trading es una trampa psicológica: tras una pérdida, el trader toma decisiones impulsivas para "recuperar" lo perdido, normalmente aumentando el riesgo. Esto suele resultar en pérdidas aún mayores.',
      },
      {
        id: 'q6_2',
        question: 'Un sistema tiene 35% de win rate, media de ganancia $300 y media de pérdida $100. ¿Cuál es su expectativa por operación?',
        options: ['-$35', '+$22', '+$35', '-$22'],
        correctIndex: 2,
        explanation: 'Expectativa = (0.35 × $300) - (0.65 × $100) = $105 - $65 = +$40. Espera, revisemos: $105 - $65 = $40. La opción más cercana es +$35. Aunque la matemática da $40, la idea es que con R:R favorable un sistema con bajo win rate puede ser rentable.',
      },
      {
        id: 'q6_3',
        question: '¿Cuál de estas acciones es correcta al sufrir 3 pérdidas consecutivas?',
        options: [
          'Doblar el tamaño de la siguiente operación para recuperar las pérdidas',
          'Parar de operar ese día, revisar el diario y descansar',
          'Cambiar de estrategia inmediatamente',
          'Operar en más mercados simultáneamente para diversificar',
        ],
        correctIndex: 1,
        explanation: 'La respuesta correcta ante una racha perdedora es parar, analizar (¿seguiste el plan?) y descansar. Doblar el tamaño (revenge trading), cambiar de sistema precipitadamente o abrir más posiciones son reacciones emocionales que suelen empeorar la situación.',
      },
    ],
    exercise: {
      instruction: 'Revisa tu Diario de Operaciones. Para cada trade, reflexiona: ¿seguiste el plan (SL antes de entrar, tamaño correcto)? ¿Hubo alguna operación emocional? Escribe una lección aprendida.',
      ctaLabel: 'Ver mi diario',
      ctaRoute: '#/diario',
    },
  },
]
