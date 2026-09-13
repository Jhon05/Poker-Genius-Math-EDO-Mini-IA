@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if not errorlevel 1 (
  py -3 "%~dp0serve_local.py" %*
  goto :done
)
where python >nul 2>&1
if not errorlevel 1 (
  python "%~dp0serve_local.py" %*
  goto :done
)
echo No se encontro Python 3. Revisa LOCAL_TEST_INSTRUCTIONS.md.
echo Este archivo no instala programas ni modifica permisos del equipo.
:done
pause
endlocal
