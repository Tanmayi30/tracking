// Select a recommended route and show detailed path
window.selectRecommendedRoute = function(index) {
    if (!window.currentRecommendations || !window.currentRecommendations[index]) {
        console.error('No recommendation found at index:', index);
        return;
    }
    
    const recommendation = window.currentRecommendations[index];
    const bus = recommendation.bus;
    
    // Close modal
    closeModal();
    
    // Show walking route to pickup stop
    const directionsRequest = {
        origin: userLocation,
        destination: { lat: recommendation.pickupStop.lat, lng: recommendation.pickupStop.lng },
        travelMode: google.maps.TravelMode.WALKING
    };
    
    directionsService.route(directionsRequest, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        } else {
            console.error('Walking directions failed:', status);
        }
    });
    
    // Show bus route
    showBusRoute(bus.id);
    
    // Add pickup and drop markers
    const pickupMarker = new google.maps.Marker({
        position: { lat: recommendation.pickupStop.lat, lng: recommendation.pickupStop.lng },
        map: map,
        title: `Pickup: ${recommendation.pickupStop.name}`,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="#28a745" stroke="white" stroke-width="3"/>
                    <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white">P</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15)
        }
    });
    
    const dropMarker = new google.maps.Marker({
        position: { lat: recommendation.dropStop.lat, lng: recommendation.dropStop.lng },
        map: map,
        title: `Drop: ${recommendation.dropStop.name}`,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="#dc3545" stroke="white" stroke-width="3"/>
                    <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white">D</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30),
            anchor: new google.maps.Point(15, 15)
        }
    });
    
    // Add info windows
    const pickupInfo = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="color: #28a745; margin: 0 0 5px 0;">🚶‍♂️ Pickup Point</h4>
                <p><strong>${recommendation.pickupStop.name}</strong></p>
                <p>Walk ${recommendation.walkToPickup} km from your location</p>
                <p>Estimated walking time: ${Math.ceil(parseFloat(recommendation.walkToPickup) * 12)} minutes</p>
            </div>
        `
    });
    
    const dropInfo = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="color: #dc3545; margin: 0 0 5px 0;">🎯 Drop Point</h4>
                <p><strong>${recommendation.dropStop.name}</strong></p>
                <p>Walk ${recommendation.walkFromDrop} km to destination</p>
                <p>Estimated walking time: ${Math.ceil(parseFloat(recommendation.walkFromDrop) * 12)} minutes</p>
            </div>
        `
    });
    
    pickupMarker.addListener('click', () => pickupInfo.open(map, pickupMarker));
    dropMarker.addListener('click', () => dropInfo.open(map, dropMarker));
    
    busRoutePolylines.push(pickupMarker, dropMarker);
    
    // Show summary alert with journey details
    const totalWalkTime = Math.ceil(parseFloat(recommendation.walkToPickup) * 12) + Math.ceil(parseFloat(recommendation.walkFromDrop) * 12);
    alert(`✅ Selected Route: Bus ${bus.routeNumber}\n\n` +
          `📍 Pickup: ${recommendation.pickupStop.name}\n` +
          `🎯 Drop: ${recommendation.dropStop.name}\n\n` +
          `⏱️ Total Journey Time: ${recommendation.estimatedTotalTime} minutes\n` +
          `🚌 Bus Journey: ${recommendation.busJourneyTime} minutes\n` +
          `🚶‍♂️ Walking Time: ${totalWalkTime} minutes\n\n` +
          `Check the map for pickup (P) and drop (D) points!`);
};

// Show detailed bus route with all stops
async function showBusRoute(busId) {
    try {
        const response = await fetch(`/api/bus/${busId}/route`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            const { busInfo, routeStops } = result.data;
            selectedBus = busInfo;
            
            // Clear existing route polylines
            busRoutePolylines.forEach(polyline => polyline.setMap(null));
            busRoutePolylines = [];
            
            // Create route path
            const routePath = routeStops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
            
            const routePolyline = new google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: '#ff6b6b',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map
            });
            
            busRoutePolylines.push(routePolyline);
            
            // Add markers for each stop
            routeStops.forEach((stop, index) => {
                const stopMarker = new google.maps.Marker({
                    position: { lat: stop.lat, lng: stop.lng },
                    map: map,
                    title: stop.name,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12.5" cy="12.5" r="10" fill="#ff6b6b" stroke="white" stroke-width="2"/>
                                <text x="12.5" y="17" font-family="Arial" font-size="10" text-anchor="middle" fill="white">${index + 1}</text>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(12.5, 12.5)
                    }
                });
                
                const stopInfoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50;">Stop ${index + 1}: ${stop.name}</h4>
                            <p><strong>Arrival Time:</strong> ${stop.arrivalTime}</p>
                            <p><strong>Bus:</strong> ${busInfo.routeNumber} - ${busInfo.route}</p>
                        </div>
                    `
                });
                
                stopMarker.addListener('click', () => {
                    stopInfoWindow.open(map, stopMarker);
                });
                
                busRoutePolylines.push(stopMarker);
            });
            
            // Fit map to show entire route
            const bounds = new google.maps.LatLngBounds();
            routeStops.forEach(stop => bounds.extend({ lat: stop.lat, lng: stop.lng }));
            map.fitBounds(bounds);
            
            // Update info panel
            showRouteDetails(result.data);
            
        } else {
            throw new Error(result.message || 'Failed to fetch bus route');
        }
    } catch (error) {
        console.error('Error loading bus route:', error);
        alert('Error loading bus route details: ' + error.message);
    }
}

// Show route details in info panel
function showRouteDetails(routeData) {
    const { busInfo, routeStops, totalStops, estimatedJourneyTime } = routeData;
    
    // Create route details modal
    const modal = document.createElement('div');
    modal.id = 'busRouteModal';
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 500px;
        max-height: 70vh;
        overflow-y: auto;
        width: 90%;
    `;
    
    let stopsHtml = '';
    routeStops.forEach((stop, index) => {
        stopsHtml += `
            <div style="display: flex; align-items: center; margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 8px;">
                <div style="background: #4ecdc4; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px; font-weight: bold;">
                    ${index + 1}
                </div>
                <div style="flex: 1;">
                    <strong>${stop.name}</strong><br>
                    <small style="color: #666;">Arrival: ${stop.arrivalTime}</small>
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin: 0;">🚌 Bus ${busInfo.routeNumber} Route Details</h3>
            <button onclick="closeBusRouteModal()" style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
        </div>
        <div style="margin-bottom: 15px;">
            <p><strong>Route:</strong> ${busInfo.route}</p>
            <p><strong>Total Stops:</strong> ${totalStops}</p>
            <p><strong>Journey Time:</strong> ${estimatedJourneyTime}</p>
            <p><strong>Current Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
        </div>
        <h4 style="color: #2c3e50; margin: 15px 0 10px 0;">All Stops:</h4>
        <div style="max-height: 300px; overflow-y: auto;">
            ${stopsHtml}
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="clearBusRoute()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-right: 10px; cursor: pointer;">Clear Route</button>
            <button onclick="closeBusRouteModal()" style="background: #4ecdc4; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'busRouteBackdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    backdrop.onclick = closeBusRouteModal;
    document.body.insertBefore(backdrop, modal);
}

// Close bus route modal
function closeBusRouteModal() {
    const modal = document.getElementById('busRouteModal');
    const backdrop = document.getElementById('busRouteBackdrop');
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
}

// Clear bus route from map
function clearBusRoute() {
    busRoutePolylines.forEach(polyline => polyline.setMap(null));
    busRoutePolylines = [];
    selectedBus = null;
    closeBusRouteModal();
}// Enhanced plan route with bus recommendations
async function planRoute() {
    const destination = document.getElementById('destination').value.trim();
    
    if (!destination) {
        alert('Please enter a destination.');
        return;
    }
    
    if (!userLocation) {
        alert('Please find your location first by clicking "My Location".');
        return;
    }
    
    try {
        // Use Google Places API to geocode destination
        const geocoder = new google.maps.Geocoder();
        
        // Show loading indicator
        document.getElementById('estimatedTime').textContent = 'Calculating route...';
        document.getElementById('routeDistance').textContent = 'Please wait...';
        
        const results = await new Promise((resolve, reject) => {
            geocoder.geocode(
                { 
                    address: destination + ', Mumbai, India',
                    bounds: new google.maps.LatLngBounds(
                        new google.maps.LatLng(18.8, 72.6),
                        new google.maps.LatLng(19.4, 73.2)
                    )
                },
                (results, status) => {
                    if (status === 'OK' && results.length > 0) {
                        resolve(results);
                    } else {
                        reject(new Error(`Geocoding failed: ${status}`));
                    }
                }
            );
        });
        
        destinationLocation = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
        };
        
        console.log('Destination found:', destinationLocation);
        
        // Remove existing destination marker
        if (destinationMarker) {
            destinationMarker.setMap(null);
        }
        
        // Add destination marker
        destinationMarker = new google.maps.Marker({
            position: destinationLocation,
            map: map,
            title: destination,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="17.5" cy="17.5" r="15" fill="#764ba2" stroke="white" stroke-width="3"/>
                        <text x="17.5" y="25" font-family="Arial" font-size="18" text-anchor="middle" fill="white">🎯</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(35, 35),
                anchor: new google.maps.Point(17.5, 17.5)
            }
        });
        
        // Get bus route recommendations
        try {
            const recommendResponse = await fetch('/api/recommend-routes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userLocation: userLocation,
                    destination: destinationLocation
                })
            });
            
            if (!recommendResponse.ok) {
                throw new Error(`HTTP error! status: ${recommendResponse.status}`);
            }
            
            const recommendations = await recommendResponse.json();
            console.log('Recommendations received:', recommendations);
            
            if (recommendations.success && recommendations.data && recommendations.data.length > 0) {
                showRouteRecommendations(recommendations.data, destination);
            } else {
                console.log('No bus recommendations found, using Google Directions');
                calculateGoogleDirections(destination);
            }
        } catch (fetchError) {
            console.error('Error fetching recommendations:', fetchError);
            calculateGoogleDirections(destination);
        }
        
        // Update UI
        document.getElementById('destinationDisplay').textContent = destination;
        
        // Fit map to show both user location and destination
        const bounds = new google.maps.LatLngBounds();
        bounds.extend(userLocation);
        bounds.extend(destinationLocation);
        map.fitBounds(bounds);
        
    } catch (error) {
        console.error('Route planning error:', error);
        document.getElementById('estimatedTime').textContent = 'Error calculating route';
        document.getElementById('routeDistance').textContent = 'Please try again';
        alert('Error planning route: ' + error.message + '\nPlease check your destination and try again.');
    }
}

// Show route recommendations in a detailed modal
function showRouteRecommendations(recommendations, destinationName) {
    // Clear any existing directions
    directionsRenderer.setDirections({routes: []});
    
    // Create recommendations modal
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 600px;
        max-height: 80vh;
        overflow-y: auto;
        width: 90%;
    `;
    
    let recommendationsHtml = '';
    recommendations.forEach((rec, index) => {
        const bus = rec.bus;
        recommendationsHtml += `
            <div style="border: 2px solid #e8f4f8; border-radius: 12px; padding: 20px; margin: 15px 0; background: linear-gradient(135deg, #f8fbff, #f0f8ff); cursor: pointer; transition: all 0.3s ease;" 
                 onclick="selectRecommendedRoute(${index})" onmouseover="this.style.borderColor='#4ecdc4'" onmouseout="this.style.borderColor='#e8f4f8'">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <h4 style="color: #2c3e50; margin: 0;">🚌 Bus ${bus.routeNumber} - ${bus.id}</h4>
                    <span style="background: #28a745; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem; font-weight: bold;">
                        ${rec.estimatedTotalTime} min
                    </span>
                </div>
                <div style="margin-bottom: 10px;">
                    <strong style="color: #4ecdc4;">Route:</strong> ${bus.route}
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
                    <div><strong>Pickup:</strong> ${rec.pickupStop.name}</div>
                    <div><strong>Drop:</strong> ${rec.dropStop.name}</div>
                    <div><strong>Walk to bus:</strong> ${rec.walkToPickup} km</div>
                    <div><strong>Walk from bus:</strong> ${rec.walkFromDrop} km</div>
                    <div><strong>Bus time:</strong> ${rec.busJourneyTime} min</div>
                    <div><strong>Stops:</strong> ${rec.stopsCount} stops</div>
                </div>
                <div style="margin-top: 15px; padding: 10px; background: rgba(78, 205, 196, 0.1); border-radius: 8px;">
                    <strong style="color: #2c3e50;">💡 ${rec.recommendation}</strong>
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px;">
            <h3 style="color: #2c3e50; margin: 0;">🎯 Route Recommendations to ${destinationName}</h3>
            <button onclick="closeModal()" 
                    style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 18px;">×</button>
        </div>
        <div style="margin-bottom: 20px; padding: 15px; background: #e3f2fd; border-radius: 10px; border-left: 5px solid #2196f3;">
            <strong>📍 From your location to ${destinationName}</strong><br>
            <small>Click on any route below to see detailed directions and bus stops</small>
        </div>
        ${recommendationsHtml}
        <div style="margin-top: 25px; text-align: center;">
            <button onclick="calculateGoogleDirections('${destinationName}')" 
                    style="background: #6c757d; color: white; border: none; padding: 12px 24px; border-radius: 8px; margin-right: 15px; cursor: pointer;">
                Show Alternative Routes
            </button>
            <button onclick="closeModal()" 
                    style="background: #4ecdc4; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                Close
            </button>
        </div>
    `;
    
    // Add modal to page
    modal.id = 'routeModal';
    document.body.appendChild(modal);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'modalBackdrop';
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    backdrop.onclick = closeModal;
    document.body.insertBefore(backdrop, modal);
    
    // Store recommendations globally for selection
    window.currentRecommendations = recommendations;
    
    // Update time display with best recommendation
    const bestRoute = recommendations[0];
    document.getElementById('estimatedTime').textContent = `${bestRoute.estimatedTotalTime} minutes (Bus ${bestRoute.bus.routeNumber})`;
    document.getElementById('routeDistance').textContent = `Walk: ${(parseFloat(bestRoute.walkToPickup) + parseFloat(bestRoute.walkFromDrop)).toFixed(1)} km`;
}

// Close modal function
function closeModal() {
    const modal = document.getElementById('routeModal');
    const backdrop = document.getElementById('modalBackdrop');
    if (modal) modal.remove();
    if (backdrop) backdrop.remove();
}

// Select a recommended route and show detailed path
window.selectRecommendedRoute = function(index) {
    const recommendation = window.currentRecommendations[index];
    const bus = recommendation.bus;
    
    // Close modal
    const modals = document.querySelectorAll('div[style*="z-index: 10000"]');
    const backdrops = document.querySelectorAll('div[style*="z-index: 9999"]');
    modals.forEach(modal => modal.remove());
    backdrops.forEach(backdrop => backdrop.remove());
    
    // Show walking route to pickup stop
    const directionsRequest = {
        origin: userLocation,
        destination: { lat: recommendation.pickupStop.lat, lng: recommendation.pickupStop.lng },
        travelMode: google.maps.TravelMode.WALKING
    };
    
    directionsService.route(directionsRequest, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
        }
    });
    
    // Show bus route
    showBusRoute(bus.id);
    
    // Add pickup and drop markers
    const pickupMarker = new google.maps.Marker({
        position: { lat: recommendation.pickupStop.lat, lng: recommendation.pickupStop.lng },
        map: map,
        title: `Pickup: ${recommendation.pickupStop.name}`,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="#28a745" stroke="white" stroke-width="3"/>
                    <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white">P</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30)
        }
    });
    
    const dropMarker = new google.maps.Marker({
        position: { lat: recommendation.dropStop.lat, lng: recommendation.dropStop.lng },
        map: map,
        title: `Drop: ${recommendation.dropStop.name}`,
        icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="15" cy="15" r="12" fill="#dc3545" stroke="white" stroke-width="3"/>
                    <text x="15" y="20" font-family="Arial" font-size="14" text-anchor="middle" fill="white">D</text>
                </svg>
            `),
            scaledSize: new google.maps.Size(30, 30)
        }
    });
    
    // Add info windows
    const pickupInfo = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="color: #28a745; margin: 0 0 5px 0;">🚶‍♂️ Pickup Point</h4>
                <p><strong>${recommendation.pickupStop.name}</strong></p>
                <p>Walk ${recommendation.walkToPickup} km from your location</p>
                <p>Estimated walking time: ${Math.ceil(parseFloat(recommendation.walkToPickup) * 12)} minutes</p>
            </div>
        `
    });
    
    const dropInfo = new google.maps.InfoWindow({
        content: `
            <div style="padding: 10px;">
                <h4 style="color: #dc3545; margin: 0 0 5px 0;">🎯 Drop Point</h4>
                <p><strong>${recommendation.dropStop.name}</strong></p>
                <p>Walk ${recommendation.walkFromDrop} km to destination</p>
                <p>Estimated walking time: ${Math.ceil(parseFloat(recommendation.walkFromDrop) * 12)} minutes</p>
            </div>
        `
    });
    
    pickupMarker.addListener('click', () => pickupInfo.open(map, pickupMarker));
    dropMarker.addListener('click', () => dropInfo.open(map, dropMarker));
    
    busRoutePolylines.push(pickupMarker, dropMarker);
    
    // Show summary
    alert(`Selected Route: Bus ${bus.routeNumber}\n` +
          `Total Journey Time: ${recommendation.estimatedTotalTime} minutes\n` +
          `Pickup: ${recommendation.pickupStop.name}\n` +
          `Drop: ${recommendation.dropStop.name}\n` +
          `Bus Journey: ${recommendation.busJourneyTime} minutes`);
};

// Fallback Google Directions calculation
function calculateGoogleDirections(destination) {
    if (!userLocation || !destinationLocation) {
        console.error('Missing location data for directions');
        return;
    }
    
    const directionsRequest = {
        origin: userLocation,
        destination: destinationLocation,
        travelMode: google.maps.TravelMode.TRANSIT,
        transitOptions: {
            modes: [google.maps.TransitMode.BUS],
            routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
        }
    };
    
    directionsService.route(directionsRequest, (result, status) => {
        if (status === 'OK') {
            directionsRenderer.setDirections(result);
            
            const route = result.routes[0];
            const leg = route.legs[0];
            
            document.getElementById('estimatedTime').textContent = leg.duration.text;
            document.getElementById('routeDistance').textContent = leg.distance.text;
            
            // Show route details
            showGoogleRouteDetails(result);
        } else {
            console.log('Transit directions failed, trying driving:', status);
            // Fallback to driving directions if transit not available
            directionsRequest.travelMode = google.maps.TravelMode.DRIVING;
            directionsService.route(directionsRequest, (result, status) => {
                if (status === 'OK') {
                    directionsRenderer.setDirections(result);
                    const route = result.routes[0];
                    const leg = route.legs[0];
                    
                    document.getElementById('estimatedTime').textContent = 
                        `${leg.duration.text} (by car)`;
                    document.getElementById('routeDistance').textContent = leg.distance.text;
                } else {
                    console.error('All directions failed:', status);
                    document.getElementById('estimatedTime').textContent = 'Route calculation failed';
                    document.getElementById('routeDistance').textContent = 'Please try different destination';
                }
            });
        }
    });
}

// Show Google route details
function showGoogleRouteDetails(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    let details = `
        <div style="max-width: 400px; padding: 15px;">
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">🚌 Route Details</h3>
            <p><strong>Distance:</strong> ${leg.distance.text}</p>
            <p><strong>Duration:</strong> ${leg.duration.text}</p>
    `;
    
    if (leg.steps && leg.steps.length > 0) {
        details += '<h4 style="margin: 15px 0 10px 0;">Steps:</h4><ul>';
        leg.steps.forEach((step, index) => {
            if (step.transit) {
                const vehicle = step.transit.line.vehicle.type || 'Transit';
                const lineName = step.transit.line.short_name || step.transit.line.name || 'Unknown Line';
                const departure = step.transit.departure_stop.name || 'Unknown Stop';
                const arrival = step.transit.arrival_stop.name || 'Unknown Stop';
                
                details += `
                    <li style="margin: 8px 0; padding: 5px; background: #f0f8ff; border-radius: 5px;">
                        <strong>${vehicle}:</strong> ${lineName}<br>
                        <small>From: ${departure}</small><br>
                        <small>To: ${arrival}</small><br>
                        <small>Duration: ${step.duration.text}</small>
                    </li>
                `;
            } else {
                // Walking or other instructions
                const instruction = step.instructions.replace(/<[^>]*>/g, ''); // Remove HTML tags
                details += `
                    <li style="margin: 8px 0; padding: 5px; background: #fff8e1; border-radius: 5px;">
                        <strong>Walk:</strong> ${instruction}<br>
                        <small>Duration: ${step.duration.text} (${step.distance.text})</small>
                    </li>
                `;
            }
        });
        details += '</ul>';
    }
    
    details += '</div>';
    
    // Create info window at route midpoint
    const midPoint = route.overview_path[Math.floor(route.overview_path.length / 2)];
    const infoWindow = new google.maps.InfoWindow({
        content: details,
        position: midPoint
    });
    
    // Show info window after a short delay
    setTimeout(() => {
        infoWindow.open(map);
    }, 1000);
}

// Update bus dashboard with enhanced information
function updateBusDashboard(buses) {
    const busGrid = document.getElementById('busGrid');
    busGrid.innerHTML = '';

    buses.forEach(bus => {
        const busCard = document.createElement('div');
        busCard.className = 'bus-card';
        busCard.innerHTML = `
            <div class="bus-header">
                <div class="bus-id">${bus.routeNumber} - ${bus.id}</div>
                <div class="bus-status status-${bus.status}">
                    <span class="status-indicator indicator-${bus.status}"></span>
                    ${bus.status}
                </div>
            </div>
            <div class="bus-info">
                <div><strong>Route:</strong> <span>${bus.route}</span></div>
                <div><strong>Speed:</strong> <span>${Math.round(bus.speed)} km/h</span></div>
                <div><strong>Next Stop:</strong> <span>${bus.nextStop}</span></div>
                <div><strong>ETA:</strong> <span>${bus.estimatedArrival}</span></div>
                <div><strong>Passengers:</strong> <span>${bus.passengers}/${bus.capacity}</span></div>
                <div><strong>Driver:</strong> <span>${bus.driver}</span></div>
            </div>
            <div style="margin-top: 15px; text-align: center;">
                <button onclick="showBusRoute('${bus.id}')" style="background: #4ecdc4; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.9rem; font-weight: 600;">
                    View Route & Stops
                </button>
            </div>
        `;
        
        busCard.addEventListener('click', (e) => {
            if (e.target.tagName !== 'BUTTON') {
                if (bus.status === 'active') {
                    map.setCenter({ lat: bus.lat, lng: bus.lng });
                    map.setZoom(16);
                    
                    // Find and open the corresponding marker
                    const marker = busMarkers.find(m => 
                        Math.abs(m.getPosition().lat() - bus.lat) < 0.001 &&
                        Math.abs(m.getPosition().lng() - bus.lng) < 0.001
                    );
                    if (marker) {
                        google.maps.event.trigger(marker, 'click');
                    }
                }
            }
        });
        
        busGrid.appendChild(busCard);
    });
}

// Enhanced find nearby buses
async function findNearbyBuses() {
    if (!userLocation) {
        alert('Please find your location first by clicking "My Location".');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/nearby-buses?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=3`
        );
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const nearbyBuses = result.data;
            
            // Create nearby buses modal
            const modal = document.createElement('div');
            modal.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 25px;
                border-radius: 15px;
                box-shadow: 0 20px 50px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                width: 90%;
            `;
            
            let busesHtml = '';
            nearbyBuses.forEach((bus, index) => {
                busesHtml += `
                    <div style="border: 2px solid #e8f4f8; border-radius: 12px; padding: 20px; margin: 15px 0; background: linear-gradient(135deg, #f8fbff, #f0f8ff); cursor: pointer;" 
                         onclick="showBusRoute('${bus.id}'); document.body.removeChild(document.body.lastElementChild); document.body.removeChild(document.body.lastElementChild);">
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <h4 style="color: #2c3e50; margin: 0;">🚌 Bus ${bus.routeNumber}</h4>
                            <span style="background: #4ecdc4; color: white; padding: 4px 12px; border-radius: 20px; font-size: 0.85rem;">
                                ${bus.distance} km away
                            </span>
                        </div>
                        <div style="margin-bottom: 10px;">
                            <strong>Route:</strong> ${bus.route}
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 0.9rem;">
                            <div><strong>Next Stop:</strong> ${bus.nextStop}</div>
                            <div><strong>ETA:</strong> ${bus.estimatedArrival}</div>
                            <div><strong>Passengers:</strong> ${bus.passengers}/${bus.capacity}</div>
                            <div><strong>Speed:</strong> ${Math.round(bus.speed)} km/h</div>
                        </div>
                    </div>
                `;
            });
            
            modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h3 style="color: #2c3e50; margin: 0;">🚌 Nearby Buses (${nearbyBuses.length} found)</h3>
                    <button onclick="this.parentElement.parentElement.remove(); document.body.removeChild(document.body.lastElementChild)" 
                            style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 35px; height: 35px; cursor: pointer; font-size: 18px;">×</button>
                </div>
                <div style="margin-bottom: 20px; padding: 15px; background: #e8f5e8; border-radius: 10px;">
                    <strong>📍 Within 3km of your location</strong><br>
                    <small>Click on any bus to see its route and stops</small>
                </div>
                ${busesHtml}
                <div style="margin-top: 20px; text-align: center;">
                    <button onclick="this.parentElement.parentElement.remove(); document.body.removeChild(document.body.lastElementChild)" 
                            style="background: #4ecdc4; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer;">
                        Close
                    </button>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Add backdrop
            const backdrop = document.createElement('div');
            backdrop.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                z-index: 9999;
            `;
            document.body.appendChild(backdrop);
            
            // Highlight nearest bus on map
            const nearestBus = nearbyBuses[0];
            const nearestMarker = busMarkers.find(marker => 
                Math.abs(marker.getPosition().lat() - nearestBus.lat) < 0.001 &&
                Math.abs(marker.getPosition().lng() - nearestBus.lng) < 0.001
            );
            
            if (nearestMarker) {
                map.setCenter(nearestMarker.getPosition());
                map.setZoom(15);
            }
        } else {
            alert('No buses found nearby. Try increasing the search radius or check back later.');
        }
    } catch (error) {
        console.error('Error finding nearby buses:', error);
        alert('Error finding nearby buses. Please try again.');
    }
}let map;
let userMarker;
let destinationMarker;
let busMarkers = [];
let busRoutePolylines = [];
let directionsService;
let directionsRenderer;
let userLocation = null;
let destinationLocation = null;
let socket;
let trafficLayer;
let isTrafficVisible = false;
let mapType = 'roadmap';
let selectedBus = null;

// Initialize socket connection
function initSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('buses-update', (buses) => {
        updateBusMarkers(buses);
        updateBusDashboard(buses);
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
}

// Initialize Google Map
function initMap() {
    // Mumbai coordinates
    const mumbai = { lat: 19.0760, lng: 72.8777 };
    
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: mumbai,
        styles: [
            {
                featureType: 'water',
                elementType: 'geometry',
                stylers: [{ color: '#4ecdc4' }]
            },
            {
                featureType: 'road',
                elementType: 'geometry',
                stylers: [{ color: '#ffffff' }]
            }
        ],
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true
    });

    directionsService = new google.maps.DirectionsService();
    directionsRenderer = new google.maps.DirectionsRenderer({
        suppressMarkers: false,
        polylineOptions: {
            strokeColor: '#4ecdc4',
            strokeWeight: 5,
            strokeOpacity: 0.8
        }
    });
    directionsRenderer.setMap(map);

    trafficLayer = new google.maps.TrafficLayer();

    // Initialize socket connection
    initSocket();
    
    // Load initial bus data
    loadBusData();
}

// Load bus data from API
async function loadBusData() {
    try {
        const response = await fetch('/api/buses');
        const result = await response.json();
        
        if (result.success) {
            updateBusMarkers(result.data);
            updateBusDashboard(result.data);
        }
    } catch (error) {
        console.error('Error loading bus data:', error);
    }
}

// Update bus markers on map
function updateBusMarkers(buses) {
    // Clear existing markers
    busMarkers.forEach(marker => marker.setMap(null));
    busMarkers = [];

    // Add new markers
    buses.forEach(bus => {
        if (bus.status === 'active') {
            const marker = new google.maps.Marker({
                position: { lat: bus.lat, lng: bus.lng },
                map: map,
                title: `Bus ${bus.id}`,
                icon: {
                    url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                        <svg width="40" height="40" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="20" cy="20" r="18" fill="#4ecdc4" stroke="#2c3e50" stroke-width="2"/>
                            <text x="20" y="28" font-family="Arial" font-size="20" text-anchor="middle" fill="white">🚌</text>
                        </svg>
                    `),
                    scaledSize: new google.maps.Size(40, 40),
                    anchor: new google.maps.Point(20, 20)
                }
            });

            const infoWindow = new google.maps.InfoWindow({
                content: `
                    <div style="padding: 15px; min-width: 250px;">
                        <h4 style="margin: 0 0 10px 0; color: #2c3e50;">🚌 ${bus.routeNumber} - ${bus.id}</h4>
                        <p style="margin: 5px 0;"><strong>Route:</strong> ${bus.route}</p>
                        <p style="margin: 5px 0;"><strong>Next Stop:</strong> ${bus.nextStop}</p>
                        <p style="margin: 5px 0;"><strong>ETA:</strong> ${bus.estimatedArrival}</p>
                        <p style="margin: 5px 0;"><strong>Passengers:</strong> ${bus.passengers}/${bus.capacity}</p>
                        <p style="margin: 5px 0;"><strong>Speed:</strong> ${Math.round(bus.speed)} km/h</p>
                        <p style="margin: 5px 0;"><strong>Driver:</strong> ${bus.driver}</p>
                        <div style="margin-top: 10px;">
                            <button onclick="showBusRoute('${bus.id}')" style="background: #4ecdc4; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                Show Route & Stops
                            </button>
                        </div>
                        <div style="margin-top: 10px; padding: 5px; background: #f0f8ff; border-radius: 5px; text-align: center;">
                            <strong style="color: #4ecdc4;">Live Tracking Active</strong>
                        </div>
                    </div>
                `
            });

            marker.addListener('click', () => {
                infoWindow.open(map, marker);
            });

            busMarkers.push(marker);
        }
    });
}

// Show detailed bus route with all stops
async function showBusRoute(busId) {
    try {
        const response = await fetch(`/api/bus/${busId}/route`);
        const result = await response.json();
        
        if (result.success) {
            const { busInfo, routeStops } = result.data;
            selectedBus = busInfo;
            
            // Clear existing route polylines
            busRoutePolylines.forEach(polyline => polyline.setMap(null));
            busRoutePolylines = [];
            
            // Create route path
            const routePath = routeStops.map(stop => ({ lat: stop.lat, lng: stop.lng }));
            
            const routePolyline = new google.maps.Polyline({
                path: routePath,
                geodesic: true,
                strokeColor: '#ff6b6b',
                strokeOpacity: 1.0,
                strokeWeight: 4,
                map: map
            });
            
            busRoutePolylines.push(routePolyline);
            
            // Add markers for each stop
            routeStops.forEach((stop, index) => {
                const stopMarker = new google.maps.Marker({
                    position: { lat: stop.lat, lng: stop.lng },
                    map: map,
                    title: stop.name,
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="25" height="25" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="12.5" cy="12.5" r="10" fill="#ff6b6b" stroke="white" stroke-width="2"/>
                                <text x="12.5" y="17" font-family="Arial" font-size="12" text-anchor="middle" fill="white">${index + 1}</text>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(25, 25),
                        anchor: new google.maps.Point(12.5, 12.5)
                    }
                });
                
                const stopInfoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h4 style="margin: 0 0 5px 0; color: #2c3e50;">Stop ${index + 1}: ${stop.name}</h4>
                            <p><strong>Arrival Time:</strong> ${stop.arrivalTime}</p>
                            <p><strong>Bus:</strong> ${busInfo.routeNumber} - ${busInfo.route}</p>
                        </div>
                    `
                });
                
                stopMarker.addListener('click', () => {
                    stopInfoWindow.open(map, stopMarker);
                });
                
                busRoutePolylines.push(stopMarker);
            });
            
            // Fit map to show entire route
            const bounds = new google.maps.LatLngBounds();
            routeStops.forEach(stop => bounds.extend({ lat: stop.lat, lng: stop.lng }));
            map.fitBounds(bounds);
            
            // Update info panel
            showRouteDetails(result.data);
            
        }
    } catch (error) {
        console.error('Error loading bus route:', error);
        alert('Error loading bus route details.');
    }
}

// Show route details in info panel
function showRouteDetails(routeData) {
    const { busInfo, routeStops, totalStops, estimatedJourneyTime } = routeData;
    
    // Create route details modal/panel
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        padding: 25px;
        border-radius: 15px;
        box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        z-index: 10000;
        max-width: 500px;
        max-height: 70vh;
        overflow-y: auto;
        width: 90%;
    `;
    
    let stopsHtml = '';
    routeStops.forEach((stop, index) => {
        stopsHtml += `
            <div style="display: flex; align-items: center; margin: 10px 0; padding: 8px; background: #f8f9fa; border-radius: 8px;">
                <div style="background: #4ecdc4; color: white; border-radius: 50%; width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; margin-right: 10px; font-size: 12px; font-weight: bold;">
                    ${index + 1}
                </div>
                <div style="flex: 1;">
                    <strong>${stop.name}</strong><br>
                    <small style="color: #666;">Arrival: ${stop.arrivalTime}</small>
                </div>
            </div>
        `;
    });
    
    modal.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h3 style="color: #2c3e50; margin: 0;">🚌 Bus ${busInfo.routeNumber} Route Details</h3>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #ff6b6b; color: white; border: none; border-radius: 50%; width: 30px; height: 30px; cursor: pointer;">×</button>
        </div>
        <div style="margin-bottom: 15px;">
            <p><strong>Route:</strong> ${busInfo.route}</p>
            <p><strong>Total Stops:</strong> ${totalStops}</p>
            <p><strong>Journey Time:</strong> ${estimatedJourneyTime}</p>
            <p><strong>Current Status:</strong> <span style="color: #28a745; font-weight: bold;">Active</span></p>
        </div>
        <h4 style="color: #2c3e50; margin: 15px 0 10px 0;">All Stops:</h4>
        <div style="max-height: 300px; overflow-y: auto;">
            ${stopsHtml}
        </div>
        <div style="margin-top: 20px; text-align: center;">
            <button onclick="clearBusRoute()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; margin-right: 10px; cursor: pointer;">Clear Route</button>
            <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #4ecdc4; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add backdrop
    const backdrop = document.createElement('div');
    backdrop.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.5);
        z-index: 9999;
    `;
    backdrop.onclick = () => {
        document.body.removeChild(backdrop);
        document.body.removeChild(modal);
    };
    document.body.insertBefore(backdrop, modal);
}

// Clear bus route from map
function clearBusRoute() {
    busRoutePolylines.forEach(polyline => polyline.setMap(null));
    busRoutePolylines = [];
    selectedBus = null;
}

// Update bus dashboard
function updateBusDashboard(buses) {
    const busGrid = document.getElementById('busGrid');
    busGrid.innerHTML = '';

    buses.forEach(bus => {
        const busCard = document.createElement('div');
        busCard.className = 'bus-card';
        busCard.innerHTML = `
            <div class="bus-header">
                <div class="bus-id">${bus.routeNumber} - ${bus.id}</div>
                <div class="bus-status status-${bus.status}">
                    <span class="status-indicator indicator-${bus.status}"></span>
                    ${bus.status}
                </div>
            </div>
            <div class="bus-info">
                <div><strong>Route:</strong> <span>${bus.route}</span></div>
                <div><strong>Speed:</strong> <span>${Math.round(bus.speed)} km/h</span></div>
                <div><strong>Next Stop:</strong> <span>${bus.nextStop}</span></div>
                <div><strong>ETA:</strong> <span>${bus.estimatedArrival}</span></div>
                <div><strong>Passengers:</strong> <span>${bus.passengers}/${bus.capacity}</span></div>
                <div><strong>Driver:</strong> <span>${bus.driver}</span></div>
            </div>
        `;
        
        busCard.addEventListener('click', () => {
            if (bus.status === 'active') {
                map.setCenter({ lat: bus.lat, lng: bus.lng });
                map.setZoom(16);
                
                // Find and open the corresponding marker
                const marker = busMarkers.find(m => 
                    Math.abs(m.getPosition().lat() - bus.lat) < 0.001 &&
                    Math.abs(m.getPosition().lng() - bus.lng) < 0.001
                );
                if (marker) {
                    google.maps.event.trigger(marker, 'click');
                }
            }
        });
        
        busGrid.appendChild(busCard);
    });
}

// Find user's location
function findMyLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                
                userLocation = { lat, lng };
                
                if (userMarker) {
                    userMarker.setMap(null);
                }
                
                userMarker = new google.maps.Marker({
                    position: userLocation,
                    map: map,
                    title: 'Your Location',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="15" cy="15" r="12" fill="#ff6b6b" stroke="white" stroke-width="3"/>
                                <circle cx="15" cy="15" r="4" fill="white"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(30, 30),
                        anchor: new google.maps.Point(15, 15)
                    }
                });
                
                const infoWindow = new google.maps.InfoWindow({
                    content: `
                        <div style="padding: 10px;">
                            <h4 style="margin: 0 0 10px 0;">📍 Your Location</h4>
                            <p>Lat: ${lat.toFixed(6)}</p>
                            <p>Lng: ${lng.toFixed(6)}</p>
                        </div>
                    `
                });
                
                userMarker.addListener('click', () => {
                    infoWindow.open(map, userMarker);
                });
                
                document.getElementById('userLocation').textContent = 
                    `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
                
                map.setCenter(userLocation);
                map.setZoom(15);
            },
            (error) => {
                // Fallback to Mumbai center
                const mumbaiCenter = { lat: 19.0760, lng: 72.8777 };
                userLocation = mumbaiCenter;
                
                if (userMarker) {
                    userMarker.setMap(null);
                }
                
                userMarker = new google.maps.Marker({
                    position: mumbaiCenter,
                    map: map,
                    title: 'Default Location (Mumbai)',
                    icon: {
                        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="30" height="30" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="15" cy="15" r="12" fill="#ff6b6b" stroke="white" stroke-width="3"/>
                                <circle cx="15" cy="15" r="4" fill="white"/>
                            </svg>
                        `),
                        scaledSize: new google.maps.Size(30, 30),
                        anchor: new google.maps.Point(15, 15)
                    }
                });
                
                document.getElementById('userLocation').textContent = 
                    'Default: Mumbai Center';
                
                map.setCenter(mumbaiCenter);
                
                alert('Location access denied. Using Mumbai center as default.');
            }
        );
    } else {
        alert('Geolocation is not supported by this browser.');
    }
}

// Show route details in a popup
function showRouteDetails(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    let details = `
        <div style="max-width: 400px; padding: 15px;">
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">🚌 Route Details</h3>
            <p><strong>Distance:</strong> ${leg.distance.text}</p>
            <p><strong>Duration:</strong> ${leg.duration.text}</p>
    `;
    
    if (leg.steps) {
        details += '<h4 style="margin: 15px 0 10px 0;">Steps:</h4><ul>';
        leg.steps.forEach((step, index) => {
            if (step.transit) {
                details += `
                    <li style="margin: 5px 0;">
                        ${step.transit.line.vehicle.type}: ${step.transit.line.short_name || step.transit.line.name}
                        from ${step.transit.departure_stop.name} to ${step.transit.arrival_stop.name}
                        (${step.duration.text})
                    </li>
                `;
            } else {
                details += `<li style="margin: 5px 0;">${step.instructions} (${step.duration.text})</li>`;
            }
        });
        details += '</ul>';
    }
    
    details += '</div>';
    
    const infoWindow = new google.maps.InfoWindow({
        content: details,
        position: route.overview_path[Math.floor(route.overview_path.length / 2)]
    });
    
    infoWindow.open(map);
}

// Toggle traffic layer
function toggleTraffic() {
    if (isTrafficVisible) {
        trafficLayer.setMap(null);
        isTrafficVisible = false;
    } else {
        trafficLayer.setMap(map);
        isTrafficVisible = true;
    }
}

// Toggle satellite view
function toggleSatellite() {
    if (mapType === 'roadmap') {
        map.setMapTypeId('hybrid');
        mapType = 'hybrid';
    } else {
        map.setMapTypeId('roadmap');
        mapType = 'roadmap';
    }
}

// Center map on user location
function centerMap() {
    if (userLocation) {
        map.setCenter(userLocation);
        map.setZoom(15);
    } else {
        map.setCenter({ lat: 19.0760, lng: 72.8777 });
        map.setZoom(12);
    }
}

// Handle connection errors
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (socket && !socket.connected) {
        socket.connect();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});

// Initialize map when page loads
window.initMap = initMap;

// Plan route to destination
async function planRoute() {
    const destination = document.getElementById('destination').value.trim();
    
    if (!destination) {
        alert('Please enter a destination.');
        return;
    }
    
    if (!userLocation) {
        alert('Please find your location first by clicking "My Location".');
        return;
    }
    
    try {
        // Use Google Places API to geocode destination
        const geocoder = new google.maps.Geocoder();
        const results = await new Promise((resolve, reject) => {
            geocoder.geocode(
                { 
                    address: destination,
                    bounds: new google.maps.LatLngBounds(
                        new google.maps.LatLng(18.8, 72.6),
                        new google.maps.LatLng(19.4, 73.2)
                    )
                },
                (results, status) => {
                    if (status === 'OK') resolve(results);
                    else reject(new Error(status));
                }
            );
        });
        
        const destinationLocation = {
            lat: results[0].geometry.location.lat(),
            lng: results[0].geometry.location.lng()
        };
        
        // Remove existing destination marker
        if (destinationMarker) {
            destinationMarker.setMap(null);
        }
        
        // Add destination marker
        destinationMarker = new google.maps.Marker({
            position: destinationLocation,
            map: map,
            title: destination,
            icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                    <svg width="35" height="35" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="17.5" cy="17.5" r="15" fill="#764ba2" stroke="white" stroke-width="3"/>
                        <text x="17.5" y="25" font-family="Arial" font-size="18" text-anchor="middle" fill="white">🎯</text>
                    </svg>
                `),
                scaledSize: new google.maps.Size(35, 35),
                anchor: new google.maps.Point(17.5, 17.5)
            }
        });
        
        // Calculate and display route
        const directionsRequest = {
            origin: userLocation,
            destination: destinationLocation,
            travelMode: google.maps.TravelMode.TRANSIT,
            transitOptions: {
                modes: [google.maps.TransitMode.BUS],
                routingPreference: google.maps.TransitRoutePreference.FEWER_TRANSFERS
            }
        };
        
        directionsService.route(directionsRequest, (result, status) => {
            if (status === 'OK') {
                directionsRenderer.setDirections(result);
                
                const route = result.routes[0];
                const leg = route.legs[0];
                
                document.getElementById('destinationDisplay').textContent = destination;
                document.getElementById('estimatedTime').textContent = leg.duration.text;
                document.getElementById('routeDistance').textContent = leg.distance.text;
                
                // Show route details
                showRouteDetails(result);
            } else {
                // Fallback to driving directions if transit not available
                directionsRequest.travelMode = google.maps.TravelMode.DRIVING;
                directionsService.route(directionsRequest, (result, status) => {
                    if (status === 'OK') {
                        directionsRenderer.setDirections(result);
                        const route = result.routes[0];
                        const leg = route.legs[0];
                        
                        document.getElementById('destinationDisplay').textContent = destination;
                        document.getElementById('estimatedTime').textContent = 
                            `${leg.duration.text} (by car - bus route not available)`;
                        document.getElementById('routeDistance').textContent = leg.distance.text;
                    } else {
                        alert('Could not calculate route. Please try a different destination.');
                    }
                });
            }
        });
        
        // Call backend API for additional route info
        const response = await fetch('/api/route', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                origin: userLocation,
                destination: destinationLocation
            })
        });
        
        const routeData = await response.json();
        console.log('Backend route data:', routeData);
        
    } catch (error) {
        console.error('Route planning error:', error);
        alert('Error planning route. Please check your destination and try again.');
    }
}

// Show route details in a popup
function showRouteDetails(directionsResult) {
    const route = directionsResult.routes[0];
    const leg = route.legs[0];
    
    let details = `
        <div style="max-width: 400px; padding: 15px;">
            <h3 style="margin: 0 0 15px 0; color: #2c3e50;">🚌 Route Details</h3>
            <p><strong>Distance:</strong> ${leg.distance.text}</p>
            <p><strong>Duration:</strong> ${leg.duration.text}</p>
    `;
    
    if (leg.steps) {
        details += '<h4 style="margin: 15px 0 10px 0;">Steps:</h4><ul>';
        leg.steps.forEach((step, index) => {
            if (step.transit) {
                details += `
                    <li style="margin: 5px 0;">
                        ${step.transit.line.vehicle.type}: ${step.transit.line.short_name || step.transit.line.name}
                        from ${step.transit.departure_stop.name} to ${step.transit.arrival_stop.name}
                        (${step.duration.text})
                    </li>
                `;
            } else {
                details += `<li style="margin: 5px 0;">${step.instructions} (${step.duration.text})</li>`;
            }
        });
        details += '</ul>';
    }
    
    details += '</div>';
    
    const infoWindow = new google.maps.InfoWindow({
        content: details,
        position: route.overview_path[Math.floor(route.overview_path.length / 2)]
    });
    
    infoWindow.open(map);
}

// Find nearby buses
async function findNearbyBuses() {
    if (!userLocation) {
        alert('Please find your location first by clicking "My Location".');
        return;
    }
    
    try {
        const response = await fetch(
            `/api/nearby-buses?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=3`
        );
        const result = await response.json();
        
        if (result.success && result.data.length > 0) {
            const nearbyBuses = result.data;
            let message = `Found ${nearbyBuses.length} buses nearby:\n\n`;
            
            nearbyBuses.forEach((bus, index) => {
                message += `${index + 1}. Bus ${bus.routeNumber} (${bus.id})\n`;
                message += `   Route: ${bus.route}\n`;
                message += `   Distance: ${bus.distance} km\n`;
                message += `   Next Stop: ${bus.nextStop} (${bus.estimatedArrival})\n\n`;
            });
            
            alert(message);
            
            // Highlight nearest bus on map
            const nearestBus = nearbyBuses[0];
            const nearestMarker = busMarkers.find(marker => 
                Math.abs(marker.getPosition().lat() - nearestBus.lat) < 0.001 &&
                Math.abs(marker.getPosition().lng() - nearestBus.lng) < 0.001
            );
            
            if (nearestMarker) {
                map.setCenter(nearestMarker.getPosition());
                map.setZoom(16);
                google.maps.event.trigger(nearestMarker, 'click');
            }
        } else {
            alert('No buses found nearby. Try increasing the search radius or check back later.');
        }
    } catch (error) {
        console.error('Error finding nearby buses:', error);
        alert('Error finding nearby buses. Please try again.');
    }
}

// Toggle traffic layer
function toggleTraffic() {
    if (isTrafficVisible) {
        trafficLayer.setMap(null);
        isTrafficVisible = false;
    } else {
        trafficLayer.setMap(map);
        isTrafficVisible = true;
    }
}

// Toggle satellite view
function toggleSatellite() {
    if (mapType === 'roadmap') {
        map.setMapTypeId('hybrid');
        mapType = 'hybrid';
    } else {
        map.setMapTypeId('roadmap');
        mapType = 'roadmap';
    }
}

// Center map on user location
function centerMap() {
    if (userLocation) {
        map.setCenter(userLocation);
        map.setZoom(15);
    } else {
        map.setCenter({ lat: 19.0760, lng: 72.8777 });
        map.setZoom(12);
    }
}

// Handle connection errors
window.addEventListener('online', () => {
    console.log('Connection restored');
    if (socket && !socket.connected) {
        socket.connect();
    }
});

window.addEventListener('offline', () => {
    console.log('Connection lost');
});

// Initialize map when page loads
window.initMap = initMap;