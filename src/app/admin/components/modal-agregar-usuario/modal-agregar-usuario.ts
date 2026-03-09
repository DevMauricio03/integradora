import { ChangeDetectionStrategy, Component, OnInit, inject, signal, computed, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ProfileService } from '../../../core/services/profile.service';
import { CatalogService } from '../../../core/services/catalog.service';
import { ModalBase } from '../../../shared/components/modalBase/modalBase';
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { SuccessModal } from '../../../shared/components/successModal/successModal';
import { form, required, email, submit, FormField, SchemaPathTree, pattern, validate, maxLength } from '@angular/forms/signals';

interface AgregarUsuarioFormModel {
    nombre: string;
    apellidos: string;
    correo: string;
    password: string;
    rol_id: string;
    universidad: string;
    carrera: string;
}

@Component({
    selector: 'app-modal-agregar-usuario',
    standalone: true,
    imports: [CommonModule, ModalBase, IconComponent, SuccessModal, FormField],
    templateUrl: './modal-agregar-usuario.html',
    styleUrls: ['./modal-agregar-usuario.css'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModalAgregarUsuario implements OnInit {
    closed = output<void>();
    refresh = output<any>();

    private readonly auth = inject(AuthService);
    private readonly profile = inject(ProfileService);
    private readonly catalog = inject(CatalogService);

    readonly roles = signal<any[]>([]);
    readonly universidades = signal<any[]>([]);
    readonly carreras = signal<any[]>([]);

    readonly carrerasFiltradas = signal<any[]>([]);

    readonly isProcessing = signal(false);
    readonly errorMessage = signal<string>('');
    readonly mostrarSuccess = signal(false);
    readonly newUserCreated = signal<any>(null);

    readonly formModel = signal<AgregarUsuarioFormModel>({
        nombre: '',
        apellidos: '',
        correo: '',
        password: '',
        rol_id: '',
        universidad: '',
        carrera: ''
    });

    readonly reqLength = computed(() => this.formModel().password.length >= 8);
    readonly reqUppercase = computed(() => /[A-Z]/.test(this.formModel().password));
    readonly reqNumber = computed(() => /\d/.test(this.formModel().password));
    readonly reqSpecial = computed(() => /[^A-Za-z\d]/.test(this.formModel().password));

    readonly registroForm = form(this.formModel, (schema: SchemaPathTree<AgregarUsuarioFormModel>) => {
        required(schema.nombre, { message: 'El nombre es obligatorio' });
        pattern(schema.nombre, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo se permiten letras' });
        maxLength(schema.nombre, 50, { message: 'Máximo 50 caracteres' });

        required(schema.apellidos, { message: 'Los apellidos son obligatorios' });
        pattern(schema.apellidos, /^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'Solo se permiten letras' });
        maxLength(schema.apellidos, 50, { message: 'Máximo 50 caracteres' });

        required(schema.correo, { message: 'El correo es obligatorio' });
        email(schema.correo, { message: 'Formato de correo inválido' });
        pattern(schema.correo, /^[^\s@]+@[^\s@]+\.edu(\.[a-z]+)?$/i, { message: 'Usa un correo institucional (.edu)' });
        maxLength(schema.correo, 50, { message: 'Máximo 50 caracteres' });

        required(schema.password, { message: 'Contraseña obligatoria' });
        validate(schema.password, (ctx) => {
            const val = ctx.value();
            if (val.length < 8) return { kind: 'length', message: 'Mínimo 8 caracteres' };
            if (!/[A-Z]/.test(val)) return { kind: 'upper', message: 'Una mayúscula' };
            if (!/\d/.test(val)) return { kind: 'number', message: 'Un número' };
            if (!/[^A-Za-z\d]/.test(val)) return { kind: 'special', message: 'Un carácter especial' };
            return null;
        });

        required(schema.rol_id, { message: 'Debe seleccionar un rol' });
        required(schema.universidad, { message: 'Debe seleccionar una universidad' });

        validate(schema.carrera, (ctx) => {
            const rolSeleccionado = ctx.valueOf(schema.rol_id);
            const rol = this.roles().find(r => r.id === rolSeleccionado);
            const val = ctx.value();
            if (rol && rol.nombre?.toLowerCase() === 'alumno' && !val) {
                return { kind: 'required', message: 'La carrera es obligatoria para alumnos' };
            }
            return null;
        });
    });

    ngOnInit() {
        this.loadData();
    }

    private async loadData(): Promise<void> {
        const [rolesRes, unisRes, carrRes] = await Promise.all([
            this.catalog.getRoles(),
            this.catalog.getUniversidades(),
            this.catalog.getCarreras()
        ]);

        if (rolesRes.data) this.roles.set(rolesRes.data);
        if (unisRes.data) this.universidades.set(unisRes.data);
        if (carrRes.data) {
            this.carreras.set(carrRes.data);
            this.carrerasFiltradas.set(carrRes.data);
        }
    }

    onRoleChange() {
        const rolId = this.formModel().rol_id;
        const rol = this.roles().find(r => r.id === rolId);
        if (rol && rol.nombre?.toLowerCase() === 'admin') {
            this.formModel.update(m => ({ ...m, carrera: '' }));
        }
    }

    onUniversidadChange() {
        this.formModel.update(m => ({ ...m, carrera: '' }));
    }

    async saveUser(event?: Event) {
        event?.preventDefault();
        if (this.registroForm().pending()) return;

        this.errorMessage.set('');

        submit(this.registroForm, async () => {
            this.isProcessing.set(true);

            try {
                const data = this.formModel();

                // 1. Auth Supabase
                const { data: authData, error: authError } = await this.auth.signUp(data.correo, data.password);

                if (authError) {
                    throw new Error(authError.message.includes('User already registered')
                        ? 'Este correo ya está registrado.'
                        : authError.message);
                }

                if (authData?.user) {
                    // 2. Perfil
                    const { error: profileError } = await this.profile.createProfile({
                        id: authData.user.id,
                        nombre: data.nombre,
                        apellidos: data.apellidos,
                        correoInstitucional: data.correo,
                        rol_id: data.rol_id,
                        universidad_id: data.universidad,
                        carrera_id: data.carrera || null
                    });

                    if (profileError) {
                        throw new Error(profileError.message);
                    }

                    // Construimos el usuario localmente para evitar recargas (Optimistic UI)
                    const rolLocal = this.roles().find(r => r.id === data.rol_id);
                    const uniLocal = this.universidades().find(u => u.id === data.universidad);

                    const optimistiUser = {
                        id: authData.user.id,
                        nombre: data.nombre,
                        apellidos: data.apellidos,
                        correoInstitucional: data.correo,
                        foto_url: null,
                        creado: new Date().toISOString(),
                        estado: 'activo',
                        roles: { nombre: rolLocal?.nombre },
                        universidades: { acronimo: uniLocal?.acronimo }
                    };

                    this.newUserCreated.set(optimistiUser);
                    this.mostrarSuccess.set(true);
                } else {
                    throw new Error('No se pudo crear el usuario.');
                }

            } catch (err) {
                this.errorMessage.set(err instanceof Error ? err.message : 'Error desconocido al registrar usuario');
            } finally {
                this.isProcessing.set(false);
            }
        });
    }

    handleSuccessConfirm() {
        this.mostrarSuccess.set(false);
        this.refresh.emit(this.newUserCreated());
        this.closed.emit();
    }
}
