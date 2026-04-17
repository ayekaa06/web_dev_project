import { TestBed } from '@angular/core/testing';

import { Models } from './models';

describe('Models', () => {
  let service: Models;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Models);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
