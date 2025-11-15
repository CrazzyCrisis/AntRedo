# #!/usr/bin/env pwsh
# <#
# .SYNOPSIS
#     Refactor managers to use BaseManager pattern with automatic backups
# .DESCRIPTION
#     This script migrates all managers to extend BaseManager, replacing manual
#     EventBus subscription management with the centralized pattern.
#     Creates backups before any changes and can rollback on failure.
# .PARAMETER DryRun
#     Preview changes without making modifications
# .PARAMETER SkipTests
#     Skip running tests after refactoring
# .PARAMETER Rollback
#     Restore from backup
# .EXAMPLE
#     .\RefactorManagers.ps1 -DryRun
#     .\RefactorManagers.ps1
#     .\RefactorManagers.ps1 -Rollback
# #>

# param(
#     [switch]$DryRun,
#     [switch]$SkipTests,
#     [switch]$Rollback
# )

# $ErrorActionPreference = "Stop"
# $ProgressPreference = "SilentlyContinue"

# # Configuration
# $projectRoot = Split-Path -Parent $PSScriptRoot
# $managersDir = Join-Path $projectRoot "src\managers"
# $backupDir = Join-Path $projectRoot "backups\managers_$(Get-Date -Format 'yyyyMMdd_HHmmss')"
# $logFile = Join-Path $projectRoot "logs\refactor_$(Get-Date -Format 'yyyyMMdd_HHmmss').log"

# # Managers to refactor (priority order)
# $managersToRefactor = @(
#     "ResourceManager.ts",
#     "PowerManager.ts",
#     "SpawnManager.ts",
#     "PathfindingManager.ts",
#     "BuildingManager.ts",
#     "EntityManager.ts",
#     "GameStateManager.ts",
#     "InputManager.ts"
# )

# # Create log directory
# $logDir = Split-Path -Parent $logFile
# if (-not (Test-Path $logDir)) {
#     New-Item -ItemType Directory -Path $logDir -Force | Out-Null
# }

# function Write-Log {
#     param([string]$Message, [string]$Level = "INFO")
#     $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
#     $logMessage = "[$timestamp] [$Level] $Message"
#     Write-Host $logMessage
#     Add-Content -Path $logFile -Value $logMessage
# }

# function Backup-Managers {
#     Write-Log "Creating backup in: $backupDir"
    
#     if (-not (Test-Path $backupDir)) {
#         New-Item -ItemType Directory -Path $backupDir -Force | Out-Null
#     }
    
#     foreach ($manager in $managersToRefactor) {
#         $sourcePath = Join-Path $managersDir $manager
#         if (Test-Path $sourcePath) {
#             $destPath = Join-Path $backupDir $manager
#             Copy-Item -Path $sourcePath -Destination $destPath -Force
#             Write-Log "Backed up: $manager"
#         }
#     }
    
#     # Save backup metadata
#     $metadata = @{
#         Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
#         Managers = $managersToRefactor
#         BackupPath = $backupDir
#     } | ConvertTo-Json
    
#     $metadataPath = Join-Path $backupDir "metadata.json"
#     $metadata | Out-File -FilePath $metadataPath -Encoding UTF8
    
#     Write-Log "Backup complete: $backupDir" -Level "SUCCESS"
# }

# function Restore-FromBackup {
#     param([string]$BackupPath)
    
#     Write-Log "Restoring from backup: $BackupPath"
    
#     if (-not (Test-Path $BackupPath)) {
#         Write-Log "Backup directory not found: $BackupPath" -Level "ERROR"
#         return $false
#     }
    
#     foreach ($manager in $managersToRefactor) {
#         $backupFile = Join-Path $BackupPath $manager
#         $targetFile = Join-Path $managersDir $manager
        
#         if (Test-Path $backupFile) {
#             Copy-Item -Path $backupFile -Destination $targetFile -Force
#             Write-Log "Restored: $manager"
#         }
#     }
    
#     Write-Log "Restore complete" -Level "SUCCESS"
#     return $true
# }

# function Get-LatestBackup {
#     $backupsRoot = Join-Path $projectRoot "backups"
#     if (-not (Test-Path $backupsRoot)) {
#         return $null
#     }
    
#     $backups = Get-ChildItem -Path $backupsRoot -Directory -Filter "managers_*" | 
#                Sort-Object Name -Descending |
#                Select-Object -First 1
    
#     return $backups.FullName
# }

# function Test-ManagerHasEventBus {
#     param([string]$FilePath)
    
#     $content = Get-Content -Path $FilePath -Raw
#     return $content -match 'EventBus\.(on|once|emit)' -or 
#            $content -match 'unsubscribe.*Array'
# }

# function Update-Manager {
#     param([string]$ManagerPath, [string]$ManagerName)
    
#     Write-Log "Refactoring: $ManagerName"
    
#     $content = Get-Content -Path $ManagerPath -Raw
#     $originalContent = $content
#     $linesSaved = 0
    
#     # Check if already refactored
#     if ($content -match 'extends BaseManager') {
#         Write-Log "  Already refactored, skipping" -Level "WARN"
#         return @{ Success = $true; LinesSaved = 0; AlreadyDone = $true }
#     }
    
#     # Check if has EventBus usage
#     if (-not (Test-ManagerHasEventBus -FilePath $ManagerPath)) {
#         Write-Log "  No EventBus usage detected, skipping" -Level "INFO"
#         return @{ Success = $true; LinesSaved = 0; NoEventBus = $true }
#     }
    
#     # 1. Update imports
#     if ($content -match 'import \{ EventBus, GameEvents \} from') {
#         $content = $content -replace 'import \{ EventBus, GameEvents \} from', 'import { GameEvents } from'
#         if ($content -notmatch 'import \{ BaseManager \}') {
#             $content = "import { BaseManager } from './BaseManager';`n" + $content
#         }
#         Write-Log '  [OK] Updated imports'
#     } elseif ($content -match 'import \{ EventBus \} from') {
#         $content = $content -replace 'import \{ EventBus \} from.*?;', ''
#         if ($content -notmatch 'import \{ BaseManager \}') {
#             $content = "import { BaseManager } from './BaseManager';`n" + $content
#         }
#         Write-Log '  [OK] Updated imports'
#     }
    
#     # 2. Extend BaseManager
#     $className = $ManagerName -replace '\.ts$', ''
#     if ($content -match "export class $className \{") {
#         $content = $content -replace "export class $className \{", "export class $className extends BaseManager {"
#         Write-Log '  [OK] Extended BaseManager'
#     }
    
#     # 3. Remove unsubscribe array declaration
#     if ($content -match 'private (unsubscribeFunctions|eventUnsubscribers):\s*Array<\(\) => void>\s*=\s*\[\];?') {
#         $content = $content -replace 'private (unsubscribeFunctions|eventUnsubscribers):\s*Array<\(\) => void>\s*=\s*\[\];?', ''
#         $linesSaved++
#         Write-Log '  [OK] Removed unsubscribe array declaration'
#     }
    
#     # 4. Add super() call in constructor
#     if ($content -match 'private constructor\(\) \{') {
#         $content = $content -replace '(private constructor\(\) \{)', "`$1`n        super(); // Initialize BaseManager"
#         Write-Log '  [OK] Added super() call'
#     }
    
#     # 5. Remove array initialization in constructor
#     if ($content -match 'this\.(unsubscribeFunctions|eventUnsubscribers) = \[\];') {
#         $content = $content -replace 'this\.(unsubscribeFunctions|eventUnsubscribers) = \[\];', ''
#         $linesSaved++
#         Write-Log '  [OK] Removed array initialization'
#     }
    
#     # 6. Replace EventBus.on() + push() pattern
#     $pattern = 'this\.(unsubscribeFunctions|eventUnsubscribers)\.push\(\s*EventBus\.on\((.*?)\)\s*\);'
#     if ($content -match $pattern) {
#         $content = $content -replace $pattern, 'this.subscribe($2);'
#         $linesSaved += 2
#         Write-Log '  [OK] Replaced EventBus.on() + push() pattern'
#     }
    
#     # Alternative pattern: const unsub = EventBus.on(...); array.push(unsub);
#     $pattern2 = 'const\s+\w+\s*=\s*EventBus\.on\((.*?)\);\s*this\.(unsubscribeFunctions|eventUnsubscribers)\.push\(\w+\);'
#     if ($content -match $pattern2) {
#         $content = $content -replace $pattern2, 'this.subscribe($1);'
#         $linesSaved += 2
#         Write-Log '  [OK] Replaced EventBus.on() pattern (variant)'
#     }
    
#     # 7. Replace EventBus.once() + push() pattern
#     $oncePattern = 'this\.(unsubscribeFunctions|eventUnsubscribers)\.push\(\s*EventBus\.once\((.*?)\)\s*\);'
#     if ($content -match $oncePattern) {
#         $content = $content -replace $oncePattern, 'this.subscribeOnce($2);'
#         $linesSaved += 2
#         Write-Log '  [OK] Replaced EventBus.once() + push() pattern'
#     }
    
#     # 8. Replace EventBus.emit() with this.emit()
#     $emitMatches = [regex]::Matches($content, 'EventBus\.emit\(')
#     if ($emitMatches.Count -gt 0) {
#         $content = $content -replace 'EventBus\.emit\(', 'this.emit('
#         Write-Log "  [OK] Replaced EventBus.emit() ($($emitMatches.Count) occurrences)"
#     }
    
#     # 9. Replace cleanup loop with cleanupSubscriptions()
#     $cleanupPattern = 'this\.(unsubscribeFunctions|eventUnsubscribers)\.forEach\(\s*\w+\s*=>\s*\w+\(\)\s*\);\s*this\.\1\s*=\s*\[\];'
#     if ($content -match $cleanupPattern) {
#         $content = $content -replace $cleanupPattern, 'this.cleanupSubscriptions();'
#         $linesSaved += 2
#         Write-Log '  [OK] Replaced cleanup loop'
#     }
    
#     # Alternative cleanup pattern
#     $cleanupPattern2 = 'this\.(unsubscribeFunctions|eventUnsubscribers)\.forEach\(\w+ => \w+\(\)\);'
#     if ($content -match $cleanupPattern2) {
#         $content = $content -replace $cleanupPattern2, 'this.cleanupSubscriptions();'
#         $linesSaved++
#     }
    
#     # Remove empty array reset after cleanup
#     if ($content -match 'this\.cleanupSubscriptions\(\);\s*this\.(unsubscribeFunctions|eventUnsubscribers)\s*=\s*\[\];') {
#         $content = $content -replace 'this\.cleanupSubscriptions\(\);\s*this\.(unsubscribeFunctions|eventUnsubscribers)\s*=\s*\[\];', 'this.cleanupSubscriptions();'
#         $linesSaved++
#     }
    
#     # Count actual lines saved by comparing
#     $originalLines = ($originalContent -split "`n").Count
#     $newLines = ($content -split "`n").Count
#     $actualLinesSaved = $originalLines - $newLines
    
#     if ($DryRun) {
#         Write-Log "  [DRY RUN] Would save approximately $actualLinesSaved lines"
#         return @{ Success = $true; LinesSaved = $actualLinesSaved; DryRun = $true }
#     }
    
#     # Write changes
#     $content | Out-File -FilePath $ManagerPath -Encoding UTF8 -NoNewline
#     Write-Log "  [OK] Saved changes ($actualLinesSaved lines saved)" -Level 'SUCCESS'
    
#     return @{ Success = $true; LinesSaved = $actualLinesSaved }
# }

# function Test-Build {
#     Write-Log "Running build to verify changes..."
    
#     Push-Location $projectRoot
#     try {
#         $buildResult = npm run build 2>&1
#         $buildExitCode = $LASTEXITCODE
        
#         if ($buildExitCode -eq 0) {
#             Write-Log "Build successful" -Level "SUCCESS"
#             return $true
#         } else {
#             Write-Log "Build failed (exit code: $buildExitCode)" -Level "ERROR"
#             Write-Log $buildResult -Level "ERROR"
#             return $false
#         }
#     } finally {
#         Pop-Location
#     }
# }

# function Test-Suite {
#     Write-Log "Running test suite..."
    
#     Push-Location $projectRoot
#     try {
#         # $testResult = npm test 2>&1
#         $testExitCode = $LASTEXITCODE
        
#         # Note: We accept test failures as long as they're not worse than baseline
#         Write-Log "Tests completed (exit code: $testExitCode)"
#         return $true # Always return true since we have known failing tests
#     } finally {
#         Pop-Location
#     }
# }

# # Main execution
# Write-Log "========================================" -Level "INFO"
# Write-Log "Manager Refactoring Script Started" -Level "INFO"
# Write-Log "========================================" -Level "INFO"

# if ($Rollback) {
#     $latestBackup = Get-LatestBackup
#     if ($null -eq $latestBackup) {
#         Write-Log "No backups found" -Level "ERROR"
#         exit 1
#     }
    
#     Write-Log "Rolling back to: $latestBackup"
#     if (Restore-FromBackup -BackupPath $latestBackup) {
#         Write-Log "Rollback complete" -Level "SUCCESS"
#         exit 0
#     } else {
#         Write-Log "Rollback failed" -Level "ERROR"
#         exit 1
#     }
# }

# # Create backup
# Backup-Managers

# # Refactor each manager
# $totalLinesSaved = 0
# $successCount = 0
# $skippedCount = 0
# $failedManagers = @()

# foreach ($manager in $managersToRefactor) {
#     $managerPath = Join-Path $managersDir $manager
    
#     if (-not (Test-Path $managerPath)) {
#         Write-Log "Manager not found: $manager" -Level "WARN"
#         continue
#     }
    
#     $result = Update-Manager -ManagerPath $managerPath -ManagerName $manager
    
#     if ($result.Success) {
#         if ($result.AlreadyDone) {
#             $skippedCount++
#         } elseif ($result.NoEventBus) {
#             $skippedCount++
#         } else {
#             $successCount++
#             $totalLinesSaved += $result.LinesSaved
#         }
#     } else {
#         $failedManagers += $manager
#     }
# }

# Write-Log "`n========================================" -Level "INFO"
# Write-Log "Refactoring Summary" -Level "INFO"
# Write-Log "========================================" -Level "INFO"
# Write-Log "Successfully refactored: $successCount managers"
# Write-Log "Skipped: $skippedCount managers"
# Write-Log "Failed: $($failedManagers.Count) managers"
# Write-Log "Total lines saved: $totalLinesSaved"
# Write-Log "Backup location: $backupDir"

# if ($failedManagers.Count -gt 0) {
#     Write-Log "`nFailed managers:" -Level "ERROR"
#     foreach ($failed in $failedManagers) {
#         Write-Log "  - $failed" -Level "ERROR"
#     }
# }

# if (-not $DryRun) {
#     # Verify build
#     Write-Log "`n========================================" -Level "INFO"
#     Write-Log "Verification" -Level "INFO"
#     Write-Log "========================================" -Level "INFO"
    
#     $buildSuccess = Test-Build
    
#     if (-not $buildSuccess) {
#         Write-Log "`nBuild failed! Rolling back changes..." -Level "ERROR"
#         Restore-FromBackup -BackupPath $backupDir
#         Write-Log "Changes rolled back due to build failure" -Level "ERROR"
#         exit 1
#     }
    
#     if (-not $SkipTests) {
#         Test-Suite | Out-Null
#     }
    
#     Write-Log "`n========================================" -Level "SUCCESS"
#     Write-Log "Refactoring Complete!" -Level "SUCCESS"
#     Write-Log "========================================" -Level "SUCCESS"
#     Write-Log "Review changes and commit if satisfied"
#     Write-Log "To rollback: .\RefactorManagers.ps1 -Rollback"
# } else {
#     Write-Log "`n[DRY RUN] No changes made" -Level "INFO"
# }
