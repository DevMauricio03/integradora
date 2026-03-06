import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
    selector: 'app-confirmacion-correo',
    standalone: true,
    imports: [Navbar, RouterLink],
    templateUrl: './confirmacionCorreo.html',
    styleUrls: ['./confirmacionCorreo.css']
})
export class ConfirmacionCorreo {

}
