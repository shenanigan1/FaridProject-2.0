import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ui-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiFileUploadComponent {
  @Input() accept = '';
  @Input() multiple = false;
  @Input() disabled = false;
  @Input() label = 'Upload file';
  @Input() hint?: string;

  @Output() filesSelected = new EventEmitter<FileList>();

  readonly dragActive = signal(false);
  readonly fileNames = signal<string[]>([]);

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(true);
  }

  onDragLeave(): void {
    this.dragActive.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragActive.set(false);

    if (!event.dataTransfer?.files?.length) return;

    this.processFiles(event.dataTransfer.files);
  }

  onFileChange(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files?.length) return;

    this.processFiles(files);
  }

  private processFiles(files: FileList): void {
    this.fileNames.set(Array.from(files).map(f => f.name));
    this.filesSelected.emit(files);
  }
}
