import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ChatMessageComponent, ChatMessage } from './chat-message/chat-message.component';
import { ChatService, GenerateResponse } from './services/chat.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ChatInputComponent, ChatMessageComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  showDrawModal = signal(false);
  pendingImageUrl = signal<string | null>(null);

  constructor(private chatService: ChatService) { }

  handleSend(content: string) {
    // ... existing code ...
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Initial scroll
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);

    // Call API
    this.isLoading.set(true);
    console.log('[App] Calling ChatService...');
    this.chatService.sendMessage(content).subscribe({
      next: (response: GenerateResponse) => {
        this.isLoading.set(false);
        console.log('[App] Response in component:', response);
        const aiMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'Ecco il disegno generato:',
          imageUrl: response.image_url
        };
        console.log('[App] Created AI message with URL:', aiMsg.imageUrl);
        this.messages.update(msgs => [...msgs, aiMsg]);
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('[App] Error in subscription:', err);
        const errorMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'ai',
          content: 'Scusa, si è verificato un errore durante la generazione del disegno.'
        };
        this.messages.update(msgs => [...msgs, errorMsg]);
        setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);
      }
    });
  }

  handleDraw(imageUrl: string) {
    this.pendingImageUrl.set(imageUrl);
    this.showDrawModal.set(true);
  }

  confirmDraw() {
    const url = this.pendingImageUrl();
    if (url) {
      console.log('Sending to plotter:', url);
      alert(`Inviato al plotter: ${url}`);
    }
    this.closeModal();
  }

  closeModal() {
    this.showDrawModal.set(false);
    this.pendingImageUrl.set(null);
  }
}
