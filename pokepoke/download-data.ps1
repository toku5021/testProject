$ErrorActionPreference = "Stop"
$base = Split-Path -Parent $MyInvocation.MyCommand.Path
Invoke-WebRequest "https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/v4.json" -OutFile (Join-Path $base "cards.json")
Invoke-WebRequest "https://raw.githubusercontent.com/chase-manning/pokemon-tcg-pocket-cards/refs/heads/main/expansions.json" -OutFile (Join-Path $base "expansions.json")
Write-Host "cards.json / expansions.json を取得しました。"
