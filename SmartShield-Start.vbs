' Smart Shield - start the local server hidden (no console window) and open the app
Option Explicit
Dim sh, fso, dir, i, lnk
Set sh = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
Dim lg : Set lg = fso.CreateTextFile(dir & "\start.log", True)
lg.WriteLine Now & " start; up=" & IsUp()

If Not IsUp() Then
  sh.Environment("PROCESS")("PORT") = "8787"
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
End If

' Desktop shortcut (created once)
lnk = sh.SpecialFolders("Desktop") & "\Smart Shield.lnk"
If Not fso.FileExists(lnk) Then
  With sh.CreateShortcut(lnk)
    .TargetPath = "wscript.exe"
    .Arguments = """" & WScript.ScriptFullName & """"
    .WorkingDirectory = dir
    .IconLocation = sh.ExpandEnvironmentStrings("%SystemRoot%") & "\System32\shell32.dll,47"
    .Description = "Smart Shield"
    .Save
  End With
End If

lg.WriteLine Now & " up=" & IsUp() & " opening demo"
lg.Close
' نفتح العرض في Microsoft Edge لأنه يوفّر الأصوات العربية (الإماراتية) للحوار
On Error Resume Next
sh.Run "microsoft-edge:http://localhost:8787/demo.html"
If Err.Number <> 0 Then Err.Clear : sh.Run "http://localhost:8787/demo.html"
On Error GoTo 0

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
