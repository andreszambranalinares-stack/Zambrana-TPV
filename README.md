# 🍷 Zambrana TPV v1.5

**Zambrana TPV** es un sistema de gestión de punto de venta (TPV) de última generación, diseñado específicamente para el sector de la hostelería. Esta aplicación es una **PWA (Progressive Web App)** moderna que combina la potencia de un software de escritorio con la versatilidad de una aplicación móvil.

![Zambrana TPV](logo.png)

## 🚀 Características Principales

### 👥 Gestión Multi-Rol
El sistema está diseñado para que todo el equipo trabaje en armonía:
*   **Administrador**: Control total sobre el local, configuración de carta, gestión de empleados y reportes de ventas.
*   **Camarero (Mobile-First)**: Interfaz optimizada para tomar comandas a pie de mesa con rapidez y precisión.
*   **Cocinero / Barra**: Panel Kanban en tiempo real para la gestión de producción y tiempos de espera.

### ⚡ Sincronización en Tiempo Real
Gracias al uso de `BroadcastChannel` y sincronización inteligente de estados, todos los dispositivos están conectados. Cuando la cocina marca un plato como "listo", el camarero recibe una notificación instantánea en su dispositivo.

### 📐 Editor de Plano Interactivo
Configura tu salón de forma visual. El editor **Drag & Drop** permite replicar la distribución exacta de las mesas de tu local para una gestión más intuitiva.

### 🥗 Control de Alérgenos y Personalización
Gestión detallada de ingredientes y alérgenos en cada plato, permitiendo añadir notas especiales a la cocina (ej. "sin sal", "poco hecho") de forma sencilla.

### 📱 Experiencia PWA
*   **Instalable**: Añádela a la pantalla de inicio de tu móvil como una app nativa.
*   **Offline Support**: Funciona sin conexión gracias a su Service Worker avanzado.
*   **Ligera**: Sin pesadas dependencias externas, construida con Vanilla JS puro para un rendimiento máximo.

## 🛠️ Stack Tecnológico

*   **Frontend**: HTML5 Semántico y CSS3 moderno (Custom Properties, Flexbox, Grid).
*   **Lógica**: JavaScript ES6+ (Módulos, Async/Await).
*   **Iconografía**: Boxicons.
*   **Tipografía**: Inter (Google Fonts).
*   **Persistencia**: LocalStorage & SessionStorage.
*   **Comunicación**: BroadcastChannel API para multi-tab sync.

## 💻 Instalación y Despliegue

El proyecto está diseñado para ser desplegado de forma estática en cualquier servidor (como GitHub Pages, Vercel o Netlify).

1.  Clona el repositorio:
    ```bash
    git clone https://github.com/tu-usuario/Zambrana-TPV.git
    ```
2.  Abre `index.html` en tu navegador o despliega el contenido de la carpeta raíz en tu servidor web.

## 🧪 Modo Demo

El sistema incluye un **Modo Demo interactivo** para pruebas y presentaciones. Puedes activarlo añadiendo el parámetro `?demo=1` a la URL:

`https://tu-dominio.com/index.html?demo=1`

Este modo:
1.  Limpia los datos previos para asegurar un entorno prístino.
2.  Carga una configuración de prueba con 5 mesas y empleados de ejemplo.
3.  Activa un **Tutorial Guiado** que acompaña al usuario por todo el flujo de trabajo profesional.

---

Desarrollado con ❤️ para el sector de la hostelería.
