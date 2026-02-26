import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auth-card.component.html',
})
export class AuthCardComponent {
  @Input({ required: true }) title!: string;
  @Input() subtitle: string | null = null;
}