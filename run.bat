@echo off

@REM set script=mainDownload.ts
set script=gamerDownload.ts

ts-node ./src/scripts/execute-script.ts --script %script%