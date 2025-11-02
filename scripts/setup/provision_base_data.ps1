Param(
  [string]$SupabaseUrl,
  [string]$ServiceRoleKey,
  [string]$AnonKey
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
  if (-not $AnonKey) { $AnonKey = $env:SUPABASE_ANON_KEY }
  if (-not $SupabaseUrl) { $SupabaseUrl = $cfg.url }
  if (-not $ServiceRoleKey) { $ServiceRoleKey = $cfg.key }
}

if (-not $SupabaseUrl -or -not $ServiceRoleKey) {
  Write-Error 'Missing Supabase URL or Service Role Key. Pass parameters or set env vars.'
  exit 1
}

$rest = "$SupabaseUrl/rest/v1"
$headers = @{ 'apikey'=$ServiceRoleKey; 'Authorization'="Bearer $ServiceRoleKey"; 'Content-Type'='application/json'; 'Accept'='application/json' }

function Get-First($url) {
  try {
    $resp = Invoke-WebRequest -Uri $url -Headers $headers -Method GET -UseBasicParsing -ErrorAction Stop
    $arr = $resp.Content | ConvertFrom-Json
    if ($arr -is [System.Array] -and $arr.Length -gt 0) { return $arr[0] }
    return $null
  } catch {
    return $null
  }
}

function Upsert($table, $data, $keyField) {
  # Try insert; if conflict, update (require on_conflict in query)
  $url = "$rest/$table?on_conflict=$keyField"
  try {
    $body = ($data | ConvertTo-Json -Depth 6)
    $localHeaders = @{}
    $headers.GetEnumerator() | ForEach-Object { $localHeaders[$_.Key] = $_.Value }
    $localHeaders['Prefer'] = 'resolution=merge-duplicates,return=representation'
    $resp = Invoke-WebRequest -Uri $url -Headers $localHeaders -Method POST -UseBasicParsing -Body $body -ErrorAction Stop
    $arr = $resp.Content | ConvertFrom-Json
    return $arr[0]
  } catch {
    throw $_
  }
}

Write-Host "Provisioning base data..."

# Ensure company
$company = Get-First "$rest/companies?select=*&name=eq.Demo%20Company"
if (-not $company) {
  $company = Upsert 'companies' @{ name='Demo Company' } 'id'
}
$companyId = $company.id
Write-Host "Company: $($companyId)"

# Ensure carrier
$carrier = Get-First "$rest/carriers?select=*&name=eq.Demo%20Carrier"
if (-not $carrier) {
  $carrier = Upsert 'carriers' @{ name='Demo Carrier' } 'id'
}
$carrierId = $carrier.id
Write-Host "Carrier: $($carrierId)"

# Fetch auth users via admin API
$authHeaders = @{ 'apikey'=$ServiceRoleKey; 'Authorization'="Bearer $ServiceRoleKey" }
$adminUsersUrl = "$SupabaseUrl/auth/v1/admin/users?per_page=200"
$adminUsers = @()
try {
  $resp = Invoke-WebRequest -Uri $adminUsersUrl -Headers $authHeaders -Method GET -UseBasicParsing -ErrorAction Stop
  $adminUsers = $resp.Content | ConvertFrom-Json
} catch {
  Write-Error "Failed to list auth users: $($_.Exception.Message)"; exit 1
}

function FindUserId($email) {
  foreach ($u in $adminUsers) { if ($u.email -and ($u.email.ToLower() -eq $email.ToLower())) { return $u.id } }
  # Fallback: try password grant to fetch user.id if we know the default password
  if ($AnonKey) {
    try {
      $tokenUrl = "$SupabaseUrl/auth/v1/token?grant_type=password"
      $headers = @{ 'apikey'=$AnonKey; 'Content-Type'='application/json' }
      $body = @{ email=$email; password='senha123' } | ConvertTo-Json -Depth 5
      $resp = Invoke-WebRequest -Uri $tokenUrl -Headers $headers -Method POST -UseBasicParsing -Body $body -ErrorAction Stop
      $json = $resp.Content | ConvertFrom-Json
      if ($json.user -and $json.user.id) { return $json.user.id }
    } catch {}
  }
  return $null
}

$map = @(
  @{ email='golffox@admin.com';      role='admin';      company=$null;      carrier=$null },
  @{ email='operador@empresa.com';   role='operator';   company=$companyId;  carrier=$null },
  @{ email='transportadora@trans.com'; role='carrier'; company=$null;      carrier=$carrierId },
  @{ email='motorista@trans.com';    role='driver';     company=$companyId;  carrier=$carrierId },
  @{ email='passageiro@empresa.com'; role='passenger';  company=$companyId;  carrier=$null }
)

foreach ($m in $map) {
  $uid = FindUserId $m.email
  if (-not $uid) { Write-Host "WARN: auth user not found: $($m.email)"; continue }
  $payload = @{ id=$uid; email=$m.email.ToLower(); role=$m.role; company_id=$m.company; carrier_id=$m.carrier }
  # upsert by id
  $u = Upsert 'users' $payload 'id'
  Write-Host "Linked profile: $($m.email) -> role=$($m.role)"
}

# Ensure vehicle
$vehicle = Get-First "$rest/vehicles?select=*&plate=eq.GFX-0001"
if (-not $vehicle) {
  $vehicle = Upsert 'vehicles' @{ plate='GFX-0001'; model='Marcopolo Torino'; carrier_id=$carrierId } 'id'
}
$vehicleId = $vehicle.id
Write-Host "Vehicle: $vehicleId"

# Ensure route
$route = Get-First "$rest/routes?select=*&name=eq.Rota%20ACME%201"
if (-not $route) {
  $route = Upsert 'routes' @{ name='Rota ACME 1'; company_id=$companyId; carrier_id=$carrierId } 'id'
}
$routeId = $route.id
Write-Host "Route: $routeId"

# Ensure route stops
function EnsureStop($seq, $name, $lat, $lng) {
  $st = Get-First "$rest/route_stops?select=*&route_id=eq.$routeId&seq=eq.$seq"
  if (-not $st) {
    $url = "$rest/route_stops"
    $body = (@{ route_id=$routeId; seq=$seq; name=$name; lat=$lat; lng=$lng; radius_m=50 } | ConvertTo-Json)
    $localHeaders = @{}
    $headers.GetEnumerator() | ForEach-Object { $localHeaders[$_.Key] = $_.Value }
    $localHeaders['Prefer'] = 'return=representation'
    $resp = Invoke-WebRequest -Uri $url -Headers $localHeaders -Method POST -UseBasicParsing -Body $body -ErrorAction Stop
  }
}
EnsureStop 1 'Ponto 1' -23.563099 -46.654389
EnsureStop 2 'Ponto 2' -23.567100 -46.651000
EnsureStop 3 'Empresa' -23.570200 -46.649500

# Ensure one scheduled trip for driver
$driverId = FindUserId 'motorista@trans.com'
if ($driverId) {
  $existingTrip = Get-First "$rest/trips?select=*&driver_id=eq.$driverId&status=eq.scheduled"
  if (-not $existingTrip) {
    $url = "$rest/trips"
    $body = (@{ route_id=$routeId; vehicle_id=$vehicleId; driver_id=$driverId; status='scheduled'; scheduled_at=(Get-Date).ToString('s') } | ConvertTo-Json)
    Invoke-WebRequest -Uri $url -Headers $headers -Method POST -UseBasicParsing -Body $body -ErrorAction Stop -Headers @{ 'Prefer'='return=representation' } | Out-Null
    Write-Host "Created scheduled trip for driver."
  } else { Write-Host "Trip already exists." }
} else {
  Write-Host "WARN: driver user not found; skipping trip creation."
}

Write-Host "Provisioning complete."
