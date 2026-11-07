export const SOURCES = [
  "Auto-detect",
  // Pre-C era and early languages
  "FORTRAN (I–77)", "COBOL", "ALGOL 60/68", "Lisp (early)", "APL", "BASIC", "PL/I", "RPG (RPG II/III)",
  "Assembly (IBM 360 / x86)", "JCL", "Simula", "SNOBOL", "Pascal", "Smalltalk-80", "Ada 83", "Modula-2",
  // Later legacy
  "C (K&R)", "C/C++ (pre-C++11)", "Visual Basic 6", "Delphi", "Perl", "PHP 5", "Python 2", "Java 6/7",
  "JavaScript (ES5)", "jQuery", "AngularJS 1.x", "C#/.NET Framework", "Classic ASP",
];

export const TARGETS = [
  "Latest stable version, same language", "Python 3.12", "Modern TypeScript", "Java 21", "C# 12 / .NET 8",
  "PHP 8.3", "Go", "Rust", "Modern Fortran (2018)", "COBOL 2014",
  // Framework migrations
  "jQuery → React + TypeScript", "jQuery → Vanilla JS (ES2023)", "AngularJS → Angular 17",
  "Raw PHP → Laravel 11", "Raw PHP → Symfony 7", "Classic ASP → ASP.NET Core", "VB6 → C# WinForms/.NET 8",
  "COBOL → Java 21 (Spring Boot)", "FORTRAN → Python + NumPy",
];

export const GOALS = [
  { label: "Replace deprecated APIs", on: true },
  { label: "Fix security issues", on: true },
  { label: "Add comments where logic is unclear", on: true },
  { label: "Add type hints/annotations", on: false },
  { label: "Add unit tests", on: false },
];

export const EXAMPLES: { name: string; source: string; code: string }[] = [
  { name: "PHP 5 mysql_query", source: "PHP 5", code: `<?php
mysql_connect("localhost","root","");
mysql_select_db("app");
function get_user($id){
  $q = mysql_query("SELECT * FROM users WHERE id = " . $_GET["id"]);
  $row = mysql_fetch_array($q);
  if(split(",", $row["roles"])[0] == "admin"){ echo "Hi admin"; }
  return $row;
}
echo "Welcome " . $_GET["name"];
?>` },
  { name: "FORTRAN 77 averages", source: "FORTRAN (I–77)", code: `      PROGRAM AVG
      DIMENSION X(100)
      N = 0
      S = 0.0
   10 READ(5,*,END=20) V
      N = N + 1
      X(N) = V
      S = S + V
      GO TO 10
   20 IF (N .EQ. 0) GO TO 30
      WRITE(6,100) S/N
  100 FORMAT(' AVERAGE = ',F10.3)
   30 STOP
      END` },
  { name: "COBOL file report", source: "COBOL", code: `       IDENTIFICATION DIVISION.
       PROGRAM-ID. PAYROLL.
       DATA DIVISION.
       WORKING-STORAGE SECTION.
       01 WS-HOURS    PIC 9(3).
       01 WS-RATE     PIC 9(3)V99.
       01 WS-PAY      PIC 9(6)V99.
       PROCEDURE DIVISION.
           ACCEPT WS-HOURS.
           ACCEPT WS-RATE.
           IF WS-HOURS > 40
               COMPUTE WS-PAY = 40 * WS-RATE + (WS-HOURS - 40) * WS-RATE * 1.5
           ELSE
               COMPUTE WS-PAY = WS-HOURS * WS-RATE.
           DISPLAY "PAY: " WS-PAY.
           STOP RUN.` },
  { name: "BASIC guessing game", source: "BASIC", code: `10 REM GUESS THE NUMBER
20 N = INT(RND(1) * 100) + 1
30 PRINT "GUESS A NUMBER 1-100"
40 INPUT G
50 IF G = N THEN GOTO 90
60 IF G < N THEN PRINT "HIGHER"
70 IF G > N THEN PRINT "LOWER"
80 GOTO 40
90 PRINT "YOU GOT IT!"
100 END` },
  { name: "Python 2 urllib", source: "Python 2", code: `import urllib2, md5
def fetch(url):
    try:
        data = urllib2.urlopen(url).read()
    except urllib2.URLError, e:
        print "failed", e
        return None
    print "hash:", md5.new(data).hexdigest()
    return data
for k, v in {"a": 1}.iteritems():
    print k, v` },
  { name: "ES5 callback hell", source: "JavaScript (ES5)", code: `var fs = require('fs');
function load(cb) {
  fs.readFile('a.json', function (err, a) {
    if (err) return cb(err);
    fs.readFile('b.json', function (err, b) {
      if (err) return cb(err);
      var self = this;
      cb(null, JSON.parse(a).concat(JSON.parse(b)));
    });
  });
}` },
  { name: "jQuery todo list", source: "jQuery", code: `$(document).ready(function(){
  $('#add').click(function(){
    var t = $('#todo').val();
    $('#list').append('<li>' + t + '</li>');
    $('#todo').val('');
  });
  $('#list').on('click', 'li', function(){ $(this).remove(); });
});` },
  { name: "Java 6 threads", source: "Java 6/7", code: `import java.util.*;
public class Counter {
  private static Vector results = new Vector();
  public static void main(String[] args) throws Exception {
    for (int i = 0; i < 4; i++) {
      Thread t = new Thread(new Runnable() {
        public void run() { results.add(new Integer(42)); }
      });
      t.start(); t.join();
    }
    Iterator it = results.iterator();
    while (it.hasNext()) System.out.println(it.next());
  }
}` },
];

export type Parsed = { code: string; tests: string; changes: string; security: string; commit: string };

export function parseOutput(text: string): Parsed {
  const blocks: string[] = [];
  const re = /```[^\n]*\n([\s\S]*?)(```|$)/g;
  let m: RegExpExecArray | null;
  let lastEnd = 0;
  while ((m = re.exec(text))) {
    blocks.push((m[1] ?? "").replace(/\n$/, ""));
    lastEnd = m.index + m[0].length;
    if (!m[2]) break;
  }
  if (!blocks.length) return { code: text, tests: "", changes: "", security: "", commit: "" };
  const rest = text.slice(lastEnd);
  const section = (name: string) => {
    const r = new RegExp(`#+\\s*${name}[^\\n]*\\n([\\s\\S]*?)(?=\\n#+\\s|$)`, "i");
    return (rest.match(r)?.[1] ?? "").trim();
  };
  return { code: blocks[0] ?? "", tests: blocks[1] ?? "", changes: section("Changes"), security: section("Security"), commit: section("Commit") };
}
