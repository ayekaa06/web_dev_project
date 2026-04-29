import { Injectable } from '@angular/core';
import { BaseApiService } from './base.service';
import { Model } from './models';
import { catchError, forkJoin, map, Observable, of, Subject, switchMap, tap } from 'rxjs';
import {
  Badge,
  Benchmark,
  Dependency,
  ListModel,
  MLModel,
  Profiling,
  Prompt,
  PaginatedResponse,
  UseCase,
  UseCaseInput,
  UserReview,
  UserReviewInput,
} from '../types/ml_model';

export type SubmitModel = {
  custom_name: string;
  model_name: string;
  author: string;
  version: string;
  param_count?: number | string | null;
  is_quantized?: boolean;
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
  getAllModels(params?: Record<string, string>): Observable<ListModel[]>;

  getAllModelRecords(): Observable<Model[]>;

  getById(id: number): Observable<Model> | null;

  getModelById(id: number): Observable<MLModel> | null;

  getByUniqName(uniq_name: string): Observable<Model> | null;

  addModelRecord(model: SubmitModel): Observable<Model> | null;

  updateModelRecord(record_id: number, change: Partial<Model>): Observable<Model> | null;

  deleteModelRecord(record_id: number): Observable<void> | null;

  updateRecordItem(record_id: number, item: RecordItem, operation: string, itemString: string): Observable<RecordItem[]> | null;

  getAllRecordItem(itemString: string): Observable<RecordItem[]> | null;

  getModelUseCases(modelId: number, params?: Record<string, string>): Observable<UseCase[]>;

  getModelUserReviews(modelId: number, params?: Record<string, string>): Observable<PaginatedResponse<UserReview>>;

  addModelUseCase(modelId: number, model: UseCaseInput): Observable<UseCase>;

  addModelUserReview(modelId: number, model: UserReviewInput): Observable<UserReview>;
}

@Injectable({ providedIn: 'root' })
export class ModelApiService extends BaseApiService implements ModelRecordAPI {
  getAllModels(params?: Record<string, string> | undefined): Observable<ListModel[]> {
    return this.get<ListModel[]>(`api/model-records/`, params).pipe(
      tap((response) => console.log('Fetched models:', response)),
    );
  }

  getAllModelRecords(): Observable<Model[]> {
    return this.get<ListModel[]>(`api/model-records/`).pipe(
      switchMap((records) => {
        const requests = records.map((record) => {
          const request = this.getById(record.record_id);
          return request ? request.pipe(catchError(() => of(null))) : of(null);
        });

        if (!requests.length) {
          return of([]);
        }

        return forkJoin(requests).pipe(
          map((models) => models.filter((model): model is Model => model !== null)),
        );
      }),
    );
  }

  getById(id: number): Observable<Model> | null {
    return this.get<Model>(`api/model-records/${id}/`);
  }

  getModelById(id: number): Observable<MLModel> | null {
    return this.get<MLModel>(`api/models/${id}/`);
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

  getModelUseCases(modelId: number, params?: Record<string, string>): Observable<UseCase[]> {
    return this.get<UseCase[]>(`api/models/${modelId}/use-cases/`, params);
  }

  getModelUserReviews(
    modelId: number,
    params?: Record<string, string>,
  ): Observable<PaginatedResponse<UserReview>> {
    return this.get<PaginatedResponse<UserReview>>(`api/models/${modelId}/user-reviews/`, params);
  }

  addModelUseCase(modelId: number, model: UseCaseInput): Observable<UseCase> {
    return this.post<UseCase>(`api/models/${modelId}/use-cases/`, model);
  }

  addModelUserReview(modelId: number, model: UserReviewInput): Observable<UserReview> {
    return this.post<UserReview>(`api/models/${modelId}/user-reviews/`, model);
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

  deleteModelRecord(record_id: number | undefined): Observable<void> | null {
    if (record_id == undefined) {
      console.error('Record ID is required to delete a model record.');
      return null;
    }

    return this.delete<void>(`api/model-records/${record_id}/`);
  }
}
