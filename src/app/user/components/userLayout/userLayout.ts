import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Navbar } from '../../../shared/components/navbar/navbar';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterModule,
  RouterOutlet
} from '@angular/router';

import { filter } from 'rxjs/operators';
import { IconComponent } from '../../../shared/components/icon/icon.component';
@Component({
  selector: 'app-user-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, RouterModule, Navbar, IconComponent],
  templateUrl: './userLayout.html',
  styleUrl: './userLayout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,

})
export class UserLayoutComponent {

  private router = inject(Router);
  private route = inject(ActivatedRoute);

  title = signal('');
  showCreateButton = signal(false);
  showSearch = signal(true);
  centerTitle = signal(false);

  constructor() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        const route = this.getDeepestChild(this.route);
        const data = route.snapshot.data;

        this.title.set(data['title'] || '');
        this.showCreateButton.set(data['showCreateButton'] || false);
        this.showSearch.set(data['hideSearch'] !== true);
        this.centerTitle.set(data['centerTitle'] === true);
      });
  }

  private getDeepestChild(route: ActivatedRoute): ActivatedRoute {
    while (route.firstChild) {
      route = route.firstChild;
    }
    return route;
  }
  goToCreate() {
    this.router.navigate(['/user/crear']);
  }
}