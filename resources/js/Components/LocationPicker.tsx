import { useState } from "react";
import { Crosshair, MapPin } from "lucide-react";

import {
    Map,
    MapMarker,
    MapPopup,
    MapTileLayer,
    MapZoomControl,
} from "@/Components/ui/map";
import { Button } from "@/Components/ui/button";
import { Input } from "@/Components/ui/input";
import { Label } from "@/Components/ui/label";

// Default to Maghnia, Tlemcen — matches the project's branding location.
const DEFAULT_CENTER: [number, number] = [34.8413, -1.7783];

interface Props {
    latitude: number | null;
    longitude: number | null;
    onChange: (latitude: number | null, longitude: number | null) => void;
    error?: string;
}

export default function LocationPicker({
    latitude,
    longitude,
    onChange,
    error,
}: Props) {
    const [locating, setLocating] = useState(false);
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

    const handleLatChange = (v: string) => {
        if (v === "") {
            onChange(null, longitude);
            return;
        }
        const n = parseFloat(v);
        if (Number.isFinite(n)) onChange(n, longitude);
    };

    const handleLngChange = (v: string) => {
        if (v === "") {
            onChange(latitude, null);
            return;
        }
        const n = parseFloat(v);
        if (Number.isFinite(n)) onChange(latitude, n);
    };

    const useDeviceLocation = () => {
        if (!navigator.geolocation) return;
        setLocating(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                onChange(round(pos.coords.latitude), round(pos.coords.longitude));
                setLocating(false);
            },
            () => setLocating(false),
            { enableHighAccuracy: true, timeout: 8000 },
        );
    };

    const clear = () => onChange(null, null);

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
                <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    إحداثيات النادي
                    <span className="text-xs text-muted-foreground">
                        (اختياري — انقر على الخريطة لتحديد الموقع)
                    </span>
                </Label>
                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={useDeviceLocation}
                        disabled={locating}
                        className="gap-1"
                    >
                        <Crosshair className="h-3.5 w-3.5" />
                        {locating ? "جاري التحديد..." : "موقعي الحالي"}
                    </Button>
                    {hasPoint && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clear}
                        >
                            مسح
                        </Button>
                    )}
                </div>
            </div>

            <Map center={center} zoom={hasPoint ? 14 : 11} onClick={handleMapClick}>
                <MapTileLayer />
                <MapZoomControl />
                {hasPoint && (
                    <MapMarker
                        position={[latitude as number, longitude as number]}
                        draggable
                        onDragEnd={handleMarkerDrag}
                    >
                        <MapPopup>
                            <span className="text-xs">
                                {(latitude as number).toFixed(5)},{" "}
                                {(longitude as number).toFixed(5)}
                            </span>
                        </MapPopup>
                    </MapMarker>
                )}
            </Map>

            <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                    <Label htmlFor="latitude" className="text-xs text-muted-foreground">
                        خط العرض (Latitude)
                    </Label>
                    <Input
                        id="latitude"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        placeholder="34.84130"
                        value={latitude ?? ""}
                        onChange={(e) => handleLatChange(e.target.value)}
                    />
                </div>
                <div className="space-y-1">
                    <Label htmlFor="longitude" className="text-xs text-muted-foreground">
                        خط الطول (Longitude)
                    </Label>
                    <Input
                        id="longitude"
                        type="number"
                        step="any"
                        inputMode="decimal"
                        placeholder="-1.77830"
                        value={longitude ?? ""}
                        onChange={(e) => handleLngChange(e.target.value)}
                    />
                </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
    );
}

function round(n: number): number {
    return Math.round(n * 10_000_000) / 10_000_000;
}
