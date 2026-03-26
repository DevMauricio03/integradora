import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

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
                environment.supabaseUrl,
                environment.supabasePublishableKey
            );
        }
        this.client = sharedClient;
    }
}
