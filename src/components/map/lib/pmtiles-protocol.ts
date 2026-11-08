import { addProtocol } from "maplibre-gl";
import { Protocol } from "pmtiles";

let registered = false;

export function ensurePmtilesProtocol() {
  if (registered) return;

  const protocol = new Protocol();
  addProtocol("pmtiles", protocol.tile);
  registered = true;
}
