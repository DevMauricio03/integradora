import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StatusBadge } from '../../../shared/components/statusBadge/statusBadge';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [StatusBadge],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard { }
