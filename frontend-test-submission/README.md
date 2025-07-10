# URL Shortener Frontend

A modern Next.js frontend application for the URL shortener service with user authentication and profile management.

## Features

- **Modern UI**: Built with Next.js 15 and Tailwind CSS
- **User Authentication**: Login and registration with secure cookie-based sessions
- **URL Management**: Create, view, and delete shortened URLs
- **User Dashboard**: Comprehensive dashboard with statistics and URL management
- **Responsive Design**: Works perfectly on desktop and mobile devices
- **Real-time Updates**: Automatic profile refresh after URL operations

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS 4
- **Icons**: React Icons (Feather Icons)
- **HTTP Client**: Axios
- **State Management**: React Context API
- **Cookies**: js-cookie

## Getting Started

### Prerequisites

- Node.js 18+ 
- Backend server running on `http://localhost:5000`

### Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open Browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
app/
├── context/
│   └── AuthContext.js          # Authentication state management
├── services/
│   └── api.js                  # API service functions
├── login/
│   └── page.js                 # Login page
├── register/
│   └── page.js                 # Registration page
├── dashboard/
│   └── page.js                 # Main dashboard
├── layout.js                   # Root layout with AuthProvider
├── page.js                     # Home page (redirects)
└── globals.css                 # Global styles
```

## Pages

### Login Page (`/login`)
- Email and password authentication
- Password visibility toggle
- Error handling and loading states
- Link to registration page

### Registration Page (`/register`)
- User registration with name, email, and password
- Password confirmation validation
- Form validation and error handling
- Link to login page

### Dashboard (`/dashboard`)
- **Statistics Cards**: Total URLs, Total Clicks, Active URLs
- **URL Shortener Form**: Create new shortened URLs with custom options
- **URL Management**: View, copy, and delete existing URLs
- **User Profile**: Display user information and logout functionality

## API Integration

The frontend communicates with the backend through:

- **Authentication**: Login, register, logout, and profile management
- **URL Operations**: Create, view statistics, and delete shortened URLs
- **Cookie Management**: Automatic token handling with HTTP-only cookies

## Features

### Authentication Flow
1. User registers/logs in
2. JWT token stored in HTTP-only cookie
3. Automatic token inclusion in API requests
4. Automatic logout on token expiration

### URL Management
- Create shortened URLs with custom shortcodes
- Set custom expiry times
- View click statistics
- Copy URLs to clipboard
- Delete URLs with confirmation

### User Experience
- Loading states for all operations
- Error handling with user-friendly messages
- Success notifications
- Responsive design for all screen sizes
- Smooth transitions and animations

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Code Style

- Uses ESLint with Next.js configuration
- Tailwind CSS for styling
- React Icons for consistent iconography
- Responsive design patterns

## Deployment

The application can be deployed to Vercel, Netlify, or any other Next.js-compatible hosting platform.

### Environment Variables for Production

```
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## Security Features

- HTTP-only cookies for token storage
- Automatic token refresh
- Secure API communication
- Input validation and sanitization
- XSS protection through proper React practices

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request
