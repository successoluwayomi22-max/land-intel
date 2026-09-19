# Landintel API Reference (v1)

Welcome to the **Landintel REST API** documentation. Landintel provides programmatic due-diligence, document intelligence, cadastral verification, and property risk scoring for global property buyers and legal teams.

---

## Base URLs
- **Staging / Dev Tunnel**: `https://temperature-feels-republic-symphony.trycloudflare.com/api/v1`
- **Production**: `https://landintel.ng/api/v1`

---

## Authentication & Headers
All requests must include standard JSON headers:
```http
Content-Type: application/json
Accept: application/json
```
For authenticated routes, supply the session token in the `Authorization` header or secure HttpOnly cookie:
```http
Authorization: Bearer <session-token>
```

---

## Centralized Error Format
All errors return predictable JSON payloads:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Detailed description of the validation failure.",
    "details": {},
    "requestId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Standard Error Codes
| Code | HTTP Status | Description |
| :--- | :--- | :--- |
| `AUTH_REQUIRED` | 401 | Authentication session missing or invalid |
| `FORBIDDEN` | 403 | Insufficient role or access permissions |
| `ADMIN_REQUIRED` | 403 | Administrative privilege required |
| `VALIDATION_ERROR` | 400 | Required fields missing or malformed |
| `CASE_NOT_FOUND` | 404 | The requested property case does not exist |
| `INTERNAL_ERROR` | 500 | Unexpected server exception |

---

## Key Endpoints

### 1. Centralized Contact Channels
- **`GET /api/v1/contact`**
  - Returns active administrative email, WhatsApp numbers, Facebook, and Instagram details.
- **`PATCH /api/v1/contact`** (Admin only)
  - Updates centralized platform contact information with audit trails.

### 2. Support Requests & Issue Reporting
- **`POST /api/v1/support/requests`**
  - Creates a support ticket and routes notification directly to `successoluwayomi22@gmail.com`.
  - **Body**:
    ```json
    {
      "name": "Jane Doe",
      "email": "jane@example.com",
      "category": "PROPERTY_ANALYSIS",
      "subject": "Coordinate mismatch inquiry",
      "message": "The survey plan beacons don't align with the layout plan.",
      "priority": "HIGH"
    }
    ```
- **`GET /api/v1/support/requests`**
  - Fetches the user's tickets (or all tickets if caller has `ADMIN` role).

### 3. Property Cases
- **`POST /api/v1/cases`**: Create property due-diligence case.
- **`GET /api/v1/cases`**: List property cases with pagination.
- **`GET /api/v1/cases/{caseId}`**: Retrieve property details and analysis status.

---

## Canonical OpenAPI 3.1 Contract
The full OpenAPI 3.1 YAML definition is stored at:
[`/openapi/diasporaland-v1.yaml`](file:///C:/Users/OWE%20PROJECT/Desktop/Workspace/openapi/diasporaland-v1.yaml)
