# Construye "Salta Numeros.exe" en la raiz del proyecto.
# Uso:  powershell -ExecutionPolicy Bypass -File tools\build-exe.ps1
# Requiere: SDK de .NET 8 y haber hecho antes "npm run build" (carpeta dist).
$ErrorActionPreference = 'Stop'
$raiz = Split-Path $PSScriptRoot -Parent
$launcher = Join-Path $PSScriptRoot 'launcher'
$dist = Join-Path $raiz 'dist'

if (-not (Test-Path (Join-Path $dist 'index.html'))) {
  Write-Host 'No existe dist\index.html. Ejecuta primero: npm run build' -ForegroundColor Red
  exit 1
}

# 1. Icono del exe: el PNG de 512 reescalado a 256 dentro de un .ico
$png256 = Join-Path $env:TEMP 'salta-icon-256.png'
Add-Type -AssemblyName System.Drawing
$origen = [System.Drawing.Image]::FromFile((Join-Path $raiz 'public\icons\icon-512.png'))
$bmp = New-Object System.Drawing.Bitmap($origen, 256, 256)
$origen.Dispose()
$bmp.Save($png256, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
$pngBytes = [System.IO.File]::ReadAllBytes($png256)
$ico = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ico)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]1)        # cabecera ICO
$bw.Write([byte]0); $bw.Write([byte]0)                                  # 256x256 (0 = 256)
$bw.Write([byte]0); $bw.Write([byte]0); $bw.Write([uint16]1); $bw.Write([uint16]32)
$bw.Write([uint32]$pngBytes.Length); $bw.Write([uint32]22)              # tamano y offset
$bw.Write($pngBytes)
[System.IO.File]::WriteAllBytes((Join-Path $launcher 'app.ico'), $ico.ToArray())
$bw.Dispose()

# 2. Comprimir dist dentro del launcher
$zip = Join-Path $launcher 'webroot.zip'
if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $dist '*') -DestinationPath $zip

# 3. Publicar el exe unico autocontenido
dotnet publish $launcher -c Release -o (Join-Path $launcher 'publish') --nologo -v q
if ($LASTEXITCODE -ne 0) { exit 1 }

# 4. Copiarlo a la raiz con nombre amigable
Copy-Item (Join-Path $launcher 'publish\SaltaNumeros.exe') (Join-Path $raiz 'Salta Numeros.exe') -Force
$tam = [math]::Round((Get-Item (Join-Path $raiz 'Salta Numeros.exe')).Length / 1MB, 1)
Write-Host "Listo: Salta Numeros.exe ($tam MB) en la raiz del proyecto" -ForegroundColor Green
