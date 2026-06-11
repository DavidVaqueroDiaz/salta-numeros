# Genera los iconos PNG de la PWA (192 y 512) dibujando el bloque rojo del "1".
Add-Type -AssemblyName System.Drawing

$dir = Join-Path $PSScriptRoot '..\public\icons'
New-Item -ItemType Directory -Force $dir | Out-Null

function New-Icon([int]$size, [string]$path) {
  $bmp = New-Object System.Drawing.Bitmap($size, $size)
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = 'AntiAlias'
  $g.TextRenderingHint = 'AntiAlias'
  # Fondo rojo a sangre completa: sirve tambien como icono maskable
  $g.Clear([System.Drawing.Color]::FromArgb(255, 230, 57, 70))
  $u = $size / 100.0
  $blanco = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::White)
  $oscuro = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 29, 53, 87))
  # Ojos
  $g.FillEllipse($blanco, 24 * $u, 18 * $u, 18 * $u, 18 * $u)
  $g.FillEllipse($blanco, 58 * $u, 18 * $u, 18 * $u, 18 * $u)
  $g.FillEllipse($oscuro, 31 * $u, 24 * $u, 8 * $u, 8 * $u)
  $g.FillEllipse($oscuro, 65 * $u, 24 * $u, 8 * $u, 8 * $u)
  # Sonrisa
  $pen = New-Object System.Drawing.Pen ([System.Drawing.Color]::FromArgb(255, 29, 53, 87)), ([single](3.5 * $u))
  $pen.StartCap = 'Round'
  $pen.EndCap = 'Round'
  $g.DrawArc($pen, [single](38 * $u), [single](30 * $u), [single](24 * $u), [single](16 * $u), 20, 140)
  # Numeral 1 grande
  $font = New-Object System.Drawing.Font('Segoe UI', [single](42 * $u), [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Pixel)
  $fmt = New-Object System.Drawing.StringFormat
  $fmt.Alignment = 'Center'
  $fmt.LineAlignment = 'Center'
  $rect = New-Object System.Drawing.RectangleF(0, [single](48 * $u), [single]$size, [single](46 * $u))
  $g.DrawString('1', $font, $blanco, $rect, $fmt)
  $g.Dispose()
  $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
  $bmp.Dispose()
  Write-Host "Creado $path"
}

New-Icon 192 (Join-Path $dir 'icon-192.png')
New-Icon 512 (Join-Path $dir 'icon-512.png')
