# 🚌 Bus Tracking App

A real-time bus tracking application built with Node.js, Socket.IO, and Google Maps API.

## Features

- **Real-time Bus Tracking**: Live updates of bus positions every 3 seconds
- **User Location Detection**: GPS-based location detection with fallback
- **Route Planning**: Google Maps integration for optimal route calculation
- **Nearby Bus Search**: Find buses within a specified radius
- **Interactive Dashboard**: Live bus status and information
- **Responsive Design**: Mobile-first design that works on all devices
- **Socket.IO Integration**: Real-time communication between server and clients

## Prerequisites

- Node.js (v16 or higher)
- Google Maps API Key with the following APIs enabled:
  - Maps JavaScript API
  - Places API
  - Directions API
  - Geocoding API

## Setup Instructions

### 1. Create Project Structure

Create the following folder structure in VS Code:

```
bus-tracking-app/
├── server.js
├── package.json
├── .env
├── README.md
└── public/
    ├── index.html
    ├── styles.css
    └── script.js
```

### 2. Copy Files

Copy and paste the provided code into each respective file:

- **server.js**: Main backend server code
- **package.json**: Dependencies and scripts
- **.env**: Environment variables (replace YOUR_API_KEY)
- **public/index.html**: Frontend HTML structure
- **public/styles.css**: All styling and animations
- **public/script.js**: Frontend JavaScript logic

### 3. Install Dependencies

Open terminal in VS Code and run:

```bash
npm install
```

This will install:
- express (web framework)
- socket.io (real-time communication)
- cors (cross-origin resource sharing)
- dotenv (environment variables)
- nodemon (development auto-restart)

### 4. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API
   - Directions API
   - Geocoding API
4. Create credentials (API Key)
5. Copy the API key

### 5. Configure Environment Variables

Edit the `.env` file and replace with your actual API key:

```env
PORT=3000
GOOGLE_MAPS_API_KEY=your_actual_google_maps_api_key_here
NODE_ENV=development
```

### 6. Update HTML File

In `public/index.html`, find this line:

```html
src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&callback=initMap&libraries=geometry,places"
```

Replace `YOUR_API_KEY` with your actual Google Maps API key.

### 7. Run the Application

For development (auto-restart on changes):
```bash
npm run dev
```

For production:
```bash
npm start
```

### 8. Access the App

Open your browser and navigate to:
```
http://localhost:3000
```

## Usage

1. **Find Your Location**: Click "My Location" to detect your current position
2. **Enter Destination**: Type your destination in the input field
3. **Plan Route**: Click "Plan Route" to see the route, time, and distance
4. **Track Buses**: Watch the bus markers move in real-time on the map
5. **Bus Details**: Click any bus marker to see detailed information
6. **Nearby Buses**: Click "Nearby Buses" to find buses near your location

## API Endpoints

### GET /api/buses
Get all buses with their current status and location.

### GET /api/buses/:id
Get specific bus information by ID.

### POST /api/route
Calculate route between origin and destination.

### GET /api/nearby-buses
Find buses near a specific location.

## Socket Events

- `buses-update`: Real-time bus position updates
- `connect`: Client connection established
- `disconnect`: Client disconnected

## Technologies Used

- **Backend**: Node.js, Express.js, Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Maps**: Google Maps JavaScript API
- **Real-time**: Socket.IO for WebSocket communication
- **Styling**: Custom CSS with modern glassmorphism design

## File Structure Explained

- **server.js**: Main backend server with API routes and Socket.IO
- **package.json**: Node.js dependencies and npm scripts
- **.env**: Environment variables (keep this file private)
- **public/index.html**: Main HTML structure and layout
- **public/styles.css**: All CSS styling including responsive design
- **public/script.js**: Frontend JavaScript for map and real-time features

## Troubleshooting

### Common Issues:

1. **Google Maps not loading**: Check your API key and enabled APIs
2. **Buses not updating**: Check browser console for Socket.IO errors
3. **Location not detected**: Allow location permissions in browser
4. **Port already in use**: Change PORT in .env file

### Development Tips:

- Use browser dev tools to debug JavaScript
- Check server logs in terminal for backend issues
- Ensure all files are in correct directory structure
- Test with different browsers for compatibility

## License

This project is licensed under the MIT License.

## Support

If you encounter any issues:
1. Check the browser console for errors
2. Verify all files are copied correctly
3. Ensure Google Maps API key is valid and APIs are enabled
4. Check that all dependencies are installed with `npm install`