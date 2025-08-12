# Combined AI Coding Platform Backend

This backend combines two powerful AI-driven coding platforms:

1. **Collaborative Coding Platform** - Real-time collaborative coding with Socket.IO
2. **Wilder AI Code Generator** - AI-powered code generation and templates

## 🚀 Features

### Collaborative Coding Features
- **Real-time collaboration** via Socket.IO
- **User authentication** with JWT
- **Project management** with MongoDB
- **AI-powered chat** in projects (@ai commands)
- **File tree management**
- **Message caching** with Redis

### AI Code Generation Features  
- **Template-based project creation** (React/Node.js)
- **AI chat interface** for code generation
- **Advanced prompt engineering** with system instructions
- **Multi-format code generation** (HTML, CSS, JS, React, etc.)

## 📁 Project Structure

```
backend/
├── config/
│   └── environment.js          # Environment configuration
├── controllers/
├── db/
│   └── db.js                   # MongoDB connection
├── defaults/
│   ├── node.js                 # Node.js project template
│   └── react.js                # React project template
├── middleware/
├── models/
│   ├── user.model.js           # User schema
│   └── project.model.js        # Project schema
├── routes/
│   ├── user.routes.js          # User authentication routes
│   ├── project.routes.js       # Project management routes
│   ├── ai.routes.js            # Original AI routes
│   ├── chat.routes.js          # NEW: AI chat routes
│   └── templates.routes.js     # NEW: Template generation routes
├── services/
│   ├── ai.service.js           # Combined AI services
│   ├── message.service.js      # Message caching
│   └── redis.service.js        # Redis connection
├── types/
│   ├── constants.js            # Application constants
│   ├── prompts.js              # System prompts for AI
│   ├── stripindents.js         # String utilities
│   └── index.js                # Type definitions & validation
├── app.js                      # Express app configuration
└── server.js                   # Server with Socket.IO
```

## 🔧 API Endpoints

### Collaborative Coding Endpoints
- `GET /` - Health check
- `GET /api/info` - API information
- `POST /users/register` - User registration
- `POST /users/login` - User login
- `GET /projects` - List projects
- `POST /projects` - Create project
- `GET /ai/get-result` - AI generation
- `GET /ai/redis-health` - Redis health check

### AI Code Generation Endpoints
- `POST /chat` - AI chat interface for code generation
- `POST /template` - Template-based project generation

## 🔌 Socket.IO Events

### Client to Server
- `project-message` - Send message to project room
- `load-more-messages` - Load older messages
- `search-messages` - Search messages in project

### Server to Client
- `project-message` - Receive project message
- `load-messages` - Initial message load
- `more-messages-loaded` - Additional messages
- `search-results` - Search results
- `error` - Error notifications

## 🤖 AI Integration

### AI Chat (`/chat`)
- Processes conversational AI requests
- Uses system prompts for context
- Returns structured responses
- Supports message history

### Template Generation (`/template`)
- Determines project type (React/Node.js) from prompt
- Returns appropriate project templates
- Includes file structures and dependencies
- Provides setup instructions

### Socket.IO AI (`@ai` commands)
- Real-time AI assistance in project rooms
- Generates complete project structures
- Updates project file trees
- Supports collaborative AI interactions

## 🛠️ Environment Variables

```env
# Database
MONGO_URI=mongodb://localhost:27017/your-db
REDIS_URL=redis://localhost:6379

# Authentication
JWT_SECRET=your-jwt-secret

# AI
GOOGLE_AI_KEY=your-google-ai-key
GEMINI_API_KEY=your-gemini-key  # Alternative
GEMINI_MODEL=gemini-1.5-flash

# Server
PORT=3000
NODE_ENV=development
```

## 🚀 Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Start MongoDB and Redis**
   ```bash
   # MongoDB
   mongod

   # Redis
   redis-server
   ```

4. **Run the server**
   ```bash
   # Development
   npm run dev

   # Production
   npm start
   ```

## 📝 Usage Examples

### AI Chat Request
```javascript
POST /chat
{
  "messages": [
    {
      "role": "user", 
      "content": "Create a React counter component"
    }
  ]
}
```

### Template Request
```javascript
POST /template
{
  "prompt": "Create a React todo app with local storage"
}
```

### Socket.IO AI Command
```javascript
// In project room
socket.emit('project-message', {
  message: '@ai Create a login form with validation'
});
```

## 🔄 CORS Configuration

The server supports multiple frontend origins:
- `http://localhost:5173` (Vite)
- `http://localhost:3000` (React)
- Production domains (Vercel, Render)

## 🛡️ Error Handling

- Comprehensive error middleware
- Type validation for requests
- Graceful AI failure handling
- Socket.IO error recovery
- Database connection resilience

## 🎯 Key Features Integration

### Combined AI Services
- **Original AI service**: Project-based code generation
- **Wilder AI service**: Chat-based code generation
- **Unified interface**: Both services through single API

### Enhanced CORS
- Supports both project origins
- Development and production modes
- Credential support for authentication

### Robust Error Handling
- Type validation for all requests
- Graceful degradation on service failures
- Comprehensive logging

## 🔧 Development

### Adding New AI Features
1. Extend `services/ai.service.js`
2. Add routes in appropriate route files
3. Update type definitions in `types/index.js`
4. Test with both Socket.IO and HTTP endpoints

### Database Schema
- Users: Authentication and profile data
- Projects: File trees and collaboration data
- Messages: Cached in Redis for performance

## 📊 Performance Considerations

- **Redis caching** for messages
- **Request timeouts** for AI operations
- **Connection pooling** for MongoDB
- **Error recovery** for external services
- **Graceful shutdown** handling

This combined backend provides a powerful foundation for AI-driven collaborative coding platforms with both real-time and on-demand code generation capabilities.
