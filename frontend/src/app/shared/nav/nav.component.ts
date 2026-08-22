import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

/**
 * Persistent app chrome: a sticky top bar on desktop and a fixed bottom tab bar
 * on mobile. The app has no authentication (per spec), so this component holds
 * no session state — it is pure navigation between /habits and /about.
 */
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav.component.html',
  styleUrl: './nav.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavComponent {}
