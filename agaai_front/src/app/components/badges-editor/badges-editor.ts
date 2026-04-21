import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badges-editor',
  imports: [FormsModule,CommonModule],
  templateUrl: './badges-editor.html',
  styleUrl: './badges-editor.css'
})
export class BadgesEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();

  badge = '';

  ngOnChanges(changes: SimpleChanges) {
    if (this.model) {
      this.badge = (this.model.badges && this.model.badges.length) ? this.model.badges[0] : '';
    }
  }

  save() {
    if (!this.model) return;
    const newBadges = this.badge.trim() ? [this.badge.trim()] : [];
    showToast('Badge saved');
    this.saved.emit({ property: 'badges', value: newBadges });
  }
}
