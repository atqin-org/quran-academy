import {
    Map,
    MapMarker,
    MapPopup,
    MapTileLayer,
    MapZoomControl,
} from "@/Components/ui/map";

// Default to Maghnia, Tlemcen — matches the project's branding location.
const DEFAULT_CENTER: [number, number] = [34.8413, -1.7783];

interface Props {
    latitude: number | null;
    longitude: number | null;
    onChange: (latitude: number | null, longitude: number | null) => void;
    className?: string;
}

export default function LocationMap({
    latitude,
    longitude,
    onChange,
    className,
}: Props) {
    const hasPoint = latitude !== null && longitude !== null;
    const center: [number, number] = hasPoint
        ? [latitude as number, longitude as number]
        : DEFAULT_CENTER;

    const handleMapClick = (latlng: [number, number]) => {
        onChange(round(latlng[0]), round(latlng[1]));
    };

    const handleMarkerDrag = (latlng: [number, number]) => {
        onChange(round(latlng[0]), round(latlng[1]));
    };

    return (
        <Map
            center={center}
            zoom={hasPoint ? 14 : 11}
            onClick={handleMapClick}
            className={className}
        >
            <MapTileLayer />
            <MapZoomControl />
            {hasPoint && (
                <MapMarker
                    position={[latitude as number, longitude as number]}
                    draggable
                    onDragEnd={handleMarkerDrag}
                >
                    <MapPopup>
                        <span className="text-xs font-mono">
                            {(latitude as number).toFixed(5)},{" "}
                            {(longitude as number).toFixed(5)}
                        </span>
                    </MapPopup>
                </MapMarker>
            )}
        </Map>
    );
}

function round(n: number): number {
    return Math.round(n * 10_000_000) / 10_000_000;
}
