import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { CreatePostComponent } from '../../create-post/create-post.component';
import { CommonModule } from '@angular/common';
import { IconComponent } from "../../icon/icon.component";

@Component({
  selector: 'app-post-card',
  standalone: true,
   imports: [CommonModule, IconComponent],
  templateUrl: './post-card.html',
  styleUrls: ['./post-card.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PostCardComponent {

  @Input() author!: string;
  @Input() role!: string;
  @Input() time!: string;
  @Input() title!: string;
  @Input() content!: string;
  @Input() badge?: string;
  @Input() image?: string;

}