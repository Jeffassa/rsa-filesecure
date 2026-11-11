# Rapport de projet : mise à jour du sommaire et des numéros, puis export PDF par Word.
param([string]$Docx, [string]$Pdf)
$ErrorActionPreference = "Stop"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx, $false, $false)
  foreach ($id in @(-20, -21)) {
    $st = $doc.Styles.Item($id)
    $st.Font.Name = "Times New Roman"
    $st.Font.Size = 12
    $st.ParagraphFormat.LineSpacingRule = 0
    $st.ParagraphFormat.SpaceBefore = 0
    $st.ParagraphFormat.SpaceAfter = 6
  }
  $doc.Styles.Item(-20).Font.Bold = $true
  $doc.Styles.Item(-20).ParagraphFormat.SpaceBefore = 6
  for ($i = 0; $i -lt 3; $i++) {
    $doc.Fields.Update() | Out-Null
    foreach ($t in $doc.TablesOfContents) { $t.Update() | Out-Null }
    $doc.Repaginate()
  }
  "Pages totales : " + $doc.ComputeStatistics(2)
  $doc.Save()
  $doc.ExportAsFixedFormat($Pdf, 17)
  $doc.Close()
} finally {
  $word.Quit()
}
