lexbox-backend/
├── src/
│   ├── config/
│   │   ├── database.js          # PostgreSQL connection
│   │   ├── storage.js           # File storage config
│   │   └── auth.js              # JWT configuration
│   ├── middleware/
│   │   ├── auth.middleware.js   # JWT authentication
│   │   ├── upload.middleware.js # File upload handling
│   │   ├── validation.js        # Request validation
│   │   └── errorHandler.js      # Global error handling
│   ├── models/
│   │   ├── User.js
│   │   ├── Client.js
│   │   ├── Dossier.js
│   │   ├── TimelineNode.js
│   │   ├── Document.js
│   │   └── Invoice.js
│   ├── routes/
│   │   ├── auth.routes.js       # Login, logout, refresh
│   │   ├── clients.routes.js    # Client CRUD
│   │   ├── dossiers.routes.js   # Dossier management
│   │   ├── timeline.routes.js   # Timeline operations
│   │   ├── documents.routes.js  # Document upload/download
│   │   ├── invoices.routes.js   # Billing
│   │   └── dashboard.routes.js  # Dashboard stats
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── clients.controller.js
│   │   ├── timeline.controller.js
│   │   ├── documents.controller.js
│   │   └── invoices.controller.js
│   ├── services/
│   │   ├── auth.service.js      # Business logic for auth
│   │   ├── client.service.js    # Business logic for clients
│   │   ├── document.service.js  # File handling logic
│   │   └── email.service.js     # Email notifications
│   ├── utils/
│   │   ├── jwt.util.js          # JWT helper functions
│   │   ├── hash.util.js         # Password hashing
│   │   └── fileUpload.util.js   # File validation
│   └── app.js                    # Express app setup
├── uploads/                      # Local file storage
├── .env                          # Environment variables
├── package.json
└── server.js                     # Entry point