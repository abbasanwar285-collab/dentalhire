'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression, Icon } from 'leaflet';

// Dynamically import Leaflet components to avoid SSR issues
const MapContainer = dynamic(
    () => import('react-leaflet').then((mod) => mod.MapContainer),
    { ssr: false }
);
const TileLayer = dynamic(
    () => import('react-leaflet').then((mod) => mod.TileLayer),
    { ssr: false }
);
const Marker = dynamic(
    () => import('react-leaflet').then((mod) => mod.Marker),
    { ssr: false }
);
const Popup = dynamic(
    () => import('react-leaflet').then((mod) => mod.Popup),
    { ssr: false }
);
const Circle = dynamic(
    () => import('react-leaflet').then((mod) => mod.Circle),
    { ssr: false }
);

interface LeafletMapProps {
    center: { lat: number; lng: number };
    zoom?: number;
    markers?: {
        id: string;
        position: { lat: number; lng: number };
        title: string;
        content?: React.ReactNode;
        color?: string;
    }[];
    radius?: number; // meters
    height?: string;
}

export default function LeafletMap({ center, zoom = 13, markers = [], radius, height = '400px' }: LeafletMapProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
        // Fix Leaflet icon issue
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        const L = require('leaflet');
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
            iconUrl: require('leaflet/dist/images/marker-icon.png'),
            shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
        });
    }, []);

    if (!isMounted) {
        return (
            <div className="w-full bg-gray-100 dark:bg-gray-800 animate-pulse rounded-xl" style={{ height }}>
                <div className="flex items-center justify-center h-full text-gray-400">
                    Loading Map...
                </div>
            </div>
        );
    }

    return (
        <MapContainer
            center={center as LatLngExpression}
            zoom={zoom}
            className="w-full rounded-xl shadow-inner z-0"
            style={{ height }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Search Radius */}
            {radius && (
                <Circle
                    center={center as LatLngExpression}
                    radius={radius}
                    pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.1 }}
                />
            )}

            {/* Clinic Location (Center) */}
            <Marker position={center as LatLngExpression}>
                <Popup>Your Clinic Location</Popup>
            </Marker>

            {/* Candidate Markers */}
            {markers.map((marker) => (
                <Marker key={marker.id} position={marker.position as LatLngExpression}>
                    <Popup>
                        <div className="min-w-[200px]">
                            <h3 className="font-bold text-sm mb-1">{marker.title}</h3>
                            {marker.content}
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}
