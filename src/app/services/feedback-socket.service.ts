// src/app/services/feedback-socket.service.ts
import { Injectable, OnDestroy, inject } from '@angular/core';
import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Observable, Subject, BehaviorSubject, firstValueFrom } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { WS_BASE_URL } from '../core/tokens/ws-base-url.token';
import { PublishedPayload, SubmittedPayload, UpdatedPayload, DeletedPayload } from '../models/feedback.models';

type ConnectionState = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

@Injectable({ providedIn: 'root' })
export class FeedbackSocketService implements OnDestroy {
  private readonly wsBaseUrl = inject(WS_BASE_URL);
  private client: Client | null = null;
  private connection$ = new BehaviorSubject<ConnectionState>('DISCONNECTED');
  private subscriptions: StompSubscription[] = [];
  private connectionPromise: Promise<void> | null = null;

  constructor() {
    // Log de configuration au démarrage
    console.group('[FeedbackSocketService] Configuration');
    console.log('🔧 WS_BASE_URL:', this.wsBaseUrl);
    console.log('🔧 Topics disponibles:');
    console.log('  - /topic/mission.{id}/feedback.submitted');
    console.log('  - /topic/mission.{id}/feedback.published');
    console.log('  - /topic/mission.{id}/feedback.updated');
    console.log('  - /topic/mission.{id}/feedback.deleted');
    console.log('🔧 État initial:', this.connection$.value);
    console.groupEnd();
  }

  /** Connect to the STOMP broker over SockJS. */
  connect(): Observable<ConnectionState> {
    console.group('[FeedbackSocketService] Connect');
    console.log('🔧 État actuel:', this.connection$.value);
    console.log('🔧 Client existant:', !!this.client);
    console.log('🔧 Client connecté:', this.client?.connected);
    
    if (this.client && this.client.connected) {
      console.log('✅ Déjà connecté, retour de l\'état actuel');
      this.connection$.next('CONNECTED');
      console.groupEnd();
      return this.connection$.asObservable();
    }

    if (this.connectionPromise) {
      console.log('⏳ Connexion en cours, retour de la promesse existante');
      console.groupEnd();
      return this.connection$.asObservable();
    }

    console.log('🔄 Démarrage nouvelle connexion');
    this.connection$.next('CONNECTING');
    
    this.connectionPromise = new Promise<void>((resolve, reject) => {
      const client = new Client({
        webSocketFactory: () => {
          console.log('🌐 Création WebSocket vers:', this.wsBaseUrl);
          return new SockJS(this.wsBaseUrl);
        },
        reconnectDelay: 3000,
        heartbeatIncoming: 15000,
        heartbeatOutgoing: 15000,
        onConnect: () => {
          console.log('✅ Connexion STOMP établie');
          this.connection$.next('CONNECTED');
          resolve();
        },
        onStompError: (error) => {
          console.error('❌ Erreur STOMP:', error);
          this.connection$.next('DISCONNECTED');
          this.connectionPromise = null;
          reject(error);
        },
        onDisconnect: () => {
          console.log('🔌 Déconnexion STOMP');
          this.connection$.next('DISCONNECTED');
          this.connectionPromise = null;
        }
      });

      this.client = client;
      console.log('🚀 Activation du client STOMP');
      client.activate();
    });

    console.groupEnd();
    return this.connection$.asObservable();
  }

  /** Disconnect from the broker and clean subscriptions. */
  disconnect(): void {
    console.group('[FeedbackSocketService] Disconnect');
    console.log('🔧 État actuel:', this.connection$.value);
    console.log('🔧 Subscriptions actives:', this.subscriptions.length);
    
    this.subscriptions.forEach(s => s.unsubscribe());
    this.subscriptions = [];
    
    if (this.client) {
      const c = this.client;
      this.client = null;
      if (c.active) {
        console.log('🔌 Déconnexion du client STOMP');
        c.deactivate();
      }
    }
    
    this.connectionPromise = null;
    this.connection$.next('DISCONNECTED');
    console.log('✅ Déconnexion terminée');
    console.groupEnd();
  }

  /** Subscribe to feedback.submitted events for a mission. */
  subscribeToSubmitted(missionId: number): Observable<SubmittedPayload> {
    const topic = `/topic/mission.${missionId}/feedback.submitted`;
    return this.createTopicStream<SubmittedPayload>(topic);
  }

  /** Subscribe to feedback.published events for a mission. */
  subscribeToPublished(missionId: number): Observable<PublishedPayload> {
    const topic = `/topic/mission.${missionId}/feedback.published`;
    return this.createTopicStream<PublishedPayload>(topic);
  }

  /** Subscribe to feedback.updated events for a mission. */
  subscribeToUpdated(missionId: number): Observable<UpdatedPayload> {
    const topic = `/topic/mission.${missionId}/feedback.updated`;
    return this.createTopicStream<UpdatedPayload>(topic);
  }

  /** Subscribe to feedback.deleted events for a mission. */
  subscribeToDeleted(missionId: number): Observable<DeletedPayload> {
    const topic = `/topic/mission.${missionId}/feedback.deleted`;
    return this.createTopicStream<DeletedPayload>(topic);
  }

  /** Ensure connection is established before subscribing. */
  private async ensureConnected(): Promise<void> {
    console.group('[FeedbackSocketService] Ensure Connected');
    console.log('🔧 État actuel:', this.connection$.value);
    
    if (this.connection$.value === 'CONNECTED') {
      console.log('✅ Déjà connecté');
      console.groupEnd();
      return;
    }

    if (this.connection$.value === 'CONNECTING') {
      console.log('⏳ Connexion en cours, attente...');
      await firstValueFrom(this.connection$.pipe(
        filter(state => state === 'CONNECTED'),
        take(1)
      ));
      console.log('✅ Connexion établie après attente');
      console.groupEnd();
      return;
    }

    console.log('🔄 Démarrage connexion...');
    this.connect();
    await firstValueFrom(this.connection$.pipe(
      filter(state => state === 'CONNECTED'),
      take(1)
    ));
    console.log('✅ Connexion établie');
    console.groupEnd();
  }

  private createTopicStream<T>(destination: string): Observable<T> {
    return new Observable<T>(observer => {
      console.group(`[FeedbackSocketService] Create Topic Stream: ${destination}`);
      console.log('🔧 État actuel:', this.connection$.value);
      
      // Ensure connection before subscribing
      this.ensureConnected().then(() => {
        if (!this.client || !this.client.connected) {
          console.error('❌ Client non disponible après connexion');
          observer.error(new Error('Client not available after connection'));
          console.groupEnd();
          return;
        }

        console.log('✅ Souscription au topic:', destination);
        const sub = this.client.subscribe(destination, (msg: IMessage) => {
          try {
            const payload = JSON.parse(msg.body) as T;
            console.log('📨 Message reçu:', payload);
            observer.next(payload);
          } catch (e) {
            console.error('❌ Erreur parsing message:', e);
            // ignore malformed messages
          }
        });
        
        this.subscriptions.push(sub);
        console.log('✅ Subscription ajoutée, total:', this.subscriptions.length);
        console.groupEnd();
      }).catch(error => {
        console.error('❌ Erreur lors de la connexion:', error);
        observer.error(error);
        console.groupEnd();
      });

      return () => {
        console.log('🔌 Nettoyage subscription:', destination);
        // Find and remove the subscription
        const subIndex = this.subscriptions.length - 1; // Last added subscription
        if (subIndex >= 0) {
          const sub = this.subscriptions[subIndex];
          sub.unsubscribe();
          this.subscriptions.splice(subIndex, 1);
          console.log('✅ Subscription supprimée, restantes:', this.subscriptions.length);
        }
      };
    });
  }

  /** Get current connection state. */
  getConnectionState(): ConnectionState {
    return this.connection$.value;
  }

  /** Check if connected. */
  isConnected(): boolean {
    return this.connection$.value === 'CONNECTED' && this.client?.connected === true;
  }

  /** Get connection state as observable. */
  getConnectionState$(): Observable<ConnectionState> {
    return this.connection$.asObservable();
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}


