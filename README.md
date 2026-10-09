# Panel de Customizations para DeepSeek Harness

Paquete único instalable que agrega la sección **Settings → Customizations** (Skills, servidores MCP, reglas de instrucciones y balance de la API) a un DeepSeek Harness que no la trae, incluida la versión de escritorio.

## Qué contiene

Un solo paquete con los dos roles:

| Export | Rol |
|---|---|
| `.` | Servicio Host `customizations` (Typert Remote) que lee el inventario. |
| `./client` | Cara navegador: la sección de Settings. |
| `./typert` | Reflexión Host del servicio. |

La cara navegador **auto-monta su Remote** si el build del Desktop no selecciona el namespace `customizations`, así que funciona en versiones que todavía no traen el panel.

El paquete declara `dsh.bundle.patch`; al instalarlo, su patch inserta la fila del Loader que monta ambos roles.

## Instalar

1. Crea un repositorio vacío en GitHub (sin README ni .gitignore).
2. Desde esta carpeta:
   ```sh
   git remote add origin git@github.com:TU-USUARIO/dsh-customizations.git
   git push -u origin main
   git tag v1.0.0
   git push origin v1.0.0
   ```
   (El historial ya está inicializado aquí.)
3. En DeepSeek Harness: **Plugins → Add plugin**, escribe
   ```
   github:TU-USUARIO/dsh-customizations#v1.0.0
   ```
   y pulsa **Install**. Si el Host pide reiniciar, reinicia la aplicación.

El paquete ya viene compilado (`lib/`), así que **no hay build en la instalación** ni hace falta aprobar scripts con `allowBuilds`. La única dependencia de registro es `zod`.

## Desinstalar

**Plugins** → tarjeta del bundle → desinstalar. O por CLI:

```sh
dsh plugin --profile <perfil> remove @deepseek-ai/dsh-customizations-panel
```

## Requisitos y límites

- El Host necesita las filas base del Web app (`api-remotes`, `pluginManager`, slot de Settings, `typert-loader`) que todo perfil con GUI ya trae.
- Las APIs de DSH son pre-estables: el panel se probó contra la versión del checkout que lo generó. Otra versión puede requerir ajustes.
- El código Host instalado se ejecuta dentro del proceso, fuera del sandbox del workspace: instala solo lo que confíes.
- Los plugins instalados no se actualizan solos: para una versión nueva, desinstala e instala otra vez con el tag nuevo.
