/// <reference types="@solidjs/start/env" />

// solid-js/web's default (client) RequestEvent type has no `locals`, but the
// server runtime provides it. Augment the module (not redeclare it) so the rest
// of solid-js/web's exports stay intact.
export declare module "solid-js/web" {
  interface RequestEvent {
    locals: Record<string | number | symbol, any>
  }
}
