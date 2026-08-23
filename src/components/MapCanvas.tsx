'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { jerusalemMapCenter, placeholderOpportunityCoords } from '@/lib/placeholder-opportunities';

type Pin = { title: string; location: string };

const pinIcon = L.divIcon({
  className: '',
  html: `
    <span class="map-pin">
      <span class="map-pin-pulse"></span>
      <span class="map-pin-dot"></span>
    </span>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function MapCanvas({ pins }: { pins: Pin[] }) {
  return (
    <div className="map-tint h-full w-full">
      <MapContainer
        center={jerusalemMapCenter}
        zoom={14}
        scrollWheelZoom={false}
        className="h-full w-full"
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution="&copy; OpenStreetMap contributors &copy; CARTO"
        />
        {pins.map((pin, index) => (
          <Marker
            key={pin.title}
            position={placeholderOpportunityCoords[index] ?? jerusalemMapCenter}
            icon={pinIcon}
            eventHandlers={{
              mouseover: (event) => event.target.openPopup(),
              mouseout: (event) => event.target.closePopup(),
            }}
          >
            <Popup>
              <strong>{pin.title}</strong>
              <br />
              {pin.location}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
