# Script d'optimisation des images pour BiblioMate
# Utilise ImageMagick avec chemin complet

$magick = "C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"

Write-Host "=== Optimisation des images ===" -ForegroundColor Cyan
Write-Host ""

# Vérifier que ImageMagick existe
if (-not (Test-Path $magick)) {
  Write-Host "[ERREUR] ImageMagick introuvable à: $magick" -ForegroundColor Red
  exit 1
}

# Aller dans le dossier images
cd "src\assets\images"

# hero-background.webp
Write-Host "Traitement de hero-background.webp..." -ForegroundColor Yellow
& $magick hero-background.webp -resize 400x -quality 85 hero-background-small.webp
Write-Host "  -> hero-background-small.webp créé (400px)" -ForegroundColor Green

& $magick hero-background.webp -resize 800x -quality 85 hero-background-medium.webp
Write-Host "  -> hero-background-medium.webp créé (800px)" -ForegroundColor Green

& $magick hero-background.webp -resize 1200x -quality 85 hero-background-large.webp
Write-Host "  -> hero-background-large.webp créé (1200px)" -ForegroundColor Green

# team-presentation.webp
Write-Host "`nTraitement de team-presentation.webp..." -ForegroundColor Yellow
& $magick team-presentation.webp -resize 400x -quality 85 team-presentation-small.webp
Write-Host "  -> team-presentation-small.webp créé (400px)" -ForegroundColor Green

& $magick team-presentation.webp -resize 800x -quality 85 team-presentation-medium.webp
Write-Host "  -> team-presentation-medium.webp créé (800px)" -ForegroundColor Green

# books-background.webp (si existe)
if (Test-Path "books-background.webp") {
  Write-Host "`nTraitement de books-background.webp..." -ForegroundColor Yellow
  & $magick books-background.webp -resize 400x -quality 85 books-background-small.webp
  Write-Host "  -> books-background-small.webp créé (400px)" -ForegroundColor Green

  & $magick books-background.webp -resize 800x -quality 85 books-background-medium.webp
  Write-Host "  -> books-background-medium.webp créé (800px)" -ForegroundColor Green
}

# Retour au dossier frontend
cd ..\..\..

Write-Host "`n=== Récapitulatif des tailles ===" -ForegroundColor Cyan
Get-ChildItem "src\assets\images\*-small.webp", "src\assets\images\*-medium.webp", "src\assets\images\*-large.webp" |
  Select-Object Name, @{Name="Taille (KiB)";Expression={[math]::Round($_.Length/1KB,1)}} |
  Format-Table -AutoSize

Write-Host "Terminé ! Les images ont été optimisées." -ForegroundColor Green
