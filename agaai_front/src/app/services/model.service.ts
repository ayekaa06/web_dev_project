import { Injectable } from '@angular/core';
import { BaseApiService } from './base.service';
import { Model } from './models';
import { Observable, Subject, tap } from 'rxjs';
import { Benchmark, Dependency, ListModel, Profiling, Prompt } from '../types/ml_model';

export type SubmitModel = {
  custom_name: string;
  model_name: string;
  author: string;
  version: string;
  description: string;
  custom_note: string | null;
  prompts?: Prompt[] | null;
  badges?: string[] | null;
  dependencies?: Dependency[] | null;
  profiling?: Profiling[] | null;
  benchmarks?: Benchmark[] | null;
};

interface ModelRecordAPI {
  getAllModels(): Observable<ListModel[]>;

  getById(id: number): Observable<Model> | null;

  getByUniqName(uniq_name: string): Observable<Model> | null;

  addModelRecord(model: SubmitModel): Observable<Model> | null;

  updateModelRecord(record_id: number, change: Partial<Model>): Observable<Model> | null;
}

@Injectable({ providedIn: 'root' })
export class ModelApiService extends BaseApiService implements ModelRecordAPI {
  getAllModels(): Observable<ListModel[]> {
    return this.get<ListModel[]>(`api/model-records/`).pipe(
      tap((response) => console.log('Fetched models:', response)),
    );
  }

  getById(id: number): Observable<Model> | null {
    return this.get<Model>(`api/model-records/${id}/`);
  }

  getByUniqName(uniq_name: string): Observable<Model> | null {
    return null;
  }

  addModelRecord(model: SubmitModel): Observable<Model> {
    return this.post<Model>(`api/model-records/`, model);
  }

  updateModelRecord(record_id: number, change: Partial<Model>): Observable<Model> | null {
    return this.patch<Model>(`api/model-records/${record_id}/`, change);
  }
}
