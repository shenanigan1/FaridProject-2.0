import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MenuBarComponent } from './layout/menu-bar/menu-bar';
import { TopBarComponent } from './layout/top-bar/top-bar';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopBarComponent, MenuBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('frontend');
}
