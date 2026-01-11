import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ChatMessageComponent, ChatMessage } from './chat-message/chat-message.component';
import { ChatService, GenerateResponse } from './services/chat.service';
import { ComposerComponent } from './composer/composer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, HeaderComponent, ChatInputComponent, ChatMessageComponent, ComposerComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App {
  messages = signal<ChatMessage[]>([]);
  isLoading = signal(false);
  showDrawModal = signal(false);
  showComposer = signal(false);
  pendingImageUrl = signal<string | null>(null);

  constructor(private chatService: ChatService) { }

  handleSend(payload: { prompt: string, style: 'icon' | 'illustration' }) {
    // ... (previous code same)
    const { prompt, style } = payload;
    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: prompt
    };
    this.messages.update(msgs => [...msgs, userMsg]);

    // Initial scroll
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 50);

    // Call API
    this.isLoading.set(true);
    console.log('[App] Calling ChatService...');
    this.chatService.sendMessage(prompt, style).subscribe({
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
    this.showComposer.set(true); // Open Composer first
  }

  handleComposerPrint(currentImageUrl: string) {
    // In a real app we would pass the modified SVG/Coordinates.
    // For now we pass the original image URL but this is the trigger point.
    this.showComposer.set(false);
    this.showDrawModal.set(true); // Open Safety Modal
  }

  handleComposerCancel() {
    this.showComposer.set(false);
    this.pendingImageUrl.set(null);
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
    // Don't clear pendingImageUrl here if we want to go back to composer? 
    // Usually printing finishes the flow.
    this.pendingImageUrl.set(null);
  }
}
