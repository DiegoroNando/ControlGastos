#!/bin/bash

# Script to whitelist CURPs using curl requests
# Make sure your backend server is running on port 3002

echo "🔐 Whitelisting CURPs in the sistema-votaciones database..."
echo "=================================================="

# 1. Ana Garcia Martinez
echo "Whitelisting GAMA920718MDFRRN04 - Ana Garcia Martinez"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"GAMA920718MDFRRN04"}}'
echo -e "\n"

# 2. Javier Rodriguez Perez
echo "Whitelisting ROPJ870429HJCDXV01 - Javier Rodriguez Perez"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"ROPJ870429HJCDXV01"}}'
echo -e "\n"

# 3. Sofia Mendez Cruz
echo "Whitelisting MECS910506MMSRRF08 - Sofia Mendez Cruz"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"MECS910506MMSRRF08"}}'
echo -e "\n"

# 4. Roberto Diaz Flores
echo "Whitelisting DIFR891123HCLZLB02 - Roberto Diaz Flores"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"DIFR891123HCLZLB02"}}'
echo -e "\n"

# 5. Maria Fernandez Morales
echo "Whitelisting FEMM930617MVZRRAR03 - Maria Fernandez Morales"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"FEMM930617MVZRRAR03"}}'
echo -e "\n"

# 6. Daniel Gutierrez Sanchez
echo "Whitelisting GUSD850730HPLTNRN07 - Daniel Gutierrez Sanchez"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"GUSD850730HPLTNRN07"}}'
echo -e "\n"

# 7. Elena Ortiz Vargas
echo "Whitelisting OIVE941209MMCRRL00 - Elena Ortiz Vargas"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"OIVE941209MMCRRL00"}}'
echo -e "\n"

# 8. Alejandro Reyes Castro
echo "Whitelisting RECA860825HTSYSL03 - Alejandro Reyes Castro"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"RECA860825HTSYSL03"}}'
echo -e "\n"

# 9. Carmen Vega Medina
echo "Whitelisting VEMC980320MGRGRR07 - Carmen Vega Medina"
curl -X POST "http://localhost:3002/api/db/create" \
  -H "Content-Type: application/json" \
  -d '{"collectionName":"whitelist","data":{"curp":"VEMC980320MGRGRR07"}}'
echo -e "\n"

echo "=================================================="
echo "✅ Whitelist process completed!"
echo "All 9 CURPs have been processed for whitelisting."
