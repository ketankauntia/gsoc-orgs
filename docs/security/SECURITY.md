# Security Documentation

## Admin Endpoint Authentication

### Overview

The admin endpoint `/api/admin/compute-first-time` uses header-based authentication to protect write operations (POST) while keeping read operations (GET) public for open source usage.

### Authentication Mechanism

**POST Endpoint (Protected):**
- Requires `x-admin-key` header
- Must match `ADMIN_KEY` environment variable exactly
- Uses constant-time comparison to prevent timing attacks

**GET Endpoint (Public):**
- No authentication required
- Open for anyone to query statistics
- Safe for open source usage

### Setting Up ADMIN_KEY

1. **Add to `.env` file:**
   ```bash
   ADMIN_KEY=your-secret-random-key-here
   ```

2. **Generate a secure key:**
   ```bash
   # Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   
   # Using OpenSSL
   openssl rand -hex 32
   
   # Using Python
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

3. **Never commit `.env` to version control:**
   - `.env` should be in `.gitignore`
   - Use `.env.example` to document required variables (without values)

### How Authentication Works

The authentication function:

1. **Reads the header:**
   ```typescript
   const adminKey = request.headers.get('x-admin-key')
   ```

2. **Gets the expected key from environment:**
   ```typescript
   const expectedKey = process.env.ADMIN_KEY
   ```

3. **Validates the key exists:**
   - If `ADMIN_KEY` is not set, endpoint rejects all requests (secure by default)

4. **Uses secure comparison:**
   - Constant-time comparison prevents timing attacks
   - Compares lengths first (fast rejection)
   - Uses bitwise XOR for character-by-character comparison
   - Returns `true` only if all characters match exactly

### Security Features

✅ **Constant-time comparison** - Prevents timing attacks  
✅ **Fail-secure** - If `ADMIN_KEY` not set, endpoint rejects all requests  
✅ **Exact match required** - No partial matches, must be identical  
✅ **Environment variable** - Key stored securely, not in code  

### Example Usage

**Protected POST (requires auth):**
```bash
curl -X POST \
  -H "x-admin-key: your-secret-key-from-env" \
  "http://localhost:3000/api/admin/compute-first-time?year=2025"
```

**Public GET (no auth):**
```bash
curl "http://localhost:3000/api/admin/compute-first-time?year=2025"
```

### Security Best Practices

1. **Use a strong, random key:**
   - Minimum 32 characters
   - Mix of letters, numbers, and symbols
   - Generated using cryptographically secure random generator

2. **Keep it secret:**
   - Never commit to version control
   - Don't share in chat/email
   - Use different keys for dev/staging/production

3. **Rotate periodically:**
   - Change the key if compromised
   - Update in all environments when rotating

4. **Monitor access:**
   - Log all admin endpoint access attempts
   - Alert on repeated failed authentication attempts

### Verification

To verify your `ADMIN_KEY` is working:

1. **Test without key (should fail):**
   ```bash
   curl -X POST "http://localhost:3000/api/admin/compute-first-time?year=2025"
   # Expected: {"success":false,"error":{"message":"Unauthorized. Admin key required.","code":"UNAUTHORIZED"}}
   ```

2. **Test with wrong key (should fail):**
   ```bash
   curl -X POST -H "x-admin-key: wrong-key" \
     "http://localhost:3000/api/admin/compute-first-time?year=2025"
   # Expected: {"success":false,"error":{"message":"Unauthorized. Admin key required.","code":"UNAUTHORIZED"}}
   ```

3. **Test with correct key (should succeed):**
   ```bash
   curl -X POST -H "x-admin-key: ${ADMIN_KEY}" \
     "http://localhost:3000/api/admin/compute-first-time?year=2025"
   # Expected: {"success":true,"data":{...}}
   ```

### Troubleshooting

**Issue: Always getting 401 Unauthorized**

- Check that `ADMIN_KEY` is set in `.env` file
- Restart the dev server after adding to `.env`
- Verify the header name is exactly `x-admin-key` (case-sensitive)
- Check for extra spaces in the key value

**Issue: Key works locally but not in production**

- Verify `ADMIN_KEY` is set in production environment variables
- Check that environment variables are loaded correctly
- Ensure no extra whitespace or quotes around the key value

