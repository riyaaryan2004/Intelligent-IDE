# 🚀 Intelligent IDE

An AI-powered development environment that integrates cutting-edge language models to assist with code generation, analysis, debugging, optimization, and testing.

![Intelligent IDE Screenshot](https://via.placeholder.com/1200x600?text=Intelligent+IDE+Screenshot)

## ✨ Features

- 💻 **Code Generation** - Generate code snippets from natural language prompts
- 🔍 **Code Analysis** - Get insights about code quality, potential bugs, and best practices
- 🛠️ **Code Optimization** - Automatically optimize code for better performance
- 🐞 **Debugging** - Identify and fix bugs in your code
- 🧪 **Testing** - Generate and run tests for your code

## 🔧 Tech Stack

### Frontend
- ⚛️ **React** - UI library
- 📱 **Next.js** - React framework for server-side rendering
- 🎨 **Tailwind CSS** - Utility-first CSS framework
- 📝 **Monaco Editor** - Code editor 
- 🔌 **React Router** - Client-side routing

### Backend
- 🟢 **Node.js** - JavaScript runtime
- 🚂 **Express.js** - Web framework for Node.js
- 🍃 **MongoDB** - NoSQL database
- 🔐 **JWT** - Authentication and authorization
- 🔄 **Mongoose** - MongoDB object modeling
- 📋 **Jest** - Testing framework

### AI Integration
- 🧠 **Google Gemini API** - AI model for code generation and analysis

### DevOps
- 🐳 **Docker** - Containerization
- ☁️ **Cloud Deployment** - Deployment options
- 🔄 **CI/CD Pipelines** - Automated testing and deployment

## 📋 Prerequisites

- Node.js (v16+)
- MongoDB (v4+)
- Google Generative AI API Key
- Git

## 🚀 Getting Started

### Clone the Repository

```bash
git clone https://github.com/yourusername/intelligent-ide.git
cd intelligent-ide
```

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:

```
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/intelligent-ide
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=30d
GEMINI_API_KEY=your_gemini_api_key
FRONTEND_URL=http://localhost:5173
```

4. Start the backend server:

```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd ../frontend
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file in the frontend directory:

```
VITE_API_URL=http://localhost:3000/api
```

4. Start the frontend development server:

```bash
npm run dev
```

5. Open your browser and visit `http://localhost:5173`

## 🗂️ Project Structure

### Backend Structure

```
backend/
├── src/
│   ├── api/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Request handlers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Mongoose models
│   │   ├── routes/        # API routes
│   │   └── services/      # Business logic
│   ├── utils/             # Utility functions
│   └── app.js             # Express app setup
├── logs/                  # Application logs
├── .env                   # Environment variables
└── server.js              # Entry point
```

### Frontend Structure

```
frontend/
├── src/
│   ├── app/              # Application core
│   ├── components/       # Reusable UI components
│   ├── features/         # Feature-specific code
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utilities and helpers
│   ├── services/         # API services
│   ├── store/            # State management
│   ├── styles/           # Global styles
│   └── types/            # TypeScript types
├── public/               # Static assets
└── index.html            # HTML template
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user
- `POST /api/auth/logout` - Logout a user
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Change password
- `POST /api/auth/reset-password` - Request password reset
- `POST /api/auth/reset-password/:token` - Reset password

### Code Operations

- `POST /api/code/generate` - Generate code from prompt
- `POST /api/code/analyze` - Analyze code for improvements
- `POST /api/code/optimize` - Optimize code for performance
- `POST /api/code/save` - Save a code snippet
- `GET /api/code/history/:snippetId` - Get code revision history
- `GET /api/code/snippet/:snippetId` - Get a specific code snippet
- `DELETE /api/code/snippet/:snippetId` - Delete a code snippet

### Debugging

- `POST /api/debug/analyze` - Analyze code for bugs
- `POST /api/debug/fix` - Get fix suggestions for bugs
- `POST /api/debug/session` - Start a debug session
- `POST /api/debug/state` - Get variable state at breakpoint
- `DELETE /api/debug/session/:sessionId` - End a debug session
- `GET /api/debug/sessions` - Get debugging history
- `GET /api/debug/session/:sessionId` - Get debug session details

### Testing

- `POST /api/test/generate` - Generate tests for code
- `POST /api/test/run` - Run tests against code
- `POST /api/test/save` - Save a test case
- `GET /api/test/history/:snippetId` - Get test history
- `GET /api/test/coverage/:snippetId` - Get test coverage
- `GET /api/test/cases/:snippetId` - Get all test cases
- `PUT /api/test/case/:testId` - Update a test case
- `DELETE /api/test/case/:testId` - Delete a test case

### CI/CD

- `POST /api/cicd/pipeline/init` - Initialize a pipeline
- `GET /api/cicd/pipeline/:projectId` - Get pipeline configuration
- `PUT /api/cicd/pipeline/:projectId` - Update pipeline configuration
- `POST /api/cicd/build` - Trigger a build
- `GET /api/cicd/build/:buildId` - Get build status
- `GET /api/cicd/builds/:projectId` - Get project build history
- `POST /api/cicd/deploy` - Deploy a version
- `GET /api/cicd/deploy/:deploymentId` - Get deployment status
- `GET /api/cicd/deployments/:projectId` - Get project deployment history
- `GET /api/cicd/metrics/:projectId` - Get pipeline metrics

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm test
```

### Frontend Tests

```bash
cd frontend
npm test
```

## 🛠️ Development Workflow

1. Create feature branch from `develop`:
   ```bash
   git checkout develop
   git pull
   git checkout -b feature/your-feature-name
   ```

2. Make changes and commit:
   ```bash
   git add .
   git commit -m "Add your feature description"
   ```

3. Push changes and create a pull request:
   ```bash
   git push origin feature/your-feature-name
   ```

4. After code review, merge to `develop` branch.

5. Periodically, `develop` is merged to `main` for releases.

## 📷 Screenshots

![IDE Interface](https://via.placeholder.com/800x450?text=IDE+Interface)
*Main IDE interface with code editor and output panel*

![Code Generation](https://via.placeholder.com/800x450?text=Code+Generation)
*Using AI to generate code from natural language prompts*

![Code Analysis](https://via.placeholder.com/800x450?text=Code+Analysis)
*Analyzing code for quality and potential improvements*

![Debugging](https://via.placeholder.com/800x450?text=Debugging)
*Debugging interface with variable inspection*

## 🔒 Environment Variables

### Backend

| Variable | Description |
|----------|-------------|
| PORT | Server port |
| NODE_ENV | Environment mode (development/production) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | Secret for JWT token generation |
| JWT_EXPIRES_IN | JWT token expiration time |
| GEMINI_API_KEY | Google Gemini API key |
| FRONTEND_URL | Frontend application URL for CORS |

### Frontend

| Variable | Description |
|----------|-------------|
| VITE_API_URL | Backend API base URL |

## 📚 Documentation

- [API Documentation](docs/api.md)
- [User Guide](docs/user-guide.md)
- [Contributing Guidelines](CONTRIBUTING.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 💬 Support

For support or questions, please open an issue or contact the maintainers.

## 🙏 Acknowledgments

- [Google Generative AI](https://ai.google/) for providing the Gemini API
- All open-source libraries and contributors
