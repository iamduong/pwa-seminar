import { usePresenceSocket } from "#hooks/use-presence-socket";

export function VisitorPresence() {
  usePresenceSocket("visitor");
  return null;
}
