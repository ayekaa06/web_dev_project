import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Model } from '../../services/models';
import { DiagramComponent } from '../new-diagram/diagram.component';

@Component({
  selector: 'app-architecture-viewer',
  imports: [CommonModule, DiagramComponent],
  templateUrl: './architecture-viewer.html',
  styleUrl: './architecture-viewer.css'
})
export class ArchitectureViewer {
  @Input() architectures: string[] | null | undefined = null;
  @Input() model: Model | undefined;

  current = 0;

  get totalSlides() {
    return (this.architectures?.length || 0) + 1; // plus diagram slide
  }

  prev() {
    if (this.current > 0) this.current -= 1;
  }

  next() {
    if (this.current < this.totalSlides - 1) this.current += 1;
  }

  goTo(i: number) {
    if (i >= 0 && i < this.totalSlides) this.current = i;
  }

  isDiagramSlide() {
    return this.current === this.totalSlides - 1;
  }

  currentItem(): string | undefined {
    return this.architectures ? this.architectures[this.current] : undefined;
  }

  isImage(filename?: string) {
    if (!filename) return false;
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext);
  }
}
