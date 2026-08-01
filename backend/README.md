# POS System - Backend Server

Express.js backend server with MySQL, Redis caching, and compression.

## Requirements

- Node.js 18+
- MySQL 8.0+
- Redis (optional, for caching)

## Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Database Setup

Create MySQL database:

```sql
CREATE DATABASE `pos-react`;
```

### 3. Environment Configuration

Create a `.env` file in the server folder:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=root
DB_NAME=pos-react
DB_PORT=3306

# Server Configuration
PORT=3001
NODE_ENV=development

# Redis Configuration (optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Gemini AI Configuration (for Post Creator AI)
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

## API Endpoints

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories (with pagination) |
| GET | `/api/categories/:id` | Get single category |
| POST | `/api/categories` | Create new category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Query Parameters (GET /api/categories)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search term for category name

### Example Response

```json
{
  "success": true,
  "data": [
    {
      "id": "1",
      "name": "Electronics",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10,
    "hasNext": true,
    "hasPrev": false
  },
  "fromCache": false
}
```

### Health Check

```
GET /api/health
```

## AI Post Creator Setup

To use the AI Post Creator feature, you need to:

1. Get a Gemini API Key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add it to your `.env` file:
   ```env
   GEMINI_API_KEY=your_api_key_here
   ```
3. The API will automatically use the key for generating Facebook post content

## Features

- ✅ RESTful API
- ✅ MySQL Database with Connection Pool
- ✅ Redis Caching
- ✅ Gzip Compression
- ✅ CORS Support
- ✅ API Pagination
- ✅ Search Functionality
- ✅ Error Handling
- ✅ AI Post Creator (Gemini AI)

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   ├── database.js    # MySQL configuration
│   │   └── redis.js       # Redis configuration
│   ├── controllers/
│   │   └── category.controller.js
│   ├── models/
│   │   └── category.model.js
│   ├── routes/
│   │   └── category.routes.js
│   └── index.js           # Server entry point
├── package.json
└── README.md
```

