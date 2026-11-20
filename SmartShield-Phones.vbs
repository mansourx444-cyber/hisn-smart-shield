' Smart Shield - live demo on two real phones
' Starts the server with a secure public HTTPS link (Cloudflare quick tunnel) and opens the setup page with two QR codes.
Option Explicit
Dim sh, fso, dir, i, cf
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Dim lg : Set lg = fso.CreateTextFile(dir & "\phones.log", True)
lg.WriteLine Now & " phones start"

' 1) Stop any running copy (it may be running without the secure link)
If fso.FileExists(dir & "\SmartShield-Stop.vbs") Then sh.Run "wscript """ & dir & "\SmartShield-Stop.vbs""", 0, True

' 2) Make sure cloudflared is installed (one time, needs internet)
cf = FindCf()
If cf = "" Then
  lg.WriteLine Now & " installing cloudflared"
  MsgBox "First time only: installing Cloudflare's secure-link tool (cloudflared)." & vbCrLf & "A window will open; accept if Windows asks.", 64, "Smart Shield"
  sh.Run "cmd /c winget install --id Cloudflare.cloudflared -e --accept-source-agreements --accept-package-agreements", 1, True
  cf = FindCf()
  If cf = "" Then
    lg.WriteLine Now & " cloudflared missing" : lg.Close
    MsgBox "Could not install cloudflared. Install it from:" & vbCrLf & "https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" & vbCrLf & "then run Smart Shield Phones again.", 48, "Smart Shield"
    WScript.Quit 1
  End If
End If
lg.WriteLine Now & " cloudflared=" & cf

' 3) Start the server with the secure link
sh.Environment("PROCESS")("PORT") = "8787"
sh.Environment("PROCESS")("TUNNEL") = "1"
sh.Environment("PROCESS")("PATH") = fso.GetParentFolderName(cf) & ";" & sh.Environment("PROCESS")("PATH")
sh.CurrentDirectory = dir
sh.Run "cmd /c node """ & dir & "\server.js"" > """ & dir & "\server.log"" 2>&1", 0, False
For i = 1 To 30
  WScript.Sleep 500
  If IsUp() Then Exit For
Next
If Not IsUp() Then
  lg.WriteLine Now & " failed to start" : lg.Close
  MsgBox "Smart Shield could not start. Make sure Node.js is installed (nodejs.org)." & vbCrLf & "Details: " & dir & "\server.log", 48, "Smart Shield"
  WScript.Quit 1
End If
lg.WriteLine Now & " up, opening phones page"
lg.Close

' 4) Open the setup page (QR codes for both phones)
On Error Resume Next
sh.Run "microsoft-edge:http://localhost:8787/phones"
If Err.Number <> 0 Then Err.Clear : sh.Run "http://localhost:8787/phones"
On Error GoTo 0

Function FindCf()
  Dim p, cands, c
  FindCf = ""
  cands = Array( _
    sh.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\cloudflared\cloudflared.exe", _
    sh.ExpandEnvironmentStrings("%ProgramFiles%") & "\cloudflared\cloudflared.exe", _
    sh.ExpandEnvironmentStrings("%LOCALAPPDATA%") & "\Microsoft\WinGet\Links\cloudflared.exe")
  For Each c In cands
    If fso.FileExists(c) Then FindCf = c : Exit Function
  Next
  ' on PATH?
  On Error Resume Next
  Dim ex : Set ex = sh.Exec("cmd /c where cloudflared")
  Do While ex.Status = 0 : WScript.Sleep 100 : Loop
  p = Trim(Split(ex.StdOut.ReadAll & vbCrLf, vbCrLf)(0))
  If p <> "" And fso.FileExists(p) Then FindCf = p
  On Error GoTo 0
End Function

Function IsUp()
  On Error Resume Next
  Dim h
  Set h = CreateObject("MSXML2.ServerXMLHTTP.6.0")
  h.setTimeouts 800, 800, 800, 800
  h.open "GET", "http://localhost:8787/api/config", False
  h.send
  IsUp = (Err.Number = 0)
  If IsUp Then IsUp = (h.status = 200)
  Err.Clear
End Function
