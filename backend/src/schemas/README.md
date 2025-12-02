# Zod Validation Schemas

This directory contains all Zod validation schemas for the IntraMedia API.

## Purpose

Zod schemas provide type-safe input validation for all API endpoints, protecting against:
- Invalid data types
- Missing required fields
- Malformed inputs (SQL injection, XSS, etc.)
- Out-of-range values

## Structure

```
schemas/
├── index.js              # Central export point
├── auth.schema.js        # Authentication schemas
├── evento.schema.js      # Event schemas
├── dj.schema.js          # DJ schemas
├── cliente.schema.js     # Client schemas
└── README.md            # This file
```

## Usage

### In Routes

```javascript
import { validateRequest } from '../middleware/zodValidation.js';
import { loginSchema, registerSchema } from '../schemas/index.js';

// Apply validation before controller
router.post('/login', validateRequest(loginSchema), login);
router.post('/register', validateRequest(registerSchema), register);
```

### Creating New Schemas

```javascript
import { z } from 'zod';

export const createSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().int().positive().optional()
  })
});
```

## Validation Middleware

### `validateRequest(schema)`
Validates entire request (body, query, params)

### `validateBody(schema)`
Validates only request body

### `validateQuery(schema)`
Validates only query parameters

### `validateParams(schema)`
Validates only URL parameters

## Error Response Format

When validation fails, the API returns:

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "body.email",
      "message": "Email inválido",
      "code": "invalid_string"
    }
  ]
}
```

## Best Practices

1. **Always validate user inputs**: Never trust client data
2. **Use appropriate constraints**: min/max lengths, regex patterns
3. **Provide clear error messages**: In Spanish for better UX
4. **Make fields nullable when appropriate**: Use `.optional().nullable()`
5. **Sanitize before validation**: Trim strings, normalize data

## Examples

### Email Validation
```javascript
z.string().email('Email inválido').max(100)
```

### Phone Number Validation
```javascript
z.string().regex(/^\+?[0-9\s-()]{7,20}$/, 'Teléfono inválido')
```

### Date Validation
```javascript
z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida. Formato: YYYY-MM-DD')
```

### Enum Validation
```javascript
z.enum(['pending', 'confirmed', 'cancelled'], {
  errorMap: () => ({ message: 'Estado inválido' })
})
```

## Security Notes

- All schemas enforce maximum lengths to prevent DoS attacks
- Numeric fields have range limits to prevent integer overflow
- Regex patterns prevent injection attacks
- Password schemas enforce complexity requirements

## Maintenance

When adding new endpoints:
1. Create schema in appropriate file
2. Export from index.js
3. Apply validation middleware in route
4. Test with invalid data
5. Document in API docs

## References

- Zod Documentation: https://zod.dev
- Express Middleware: https://expressjs.com/en/guide/using-middleware.html
