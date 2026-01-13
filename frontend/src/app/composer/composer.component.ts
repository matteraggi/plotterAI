import { Component, Input, Output, EventEmitter, signal, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrintPayload } from '../services/chat.service';

@Component({
  selector: 'app-composer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './composer.component.html',
  styles: []
})
export class ComposerComponent implements AfterViewInit {
  @Input({ required: true }) imageUrl!: string;
  @Output() cancel = new EventEmitter<void>();
  @Output() print = new EventEmitter<PrintPayload>();

  @ViewChild('workspace') workspaceRef!: ElementRef;

  // Workspace dimensions (calculated responsive)
  workspaceWidth = 0;
  workspaceHeight = 0;

  // Image State
  imgX = 0;
  imgY = 0;
  imgWidth = 200;
  imgHeight = 200;
  rotation = 0; // New rotation state

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

  onPrint() {
    // Calculate millimeters
    // A4 is 210mm width.
    const mmPerPixel = 210 / this.workspaceWidth;

    const payload: PrintPayload = {
      imageUrl: this.imageUrl,
      x_mm: this.imgX * mmPerPixel,
      y_mm: this.imgY * mmPerPixel,
      width_mm: this.imgWidth * mmPerPixel,
      height_mm: this.imgHeight * mmPerPixel,
      rotation: this.rotation // Emit rotation
    };

    console.log('[Composer] Print Payload (mm):', payload);
    this.print.emit(payload);
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
