import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  imageUrl?: string;
  originalPrompt?: string;
  originalStyle?: 'icon' | 'illustration';
}

@Component({
  selector: 'app-chat-message',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chat-message.component.html',
  styles: []
})
export class ChatMessageComponent {
  @Input({ required: true }) message!: ChatMessage;
  @Output() draw = new EventEmitter<string>();
  @Output() regenerate = new EventEmitter<void>();

  onDraw() {
    if (this.message.imageUrl) {
      this.draw.emit(this.message.imageUrl);
    }
  }

  onImageError(event: Event) {
    console.error('[ChatMessage] Error loading image:', event);
  }

  onImageLoad() {
    console.log('[ChatMessage] Image loaded successfully:', this.message.imageUrl);
  }
}
