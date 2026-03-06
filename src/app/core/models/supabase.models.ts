export interface Perfil {
    id: string;
    nombre: string;
    apellidos: string;
    correoInstitucional: string;
    rol_id?: string;
    universidad_id?: string;
    carrera_id?: string | null;
    foto_url?: string | null;
    foto_perfil?: string | null;
    creado?: string;
    estado?: string;
    fecha_suspension?: string | null;
    anioGraduacion?: string;
    roles?: {
        nombre: string;
    } | { nombre: string }[];
    universidades?: {
        acronimo: string;
    } | { acronimo: string }[];
    carrera?: {
        nombre: string;
    };
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
