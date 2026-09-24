# Collaborative Workspace API Testing Guide

This guide covers the authentication API and MongoDB verification for the Collaborative Workspace application.

## Prerequisites

- Node.js and npm installed
- MongoDB running locally
- MongoDB Compass installed (optional, for database inspection)
- Dependencies installed with `npm install`
- A `.env` file in the project root with a MongoDB connection string:

```env
MONGO_URI=mongodb://127.0.0.1:27017/collaborative_workspace_db
JWT_SECRET=replace_with_a_secure_secret
```

## Start the Server

Start the backend before running the API tests:

```bash
node server.js
```

You can also use the npm script:

```bash
npm start
```

The server listens on `http://127.0.0.1:5000` by default. Run all `curl` commands below in a separate terminal window.

## 1. Authentication API Tests

### 1.1 Register an Admin User

Creates a primary account with the `Admin` role.

```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jemil Admin",
    "email": "admin@test.com",
    "password": "password123",
    "role": "Admin"
  }'
```

Expected response: `201 Created`

```json
{
  "message": "Account created successfully",
  "user": {
    "id": "<ADMIN_USER_ID>",
    "name": "Jemil Admin",
    "email": "admin@test.com",
    "role": "Admin"
  }
}
```

### 1.2 Register a Member User

Creates a secondary user account with the `Member` role.

```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alex Member",
    "email": "member@test.com",
    "password": "password123",
    "role": "Member"
  }'
```

Expected response: `201 Created`

```json
{
  "message": "Account created successfully",
  "user": {
    "id": "<MEMBER_USER_ID>",
    "name": "Alex Member",
    "email": "member@test.com",
    "role": "Member"
  }
}
```

### 1.3 Test Duplicate Email Prevention

Attempts to register another account with an existing email address.

```bash
curl -X POST http://127.0.0.1:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Duplicate Test",
    "email": "admin@test.com",
    "password": "password123",
    "role": "Admin"
  }'
```

Expected response: `400 Bad Request`

```json
{
  "message": "Email already registered"
}
```

### 1.4 Log In and Receive a JWT

Authenticates the admin credentials and returns a signed JSON Web Token (JWT).

```bash
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

Expected response: `200 OK`

```json
{
  "message": "Login successful",
  "token": "<YOUR_JWT_TOKEN>",
  "user": {
    "id": "<ADMIN_USER_ID>",
    "name": "Jemil Admin",
    "email": "admin@test.com",
    "role": "Admin"
  }
}
```

### 1.5 Test Login with an Invalid Password

Verifies error handling for incorrect credentials.

```bash
curl -X POST http://127.0.0.1:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "wrongpassword"
  }'
```

Expected response: `400 Bad Request`

```json
{
  "message": "Invalid email or password"
}
```

## 2. Verify the Database in MongoDB Compass

1. Open MongoDB Compass.
2. Connect to `mongodb://127.0.0.1:27017`.
3. Select the `collaborative_workspace_db` database.
4. Open the `users` collection.
5. Confirm the following:
   - Passwords are stored as bcrypt salted hashes beginning with `$2a$` or `$2b$`.
   - `role` is either `Admin` or `Member`.
   - `createdAt` and `updatedAt` are populated automatically.

> Do not commit real passwords, JWT secrets, or other credentials to source control.
