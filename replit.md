# Trading Journal & Psychology Tracker

## Overview

This is a comprehensive trading journal and psychology tracking application built to help traders analyze their performance and emotional patterns. The system allows users to log trades with detailed information including entry/exit prices, profit/loss calculations, and emotional states. It features advanced analytics, multiple trading account support, and professional-grade charts for performance visualization. The application includes both free and premium subscription tiers with PayPal payment integration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite for development and build optimization
- **Routing**: Wouter for lightweight client-side routing with authentication guards
- **State Management**: TanStack Query (React Query) for server state, caching, and data synchronization
- **UI Framework**: Radix UI primitives with Tailwind CSS and shadcn/ui component library for consistent design
- **Form Management**: React Hook Form with Zod validation for type-safe form handling
- **Charts**: Recharts for analytics and lightweight-charts for professional trading visualizations
- **Animations**: Framer Motion for smooth transitions and component animations
- **Theme System**: Custom theme provider supporting light, dark, and system preferences

### Backend Architecture
- **Runtime**: Node.js with Express.js framework in TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL for type-safe database operations
- **Authentication**: Custom JWT-based system with bcrypt password hashing (no external auth providers)
- **Session Management**: Express sessions with PostgreSQL session store
- **API Design**: RESTful endpoints with middleware-based route protection and standardized error handling
- **File Upload**: Image upload support for trade screenshots
- **Code Organization**: Monorepo structure with shared TypeScript types between client and server

### Database Design
PostgreSQL database with comprehensive schema:
- **Users**: Independent authentication with profiles, preferences, and onboarding status
- **Trading Accounts**: Multiple account types per user (forex, crypto, futures, stocks, commodities)
- **Instruments**: Default and custom tradeable assets with tick values and multipliers for P&L calculations
- **Trades**: Comprehensive logging with automatic P&L calculations and image support
- **Emotions**: Default emotion library plus custom user emotions for psychological analysis
- **Emotion Logs**: Links emotions to trades with intensity ratings and notes
- **Notifications**: System-wide announcements and user notifications
- **Sessions**: PostgreSQL-backed session storage for authentication persistence

### Authentication & Authorization
- **Independent Auth**: Custom JWT system without external dependencies
- **Password Security**: bcrypt with proper salt rounds for secure password storage
- **Token Management**: JWT stored in localStorage with server-side validation
- **Route Protection**: Middleware-based authentication with role-based access control
- **Admin System**: Admin roles with dashboard access and user management capabilities

## External Dependencies

### Database
- **Neon Database**: Serverless PostgreSQL hosting via @neondatabase/serverless
- **Drizzle ORM**: Type-safe database queries and schema management

### Payment Processing
- **PayPal SDK**: Complete integration via @paypal/paypal-server-sdk for subscription payments
- **Environment Support**: Both sandbox and production PayPal environments configured

### UI & Design
- **Radix UI**: Comprehensive component primitives for accessible UI elements
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Flaticon Uicons**: Icon library for consistent iconography
- **Google Fonts**: Custom font loading for typography

### Charts & Visualization
- **Recharts**: React charting library for analytics dashboards
- **Lightweight Charts**: Professional trading charts for advanced visualizations

### Development Tools
- **Vite**: Fast development server and build tool
- **ESBuild**: Fast JavaScript bundler for production builds
- **TypeScript**: Type safety across the entire application stack