import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobFiltersComponent } from './job-filters.component';
import { JobOfferFilters } from '../../models/job-offer.model';

describe('JobFiltersComponent', () => {
  let fixture: ComponentFixture<JobFiltersComponent>;
  let component: JobFiltersComponent;

  const mockFilters: JobOfferFilters = {
    search: 'driver',
    location: 'Chicago',
    employmentType: '',
    priority: '',
    page: 1,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobFiltersComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(JobFiltersComponent);
    component = fixture.componentInstance;
    component.filters = mockFilters;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should patch the form from input filters', () => {
    expect(component.form.getRawValue()).toEqual({
      search: 'driver',
      location: 'Chicago',
      employmentType: '',
      priority: '',
    });
  });

  it('should emit filtersChange on submit', () => {
    const spy = jasmine.createSpy('filtersChange');
    component.filtersChange.subscribe(spy);

    component.form.setValue({
      search: 'manager',
      location: 'Dallas',
      employmentType: 'full-time',
      priority: 'high',
    });

    component.submit();

    expect(spy).toHaveBeenCalledWith({
      search: 'manager',
      location: 'Dallas',
      employmentType: 'full-time',
      priority: 'high',
    });
  });

  it('should reset the form and emit resetFilters', () => {
    const spy = jasmine.createSpy('resetFilters');
    component.resetFilters.subscribe(spy);

    component.form.setValue({
      search: 'manager',
      location: 'Dallas',
      employmentType: 'full-time',
      priority: 'high',
    });

    component.reset();

    expect(component.form.getRawValue()).toEqual({
      search: '',
      location: '',
      employmentType: '',
      priority: '',
    });

    expect(spy).toHaveBeenCalled();
  });
});
