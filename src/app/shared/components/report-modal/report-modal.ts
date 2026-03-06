import { Component, EventEmitter, Input, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../icon/icon.component';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-report-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, ModalBase],
  template: `
    <app-modal-base (closed)="close()" ancho="500px">
      <div class="report-container">
        <header class="report-header">
          <div class="icon-warning">
            <app-icon name="alert-triangle" [size]="24"></app-icon>
          </div>
          <h2>Reportar publicación</h2>
          <p>Ayúdanos a entender qué está pasando con esta publicación de <strong>{{ post?.author || 'un usuario' }}</strong>.</p>
        </header>

        <div class="reasons-grid">
          @for (reason of reasons; track reason.id) {
            <button 
              type="button" 
              class="reason-card" 
              [class.selected]="selectedReason() === reason.id"
              (click)="selectReason(reason.id)"
            >
              <div class="reason-info">
                <span class="reason-title">{{ reason.title }}</span>
                <span class="reason-desc">{{ reason.description }}</span>
              </div>
              @if (selectedReason() === reason.id) {
                <app-icon name="check-circle" [size]="20" class="check-icon"></app-icon>
              }
            </button>
          }
        </div>

        @if (selectedReason() === 'otro') {
          <div class="other-reason-box">
            <textarea 
              placeholder="Cuéntanos más detalles sobre el problema..."
              [(ngModel)]="otherDetails"
              class="details-area"
            ></textarea>
          </div>
        }

        <footer class="report-footer">
          <button class="btn-cancel" (click)="close()">Cancelar</button>
          <button 
            class="btn-submit" 
            [disabled]="!selectedReason() || (selectedReason() === 'otro' && !otherDetails)"
            (click)="submitReport()"
          >
            Enviar reporte
          </button>
        </footer>
      </div>
    </app-modal-base>
  `,
  styles: `
    .report-container {
      text-align: left;
    }

    .report-header {
      margin-bottom: 32px;
    }

    .icon-warning {
      width: 56px;
      height: 56px;
      background: #FEF2F2;
      color: #EF4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .report-header h2 {
      font-size: 24px;
      font-weight: 800;
      color: #111827;
      margin-bottom: 8px;
    }

    .report-header p {
      color: #6B7280;
      font-size: 14px;
      line-height: 1.5;
    }

    .reasons-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
      text-align: left;
    }

    .reason-card {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border: 2px solid #F3F4F6;
      border-radius: 16px;
      background: white;
      cursor: pointer;
      transition: all 0.2s;
      text-align: left;
    }

    .reason-card:hover {
      border-color: #EF444433;
      background: #FEF2F233;
    }

    .reason-card.selected {
      border-color: #EF4444;
      background: #FEF2F233;
    }

    .reason-info {
      display: flex;
      flex-direction: column;
      align-items: flex-start;
      gap: 2px;
      flex: 1;
    }

    .reason-title {
      font-weight: 700;
      color: #111827;
      font-size: 15px;
    }

    .reason-desc {
      font-size: 12px;
      color: #6B7280;
    }

    .check-icon {
      color: #EF4444;
    }

    .other-reason-box {
      margin-bottom: 24px;
      animation: slideDown 0.3s ease-out;
    }

    .details-area {
      width: 100%;
      height: 100px;
      padding: 16px;
      border-radius: 16px;
      border: 2px solid #F3F4F6;
      background: #F9FAF9;
      font-family: inherit;
      resize: none;
      box-sizing: border-box;
    }

    .details-area:focus {
      outline: none;
      border-color: #EF4444;
      background: white;
    }

    .report-footer {
      display: flex;
      gap: 16px;
    }

    .btn-cancel {
      flex: 1;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: #F3F4F6;
      color: #4B5563;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s;
    }

    .btn-submit {
      flex: 2;
      padding: 14px;
      border-radius: 12px;
      border: none;
      background: #EF4444;
      color: white;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(239, 68, 68, 0.25);
      transition: all 0.2s;
    }

    .btn-submit:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportModalComponent {
  @Input() post: any;
  @Output() closed = new EventEmitter<void>();
  @Output() reported = new EventEmitter<{ reason: string, details: string }>();

  selectedReason = signal<string | null>(null);
  otherDetails: string = '';

  reasons = [
    { id: 'spam', title: 'Contenido no deseado o spam', description: 'Publicidad excesiva o mensajes repetitivos.' },
    { id: 'harassment', title: 'Acoso o incitación al odio', description: 'Insultos, discriminación o comportamiento violento.' },
    { id: 'inappropriate', title: 'Contenido inapropiado', description: 'Material sexualmente explícito o contenido ofensivo.' },
    { id: 'scam', title: 'Fraude o estafa', description: 'Intento de engaño con fines de lucro o robo de datos.' },
    { id: 'otro', title: 'Otro motivo', description: 'Si el problema no encaja en las categorías anteriores.' }
  ];

  selectReason(id: string) {
    this.selectedReason.set(id);
  }

  close() {
    this.closed.emit();
  }

  submitReport() {
    const reason = this.reasons.find(r => r.id === this.selectedReason())?.title || 'Otro';
    this.reported.emit({ reason, details: this.otherDetails });
  }
}
