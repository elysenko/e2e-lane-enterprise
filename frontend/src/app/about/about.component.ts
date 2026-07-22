import { ChangeDetectionStrategy, Component } from '@angular/core';
import { NavComponent } from '../shared/nav/nav.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [NavComponent],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {}
