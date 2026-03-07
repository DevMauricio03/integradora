import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvisosLegales } from '../../../shared/components/avisosLegales/avisosLegales';
import { TerminosCondiciones } from "../../../shared/components/avisosLegales/terminosCondiciones";

@Component({
  selector: 'app-bienvenida',
  standalone: true,
  imports: [RouterLink, AvisosLegales, TerminosCondiciones],
  templateUrl: './bienvenida.html',
  styleUrl: './bienvenida.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Bienvenida {
  mostrarAviso = signal(false);
  mostrarAcercaDe = signal(false);
  mostrarTerminos = signal(false);

  abrirAviso() {
    this.mostrarAviso.set(true);
  }

  cerrarAviso() {
    this.mostrarAviso.set(false);
  }

  abrirTerminos(){
    this.mostrarTerminos.set(true);
  }

  cerrarTerminos(){
    this.mostrarTerminos.set(false);
  }

  abrirAcercaDe() {
    this.mostrarAcercaDe.set(true);
  }

  cerrarAcercaDe() {
    this.mostrarAcercaDe.set(false);
  }
}
