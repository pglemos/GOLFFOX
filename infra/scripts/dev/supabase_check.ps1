Param(
  [string]$SupabaseUrl,
  [string]$ServiceRoleKey,
  [string]$LegacyJwtSecret,
  [string]$ProjectRef
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

if (-not $SupabaseUrl -or (-not $ServiceRoleKey -and (-not $LegacyJwtSecret -or -not $ProjectRef))) {
  $cfg = Get-ConfigFromRepo
  if (-not $SupabaseUrl) { $SupabaseUrl = $env:SUPABASE_URL }
  if (-not $ServiceRoleKey) { $ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY }
  if (-not $LegacyJwtSecret) { $LegacyJwtSecret = $env:SUPABASE_LEGACY_JWT_SECRET }
  if (-not $ProjectRef) { $ProjectRef = ($SupabaseUrl -replace '^https?://([^.]+)\.supabase\.(co|in).*','$1') }
  if (-not $SupabaseUrl) { $SupabaseUrl = $cfg.url }
  if (-not $ServiceRoleKey) { $ServiceRoleKey = $cfg.key }
}

if (-not $SupabaseUrl) {
  Write-Error 'Missing Supabase URL.'
  exit 1
}

function ConvertTo-Base64Url([byte[]]$bytes) {
  return [Convert]::ToBase64String($bytes).TrimEnd('=') -replace '\+','-' -replace '/','_'
}

function New-HS256Jwt([string]$secret, [hashtable]$payload) {
  $header = @{ alg='HS256'; typ='JWT' }
  $enc = New-Object System.Text.UTF8Encoding $false
  $h = ConvertTo-Base64Url($enc.GetBytes(($header | ConvertTo-Json -Compress)))
  $p = ConvertTo-Base64Url($enc.GetBytes(($payload | ConvertTo-Json -Compress)))
  $msg = "$h.$p"
  # Try to decode legacy secret if it looks base64; fallback to raw
  try {
    $key = [Convert]::FromBase64String($secret)
  } catch {
    $key = $enc.GetBytes($secret)
  }
  $hmac = New-Object System.Security.Cryptography.HMACSHA256
  $hmac.Key = $key
  $sig = ConvertTo-Base64Url($hmac.ComputeHash($enc.GetBytes($msg)))
  return "$msg.$sig"
}

# Determine bearer token: prefer provided ServiceRoleKey if it looks like a JWT, otherwise mint using legacy secret
$EffectiveBearer = $null
if ($ServiceRoleKey -and $ServiceRoleKey.StartsWith('eyJ')) { $EffectiveBearer = $ServiceRoleKey }
if (-not $EffectiveBearer) {
  if (-not $LegacyJwtSecret -or -not $ProjectRef) {
    Write-Error 'Missing ServiceRoleKey or (LegacyJwtSecret + ProjectRef). Provide parameters or set env vars.'
    exit 1
  }
  $now = [int][double]::Parse((Get-Date -Date (Get-Date).ToUniversalTime() -UFormat %s))
  $exp = $now + (60*60*24*7) # 7 days
  $payload = @{ iss='supabase'; role='service_role'; ref=$ProjectRef; iat=$now; exp=$exp }
  $EffectiveBearer = New-HS256Jwt -secret $LegacyJwtSecret -payload $payload
}

$rest = "$SupabaseUrl/rest/v1"
$headers = @{ 'apikey'=$EffectiveBearer; 'Authorization'="Bearer $EffectiveBearer"; 'Accept'='application/json' }

function Probe-Table {
  param([string]$table)
  $url = "$rest/$table?select=*&limit=1"
  try {
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -UseBasicParsing -ErrorAction Stop
    $data = $resp.Content | ConvertFrom-Json
    if ($data -is [System.Array] -and $data.Length -gt 0) {
      $props = ($data[0] | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name)
      return @{ exists=$true; has_rows=$true; columns=$props }
    }
    return @{ exists=$true; has_rows=$false; columns=@() }
  } catch {
    return @{ exists=$false; has_rows=$false; columns=@(); error=$_.Exception.Message }
  }
}

$tables = @('companies','carriers','users','vehicles','routes','route_stops','trips','trip_passengers','driver_positions','trip_events','trip_summary','checklists','passenger_reports','chat_messages')

Write-Host "Supabase project: $SupabaseUrl"
Write-Host "Tables (exists / has_rows / sample_columns):"
foreach ($t in $tables) {
  $r = Probe-Table $t
  $ex = if ($r.exists) { 'yes' } else { 'no ' }
  $rw = if ($r.has_rows) { 'yes' } else { 'no ' }
  $cols = if ($r.columns) { ($r.columns | Select-Object -First 6) -join ', ' } else { '' }
  Write-Host ("  {0,-20} {1}   {2}   {3}" -f $t, $ex, $rw, $cols)
  if (-not $r.exists -and $r.error) { Write-Host "    error: $($r.error)" }
}

Write-Host "`nAuth users (first 10):"
try {
  $authHeaders = @{ 'apikey'=$EffectiveBearer; 'Authorization'="Bearer $EffectiveBearer" }
  $authUrl = "$SupabaseUrl/auth/v1/admin/users?per_page=200"
  $resp = Invoke-WebRequest -Uri $authUrl -Headers $authHeaders -Method GET -UseBasicParsing -ErrorAction Stop
  $users = $resp.Content | ConvertFrom-Json
  foreach ($u in $users | Select-Object -First 10) {
    $email = if ($u.email) { $u.email } else { '(no email)' }
    $confirmed = [bool]$u.confirmed_at
    Write-Host ("  - {0} (confirmed: {1})" -f $email, $confirmed)
  }
  Write-Host ("Total returned: " + (($users | Measure-Object).Count))
} catch {
  Write-Host "  Failed to list auth users: $($_.Exception.Message)"
}
