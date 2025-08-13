# 🚚 Parcel Delivery System API

A secure, modular, and role-based backend API for a parcel delivery system built with **Express.js**, **TypeScript**, and **MongoDB**.

## 🎯 Project Overview

This API provides a comprehensive solution for parcel delivery management, inspired by popular courier services like Pathao or Sundarban. It implements a secure authentication system with role-based access control, allowing users to register as senders or receivers and perform various parcel delivery operations.

## ✨ Features

- 🔐 **JWT-based Authentication** with bcrypt password hashing
- 🎭 **Role-based Authorization** (admin, sender, receiver)
- 📦 **Parcel Management** with comprehensive status tracking
- 📊 **Status History** embedded within parcel documents
- 🔍 **Advanced Search & Filtering** with pagination
- 📈 **Admin Dashboard** with statistics and analytics
- 🛡️ **Security Features** (helmet, CORS, input validation)
- 📱 **RESTful API** design following best practices

## 🏗️ System Architecture

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full system access, user management, parcel oversight |
| **Sender** | Create parcels, cancel (if not dispatched), view own parcels |
| **Receiver** | View incoming parcels, confirm delivery |

### Parcel Status Flow

```
REQUESTED → APPROVED → DISPATCHED → IN_TRANSIT → DELIVERED
     ↓
  CANCELED (if not dispatched)
```

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd parcel-delivery-system-b5a5
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # MongoDB Configuration
   MONGO_URI=mongodb://localhost:27017/parcelDeliveryDB
   
   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d
   ```

4. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production build
   npm run build
   npm start
   ```

5. **Access the API**
   - Base URL: `http://localhost:5000`
   - Health Check: `http://localhost:5000/api/health`

## 📁 Project Structure

```
src/
├── app/
│   ├── config/
│   │   └── db.ts                 # Database connection
│   ├── interfaces/
│   │   ├── index.d.ts            # Global type declarations
│   │   └── user.interface.ts     # User type definitions
│   ├── middlewares/
│   │   └── auth.ts               # Authentication & authorization
│   ├── modules/
│   │   ├── user/                 # User management module
│   │   │   ├── user.controller.ts
│   │   │   ├── user.model.ts
│   │   │   └── user.route.ts
│   │   └── parcel/               # Parcel management module
│   │       ├── parcel.controller.ts
│   │       ├── parcel.model.ts
│   │       └── parcel.route.ts
│   ├── utils/
│   │   └── generateTrackingId.ts # Tracking ID generator
│   └── routes/                   # Route aggregator
├── app.ts                        # Express app configuration
└── server.ts                     # Server entry point
```

## 🔌 API Endpoints

### Authentication & User Management

#### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/users/register` | Register a new user |
| `POST` | `/api/v1/users/login` | User login |

#### Authenticated Routes (All Roles)
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/me` | Get own profile |
| `PATCH` | `/api/v1/users/me` | Update own profile |

#### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/users/` | Search users with filters |
| `GET` | `/api/v1/users/stats` | Get user statistics |
| `PATCH` | `/api/v1/users/:id` | Update user by ID |
| `PATCH` | `/api/v1/users/:id/status` | Toggle user status (block/unblock) |

### Parcel Management

#### Public Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/parcels/track/:trackingId` | Track parcel by tracking ID |

#### Sender Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/parcels/` | Create new parcel |
| `PATCH` | `/api/v1/parcels/cancel/:id` | Cancel parcel (if not dispatched) |
| `GET` | `/api/v1/parcels/my-parcels` | Get own parcels |

#### Receiver Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/parcels/incoming` | Get incoming parcels |
| `PATCH` | `/api/v1/parcels/confirm/:id` | Confirm parcel delivery |

#### Admin Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/v1/parcels/` | Get all parcels with filters |
| `GET` | `/api/v1/parcels/stats` | Get delivery statistics |
| `GET` | `/api/v1/parcels/:id` | Get parcel by ID |
| `PATCH` | `/api/v1/parcels/status/:id` | Update parcel status |
| `PATCH` | `/api/v1/parcels/toggle/:id` | Toggle parcel status flow |
| `DELETE` | `/api/v1/parcels/:id` | Soft delete parcel |

## 📊 Data Models

### User Model
```typescript
interface IUser {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  role: 'admin' | 'sender' | 'receiver';
  status: 'active' | 'inactive' | 'banned';
  address?: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };
  avatar?: string;
  parcels?: ObjectId[];
}
```

### Parcel Model
```typescript
interface IParcel {
  trackingId: string;           // Format: TRK-YYYYMMDD-xxxxxx
  type: string;                 // Parcel type
  weight: number;               // Weight in kg
  fee?: number;                 // Delivery fee
  sender: ObjectId;             // Reference to User
  receiver: ObjectId;           // Reference to User
  fromAddress: string;          // Pickup address
  toAddress: string;            // Delivery address
  currentStatus: ParcelStatus;  // Current delivery status
  statusLogs: IStatusLog[];     // Status history
  isDeleted?: boolean;          // Soft delete flag
}

interface IStatusLog {
  status: ParcelStatus;
  timestamp: Date;
  updatedBy: ObjectId;          // User who updated
  note?: string;                // Optional note
  location?: string;            // Current location
}
```

## 🔐 Authentication & Authorization

### JWT Token Structure
```json
{
  "id": "user_id",
  "role": "admin|sender|receiver",
  "iat": "issued_at",
  "exp": "expiration_time"
}
```

### Role-Based Access Control
- **Admin**: Full access to all endpoints
- **Sender**: Can create, view, and cancel own parcels
- **Receiver**: Can view incoming parcels and confirm delivery

### Protected Routes
All routes except `/register`, `/login`, and `/track/:trackingId` require authentication. Admin-only routes require the `admin` role.

## 🧪 Testing the API

### Using Postman

1. **Import the collection** (see Postman collection below)
2. **Set up environment variables**:
   - `base_url`: `http://localhost:5000`
   - `token`: Will be set automatically after login

### Test Flow

1. **Register users** for each role
2. **Login** to get JWT token
3. **Create parcels** as a sender
4. **Update status** as an admin
5. **Confirm delivery** as a receiver
6. **Track parcels** using tracking ID

## 📋 Postman Collection

```json
{
  "info": {
    "name": "Parcel Delivery API",
    "description": "Complete API collection for testing"
  },
  "item": [
    {
      "name": "Authentication",
      "item": [
        {
          "name": "Register User",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/v1/users/register",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"fullName\": \"John Doe\",\n  \"email\": \"john@example.com\",\n  \"phone\": \"+1234567890\",\n  \"password\": \"password123\",\n  \"role\": \"sender\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        },
        {
          "name": "Login User",
          "request": {
            "method": "POST",
            "url": "{{base_url}}/api/v1/users/login",
            "body": {
              "mode": "raw",
              "raw": "{\n  \"email\": \"john@example.com\",\n  \"password\": \"password123\"\n}",
              "options": {
                "raw": {
                  "language": "json"
                }
              }
            }
          }
        }
      ]
    }
  ]
}
```

## 🚀 Deployment

### Production Considerations

1. **Environment Variables**
   - Use strong JWT secrets
   - Configure production MongoDB URI
   - Set appropriate NODE_ENV

2. **Security**
   - Enable HTTPS
   - Configure CORS properly
   - Rate limiting
   - Input validation

3. **Monitoring**
   - Log management
   - Error tracking
   - Performance monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team

## 🔄 Changelog

### v1.0.0
- Initial release
- Complete user management system
- Parcel delivery workflow
- Role-based access control
- Admin dashboard functionality

---

**Built with ❤️ using Express.js, TypeScript, and MongoDB**
