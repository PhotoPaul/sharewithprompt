Add-Type -AssemblyName System.Drawing

function Create-Icon($size, $path) {
    $bmp = New-Object System.Drawing.Bitmap $size, $size
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.Clear([System.Drawing.Color]::FromArgb(30, 30, 30)) # Dark background
    
    # Draw a circle
    $brush = [System.Drawing.Brushes]::BlueViolet
    $margin = $size * 0.1
    $g.FillEllipse($brush, $margin, $margin, $size - ($margin * 2), $size - ($margin * 2))
    
    # Draw text (G)
    $font = New-Object System.Drawing.Font "Arial", ($size * 0.5), [System.Drawing.FontStyle]::Bold
    $textBrush = [System.Drawing.Brushes]::White
    $format = New-Object System.Drawing.StringFormat
    $format.Alignment = [System.Drawing.StringAlignment]::Center
    $format.LineAlignment = [System.Drawing.StringAlignment]::Center
    
    $g.DrawString("G", $font, $textBrush, ($size / 2), ($size / 2), $format)
    
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose()
    $bmp.Dispose()
}

Create-Icon 192 "d:\ShareWithPrompt\icon-192.png"
Create-Icon 512 "d:\ShareWithPrompt\icon-512.png"
