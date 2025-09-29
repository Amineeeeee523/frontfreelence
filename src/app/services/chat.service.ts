import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';
import { filter, take } from 'rxjs/operators'; // Ajout utilitaires RxJS

import { environment } from '../../environments/environment';
import { Page } from '../models/page.model';
import { ChatMessage, MessageStatus, ChatMessageType } from '../models/chat-message.model';
import { SendMessageRequest } from '../models/send-message.model';

@Injectable({ providedIn: 'root' })
export class ChatService {
  private readonly api = `${environment.apiUrl}/chat`;
  private readonly WS_ENDPOINT = environment.apiUrl.replace('/api', '') + '/ws';

  private client?: Client;
  private connected$ = new BehaviorSubject<boolean>(false);

  // Flux optimiste : message poussé immédiatement côté UI
  private sentSubject = new Subject<ChatMessage>();
  public sentMessage$ = this.sentSubject.asObservable();

  // Accusés de réception du backend
  private ackSubject = new Subject<ChatMessage>();
  public ack$ = this.ackSubject.asObservable();

  constructor(private http: HttpClient, private zone: NgZone) {}

  /* ---------------- REST --------------- */
  getMessages(conversationId: number, page = 0, size = 20): Observable<Page<ChatMessage>> {
    const params = new HttpParams().set('page', page.toString()).set('size', size.toString());
    return this.http.get<Page<ChatMessage>>(
      `${this.api}/conversations/${conversationId}/messages`,
      { params, withCredentials: true }
    );
  }

  markSeen(conversationId: number): Observable<void> {
    return this.http.put<void>(
      `${this.api}/conversations/${conversationId}/seen`,
      {},
      { withCredentials: true }
    );
  }

  /* ---------------- WebSocket STOMP --------------- */

  /**
   * Établit la connexion WebSocket STOMP si elle n'est pas déjà ouverte.
   * Peut être appelé par un composant lors de son initialisation afin
   * de réduire la latence lors du premier envoi de message.
   */
  public connect(): void {
    this.ensureConnection();
  }

  private ensureConnection(): void {
    if (this.connected$.value) {
      console.log('[ChatService] WS déjà connecté');
      return;
    }

    console.log('[ChatService] Initialisation de la connexion WS', this.WS_ENDPOINT);

    const client = new Client({
      webSocketFactory: () => new (SockJS as any)(this.WS_ENDPOINT, undefined, { withCredentials: true }),
      reconnectDelay: 5000,
      heartbeatIncoming: 15000,
      heartbeatOutgoing: 15000,
      debug: () => {}
    });

    client.onConnect = () => {
      console.log('[ChatService] STOMP connecté');
      this.connected$.next(true);
      this.zone.run(() => this.subscribeAck());
    };

    client.onWebSocketClose = () => this.connected$.next(false);

    this.client = client;
    client.activate();
  }

  private subscribeAck(): void {
    this.client?.subscribe('/user/queue/ack', (message: IMessage) => {
      if (message.body) {
        const payload: ChatMessage = JSON.parse(message.body);
        this.zone.run(() => this.ackSubject.next(payload));
      }
    });
  }

  sendMessage(req: SendMessageRequest, tempId: string, senderId: number): void {
    // 1. Envoi optimiste vers l'UI
    const optimistic: ChatMessage = {
      tempId,
      conversationId: req.conversationId,
      senderId,
      receiverId: 0,
      content: req.content,
      type: req.type as ChatMessageType,
      timestamp: new Date().toISOString(),
      seen: false,
      status: MessageStatus.PENDING,
    };
    this.sentSubject.next(optimistic);

    // 2. Envoi réel via WebSocket
    this.ensureConnection();

    const publish = () => {
      this.client?.publish({
        destination: '/app/chat/send',
        body: JSON.stringify({ ...req, tempId }),
      });
    };

    if (this.connected$.value) {
      publish();
    } else {
      this.connected$.pipe(filter(v => v), take(1)).subscribe(publish);
    }
  }

  disconnect(): void {
    if (this.client?.active) {
      this.client.deactivate();
      this.connected$.next(false);
    }
  }
} 