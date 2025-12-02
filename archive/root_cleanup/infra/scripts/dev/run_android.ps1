param(
  [string]$SupabaseUrl = "https://vmoxzesvjcfmrebagcwo.supabase.co",
  [string]$SupabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtb3h6ZXN2amNmbXJlYmFnY3dvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1MTQyMTMsImV4cCI6MjA3NzA5MDIxM30.QKRKu1bIPhsyDPFuBKEIjseC5wNC35RKbOxQ7FZmEvU"
)

Write-Host "Running Flutter (Android) with Supabase defines..." -ForegroundColor Cyan

if (-not (Get-Command flutter -ErrorAction SilentlyContinue)) {
  Write-Error "Flutter is not installed or not on PATH. Install Flutter and restart your terminal."
  exit 1
}

push-location $PSScriptRoot\..

flutter run `
  --dart-define="SUPABASE_URL=$SupabaseUrl" `
  --dart-define="SUPABASE_ANON_KEY=$SupabaseAnonKey"

pop-location

