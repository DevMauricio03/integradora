import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { ReportService } from '../../../core/services/report.service';
import { PostCardComponent } from '../../../shared/components/Post-card/post-card/post-card';
import { Comentarios } from '../../components/comentarios/comentarios';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';

@Component({
  selector: 'app-experiencia-detalle-page',
  standalone: true,
  imports: [PostCardComponent, Comentarios, ReportModalComponent, SuccessModal],
  templateUrl: './experienciaDetalle.html',
  styleUrls: ['./experienciaDetalle.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExperienciaDetallePage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly postStore = inject(PostStoreService);
  private readonly reportSvc = inject(ReportService);

  readonly post = signal<Post | null>(null);
  readonly isLoading = signal(true);
  readonly notFound = signal(false);
  readonly showReportModal = signal(false);
  readonly showSuccessReport = signal(false);
  readonly selectedPostForReport = signal<Post | null>(null);
  readonly isReporting = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); this.isLoading.set(false); return; }

    try {
      const result = await this.postStore.getPostById(id);
      if (result) {
        this.post.set(result);
      } else {
        this.notFound.set(true);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  volver() {
    this.router.navigate(['/user/experiencias']);
  }

  openReportModal(post: Post) {
    this.selectedPostForReport.set(post);
    this.showReportModal.set(true);
  }

  closeReportModal() {
    this.showReportModal.set(false);
    this.selectedPostForReport.set(null);
  }

  async handleReport(event: { reason: string; details: string }) {
    const post = this.selectedPostForReport();
    if (!post) return;

    this.isReporting.set(true);

    try {
      const result = await this.reportSvc.reportPost(post, event);

      if (!result.success) {
        console.error('Error al reportar:', result.error);
        return;
      }

      this.closeReportModal();
      this.showSuccessReport.set(true);
    } catch (err) {
      console.error('Error al reportar:', err);
    } finally {
      this.isReporting.set(false);
    }
  }
}
