import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [Navbar, RouterLink, RouterLinkActive],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed { }
