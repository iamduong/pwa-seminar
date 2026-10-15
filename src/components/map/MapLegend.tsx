import { POI_GROUP_STYLES } from "./map-config"

export function MapLegend() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 flex max-w-[calc(100%-1.5rem)] flex-wrap gap-x-3 gap-y-1.5 rounded-md border bg-background/90 px-3 py-2 text-xs shadow-sm backdrop-blur-sm">
      {Object.entries(POI_GROUP_STYLES).map(([group, style]) => (
        <span key={group} className="flex items-center gap-1.5">
          <span
            className="size-2.5 rounded-full border border-white shadow-sm"
            style={{ backgroundColor: style.color }}
          />
          {style.label}
        </span>
      ))}
    </div>
  )
}
