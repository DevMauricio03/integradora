export interface Perfil {
    id: string;
    nombre: string;
    apellidos: string;
    correoInstitucional: string;
    rol_id?: string;
    universidad_id?: string;
    carrera_id?: string | null;
    foto_url?: string | null;
    anio_graduacion?: number | null;
    creado?: string;
    actualizado?: string;
    estado?: string;
    /** Expiry timestamp of an active suspension. Null = not suspended. Past date = suspension expired (treated as active). */
    fecha_suspension?: string | null;
    roles?: { nombre: string } | { nombre: string }[];
    universidades?: { nombre: string; acronimo: string } | { nombre: string; acronimo: string }[];
    carrera?: { nombre: string; id: string } | null;
}

export interface Universidad {
    id: string;
    nombre: string;
    acronimo: string;
}

export interface Carrera {
    id: string;
    nombre: string;
}

export interface Rol {
    id: string;
    nombre: string;
}

export interface PostDetalles {
    startDate?: string;
    endDate?: string;
    modality?: string;
    location?: string;
    cost?: string;
    subtype?: string;
    price?: number;
    priceUnit?: string;
    contactMethod?: string;
    phoneNumber?: string;
    productStatus?: string;
    availability?: string;
    serviceType?: string;
    availableHours?: string;
    company?: string;
    area?: string;
    period?: string;
    recommendation?: string;
}

export interface Post {
    id?: string;
    titulo: string;
    descripcion: string;
    tipo: 'evento' | 'oferta' | 'experiencia';
    autor_id: string;
    estado: string;
    imagen_url?: string | null;
    imagenes_url?: string[] | null;
    categoria?: string;
    detalles: PostDetalles;
    creado?: string;
    perfiles?: Perfil;
}

export interface Anuncio {
    id?: string;
    titulo: string;
    descripcion: string;
    imagen_url: string | null;
    contacto_url: string | null;
    ciudad: string;
    estado: string;
    activo: boolean;
    fecha_inicio: string;
    fecha_fin: string;
    creado?: string;
}

export interface Reporte {
    id?: string;
    publicacion_id: string;
    autor_id: string;
    informante_id: string;
    motivo: string;
    detalles?: string;
    estado: 'pendiente' | 'resuelto' | 'rechazado';
    creado?: string;
    publicaciones?: Post;
    perfiles?: Perfil; // Informante
}

export interface Notificacion {
    id: string;
    user_id: string;
    tipo: string;
    mensaje: string;
    leido: boolean;
    creado: string;
    post_id?: string | null;           // Contexto: post relacionado
    comentario_id?: string | null;     // Contexto: comentario relacionado
}
