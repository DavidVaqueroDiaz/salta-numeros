// Lanzador de Salta Números: sirve el juego (embebido en el exe) en
// http://localhost y abre el navegador. Sin instalación, sin internet.
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

// --- Arrancar el servidor en el primer puerto libre ---
HttpListener? listener = null;
var puerto = 38754;
for (; puerto < 38790; puerto++)
{
    try
    {
        listener = new HttpListener();
        listener.Prefixes.Add($"http://localhost:{puerto}/");
        listener.Start();
        break;
    }
    catch (HttpListenerException)
    {
        listener = null;
    }
}
if (listener is null)
{
    Console.WriteLine("No se pudo abrir ningún puerto. Cierra otras copias del juego.");
    Console.ReadKey();
    return;
}

var url = $"http://localhost:{puerto}/";
Console.WriteLine("🔢 Salta Números");
Console.WriteLine($"   Juego disponible en {url}");
Console.WriteLine("   Se está abriendo tu navegador...");
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
