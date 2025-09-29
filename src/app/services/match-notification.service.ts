import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

import { environment } from '../../environments/environment';
import { MatchNotification } from '../models/match-notification.model';

@Injectable({ providedIn: 'root' })
export class MatchNotificationService {
  private readonly WS_ENDPOINT = environment.apiUrl.replace('/api', '') + '/ws';

  private client?: Client;
  private connected$ = new BehaviorSubject<boolean>(false);

  private matchSubject = new Subject<MatchNotification>();
  /** Flux RxJS public des notifications de match */
  public match$: Observable<MatchNotification> = this.matchSubject.asObservable();

  constructor(private zone: NgZone) {}

  /** S'assure qu'une connexion STOMP est ouverte (singleton) */
  private ensureConnection(): void {
    if (this.connected$.value) {
      return;
    }

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(this.WS_ENDPOINT, undefined, { withCredentials: true }),
      reconnectDelay: 5000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: () => {}
    });
    client.onConnect = () => {
      this.connected$.next(true);
      this.zone.run(() => this.subscribeToMatches());
    };
    client.onWebSocketClose = () => this.connected$.next(false);
    this.client = client;
    client.activate();
  }

  /** Souscription à la file personnelle des matchs */
  private subscribeToMatches(): void {
    this.client?.subscribe('/user/queue/matches', (message: IMessage) => {
      if (message.body) {
        const payload: MatchNotification = JSON.parse(message.body);
        // Re-passage dans l'Angular zone pour détecter les changements
        this.zone.run(() => this.matchSubject.next(payload));
      }
    });
  }

  /** API publique pour démarrer la connexion (à appeler une fois depuis un composant) */
  public connect(): void {
    this.ensureConnection();
  }

  public disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      this.connected$.next(false);
    }
  }
} 