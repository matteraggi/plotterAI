import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-950 p-4 pb-6 border-t border-zinc-200 dark:border-zinc-800">
      <div class="max-w-screen-md mx-auto relative">
        <textarea 
          [(ngModel)]="prompt" 
          (keydown.enter)="onEnter($event)"
          placeholder="Chiedi a PlotterAI di disegnare qualcosa..."
          class="w-full bg-zinc-100 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-2xl pl-4 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none overflow-hidden min-h-[52px] max-h-32"
          rows="1"
        ></textarea>
        
        <button 
          (click)="sendPrompt()"
          [disabled]="!prompt.trim()"
          class="absolute right-2 bottom-2.5 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-300 disabled:dark:bg-zinc-800 text-white rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
        </button>
      </div>
      <div class="text-center mt-2">
         <p class="text-xs text-zinc-400 dark:text-zinc-500">PlotterAI può commettere errori. Verifica le coordinate prima di stampare.</p>
      </div>
    </div>
  `,
  styles: []
})
export class ChatInputComponent {
  @Output() send = new EventEmitter<string>();
  prompt = '';

  sendPrompt() {
    if (this.prompt.trim()) {
      this.send.emit(this.prompt.trim());
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
