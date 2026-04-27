import { Injectable } from '@angular/core';
import { BaseApiService } from './base.service';
import { Model } from './models';
import { Observable, Subject, tap } from 'rxjs';
import { Badge, Benchmark, Dependency, ListModel, Profiling, Prompt } from '../types/ml_model';

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

type RecordItem = Badge | Benchmark | Prompt;

interface ModelRecordAPI {
  getAllModels(): Observable<ListModel[]>;

  getById(id: number): Observable<Model> | null;

  getByUniqName(uniq_name: string): Observable<Model> | null;

  addModelRecord(model: SubmitModel): Observable<Model> | null;

  updateModelRecord(record_id: number, change: Partial<Model>): Observable<Model> | null;

  updateRecordItem(record_id: number, item: RecordItem, operation: string, itemString: string): Observable<RecordItem[]> | null;

  getAllRecordItem(itemString: string): Observable<RecordItem[]> | null;
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

  getRecordBadges(record_id: number): Observable<Badge[]> | null {
    return null;
  }

  getAllRecordItem(itemString: string): Observable<RecordItem[]> | null {
    return this.get<RecordItem[]>(`api/${itemString}/`);  
  }

  updateRecordItem(record_id: number | undefined, item: RecordItem, operation: string, itemString: string): Observable<RecordItem[]> | null {
    if (record_id == undefined) {
      console.error('Record ID is required to update a record item.');
      return null;
    }
    return this.post<RecordItem[]>(`api/model-records/${record_id}/${operation}-${itemString}/`, item);
  }

  uploadArchitecture(record_id: number | undefined, filename: string, file: File): Observable<any> | null {
    if (record_id == undefined) {
      console.error('Record ID is required to upload architecture file.');
      return null;
    }
    // const fd = new FormData();
    // fd.append('file', file, filename);
    const binaryUploadHeaders = {
      'Content-Type': file.type || 'application/octet-stream',
      // 'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
    }
    return this.put<any>(`api/upload-architecture/${record_id}/${encodeURIComponent(filename)}/`, file, binaryUploadHeaders);
  }

  deleteArchitecture(record_id: number | undefined, file_id: number | string): Observable<any> | null {
    if (record_id == undefined) {
      console.error('Record ID is required to delete an architecture file.');
      return null;
    }
    return this.delete<any>(`api/delete-architecture/${record_id}/${file_id}/`);
  }

  updateModelRecord(record_id: number | undefined, change: Partial<Model>): Observable<Model> | null {
    if (record_id == undefined) {
      console.error('Record ID is required to update a model record.');
      return null;
    }
    return this.patch<Model>(`api/model-records/${record_id}/`, change);
  }
}
