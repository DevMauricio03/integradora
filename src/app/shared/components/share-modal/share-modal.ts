import { Component, EventEmitter, Input, Output, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { ModalBase } from '../modalBase/modalBase';

@Component({
  selector: 'app-share-modal',
  standalone: true,
  imports: [CommonModule, IconComponent, ModalBase],
  template: `
    <app-modal-base (closed)="close()" ancho="480px">
      <div class="share-container">
        <header class="share-header">
          <div class="icon-share">
            <app-icon name="share" [size]="24"></app-icon>
          </div>
          <h2>Compartir publicación</h2>
          <p>Puedes compartir esta publicación usando el siguiente enlace.</p>
        </header>

        <div class="url-box">
          <input 
            type="text" 
            [value]="url" 
            readonly 
            class="url-input"
            #urlInput
          >
          <button 
            class="btn-copy" 
            (click)="copyToClipboard()"
            [class.copied]="copied()"
          >
            <app-icon [name]="copied() ? 'check' : 'plus'" [size]="18"></app-icon>
            {{ copied() ? '¡Copiado!' : 'Copiar enlace' }}
          </button>
        </div>

        <footer class="share-footer">
          <button class="btn-close" (click)="close()">Cerrar</button>
        </footer>
      </div>
    </app-modal-base>
  `,
  styles: `
    .share-container {
      text-align: center;
    }

    .share-header {
      margin-bottom: 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .icon-share {
      width: 56px;
      height: 56px;
      background: #EEF2FF;
      color: #135BEC;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .share-header h2 {
      font-size: 20px;
      font-weight: 800;
      color: #111827;
      margin: 0 0 8px 0;
    }

    .share-header p {
      color: #6B7280;
      font-size: 14px;
      line-height: 1.5;
      margin: 0;
    }

    .url-box {
      background: #F9FAFB;
      border: 1px solid #E5E7EB;
      border-radius: 12px;
      padding: 8px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 24px;
    }

    .url-input {
      width: 100%;
      border: 1px solid #E5E7EB;
      background: white;
      padding: 12px 16px;
      border-radius: 8px;
      font-family: 'monospace';
      font-size: 13px;
      color: #374151;
      outline: none;
      box-sizing: border-box;
    }

    .btn-copy {
      width: 100%;
      padding: 12px;
      border-radius: 8px;
      border: none;
      background: #135BEC;
      color: white;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.2s;
    }

    .btn-copy:hover {
      background: #0D4FD8;
    }

    .btn-copy.copied {
      background: #059669;
    }

    .share-footer {
      display: flex;
      justify-content: center;
    }

    .btn-close {
      padding: 10px 24px;
      border: none;
      background: transparent;
      color: #6B7280;
      font-weight: 600;
      cursor: pointer;
      font-size: 14px;
    }

    .btn-close:hover {
      color: #111827;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareModalComponent {
  @Input() url: string = '';
  @Output() closed = new EventEmitter<void>();

  copied = signal(false);

  copyToClipboard() {
    navigator.clipboard.writeText(this.url).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }

  close() {
    this.closed.emit();
  }
}
