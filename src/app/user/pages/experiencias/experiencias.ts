import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PostStoreService, Post } from '../../../core/services/post-store.service';
import { ReportService } from '../../../core/services/report.service';
import { PostCardComponent } from "../../../shared/components/Post-card/post-card/post-card";
import { IconComponent } from '../../../shared/components/icon/icon.component';
import { PostSkeletonComponent } from '../../../shared/components/post-skeleton/post-skeleton.component';
import { ReportModalComponent } from '../../../shared/components/report-modal/report-modal';
import { SuccessModal } from '../../../shared/components/successModal/successModal';

@Component({
  selector: 'app-experiencias',
  standalone: true,
  imports: [CommonModule, PostCardComponent, IconComponent, PostSkeletonComponent, ReportModalComponent, SuccessModal],
  templateUrl: './experiencias.html',
  styleUrls: ['./experiencias.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Experiencias implements OnInit {
  private readonly postStore = inject(PostStoreService);
  private readonly router = inject(Router);
  private readonly reportSvc = inject(ReportService);

  readonly posts = signal<Post[]>([]);
  readonly isLoading = signal(true);
  readonly showReportModal = signal(false);
  readonly showSuccessReport = signal(false);
  readonly selectedPostForReport = signal<Post | null>(null);
  readonly isReporting = signal(false);

  async ngOnInit() {
    this.isLoading.set(true);
    try {
      const result = await this.postStore.getPostsByTipo('experiencia');
      this.posts.set(result);
    } finally {
      this.isLoading.set(false);
    }
  }

  verExperiencia(postId: string) {
    this.router.navigate(['/user/experiencias', postId]);
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
