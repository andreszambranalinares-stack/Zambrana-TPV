# Activar la sincronización en la nube (Bloque 1 y 2)

Esta guía deja la app funcionando **en todos los dispositivos a la vez** (móviles de
camareros + PC de barra) con datos compartidos en tiempo real y copias de seguridad.

Mientras no completes el **Paso 1 y 2**, la app sigue funcionando en modo **Local**
(solo en cada dispositivo por separado), como hasta ahora. No se rompe nada.

---

## Paso 1 — Crear el proyecto Supabase (gratis, ~5 min)

1. Entra en https://supabase.com y crea una cuenta.
2. **New project**. Importante: en *Region* elige una de **Europa** (ej. *West EU (Ireland)* o
   *Central EU (Frankfurt)*) por el RGPD (vas a guardar DNI y salarios).
3. Pon un nombre y una contraseña de base de datos (guárdala) y crea el proyecto.

## Paso 2 — Crear la tabla y activar el tiempo real

1. En el menú lateral de Supabase: **SQL Editor** → **New query**.
2. Pega y ejecuta (**Run**) este SQL:

```sql
create table if not exists app_state (
  tenant_id  text not null,
  key        text not null,
  value      jsonb,
  source_id  text,
  updated_at timestamptz default now(),
  primary key (tenant_id, key)
);

alter table app_state enable row level security;

-- ESTRUCTURA INICIAL: acceso abierto con la clave pública (anon).
-- Se endurecerá en el Bloque 3 (login real) antes de usar datos personales reales.
create policy "tenant_all" on app_state
  for all using (true) with check (true);

-- Habilitar el tiempo real (Realtime) sobre la tabla.
alter publication supabase_realtime add table app_state;
```

## Paso 3 — Pegar las credenciales en la app

1. En Supabase: **Project Settings** (engranaje) → **API**.
2. Copia:
   - **Project URL** → va en `SUPABASE_URL`.
   - **anon public** key → va en `SUPABASE_ANON_KEY`.
3. Abre [`js/config.js`](../js/config.js) y pégalas:

```js
SUPABASE_URL: 'https://TU-PROYECTO.supabase.co',
SUPABASE_ANON_KEY: 'eyJhbGciOi...tu_clave...',
TENANT_ID: 'zambrana-principal',  // déjalo así si solo tienes un local
SYNC_MODE: 'auto',
```

4. Guarda. Al recargar la app, el indicador de la cabecera pasará de **Local** a
   **Conectando… → Sincronizado** (punto verde).

> La clave *anon* es pública por diseño (va en el navegador); la protección real de datos
> personales llega en el **Bloque 3** con Supabase Auth.

---

## Paso 4 — Instalar la app en los dispositivos (PWA)

Para que se pueda "descargar"/instalar en móviles y en el PC de barra hace falta servirla por
**HTTPS**. Lo más rápido, ya que el código está en GitHub:

### Opción recomendada: GitHub Pages
1. En el repo de GitHub: **Settings** → **Pages**.
2. *Build and deployment* → *Source*: **Deploy from a branch** → rama `main`, carpeta `/ (root)`.
3. Guarda. En 1-2 min tendrás una URL tipo `https://TU-USUARIO.github.io/Zambrana-TPV/`.
4. Abre esa URL en cada dispositivo y usa **"Añadir a pantalla de inicio"** (Android/Chrome,
   iPhone/Safari) o, en el PC de barra con Chrome/Edge, el icono **Instalar** de la barra de
   direcciones. Quedará como una app independiente a pantalla completa.

> Nota: GitHub Pages requiere repositorio público en el plan gratuito. Si lo quieres privado,
> alternativas gratis con HTTPS: **Cloudflare Pages** o **Netlify** (conectan al repo igual).

---

## Cómo comprobar que funciona
- Abre la app en **dos dispositivos** (o dos navegadores). Crea/cierra una mesa en uno: debe
  reflejarse en el otro en 1-2 segundos.
- Corta el WiFi de un móvil, haz un cambio, vuelve a conectar: el indicador pasa a **Sin
  conexión** y, al volver, sincroniza solo (cola de pendientes).
- **Admin → Copia de seguridad → Exportar**: descarga un `.json` con todo. *Importar* lo restaura.

## Notas y límites (estructura inicial)
- **Seguridad:** la política es abierta; no metas DNI/salarios reales en producción hasta el
  Bloque 3 (login con Supabase Auth).
- **Concurrencia:** el estado se guarda por "bloques" (todas las comandas en uno). Si dos
  dispositivos escriben comandas en el mismísimo instante, podría perderse una. La robustez total
  (una fila por comanda) es la siguiente iteración acordada.
- **Plan gratuito Supabase:** sobra para un restaurante; conviene exportar/archivar tickets
  antiguos de vez en cuando.
