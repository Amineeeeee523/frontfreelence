// src/app/services/notification-socket.service.ts
import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

import { environment } from '../../environments/environment';
import { NotificationDto } from '../models/notification-dto.model';

@Injectable({ providedIn: 'root' })
export class NotificationSocketService {
  private readonly WS_ENDPOINT = (environment as any).wsBaseUrl || environment.apiUrl.replace('/api', '') + '/ws';

  private client: Client | null = null;
  private connected$ = new BehaviorSubject<boolean>(false);

  private notifSubject = new Subject<NotificationDto>();
  public notifications$: Observable<NotificationDto> = this.notifSubject.asObservable();
  // Debug: record subscription ids
  private subs: { userQueue?: string; rawQueue?: string } = {};

  constructor(private zone: NgZone) {}

  private ensureConnection(): void {
    if (this.client && this.client.active) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(this.WS_ENDPOINT, undefined, { withCredentials: true }),
      reconnectDelay: 5000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: (msg: string) => {
        // Garder la console propre; commenter la ligne suivante pour activer debug détaillé
        // console.log('[NotificationSocketService][STOMP]', msg);
      },
      onConnect: (frame) => {
        console.log('[NotificationSocketService] STOMP connecté');
        this.connected$.next(true);
        this.zone.run(() => this.subscribeToNotifications());
      },
      onStompError: (frame) => {
        console.error('[NotificationSocketService] STOMP error', frame?.headers || {});
      },
      onWebSocketClose: (evt) => {
        console.warn('[NotificationSocketService] WebSocket fermé', evt?.code);
        this.connected$.next(false);
      }
    });

    this.client = client;
    client.activate();
  }

  private subscribeToNotifications(): void {
    console.log('[NotificationSocketService] souscription /user/queue/notifications');
    const sub1 = this.client?.subscribe('/user/queue/notifications', (message: IMessage) => {
      if (!message.body) return;
      try {
        const payload: NotificationDto = JSON.parse(message.body);
        console.log('[NotificationSocketService] notification WS', payload);
        this.zone.run(() => this.notifSubject.next(payload));
      } catch {
        // ignore malformed
      }
    });
    this.subs.userQueue = (sub1 as any)?.id;

    // Debug fallback: raw queue without /user prefix, in cas de mauvais envoi côté serveur
    console.log('[NotificationSocketService] souscription (debug) /queue/notifications');
    const sub2 = this.client?.subscribe('/queue/notifications', (message: IMessage) => {
      if (!message.body) return;
      try {
        const payload: any = JSON.parse(message.body);
        console.warn('[NotificationSocketService][DEBUG] notification sur /queue/notifications', payload);
      } catch {
        // ignore
      }
    });
    this.subs.rawQueue = (sub2 as any)?.id;
  }

  public connect(): void {
    console.log('[NotificationSocketService] connect() called');
    this.ensureConnection();
  }

  public disconnect(): void {
    if (this.client && this.client.active) {
      this.client.deactivate();
      this.connected$.next(false);
    }
  }

  // Expose connection state for diagnostics
  public getConnectionState$(): Observable<boolean> {
    return this.connected$.asObservable();
  }

  public isConnected(): boolean {
    return this.connected$.value === true;
  }
}


