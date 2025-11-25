$tests = Get-ChildItem -Path "." -Filter "TC*.py" | Sort-Object Name

$passed = 0
$failed = 0
$errors = @()

Write-Host "`n🧪 Executando Todos os Testes do TestSprite`n" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

foreach ($test in $tests) {
    Write-Host "`n📝 Teste: $($test.Name)" -ForegroundColor Yellow
    Write-Host "-" * 60 -ForegroundColor Gray
    
    try {
        $output = python $test.FullName 2>&1
        $exitCode = $LASTEXITCODE
        
        if ($exitCode -eq 0) {
            Write-Host "✅ PASSOU" -ForegroundColor Green
            $passed++
            if ($output) {
                Write-Host $output -ForegroundColor Gray
            }
        } else {
            Write-Host "❌ FALHOU (Exit code: $exitCode)" -ForegroundColor Red
            $failed++
            $errors += @{
                Test = $test.Name
                Output = $output
            }
            if ($output) {
                Write-Host $output -ForegroundColor Red
            }
        }
    } catch {
        Write-Host "❌ ERRO: $_" -ForegroundColor Red
        $failed++
        $errors += @{
            Test = $test.Name
            Output = $_.Exception.Message
        }
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
Write-Host "`n📊 RESUMO DOS TESTES`n" -ForegroundColor Cyan
Write-Host "Total de testes: $($tests.Count)" -ForegroundColor White
Write-Host "✅ Passou: $passed" -ForegroundColor Green
Write-Host "❌ Falhou: $failed" -ForegroundColor Red
Write-Host "`nTaxa de sucesso: $([math]::Round(($passed / $tests.Count) * 100, 2))%" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Yellow" })

if ($errors.Count -gt 0) {
    Write-Host "`n⚠️  TESTES QUE FALHARAM:`n" -ForegroundColor Red
    foreach ($error in $errors) {
        Write-Host "  • $($error.Test)" -ForegroundColor Red
    }
}

Write-Host "`n" + ("=" * 60) -ForegroundColor Gray
