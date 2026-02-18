import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-correo-enviado',
  standalone: true,
  imports: [Navbar, RouterLink],
  templateUrl: './correoEnviado.html',
  styleUrls: ['./correoEnviado.css']
})
export class CorreoEnviado { }
