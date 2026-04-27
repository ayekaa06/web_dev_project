import { Component, EventEmitter, Input, Output, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';
import { badgeName } from '../../types/model-record';

@Component({
  selector: 'app-badges-editor',
  imports: [FormsModule,CommonModule],
  templateUrl: './badges-editor.html',
  styleUrl: './badges-editor.css'
})
export class BadgesEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();
  @Output() nestedUpdate = new EventEmitter<{ property: string; operation: 'add' | 'remove'; value: any }>();

  badge = '';

  ngOnChanges(changes: SimpleChanges) {
    if (this.model) {
      this.badge = this.model.badges && this.model.badges.length ? badgeName(this.model.badges[0]) : '';
    }
  }

  save() {
    if (!this.model) return;
    const newBadges = this.badge.trim() ? [...(this.model.badges || []), this.badge.trim()] : [...(this.model.badges || [])];
    showToast('Badge saved');
    // this.saved.emit({ property: 'badges', value: newBadges });
    this.nestedUpdate.emit({ property: 'badges', operation: 'add', value: { badge_name: this.badge.trim() } });
  }

  remove(idx: number) {
    if (!this.model) return;
    const removed = (this.model.badges || [])[idx];
    const newBadges = (this.model.badges || []).filter((_, i) => i !== idx);
    showToast('Badge removed');
    // this.saved.emit({ property: 'badges', value: newBadges });
    const payload = {badge_name: removed.name}
    this.nestedUpdate.emit({ property: 'badges', operation: 'remove', value: payload });
  }
}
