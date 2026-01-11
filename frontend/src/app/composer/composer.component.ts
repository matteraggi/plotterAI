import { Component, Input, Output, EventEmitter, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed inset-0 z-[50] bg-zinc-200/90 dark:bg-zinc-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4">
      
      <!-- Toolbar -->
      <div class="absolute top-4 left-4 right-4 flex justify-between items-center z-10">
        <button (click)="cancel.emit()" class="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 text-sm font-medium transition-colors">
          <span class="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Indietro
          </span>
        </button>

        <div class="px-4 py-2 bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
           Composizione A4
        </div>

        <button (click)="print.emit(imageUrl)" class="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-lg shadow-indigo-500/20 text-sm font-medium transition-all">
          <span class="flex items-center gap-2">
            Stampa
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </span>
        </button>
      </div>

      <!-- Workspace (A4 Aspect Ratio: 1 : 1.414) -->
      <!-- Added border so it is visible against light backgrounds -->
      <div #workspace class="relative bg-white shadow-2xl border border-zinc-300 overflow-hidden cursor-crosshair transition-all duration-300 ease-out"
           [style.width.px]="workspaceWidth"
           [style.height.px]="workspaceHeight"
           (mousemove)="onMouseMove($event)"
           (mouseup)="onMouseUp()"
           (mouseleave)="onMouseUp()">
           
           <!-- Grid (Optional, decorative) -->
           <div class="absolute inset-0 pointer-events-none opacity-20" 
                style="background-image: radial-gradient(#9ca3af 1px, transparent 1px); background-size: 20px 20px;">
           </div>

           <!-- Draggable Image -->
           @if (imageUrl) {
           <div class="absolute cursor-move select-none group"
                [style.left.px]="imgX"
                [style.top.px]="imgY"
                [style.width.px]="imgWidth"
                [style.height.px]="imgHeight"
                (mousedown)="onMouseDown($event)">
                
              <img [src]="imageUrl" 
                   (load)="onImageLoad()"
                   class="w-full h-full object-contain pointer-events-none" 
                   draggable="false" />
              
              <!-- Selection Border & Handles (Visible only on hover or active) -->
              <div class="absolute inset-0 border-2 border-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                   [class.opacity-100]="isDragging || isResizing"></div>
              
              <!-- Resize Handle (Bottom Right) -->
              <div class="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-indigo-600 border-2 border-white rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 pointer-events-auto"
                   [class.opacity-100]="isDragging || isResizing"
                   (mousedown)="onResizeStart($event)"></div>
           </div>
           }

      </div>

      <div class="absolute bottom-6 text-zinc-500 font-medium text-xs bg-white/50 px-3 py-1 rounded-full backdrop-blur-md">
         Trascina per spostare. Usa l'angolo in basso a destra per ridimensionare.
      </div>

    </div>
  `,
  styles: []
})
export class ComposerComponent implements AfterViewInit {
  @Input({ required: true }) imageUrl!: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() print = new EventEmitter<string>();

  @ViewChild('workspace') workspaceRef!: ElementRef;

  // Workspace dimensions (calculated responsive)
  workspaceWidth = 0;
  workspaceHeight = 0;

  // Image State
  imgX = 0;
  imgY = 0;
  imgWidth = 200;
  imgHeight = 200;

  // Dragging Implementation
  isDragging = false;
  dragStartX = 0;
  dragStartY = 0;
  initialImgX = 0;
  initialImgY = 0;

  // Resizing Implementation
  isResizing = false;
  resizeStartX = 0;
  resizeStartY = 0;
  initialImgWidth = 0;
  initialImgHeight = 0;


  ngAfterViewInit() {
    // Wrap in setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.calculateWorkspaceSize();
    });
    window.addEventListener('resize', () => this.calculateWorkspaceSize());
  }

  calculateWorkspaceSize() {
    // Fit A4 into available screen space with some padding
    const padding = 120; // top/bottom padding
    const availableHeight = window.innerHeight - padding;
    const availableWidth = window.innerWidth - 40;

    // A4 Ratio is 1 / 1.414 (approx 0.707)
    const a4Ratio = 210 / 297;

    if (availableHeight * a4Ratio <= availableWidth) {
      this.workspaceHeight = availableHeight;
      this.workspaceWidth = availableHeight * a4Ratio;
    } else {
      this.workspaceWidth = availableWidth;
      this.workspaceHeight = availableWidth / a4Ratio;
    }

    console.log('[Composer] Workspace size:', this.workspaceWidth, this.workspaceHeight);
  }

  onImageLoad() {
    // Center image initially safely
    if (this.workspaceWidth > 0 && this.workspaceHeight > 0) {
      // Default size: 50% of width
      this.imgWidth = this.workspaceWidth * 0.5;
      this.imgHeight = this.imgWidth; // Assume square for now, or aspect ratio of image?

      this.imgX = (this.workspaceWidth - this.imgWidth) / 2;
      this.imgY = (this.workspaceHeight - this.imgHeight) / 2;
    }
  }

  // --- Dragging Logic ---
  onMouseDown(event: MouseEvent) {
    if (this.isResizing) return;
    event.preventDefault(); // Prevent text selection
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartY = event.clientY;
    this.initialImgX = this.imgX;
    this.initialImgY = this.imgY;
  }

  onMouseMove(event: MouseEvent) {
    if (this.isDragging) {
      const dx = event.clientX - this.dragStartX;
      const dy = event.clientY - this.dragStartY;
      this.imgX = this.initialImgX + dx;
      this.imgY = this.initialImgY + dy;
    } else if (this.isResizing) {
      const dx = event.clientX - this.resizeStartX;
      // Maintain aspect ratio? For now let's allow free resize or maybe fix ratio later.
      // Let's implement simple scaling.
      // Ideally we want to scale based on diagonal movement to keep aspect ratio 
      // but for now simple width/height adjustment.

      // Simple uniform scale based on width change for now to keep aspect ratio of image?
      // Let's just do free resize for flexibility as per request "manipolazione".
      // Actually, assuming user wants to keep aspect ratio is safer for drawings.
      const scaleFactor = (this.initialImgWidth + dx) / this.initialImgWidth;

      this.imgWidth = this.initialImgWidth * scaleFactor;
      this.imgHeight = this.initialImgHeight * scaleFactor;

      // Min size check
      if (this.imgWidth < 50) this.imgWidth = 50;
      if (this.imgHeight < 50) this.imgHeight = 50;
    }
  }

  onMouseUp() {
    this.isDragging = false;
    this.isResizing = false;
  }

  // --- Resizing Logic ---
  onResizeStart(event: MouseEvent) {
    event.stopPropagation(); // Don't trigger drag
    event.preventDefault();
    this.isResizing = true;
    this.resizeStartX = event.clientX;
    this.resizeStartY = event.clientY;
    this.initialImgWidth = this.imgWidth;
    this.initialImgHeight = this.imgHeight;
  }
}
