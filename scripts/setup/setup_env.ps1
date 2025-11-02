# Environment Setup Script
# This script sets up the complete development environment for GolfFox

param(
    [switch]$SkipFlutter = $false,
    [switch]$SkipNode = $false,
    [switch]$SkipVSCode = $false,
    [switch]$Force = $false
)

# Set error action preference
$ErrorActionPreference = "Stop"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

function Write-ColorOutput {
    param([string]$Message, [string]$Color = $Reset)
    Write-Host "$Color$Message$Reset"
}

function Write-Step {
    param([string]$Message)
    Write-ColorOutput "🔄 $Message" $Blue
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✅ $Message" $Green
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "❌ $Message" $Red
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠️ $Message" $Yellow
}

function Test-Command {
    param([string]$Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Start setup process
Write-ColorOutput "🚀 Setting up GolfFox Development Environment" $Blue
Write-Host ""

try {
    # Check if we're in the correct directory
    if (-not (Test-Path "pubspec.yaml")) {
        throw "pubspec.yaml not found. Please run this script from the project root directory."
    }

    # Step 1: Check and setup Flutter
    if (-not $SkipFlutter) {
        Write-Step "Checking Flutter installation..."
        
        if (Test-Command "flutter") {
            $flutterVersion = flutter --version | Select-Object -First 1
            Write-Success "Flutter found: $flutterVersion"
            
            # Run Flutter doctor
            Write-Step "Running Flutter doctor..."
            flutter doctor
            
            # Install Flutter dependencies
            Write-Step "Installing Flutter dependencies..."
            flutter pub get
            if ($LASTEXITCODE -ne 0) { throw "Flutter pub get failed" }
            Write-Success "Flutter dependencies installed"
            
        } else {
            Write-Warning "Flutter not found. Please install Flutter from https://flutter.dev/docs/get-started/install"
            Write-Host "After installing Flutter, add it to your PATH and run this script again."
        }
    }

    # Step 2: Check and setup Node.js
    if (-not $SkipNode) {
        Write-Step "Checking Node.js installation..."
        
        if (Test-Command "node") {
            $nodeVersion = node --version
            $npmVersion = npm --version
            Write-Success "Node.js found: $nodeVersion"
            Write-Success "npm found: $npmVersion"
            
            # Check if we have Next.js app
            if (Test-Path "web-app") {
                Write-Step "Installing Next.js dependencies..."
                Set-Location "web-app"
                
                npm install
                if ($LASTEXITCODE -ne 0) { throw "npm install failed" }
                Write-Success "Next.js dependencies installed"
                
                Set-Location ".."
            }
            
        } else {
            Write-Warning "Node.js not found. Please install Node.js from https://nodejs.org/"
            Write-Host "Recommended version: Node.js 18 LTS or later"
        }
    }

    # Step 3: Setup environment files
    Write-Step "Setting up environment files..."
    
    # Copy .env.example to .env if it doesn't exist
    if (Test-Path ".env.example") {
        if (-not (Test-Path ".env") -or $Force) {
            Copy-Item ".env.example" ".env"
            Write-Success "Created .env file from .env.example"
            Write-Warning "Please edit .env file with your actual configuration values"
        } else {
            Write-Success ".env file already exists"
        }
    }

    # Setup Next.js environment file
    if (Test-Path "web-app") {
        if (Test-Path "web-app/.env.example") {
            if (-not (Test-Path "web-app/.env.local") -or $Force) {
                Copy-Item "web-app/.env.example" "web-app/.env.local"
                Write-Success "Created web-app/.env.local file"
                Write-Warning "Please edit web-app/.env.local file with your actual configuration values"
            } else {
                Write-Success "web-app/.env.local file already exists"
            }
        }
    }

    # Step 4: VS Code setup
    if (-not $SkipVSCode) {
        Write-Step "Checking VS Code setup..."
        
        if (Test-Command "code") {
            Write-Success "VS Code found"
            
            # Check for recommended extensions
            $extensions = @(
                "Dart-Code.dart-code",
                "Dart-Code.flutter",
                "bradlc.vscode-tailwindcss",
                "esbenp.prettier-vscode",
                "ms-vscode.vscode-typescript-next"
            )
            
            Write-Step "Checking VS Code extensions..."
            foreach ($ext in $extensions) {
                $installed = code --list-extensions | Select-String $ext
                if ($installed) {
                    Write-Success "Extension $ext is installed"
                } else {
                    Write-Warning "Extension $ext is not installed"
                    Write-Host "  Install with: code --install-extension $ext"
                }
            }
            
        } else {
            Write-Warning "VS Code not found. Please install VS Code from https://code.visualstudio.com/"
        }
    }

    # Step 5: Create necessary directories
    Write-Step "Creating project directories..."
    
    $directories = @(
        "build/outputs",
        "logs",
        "temp",
        "coverage"
    )
    
    foreach ($dir in $directories) {
        if (-not (Test-Path $dir)) {
            New-Item -ItemType Directory -Path $dir -Force | Out-Null
            Write-Success "Created directory: $dir"
        }
    }

    # Step 6: Git setup
    Write-Step "Checking Git configuration..."
    
    if (Test-Command "git") {
        Write-Success "Git found"
        
        # Check if git hooks directory exists
        if (-not (Test-Path ".git/hooks")) {
            Write-Warning "Git hooks directory not found. Make sure this is a Git repository."
        } else {
            Write-Success "Git repository detected"
        }
        
        # Check for gitignore
        if (Test-Path ".gitignore") {
            Write-Success ".gitignore file exists"
        } else {
            Write-Warning ".gitignore file not found"
        }
        
    } else {
        Write-Warning "Git not found. Please install Git from https://git-scm.com/"
    }

    # Step 7: Generate setup report
    Write-Step "Generating setup report..."
    
    $setupReport = @{
        timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
        flutter_available = Test-Command "flutter"
        node_available = Test-Command "node"
        npm_available = Test-Command "npm"
        git_available = Test-Command "git"
        vscode_available = Test-Command "code"
        env_file_exists = Test-Path ".env"
        nextjs_env_exists = Test-Path "web-app/.env.local"
        flutter_deps_installed = Test-Path "pubspec.lock"
        nextjs_deps_installed = Test-Path "web-app/node_modules"
    }
    
    $setupReport | ConvertTo-Json -Depth 2 | Out-File "setup-report.json" -Encoding UTF8
    Write-Success "Setup report generated: setup-report.json"

    # Final success message
    Write-Host ""
    Write-ColorOutput "🎉 Environment setup completed!" $Green
    Write-Host ""
    Write-ColorOutput "📋 Next steps:" $Yellow
    Write-Host "  1. Edit .env files with your actual configuration"
    Write-Host "  2. Run 'flutter doctor' to verify Flutter setup"
    Write-Host "  3. Run 'flutter run -d web-server --web-port 8000' to start Flutter web"
    Write-Host "  4. Run 'cd web-app && npm run dev' to start Next.js"
    Write-Host "  5. Open the project in VS Code: 'code .'"
    Write-Host ""

} catch {
    Write-Error "Setup failed: $($_.Exception.Message)"
    Write-Host ""
    Write-ColorOutput "🔍 Troubleshooting tips:" $Yellow
    Write-Host "  • Make sure you have admin privileges if needed"
    Write-Host "  • Check your internet connection for downloads"
    Write-Host "  • Verify you're in the correct project directory"
    Write-Host "  • Check the setup logs above for specific errors"
    Write-Host ""
    exit 1
}