import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal, output } from '@angular/core';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
    selector: 'app-usuario-detalle-modal',
    standalone: true,
    imports: [ModalBase, StatusBadge, IconComponent, CommonModule],
    templateUrl: './usuario-detalle-modal.html',
    styleUrls: ['./usuario-detalle-modal.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsuarioDetalleModal implements OnInit {
    @Input() usuario: any;
    closed = output<void>();
    refresh = output<void>();

    private readonly supabase = inject(SupabaseService);

    roles = signal<{ id: string; nombre: string }[]>([]);
    isEditingRole = signal(false);
    isProcessing = signal(false);

    // Estados para alertas y confirmaciones
    mostrarConfirmacion = signal(false);
    confirmacionConfig = signal<{
        titulo: string;
        textoBoton: string;
        mensaje: string;
        tipo: 'danger' | 'info';
        accion: () => Promise<void>;
    }>({ titulo: '', textoBoton: '', mensaje: '', tipo: 'info', accion: async () => { } });

    mensajeFeedback = signal<{ visible: boolean; mensaje: string; tipo: 'success' | 'error' }>({ visible: false, mensaje: '', tipo: 'success' });

    actividadesRecientes = signal<{ titulo: string, subtitulo: string, color: string }[]>([]);

    ngOnInit() {
        this.initialLoad();
    }

    private async initialLoad() {
        const { data } = await this.supabase.getRolesList();
        if (data) this.roles.set(data);
        this.cargarActividadReciente();
    }

    async cargarActividadReciente() {
        const result: { titulo: string, subtitulo: string, color: string }[] = [];
        const { data: posts } = await this.supabase.getUserRecentPosts(this.usuario.id, 2);

        if (posts && posts.length > 0) {
            posts.forEach((p: { titulo: string; tipo: string; creado: string }) => {
                const limitStr = p.titulo.length > 30 ? '...' : '';
                result.push({
                    titulo: `Publicó un ${p.tipo.toLowerCase()}: ${p.titulo.substring(0, 30)}${limitStr}`,
                    subtitulo: this.formatDate(p.creado),
                    color: this.colorPorTipo(p.tipo)
                });
            });
        }

        result.push({
            titulo: 'Inició sesión recientemente',
            subtitulo: 'Actividad de cuenta',
            color: 'var(--primary)'
        });

        // Limita a las 2 actividades mas recientes
        this.actividadesRecientes.set(result.slice(0, 2));
    }

    formatDate(dateStr: string): string {
        if (!dateStr) return 'N/A';
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-MX', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    }

    mostrarFeedback(mensaje: string, tipo: 'success' | 'error') {
        this.mensajeFeedback.set({ visible: true, mensaje, tipo });
        setTimeout(() => this.mensajeFeedback.set({ visible: false, mensaje: '', tipo: 'success' }), 3000);
    }

    toggleEditRole() {
        this.isEditingRole.update(v => !v);
    }

    async onRoleSelect(event: Event) {
        const select = event.target as HTMLSelectElement;
        const roleId = select.value;
        if (!roleId) return;

        this.isProcessing.set(true);
        const { error } = await this.supabase.updateUserRole(this.usuario.id, roleId);

        if (error) {
            this.mostrarFeedback('Error al actualizar el rol: ' + error.message, 'error');
        } else {
            // Actualizamos localmente para el modal
            const selectedRole = this.roles().find(r => r.id === roleId);
            if (selectedRole) {
                this.usuario.roles = { nombre: selectedRole.nombre };
                this.usuario.rol_id = roleId;
            }
            this.isEditingRole.set(false);
            this.refresh.emit(); // Notificar al padre para que recargue la lista
            this.mostrarFeedback('Rol actualizado con éxito', 'success');
        }
        this.isProcessing.set(false);
    }

    private colorPorTipo(tipo: string): string {
        if (tipo === 'evento') return '#8B5CF6';
        if (tipo === 'aviso') return '#F59E0B';
        return '#10B981';
    }

    prepararRestablecerContrasena() {
        this.confirmacionConfig.set({
            titulo: 'Restablecer contraseña',
            textoBoton: 'Enviar correo',
            mensaje: `¿Seguro que deseas enviar un correo de restablecimiento de contraseña a ${this.usuario.correoInstitucional}?`,
            tipo: 'info',
            accion: async () => {
                this.isProcessing.set(true);
                const { error } = await this.supabase.resetPassword(this.usuario.correoInstitucional);
                if (error) {
                    this.mostrarFeedback('No se pudo enviar el correo: ' + error.message, 'error');
                } else {
                    this.mostrarFeedback('Correo de restablecimiento enviado exitosamente.', 'success');
                }
                this.isProcessing.set(false);
                this.mostrarConfirmacion.set(false);
            }
        });
        this.mostrarConfirmacion.set(true);
    }

    prepararSuspenderCuenta() {
        const esSuspender = this.usuario.estado !== 'suspendido';
        this.confirmacionConfig.set({
            titulo: esSuspender ? 'Suspender cuenta' : 'Activar cuenta',
            textoBoton: esSuspender ? 'Sí, suspender' : 'Sí, activar',
            mensaje: esSuspender
                ? '¿Estás seguro de que deseas suspender esta cuenta? El usuario ya no podrá acceder a la plataforma.'
                : '¿Deseas activar nuevamente esta cuenta para permitirle el acceso?',
            tipo: esSuspender ? 'danger' : 'info',
            accion: async () => {
                this.isProcessing.set(true);
                const nuevoEstado = esSuspender ? 'suspendido' : 'activo';
                const { error } = await this.supabase.updateUserStatus(this.usuario.id, nuevoEstado);

                if (error) {
                    this.mostrarFeedback('Error al actualizar el estado: ' + error.message, 'error');
                } else {
                    this.mostrarFeedback(esSuspender ? 'Cuenta suspendida con éxito.' : 'Cuenta activada con éxito.', 'success');
                    this.usuario.estado = nuevoEstado;
                    this.refresh.emit();
                }
                this.isProcessing.set(false);
                this.mostrarConfirmacion.set(false);
            }
        });
        this.mostrarConfirmacion.set(true);
    }

    ejecutarConfirmacion() {
        this.confirmacionConfig().accion();
    }
}
