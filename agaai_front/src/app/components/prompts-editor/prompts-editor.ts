import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-prompts-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './prompts-editor.html',
  styleUrl: './prompts-editor.css'
})
export class PromptsEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();

  newPrompt = '';

  add() {
    if (!this.model || !this.newPrompt.trim()) return;
    const newPrompts = [...(this.model.prompts || []), this.newPrompt.trim()];
    this.newPrompt = '';
    showToast('Prompt added');
    this.saved.emit({ property: 'prompts', value: newPrompts });
  }

  remove(idx: number) {
    if (!this.model) return;
    const newPrompts = (this.model.prompts || []).filter((_, i) => i !== idx);
    showToast('Prompt removed');
    this.saved.emit({ property: 'prompts', value: newPrompts });
  }
}
