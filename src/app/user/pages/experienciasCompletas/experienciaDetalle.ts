import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-experiencia-detalle-page',
  standalone: true,
  imports: [Navbar],
  templateUrl: './experienciaDetalle.html',
  styleUrls: ['./experienciaDetalle.css']
})
export class ExperienciaDetallePage {
  constructor(private readonly router: Router) { }
  volver() {
    this.router.navigate(['/user/experiencias']);
  }
}