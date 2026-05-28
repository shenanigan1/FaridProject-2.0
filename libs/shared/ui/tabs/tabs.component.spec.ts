import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { UiTabsComponent } from './tabs.component';

describe('UiTabsComponent', () => {
  let fixture: ComponentFixture<UiTabsComponent<string>>;
  let component: UiTabsComponent<string>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiTabsComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UiTabsComponent<string>);
    component = fixture.componentInstance;
    component.items = [
      { key: 'tests', label: 'Tests' },
      { key: 'templates', label: 'Templates' },
    ];
    component.activeKey = 'tests';
  });

  it('uses the shared segmented tab primitive', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('.ff-segmented') as HTMLDivElement;
    const active = fixture.nativeElement.querySelector('.ff-segmented__item--active') as HTMLButtonElement;

    expect(host).not.toBeNull();
    expect(active.textContent).toContain('Tests');
  });

  it('emits active key changes when a tab is selected', () => {
    spyOn(component.activeKeyChange, 'emit');
    fixture.detectChanges();

    const buttons = fixture.debugElement.queryAll(By.css('button'));
    buttons[1].nativeElement.click();

    expect(component.activeKeyChange.emit).toHaveBeenCalledOnceWith('templates');
  });
});

