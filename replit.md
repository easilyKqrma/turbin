# HolaPage-75 - Trading Journal & Psychology Tracker

## Overview

HolaPage-75 is a comprehensive trading journal and psychology tracking application that helps traders analyze their performance and emotional patterns. The application allows users to log trades with detailed information including entry/exit prices, instruments, position sizes, P&L calculations, and psychological states. It features real-time trade tracking, emotional analysis, comprehensive reporting capabilities, and PayPal payment integration for subscription plans.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, built using Vite for fast development and optimized production builds
- **Routing**: Wouter for lightweight client-side routing with protected routes for authenticated users
- **State Management**: TanStack Query (React Query) for server state management, caching, and data synchronization
- **UI Framework**: Radix UI components with Tailwind CSS for styling and shadcn/ui component library for consistent design
- **Form Handling**: React Hook Form with Zod validation for type-safe form management and input validation
- **Charts & Visualization**: Recharts for data visualization and trading analytics, lightweight-charts for professional trading charts
- **Animations**: Framer Motion for smooth page transitions and component animations
- **Theme Management**: Custom theme provider with support for light, dark, and system themes

### Backend Architecture
- **Runtime**: Node.js with Express.js framework running on TypeScript for type safety
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations and schema management
- **Authentication**: Independent JWT-based authentication system with bcrypt password hashing
- **Session Management**: Express sessions with PostgreSQL session store for persistent login state
- **API Design**: RESTful API architecture with standardized error handling and middleware-based route protection
- **File Structure**: Monorepo structure with shared types between client and server via shared schema

### Database Design
PostgreSQL database with comprehensive schema including:
- **Users**: Independent authentication system with user profiles, preferences, and onboarding status
- **Trading Accounts**: Multiple account support per user (forex, crypto, futures, stocks, commodities)
- **Instruments**: Default and custom tradeable assets with tick values, sizes, and multipliers for P&L calculations
- **Trades**: Comprehensive trade logging with automatic P&L calculations, status tracking, and image uploads
- **Emotions**: Default emotion library plus custom user emotions for psychological analysis
- **Emotion Logs**: Linking emotions to specific trades with intensity ratings and notes
- **Notifications**: System-wide announcement and notification system
- **Sessions**: PostgreSQL-backed session storage for authentication persistence

### Authentication & Authorization
- **Independent Auth System**: Custom JWT-based authentication not relying on external auth providers
- **Password Security**: bcrypt hashing with proper salt rounds for secure password storage
- **Token Management**: JWT tokens stored in localStorage with server-side validation
- **Route Protection**: Middleware-based authentication for protected endpoints with role-based access
- **Admin System**: Admin user roles with access to dashboard, user management, and system analytics

### Payment Integration
- **PayPal Integration**: Full PayPal SDK integration for subscription payments with sandbox and production environments
- **Subscription Plans**: Multiple tier system (Free, Plus, Pro) with feature restrictions based on plan
- **Payment Processing**: Server-side PayPal order creation and capture with proper error handling

### Development & Deployment
- **Build System**: Vite for frontend bundling with esbuild for server-side compilation
- **Database Migrations**: Drizzle Kit for schema migrations and database management
- **Environment Configuration**: Environment-based configuration for development and production
- **Proxy Setup**: Python Flask proxy for development server routing and request forwarding

## External Dependencies

### Core Technologies
- **Database**: PostgreSQL with connection pooling via node-postgres
- **ORM**: Drizzle ORM for type-safe database operations and schema management
- **Payment Processing**: PayPal Server SDK for payment integration and subscription management
- **Authentication**: JWT tokens with bcrypt for password hashing

### UI & Design
- **Component Library**: Radix UI primitives for accessible, unstyled components
- **Styling**: Tailwind CSS with custom design system and CSS variables
- **Icons**: Lucide React icons and Flaticon Uicons for comprehensive icon library
- **Charts**: Recharts for standard charts, TradingView Lightweight Charts for professional trading visualization

### Development Tools
- **Build Tools**: Vite for frontend, esbuild for backend compilation
- **Type Safety**: TypeScript across entire stack with shared schema types
- **Form Management**: React Hook Form with Zod schema validation
- **State Management**: TanStack Query for server state with optimistic updates

### Cloud Services
- **Database Hosting**: Configured for Neon Database (serverless PostgreSQL)
- **Payment Gateway**: PayPal for subscription billing and payment processing
- **File Storage**: Supports image uploads for trade screenshots and documentation