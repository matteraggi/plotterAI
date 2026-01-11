import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-chat-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="fixed bottom-0 left-0 w-full bg-white dark:bg-zinc-950 p-4 pb-6 border-t border-zinc-200 dark:border-zinc-800">
      <div class="max-w-screen-md mx-auto relative flex items-end gap-3">
        
        <!-- Settings Toggle -->
        <div class="relative pb-2">
            <!-- Menu Popover -->
            @if (showSettings) {
            <div class="absolute bottom-full left-0 mb-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl p-3 min-w-[160px] animate-in fade-in slide-in-from-bottom-2">
                <div class="text-xs font-medium text-zinc-500 mb-2 px-1">Livello Dettaglio</div>
                <div class="flex flex-col gap-1">
                    <button 
                    (click)="setStyle('icon')" 
                    class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors"
                    [class.bg-zinc-100]="style === 'icon'"
                    [class.dark:bg-zinc-800]="style === 'icon'"
                    [class.text-indigo-600]="style === 'icon'"
                    [class.dark:text-indigo-400]="style === 'icon'"
                    [class.font-medium]="style === 'icon'"
                    >
                    <span>Icona</span>
                    @if(style === 'icon') { <div class="w-1.5 h-1.5 rounded-full bg-current"></div> }
                    </button>
                    <button 
                    (click)="setStyle('illustration')" 
                    class="flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm transition-colors"
                    [class.bg-zinc-100]="style === 'illustration'"
                    [class.dark:bg-zinc-800]="style === 'illustration'"
                    [class.text-purple-600]="style === 'illustration'"
                    [class.dark:text-purple-400]="style === 'illustration'"
                    [class.font-medium]="style === 'illustration'"
                    >
                    <span>Illustrazione</span>
                    @if(style === 'illustration') { <div class="w-1.5 h-1.5 rounded-full bg-current"></div> }
                    </button>
                </div>
            </div>
            
            <!-- Backdrop to close -->
            <div class="fixed inset-0 z-[-1]" (click)="showSettings = false"></div>
            }

            <button 
            (click)="showSettings = !showSettings"
            [class.bg-zinc-200]="showSettings"
            [class.dark:bg-zinc-800]="showSettings"
            class="p-3 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100 rounded-xl transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
            </button>
        </div>

        <div class="relative flex-1">
          <textarea 
            [(ngModel)]="prompt" 
            (keydown.enter)="onEnter($event)"
            placeholder="Chiedi di disegnare qualcosa..."
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
      </div>
    </div>
  `,
  styles: []
})
export class ChatInputComponent {
  @Output() send = new EventEmitter<{ prompt: string, style: 'icon' | 'illustration' }>();
  prompt = '';
  style: 'icon' | 'illustration' = 'icon';
  showSettings = false;

  setStyle(newStyle: 'icon' | 'illustration') {
    this.style = newStyle;
    this.showSettings = false;
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
