import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-inicio-sesion',
  imports: [Navbar, RouterLink],
  templateUrl: './inicioSesion.html',
  styleUrl: './inicioSesion.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InicioSesion { }
