import { Injectable, inject } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { AuthService } from './auth.service';

/**
 * Layer 1 – Servicio especializado: Storage.
 * Responsabilidad única: subida y eliminación de archivos en Supabase Storage.
 * Requiere un userId válido; lo obtiene de AuthService.
 */
@Injectable({ providedIn: 'root' })
export class StorageService {
    private readonly db = inject(SupabaseClientService).client;
    private readonly auth = inject(AuthService);

    /** Subir un archivo como avatar y actualizar `foto_url` en el perfil */
    async subirAvatar(file: File): Promise<string> {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        // Preserve real extension (same strategy as post images) so Supabase
        // can infer the correct Content-Type. Fallback to 'jpg' is safe because
        // 'image/jpeg' is the most common camera output on mobile.
        const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
        const fileName = `avatars/${user.id}-${Date.now()}.${rawExt}`;

        const { error: uploadError } = await this.db.storage
            .from('avatars')
            .upload(fileName, file, { contentType: file.type });

        if (uploadError) throw uploadError;

        const { data: urlData } = this.db.storage.from('avatars').getPublicUrl(fileName);
        const publicUrl = urlData.publicUrl;

        // Intentar actualizar foto_url, con fallback a foto_perfil
        let { error: updateError } = await this.db
            .from('perfiles')
            .update({ foto_url: publicUrl })
            .eq('id', user.id);

        if (updateError) {
            const { error: fallbackError } = await this.db
                .from('perfiles')
                .update({ foto_perfil: publicUrl })
                .eq('id', user.id);
            if (fallbackError) throw fallbackError;
        }

        return publicUrl;
    }

    /** Eliminar avatar del usuario y limpiar campo foto_url */
    async eliminarAvatar(): Promise<boolean> {
        const user = await this.auth.getCachedUser();
        if (!user) return false;

        let { error: updateError } = await this.db
            .from('perfiles')
            .update({ foto_url: null })
            .eq('id', user.id);

        if (updateError) {
            const { error: fallbackError } = await this.db
                .from('perfiles')
                .update({ foto_perfil: null })
                .eq('id', user.id);
            if (fallbackError) throw fallbackError;
        }

        return true;
    }

    /** Subir múltiples imágenes para publicaciones y devolver sus URLs públicas */
    async subirImagenesPublicacion(files: File[]): Promise<string[]> {
        const user = await this.auth.getCachedUser();
        if (!user) throw new Error('Usuario no autenticado');

        const urls: string[] = [];

        for (const file of files) {
            const ext = file.name.split('.').pop();
            const fileName = `posts/${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

            const { error: uploadError } = await this.db.storage
                .from('publicaciones')
                .upload(fileName, file);

            if (uploadError) {
                throw new Error(`Error en Storage: ${uploadError.message}. Asegúrate de que el bucket "publicaciones" exista y permita subidas.`);
            }

            const { data } = this.db.storage.from('publicaciones').getPublicUrl(fileName);
            urls.push(data.publicUrl);
        }

        return urls;
    }
}
