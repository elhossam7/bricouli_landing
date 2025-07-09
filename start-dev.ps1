# Start the backend server
Start-Process powershell -ArgumentList "cd server; npm start"

# Start http-server for frontend
Start-Process powershell -ArgumentList "http-server . -p 8080 --cors"

Write-Host "Development servers started!"
Write-Host "Frontend: http://localhost:8080"
Write-Host "Backend: http://localhost:5000"
