# Script de remplacement des images par des versions responsives
# Remplace les images simples par des srcset optimisés

Write-Host "=== Remplacement des images par srcset ===" -ForegroundColor Cyan
Write-Host ""

$replacements = @(
  @{
    name = "hero-background (eager - page d'accueil)"
    files = @("src\app\features\home\components\hero\hero.component.html")
    pattern = 'ngSrc="assets/images/hero-background\.webp"[^>]*>'
    replacement = @'
ngSrc="assets/images/hero-background-large.webp"
      ngSrcset="assets/images/hero-background-small.webp 400w,
                assets/images/hero-background-medium.webp 800w,
                assets/images/hero-background-large.webp 1200w"
      sizes="(max-width: 600px) 400px,
             (max-width: 1024px) 800px,
             1200px"
      width="1200"
      height="991"
      alt="Bibliothèque de Montferrand"
      loading="eager"
      priority>
'@
  },
  @{
    name = "hero-background (lazy - pages auth)"
    files = @(
      "src\app\features\auth\login.component.html",
      "src\app\features\auth\register.component.html"
    )
    pattern = 'ngSrc="assets/images/hero-background\.webp"[^>]*>'
    replacement = @'
ngSrc="assets/images/hero-background-large.webp"
      ngSrcset="assets/images/hero-background-small.webp 400w,
                assets/images/hero-background-medium.webp 800w,
                assets/images/hero-background-large.webp 1200w"
      sizes="(max-width: 600px) 400px,
             (max-width: 1024px) 800px,
             1200px"
      width="1200"
      height="991"
      alt="Bibliothèque"
      loading="lazy">
'@
  },
  @{
    name = "hero-background (lazy - composants TypeScript)"
    files = @(
      "src\app\features\auth\confirm-email.component.ts",
      "src\app\features\auth\forgot-password.component.ts",
      "src\app\features\auth\register-success.component.ts",
      "src\app\features\auth\reset-password.component.ts"
    )
    pattern = 'ngSrc="assets/images/hero-background\.webp"[^>]*>'
    replacement = 'ngSrc="assets/images/hero-background-large.webp" ngSrcset="assets/images/hero-background-small.webp 400w, assets/images/hero-background-medium.webp 800w, assets/images/hero-background-large.webp 1200w" sizes="(max-width: 600px) 400px, (max-width: 1024px) 800px, 1200px" width="1200" height="991" alt="Bibliothèque" loading="lazy">'
  },
  @{
    name = "team-presentation"
    files = @(
      "src\app\features\home\components\team-presentation\team-presentation.component.html"
    )
    pattern = 'ngSrc="assets/images/team-presentation\.webp"[^>]*>'
    replacement = @'
ngSrc="assets/images/team-presentation-medium.webp"
        ngSrcset="assets/images/team-presentation-small.webp 400w,
                  assets/images/team-presentation-medium.webp 800w"
        sizes="(max-width: 600px) 400px, 800px"
        width="800"
        height="600"
        alt="Présentation de l'équipe"
        loading="lazy">
'@
  },
  @{
    name = "books-background"
    files = @(
      "src\app\features\home\components\library-info-section\library-info-section.component.html"
    )
    pattern = 'ngSrc="assets/images/books-background\.webp"[^>]*>'
    replacement = @'
ngSrc="assets/images/books-background-medium.webp"
        ngSrcset="assets/images/books-background-small.webp 400w,
                  assets/images/books-background-medium.webp 800w"
        sizes="(max-width: 600px) 400px, 800px"
        width="800"
        height="600"
        alt="Livres"
        loading="lazy">
'@
  }
)

$totalModified = 0

foreach ($repl in $replacements) {
  Write-Host "`nTraitement: $($repl.name)" -ForegroundColor Yellow

  foreach ($file in $repl.files) {
    if (Test-Path $file) {
      $content = Get-Content $file -Raw
      $newContent = $content -replace $repl.pattern, $repl.replacement

      if ($content -ne $newContent) {
        Set-Content $file -Value $newContent -NoNewline
        Write-Host "  [OK] $file modifié" -ForegroundColor Green
        $totalModified++
      } else {
        Write-Host "  [SKIP] $file - aucune correspondance trouvée" -ForegroundColor Gray
      }
    } else {
      Write-Host "  [SKIP] $file - fichier introuvable" -ForegroundColor Gray
    }
  }
}

Write-Host "`n=== Terminé ===" -ForegroundColor Cyan
Write-Host "Fichiers modifiés: $totalModified" -ForegroundColor Green
Write-Host ""
Write-Host "Prochaines étapes:" -ForegroundColor Yellow
Write-Host "1. Vérifier que l'app compile: ng build" -ForegroundColor White
Write-Host "2. Tester en local: ng serve" -ForegroundColor White
Write-Host "3. Vérifier visuellement que les images s'affichent correctement" -ForegroundColor White
Write-Host "4. Commit et push les modifications" -ForegroundColor White
