import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { ApplicationsPage } from './applications.page';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

describe('ApplicationsPage', () => {
  let fixture: ComponentFixture<ApplicationsPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationsPage],
      providers: [
        {
          provide: CandidatePortalService,
          useValue: {
            isAuthenticated: signal(false),
            currentApplications: signal([]),
            loadApplications: async () => {},
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(ApplicationsPage);
  });

  it('asks user to login when disconnected', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Connectez-vous');
  });
});
