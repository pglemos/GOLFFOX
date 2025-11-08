<#
 .SYNOPSIS
   Remove deployments antigos de Preview no Vercel via API.

 .DESCRIPTION
   Lista e exclui deployments de Preview mais antigos que X dias para um projeto Vercel.
   Requer um token de API Vercel com escopo completo e o projectId. Opcionalmente, teamId ou team slug.

 .PARAMETER Days
   Idade mínima em dias para considerar um deployment elegível à remoção. Default: 14.

 .PARAMETER ActuallyDelete
   Quando verdadeiro, executa a deleção. Caso contrário, executa em modo de simulação (dry-run).

 .USAGE
   $env:VERCEL_TOKEN = "<token>"
   $env:VERCEL_PROJECT_ID = "<projectId>"
   # Opcional: $env:VERCEL_TEAM_ID = "team_..." OU $env:VERCEL_TEAM_SLUG = "my-team"
   # Remoção por idade (preview):
   ./scripts/deploy/cleanup-vercel-deployments.ps1 -Days 21 -ActuallyDelete $true

   # Remoção direta por IDs:
   ./scripts/deploy/cleanup-vercel-deployments.ps1 -DeploymentIds BzpQC68k6,BLnqmn2Do -ActuallyDelete $true
   # Para permitir apagar deployments de produção explicitamente:
   ./scripts/deploy/cleanup-vercel-deployments.ps1 -DeploymentIds E9WL5b3nE -AllowProductionDeletion -ActuallyDelete $true

 .NOTES
   Endpoint de listar: https://api.vercel.com/v6/deployments
   Endpoint de deletar: https://api.vercel.com/v13/deployments/{id}
#>

param(
  [int]$Days = 14,
  [bool]$ActuallyDelete = $false,
  [string[]]$DeploymentIds,
  [switch]$AllowProductionDeletion,
  [string]$ProjectId,
  [string]$TeamId,
  [string]$TeamSlug
)

$ErrorActionPreference = 'Stop'

function Get-Env([string]$name) {
  $value = [Environment]::GetEnvironmentVariable($name)
  if (-not $value) { return $null }
  return $value.Trim()
}

$token = Get-Env 'VERCEL_TOKEN'
if (-not $token) {
  Write-Error "VERCEL_TOKEN ausente. Gere um token em https://vercel.com/account/tokens e exporte em VERCEL_TOKEN."; exit 1
}

$projectId = if ($ProjectId) { $ProjectId.Trim() } else { Get-Env 'VERCEL_PROJECT_ID' }
if (-not $projectId -and (-not $DeploymentIds -or $DeploymentIds.Count -eq 0)) {
  Write-Error "ProjectId não informado. Passe -ProjectId ou exporte VERCEL_PROJECT_ID, ou forneça -DeploymentIds para deleção direta."; exit 1
}

$teamId = if ($TeamId) { $TeamId.Trim() } else { Get-Env 'VERCEL_TEAM_ID' }
$teamSlug = if ($TeamSlug) { $TeamSlug.Trim() } else { Get-Env 'VERCEL_TEAM_SLUG' }

$headers = @{ 'Authorization' = "Bearer $token" }

$teamQuery = ''
if ($teamId) { $teamQuery = "&teamId=$teamId" }
elseif ($teamSlug) { $teamQuery = "&slug=$teamSlug" }

function Get-DeploymentById([string]$id) {
  $url = "https://api.vercel.com/v13/deployments/$id"
  if ($teamId) { $url = "$url?teamId=$teamId" }
  elseif ($teamSlug) { $url = "$url?slug=$teamSlug" }
  try {
    return Invoke-RestMethod -Method Get -Uri $url -Headers $headers
  } catch {
    Write-Warning ("Falha ao obter detalhes de {0}: {1}" -f $id, $_.Exception.Message)
    return $null
  }
}

if ($DeploymentIds -and $DeploymentIds.Count -gt 0) {
  Write-Host "Processando deleção direta de $($DeploymentIds.Count) deployment(s) por ID..." -ForegroundColor Cyan

  $deleted = 0
  foreach ($rawId in $DeploymentIds) {
    $id = $rawId.Trim()
    if (-not $id) { continue }

    $details = Get-DeploymentById $id
    $target = $details.target
    $url = $details.url
    if ($target -eq 'production' -and -not $AllowProductionDeletion) {
      Write-Warning ("Ignorado {0}: alvo=production. Use -AllowProductionDeletion para apagar produção." -f $id)
      continue
    }

    if (-not $ActuallyDelete) {
      Write-Host ("Dry-run: removeria id={0} alvo={1} url={2}" -f $id, ($target ?? 'desconhecido'), ($url ?? 'n/d')) -ForegroundColor Yellow
      continue
    }

    $delUrl = "https://api.vercel.com/v13/deployments/$id"
    if ($teamId) { $delUrl = "$delUrl?teamId=$teamId" }
    elseif ($teamSlug) { $delUrl = "$delUrl?slug=$teamSlug" }

    try {
      $null = Invoke-RestMethod -Method Delete -Uri $delUrl -Headers $headers
      Write-Host "OK: deletado $id ($url)" -ForegroundColor Green
      $deleted++
    } catch {
      Write-Warning ("Falha ao deletar {0}: {1}" -f $id, $_.Exception.Message)
    }
  }

  if ($ActuallyDelete) {
    Write-Host "Concluído. Total deletado: $deleted" -ForegroundColor Green
  } else {
    Write-Host "Dry-run concluído. Sem deleções executadas." -ForegroundColor Cyan
  }

  exit 0
}

Write-Host "Listando deployments de projeto $projectId (preview) com idade > $Days dias..." -ForegroundColor Cyan

$limit = 100
$listUrl = "https://api.vercel.com/v6/deployments?projectId=$projectId&limit=$limit$teamQuery"
$response = Invoke-RestMethod -Method Get -Uri $listUrl -Headers $headers

if (-not $response) { Write-Error "Resposta vazia da API Vercel."; exit 1 }

# createdAt é epoch em milissegundos
$cutoff = (Get-Date).AddDays(-$Days)

$deployments = $response.deployments | Where-Object {
  $_.target -eq 'preview' -and (
    (Get-Date -Date '1970-01-01').AddMilliseconds([double]$_.createdAt) -lt $cutoff
  )
}

if (-not $deployments -or $deployments.Count -eq 0) {
  Write-Host "Nenhum deployment de preview elegível à remoção." -ForegroundColor Green
  exit 0
}

Write-Host "Encontrados $($deployments.Count) deployments elegíveis:" -ForegroundColor Yellow
$deployments | ForEach-Object {
  $created = (Get-Date -Date '1970-01-01').AddMilliseconds([double]$_.createdAt)
  Write-Host ("- id={0} url={1} criadoEm={2:yyyy-MM-dd HH:mm}" -f $_.uid, $_.url, $created)
}

if (-not $ActuallyDelete) {
  Write-Host "Dry-run: nenhuma deleção realizada. Use -ActuallyDelete \$true para executar." -ForegroundColor Cyan
  exit 0
}

Write-Host "Iniciando deleção de deployments..." -ForegroundColor Magenta

$deleted = 0
foreach ($dep in $deployments) {
  $id = $dep.uid
  if (-not $id) { continue }
  $delUrl = "https://api.vercel.com/v13/deployments/$id"
  if ($teamId) { $delUrl = "$delUrl?teamId=$teamId" }
  elseif ($teamSlug) { $delUrl = "$delUrl?slug=$teamSlug" }

  try {
    $null = Invoke-RestMethod -Method Delete -Uri $delUrl -Headers $headers
    Write-Host "OK: deletado $id ($($dep.url))" -ForegroundColor Green
    $deleted++
  } catch {
    Write-Warning ("Falha ao deletar {0}: {1}" -f $id, $_.Exception.Message)
  }
}

Write-Host "Concluído. Total deletado: $deleted" -ForegroundColor Green
