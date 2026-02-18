import { Component } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-feed',
  standalone: true,
  imports: [Navbar],
  templateUrl: './feed.html',
  styleUrls: ['./feed.css'],
})
export class Feed { }
