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

// Leaflet's default marker icons reference image files relative to the
// package URL, which Vite breaks. Re-bind the icon paths so markers render.
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
    ._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type LatLng = [number, number];

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
                "h-72 w-full rounded-md border bg-muted [&_.leaflet-control]:!font-sans",
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
            eventHandlers={draggable ? eventHandlers : undefined}
        >
            {children}
        </Marker>
    );
}

export function MapPopup({ children }: { children?: React.ReactNode }) {
    return <Popup>{children}</Popup>;
}
