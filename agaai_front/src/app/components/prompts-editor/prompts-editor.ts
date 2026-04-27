import { Component, EventEmitter, Output, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Model } from '../../services/models';
import { showToast } from '../toast/toast';
import { CommonModule } from '@angular/common';
import { Prompt } from '../../types/ml_model';

@Component({
  selector: 'app-prompts-editor',
  imports: [FormsModule, CommonModule],
  templateUrl: './prompts-editor.html',
  styleUrl: './prompts-editor.css'
})
export class PromptsEditor {
  @Input() model!: Model | null;
  @Output() saved = new EventEmitter<{ property: string; value: any }>();
  @Output() nestedUpdate = new EventEmitter<{ property: string; operation: 'add' | 'remove'; value: any }>();

  newPrompt: Prompt = { name: '', prompt_template: '' };

  add() {
    if (!this.model || !this.newPrompt.prompt_template.trim()) return;
    showToast('Prompt added');
    this.nestedUpdate.emit({ property: 'prompts', operation: 'add', value: { prompt_name: this.newPrompt.name, prompt_template: this.newPrompt.prompt_template } });
    this.newPrompt = { name: '', prompt_template: '' };
  }

  remove(idx: number) {
    if (!this.model) return;
    const removed = (this.model.prompts || [])[idx];
    showToast('Prompt removed');
    const removePayload = { prompt_name: removed.name };
    this.nestedUpdate.emit({ property: 'prompts', operation: 'remove', value: removePayload });
  }
}
