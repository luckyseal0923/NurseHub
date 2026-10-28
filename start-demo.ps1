$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
$taskNodeFolder = 'C:\Users\ASUS\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin'
if (Test-Path -LiteralPath (Join-Path $taskNodeFolder 'node.exe')) { $env:Path = $taskNodeFolder + ';' + $env:Path }
$taskNodeVersion = [version]((node --version).TrimStart('v'))
if ($taskNodeVersion -lt [version]'22.13.0') { throw '請使用 Node.js 22.13 以上，並先依 README 安裝與建立本機資料表。' }
npm run dev -- --port 5173 --hostname 127.0.0.1
