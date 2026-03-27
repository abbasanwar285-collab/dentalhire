Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem -Path "android\app\src\main\res\mipmap*" -Filter "*.png" -Recurse
foreach ($file in $files) {
    try {
        $bytes = Get-Content $file.FullName -Encoding Byte -TotalCount 3
        if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) {
            Write-Host "Fixing JPEG disguised as PNG: $($file.FullName)"
            $img = [System.Drawing.Image]::FromFile($file.FullName)
            $tempPath = "$($file.FullName).tmp.png"
            $img.Save($tempPath, [System.Drawing.Imaging.ImageFormat]::Png)
            $img.Dispose()
            Move-Item -Path $tempPath -Destination $file.FullName -Force
        }
    } catch {
        Write-Warning "Failed to process $($file.FullName): $_"
    }
}
