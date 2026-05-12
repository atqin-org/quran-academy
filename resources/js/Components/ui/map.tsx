import "leaflet/dist/leaflet.css";
import * as React from "react";
import L from "leaflet";
import {
    MapContainer,
    Marker,
    Popup,
    TileLayer,
    ZoomControl,
    useMap,
    useMapEvents,
} from "react-leaflet";

import { cn } from "@/lib/utils";

type LatLng = [number, number];

// Custom shadcn-themed pin: a teardrop with the primary fill, dark stroke and
// a small white dot at the bottom, drawn as a Leaflet `divIcon` so it inherits
// the app's CSS variables (primary, border, shadow).
const PIN_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="36" height="42" viewBox="0 0 36 42" fill="none">
    <path d="M18 1c-9.389 0-17 7.611-17 17 0 12.75 17 23 17 23s17-10.25 17-23c0-9.389-7.611-17-17-17z"
        fill="hsl(var(--primary))"
        stroke="hsl(var(--background))"
        stroke-width="2"
        stroke-linejoin="round"
    />
    <circle cx="18" cy="17" r="6" fill="hsl(var(--background))" />
</svg>
`.trim();

const shadcnPinIcon = L.divIcon({
    className: "shadcn-map-pin",
    html: `<div style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.25));">${PIN_SVG}</div>`,
    iconSize: [36, 42],
    iconAnchor: [18, 42],
    popupAnchor: [0, -38],
});

interface MapProps {
    center: LatLng;
    zoom?: number;
    className?: string;
    children?: React.ReactNode;
    onClick?: (latlng: LatLng) => void;
}

export function Map({
    center,
    zoom = 13,
    className,
    children,
    onClick,
}: MapProps) {
    return (
        <MapContainer
            center={center}
            zoom={zoom}
            zoomControl={false}
            scrollWheelZoom
            className={cn(
                // shadcn-aligned container styling
                "h-80 w-full rounded-lg border bg-muted shadow-sm overflow-hidden",
                "[&_.leaflet-control]:!font-sans",
                // zoom buttons — small rounded shadcn-style outline buttons
                "[&_.leaflet-control-zoom]:!border-0 [&_.leaflet-control-zoom]:!shadow-none [&_.leaflet-control-zoom]:!rounded-md",
                "[&_.leaflet-control-zoom_a]:!bg-background [&_.leaflet-control-zoom_a]:!text-foreground",
                "[&_.leaflet-control-zoom_a]:!border [&_.leaflet-control-zoom_a]:!border-border",
                "[&_.leaflet-control-zoom_a]:!w-8 [&_.leaflet-control-zoom_a]:!h-8",
                "[&_.leaflet-control-zoom_a]:!leading-8 [&_.leaflet-control-zoom_a]:!text-base",
                "[&_.leaflet-control-zoom_a:first-child]:!rounded-t-md [&_.leaflet-control-zoom_a:last-child]:!rounded-b-md",
                "[&_.leaflet-control-zoom_a:hover]:!bg-muted",
                // popup styling — match shadcn popover
                "[&_.leaflet-popup-content-wrapper]:!bg-popover [&_.leaflet-popup-content-wrapper]:!text-popover-foreground",
                "[&_.leaflet-popup-content-wrapper]:!rounded-md [&_.leaflet-popup-content-wrapper]:!shadow-md",
                "[&_.leaflet-popup-content-wrapper]:!border [&_.leaflet-popup-content-wrapper]:!border-border",
                "[&_.leaflet-popup-tip]:!bg-popover [&_.leaflet-popup-tip]:!shadow-none",
                "[&_.leaflet-popup-content]:!my-2 [&_.leaflet-popup-content]:!mx-3 [&_.leaflet-popup-content]:!text-sm",
                "[&_.leaflet-popup-close-button]:!text-muted-foreground [&_.leaflet-popup-close-button:hover]:!text-foreground",
                // attribution bar — quieter
                "[&_.leaflet-control-attribution]:!bg-background/80 [&_.leaflet-control-attribution]:!text-[10px] [&_.leaflet-control-attribution]:!px-1.5",
                className,
            )}
        >
            <MapRecenter center={center} />
            {onClick && <MapClickHandler onClick={onClick} />}
            {children}
        </MapContainer>
    );
}

function MapRecenter({ center }: { center: LatLng }) {
    const map = useMap();
    const lastCenter = React.useRef<LatLng>(center);

    React.useEffect(() => {
        const [lat, lng] = center;
        const [prevLat, prevLng] = lastCenter.current;
        if (lat === prevLat && lng === prevLng) return;
        lastCenter.current = center;
        map.setView(center, map.getZoom(), { animate: true });
    }, [center, map]);

    return null;
}

function MapClickHandler({
    onClick,
}: {
    onClick: (latlng: LatLng) => void;
}) {
    useMapEvents({
        click(e) {
            onClick([e.latlng.lat, e.latlng.lng]);
        },
    });
    return null;
}

interface MapTileLayerProps {
    url?: string;
    attribution?: string;
}

export function MapTileLayer({
    url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}: MapTileLayerProps) {
    return <TileLayer url={url} attribution={attribution} />;
}

export function MapZoomControl({
    position = "topright",
}: {
    position?: "topleft" | "topright" | "bottomleft" | "bottomright";
}) {
    return <ZoomControl position={position} />;
}

interface MapMarkerProps {
    position: LatLng;
    children?: React.ReactNode;
    draggable?: boolean;
    onDragEnd?: (latlng: LatLng) => void;
}

export function MapMarker({
    position,
    children,
    draggable,
    onDragEnd,
}: MapMarkerProps) {
    const eventHandlers = React.useMemo(
        () => ({
            dragend(event: L.LeafletEvent) {
                const marker = event.target as L.Marker;
                const ll = marker.getLatLng();
                onDragEnd?.([ll.lat, ll.lng]);
            },
        }),
        [onDragEnd],
    );

    return (
        <Marker
            position={position}
            draggable={!!draggable}
            icon={shadcnPinIcon}
            eventHandlers={draggable ? eventHandlers : undefined}
        >
            {children}
        </Marker>
    );
}

export function MapPopup({ children }: { children?: React.ReactNode }) {
    return <Popup>{children}</Popup>;
}
