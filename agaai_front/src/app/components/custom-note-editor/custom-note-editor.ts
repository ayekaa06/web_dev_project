import { Component, EventEmitter, Output, Input, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-custom-note-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './custom-note-editor.html',
  styleUrl: './custom-note-editor.css'
})
export class CustomNoteEditor implements OnChanges {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();

  draft = '';

  ngOnChanges(changes: SimpleChanges) {
    if (this.model) {
      this.draft = this.model.custom_note ?? '';
    }
  }

  save() {
    if (!this.model) return;
    const newNote = this.draft.trim() || null;
    showToast('Custom note saved');
    this.saved.emit({ property: 'custom_note', value: newNote });
  }
}
    