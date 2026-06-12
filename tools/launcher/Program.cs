// Lanzador de Salta Números: sirve el juego (embebido en el exe) SIEMPRE en
// http://localhost:38754 y guarda el progreso en un fichero junto al exe.
using System.Diagnostics;
using System.IO.Compression;
using System.Net;
using System.Reflection;
using System.Text;

Console.OutputEncoding = Encoding.UTF8;
Console.Title = "Salta Números";

// --- Cargar el juego desde el zip embebido ---
var archivos = new Dictionary<string, byte[]>(StringComparer.OrdinalIgnoreCase);
using (var recurso = Assembly.GetExecutingAssembly()
         .GetManifestResourceStream("SaltaNumeros.webroot.zip")
       ?? throw new InvalidOperationException("Falta el recurso webroot.zip"))
using (var zip = new ZipArchive(recurso))
{
    foreach (var entrada in zip.Entries.Where(e => e.Length > 0))
    {
        using var ms = new MemoryStream();
        entrada.Open().CopyTo(ms);
        archivos[entrada.FullName.Replace('\\', '/')] = ms.ToArray();
    }
}

var mime = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
{
    [".html"] = "text/html; charset=utf-8",
    [".js"] = "text/javascript; charset=utf-8",
    [".css"] = "text/css; charset=utf-8",
    [".png"] = "image/png",
    [".svg"] = "image/svg+xml",
    [".ico"] = "image/x-icon",
    [".json"] = "application/json",
    [".webmanifest"] = "application/manifest+json",
};

// Fichero de progreso junto al exe (sobrevive a todo)
var carpetaExe = Path.GetDirectoryName(Environment.ProcessPath) ?? ".";
var rutaProgreso = Path.Combine(carpetaExe, "progreso-salta-numeros.json");

// --- SIEMPRE el puerto 38754 (el guardado del navegador depende de él).
//     Si está ocupado, espera unos segundos a que se libere; si sigue vivo,
//     es que el juego ya está abierto: enseña esa ventana y sal. ---
const int PUERTO = 38754;
var url = $"http://localhost:{PUERTO}/";
HttpListener? listener = null;
for (var intento = 0; intento < 14 && listener is null; intento++)
{
    try
    {
        listener = new HttpListener();
        listener.Prefixes.Add(url);
        listener.Start();
    }
    catch (HttpListenerException)
    {
        listener = null;
        if (intento == 0)
            Console.WriteLine("Esperando a que se cierre la copia anterior del juego…");
        Thread.Sleep(500);
    }
}
if (listener is null)
{
    Console.WriteLine("El juego ya está abierto: usa esa ventana del navegador.");
    Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });
    Thread.Sleep(1500);
    return;
}

Console.WriteLine("🔢 Salta Números");
Console.WriteLine($"   Juego disponible en {url}");
Console.WriteLine($"   Progreso guardado en {rutaProgreso}");
Console.WriteLine();
Console.WriteLine("   ⚠️  CIERRA ESTA VENTANA cuando termines de jugar.");

if (!args.Contains("--sin-navegador"))
    Process.Start(new ProcessStartInfo { FileName = url, UseShellExecute = true });

// --- Atender peticiones ---
while (true)
{
    var contexto = listener.GetContext();
    _ = Task.Run(() =>
    {
        try
        {
            var ruta = contexto.Request.Url?.AbsolutePath.TrimStart('/') ?? "";

            // API de progreso: el juego lee y escribe el fichero
            if (ruta.Equals("api/progreso", StringComparison.OrdinalIgnoreCase))
            {
                byte[] respuesta;
                if (contexto.Request.HttpMethod == "POST")
                {
                    using var lector = new StreamReader(contexto.Request.InputStream, Encoding.UTF8);
                    // UTF-8 SIN BOM: el JSON.parse del juego no tolera el BOM
                    File.WriteAllText(rutaProgreso, lector.ReadToEnd(), new UTF8Encoding(false));
                    respuesta = Encoding.UTF8.GetBytes("{\"ok\":true}");
                }
                else
                {
                    respuesta = File.Exists(rutaProgreso)
                        ? File.ReadAllBytes(rutaProgreso)
                        : Encoding.UTF8.GetBytes("{}");
                }
                contexto.Response.ContentType = "application/json";
                contexto.Response.ContentLength64 = respuesta.Length;
                contexto.Response.OutputStream.Write(respuesta);
                contexto.Response.Close();
                return;
            }

            if (ruta.Length == 0) ruta = "index.html";
            if (!archivos.TryGetValue(ruta, out var cuerpo))
            {
                cuerpo = archivos["index.html"]; // SPA: lo demás vuelve al juego
                ruta = "index.html";
            }
            var ext = Path.GetExtension(ruta);
            contexto.Response.ContentType =
                mime.TryGetValue(ext, out var tipo) ? tipo : "application/octet-stream";
            contexto.Response.ContentLength64 = cuerpo.Length;
            contexto.Response.OutputStream.Write(cuerpo);
            contexto.Response.Close();
        }
        catch
        {
            // el navegador cortó la conexión: sin problema
        }
    });
}
