# PowerShell script to restart the servers cleanly

Write-Host "Stopping any running servers..."
$processes = @("node", "npm")

foreach ($process in $processes) {
    $running = Get-Process -Name $process -ErrorAction SilentlyContinue
    if ($running) {
        Write-Host "Stopping $process processes..."
        Stop-Process -Name $process -Force
        Start-Sleep -Seconds 1
    }
}

# Clear ports
Write-Host "Ensuring ports are clear..."
$ports = @(3001, 3002, 5173)

foreach ($port in $ports) {
    $connections = netstat -ano | findstr ":$port"
    if ($connections) {
        $connections -match ":$port.*LISTENING\s+(\d+)" | Out-Null
        if ($matches -and $matches[1]) {
            $pid = $matches[1]
            Write-Host "Killing process $pid using port $port"
            taskkill /PID $pid /F
        }
    }
}

# Wait to ensure ports are released
Start-Sleep -Seconds 2

# Start the servers
Write-Host "Starting servers..."
Start-Process -FilePath "npm" -ArgumentList "run start:full" -WorkingDirectory "c:\Users\aarya\Downloads\sistema-votaciones"

Write-Host "Servers restarted! Please wait a few seconds for them to initialize."
