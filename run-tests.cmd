@echo off
title LMS Medha — Test Runner

:MENU
cls
echo.
echo  ============================================================
echo    LMS Medha — Playwright Test Runner
echo  ============================================================
echo.
echo    [1]  Smoke Tests        (quick alive-check, ~2 min)
echo    [2]  Sanity Tests       (key flows check, ~5 min)
echo    [3]  Regression — ALL   (full happy flows, ~23 min)
echo    [4]  Regression — 1     (1 entry each suite, quick check)
echo    [5]  Regression — 3     (3 entries each suite)
echo.
echo    [6]  Login Tests only
echo    [7]  Class Test only
echo    [8]  Worksheet only
echo    [9]  Collaboration only
echo    [T]  Todo only
echo    [A]  API Tests only
echo.
echo    [R]  Open HTML Report
echo    [L]  Open Allure Report
echo    [Q]  Quit
echo.
set /p choice=  Enter your choice:

if /i "%choice%"=="1" goto SMOKE
if /i "%choice%"=="2" goto SANITY
if /i "%choice%"=="3" goto REGRESSION_ALL
if /i "%choice%"=="4" goto REGRESSION_1
if /i "%choice%"=="5" goto REGRESSION_3
if /i "%choice%"=="6" goto LOGIN
if /i "%choice%"=="7" goto CLASSTEST
if /i "%choice%"=="8" goto WORKSHEET
if /i "%choice%"=="9" goto COLLAB
if /i "%choice%"=="T" goto TODO
if /i "%choice%"=="t" goto TODO
if /i "%choice%"=="A" goto API
if /i "%choice%"=="a" goto API
if /i "%choice%"=="R" goto REPORT
if /i "%choice%"=="r" goto REPORT
if /i "%choice%"=="L" goto ALLURE
if /i "%choice%"=="l" goto ALLURE
if /i "%choice%"=="Q" goto END
if /i "%choice%"=="q" goto END

echo   Invalid choice — try again.
timeout /t 1 >nul
goto MENU

:: ─────────────────────────────────────────────────────────────────────────────

:SMOKE
echo.
echo  Running SMOKE tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/smoke --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:SANITY
echo.
echo  Running SANITY tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/sanity --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:REGRESSION_ALL
echo.
echo  Running FULL REGRESSION (all data entries)...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/regression --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:REGRESSION_1
echo.
echo  Running REGRESSION with 1 entry per suite...
echo  ─────────────────────────────────────────────────────────────
npx cross-env DATA_COUNT=1 playwright test tests/regression --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:REGRESSION_3
echo.
echo  Running REGRESSION with 3 entries per suite...
echo  ─────────────────────────────────────────────────────────────
npx cross-env DATA_COUNT=3 playwright test tests/regression --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:LOGIN
echo.
echo  Running LOGIN tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/auth --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:CLASSTEST
echo.
echo  Running CLASS TEST tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/lesson/classtest --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:WORKSHEET
echo.
echo  Running WORKSHEET tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/lesson/worksheet --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:COLLAB
echo.
echo  Running COLLABORATION tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/lesson/collaboration --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:TODO
echo.
echo  Running TODO tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/todo --headed
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:API
echo.
echo  Running API tests...
echo  ─────────────────────────────────────────────────────────────
npx playwright test tests/api
echo.
echo  Done. Press any key to return to menu.
pause >nul
goto MENU

:REPORT
echo.
echo  Opening HTML Report...
echo  ─────────────────────────────────────────────────────────────
npx playwright show-report reports/html
echo.
pause >nul
goto MENU

:ALLURE
echo.
echo  Generating and opening Allure Report...
echo  ─────────────────────────────────────────────────────────────
allure generate reports/allure-results --clean -o reports/allure-report
allure open reports/allure-report
echo.
pause >nul
goto MENU

:END
echo.
echo  Goodbye!
echo.
