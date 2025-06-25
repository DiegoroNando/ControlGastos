#!/bin/bash
# add-test-users.sh
# Script to add test users via API

# Base URL for the API
API_URL="http://localhost:3001/api"

echo "Adding test users and whitelisting them..."

# Add and whitelist user 1
echo "Adding user Test1 User1..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "AAAA800101HDFXXX01",
  "nombre": "Test1",
  "apellidoPaterno": "User1",
  "apellidoMaterno": "Demo",
  "email": "testuser1@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test1 User1..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "AAAA800101HDFXXX01",
  "email": "testuser1@example.com"
}'
echo

# Add and whitelist user 2
echo "Adding user Test2 User2..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "BBBB810202HJCYYY02",
  "nombre": "Test2",
  "apellidoPaterno": "User2",
  "apellidoMaterno": "Demo",
  "email": "testuser2@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test2 User2..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "BBBB810202HJCYYY02",
  "email": "testuser2@example.com"
}'
echo

# Add and whitelist user 3
echo "Adding user Test3 User3..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "CCCC820303HGUZZZ03",
  "nombre": "Test3",
  "apellidoPaterno": "User3",
  "apellidoMaterno": "Demo",
  "email": "testuser3@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test3 User3..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "CCCC820303HGUZZZ03",
  "email": "testuser3@example.com"
}'
echo

# Add and whitelist user 4
echo "Adding user Test4 User4..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "DDDD830404HNTAAA04",
  "nombre": "Test4",
  "apellidoPaterno": "User4",
  "apellidoMaterno": "Demo",
  "email": "testuser4@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test4 User4..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "DDDD830404HNTAAA04",
  "email": "testuser4@example.com"
}'
echo

# Add and whitelist user 5
echo "Adding user Test5 User5..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "EEEE840505MOCBBB05",
  "nombre": "Test5",
  "apellidoPaterno": "User5",
  "apellidoMaterno": "Demo",
  "email": "testuser5@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test5 User5..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "EEEE840505MOCBBB05",
  "email": "testuser5@example.com"
}'
echo

# Add and whitelist user 6
echo "Adding user Test6 User6..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "FFFF850606MGRCCC06",
  "nombre": "Test6",
  "apellidoPaterno": "User6",
  "apellidoMaterno": "Demo",
  "email": "testuser6@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test6 User6..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "FFFF850606MGRCCC06",
  "email": "testuser6@example.com"
}'
echo

# Add and whitelist user 7
echo "Adding user Test7 User7..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "GGGG860707HSRDDD07",
  "nombre": "Test7",
  "apellidoPaterno": "User7",
  "apellidoMaterno": "Demo",
  "email": "testuser7@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test7 User7..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "GGGG860707HSRDDD07",
  "email": "testuser7@example.com"
}'
echo

# Add and whitelist user 8
echo "Adding user Test8 User8..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "HHHH870808HBCEEE08",
  "nombre": "Test8",
  "apellidoPaterno": "User8",
  "apellidoMaterno": "Demo",
  "email": "testuser8@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test8 User8..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "HHHH870808HBCEEE08",
  "email": "testuser8@example.com"
}'
echo

# Add and whitelist user 9
echo "Adding user Test9 User9..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "IIII880909MCSFFF09",
  "nombre": "Test9",
  "apellidoPaterno": "User9",
  "apellidoMaterno": "Demo",
  "email": "testuser9@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test9 User9..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "IIII880909MCSFFF09",
  "email": "testuser9@example.com"
}'
echo

# Add and whitelist user 10
echo "Adding user Test10 User10..."
curl -X POST $API_URL/users -H "Content-Type: application/json" -d '{
  "curp": "JJJJ891010HCMGGG10",
  "nombre": "Test10",
  "apellidoPaterno": "User10",
  "apellidoMaterno": "Demo",
  "email": "testuser10@example.com",
  "password": "TestPassword123!",
  "tipo": "Votante"
}'
echo

echo "Whitelisting user Test10 User10..."
curl -X POST $API_URL/whitelist -H "Content-Type: application/json" -d '{
  "curp": "JJJJ891010HCMGGG10",
  "email": "testuser10@example.com"
}'
echo

echo "Done adding test users!"
