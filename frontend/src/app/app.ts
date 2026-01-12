import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from './header/header.component';
import { ChatInputComponent } from './chat-input/chat-input.component';
import { ChatMessageComponent, ChatMessage } from './chat-message/chat-message.component';
import { ChatService, GenerateResponse, PrintPayload } from './services/chat.service';
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
  pendingPrintPayload = signal<PrintPayload | null>(null);

  constructor(private chatService: ChatService) {
    // Restore history
    const saved = localStorage.getItem('plotter_chat_history');
    if (saved) {
      try {
        this.messages.set(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse chat history', e);
      }
    }

    // Persist history
    effect(() => {
      localStorage.setItem('plotter_chat_history', JSON.stringify(this.messages()));
    });
  }

  handleSend(payload: { prompt: string, style: 'icon' | 'illustration' }) {
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

  handleComposerPrint(payload: PrintPayload) {
    this.pendingPrintPayload.set(payload);
    this.showDrawModal.set(true); // Open Safety Modal
  }

  handleComposerCancel() {
    this.showComposer.set(false);
    this.pendingImageUrl.set(null);
  }

  confirmDraw() {
    const payload = this.pendingPrintPayload();
    if (payload) {
      console.log('Sending to plotter:', payload);
      this.chatService.printImage(payload).subscribe({
        next: () => {
          alert('Disegno inviato correttamente al plotter!');
          this.closeModal();
        },
        error: (err) => {
          console.error('Error printing:', err);
          alert('Errore invio al plotter. Controlla la console.');
          // We close modal anyway? Or stick around?
          this.closeModal();
        }
      });
    } else {
      this.closeModal();
    }
  }

  closeModal() {
    this.showDrawModal.set(false);
    this.pendingPrintPayload.set(null);
  }
}
