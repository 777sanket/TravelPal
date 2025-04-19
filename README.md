# TravelPal - AI-Powered Travel Planner

TravelPal is an intelligent travel planning application that uses AI to help users create personalized travel itineraries. The app engages users in a conversation to collect travel preferences and generates detailed day-by-day itineraries with local recommendations.

## Features

- **AI-Driven Conversation**: Engages users to gather travel preferences including destination, dates, cuisine preferences, activities, and special requirements
- **Personalized Itineraries**: Creates custom travel plans based on user preferences
- **Interactive Itinerary View**: Displays itineraries in a structured, easy-to-navigate format
- **PDF Download**: Download your itineraries as PDF for offline access
- **User Authentication**: Secure login and registration system
- **Itinerary Management**: Save, edit, and manage multiple itineraries

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **AI Integration**: OpenRouter API for AI conversation

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- MongoDB instance

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/travelpal.git
   cd travelpal/backend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/travelpal
   JWT_SECRET=your_jwt_secret_key
   OPENROUTER_API_KEY=your_openrouter_api_key
   SITE_URL=http://localhost:3000
   ```

4. Start the backend server:
   ```
   npm run dev
   # or
   yarn dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ../frontend
   ```

2. Install dependencies:
   ```
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the frontend directory with the following variables:
   ```
   NEXT_PUBLIC_API_URL=Backend http://localhost:5001/api
   ```

4. Start the development server:
   ```
   npm run dev
   # or
   yarn dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser to see the application.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login a user

### Chat
- `GET /api/chat` - Get chat history
- `POST /api/chat` - Create a new chat
- `POST /api/chat/message` - Send a message

### Itinerary
- `POST /api/itinerary` - Create a new itinerary
- `GET /api/itinerary` - Get all user itineraries
- `GET /api/itinerary/:id` - Get itinerary by ID
- `PUT /api/itinerary/:id` - Update an itinerary

## Future Scope

- **Chat History**: View and continue previous travel planning conversations
- **Social Sharing**: Share itineraries with friends and family via social media
- **Collaborative Planning**: Invite others to collaborate on itinerary planning
- **Real-time Weather Integration**: Display weather forecasts for travel dates
- **Booking Integration**: Direct links to book hotels, activities, and transportation
- **Mobile App**: Native mobile application for iOS and Android
- **Offline Mode**: Full offline functionality for accessing itineraries without internet
- **Multi-language Support**: Support for planning trips in multiple languages
