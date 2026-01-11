import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface GenerateResponse {
    image_url: string;
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
}
