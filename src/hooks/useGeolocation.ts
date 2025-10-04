import { useState, useEffect } from 'react';

interface Location {
  lat: number;
  lon: number;
}

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    console.log('🌍 Attempting to get your location...');

    if (!navigator.geolocation) {
      console.warn('❌ Geolocation is not supported by your browser');
      setState({
        location: { lat: 40.7128, lon: -74.006 }, // Default to NYC
        error: 'Geolocation is not supported',
        loading: false,
      });
      return;
    }

    // Set a timeout in case geolocation takes too long
    const timeoutId = setTimeout(() => {
      console.warn('⏱️ Geolocation timeout - using default location (NYC)');
      setState({
        location: { lat: 40.7128, lon: -74.006 },
        error: 'Location timeout',
        loading: false,
      });
    }, 8000); // 8 second timeout

    console.log('📡 Requesting location permission...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timeoutId);
        const userLocation = {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        };
        console.log('✅ Got your location:', userLocation);
        console.log(
          `📍 You are at: ${userLocation.lat.toFixed(4)}, ${userLocation.lon.toFixed(4)}`
        );
        setState({
          location: userLocation,
          error: null,
          loading: false,
        });
      },
      (err) => {
        clearTimeout(timeoutId);
        console.error('❌ Geolocation error:', err.message);
        console.log('Code:', err.code);

        let errorMessage = err.message;
        if (err.code === 1) {
          errorMessage = 'Location permission denied';
          console.log('💡 Tip: Allow location access in your browser settings');
        } else if (err.code === 2) {
          errorMessage = 'Location unavailable';
        } else if (err.code === 3) {
          errorMessage = 'Location timeout';
        }

        console.log('🗽 Using default location: New York City');
        setState({
          location: { lat: 40.7128, lon: -74.006 },
          error: errorMessage,
          loading: false,
        });
      },
      {
        timeout: 8000,
        enableHighAccuracy: true,
        maximumAge: 60000, // Cache for 1 minute
      }
    );

    return () => clearTimeout(timeoutId);
  }, []);

  return state;
}
