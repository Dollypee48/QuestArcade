import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

type QuestMapProps = {
  markers: Array<{
    id: string;
    title: string;
    location: string;
    coordinates?: [number, number];
  }>;
};

export function QuestMap({ markers }: QuestMapProps) {
  return (
    <motion.div
      className="relative h-[420px] w-full overflow-hidden rounded-3xl border border-white/10 bg-gradient-secondary shadow-glow-sm"
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
    >
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.1)_0px,rgba(255,255,255,0.1)_2px,transparent_2px,transparent_12px)] opacity-40" />
      <div className="pointer-events-none absolute inset-0">
        {markers.map((marker, index) => (
          <motion.div
            key={marker.id}
            className="absolute flex flex-col items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            style={{
              top: `${25 + (index % 3) * 18}%`,
              left: `${15 + (index % 4) * 20}%`,
            }}
          >
            <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground shadow-glow">
              {marker.title}
            </span>
            <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground shadow-lg shadow-secondary/40">
              <MapPin className="h-5 w-5" />
            </div>
            <span className="mt-2 text-[10px] uppercase tracking-widest text-foreground/50">
              {marker.location}
            </span>
          </motion.div>
        ))}
      </div>
      <div className="absolute bottom-6 left-6 rounded-full bg-background/80 px-4 py-2 text-xs text-foreground/70 shadow-glow-sm">
        Live map preview — connect Mapbox or Google Maps SDK for production
      </div>
    </motion.div>
  );
}

