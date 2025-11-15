'use client'

interface SparklineProps {
  data: number[]
  width?: number
  height?: number
  strokeColor?: string
  strokeWidth?: number
  fillColor?: string
}

export function Sparkline({ 
  data, 
  width = 80, 
  height = 24,
  strokeColor = '#2563eb',
  strokeWidth = 1.5,
  fillColor = 'rgba(37, 99, 235, 0.1)'
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Filter out null/undefined values
  const validData = data.filter(d => d !== null && d !== undefined && !isNaN(d));
  
  if (validData.length === 0) {
    return null;
  }

  // Calculate min and max for scaling
  const min = Math.min(...validData);
  const max = Math.max(...validData);
  const range = max - min || 1; // Avoid division by zero

  // Generate points for the line
  const points = validData.map((value, index) => {
    const x = (index / (validData.length - 1 || 1)) * width;
    const y = height - ((value - min) / range) * height;
    return { x, y };
  });

  // Create SVG path for the line
  const linePath = points
    .map((point, index) => {
      const command = index === 0 ? 'M' : 'L';
      return `${command} ${point.x},${point.y}`;
    })
    .join(' ');

  // Create SVG path for the filled area
  const areaPath = `
    ${linePath}
    L ${width},${height}
    L 0,${height}
    Z
  `;

  return (
    <svg 
      width={width} 
      height={height} 
      className="inline-block"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {/* Filled area under the line */}
      <path
        d={areaPath}
        fill={fillColor}
        stroke="none"
      />
      {/* Line */}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* End point dot */}
      {points.length > 0 && (
        <circle
          cx={points[points.length - 1].x}
          cy={points[points.length - 1].y}
          r={2}
          fill={strokeColor}
        />
      )}
    </svg>
  );
}
