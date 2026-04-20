import { json } from "../_lib/response";

export async function onRequestGet() {
  return json({ ok: true });
}
