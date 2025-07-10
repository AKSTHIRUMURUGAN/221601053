# URL Shortener Backend Service

A secure URL shortening service with user authentication and profile management.

## Features

- **User Authentication**: JWT-based authentication with bcrypt password hashing
- **URL Shortening**: Create custom or auto-generated shortcodes
- **User Profiles**: Each user has their own collection of shortened URLs
- **Click Tracking**: Track clicks with timestamp, referrer, and location
- **URL Expiry**: Set custom expiry times for shortened URLs
- **Duplicate Prevention**: Check for existing shortcodes before creation

## Setup

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env` file in the root directory:
   ```
   MONGO_URI=mongodb://localhost:27017/urlshortener
   JWT_SECRET=your_jwt_secret_key_here
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start the Server**
   ```bash
   node server.js
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user (sets token in HTTP-only cookie)
- `POST /api/auth/logout` - Logout user (clears cookie)
- `GET /api/auth/profile` - Get user profile and URLs (requires authentication)

### URL Management (Requires Authentication)
- `POST /shorturls` - Create a new shortened URL
- `GET /shorturls/:shortcode` - Get statistics for a shortened URL
- `DELETE /shorturls/:shortcode` - Delete a shortened URL

### Public
- `GET /:shortcode` - Redirect to original URL (no auth required)

## Usage Examples

### 1. Register a User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 2. Login (Sets cookie automatically)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -c cookies.txt \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

### 3. Get User Profile and URLs
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -b cookies.txt
```

### 4. Create Shortened URL (using cookie)
```bash
curl -X POST http://localhost:5000/shorturls \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://www.google.com",
    "shortcode": "google",
    "validity": 60
  }'
```

### 5. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -b cookies.txt
```

### 6. Get URL Statistics
```bash
curl -X GET http://localhost:5000/shorturls/google \
  -b cookies.txt
```

### 7. Delete URL
```bash
curl -X DELETE http://localhost:5000/shorturls/google \
  -b cookies.txt
```

## Request/Response Examples

### Create Short URL Response
```json
{
  "shortLink": "http://localhost:5000/abc123",
  "expiry": "2024-01-15T10:30:00.000Z",
  "shortcode": "abc123"
}
```

### Login Response
```json
{
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### User Profile Response
```json
{
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2024-01-15T09:30:00.000Z"
  },
  "shortenedUrls": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "originalURL": "https://www.google.com",
      "shortcode": "google",
      "expiryDate": "2024-01-15T10:30:00.000Z",
      "clicks": [],
      "createdAt": "2024-01-15T09:30:00.000Z"
    }
  ],
  "totalUrls": 1
}
```

## Error Handling

The API returns appropriate HTTP status codes:
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (missing/invalid token)
- `404` - Not Found (URL/shortcode not found)
- `409` - Conflict (shortcode already exists)
- `410` - Gone (URL expired)
- `500` - Internal Server Error

## Security Features

- Password hashing with bcrypt
- JWT token authentication with HTTP-only cookies
- User-specific URL access control
- Input validation for URLs
- Unique shortcode generation with collision handling
- Secure cookie settings (httpOnly, sameSite, secure in production) 