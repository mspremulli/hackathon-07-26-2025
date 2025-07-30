@echo off
cd /d %~dp0
echo Starting WhatsApp scraper...
npx ts-node src/test-hybrid.ts
echo.
echo Scraping complete! Check the dashboard to see the new data.
pause