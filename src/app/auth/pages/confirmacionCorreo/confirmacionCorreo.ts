import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../../core/services/supabase.service';

@Component({
  selector: 'app-confirmacion-correo',
  standalone: true,
  imports: [],
  templateUrl: './confirmacionCorreo.html',
  styles: `
    :host {
      display: block;
    }
  `,
})
export class ConfirmacionCorreo implements OnInit {

  constructor(
    private supabaseService: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data } = await this.supabaseService.getSession();

    if (data.session) {
      this.router.navigate(['/user/feed']);
    }
  }
}
