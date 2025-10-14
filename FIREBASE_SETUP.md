# Firebase Authentication Setup Guide

## Overview

This project now supports Firebase Authentication alongside the traditional JWT authentication system. The Firebase integration provides:

- **User Management**: Create, read, update, and delete users
- **Role-based Access Control**: Admin, agent, and public roles
- **Token Verification**: Validate Firebase ID tokens
- **Profile Management**: Update user profiles
- **Custom Claims**: Role-based permissions

## Prerequisites

1. **Firebase Project**: You need a Firebase project with Authentication enabled
2. **Service Account**: Download the Firebase Admin SDK service account key
3. **Environment Variables**: Configure Firebase credentials

## Setup Instructions

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project or select existing one
3. Enable Authentication in the Firebase console
4. Configure sign-in methods (Email/Password, Google, etc.)

### 2. Generate Service Account Key

1. In Firebase Console, go to **Project Settings** → **Service accounts**
2. Click **Generate new private key**
3. Download the JSON file containing your service account credentials

### 3. Configure Environment Variables

Create a `.env` file in the project root with the following variables:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"your-project-id",...}
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

#### Option A: Single Line JSON (Recommended for production)
Copy the entire content of your service account JSON file as a single line:

```bash
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"baixada-vacinada","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n","client_email":"firebase-adminsdk-...@baixada-vacinada.iam.gserviceaccount.com",...}
```

#### Option B: File Path (For development)
Alternatively, you can store the JSON file and reference its path:

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
```

### 4. Database URL Configuration

Set your Firebase Realtime Database URL:

```bash
FIREBASE_DATABASE_URL=https://your-project-id-default-rtdb.firebaseio.com
```

## API Endpoints

### Public Endpoints

#### Verify Firebase Token
```http
POST /public/auth/verify-token
Content-Type: application/json

{
  "idToken": "firebase-id-token-here"
}
```

#### Get User Profile
```http
GET /public/auth/profile
Authorization: Bearer firebase-id-token
```

#### Update User Profile
```http
PUT /public/auth/profile
Authorization: Bearer firebase-id-token
Content-Type: application/json

{
  "displayName": "New Name",
  "photoURL": "https://example.com/photo.jpg"
}
```

### Admin Endpoints (Requires Admin Role)

#### Create Firebase User
```http
POST /admin/firebase/users
Authorization: Bearer firebase-admin-token
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "displayName": "User Name",
  "role": "public"
}
```

#### Get Firebase User
```http
GET /admin/firebase/users/{uid}
Authorization: Bearer firebase-admin-token
```

#### Update User Claims (Role Management)
```http
PUT /admin/firebase/users/claims
Authorization: Bearer firebase-admin-token
Content-Type: application/json

{
  "uid": "firebase-user-uid",
  "claims": {
    "role": "admin",
    "admin": true
  }
}
```

#### Enable/Disable User
```http
PATCH /admin/firebase/users/{uid}/status
Authorization: Bearer firebase-admin-token
Content-Type: application/json

{
  "disabled": false
}
```

#### Delete Firebase User
```http
DELETE /admin/firebase/users/{uid}
Authorization: Bearer firebase-admin-token
```

## User Roles

The system supports three user roles:

- **public**: Default role for regular users
- **agent**: Intermediate role with additional permissions
- **admin**: Full administrative access

Roles are managed through Firebase custom claims and automatically synchronized with the system.

## Authentication Flow

1. **Client-side**: User authenticates with Firebase (email/password, Google, etc.)
2. **Token Generation**: Firebase generates an ID token
3. **API Request**: Client sends requests with Firebase ID token in Authorization header
4. **Token Verification**: Server verifies token with Firebase Admin SDK
5. **User Context**: Server extracts user information and role from token
6. **Authorization**: Server checks user permissions based on role

## Error Handling

The API returns structured error responses:

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

Common error codes:
- `UNAUTHORIZED`: Invalid or missing token
- `FORBIDDEN`: Insufficient permissions
- `USER_NOT_FOUND`: User does not exist
- `EMAIL_EXISTS`: Email already registered
- `INVALID_TOKEN`: Token format or signature invalid
- `TOKEN_EXPIRED`: Token has expired

## Security Features

- **Token Validation**: All requests verified against Firebase
- **Role-based Access**: Endpoints protected by role requirements
- **Custom Claims**: Roles stored as Firebase custom claims
- **Audit Logging**: All authentication events logged
- **Rate Limiting**: API endpoints have rate limits
- **CORS Protection**: Configurable CORS policies

## Development vs Production

### Development
- Use service account file path for easier debugging
- Enable detailed logging
- Use local Firebase emulator if needed

### Production
- Use environment variables for service account JSON
- Minimize logging sensitive information
- Configure proper CORS origins
- Use Firebase security rules

## Testing

You can test the Firebase integration using:

1. **Postman Collection**: Import the provided collection
2. **Firebase Auth Emulator**: For local testing
3. **Unit Tests**: Run the test suite
4. **Integration Tests**: Test full authentication flow

## Troubleshooting

### Common Issues

1. **"Service account key required"**
   - Ensure `FIREBASE_SERVICE_ACCOUNT_KEY` is set
   - Check JSON format is valid
   - Verify file permissions if using file path

2. **"Invalid token"**
   - Check token is not expired
   - Verify project ID matches
   - Ensure clock synchronization

3. **"Permission denied"**
   - Verify user has correct role
   - Check custom claims are set
   - Confirm endpoint requires correct permission level

### Debug Mode

Enable debug logging:

```bash
LOG_LEVEL=debug
```

This will show detailed Firebase authentication logs.

## Migration from JWT

If migrating from JWT authentication:

1. Both systems can run in parallel
2. Gradually migrate users to Firebase
3. Update client applications to use Firebase Auth
4. Remove JWT endpoints when migration complete

## Support

For issues related to:
- Firebase setup: Check Firebase documentation
- API integration: Review this guide and Swagger docs
- Authentication flow: Check server logs with debug enabled