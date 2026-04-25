import {
  AppWindow,
  Boxes,
  Cloud,
  Database,
  Globe2,
  HardDrive,
  LucideIcon,
  MonitorUp,
  Network,
  Route,
  Search,
  Server,
  UserRound,
  Waypoints,
} from 'lucide-react';

const iconMap: Record<string, LucideIcon> = {
  'api-gateway': Route,
  'app-server': Server,
  cache: HardDrive,
  cdn: Network,
  dns: Globe2,
  'load-balancer': Waypoints,
  'media-server': MonitorUp,
  'message-queue': Boxes,
  'nosql-db': Database,
  'object-storage': Cloud,
  'relational-db': Database,
  'search-engine': Search,
};

export function iconForComponent(slug?: string): LucideIcon {
  if (!slug) return AppWindow;
  return iconMap[slug] ?? AppWindow;
}

export function ActorIcon() {
  return <UserRound className="h-5 w-5" aria-hidden="true" />;
}
