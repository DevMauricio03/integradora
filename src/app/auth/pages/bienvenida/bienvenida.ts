import { ChangeDetectionStrategy, Component, signal, AfterViewInit, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
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
export class Bienvenida implements AfterViewInit, OnDestroy {
  mostrarAviso = signal(false);
  mostrarAcercaDe = signal(false);
  mostrarTerminos = signal(false);
  ocultarBotonScroll = signal(false);

  private observer: IntersectionObserver | null = null;
  private platformId = inject(PLATFORM_ID);

  ngAfterViewInit() {
    if (!isPlatformBrowser(this.platformId)) return;

    const target = document.getElementById('seccionAuth');
    if (!target) return;

    this.observer = new IntersectionObserver(
      ([entry]) => this.ocultarBotonScroll.set(entry.isIntersecting),
      { threshold: 0.3 }
    );
    this.observer.observe(target);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }

  scrollToAuth() {
    document.getElementById('seccionAuth')?.scrollIntoView({ behavior: 'smooth' });
  }

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
