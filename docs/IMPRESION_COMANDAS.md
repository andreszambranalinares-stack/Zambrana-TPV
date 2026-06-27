# Impresión de comandas en cocina y barra

Cuando un camarero envía una mesa, la app crea **dos comandas independientes**: una de
**cocina** (solo platos) y otra de **barra** (bebidas/postres). Cada estación puede
imprimir automáticamente **solo lo suyo** en su propia impresora.

## Montaje recomendado: un dispositivo por estación

- Una tablet/PC en **cocina** con su impresora térmica (80 mm).
- Otra tablet/PC en **barra** con la suya.

El "enrutado" cocina ↔ barra lo da el propio equipo: cada uno imprime contra su
**impresora predeterminada**. No hay que elegir impresora desde la app.

### Puesta en marcha (en cada equipo de estación)

1. Conecta la impresora térmica y ponla como **impresora predeterminada** de Windows.
2. Abre la app y entra en la pantalla de la estación: **Cocina** o **Barra**.
3. Pulsa el botón **🖨️ Auto-imprimir** de la cabecera hasta que ponga **ON**.
   - El ajuste se guarda **en ese equipo** (no afecta a los demás).
   - Al activarlo, las comandas que ya estaban en pantalla **no** se reimprimen; solo
     se imprimirán las **nuevas** a partir de ese momento.

A partir de ahí, cada comanda nueva de esa estación se imprime sola al llegar.

### Reimpresión manual

Cada tarjeta de comanda tiene un botón **🖨️** para volver a imprimirla (útil si se
atasca el papel o se agota). Funciona aunque la auto-impresión esté en OFF.

## Impresión silenciosa (sin diálogo) — opcional

Por defecto el navegador muestra el diálogo de impresión. Para que salga directa,
arranca Chrome en modo kiosko de impresión con un acceso directo:

```
chrome.exe --kiosk-printing --app=https://TU-URL-DE-LA-APP
```

- `--kiosk-printing` imprime en la impresora predeterminada **sin diálogo**.
- `--app=...` abre la app en ventana limpia (sin barras), ideal para una pantalla fija.

## Mejora futura (no implementada): ESC/POS con QZ Tray

Para funciones de impresora térmica "de verdad" (corte automático de papel, apertura de
cajón portamonedas, formato ESC/POS) se puede instalar **QZ Tray** en cada equipo y
enviar el trabajo a una impresora por nombre. No requiere cambiar la lógica de
comandas (solo el método de impresión en `js/tickets.js`).

## Cómo funciona por dentro (referencia técnica)

- `globalState.createOrders()` ([../js/state.js](../js/state.js)) separa cada pedido en
  comanda de cocina (`dest:'cocina'`) y de barra (`dest:'barra'`).
- `tickets.printStationComanda(order)` ([../js/tickets.js](../js/tickets.js)) imprime una
  comanda de una sola estación (cabecera + mesa/camarero + ítems con notas).
- `js/print-station.js` ([../js/print-station.js](../js/print-station.js)) decide qué
  comandas faltan por imprimir en este equipo (`selectUnprinted` en
  [../js/orders.js](../js/orders.js)) y guarda en `localStorage` el estado por
  dispositivo (`ztpv_autoprint`, `ztpv_printed_comandas`).
- El disparador es la suscripción de estado en `app.js`: las comandas llegan a
  `globalState.orders` (también desde otro equipo vía Realtime) y se imprimen las
  pendientes de la estación que muestra esa pantalla.
- CSS de impresión a 80 mm en [../css/styles.css](../css/styles.css) (`@media print`).
