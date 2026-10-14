# Cims · app Android

App para seguir los **100 Cims de la FEEC**, los **3000 del Pirineo (UIAA 212)**, los **3000 catalanes**, los **sostres comarcals** y los **4000 de los Alpes**, con mapa, GPS y tus propios puntos. Arranca con los datos de tu Excel de referencia (55 cims FEEC, 45 tresmiles, 257 puntos y 7 rutas).

## Cómo obtener el .apk

### Opción A · Android Studio (en tu ordenador)

1. Instala **Android Studio** (gratuito): https://developer.android.com/studio
2. Descomprime este zip y, en Android Studio, haz **File → Open** y elige la carpeta `CimsApp`.
3. Espera a que termine la sincronización de Gradle. La primera vez descarga varios cientos de MB y tarda unos minutos.
4. Menú **Build → Build App Bundle(s) / APK(s) → Build APK(s)**.
5. Cuando acabe, pulsa **locate** en el aviso. El archivo es `app/build/outputs/apk/debug/app-debug.apk`.

### Opción B · GitHub, sin instalar nada

1. Crea un repositorio en GitHub y sube el contenido de la carpeta `CimsApp` (incluida la carpeta oculta `.github`).
2. En la pestaña **Actions** verás «Compilar APK» ejecutándose; si no arranca, pulsa **Run workflow**.
3. Al terminar (unos 5 minutos), entra en la ejecución y descarga **Cims-apk** en «Artifacts». Dentro está `app-debug.apk`.

## Instalarla en el móvil

1. Pasa `app-debug.apk` al móvil (por cable, Drive, correo…) y ábrelo.
2. Android pedirá permiso para **instalar apps de origen desconocido** para la app con la que lo abres (Archivos, Chrome…). Acéptalo.
3. Al usar el botón de ubicación del mapa, la app pedirá permiso de **ubicación**.

## Qué hace

- **Resum**: bloques desplegables (100 Cims, Comarques, Tresmils, Sostres comarcals y 4000) con sus indicadores y barras. Dentro de cada bloque hay un segundo desplegable con la lista: los 522 cims, los essencials por comarca, las zonas de los 3000 y los tresmiles catalanes, los 43 sostres y los macizos de los 4000. Tocando un cim se abre su ficha, y tocando una comarca, zona o macizo se abre la lista filtrada. Con «⇅ Canviar l'ordre del resum» (al final) eliges el orden de los bloques; la app recuerda el orden y qué tienes abierto.
- **Fichas con foto**: los cims de la FEEC muestran la foto de su ficha oficial (necesita conexión).
- **Llistes**: las cuatro listas con buscador y filtros (pendientes/hechos, essencials, principales/secundarios, comarca, zona). Toca el círculo para marcar un cim con la fecha de hoy (el aviso de abajo ofrece «Sense data» para quitarla), o el nombre para ver la ficha: «Fet avui», «Fet, sense data», cambiar o borrar la fecha, notas y enlaces.
- **Mapa**: los 522 cims FEEC (verde hecho, lila essencial pendiente, gris no essencial pendiente), 199 de los 3000 (azul pendiente, verde hecho; capa «3000 Pirineu»), tus puntos y tus rutas. Tiene mapa base topográfico, OSM o satélite. Con **◎** ves dónde estás y los cims pendientes más cercanos. **Mantén pulsado** el mapa para añadir un punto. En el botón de capas, **«Només els cims fets»** deja en el mapa solo los cims que has hecho (de todas las listas a la vez); cada lista tiene además su opción Tots / Fets / Pendents / Amagar. El mapa recuerda lo que elegiste.
- **Fites**: medallas y estadísticas.
  - Medallas por el reto de los 100 essencials, por el 100% de los essencials y cada 50 cims de la FEEC.
  - Las conseguidas están arriba, en un desplegable plegado. Al tocar cualquier medalla se despliega la lista de cims que has hecho dentro de ella (toca un cim para abrir su ficha).
  - Por cada comarca: plata con todos sus essencials, oro con la comarca entera.
  - Por cada sector de 3000: una por subir su cim más alto (por ejemplo, el Aneto en Maladeta-Aneto), otra con los principales UIAA y otra con el sector entero.
  - Especiales: tresmiles catalanes, sostres comarcals y UIAA completa.
  - Al conseguir una medalla nueva sale una celebración.
  - Estadísticas: cims por año, primer y último cim con fecha, cim más alto, cims con y sin fecha.
  - Mapa de Catalunya coloreado según el % de essencials hechos en cada comarca; toca una comarca para ver el detalle.
- **Punts**: tus puntos por grupo, sin los que ya son cims de alguna de tus listas (esos ya están en su lista; el contador dice cuántos se ocultan). En el mapa, tus puntos están ocultos por defecto (se pueden mostrar desde el botón de capas); puedes añadir, editar y borrar. Para las coordenadas puedes usar tu ubicación o tocar el mapa.
- **⋯ (arriba a la derecha)**:
  - **Importar track** (GPX, FIT de Garmin, KML, KMZ o ZIP). Detecta los cims que quedan a menos de 80 m de tu traza (FEEC y 3000 con coordenadas). Puedes marcarlos con la fecha de la salida (a los que ya tenías sin fecha se les pone esa) y guardar la traza como ruta.
  - **Exportar KMZ para Google Earth**: tus puntos por grupo, cims hechos, pendientes y rutas.
  - **Exportar Excel**.
  - Exportar e importar una copia de seguridad (.json), exportar lo hecho en CSV para Excel, o empezar de cero (pide confirmación tres veces).

## Copia automática en Dropbox

La app puede subir sola la copia a tu Dropbox: unos 20 segundos después de cada cambio, al salir de la app y, como mínimo, una vez al día. Siempre sobrescribe los mismos tres archivos, sin historial. Si no ha cambiado nada desde la última copia, no sube nada. Son unos 300 KB en total, así que tarda pocos segundos y no bloquea la app:

- `cims-copia.json`: la copia de seguridad, que se puede restaurar desde la app.
- `Cims_seguiment.xlsx`: el Excel de seguimiento (resumen con barras, 100 Cims, 3000 UIAA, 3000 catalanes, sostres comarcals, tus puntos y rutas), con las fechas de cada cim y actualizado con lo que marques en la app. Las fórmulas se recalculan al abrirlo en Excel.
- `Cims.kmz`: el mismo KMZ que exporta el menú, para abrirlo en Google Earth.

**1. Crea tu «app» de Dropbox (una sola vez, en el ordenador)**
1. Entra en https://www.dropbox.com/developers/apps con tu cuenta de Dropbox y pulsa **Create app**.
2. Elige **Scoped access** y **App folder** (la app solo verá su propia carpeta, no el resto de tu Dropbox).
3. Ponle un nombre único, por ejemplo `Cims-copia-jordi`, y pulsa **Create app**.
4. En la pestaña **Permissions**, marca `files.content.write` y `files.content.read` y pulsa **Submit** abajo. Hazlo **antes** de conectar la app.
5. En la pestaña **Settings**, copia el **App key**. El App secret no hace falta.

**2. Conecta la app del móvil**
1. Menú **⋯ → Connectar Dropbox**.
2. Pega el **App key** y pulsa **Obrir Dropbox i autoritzar**. Se abre el navegador: inicia sesión si te lo pide y pulsa **Permitir**.
3. Dropbox te muestra un código. Cópialo, vuelve a la app, pégalo y pulsa **Connectar**.

A partir de ahí la copia es automática. Las copias quedan en **Dropbox › Aplicaciones › (nombre de tu app)**. En el menú ⋯ verás la hora de la última copia y las opciones **fer còpia ara**, **restaurar l'última còpia** y **desconnectar**.

## A tener en cuenta

- Los datos se guardan en el móvil. Si desinstalas la app o borras sus datos se pierden: activa la copia en Dropbox o **exporta una copia de seguridad** de vez en cuando.
- El mapa necesita conexión para cargarse; las listas y el resumen funcionan sin cobertura.
- 16 tresmiles no tienen coordenadas fiables y no salen en el mapa ni se detectan en los tracks: Grande Fache, Pico Maldito, Espalda de Aneto, Pico del Medio, Gendarme Schmidt-Endell, Aguja Escudier, Punta Oliveras-Arenas, Pico Coronas, Tuca del Collado de Coronas, los tres Picos Occidentales de Maladeta, Aguja Russell Superior, Diente de Alba, Primer Resalte de Salenques y Gendarme de Alba.

## Cómo sacar los tracks de Garmin

Garmin no ofrece una API para particulares, así que la app no puede leer Garmin Connect directamente. Para todo el historial, usa «Importar historial» (más abajo). Para una salida suelta, expórtala e impórtala:
- **Desde la web** (connect.garmin.com, también sirve el navegador del móvil en modo escritorio): abre la actividad, rueda dentada → **Exportar original** (ZIP con el .fit) o **Exportar a GPX**. La app lee los dos.
- **Desde la app Garmin Connect**: según la versión, permite exportar o compartir la actividad como GPX. Si no te aparece la opción, usa la web.
- **Para el historial entero**: Garmin permite pedir la exportación de todos tus datos desde la configuración de la cuenta. Te llega un ZIP con los .fit de tus actividades, y desde la app importas los de las salidas que quieras.

## Registro de ascensiones

Cada cim guarda la lista de veces que lo has subido, con su fecha.
- **En la ficha del cim** ves las ascensiones numeradas. Puedes cambiar la fecha de cada una (vacía = sin fecha), borrarlas o añadir otra.
- **En las listas**, los cims subidos más de una vez llevan el contador (×5).
- **La fecha del cim** (la que sale en las listas y en la columna «Data» del Excel) es siempre la de la primera ascensión.
- **En el Excel**, las pestañas 100 Cims y 3000 Pirineu tienen dos columnas nuevas al final: «Ascensions» y «Dates de les ascensions». También están en el CSV y en las descripciones del KMZ.
- **Cada actividad importada** del historial de Garmin o Strava en la que pasas por un cim suma una ascensión con su fecha. Si el Puigmal sale en 5 actividades, en la app aparece subido 5 veces con esas fechas.
  - Una misma actividad no se cuenta nunca dos veces.
  - Si un cim estaba marcado sin fecha, esa marca se sustituye por las fechas de las actividades.
  - Si ya tenía una fecha puesta a mano y coincide con la de una actividad, se juntan en una sola ascensión. Si no coincide, cuenta como otra ascensión (por ejemplo, una subida sin GPS).
- **Los tracks importados** también suman una ascensión, salvo que ya haya una ese mismo día.

## Llistes que fas servir

En **⋯ → Llistes que fas servir** eliges qué listas usas: 100 Cims FEEC, sostres comarcals, 3000 catalanes, 3000 del Pirineo y 4000 de los Alpes. Solo salen las listas, el mapa, el resumen y las fites de las que marques. Los cims hechos de una lista desmarcada no se borran: si la vuelves a activar, siguen ahí.

**Cims que están en dos listas.** Los 7 tresmiles que también son de los 100 Cims (Pica d'Estats, Besiberri Nord, Besiberri Sud, Comaloforno, Sotllo, Punta Alta y Tuc de Molières) van enlazados: si los marcas, desmarcas, cambias la fecha o añades una ascensión en una lista, se cambia también en la otra. Los sostres comarcals que son de los 100 Cims ya comparten la misma marca.

## 4000 de los Alpes

- **La lista**: la oficial de la UIAA (1994), con 82 cimas principales y 46 secundarias (128 en total). Tiene su pestaña «4000» en Llistes, con filtro por principales, secundarias y macizo, una capa en el mapa y una tarjeta en el Resum.
- **Coordenadas**: las hay de 105 de las 128 (sacadas de Wikipedia, peakvisor y camptocamp). Las 23 que faltan son secundarias poco documentadas; se pueden marcar a mano, pero no salen en el mapa ni se detectan en los tracks.
- **Fites**: hay tres, contando principales y secundarias juntas: 50 cuatromiles, la mitad (64) y los 128.
- **Excel**: tienen su pestaña «4000 Alps» (Assolit, Data, ascensiones y fechas) y una barra de progreso en el Resum. También salen en el KMZ y en el CSV.

## Versiones

Las versiones se numeran v0.1, v0.2… La versión actual sale en **⋯ → Actualitzacions de l'app**.

## Importar el historial (Garmin o Strava)

Desde **⋯ → Importar historial (Garmin o Strava)** puedes cargar de golpe todas tus salidas. La app detecta por qué cims de las listas pasaste (a menos de 80 m de la traza) y te los deja **para revisar**: no marca nada sin que lo confirmes.

**1. Pide el archivo con tus actividades** (gratis; elige uno o los dos):
- **Garmin**: en garmin.com, inicia sesión y ve a *Cuenta → Gestión de datos → Exportar tus datos*. Te llega un correo con el enlace al ZIP; puede tardar desde unos minutos hasta algunos días.
- **Strava**: en strava.com, ve a *Ajustes → Mi cuenta → Descargar o eliminar tu cuenta → Solicitar archivo*. También te llega por correo.

**2. Descarga el ZIP en el móvil**, tal cual, sin descomprimirlo.

**3. Impórtalo**: en Cims, **⋯ → Importar historial → Triar el fitxer ZIP**.
- La app lee las actividades una a una y muestra el progreso. Con un historial largo tarda unos minutos: deja la app abierta y la pantalla encendida.
- Lee archivos FIT, GPX y TCX, también comprimidos (.gz) y dentro de los ZIP internos de Garmin. Los nombres de las actividades los saca del propio archivo cuando puede.

**4. Revisa**: te enseña cada actividad con sus cims, todos marcados.
- Desmarca lo que no hayas subido de verdad; repasa sobre todo agujas y gendarmes muy juntos.
- Si quieres las trazas en el mapa, deja marcado «Desar aquestes activitats com a rutes».
- Pulsa **Aplicar els marcats**. Cada cim de cada actividad suma una ascensión con su fecha.

**Repetir la importación**: puedes importar los dos archivos, o uno más nuevo más adelante. Una misma salida (misma hora de inicio) nunca se cuenta dos veces.

**Las salidas nuevas**, de una en una: exporta la actividad (GPX o FIT original) desde Garmin Connect o Strava y usa **⋯ → Importar track**.

## Actualizaciones automáticas

La app está hecha de dos partes: el contenedor Android (icono, permisos), que casi nunca cambia, y el contenido (`app/src/main/assets/www/`), que es donde están las listas, el mapa, las medallas… Desde la versión 2, la app descarga sola el contenido nuevo de tu repositorio de GitHub, sin recompilar ni reinstalar.

- **Configuración, una vez**: menú **⋯ → Actualitzacions de l'app**. Escribe tu repositorio como `usuario/nombre`; puedes pegar la dirección de GitHub entera. La rama normalmente es `main`.
- **Si el repositorio es privado**, hace falta un token de solo lectura:
  1. GitHub → foto de perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**.
  2. En *Repository access* elige **Only select repositories** y tu repositorio.
  3. En *Permissions → Repository permissions* pon **Contents: Read-only**.
  4. Pulsa **Generate token**, cópialo y pégalo en la app.
- **Cómo funciona**:
  - Al abrir la app, como mucho una vez por hora, mira el archivo `version.json` del repositorio. Si el número de versión es mayor que el que tiene, descarga solo los archivos que han cambiado y comprueba que estén completos.
  - Sale un aviso con el botón **Reiniciar**; si no lo pulsas, la versión nueva se aplica la próxima vez que abras la app.
  - Tus datos (cims, ascensiones, puntos, Dropbox) no se tocan.
- **Seguridad**: si una versión nueva no arranca dos veces seguidas, la app vuelve sola a la anterior.
- **Cuándo hay que recompilar igualmente**: solo si cambia algo de fuera de `assets/www` (icono, permisos, código Java). Cuando recompilas, el contenido que va dentro del APK pasa a ser el actual.
- **Clave de firma fija**: el proyecto incluye `app/cims.keystore`, así que todos los APK salen firmados igual y se instalan encima del anterior sin desinstalar. El APK de la primera versión se firmó con una clave aleatoria de GitHub; por eso, solo esta vez, hay que desinstalar la versión antigua.

## Cambiar el icono

El icono actual es el **G1** (montañas sobre fondo azul).

En `iconos/` hay dieciocho propuestas (`propostes_icona.png`, `propostes_icona_2.png` y `propostes_icona_3.png`, con las variantes de G y K). Para usar una, copia sus carpetas `mipmap-*` dentro de `app/src/main/res/`, sustituyendo las actuales, y vuelve a compilar.
- Es una versión *debug*, firmada con una clave de desarrollo. Sirve para instalarla tú; para publicarla en Google Play habría que firmarla con una clave propia.

## Versión web (iPhone y navegador)

Es la misma app (el mismo `app/src/main/assets/www/`) publicada como web instalable (PWA). Sirve para iPhone y para cualquier navegador, sin App Store ni APK. Se publica en un **repositorio público aparte**, para que este (con la keystore y el código Android) siga privado.

**Preparar la publicación (una sola vez)**
1. En GitHub, crea un repositorio **público** vacío para la web, por ejemplo `cims-web`.
2. En ese repositorio: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, rama `main`, carpeta `/ (root)`. (Si aún no tiene ninguna rama, hazlo después del primer paso 5.)
3. Crea un token: foto de perfil → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token**. En *Repository access* elige **Only select repositories** y el repositorio web; en *Permissions → Repository permissions* pon **Contents: Read and write**.
4. En **este** repositorio (el privado): **Settings → Secrets and variables → Actions**.
   - Pestaña *Secrets* → **New repository secret**: nombre `WEB_DEPLOY_TOKEN`, valor el token del paso 3.
   - Pestaña *Variables* → **New repository variable**: nombre `WEB_REPO`, valor `usuario/cims-web`.
5. En **Actions → Publicar versió web → Run workflow**. Cuando acabe (menos de un minuto), la web queda en `https://usuario.github.io/cims-web/` (tarda uno o dos minutos más la primera vez).

**Actualizar**: igual que siempre. Subes los cambios de `app/src/main/assets/www/` (o de `fotos/`) y el flujo «Publicar versió web» publica solo. En el móvil, la app avisa con «Hi ha una versió nova» y un botón **Actualitzar**; si no lo pulsas, se aplica la próxima vez que abras la app. Lo que se publica es solo `www/` y `fotos/`, nunca la keystore ni nada del proyecto Android.

**Instalarla en el iPhone**
1. Abre la dirección de la web **en Safari** (no en Chrome ni en otro navegador).
2. Botón **Compartir** → **Añadir a pantalla de inicio**.
3. Abre siempre la app desde ese icono. Ya funciona sin conexión; solo el mapa y Dropbox necesitan internet.

**Diferencias con la app de Android**
- No hay carpeta de copias fuera de la app. Quedan: **Dropbox**, **⋯ → Exportar** (abre el menú de compartir del iPhone: «Guardar en Archivos», AirDrop…) y las copias automáticas dentro del propio navegador.
- Los datos viven en el almacenamiento del navegador del iPhone. Instalada en la pantalla de inicio y usada de vez en cuando es bastante estable, pero iOS puede borrarlo si el teléfono va muy justo de espacio o si la app pasa semanas sin abrirse. Conviene exportar una copia de vez en cuando o conectar Dropbox.
- Dropbox necesita la **App key** de una app de Dropbox (⋯ → Exportar → Dropbox). Para una amiga, lo más cómodo es usar la misma App key tuya: no es secreta (el acceso va con PKCE) y cada persona guarda en su propio Dropbox. Antes conviene comprobar en `dropbox.com/developers/apps` los límites de usuarios de una app en modo desarrollo.
- Las actualizaciones del contenido las gestiona el navegador (service worker), no el sistema de GitHub + token de Android. En la web no hay que configurar repositorio ni token, y las fotos se bajan de la propia web.
- La importación de un historial muy grande (ZIP de cientos de MB) puede quedarse sin memoria en iPhone; en ese caso, importa por partes.

**Archivos nuevos**: `sw.js` (service worker), `manifest.webmanifest`, `icons/` (iconos de la web) y `.github/workflows/publish-web.yml`. Para probarla en el ordenador: en la carpeta `www` ejecuta `python3 -m http.server 8000` y abre `http://localhost:8000`.

## Estructura

- `app/src/main/assets/www/`: la app en sí (HTML, CSS y JavaScript). `data.js` contiene las listas y tus datos iniciales.
- `app/src/main/java/.../MainActivity.java`: el contenedor Android (WebView, permisos de ubicación, guardado de archivos y botón atrás).
- `.github/workflows/build-apk.yml`: compilación automática en GitHub.
- `.github/workflows/publish-web.yml`: publicación de la versión web en el repositorio público aparte.

## v0.13 · Nou aspecte
- Tema verd pi (clar i fosc). Fosc/Clar/Automàtic: ⋯ → Aparença.
- Resum amb targeta principal; Llistes amb cercador i panell de filtres.
- **Vull fer**: marca un cim com a pendent (estat tri-estat: pendent / vull fer / fet). Filtre a Llistes i opció al mapa.
- **Estadístiques per període** (últim mes, 3 mesos, any, any passat, any concret, tot). Només compten els cims amb data; els sense data només surten al total.
- Icones de les fites redissenyades (SVG propi: or, plata i maragda; les pendents mostren l'anell de progrés).

## v0.14
- Resum recupera la capçalera clàssica (títol + etiqueta + fletxa) i els quadres de colors, amb el tema verd. Amb el bloc tancat es veu una barra de progrés fina. El bloc 100 Cims FEEC surt obert per defecte.

## v0.15
- Més fluïda: només es dibuixa la pantalla visible, la transició entre pantalles és un fosa curta, les llistes només pinten el que es veu, el cercador espera 120 ms i el desat al disc s'ajorna 180 ms (s'escriu sempre en sortir de l'app).

## v0.16 · Fotos
- La fitxa de cada cim mostra la foto des de photos/ (paquets locals, instantani); si no n'hi ha, la del FEEC com abans (ara amb prioritat alta, sense càrrega mandrosa).
- Les fotos es preparen al PC amb FotosCims/fotos_cims.py (veure LEEME_fotos.txt).

## v0.17
- Fotos més lleugeres: WebP a 600 px (qualitat 60). L'app accepta WebP i JPEG.

## v0.18
- Resum sense la data sota «Cims».
- Comarques: dos desplegables, «Essencials per comarca» i «Tots els cims per comarca», cadascun amb barra i comptador; nova barra de comarques completes.
- 3000 catalans: fora Punta de Passet i Besiberri del Mig N i S (per sota de 3000 m amb l'alçada ICGC). Segueixen a la llista UIAA, sense l'etiqueta «Català».
- Mapa: els punts es poden tocar amb més marge (14 px). La fitxa es tanca lliscant-la cap avall.

## v0.19
- Mapa de comarques de Fites: hi ha Andorra, Cerdanya Nord, Capcir, Conflent, Vallespir i Rosselló (no Fenolleda, que no té cims a la llista).

## v0.20 · Fotos independents
- Les fotos ja no van dins l'app: són a la carpeta fotos/ del repositori i el mòbil les baixa sol (en comprovar actualitzacions) i les desa al telèfon. Les actualitzacions de l'app no les toquen.

## v0.21
- Tocar la foto de la fitxa l'obre sencera a pantalla completa (es tanca tocant o amb el botó enrere).

## v0.22
- Mapa de comarques: en gris les comarques sense essencials (Garraf, Lluçanès, Tarragonès i Vallespir), amb llegenda.

## v0.23
- Fotos: es comproven també en obrir l'app; a ⋯ > Actualitzacions surt quantes n'hi ha al mòbil i, si falla, el motiu; botó «Tornar a baixar les fotos». Si una foto local no es pot llegir, surt la del FEEC.

## v0.24
- ⋯ > «Importar cims i rutes (fitxer .json)»: fusiona ascensions amb data i rutes preparades a l'ordinador (p. ex. de l'arxiu de Strava). La mateixa data no es duplica; si un cim té ascensions amb data, s'esborren les marques sense data; es pot tornar a importar sense duplicar res.

## v0.25
- La importació de fitxer .json també posa data als punts existents i n'afegeix de nous; accepta ascensions sense activitat (de llistes).

## v0.26
- Rutes: tocar-ne una obre la seva fitxa (veure al mapa o esborrar). Al mapa, «Detall» a la ruta. A la llista de Punts, «Seleccionar» per marcar-ne unes quantes (o totes) i esborrar-les de cop.

## v0.27
- Punts: mantenir premut un punt o una ruta per començar a seleccionar-ne diversos; barra amb «Tots», ✕ i «Esborrar». La llista ja no salta en marcar.
- Punts: seccions plegables per tipus (Cims, Alpinisme, Escalades, Ferrades, Projectes, Internacionals…) amb icona, color i recompte, i les rutes en una secció pròpia ordenades per data i agrupades per any. «Desplegar-ho / Plegar-ho tot»; en cercar s'obren soles les seccions amb resultats.
- Estadístiques: «Els més pujats», els 10 cims amb més ascensions del període (toca'n un per obrir-ne la fitxa).

- Punts: icones de línia fina, del color de cada categoria (mosquetó de rosca a Escalades, casc a Ferrades; Astúries i Galícia amb colors propis).
- Canviar de categoria: a la fitxa d'un punt o d'una ruta, botó de la categoria → tria'n una altra. Amb diversos seleccionats (mantenir premut), «Moure». Les rutes amb categoria surten dins d'aquella secció; «Rutes» les torna a la llista de rutes.

## v0.28
- Últims cims: cada cim surt un sol cop amb la seva darrera ascensió (i ×N si n'hi ha més), 10 en total; els cims de dues llistes (p. ex. Besiberri Nord / Besiberri N) surten com un de sol, amb el nom dels 100 Cims.
- Estadístiques: «Els més alts», els 10 cims més alts pujats del període (a «Tot» també els sense data). A les dues llistes, el nom a l'esquerra i la data o l'altitud alineades a la dreta.
- Punts: la llista ja no es mou sola mentre la consultes.
- Importar fitxer .json: també posa data als punts que no són de cap llista (la primera vegada) i, si n'hi ha més, una nota «Strava: N vegades, última …».

## v0.29
- En obrir l'app (un sol cop), posa les dates de Strava a 83 punts que no són de cap llista, sense haver d'importar cap fitxer. Només s'aplica si l'app ja té ascensions importades de Strava.

## v0.30
- Punts amb diverses ascensions: la data és la de la primera vegada, a la dreta surt ×N com als cims, i a la fitxa del punt hi ha totes les dates. Es treu la nota «Strava: N vegades…».
- En obrir l'app (un sol cop), posa l'altitud a 57 punts-cim que no en tenien (fonts: Viquipèdia, Enciclopèdia Catalana, IGN i, si no n'hi havia, PeakVisor/SummitPost). No toca les altituds que ja tinguis.

## v0.31
- Resum: les caselles amb una fletxa (›) són tocables i obren una llista en una fulla: essencials assolits, essencials pendents (primer els «vull fer»), no essencials, total FEEC, 3000 UIAA principals/secundaris, sostres i 4000 dels Alps.
- Dins la fulla, toca un cim per veure'n la fitxa i «‹ Tornar a la llista» per tornar-hi.
- Comarques: les caselles obren les comarques amb tots els essencials, les completes i les que van en curs; cada comarca es desplega i mostra els seus cims. Igual per a les zones dels 3000 i els massissos dels 4000.
- Els 3000 catalans i els 4000 dels Alps surten com a quadrets (fet / vull fer / pendent); toca un quadrat per veure el cim.

## v0.32
- Resum, Tresmils: dues files de caselles, una per als 3000 UIAA i una per als 3000 catalans (catalans principals, quants en falten i el %). Es treuen els quadrets dels 3000 i dels 4000.
- Es treuen els botons verds d'accés a Llistes de cada targeta. Les zones (3000) i els massissos (4000) acabats s'obren des de dues files grises.

## v0.33
- Resum: es treuen les files «Zones acabades / Principals acabats per zona» (3000) i «Massissos acabats / Principals acabats per massís» (4000).
- Fitxa del cim: a cada ascensió, al costat de la data, ja no surt Strava / Sports Tracker / el títol de l'activitat (queda com a dada de fons). Ara hi surt una nota: toca «+ nota» (o el text) per desplegar-la i escriure amb qui hi vas anar o què va passar.
- En obrir l'app (un sol cop) s'importen a les ascensions els comentaris de l'Excel dels 3000 (53 anotacions, p. ex. «Vero i Xavi»). No toca res que ja hi tinguis escrit.
- Estadístiques: els anys van en un desplegable «Any ▾» en lloc d'un carrusel llarg, i hi ha un botó nou «Personalitzat» per triar «Des de / Fins a» (barres per setmanes, mesos o anys segons la durada, i comparació amb el període anterior de la mateixa durada).

## v0.34
- Estadístiques: en triar «Aquest any» el desplegable d'anys ja no es marca en verd per error.

## v0.35
- Llistes: a dalt de tot, barra de progrés de la llista oberta (fets, quants en falten i %). A 100 Cims també els essencials i a 3000 UIAA / 4000 els principals.

## v0.36
- Totes les barres de progrés (Resum i Llistes) mostren sempre a la dreta el % i «X de Y».
- Notes d'ascensió: cada ascensió és una targeta; sota la data hi ha la nota (caixa verda amb «Editar») o «Afegir nota». En editar surten els botons Desar nota / Cancel·lar / Esborrar nota, i en desar apareix «Nota desada».

## v0.37
- Medalles: en obrir una medalla surten els cims fets i, més apagats, els que falten (a les medalles que tenen una llista tancada).
- Sostres: Sant Jeroni (Bages i Anoia) i el Tossal de la Baltasana (Baix Camp i Conca de Barberà) són el mateix cim sostre de dues comarques: ara surten una sola vegada amb les dues comarques. No hi havia cap duplicat a les dades.
- Nova categoria de medalles «Sostres»: 25%, 50%, 75% i 100% dels sostres comarcals. La data és el dia que es va arribar a aquell nombre de comarques.

## v0.38
- Resum: es treuen els textos «Toca una casella per veure els cims» i «X de 150 essencials. Calen 100…».
- «Tresmils» i «3000 UIAA» passen a dir-se «3000 del Pirineu» (Resum, pestanya de Llistes, filtres, estadístiques, medalles).
- Estadístiques: es treu la nota de cims sense data / cims a dues llistes.
- Fitxa del cim: el camp de notes diu «Notes sobre el cim».
- Botó enrere: des de Fites → «Veure llista» torna a Fites amb la mateixa comarca seleccionada al mapa i la mateixa posició; igual amb «Veure al mapa» d'un punt, una ruta o un cim: torna a la pantalla d'on venies.

## v0.39
- Menú: totes les importacions van dins «Importar» (historial Garmin/Strava, track, còpia de seguretat) i totes les exportacions dins «Exportar» (Google Earth, Excel, CSV, còpia de seguretat). S'ha tret «Importar cims i rutes (fitxer .json)».
- Còpies automàtiques: en tancar l'app (o deixar-la en segon pla) es desa una còpia al mòbil si hi ha canvis (les 5 últimes) i es poden restaurar des del menú. Amb Dropbox connectat, també es puja la còpia en tancar.
- Fonts: textos nous per a 3000 catalans, sostres comarcals i fotos.

## v0.40
- El menú «Dades» passa a dir-se «Configuració». El botó enrere (el del mòbil també) puja un nivell: de Importar/Exportar/Còpies a Configuració, i d'allà tanca la fulla.
- Connectar Dropbox (i fer còpia ara / desconnectar) és dins Exportar; restaurar la còpia de Dropbox és dins Importar.
- Còpies automàtiques: tria la freqüència (cada cop que es tanca l'app, un cop al dia, a la setmana o al mes).

## v0.41
- Configuració: el botó enrere des de qualsevol subpantalla (Fonts, Llistes, Actualitzacions, Importar historial, Connectar Dropbox, Importar, Exportar, Còpies automàtiques…) torna a Configuració.
- Fonts: es treu la línia «Coordenades dels tresmils».

## v0.42
- Medalles de comarques: es mantenen les de cada comarca (essencials i comarca sencera) i s'hi afegeixen dues sèries globals, «Comarques amb els essencials» i «Comarques senceres», cadascuna al 25%, 50%, 75% i 100% del nombre de comarques. En obrir una sèrie global surt la llista de comarques fetes i, més apagades, les pendents amb el seu progrés.
- Medalles amb imatge pròpia: les imatges són a `medals/` (WebP) i es registren a `medimg.js` (id de medalla o sèrie → fitxer). Ara hi és la de «3000 catalans». La medalla conseguida es veu en color i la pendent en gris apagat. L'Excel `Medalles_imatges.xlsx` llista totes les medalles.

### v0.43 (medalles amb imatge)
- Contorn de la medalla 3000 catalans retallat més net (640 px).
- Les medalles amb imatge es veuen ~30% més grans.

### v0.43 (esborrar des del mapa)
- Als globus del mapa, els punts i les rutes tenen un botó «Esborra» (amb confirmació). Els punts que són cims de les llistes oficials no el mostren.

### v0.44 (canviar el nom)
- A la fitxa d'un punt i d'una ruta (des de Punts o des del globus del mapa → Detall) hi ha el botó «Canviar el nom»: edita el nom al lloc, Enter o «Desa».

### v0.45
- Es treu la vista ampliada de la imatge de les medalles (la mida actual a les fitxes ja és suficient).

### v0.46
- Torna la imatge gran de la medalla al detall, però ja no es pot tocar per ampliar-la a pantalla completa.

### v0.47
- Punts: es treuen els subapartats (anys a Rutes, «Rutes» dins de les categories) i el «X amb data» de la dreta dels títols.
- Asturias i Galicia passen a Astúries i Galícia (també als punts i rutes que ja tenies).

### v0.48
- Noves imatges de medalla: Primer 3000, 3000 del Pirineu (Principals i Tots els 3000) i 3000 catalans (substitueix l'anterior). 512 px, fons transparent.

## v0.49
- Cada medalla (Fites) mostra els requisits per aconseguir-la (en infinitiu).
- Imatges noves: 100 Cims (50…522, Repte 100, 100% essencials), 3000, 4000 Alps i comarques (essencials i senceres).
- «Primer 4000» (id a50). Noves medalles «més d'un en un mateix dia» (Especials): Golafre (3000), Golafre d'altura (4000) i Més d'un cim (llista FEEC; sense imatge encara).
- Noms 3000: Bateig al Pirineu, Pirineista, Llegenda del Pirineu.
- Imatges a `www/medals/`; registre a `medimg.js`.

## v0.50
- Les medalles amb imatge porten el títol de la imatge (p. ex. «Isard» per als 250 cims, «I ara... què?» per als 522, «Corona alpina» per als 4000); el nom anterior passa a subtítol.
- Requisits reescrits («Fer 100 cims de la llista, essencials o no.», «Fer els 150 cims essencials.», …).
- Nova icona de l'app. ATENCIÓ: la icona és a `app/src/main/res/mipmap-*/ic_launcher.png` i només canvia amb una APK nova (no per OTA).

## v0.51
- Cada foto de la fitxa d'un cim indica la font (FEEC o Viquipèdia / Wikimedia Commons) i la pantalla «Fonts» ho explica.

## v0.52
- Imatges de les medalles del cim més alt de sector: Aneto, Posets, Perdiguero i Pica d'Estats.
- Requisits dels cims més alts: «Pujar el Comaloforno (3.033 m), el més alt del sector Besiberri - Comaloforno».
- Els codis de zona (Z1, Z10…) ja no es mostren enlloc; els sectors es diuen p. ex. «Balaitús - Infiernos».
- Requisits de les medalles de 3000 sense referència a la UIAA («Pujar els 3000 principals del sector…», «Pujar tots els cims de 3000 m del sector…»).

## v0.53
- Mapa: el panell de capes/filtres es tanca en tocar qualsevol punt del mapa.

## v0.54
- Noms: Besiberri Sud, Besiberri Nord, Punta Alta de Comalesbienes, Tuc de Mulleres (sense «Molières»), Balaitús.
- Eliminats Agulla Nord de Malavesina i Sotllo Nord (3000 catalans: ara 11 vigents).
- Medalles de cim més alt de sector: nom curt i subtítol només amb l'alçada.
- «Pujar el teu primer 3000 del Pirineu.» i «Pujar el teu primer 4000 dels Alps.»

## v0.55
- Subtítols de les medalles curts i coherents, amb la xifra que cal assolir («250 cims», «11 essencials», «129 principals», «3.144 m»…).
- Majúscula a l'inici de cada subtítol i frase de les medalles.

## v0.55 (revisió)
- app.js: purga de les dades guardades dels cims eliminats (Sotllo Nord, Agulla Nord de Malavesina) i "Últims cims" ja no mostra ids sense nom.

## v0.56
- app.js / style.css: nou menú ⋯ › Importar › «Fitxer d'importació (.json)». Afegeix o actualitza punts d'escalada, alpinisme i ferrades amb les sortides per via (data, via, grau, companys, notes, fites). Fa còpia automàtica abans, no toca cims ni rutes, i es pot repetir sense duplicar.
- El fitxer amb les dades personals (Importar_escalades.json) NO es puja al repositori: només es carrega des de l'app.

## v0.57
- app.js: al mapa, «Els meus punts» ara es mostra per grups (Escalades, Ferrades, Alpinisme, Projectes…) amb una casella cadascun.
- style.css: lletra més gran i llegible a les sortides i notes dels punts.

## v0.58
- app.js / style.css: el panell de capes del mapa ara té seccions plegables (100 Cims, 3000 Pirineu, 4000 Alps, Els meus punts, Mapa base). Cada capçalera mostra la selecció actual; només n'hi ha una d'oberta a la vegada. «Els meus punts» té botons Tots / Cap.

## v0.59
- style.css: a la finestra de «Nova medalla!» la insígnia ja no tapa el text.
- app.js: les rutes del mapa surten en vermell (#E5173F) i més gruixudes.

## v0.60
- app.js / style.css: a Resum › «Últims cims», tocar un cim (o un punt) n'obre la fitxa. Cada fila mostra un › al costat del nom.

## v0.61
- Privacitat: el codi ja no porta dades personals. data.js (SEED) queda buit (una instal·lació nova comença de zero), app.js ja no inclou les llistes fixes de dates, altituds i notes de 3000, i plantilla.xlsx ja no porta punts, rutes ni marques personals. El progrés de cada mòbil no es toca.
  Les llistes antigues són a Dades_personals.json (NO es puja al repositori); es poden importar des de ⋯ › Importar › Fitxer d'importació i només omplen el que falti.
- Desat: l'estat es desa al fitxer de l'app (sense límit de mida) i a localStorage només mentre hi càpiga; en obrir es fa servir el més recent. Les còpies automàtiques passen a IndexedDB (es migren soles des de localStorage).
- Escalades: a la fitxa d'un punt d'Escalades, Alpinisme o Ferrades, botó «Afegir sortida» (data, via, grau, tipus, companys, etiqueta, notes). Tocar una sortida l'edita o l'esborra. Nou camp «Zona» als punts.
- Punts: Escalades agrupades per zona.
- Cerca global (lupa de dalt): cims de totes les llistes, punts, vies i sortides (també per companys) i rutes.
- Estadístiques: secció d'escalada, alpinisme i ferrades (jornades, vies, grau màxim, per any, amb qui, per tipus), segons el període triat.
- Fites: les 3 properes medalles en un carrusel que es llisca; «Per aconseguir» mostra 6 i la resta queda plegada.

## v0.62
- app.js / style.css: «Diari» (Resum › Últims cims › Diari ›). Totes les sortides en una sola línia de temps, per anys: ascensions de cims de les llistes, sortides d'escalada, punts amb data i rutes. Tocar una entrada n'obre la fitxa. No canvia com es desen les dades.
- Inclou també tot el de la v0.61.

## v0.63
- app.js / style.css / index.html: el Diari passa a ser una pantalla completa. A dalt, fixos: cerca (cim, via, company, nota…), filtre d'any (o tots) i de tipus (Cims, Escalada, Punts, Rutes). Les dates surten en una franja de color amb el nombre d'entrades del dia; cada entrada porta un punt del color del seu tipus.
- Inclou també tot el de la v0.61 i v0.62.

## v0.64
- Còpies automàtiques també en una carpeta del mòbil, fora de l'app (p. ex. «Backup Cims app» a l'arrel): ⋯ › Còpies automàtiques › Carpeta del mòbil. Es guarden les 10 últimes i es poden restaurar des d'allà.
- Part web (app.js) arriba per OTA. La part Android (MainActivity.java, BackupDir.java, versionCode 3) només funciona quan s'instal·la l'APK nou; mentrestant l'app mostra que cal l'APK nou i tot la resta funciona igual.
- Inclou també tot el de la v0.61, v0.62 i v0.63.

## v0.65
- app.js / style.css: Diari: l'any es tria en un desplegable (queda la cerca i els tipus).
- Fites: textos «Fer XX cims de la llista dels 100 cims»; la medalla «Essencials a la butxaca» diu «Fer tots els cims essencials.».
- Estadístiques › Per llista: cada llista es desplega i mostra els cims fets al període (amb data, tocant s'obre la fitxa). Hi ha 100 Cims, 3000 del Pirineu, 3000 catalans, 4000 Alps i Sostres comarcals.
- Inclou també tot el de la v0.61 a v0.64.

## v0.66
- app.js / style.css: Sortides vinculades a cims. Al formulari d'una sortida (escalada, alpinisme, ferrada…) hi ha «Cims d'aquesta sortida»: es busquen pel nom, i la sortida suggereix els cims que ja tenies marcats aquell dia.
- Cada cim vinculat suma una ascensió a la data de la sortida (si ja en tenia una el mateix dia, s'hi enllaça sense duplicar-la). Al cim apareix «↳ nom de la sortida» i es pot obrir; la data d'aquesta ascensió ve de la sortida.
- Si treus el cim de la sortida, s'esborra la sortida o s'esborra l'ascensió des del cim, queda tot coherent (l'ascensió que ja existia abans es conserva).
- Diari: una sortida amb cims surt en una sola línia («⛰ cim, cim»), sense duplicar els cims.
- Dades antigues compatibles: només s'afegeixen camps nous opcionals.
- Inclou també tot el de la v0.61 a v0.65.

## v0.67
- app.js: al formulari de sortida ja no hi ha el camp «Etiqueta» (Fita, Progressió, Lliçó, Retirada…). Les sortides que ja en tenien conserven el valor: es continua veient a la fitxa i les marcades «Retirada» continuen sense comptar a les estadístiques d'escalada.
- Companys: ja no surt la llista de suggeriments en escriure (es continua escrivint lliurement, separats per comes).
- Inclou també tot el de la v0.61 a v0.66.

## v0.68
- data.js / app.js: llista de 3000 del Pirineu i 3000 catalans actualitzada amb l'Excel «Tresmils_Pirineu»: 126 principals + 90 secundaris + l'Agulla Sud de Malavesina (llista catalana). 3000 catalans: 14 cims (Montcalm no hi és).
- Alçades: SITAR; si no n'hi ha, ICGC; si no, IGN; i si no, Buyse (excepció: el Pic de Boum, amb la d'IGN). Es mostren amb un decimal quan en tenen.
- S'han afegit 18 cims nous i s'han tret 14 que no són a la llista nova. Els cims que ja eren a la llista conserven el mateix identificador: el progrés no es perd. Els cims nous no tenen coordenades (no surten al mapa).
- Les medalles i textos del Pirineu s'adapten sols als nous recomptes.
- Inclou també tot el de la v0.61 a v0.67.

## v0.69
- Pic de Boum amb l'alçada d'IGN (3.006 m). Montcalm es queda als 3000 del Pirineu però no als 3000 catalans (14 cims).
- Els cims que han sortit de la llista de 3000 i que ja tenies fets (Diente Royo, Hito E de Perdiguero, Aguja de Lliterola…) passen a ser punts propis: el punt conserva la data i amb qui hi vas anar (a les notes). Si no tenien punt, se'n crea un. Es fa una sola vegada en obrir l'app.
- Inclou també tot el de la v0.61 a v0.68.

## v0.70
- data.js: coordenades afegides a 32 cims de 3000 (ara tots en tenen i surten al mapa). El «Nudillo del Monte Perdido» passa a dir-se així, sense el nom entre parèntesis.
- app.js: si tens un punt propi sense enllaç a menys de 100 m d'un d'aquests cims (p. ex. «Lentilla»), s'hi enllaça i el cim queda marcat com a fet amb les dates del punt. Es fa una sola vegada.
- Inclou també tot el de la v0.61 a v0.69.

## v0.71
- app.js: les sortides dels punts d'Alpinisme que ja tenen data (o dates) ara es creen soles a «Sortides» (una sola vegada, en obrir l'app). Si aquell dia tenies cims fets sense sortida, s'hi enllacen (així compten com a cims) i es copien els companys. No es perd res del que ja hi havia.
- Cas Pedraforca hivernal: queda enllaçat al Pollegó Superior amb les sortides del 04/12/2021 i 16/12/2024. La del 28/02/2026 l'has d'afegir tu amb «Afegir sortida» (no és a les dates del punt).
- Inclou també tot el de la v0.61 a v0.70.

## v0.72
- app.js: a «Cims d'aquesta sortida» (formulari de sortida d'escalada/alpinisme/ferrada) ara també es poden triar els teus punts propis de la categoria Cims (p. ex. Puig del Quer, Gra de Fajol Petit), a més dels cims de les llistes. Es poden afegir tants cims com vulguis a una mateixa sortida.
- El punt triat guarda la data de la sortida (surt al Diari i a «Últims cims») i a la seva fitxa apareix «Inclòs en sortides». També surten com a suggeriment («Fets aquest dia») els teus punts amb la mateixa data.
- Al carregar, les sortides d'Alpinisme d'un punt que té un punt-cim amb el mateix nom (Puig del Quer, Gra de Fajol Petit) s'hi enllacen soles (una vegada).
- Inclou també tot el de la v0.61 a v0.71.

## v0.73
- app.js / style.css: al formulari de sortida (alpinisme, escalada, ferrada), en afegir un cim (p. ex. l'Aneto) surten totes les vegades que l'has pujat (data i companys) i en tries la que correspon a la sortida: es posa la data i s'enllaça aquella ascensió. Només surten les ascensions que no són ja d'una altra sortida.
- Cada punt recorda els cims de l'última sortida: en afegir-ne una de nova ja surten posats (es poden treure amb la ×, o deixar-ho en blanc si no n'hi ha).
- Sense suggeriments en cap quadre de text: s'han tret les llistes de vies i de zones, i es desactiven l'autocompleció i el corrector del teclat. (La cerca de cims de la sortida es manté: serveix per afegir-los.)
- Inclou també tot el de la v0.61 a v0.72.

## v0.74
- app.js: els punts d'Alpinisme, Escalades i Ferrades ja no s'amaguen de «Els meus punts» encara que les coordenades coincideixin amb un cim de les llistes (p. ex. «Aneto hivernal (x3)», «Aneto per corredor Estasen», Pedraforca, Cambra d'Ase…). Abans només s'amagaven els punts que eren còpia d'un cim, però també s'enduien aquests.
- Aquests punts tampoc surten com a «cim» per afegir a una sortida (només els teus punts de Cims i els de les llistes).
- Inclou també tot el de la v0.61 a v0.73.

## v0.75
- app.js: els punts d'Alpinisme, Escalades i Ferrades tenen un camp nou «Cim que puja» (opcional) a «Nou punt» / «Editar». Busques el cim (llistes o punts propis de Cims) i el punt hi queda enllaçat:
  - la data del punt es converteix en una sortida enllaçada al cim (agafa l'ascensió d'aquell dia si ja existia, i els companys);
  - si el punt no té coordenades, agafa les del cim (i l'altitud si no en té);
  - les sortides noves ja surten amb aquest cim posat.
- A la fitxa del punt (des de Punts o des del mapa) surt «Cim» i una llista «Altres ascensions a …» amb les pujades normals al cim que no tenen cap sortida d'alpinisme/escalada associada.
- Els punts que ja tenien sortides enllaçades a cims (p. ex. «Aneto», «Aneto hivernal (x3)») queden enllaçats a aquests cims automàticament (una vegada) i, si no tenien coordenades, agafen les del cim.
- Inclou també tot el de la v0.61 a v0.74.

## v0.76
- app.js: un punt d'Alpinisme/Escalades/Ferrades enllaçat a un cim que no té coordenades agafa sempre les del cim (i l'altitud si no en té), s'hagi enllaçat des d'«Editar» o des d'una sortida. Es comprova també en obrir l'app, així que els punts que ja havies enllaçat (p. ex. Besiberri nord hivernal) es corregeixen sols.
- També funciona si el cim és un punt propi de Cims amb coordenades.
- Si el punt està enllaçat a diversos cims (p. ex. Aneto + Punta Oliveras-Arenas), agafa les coordenades del cim que té el mateix nom que el punt; si cap no hi coincideix, les del més alt.
- Correcció: un punt d'alpinisme ja no s'enllaça amb la còpia interna d'un cim de llista que tingui el mateix nom.
- «Altres ascensions» de la fitxa d'un punt d'alpinisme/escalada: tocant-ne una s'obre la fitxa del cim, on es poden editar les ascensions (companys, nom, data…).
- Les dates d'un punt d'escalada/alpinisme amb sortides són sempre les de les sortides: si el punt tenia alguna data sense sortida (per això «Jornades» no quadrava amb la llista), es converteix en una sortida (enllaçada al cim del punt). A «Editar» d'aquests punts ja no surt el camp «Data»: les dates es posen a les sortides.
- S'esborren totes les etiquetes de les sortides (Fita, Progressió, Lliçó, Retirada…) i ja no es mostren.
- Inclou també tot el de la v0.61 a v0.75.

## v0.77
- app.js: còpia a Dropbox arreglada. Si Dropbox rebutja la pujada (error 400 «Error in call to API function»), es torna a provar amb el format alternatiu de Dropbox (arguments a l'adreça i Content-Type «text/plain; charset=dropbox-cors-hack»), que evita les capçaleres que el WebView pot modificar. Si funciona, l'app ho recorda i ja el fa servir sempre.
- Si el token ha caducat (401), se'n demana un de nou i es reintenta.
- La còpia (.json) es dona per feta encara que l'Excel o el KMZ fallin (abans un error de l'Excel o del KMZ feia que «última» quedés en «mai»).
- L'error es mostra sencer i diu quin fitxer ha fallat (Còpia, Excel o KMZ).
- Inclou també tot el de la v0.61 a v0.76.

## v0.78
- app.js / style.css: «Altres ascensions» de la fitxa d'un punt d'alpinisme/escalada es pot plegar i desplegar; surt plegat per defecte.
- Ja no es mostra el títol de l'activitat de Strava / Sports Tracker a «Altres ascensions»: només la data (i el cim si n'hi ha diversos) i els companys.
- Cada ascensió d'«Altres ascensions» té un botó «↑ Passar a sortida»: la converteix en una sortida d'aquest punt (amb els cims del punt fets aquell dia i els companys), i deixa de sortir a «Altres ascensions».
- Inclou també tot el de la v0.61 a v0.77.

## v0.79
- app.js / style.css: tocant una ascensió d'«Altres ascensions» (fitxa d'un punt d'alpinisme/escalada) s'obren les ascensions del cim amb la triada ressaltada (vora verda) i la llista hi fa scroll.
- Inclou també tot el de la v0.61 a v0.78.

## v0.80
- app.js: punts d'escalada/alpinisme amb sortides: les dates del punt escrites en text (p. ex. «2015») que no tenien sortida també es converteixen en sortida, perquè «Jornades» quadri amb la llista de sortides.
- Dropbox: si a l'app de Dropbox li falta un permís (p. ex. «files.content.write»), es mostra en català què cal fer (activar-lo a Permissions, desconnectar i tornar a connectar).
- Inclou també tot el de la v0.61 a v0.79.

## v0.81
- app.js / style.css: a «Els meus punts» → Escalades, cada zona (Montserrat, Siurana…) es pot plegar i desplegar tocant-ne el títol. Surten plegades per defecte; l'app recorda quines tens obertes. «Desplegar-ho tot» també les obre, i en cercar es mostren obertes.
- Inclou també tot el de la v0.61 a v0.80.

## v0.82
- app.js / style.css: grups de «Els meus punts»:
  - botó «Grups» (al costat de «Desplegar-ho tot»): llista de grups amb quants elements tenen, «Esborrar» i camp per crear-ne un de nou;
  - en esborrar un grup, els seus punts passen a «Altres» i les seves rutes a «Rutes» (no es perd res). «Altres» no es pot esborrar;
  - en canviar la categoria d'un punt o ruta («Canviar» / «Moure») també es pot crear un grup nou i moure-hi l'element directament.
- Rutes (tracks): botó «Activitat i cims» a la fitxa de la ruta. Hi tries l'activitat (Senderisme, Alpinisme, Escalada, Ferrata, Esquí de muntanya…) i els cims (cerca o suggeriments «Fets aquest dia»), com a les sortides d'alpinisme:
  - cada cim queda amb l'ascensió del dia de la ruta (si ja existia, s'hi enllaça);
  - a la fitxa del cim, l'ascensió mostra «↳ nom de la ruta · Veure la ruta ›»;
  - a la fitxa de la ruta surten l'activitat i els cims (tocant-ne un s'obre el cim);
  - al Diari, la ruta mostra l'activitat i els cims, sense repetir el cim a part;
  - en esborrar la ruta, les ascensions creades per la ruta s'esborren i les que ja existien es queden.
- Inclou també tot el de la v0.61 a v0.81.

## v0.83
- app.js / style.css: als teus punts propis que no són d'escalada/alpinisme (p. ex. els de «Cims»), la fitxa mostra una llista «Ascensions» com la dels cims de les llistes: cada data amb «＋ Amb qui hi vas pujar» (editable), canviar-ne la data, esborrar-la (×) i «+ Afegir una ascensió». Si aquell dia hi ha una sortida d'alpinisme que inclou el cim, en mostra la via i els companys.
- Diari: aquestes ascensions mostren els companys.
- Rutes: l'activitat ja no ofereix «Esquí de muntanya», «Córrer / trail» ni «Bicicleta».
- Inclou també tot el de la v0.61 a v0.82.

## v0.84
- app.js: les ascensions dels teus punts propis (p. ex. «Cims») tenen ara exactament el mateix aspecte que les dels cims de les llistes: capçalera «N ascensions · data buida = sense data», «＋ Afegir nota (amb qui, com va anar…)», editor amb «Desar nota / Cancel·lar / Esborrar nota», i les dates que vénen d'una sortida d'alpinisme surten bloquejades amb «↳ via · punt · Veure la sortida ›».
- La secció «Inclòs en sortides» d'aquests punts desapareix: ara aquestes sortides surten dins la mateixa llista d'ascensions.
- Inclou també tot el de la v0.61 a v0.83.

## v0.85 · Versió web (iPhone)
- Nova versió web instal·lable (PWA) per a l'iPhone i el navegador, publicada en un repositori públic apart (veure «Versión web» més amunt). L'app d'Android no canvia.
- index.html: manifest, icones i metes d'iOS; l'estat es llegeix de IndexedDB abans d'arrencar (només a la web).
- app.js: a la web l'estat es desa també a IndexedDB (localStorage té límit de ~5 MB); avís si no es pot desar; fotos des de la mateixa web; actualitzacions amb el service worker («Hi ha una versió nova» · Actualitzar); «Exportar» obre el full de compartir de l'iPhone; mantenir premut el mapa per afegir un punt també a l'app instal·lada de l'iPhone.
- style.css: marges de l'iPhone (entalla i barra inferior) i lletra de 16 px als camps perquè l'iPhone no faci zoom; només a la web.
- sw.js, manifest.webmanifest i icons/: nous. .github/workflows/publish-web.yml: nou.
- Inclou també tot el de la v0.61 a v0.84.
