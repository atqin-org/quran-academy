interface ThomanCircleProps {
    value: number; // 0-8
    size?: number;
}

export default function ThomanCircle({ value, size = 20 }: ThomanCircleProps) {
    // Ensure value is between 0 and 8
    const filledSegments = Math.max(0, Math.min(8, value));
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 1;

    const slices = Array.from({ length: 8 }, (_, i) => {
        const isFilled = i < filledSegments;
        // Each slice is 45 degrees, starting from top (-90 degrees)
        const startAngle = (i * 45 - 90) * (Math.PI / 180);
        const endAngle = ((i + 1) * 45 - 90) * (Math.PI / 180);

        // Calculate the path for a pie slice
        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const pathData = [
            `M ${cx} ${cy}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 0 1 ${x2} ${y2}`,
            "Z",
        ].join(" ");

        return (
            <path
                key={i}
                d={pathData}
                fill={isFilled ? "#22c55e" : "#e5e7eb"}
                stroke="#fff"
                strokeWidth={0.5}
            />
        );
    });

    return (
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            {slices}
        </svg>
    );
}
