import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { RegisterPage } from './register.page';
import { CandidatePortalService } from '../../core/services/candidate-portal.service';

describe('RegisterPage', () => {
  let fixture: ComponentFixture<RegisterPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterPage],
      providers: [
        {
          provide: CandidatePortalService,
          useValue: {
            currentUser: signal(null),
            registerAccount: async () => true,
            login: async () => true,
            logout: () => {},
          },
        },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(RegisterPage);
    fixture.detectChanges();
  });

  it('creates account and logs in with valid registration', async () => {
    const component = fixture.componentInstance;
    component.registerForm.setValue({
      firstName: 'Nina',
      lastName: 'Perez',
      email: 'nina@demo.com',
      password: 'SecurePass123!',
    });

    await component.register();

    expect(component.feedbackMessage).toContain('connecté');
  });
});
