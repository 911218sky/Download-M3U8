@echo off

set script=mainDownload.ts
@REM set script=gamerDownload.ts

node ./src/scripts/execute-script.ts --script %script%