import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/** Instancia única a nivel de módulo para prevenir duplicaciones por chunking de Angular */
let sharedClient: SupabaseClient | null = null;

/**
 * Layer 0 – Punto único de creación del cliente Supabase.
 * Ningún otro componente o service debe importar `createClient` directamente.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
    readonly client: SupabaseClient;

    constructor() {
        if (!sharedClient) {
            sharedClient = createClient(
                'https://osdecmrfyxxieyrmtugv.supabase.co',
                'sb_publishable_ui93Xiqzl7OAoaY0nNanBw_xFpJtWst'
            );
        }
        this.client = sharedClient;
    }
}
