# RENAPO CURP Validation API Documentation

## Overview

The RENAPO CURP Validation API is a RESTful web service that provides access to Mexico's official RENAPO (Registro Nacional de Población) system for CURP validation and birth certificate data retrieval. This API acts as a secure bridge between your applications and the official RENAPO SOAP services.

### Key Features

- ✅ **CURP Validation**: Validate Mexican CURPs and retrieve personal information
- ✅ **Birth Certificate Data**: Access birth certificate information from RENAPO
- ✅ **Rate Limiting**: Built-in protection against abuse
- ✅ **Security**: CORS protection and optional API key authentication
- ✅ **Error Handling**: Comprehensive error responses with detailed codes
- ✅ **Health Monitoring**: Health check and status endpoints for monitoring
- ✅ **High Performance**: Response times typically under 500ms

## Base URL

```
Production: http://52.7.54.179:3000
Local: http://localhost:3000
```

## API Version

Current API version: **v1**

All API endpoints are prefixed with `/api/v1/`

## Authentication

Currently, the API is configured to work without authentication. However, API key authentication can be enabled by setting environment variables.

### Optional API Key Authentication

If enabled, include the API key in the request headers:

```
X-API-Key: your-api-key-here
```

## Rate Limits

- **Global Rate Limit**: 100 requests per 15 minutes per IP address
- **CURP Validation**: 20 requests per 5 minutes per IP address
- **Birth Certificate**: 20 requests per 5 minutes per IP address

Rate limit headers are included in responses:
- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests in window
- `X-RateLimit-Reset`: Time when the rate limit resets

## Endpoints

### 1. Health Check

Check if the API and RENAPO services are operational.

**Endpoint:** `GET /health`

**Example Request:**
```bash
curl http://52.7.54.179:3000/health
```

**Example Response:**
```json
{
  "status": "ok",
  "timestamp": "2025-06-19T21:51:52.414Z",
  "uptime": 3600.25,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "renapoClient": "healthy",
    "curpService": "ready",
    "nacimientoService": "ready",
    "xmlParser": "ready"
  }
}
```

### 2. API Documentation

Get comprehensive API documentation and available endpoints.

**Endpoint:** `GET /api/v1/docs`

**Example Request:**
```bash
curl http://52.7.54.179:3000/api/v1/docs
```

### 3. CURP Validation (POST)

Validate a CURP and retrieve detailed personal information. **Recommended method**.

**Endpoint:** `POST /api/v1/curp/validate`

**Request Body:**
```json
{
  "curp": "VESC890131MDFGLN03",
  "clientIP": "192.168.1.100"  // Optional
}
```

**Example Request:**
```bash
curl -X POST http://52.7.54.179:3000/api/v1/curp/validate \
  -H "Content-Type: application/json" \
  -d '{"curp":"VESC890131MDFGLN03"}'
```

**Example Response:**
```json
{
  "success": true,
  "data": {
    "curp": "VESC890131MDFGLN03",
    "persona": {
      "nombres": "CINTHIA BERENICE",
      "apellidoPaterno": "VEGA",
      "apellidoMaterno": "SALAZAR",
      "nombreCompleto": "CINTHIA BERENICE VEGA SALAZAR",
      "sexo": "M",
      "fechaNacimiento": "1989-01-31"
    },
    "ubicacion": {
      "entidadNacimiento": "DF",
      "nacionalidad": "MEX"
    },
    "registro": {
      "tipoDocumentoProbatorio": 1,
      "anioRegistro": 1989,
      "numeroActa": 1307,
      "libro": null,
      "folio": null,
      "entidadRegistro": "09",
      "municipioRegistro": "017",
      "statusCurp": "RCN"
    },
    "metadata": {
      "sessionId": "zPKKLUX3MzGZC1zVQWKGleSSJYWWMNt3A4ZWT4pZIqt8LoV5TKIa!1312353453!1750369912311",
      "estatusValidacion": "VALIDO",
      "fechaConsulta": "2025-06-19T21:51:52.414Z",
      "tiempoRespuesta": 453
    }
  }
}
```

### 4. CURP Validation (GET)

Quick CURP validation via URL parameter. Ideal for simple integrations.

**Endpoint:** `GET /api/v1/curp/validate/:curp`

**Parameters:**
- `curp` (required): The CURP to validate (18 characters)
- `clientIP` (optional, query parameter): Client IP for tracking

**Example Request:**
```bash
curl http://52.7.54.179:3000/api/v1/curp/validate/VESC890131MDFGLN03
```

**Example with Client IP:**
```bash
curl "http://52.7.54.179:3000/api/v1/curp/validate/VESC890131MDFGLN03?clientIP=192.168.1.100"
```

### 5. Birth Certificate Data

Retrieve birth certificate information using RENAPO registry data.

**Endpoint:** `POST /api/v1/nacimiento/consultar`

**Request Body:**
```json
{
  "entidad": "09",
  "llave": "12345",
  "entidadOrigen": "09",
  "sid": "ABCDEF123"
}
```

**Example Request:**
```bash
curl -X POST http://52.7.54.179:3000/api/v1/nacimiento/consultar \
  -H "Content-Type: application/json" \
  -d '{
    "entidad": "09",
    "llave": "12345",
    "entidadOrigen": "09",
    "sid": "ABCDEF123"
  }'
```

### 6. Service Status

Get detailed information about service status and configuration.

**Endpoint:** `GET /api/v1/status`

**Example Request:**
```bash
curl http://52.7.54.179:3000/api/v1/status
```

**Example Response:**
```json
{
  "service": "RENAPO CURP Validation API",
  "version": "v1",
  "timestamp": "2025-06-19T21:51:52.414Z",
  "uptime": 3600.25,
  "status": "operational",
  "services": {
    "renapoClient": {
      "status": "healthy",
      "curpService": "ready",
      "nacimientoService": "ready",
      "xmlParser": "ready"
    }
  },
  "configuration": {
    "environment": "production",
    "apiKeyRequired": false,
    "corsEnabled": true,
    "rateLimitEnabled": true
  }
}
```

### 7. Connectivity Test

Test the connection to RENAPO services (useful for diagnostics).

**Endpoint:** `GET /api/v1/test/connectivity`

**Example Request:**
```bash
curl http://52.7.54.179:3000/api/v1/test/connectivity
```

## Response Data Fields

### Person Information (`persona`)

| Field | Type | Description |
|-------|------|-------------|
| `nombres` | string | First name(s) |
| `apellidoPaterno` | string | Paternal surname |
| `apellidoMaterno` | string | Maternal surname |
| `nombreCompleto` | string | Full name (auto-generated) |
| `sexo` | string | Gender (H/M) |
| `fechaNacimiento` | string | Birth date (YYYY-MM-DD format) |

### Location Information (`ubicacion`)

| Field | Type | Description |
|-------|------|-------------|
| `entidadNacimiento` | string | Birth state/entity code |
| `nacionalidad` | string | Nationality code (typically "MEX") |

### Registry Information (`registro`)

| Field | Type | Description |
|-------|------|-------------|
| `tipoDocumentoProbatorio` | number | Type of supporting document |
| `anioRegistro` | number | Registration year |
| `numeroActa` | number | Birth certificate number |
| `libro` | number/null | Registry book number |
| `folio` | number/null | Folio number |
| `entidadRegistro` | string | Registration entity code |
| `municipioRegistro` | string | Registration municipality code |
| `statusCurp` | string | CURP status code |

### Metadata (`metadata`)

| Field | Type | Description |
|-------|------|-------------|
| `sessionId` | string | RENAPO session identifier |
| `estatusValidacion` | string | Validation status |
| `fechaConsulta` | string | Query timestamp (ISO 8601) |
| `tiempoRespuesta` | number | Response time in milliseconds |

## Error Responses

The API returns structured error responses for all error conditions.

### Common Error Format

```json
{
  "success": false,
  "error": "Error Type",
  "message": "Human-readable error description",
  "code": "ERROR_CODE"
}
```

### HTTP Status Codes

| Status | Description |
|--------|-------------|
| 200 | Success |
| 400 | Bad Request (invalid CURP format, missing parameters) |
| 404 | CURP not found in RENAPO database |
| 429 | Rate limit exceeded |
| 500 | Internal server error |
| 503 | Service unavailable (RENAPO service down) |

### RENAPO Error Codes

| Code | Description |
|------|-------------|
| `06` | CURP not found in database |
| `01` | Data validation error |
| `02` | Invalid credentials |
| `03` | Service temporarily unavailable |

### Example Error Response

```json
{
  "success": false,
  "error": "RENAPO Error",
  "message": "CURP no encontrada en la base de datos de RENAPO",
  "code": "RENAPO_ERROR_06",
  "details": {
    "renapoErrorCode": "06",
    "renapoErrorType": "00",
    "renapoMessage": "CURP_NO_ENCONTRADA",
    "sessionId": "ABC123XYZ"
  }
}
```

## Code Examples

### JavaScript/Node.js

```javascript
const axios = require('axios');

async function validateCurp(curp) {
  try {
    const response = await axios.post('http://52.7.54.179:3000/api/v1/curp/validate', {
      curp: curp
    });
    
    console.log('CURP válida:', response.data.data.persona.nombreCompleto);
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error:', error.response.data.message);
    } else {
      console.error('Network error:', error.message);
    }
  }
}

// Usage
validateCurp('VESC890131MDFGLN03');
```

### Python

```python
import requests

def validate_curp(curp):
    url = 'http://52.7.54.179:3000/api/v1/curp/validate'
    payload = {'curp': curp}
    
    try:
        response = requests.post(url, json=payload)
        response.raise_for_status()
        
        data = response.json()
        if data['success']:
            print(f"CURP válida: {data['data']['persona']['nombreCompleto']}")
            return data
        else:
            print(f"Error: {data['message']}")
    except requests.exceptions.RequestException as e:
        print(f"Network error: {e}")

# Usage
validate_curp('VESC890131MDFGLN03')
```

### PHP

```php
<?php
function validateCurp($curp) {
    $url = 'http://52.7.54.179:3000/api/v1/curp/validate';
    $data = json_encode(['curp' => $curp]);
    
    $options = [
        'http' => [
            'header' => "Content-type: application/json\r\n",
            'method' => 'POST',
            'content' => $data
        ]
    ];
    
    $context = stream_context_create($options);
    $result = file_get_contents($url, false, $context);
    
    if ($result === FALSE) {
        return false;
    }
    
    $response = json_decode($result, true);
    
    if ($response['success']) {
        echo "CURP válida: " . $response['data']['persona']['nombreCompleto'];
        return $response;
    } else {
        echo "Error: " . $response['message'];
        return false;
    }
}

// Usage
validateCurp('VESC890131MDFGLN03');
?>
```

### cURL Examples

**Basic CURP Validation:**
```bash
curl -X POST http://52.7.54.179:3000/api/v1/curp/validate \
  -H "Content-Type: application/json" \
  -d '{"curp":"VESC890131MDFGLN03"}'
```

**With Pretty JSON Output:**
```bash
curl -X POST http://52.7.54.179:3000/api/v1/curp/validate \
  -H "Content-Type: application/json" \
  -d '{"curp":"VESC890131MDFGLN03"}' | jq '.'
```

**GET Method:**
```bash
curl http://52.7.54.179:3000/api/v1/curp/validate/VESC890131MDFGLN03
```

## Integration Tips

### 1. **Error Handling Best Practices**

Always check the `success` field in the response:

```javascript
if (response.data.success) {
  // Handle successful validation
  const persona = response.data.data.persona;
} else {
  // Handle error
  console.error(response.data.message);
}
```

### 2. **Rate Limit Handling**

Implement retry logic with exponential backoff:

```javascript
async function validateWithRetry(curp, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await validateCurp(curp);
      return response;
    } catch (error) {
      if (error.response?.status === 429) {
        const delay = Math.pow(2, i) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
  throw new Error('Max retries exceeded');
}
```

### 3. **Data Validation**

Always validate CURP format before making API calls:

```javascript
function isValidCurpFormat(curp) {
  const curpPattern = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/;
  return curpPattern.test(curp.toUpperCase());
}
```

### 4. **Response Time Monitoring**

Monitor API response times for performance tracking:

```javascript
const startTime = Date.now();
const response = await validateCurp(curp);
const responseTime = Date.now() - startTime;
console.log(`API Response Time: ${responseTime}ms`);
```

## Monitoring and Maintenance

### Health Check Monitoring

Set up automated health checks to monitor API availability:

```bash
# Simple health check
curl -f http://52.7.54.179:3000/health || echo "API is down"

# Detailed status check
curl http://52.7.54.179:3000/api/v1/status
```

### Log Monitoring

The API logs all requests and errors. Monitor these logs for:
- High error rates
- Performance issues
- Rate limit violations
- RENAPO service outages

## Security Considerations

1. **HTTPS**: In production, always use HTTPS
2. **API Keys**: Enable API key authentication for production use
3. **Rate Limiting**: Built-in rate limiting prevents abuse
4. **CORS**: Configured to prevent unauthorized cross-origin requests
5. **Input Validation**: All inputs are validated before processing

## Support and Troubleshooting

### Common Issues

1. **CURP Not Found (404)**
   - Verify CURP format is correct
   - Ensure CURP exists in RENAPO database

2. **Rate Limit Exceeded (429)**
   - Implement retry logic with delays
   - Consider requesting higher rate limits

3. **Service Unavailable (503)**
   - Check RENAPO service status
   - Verify server connectivity

### Getting Help

For technical support or questions:
1. Check the `/health` endpoint for service status
2. Review error messages and codes
3. Check API logs for detailed error information

## Changelog

### Version 1.0.0
- Initial release
- CURP validation endpoint
- Birth certificate data retrieval
- Rate limiting and security features
- Health monitoring endpoints

---

## Quick Start Summary

1. **Health Check**: `GET http://52.7.54.179:3000/health`
2. **Validate CURP**: `POST http://52.7.54.179:3000/api/v1/curp/validate`
3. **Quick Validation**: `GET http://52.7.54.179:3000/api/v1/curp/validate/VESC890131MDFGLN03`
4. **API Docs**: `GET http://52.7.54.179:3000/api/v1/docs`

**Example Response Time**: ~453ms average  
**Uptime**: Production-ready with comprehensive error handling  
**Rate Limits**: 20 CURP validations per 5 minutes  

Happy integrating! 🚀
