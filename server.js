const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Sample bus data with realistic Mumbai coordinates
let buses = [
    {
        id: 'MH01AB1234',
        route: 'Andheri to Bandra',
        routeNumber: '258',
        lat: 19.1136,
        lng: 72.8697,
        heading: 45,
        speed: 25,
        status: 'active',
        passengers: 28,
        capacity: 50,
        nextStop: 'Versova Metro',
        estimatedArrival: '3 mins',
        driver: 'Rajesh Kumar'
    },
    {
        id: 'MH01CD5678',
        route: 'CST to Borivali',
        routeNumber: '449',
        lat: 19.0760,
        lng: 72.8777,
        heading: 315,
        speed: 30,
        status: 'active',
        passengers: 42,
        capacity: 50,
        nextStop: 'Dadar Station',
        estimatedArrival: '5 mins',
        driver: 'Suresh Patil'
    },
    {
        id: 'MH01EF9012',
        route: 'Colaba to Malad',
        routeNumber: '132',
        lat: 19.0896,
        lng: 72.8656,
        heading: 180,
        speed: 20,
        status: 'active',
        passengers: 35,
        capacity: 45,
        nextStop: 'Bandra Kurla Complex',
        estimatedArrival: '2 mins',
        driver: 'Amit Shah'
    },
    {
        id: 'MH01GH3456',
        route: 'Thane to Churchgate',
        routeNumber: '700',
        lat: 19.1972,
        lng: 72.9722,
        heading: 225,
        speed: 35,
        status: 'active',
        passengers: 18,
        capacity: 50,
        nextStop: 'Mulund Check Naka',
        estimatedArrival: '4 mins',
        driver: 'Prakash Joshi'
    },
    {
        id: 'MH01IJ7890',
        route: 'Vashi to Fort',
        routeNumber: '503',
        lat: 19.0445,
        lng: 73.0072,
        heading: 270,
        speed: 28,
        status: 'maintenance',
        passengers: 0,
        capacity: 50,
        nextStop: 'Service Depot',
        estimatedArrival: 'N/A',
        driver: 'Service Team'
    }
];

// API Routes
app.get('/api/buses', (req, res) => {
    res.json({
        success: true,
        data: buses,
        timestamp: new Date().toISOString()
    });
});

app.get('/api/buses/:id', (req, res) => {
    const bus = buses.find(b => b.id === req.params.id);
    if (bus) {
        res.json({
            success: true,
            data: bus,
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'Bus not found'
        });
    }
});

app.post('/api/route', async (req, res) => {
    try {
        const { origin, destination } = req.body;
        
        // Mock route calculation (in real app, use Google Directions API)
        const mockRoute = {
            distance: {
                text: `${(Math.random() * 15 + 2).toFixed(1)} km`,
                value: Math.floor(Math.random() * 15000 + 2000)
            },
            duration: {
                text: `${Math.floor(Math.random() * 45 + 15)} mins`,
                value: Math.floor(Math.random() * 2700 + 900)
            },
            start_location: origin,
            end_location: destination,
            polyline: generateMockPolyline(origin, destination)
        };
        
        res.json({
            success: true,
            data: mockRoute,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Route calculation failed',
            error: error.message
        });
    }
});

app.get('/api/nearby-buses', (req, res) => {
    const { lat, lng, radius = 5 } = req.query;
    
    if (!lat || !lng) {
        return res.status(400).json({
            success: false,
            message: 'Latitude and longitude are required'
        });
    }
    
    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);
    
    const nearbyBuses = buses
        .filter(bus => {
            const distance = calculateDistance(userLat, userLng, bus.lat, bus.lng);
            return distance <= searchRadius && bus.status === 'active';
        })
        .map(bus => ({
            ...bus,
            distance: calculateDistance(userLat, userLng, bus.lat, bus.lng).toFixed(2)
        }))
        .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance));
    
    res.json({
        success: true,
        data: nearbyBuses,
        timestamp: new Date().toISOString()
    });
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// Generate mock polyline for route
function generateMockPolyline(origin, destination) {
    return 'u{~vFvyys@fS]';
}

// Socket.IO for real-time updates
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Send initial bus data
    socket.emit('buses-update', buses);
    
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Simulate real-time bus movement
setInterval(() => {
    buses.forEach(bus => {
        if (bus.status === 'active') {
            // Simulate realistic bus movement
            const moveDistance = 0.001; // ~100 meters
            const randomFactor = (Math.random() - 0.5) * 0.5;
            
            // Move based on heading
            const headingRad = bus.heading * Math.PI / 180;
            bus.lat += Math.cos(headingRad) * moveDistance + randomFactor * 0.0001;
            bus.lng += Math.sin(headingRad) * moveDistance + randomFactor * 0.0001;
            
            // Occasionally change heading slightly
            if (Math.random() > 0.8) {
                bus.heading += (Math.random() - 0.5) * 30;
                bus.heading = (bus.heading + 360) % 360;
            }
            
            // Simulate speed variations
            bus.speed = Math.max(0, Math.min(50, bus.speed + (Math.random() - 0.5) * 10));
            
            // Simulate passenger changes
            if (Math.random() > 0.7) {
                const change = Math.floor((Math.random() - 0.3) * 8);
                bus.passengers = Math.max(0, Math.min(bus.capacity, bus.passengers + change));
            }
        }
    });
    
    // Emit updated bus positions to all connected clients
    io.emit('buses-update', buses);
}, 3000); // Update every 3 seconds

// Serve the HTML file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`🚌 Bus Tracking Server running on port ${PORT}`);
    console.log(`📍 Visit http://localhost:${PORT} to view the app`);
});