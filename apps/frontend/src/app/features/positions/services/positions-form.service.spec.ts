import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';

import { PositionFormService } from './positions-form.service';
import { PositionDto } from '@positions/services/positions-api.service';

describe('PositionFormService', () => {
  const makeDto = (overrides: Partial<PositionDto> = {}): PositionDto => {
    const now = new Date().toISOString();

    return {
      id: 1,
      created_at: now,
      updated_at: now,
      company: 10,
      title: 'Driver',
      description: 'Desc',
      department: 'Ops',
      contract_type: 'CDI',
      location: 'Chicago',
      salary: null,
      is_active: true,
      ...overrides,
    };
  };

  const setup = () => {
    TestBed.configureTestingModule({
      imports: [ReactiveFormsModule],
      providers: [PositionFormService],
    });

    const service = TestBed.inject(PositionFormService);
    return { service };
  };

  it('build() should create a form with default values', () => {
    const { service } = setup();
    const form = service.build();

    expect(form.controls.company.value).toBeNull();
    expect(form.controls.title.value).toBe('');
    expect(form.controls.description.value).toBe('');
    expect(form.controls.department.value).toBe('');
    expect(form.controls.contract_type.value).toBe('');
    expect(form.controls.location.value).toBe('');
    expect(form.controls.salary.value).toBeNull();
    expect(form.controls.is_active.value).toBeTrue();
  });

  it('patchFromDto() should patch values from dto', () => {
    const { service } = setup();
    const form = service.build();

    const dto = makeDto({
      company: 77,
      title: 'Senior Driver',
      description: undefined,
      department: 'Fleet',
      contract_type: 'W2',
      location: undefined,
      salary: 50000,
      is_active: false,
    });

    service.patchFromDto(form, dto);

    expect(form.controls.company.value).toBe(77);
    expect(form.controls.title.value).toBe('Senior Driver');
    expect(form.controls.description.value).toBe(''); // undefined -> ''
    expect(form.controls.department.value).toBe('Fleet');
    expect(form.controls.contract_type.value).toBe('W2');
    expect(form.controls.location.value).toBe(''); // undefined -> ''
    expect(form.controls.salary.value).toBe(50000);
    expect(form.controls.is_active.value).toBeFalse();
  });

  it('toPayload() should trim strings and map empty optional fields to undefined', () => {
    const { service } = setup();
    const form = service.build();

    form.controls.company.setValue(10);
    form.controls.title.setValue('  Driver  ');
    form.controls.description.setValue('   '); // -> undefined
    form.controls.department.setValue('  Ops ');
    form.controls.contract_type.setValue('  CDI  ');
    form.controls.location.setValue(''); // -> undefined
    form.controls.salary.setValue(null);
    form.controls.is_active.setValue(true);

    const payload = service.toPayload(form);

    expect(payload).toEqual({
      company: 10,
      title: 'Driver',
      description: undefined,
      department: 'Ops',
      contract_type: 'CDI',
      location: undefined,
      salary: null,
      is_active: true,
    });
  });

  it('toPayload() should throw if company is null', () => {
    const { service } = setup();
    const form = service.build();

    // company reste null
    form.controls.title.setValue('Driver');
    form.controls.department.setValue('Ops');
    form.controls.contract_type.setValue('CDI');

    expect(() => service.toPayload(form)).toThrowError('Company is required.');
  });
});
