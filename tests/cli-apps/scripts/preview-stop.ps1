param([int]$ManagedPid, [string]$PreviewScript)
$managedProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $ManagedPid"
if (-not $managedProcess) { exit 0 }
if ($managedProcess.Name -ne 'node.exe' -or $managedProcess.CommandLine -notmatch [regex]::Escape($PreviewScript)) {
  throw 'The recorded PID belongs to a different process; refusing to stop it.'
}
$processInventory = Get-CimInstance Win32_Process
$managedTree = [System.Collections.Generic.List[uint32]]::new()
$managedTree.Add([uint32]$ManagedPid)
for ($index = 0; $index -lt $managedTree.Count; $index++) {
  foreach ($childProcess in $processInventory | Where-Object { $_.ParentProcessId -eq $managedTree[$index] }) {
    $managedTree.Add([uint32]$childProcess.ProcessId)
  }
}
for ($index = $managedTree.Count - 1; $index -ge 0; $index--) {
  Stop-Process -Id $managedTree[$index] -Force -ErrorAction SilentlyContinue
}
