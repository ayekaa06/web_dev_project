import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelCard } from './model-card';

describe('ModelCard', () => {
  let component: ModelCard;
  let fixture: ComponentFixture<ModelCard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModelCard],
    }).compileComponents();

    fixture = TestBed.createComponent(ModelCard);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
