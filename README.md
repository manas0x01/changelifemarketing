# Change Life Marketing Platform

A comprehensive Multi-Level Marketing (MLM) platform built with Next.js 16, MongoDB, and TypeScript. Features a binary tree network structure, e-pin management, income tracking, and a complete admin dashboard.

## 🚀 Tech Stack

- **Framework:** Next.js 16.1.7 (App Router)
- **Language:** TypeScript 5
- **Database:** MongoDB with Mongoose
- **Authentication:** NextAuth.js 4.24
- **Styling:** Tailwind CSS 4 + Framer Motion
- **UI Components:** shadcn/ui + Radix UI
- **Security:** bcryptjs for password hashing
- **State Management:** React Context API

---

## 📋 Table of Contents

- [Features](#features)
- [User Functionalities](#user-functionalities)
- [Admin Functionalities](#admin-functionalities)
- [MLM Engine](#mlm-engine)
- [API Routes](#api-routes)
- [Database Models](#database-models)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)

---

## ✨ Features

### 🔐 Authentication System
- **Username/Password Login** - Secure credential-based authentication
- **Session Management** - JWT-based sessions with 30-day expiry
- **Transaction Password** - Separate 4-digit PIN for sensitive operations
- **Protected Routes** - Middleware-protected dashboard and admin pages

### 👤 User Management
- User registration with sponsor placement
- Profile management (personal, bank, nominee details)
- Password and transaction password changes
- User ID validation and availability check

### 💰 Income System
- **Basic Income** - Binary pair matching income
- **Booster Matching Income** - Enhanced income for qualified boosters
- **Award Income** - Rank-based achievement rewards
- **Repurchase Income** - Commission on product repurchases
- **Total Income Tracking** - Aggregated income across all sources
- **Session-Based Income** - Morning/Evening cycle tracking

### 📊 Network Tree (Binary MLM)
- Visual binary tree structure (Left/Right placement)
- Sponsor-based member registration
- Automatic placement position validation
- Team statistics (left count, right count)
- Direct members tracking with join dates
- Network depth visualization

### 🎫 E-Pin Management
- **Buy Pins** - Purchase activation pins for new registrations
- **My E-Pins** - View active/used/transferred pins
- **Transfer E-Pins** - Send pins to other members
- **Transferred History** - Track pin transfers
- **Pin Validation** - Real-time pin availability checking

### 🏆 Booster System
- **Booster Qualification** - Automatic detection when members reach criteria
- **Booster Matching** - Special income calculation for boosters
- **Carry Forward** - Pairs carried to next session
- **Booster Cuts** - Track booster pair completions
- **Session-Based Tracking** - Morning/Evening booster counting

### 🏅 Awards & Ranks
- 13-level rank achievement system
- Automatic rank detection based on team growth
- Award records with achievement dates
- Left/Right booster counting for rank progression

### 💸 Withdrawal System
- Minimum ₹1000 withdrawal amount
- Bank account integration
- Withdrawal request tracking (Pending/Approved/Rejected)
- TDS and service charge deductions
- UTR number tracking for completed payments

### 📦 Product & Orders
- Product catalog with pricing
- Order creation and checkout
- Order history tracking
- Payment integration ready

### 🎨 Public Website
- **Landing Page** - Hero section with animated statistics
- **About Us** - Company mission, vision, and director profile
- **Products** - Product showcase
- **Business Plan** - MLM plan explanation
- **Achievers** - Top performers showcase
- **Legal Documents** - Terms and policies
- **Contact** - Inquiry form
- **Banking Partner** - SBI account details display

### 💬 Support Features
- **WhatsApp Chatbot** - Floating chat widget
- **Chat Support** - Direct messaging interface
- **Social Links** - Instagram, Facebook, YouTube, WhatsApp integration

---

## 👥 User Functionalities

### Dashboard (`/dashboard`)
- Real-time statistics cards:
  - Total Team (Left/Right count)
  - Basic Income
  - Booster Income with LG/RG breakdown
  - Total Direct Members
  - Total Pins (Active/Used/Total)
  - Total Income with Withdraw button
- Cycle History Table - Morning/Evening session tracking
- Profile Summary Card
- Social Media Links

### Registration (`/dashboard/registration`)
- **3-Step Registration Process:**
  1. Transaction Password Validation
  2. Sponsor ID Validation with Position Selection
  3. New Member Form
- Features:
  - Sponsor validation with name lookup
  - Automatic position availability check
  - E-Pin selection from available pins
  - User ID uniqueness validation
  - Form validation for all fields
  - Success modal with credentials

### E-Pin Pages
- **Buy Pins** (`/dashboard/buypins`) - Purchase new pins
- **My E-Pins** (`/dashboard/myepins`) - View pin status and history
- **Transfer E-Pin** (`/dashboard/transferepin`) - Send pins to members
- **Transferred** (`/dashboard/transferred`) - View transfer history

### Income Pages
- **Basic Income** (`/dashboard/basicincome`) - Detailed basic income records
- **Booster Income** (`/dashboard/boosterincome`) - Booster matching records
- **Success Payments** (`/dashboard/successpayments`) - Payout history
- **Withdraw Requests** (`/withdrawrequests`) - Request status tracking

### Network Pages
- **Direct Members** (`/dashboard/directmembers`) - List of personally sponsored
- **Team Network** (`/dashboard/teamnetwork`) - Binary tree visualization
- **Network Tree** (`/dashboard/networktree`) - Alternative tree view
- **Booster** (`/dashboard/booster`) - Booster status and details
- **Booster Counting** (`/dashboard/boostercounting`) - Detailed booster metrics

### Profile Management
- **Update Profile** (`/dashboard/updateprofile`) - Edit personal details
- **Edit Bank** (`/dashboard/editbank`) - Update bank account
- **Change Password** (`/dashboard/changepassword`) - Security settings
- **Profile** (`/dashboard/profile`) - View complete profile
- **Welcome Kit** (`/dashboard/welcomekit`) - New member resources

### Support
- **Chat Support** (`/dashboard/chatsupport`) - Help desk interface
- **My Requests** (`/dashboard/myrequests`) - Support ticket tracking

---

## 🔧 Admin Functionalities

### Admin Dashboard (`/admin/dashboard`)
- User statistics overview
- Quick action buttons
- System monitoring

### User Management (`/admin/dashboard/users`)
- View all users with search/filter
- Add new users manually
- Edit user details
- Delete/block users
- View user network tree

### E-Pin Management
- **Create E-Pins** (`/admin/dashboard/createepin`) - Generate bulk pins
- Pin inventory tracking
- Pin usage reports

### Withdrawal Management (`/admin/dashboard/withdraw-requests`)
- View all withdrawal requests
- Approve/reject requests
- Add UTR numbers for completed payments
- Export payment reports

### Content Management
- **Statistics** - Update public website statistics
- **Achievers** - Manage top achiever profiles
- **Legal Docs** - Update legal documents

---

## ⚙️ MLM Engine (`/lib/mlmEngine.ts`)

The core MLM calculation engine handles:

### Binary Pair Processing
- Automatic pair detection (left + right = 1 pair)
- Basic income calculation per pair
- Daily capping limits
- Carry forward handling

### Booster System
- Qualification check (10 pairs required)
- Booster matching income calculation
- Session-based booster counting (Morning/Evening)
- Carry forward pairs management

### Award Rank System
- 13-level automatic rank progression
- Left/Right booster requirement tracking
- Award value assignment
- Achievement date recording

### Income Calculation
```
Total Income = Basic Income + Booster Matching Income + Award Income + Repurchase Income
```

---

## 🌐 API Routes

### Authentication (`/api/auth/*`)
- `POST /register` - New member registration with MLM logic
- `POST /checkuserid` - Validate User ID availability
- `POST /validatetransactionpassword` - Verify transaction PIN
- `POST /checkpinavailability` - Check if user has available pins
- `[...nextauth]` - NextAuth session handling

### User (`/api/user/*`)
- `GET /dashboard` - Fetch dashboard statistics
- `POST /getname` - Get user name by ID
- `POST /getchildrenstatus` - Check left/right placement availability
- `POST /get-epins` - Get user's available E-Pins
- `GET /getprofile` - Fetch complete profile
- `POST /update-profile` - Update user profile
- `POST /withdraw` - Create withdrawal request

### Admin (`/api/admin/*`)
- `GET /users` - List all users
- `POST /users/add` - Create new user
- `GET/PUT /users/[id]` - User CRUD operations
- `POST /createepin` - Generate E-Pins
- `GET /withdraw-requests` - List withdrawal requests
- `PUT /withdraw-requests/[id]` - Update withdrawal status
- `GET /orders` - View all orders
- `GET /user-stats` - User statistics

### Public (`/api/*`)
- `GET /statistics` - Public website statistics
- `GET /legal-docs` - Legal documents list
- `GET /achievers` - Top achievers list
- `GET /income-plans` - Business plan details
- `POST /orders/create` - Create new order
- `GET /orders/my-orders` - User order history

---

## 🗄️ Database Models

### User Model (`/models/User.ts`)
**Personal Info:**
- username, userId, fullName, email, mobileNo
- gender, dateOfBirth, panNo
- address, city, district, state, pincode

**Bank Details:**
- bankName, branchName, accountNo, ifsc
- accountType, nomineeName, nomineeRelation

**MLM Structure:**
- sponsorId, sponsorName
- placementId, placementName, placementPosition
- leftChild, rightChild
- totalTeam: { left, right }
- directMembers: [{ memberId, name, joinDate, position }]

**Income Tracking:**
- basicIncome, boosterMatchingIncome
- awardIncome, repurchaseIncome, totalIncome
- basicIncomeRecords[], boosterIncomeRecords[]
- sessionBasedIncome[]

**E-Pins:**
- ePins: [{ pin, packageName, status, usedDate, ... }]
- activePins, usedPins, totalPins

**Booster Data:**
- isBooster, boosterPairs, boosterCuts[]
- boosterCount: { left, right }
- boosterPairsCarryForward: { left, right }
- boosterMatchingRecords[]

**Ranks:**
- currentAwardRank, awardRankStatus
- awardRankRecords[]

**Withdrawals:**
- withdrawRequests[]
- bankAccountDetails

### Order Model (`/models/Order.ts`)
- orderId, userId, product details
- amount, quantity, status
- shipping address, payment status

### Achiever Model (`/models/Achiever.ts`)
- name, rank, achievementDate
- award details, profile image

### WithdrawRequest Model (`/models/WithdrawRequest.ts`)
- requestNo, amount, status
- requestDate, processedDate
- admin remarks, UTR number

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- npm or pnpm

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd changelifemarketing

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your values

# Run development server
npm run dev
```

### Build for Production

```bash
npm run build
npm start
```

---

## 🔐 Environment Variables

Create `.env.local` file:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/changelife

# NextAuth
NEXTAUTH_SECRET=your-secret-key-here
NEXTAUTH_URL=http://localhost:3000

# Optional: External Services
# Add any payment gateway, email service configs here
```

---

## 📁 Project Structure

```
changelifemarketing/
├── app/
│   ├── (public)/           # Public website pages
│   ├── api/                # API routes
│   ├── auth/               # Login, forgot password
│   ├── dashboard/          # User dashboard pages
│   ├── admin/dashboard/    # Admin pages
│   └── layout.tsx          # Root layout
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── Navbar.tsx
│   ├── Sidebar.tsx
│   └── ...
├── context/                # React contexts
├── lib/
│   ├── auth.ts            # NextAuth config
│   ├── database.ts        # MongoDB connection
│   ├── mlmEngine.ts       # MLM calculation engine
│   └── ...
├── models/                # Mongoose models
├── public/images/         # Static images
├── types/                 # TypeScript types
└── README.md
```

---

## 🎯 Key Features Summary

| Feature | Description |
|---------|-------------|
| **Binary MLM** | Left/Right placement with automatic pair matching |
| **E-Pin System** | Purchase, transfer, and manage activation pins |
| **Booster Income** | Enhanced income for qualified members |
| **Award Ranks** | 13-level automatic rank progression |
| **Withdrawals** | Bank-integrated withdrawal system with TDS |
| **Real-time Stats** | Live dashboard with income tracking |
| **Admin Panel** | Complete user and payment management |
| **Secure** | bcryptjs hashing, JWT sessions, transaction PINs |

---

## 📝 License

Private - Change Life Marketing

## 👨‍💻 Developer

Built for Change Life Marketing, Patna, Bihar
