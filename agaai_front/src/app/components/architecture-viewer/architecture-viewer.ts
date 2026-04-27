import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Model } from '../../services/models';
import { DiagramComponent } from '../new-diagram/diagram.component';
import { ArchitectureFile } from '../../types/ml_model';

@Component({
  selector: 'app-architecture-viewer',
  imports: [CommonModule, DiagramComponent],
  templateUrl: './architecture-viewer.html',
  styleUrl: './architecture-viewer.css',
})
export class ArchitectureViewer {
  @Input() architectures: ArchitectureFile[] | null | undefined = null;
  @Input() model: Model | undefined;
  @Output() fileUpload = new EventEmitter<File>();
  @Output() jsonUploaded = new EventEmitter<any>();
  @Output() deleteFile = new EventEmitter<number | string>();

  current = 0;

  get totalSlides() {
    console.log('Architectures:', this.architectures);
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
    console.log(this.architectures, this.current);
    return this.architectures ? this.architectures[this.current].file : undefined;
  }

  isImage(filename?: string) {
    if (!filename) return false;
    console.log(typeof filename, filename)
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    return ['png', 'jpg', 'jpeg', 'svg', 'gif', 'webp'].includes(ext);
  }

  handleFileInput(ev: Event) {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const f = input.files[0];
    this.fileUpload.emit(f);
    // clear input so same file can be reselected if needed
    input.value = '';
  }

  filePathFromItem(item: ArchitectureFile | string | undefined): string | undefined {
    if (!item) return undefined;
    if (typeof item === 'string') return item;
    return item.file;
  }

  fileIdFromItem(item: ArchitectureFile | string | undefined): number | string | null {
    if (!item) return null;
    if (typeof item === 'object' && (item as ArchitectureFile).id) return (item as ArchitectureFile).id;
    return null;
  }

  handleDeleteItem(item: ArchitectureFile | string | undefined) {
    const id = this.fileIdFromItem(item);
    if (id != null) {
      this.deleteFile.emit(id);
    } else {
      const path = this.filePathFromItem(item);
      if (path) this.deleteFile.emit(path);
    }
  }
}
