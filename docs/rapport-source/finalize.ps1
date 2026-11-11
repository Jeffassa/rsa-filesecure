# Mise à jour des champs (sommaire, listes, numéros de figures) et export PDF par Word.
param([string]$Docx, [string]$Pdf)
$ErrorActionPreference = "Stop"
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
  $doc = $word.Documents.Open($Docx, $false, $false)
  # Sommaire et listes en interligne simple, comme dans le mémoire.
  foreach ($id in @(-20, -21, -22, -23, -36)) {
    $st = $doc.Styles.Item($id)
    $st.Font.Name = "Times New Roman"
    $st.Font.Size = 11
    $st.ParagraphFormat.LineSpacingRule = 0
    $st.ParagraphFormat.SpaceBefore = 0
    $st.ParagraphFormat.SpaceAfter = 3
  }
  $doc.Styles.Item(-20).Font.Bold = $true
  function Update-All {
    $doc.Fields.Update() | Out-Null
    foreach ($t in $doc.TablesOfContents) { $t.Update() | Out-Null }
    foreach ($t in $doc.TablesOfFigures) { $t.Update() | Out-Null }
    $doc.Repaginate()
  }
  Update-All
  # Les pages finales reprennent la numérotation romaine après les pages liminaires.
  $s2 = $doc.Sections.Item(2).Range
  $last = $doc.Range($s2.End - 1, $s2.End - 1)
  $n = $last.Information(1)
  $pn = $doc.Sections.Item(4).Footers.Item(1).PageNumbers
  $pn.RestartNumberingAtSection = $true
  $pn.StartingNumber = $n + 1
  Update-All
  Update-All
  $s3 = $doc.Sections.Item(3).Range
  $body = $doc.Range($s3.End - 1, $s3.End - 1).Information(1)
  "Pages liminaires : $n ; pages du corps : $body ; pages totales : " + $doc.ComputeStatistics(2)
  $doc.Save()
  $doc.ExportAsFixedFormat($Pdf, 17)
  $doc.Close()
} finally {
  $word.Quit()
}
