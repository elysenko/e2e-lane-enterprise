import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../../shared/nav/nav.component';
import { ServiceSetting } from '../../core/models';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule, NavComponent],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  // Provisioned services surfaced via /api/admin/settings. Declared as a
  // signal<ServiceSetting[]> so service_agent can wire it to the masked
  // GET /api/admin/settings response and PATCH upserts.
  services = signal<ServiceSetting[]>([
    {
      key: 'postgresql',
      label: 'PostgreSQL',
      description: 'Primary relational database connection.',
      configured: true,
      maskedValue: 'postgres://····:····@db:5432/app',
      fields: [
        {
          key: 'DATABASE_URL',
          label: 'Connection URL',
          placeholder: 'postgres://user:pass@host:5432/db',
          masked: 'postgres://····:····@db:5432/app',
        },
      ],
    },
    {
      key: 'minio',
      label: 'MinIO Object Storage',
      description: 'S3-compatible bucket storage for file uploads.',
      configured: false,
      maskedValue: 'Not configured',
      fields: [
        {
          key: 'MINIO_ENDPOINT',
          label: 'Endpoint',
          placeholder: 'https://minio.internal:9000',
          masked: '',
        },
        {
          key: 'MINIO_ACCESS_KEY',
          label: 'Access key',
          placeholder: 'AKIA…',
          masked: '',
        },
        {
          key: 'MINIO_SECRET_KEY',
          label: 'Secret key',
          placeholder: '••••••••',
          masked: '',
        },
      ],
    },
  ]);

  saved = signal<string | null>(null);

  save(service: ServiceSetting): void {
    // Mockup only — PATCH /api/admin/settings is wired by service_agent.
    this.saved.set(service.label);
  }
}
