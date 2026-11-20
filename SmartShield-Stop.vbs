' Smart Shield - stop everything that belongs to Smart Shield:
'  - the server listening on port 8787 (and the console window that hosts it)
'  - the cloudflared link tool started by start.bat (and its console window)
'  - leftover start.bat console windows
Option Explicit
Dim sh, fso, wmi, dir, tmp, f, line, parts, pid, p, n, ids
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
Set wmi = GetObject("winmgmts:\\.\root\cimv2")
dir = LCase(fso.GetParentFolderName(WScript.ScriptFullName))
Set ids = CreateObject("Scripting.Dictionary")

' 1) process listening on 8787 (found with netstat, run hidden)
tmp = sh.ExpandEnvironmentStrings("%TEMP%") & "\smartshield-netstat.txt"
sh.Run "cmd /c netstat -ano -p TCP > """ & tmp & """", 0, True
If fso.FileExists(tmp) Then
  Set f = fso.OpenTextFile(tmp, 1)
  Do While Not f.AtEndOfStream
    line = Trim(f.ReadLine)
    If InStr(line, ":8787 ") > 0 And InStr(UCase(line), "LISTENING") > 0 Then
      parts = Split(Replace(line, "  ", " "), " ")
      pid = parts(UBound(parts))
      If IsNumeric(pid) Then AddWithParent CLng(pid)
    End If
  Loop
  f.Close
  fso.DeleteFile tmp, True
End If

' 2) node running this folder's server.js
For Each p In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE Name='node.exe'")
  If Not IsNull(p.CommandLine) Then
    If InStr(1, LCase(p.CommandLine), dir & "\server.js", 1) > 0 Then AddWithParent p.ProcessId
  End If
Next

' 3) cloudflared quick tunnels started for Smart Shield
For Each p In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE Name='cloudflared.exe'")
  If Not IsNull(p.CommandLine) Then
    If InStr(1, LCase(p.CommandLine), "tunnel --url http://localhost:", 1) > 0 Then AddWithParent p.ProcessId
  End If
Next

' 4) leftover start.bat windows
For Each p In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE Name='cmd.exe'")
  If Not IsNull(p.CommandLine) Then
    If InStr(1, LCase(p.CommandLine), "smart-shield\start.bat", 1) > 0 Then ids(p.ProcessId) = True
  End If
Next

n = 0
Dim lg : Set lg = fso.CreateTextFile(dir & "\stop.log", True)
lg.WriteLine Now & " found " & ids.Count & " process(es)"
On Error Resume Next
For Each pid In ids.Keys
  For Each p In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE ProcessId=" & pid)
    lg.WriteLine "terminate " & pid & " " & p.Name & " -> " & p.Terminate()
    n = n + 1
  Next
Next
If Err.Number <> 0 Then lg.WriteLine "error " & Err.Number & " " & Err.Description
On Error GoTo 0
lg.Close
sh.Popup IIf(n > 0, "Smart Shield stopped.", "Smart Shield is not running."), 3, "Smart Shield", 64

Sub AddWithParent(id)
  Dim q, c
  ids(id) = True
  For Each q In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE ProcessId=" & id)
    For Each c In wmi.ExecQuery("SELECT * FROM Win32_Process WHERE ProcessId=" & q.ParentProcessId)
      If LCase(c.Name) = "cmd.exe" Then ids(c.ProcessId) = True
    Next
  Next
End Sub

Function IIf(c, a, b)
  If c Then IIf = a Else IIf = b
End Function
