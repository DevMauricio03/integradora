import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-perfil-publico-page',
  standalone: true,
  imports: [Navbar, RouterLink, RouterLinkActive],
  templateUrl: './perfil.html',
  styleUrls: ['./perfil.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PerfilPublicoPage implements OnInit {
  perfil: any;
  cargando = true;
  readonly defaultAvatarUrl = 'https://i.pinimg.com/236x/6c/55/d4/6c55d49dd6839b5b79e84a1aa6d2260d.jpg';

  constructor(
    private supabaseService: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  // Obtiene el perfil autenticado y actualiza la vista pública.
  async ngOnInit() {
    try {
      this.perfil = await this.supabaseService.getPerfilActual();
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  // Si falla la imagen del avatar, usa una imagen por defecto.
  onAvatarError(event: Event) {
    const imageElement = event.target as HTMLImageElement;
    imageElement.src = this.defaultAvatarUrl;
  }
}
