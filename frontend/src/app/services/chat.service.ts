import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface GenerateResponse {
    image_url: string;
}

export interface PrintPayload {
    imageUrl: string;
    x_mm: number;
    y_mm: number;
    width_mm: number;
    height_mm: number;
    rotation: number;
}

@Injectable({
    providedIn: 'root'
})
export class ChatService {
    private apiUrl = 'http://localhost:8000';

    constructor(private http: HttpClient) { }

    sendMessage(prompt: string, style: 'icon' | 'illustration'): Observable<GenerateResponse> {
        console.log('[ChatService] Sending message to backend:', prompt, style);
        return this.http.post<GenerateResponse>(`${this.apiUrl}/generate`, { prompt, style }).pipe(
            tap({
                next: (response) => console.log('[ChatService] Received response:', response),
                error: (error) => console.error('[ChatService] Error receiving response:', error)
            })
        );
    }

    printImage(payload: PrintPayload): Observable<any> {
        console.log('[ChatService] Sending print request:', payload);
        return this.http.post(`${this.apiUrl}/print`, payload).pipe(
            tap({
                next: () => console.log('[ChatService] Print request successful'),
                error: (error) => console.error('[ChatService] Print request failed:', error)
            })
        );
    }
}
