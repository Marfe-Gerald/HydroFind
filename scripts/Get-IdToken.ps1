param([Parameter(Mandatory)][string]$Email, [Parameter(Mandatory)][string]$Password)
if (-not $env:FIREBASE_WEB_API_KEY) { throw 'Set $env:FIREBASE_WEB_API_KEY in this PowerShell session first.' }
$body = @{ email = $Email; password = $Password; returnSecureToken = $true } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -ContentType 'application/json' -Body $body `
  -Uri "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=$($env:FIREBASE_WEB_API_KEY)"
$r.idToken
