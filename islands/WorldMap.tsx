import { useSignal, useComputed } from "@preact/signals";
import { useEffect, useRef } from "preact/hooks";

// Define location data structure
interface LocationPin {
  id: string;
  lat: number;
  lng: number;
  username: string;
}

interface WorldMapProps {
  pins?: LocationPin[];
  onAddPin?: (lat: number, lng: number) => void;
  currentUser?: { id: string; username: string } | null;
}

export default function WorldMap({
  pins = [],
  onAddPin,
  currentUser
}: WorldMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const showLocationInput = useSignal(false);
  const latInput = useSignal("");
  const lngInput = useSignal("");
  const errorMessage = useSignal("");
  const mapLoaded = useSignal(false);

  // Simple validation for lat/lng inputs
  const isValidCoordinates = useComputed(() => {
    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);
    return !isNaN(lat) && !isNaN(lng) &&
           lat >= -90 && lat <= 90 &&
           lng >= -180 && lng <= 180;
  });

  // Load the map when component mounts
  useEffect(() => {
    // Add Leaflet CSS
    if (!document.getElementById('leaflet-css')) {
      const link = document.createElement('link');
      link.id = 'leaflet-css';
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
      link.crossOrigin = '';
      document.head.appendChild(link);
    }

    // Add custom Leaflet CSS
    if (!document.getElementById('leaflet-custom-css')) {
      const customLink = document.createElement('link');
      customLink.id = 'leaflet-custom-css';
      customLink.rel = 'stylesheet';
      customLink.href = '/leaflet-custom.css';
      document.head.appendChild(customLink);
    }

    // Load Leaflet JS
    if (!window.L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.integrity = 'sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo=';
      script.crossOrigin = '';
      script.onload = initMap;
      document.head.appendChild(script);
    } else {
      initMap();
    }

    return () => {
      // Cleanup map when component unmounts
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // Watch for changes in pins to update markers
  useEffect(() => {
    if (mapInstanceRef.current && mapLoaded.value) {
      updateMapPins();
    }
  }, [pins]);

  // Initialize Leaflet map
  function initMap() {
    if (!mapContainerRef.current) return;

    // Check if Leaflet is loaded
    if (!window.L) {
      setTimeout(initMap, 100);
      return;
    }

    // Create map instance
    const L = window.L;
    mapInstanceRef.current = L.map(mapContainerRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      dragging: true,
      minZoom: 2,
      maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    }).setView([25, 10], 2);

    // Add tile layer (CartoDB - cleaner looking map)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(mapInstanceRef.current);

    // Add click event for adding new pins
    mapInstanceRef.current.on('click', (e: any) => {
      if (!currentUser) return;

      const { lat, lng } = e.latlng;

      // Show input form with pre-filled coordinates
      latInput.value = lat.toFixed(6);
      lngInput.value = lng.toFixed(6);
      showLocationInput.value = true;
    });

    // Add initial pins
    updateMapPins();

    mapLoaded.value = true;
  }

  // Update pins on the map
  function updateMapPins() {
    if (!mapInstanceRef.current || !window.L) return;

    const L = window.L;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add markers for each location
    pins.forEach(pin => {
      // Create custom icon with sweat emoji
      const customIcon = L.divIcon({
        html: `<div style="font-size: 1.5rem; filter: drop-shadow(0 1px 3px rgba(0,0,0,0.2));">🍑💦</div>`,
        className: 'custom-div-icon',
        iconSize: [24, 24],
        iconAnchor: [12, 12],
        tooltipAnchor: [0, -12]
      });

      const marker = L.marker([pin.lat, pin.lng], { icon: customIcon })
        .addTo(mapInstanceRef.current)
        .bindTooltip(`@${pin.username}`, {
          direction: 'top',
          permanent: false,
          opacity: 0.9
        });

      markersRef.current.push(marker);
    });
  }

  function handleSubmitLocation() {
    if (!isValidCoordinates.value || !onAddPin || !currentUser) return;

    const lat = parseFloat(latInput.value);
    const lng = parseFloat(lngInput.value);

    // Call the callback function to add the pin
    onAddPin(lat, lng);

    // Reset the form
    showLocationInput.value = false;
    latInput.value = "";
    lngInput.value = "";
    errorMessage.value = "";
  }

  function handleCancel() {
    showLocationInput.value = false;
    latInput.value = "";
    lngInput.value = "";
    errorMessage.value = "";
  }

  return (
    <div class="w-full max-w-3xl mb-6 mx-auto h-[400px]">
      <h2 class="text-2xl font-semibold mb-3 text-center text-gray-700">汗マップ (Sweat Map)</h2>

      <div
        ref={mapContainerRef}
        class="w-full h-[400px] bg-[#f0f9ff] border border-[#cae6ff] rounded-lg overflow-hidden relative z-0"
      >
        {!mapLoaded.value && (
          <div class="absolute inset-0 flex items-center justify-center">
            <p>Loading map...</p>
          </div>
        )}
      </div>

      {currentUser ? (
        <div class="text-center mt-3">
          <p class="text-sm text-gray-600">
            {showLocationInput.value ? "Enter your location:" : "Click anywhere on the map to add your drip location (optional)"}
          </p>
        </div>
      ) : (
        <div class="text-center mt-3">
          <p class="text-sm text-gray-600">Log in with Mastodon to add your location to the map</p>
        </div>
      )}

      {showLocationInput.value && (
        <div class="mt-3 p-3 bg-white rounded-lg shadow-sm">
          <div class="flex flex-wrap -mx-2">
            <div class="px-2 w-1/2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
              <input
                type="text"
                value={latInput.value}
                onInput={(e) => latInput.value = (e.target as HTMLInputElement).value}
                class="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g. 35.6812"
              />
            </div>
            <div class="px-2 w-1/2">
              <label class="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
              <input
                type="text"
                value={lngInput.value}
                onInput={(e) => lngInput.value = (e.target as HTMLInputElement).value}
                class="w-full p-2 border border-gray-300 rounded"
                placeholder="e.g. 139.7671"
              />
            </div>
          </div>

          {errorMessage.value && (
            <p class="text-red-500 text-sm mt-2">{errorMessage.value}</p>
          )}

          <div class="flex justify-end mt-3 space-x-2">
            <button
              onClick={handleCancel}
              class="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitLocation}
              disabled={!isValidCoordinates.value}
              class={`px-4 py-2 rounded text-white ${isValidCoordinates.value ? 'bg-[#0ea5e9] hover:bg-[#0284c7]' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              Add Location
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
