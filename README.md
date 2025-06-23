# 🚂 The Train Station | Venue Management Dashboard

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)](https://github.com/your-org/trainstation-dashboard)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.1.4-646CFF.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-green.svg)](https://supabase.com/)

> **A comprehensive, modern venue management system built for The Train Station**  
> Streamline operations, enhance customer experiences, and maximize revenue with our all-in-one platform featuring real-time analytics, AI-powered insights, and seamless integrations.

---

## 📋 Table of Contents

- [🎯 Purpose & Features](#-purpose--features)
- [⚡ Quick Start](#-quick-start)
- [🔧 Installation](#-installation)
- [🏗️ Architecture](#️-architecture)
- [📚 Core Modules](#-core-modules)
- [🔌 Integrations](#-integrations)
- [🧪 Testing](#-testing)
- [📖 Documentation](#-documentation)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🎯 Purpose & Features

The Train Station Dashboard is a **production-ready venue management platform** designed for modern entertainment venues. Built with TypeScript, React, and Supabase, it provides comprehensive tools for managing every aspect of venue operations.

### 🌟 Key Features

| **Module** | **Description** | **Status** |
|------------|----------------|------------|
| 📊 **Analytics Dashboard** | Real-time metrics and KPIs | 🟡 Beta |
| 🎤 **Artist Management** | Booking, contracts, and artist CRM | 🟡 Beta |
| 🎫 **Ticketing System** | Event ticketing and seat management | 🟡 Beta |
| 💰 **Financial Management** | Revenue tracking and reports | 🟡 Beta |
| 📦 **Inventory Control** | Stock management and ordering | 🟡 Beta |
| 🔧 **Equipment Management** | Asset tracking and repairs | 🟡 Beta |
| 👥 **CRM & Customer Management** | Customer profiles and engagement | 🟡 Beta |
| 📅 **Event Calendar** | Scheduling and venue availability | 🟡 Beta |
| 🏗️ **Floor Plan Editor** | Interactive layout design | 🟡 Beta |
| 📈 **Marketing Tools** | Campaign management | 🟡 Beta |
| 🤖 **AI Integration** | Content generation and insights | 🟡 Beta |
| ⚙️ **Settings & Configuration** | User roles and system config | 🟡 Beta |

### 🎯 Target Users

- **Venue Managers**: Comprehensive operational oversight and control
- **Event Coordinators**: Streamlined event planning and execution
- **Financial Teams**: Detailed financial tracking and reporting
- **Staff Members**: Role-based access to relevant modules
- **Artists & Performers**: Self-service portals for bookings and requirements

---

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/your-org/trainstation-dashboard.git
cd trainstation-dashboard

# Install dependencies
npm install

# Set up environment variables
cp env.template .env.local
# Edit .env.local with your configuration

# Start development server
npm run dev
```

🌐 **Access the application**: [http://localhost:3000](http://localhost:3000)

---

## 🔧 Installation

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0 or **yarn** >= 1.22.0
- **Git** for version control

### System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **RAM** | 4GB | 8GB+ |
| **Storage** | 2GB free | 5GB+ free |
| **Browser** | Chrome 90+, Firefox 88+, Safari 14+ | Latest versions |

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/trainstation-dashboard.git
   cd trainstation-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.template .env.local
   ```
   
   Configure the following required variables:
  - `VITE_SUPABASE_URL` - Your Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Supabase anonymous key
  - `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
   
   Optional integrations:
  - AI: `VITE_OPENAI_API_KEY` for AI features (GPT-4.1 Mini, o4-mini, GPT-4o)
  - Payments: `VITE_STRIPE_PUBLISHABLE_KEY`, `VITE_STRIPE_SECRET_KEY`
   - Social: Instagram, Facebook, Twitter API keys
   - Storage: Cloudinary configuration

4. **Database Setup**
   ```bash
   # Run Supabase migrations
   npx supabase db reset
   ```

5. **AI Model Configuration**
   The application uses the latest 2025 OpenAI models:
   - **Text Generation**: `gpt-4.1-mini` (latest efficient model)
   - **Reasoning/Analysis**: `o4-mini` (advanced reasoning capabilities)
   - **Image Generation**: `gpt-4o` (replaces DALL-E 3)
   
   See `src/lib/ai/models.ts` for centralized model configuration.

6. **Start Development Server**
   ```bash
   npm run dev
   ```

### Production Deployment

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🏗️ Architecture

The Train Station Dashboard follows a **modular, scalable architecture** with clear separation of concerns:

```
src/
├── app/                    # Next.js app router & layouts
├── components/             # React components by feature
│   ├── analytics/          # Dashboard & reporting components
│   ├── artists/            # Artist management UI
│   ├── auth/               # Authentication components
│   ├── calendar/           # Event scheduling
│   ├── crm/                # Customer relationship management
│   ├── finances/           # Financial management
│   ├── inventory/          # Stock & inventory control
│   ├── tickets/            # Ticketing system
│   └── ui/                 # Shared UI components
├── hooks/                  # Custom React hooks
├── lib/                    # Core utilities & services
│   ├── api/                # API layer & adapters
│   ├── providers/          # Context providers
│   ├── security/           # Security utilities
│   └── supabase/           # Database client & types
├── pages/                  # Page components
├── styles/                 # Global styles & themes
└── types/                  # TypeScript definitions
```

### 🔧 Technology Stack

| **Category** | **Technology** | **Purpose** |
|--------------|----------------|-------------|
| **Frontend** | React 18, TypeScript | Component-based UI development |
| **Build Tool** | Vite 5 | Fast development and optimized builds |
| **Backend** | Supabase | Database, authentication, real-time features |
| **UI Framework** | Tailwind CSS | Utility-first styling |
| **State Management** | TanStack Query | Server state management |
| **Charts & Analytics** | Recharts | Data visualization |
| **AI Integration** | OpenAI GPT-4.1 Mini, o4-mini, GPT-4o | AI-powered text, reasoning, and image generation |
| **Testing** | Vitest, Testing Library | Unit and integration testing |
| **Deployment** | Netlify, Vercel | Production hosting |

---

## 📚 Core Modules

### 📊 Analytics Dashboard
- **Real-time KPIs**: Revenue, attendance, customer satisfaction
- **Custom Reports**: Flexible reporting with date ranges and filters
- **Visual Analytics**: Interactive charts and graphs
- **Export Capabilities**: PDF, Excel, and CSV exports

### 🎤 Artist Management
- **Artist Profiles**: Complete artist information and history
- **Booking System**: Contract management and scheduling
- **Rider Management**: Technical and hospitality requirements
- **Payment Tracking**: Artist fees and royalty management

### 🎫 Ticketing System
- **Event Creation**: Flexible event setup with multiple ticket types
- **Seat Management**: Interactive venue layout and seat assignment
- **Payment Processing**: Secure payment handling with Stripe
- **Customer Portal**: Self-service ticket management

### 💰 Financial Management
- **Revenue Tracking**: Multi-stream revenue monitoring
- **Expense Management**: Categorized expense tracking
- **Financial Reporting**: P&L, cash flow, and budget reports
- **Integration**: Sync with external accounting systems

### 📦 Inventory Control
- **Stock Management**: Real-time inventory tracking
- **Automated Ordering**: Smart reorder points and supplier management
- **Asset Tracking**: Equipment and merchandise management
- **Loss Prevention**: Shrinkage tracking and reporting

---

## 🔌 Integrations

The platform seamlessly integrates with essential third-party services:

### 🎵 **Music Platforms**
- **Spotify**: Artist discovery and playlist management
- Integration for music licensing and royalty tracking

### 💳 **Payment Processing**
- **Stripe**: Secure payment processing for tickets and merchandise
- Support for multiple currencies and payment methods

### 📱 **Social Media**
- **Instagram**: Event promotion and content management
- **Facebook**: Event marketing and audience engagement
- **Twitter**: Real-time updates and customer interaction

### ☁️ **Cloud Services**
- **Cloudinary**: Image and video asset management
- Optimized media delivery and transformation

### 🤖 **AI Services**
- **OpenAI GPT-4.1 Mini**: Latest efficient text generation model
- **OpenAI o4-mini**: Advanced reasoning model with multimodal capabilities  
- **OpenAI GPT-4o**: Multimodal model for image generation and analysis
- Content generation, image creation, and customer behavior insights

---

## 🧪 Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Open test UI
npm run test:ui
```

### Test Coverage

The application maintains high test coverage across:
- **Unit Tests**: Component logic and utilities
- **Integration Tests**: API interactions and workflows
- **Security Tests**: Authentication and authorization

---

## 📖 Documentation

### 📚 **User Guides**
- [Getting Started Guide](./docs/getting-started.md)
- [User Manual](./docs/user-manual.md)
- [Admin Guide](./docs/admin-guide.md)

### 🔧 **Developer Documentation**
- [API Documentation](./docs/api/README.md)
- [Component Library](./docs/components/README.md)
- [Database Schema](./docs/database/schema.md)

### 🔐 **Security**
- [Security Guidelines](./docs/security/README.md)
- [Data Protection](./docs/security/data-protection.md)

---

## 🤝 Contributing

We welcome contributions from the community! Please read our [Contributing Guide](./CONTRIBUTING.md) for details on:

- **Code of Conduct**: Community standards and expectations
- **Development Workflow**: Branch strategy and pull request process
- **Coding Standards**: Style guides and best practices
- **Testing Requirements**: Coverage expectations and test strategies

### 🚀 **Development Process**

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase Team** - For the excellent backend-as-a-service platform
- **Vite Team** - For the lightning-fast build tool
- **React Community** - For the robust ecosystem and components
- **Open Source Contributors** - For the amazing libraries and tools

---

## 📞 Support & Contact

- **Documentation**: [docs.trainstation.com](https://docs.trainstation.com)
- **Issues**: [GitHub Issues](https://github.com/your-org/trainstation-dashboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/trainstation-dashboard/discussions)
- **Email**: support@trainstation.com

---

<p align="center">
  <strong>Built with ❤️ for The Train Station</strong><br>
  <em>Empowering venues with modern technology</em>
</p> 