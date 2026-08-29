"use client";

import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";

export default function LiveMap({ 
  vanLat = null, 
  vanLng = null, 
  pubLat = 51.5074, 
  pubLng = -0.1278 
}: any) {
  const [isClient, setIsClient] = useState(false);

  // 1. Guarantee this code ONLY runs in the browser
  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-gray-900 text-gray-400 font-bold">
        Starting GPS Engine...
      </div>
    );
  }

  // 2. Safely load Leaflet modules to prevent server crashes
  const L = require("leaflet");
  const { MapContainer, TileLayer, Marker, Popup } = require("react-leaflet");

  const vanIcon = L.divIcon({
    html: '<div style="font-size: 35px; line-height: 1;">🚚</div>',
    className: "bg-transparent border-0",
    iconSize: [35, 35],
    iconAnchor: [17, 17],
  });

  const pubIcon = L.divIcon({
    html: '<div style="font-size: 35px; line-height: 1;">📍</div>',
    className: "bg-transparent border-0",
    iconSize: [35, 35],
    iconAnchor: [17, 35],
  });

  // 3. Absolute positioning forces the map to fill the container perfectly
  return (
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}>
      <MapContainer 
        center={[pubLat, pubLng]} 
        zoom={13} 
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        <Marker position={[pubLat, pubLng]} icon={pubIcon}>
          <Popup>The Pub</Popup>
        </Marker>
        
        {vanLat && vanLng && (
          <Marker position={[vanLat, vanLng]} icon={vanIcon}>
            <Popup>Driver Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}