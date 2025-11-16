Param(
  [string]$SupabaseUrl,
  [string]$ServiceRoleKey
)

$ErrorActionPreference = 'Stop'

function Get-ConfigFromRepo {
  $hint = Get-Content scripts/deploy_supabase.py -Raw -ErrorAction SilentlyContinue
  if ($hint) {
    $url = ([regex]::Match($hint,'SUPABASE_URL\s*=\s*"([^"]+)"')).Groups[1].Value
    $key = ([regex]::Match($hint,'SERVICE_KEY\s*=\s*"([^"]+)"')).Groups[1].Value
    if ($url -and $key) { return @{ url=$url; key=$key } }
  }
  return @{}
}

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  $cfg = Get-ConfigFromRepo
  if (-not $SupabaseUrl) { $SupabaseUrl = $env:SUPABASE_URL }
  if (-not $ServiceRoleKey) { $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY }
  if (-not $SupabaseUrl) { $SupabaseUrl = $cfg.url }
  if (-not $ServiceRoleKey) { $ServiceRoleKey = $cfg.key }
}

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  Write-Error 'Missing Supabase URL or Service Role Key. Pass parameters or set env vars.'
  exit 1
}

$headers = @{ 'apikey'=$ServiceRoleKey; 'Authorization'="Bearer $ServiceRoleKey"; 'Content-Type'='application/json' }
$listHeaders = @{ 'apikey'=$ServiceRoleKey; 'Authorization'="Bearer $ServiceRoleKey" }

$users = @(
  @{ email='golffox@admin.com'; password='senha123' },
  @{ email='operador@empresa.com'; password='senha123' },
  @{ email='transportadora@trans.com'; password='senha123' },
  @{ email='motorista@trans.com'; password='senha123' },
  @{ email='passageiro@empresa.com'; password='senha123' }
)

function Ensure-AuthUser {
  param([string]$email, [string]$password)
  # Check existence
  try {
    $resp = Invoke-WebRequest -Uri ("$SupabaseUrl/auth/v1/admin/users?per_page=200") -Headers $listHeaders -Method GET -UseBasicParsing -ErrorAction Stop
    $arr = $resp.Content | ConvertFrom-Json
    if ($arr | Where-Object { $_.email -eq $email }) { return 'exists' }
  } catch {}

  $body = @{ email=$email; password=$password; email_confirm=$true } | ConvertTo-Json -Depth 5
  try {
    Invoke-WebRequest -Uri ("$SupabaseUrl/auth/v1/admin/users") -Headers $headers -Method POST -UseBasicParsing -Body $body -ErrorAction Stop | Out-Null
    return 'created'
  } catch {
    return "ERR: $($_.Exception.Message)"
  }
}

Write-Host "Creating demo users (email confirmed):"
foreach ($u in $users) {
  $res = Ensure-AuthUser -email $u.email -password $u.password
  Write-Host ("  {0,-28} -> {1}" -f $u.email, $res)
}

Write-Host "\nListing first 10 users:"
try {
  $resp = Invoke-WebRequest -Uri ("$SupabaseUrl/auth/v1/admin/users?per_page=200") -Headers $listHeaders -Method GET -UseBasicParsing -ErrorAction Stop
  $arr = $resp.Content | ConvertFrom-Json
  foreach ($u in $arr | Select-Object -First 10) {
    $label = '(no email)'
    if ($u.PSObject.Properties.Name -contains 'email' -and $u.email) { $label = $u.email }
    Write-Host ("  - " + $label)
  }
  Write-Host ("Total returned: " + (($arr | Measure-Object).Count))
} catch {
  Write-Host "  Failed to list users: $($_.Exception.Message)"
}
