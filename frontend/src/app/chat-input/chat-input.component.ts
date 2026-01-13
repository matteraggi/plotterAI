import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-input.component.html',
  styles: []
})
export class ChatInputComponent {
  @Output() send = new EventEmitter<{ prompt: string, style: 'icon' | 'illustration' }>();
  prompt = '';
  style: 'icon' | 'illustration' = 'icon';

  toggleStyle() {
    this.style = this.style === 'icon' ? 'illustration' : 'icon';
  }

  sendPrompt() {
    if (this.prompt.trim()) {
      this.send.emit({ prompt: this.prompt.trim(), style: this.style });
      this.prompt = '';
    }
  }

  onEnter(event: Event) {
    const kEvent = event as KeyboardEvent;
    if (kEvent.key === 'Enter' && !kEvent.shiftKey) {
      kEvent.preventDefault();
      this.sendPrompt();
    }
  }
}
