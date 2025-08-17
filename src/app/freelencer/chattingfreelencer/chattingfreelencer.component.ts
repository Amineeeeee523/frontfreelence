import { Component, OnInit, OnDestroy, ViewChild, ElementRef, ChangeDetectorRef, ChangeDetectionStrategy, Pipe, PipeTransform } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { faPaperPlane, faBars, faEllipsisV, faCheckDouble, faTimes, faSearch, faClock, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';
import { Subscription } from 'rxjs';
import { finalize, filter } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

import { ConversationSummary } from '../../models/conversation-summary.model';
import { ChatMessage, ChatMessageType, MessageStatus } from '../../models/chat-message.model';
import { ConversationService } from '../../services/conversation.service';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';
import { Utilisateur } from '../../models/utilisateur.model';
import { Page } from '../../models/page.model';

@Pipe({
  name: 'linky',
  standalone: true
})
export class LinkyPipe implements PipeTransform {
  private urlRegex = /(\b(https?|ftp|file):\/\/[\-A-Z0-9+&@#\/%?=~_|!:,.;]*[\-A-Z0-9+&@#\/%=~_|])/ig;
  transform(value: string): string {
    return value.replace(this.urlRegex, url => `<a href="${url}" target="_blank">${url}</a>`);
  }
}

interface MessageGroup {
  date: string;
  messages: ChatMessage[];
}

@Component({
  selector: 'app-chattingfreelencer',
  standalone: true,
  imports: [CommonModule, FormsModule, FontAwesomeModule, LinkyPipe],
  templateUrl: './chattingfreelencer.component.html',
  styleUrls: ['./chattingfreelencer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChattingfreelencerComponent implements OnInit, OnDestroy {

  faPaperPlane = faPaperPlane;
  faBars = faBars;
  faEllipsisV = faEllipsisV;
  faCheckDouble = faCheckDouble;
  faTimes = faTimes;
  faSearch = faSearch;
  faClock = faClock;
  faExclamationCircle = faExclamationCircle;

  conversations: ConversationSummary[] = [];
  filteredConversations: ConversationSummary[] = [];
  selectedConversation: ConversationSummary | null = null;
  messageGroups: MessageGroup[] = [];
  messageContent = '';
  isLoading = false;
  isLoadingMore = false;
  isSidebarOpen = false;
  currentUser: Utilisateur | null = null;
  searchTerm = '';

  private preselectedConvId?: number;
  private currentPage = 0;
  private totalPages = 0;
  private readonly pageSize = 50;
  private subscriptions = new Subscription();
  public MessageStatus = MessageStatus;

  @ViewChild('messageContainer') private messageContainer!: ElementRef;
  @ViewChild('messageInput') private messageInput!: ElementRef;

  constructor(
    private conversationService: ConversationService,
    private chatService: ChatService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      if (params['convId']) this.preselectedConvId = +params['convId'];
    });

    this.chatService.connect();

    this.currentUser = this.authService.snapshot;
    this.subscriptions.add(
      this.authService.user$.pipe(filter((u): u is Utilisateur => !!u))
        .subscribe(user => {
          this.currentUser = user;
          this.cdr.markForCheck();
        })
    );
    
    this.loadConversations();
    this.subscribeToMessages();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.chatService.disconnect();
  }

  private loadConversations(): void {
    this.isLoading = true;
    this.subscriptions.add(this.conversationService.list().subscribe({
      next: (convs) => {
        this.conversations = convs;
        this.applyFilters();
        const convToSelect = this.preselectedConvId 
          ? convs.find(c => c.conversationId === this.preselectedConvId) 
          : convs[0];
        if (convToSelect) this.selectConversation(convToSelect);
        this.preselectedConvId = undefined;
        this.isLoading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }
    }));
  }

  private subscribeToMessages(): void {
    // Message envoyé localement (optimistic)
    this.subscriptions.add(this.chatService.sentMessage$.subscribe(optimisticMessage => {
      if (this.selectedConversation?.conversationId === optimisticMessage.conversationId) {
        this.addMessageToGroups(optimisticMessage, true);
        this.scrollToBottom();
      }
    }));

    // Accusé de réception du serveur
    this.subscriptions.add(this.chatService.ack$.subscribe(ackMessage => {
      this.handleAck(ackMessage);
    }));
  }

  private handleAck(ack: ChatMessage): void {
    const group = this.messageGroups.find(g => g.messages.some(m => m.tempId === ack.tempId));
    if (group) {
      const message = group.messages.find(m => m.tempId === ack.tempId);
      if (message) {
        Object.assign(message, ack, { status: MessageStatus.SENT }); // Mettre à jour avec les vraies données
        this.updateConversationSummary(ack);
        this.cdr.markForCheck();
      }
    } else {
       // Si le message n'est pas dans la vue actuelle (ex: autre conversation)
       if (this.selectedConversation?.conversationId === ack.conversationId) {
        this.addMessageToGroups(ack, true);
        this.scrollToBottom();
      }
      this.updateConversationSummary(ack, true);
    }
  }

  selectConversation(conv: ConversationSummary): void {
    if (this.isLoading || this.selectedConversation?.conversationId === conv.conversationId) return;

    this.selectedConversation = conv;
    this.messageGroups = [];
    this.currentPage = 0;
    this.totalPages = 0;
    if (this.isSidebarOpen) this.isSidebarOpen = false;
    
    this.loadMessages(conv.conversationId);
  }

  loadMessages(conversationId: number, loadMore = false): void {
    if (!loadMore) this.isLoading = true; else this.isLoadingMore = true;
    this.cdr.markForCheck();

    this.subscriptions.add(
      this.chatService.getMessages(conversationId, this.currentPage, this.pageSize)
        .pipe(finalize(() => {
          this.isLoading = false;
          this.isLoadingMore = false;
          this.cdr.markForCheck();
        }))
        .subscribe(page => {
          this.handleMessagePage(page, loadMore);
          if (this.selectedConversation && this.selectedConversation.unreadCount > 0) {
            this.markConversationAsSeen(this.selectedConversation);
          }
        })
    );
  }

  handleMessagePage(page: Page<ChatMessage>, isLoadMore: boolean): void {
    this.totalPages = page.totalPages;
    const messages = page.content.reverse().map(m => ({ ...m, status: MessageStatus.SENT }));

    if (isLoadMore) {
      const currentScrollHeight = this.messageContainer.nativeElement.scrollHeight;
      const grouped = this.groupMessagesByDate(messages);
      this.messageGroups = this.mergeMessageGroups(grouped, this.messageGroups);
      this.cdr.markForCheck();
      setTimeout(() => {
        const newScrollHeight = this.messageContainer.nativeElement.scrollHeight;
        this.messageContainer.nativeElement.scrollTop = newScrollHeight - currentScrollHeight;
      }, 0);
    } else {
      this.messageGroups = this.groupMessagesByDate(messages);
      this.scrollToBottom();
    }
  }
  
  sendMessage(event: Event): void {
    event.preventDefault();
    if (!this.messageContent.trim() || !this.selectedConversation || !this.currentUser?.id) return;

    const tempId = uuidv4();
    this.chatService.sendMessage({
      conversationId: this.selectedConversation.conversationId,
      content: this.messageContent,
      type: ChatMessageType.TEXT
    }, tempId, this.currentUser.id);

    this.messageContent = '';
    this.autoGrowTextarea({ target: this.messageInput.nativeElement });
  }

  private addMessageToGroups(message: ChatMessage, isNew: boolean): void {
    const messageDateStr = this.formatDateSeparator(new Date(message.timestamp));
    const lastGroup = this.messageGroups[this.messageGroups.length - 1];

    if (lastGroup && lastGroup.date === messageDateStr) {
      lastGroup.messages.push(message);
    } else {
      this.messageGroups.push({ date: messageDateStr, messages: [message] });
    }
    if (isNew) this.updateConversationSummary(message);
    this.cdr.markForCheck();
  }

  private groupMessagesByDate(messages: ChatMessage[]): MessageGroup[] {
    return messages.reduce((groups, msg) => {
      const dateKey = this.formatDateSeparator(new Date(msg.timestamp));
      let group = groups.find(g => g.date === dateKey);
      if (group) group.messages.push(msg); else groups.push({ date: dateKey, messages: [msg] });
      return groups;
    }, [] as MessageGroup[]);
  }

  private mergeMessageGroups(newGroups: MessageGroup[], existingGroups: MessageGroup[]): MessageGroup[] {
    if (!newGroups.length) return existingGroups;
    if (!existingGroups.length) return newGroups;

    const merged = [...newGroups];
    const lastOfNew = merged[merged.length - 1];
    const firstOfExisting = existingGroups[0];

    if (firstOfExisting.date === lastOfNew.date) {
      lastOfNew.messages.push(...firstOfExisting.messages);
      return [...merged, ...existingGroups.slice(1)];
    }
    return [...merged, ...existingGroups];
  }

  private formatDateSeparator(date: Date): string {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === today.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === yesterday.toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  private updateConversationSummary(message: ChatMessage, fromSocket = false): void {
    const conv = this.conversations.find(c => c.conversationId === message.conversationId);
    if (conv) {
      conv.lastMessagePreview = message.content;
      conv.lastMessageAt = message.timestamp;
      conv.lastMessageType = message.type;
      conv.lastMessageSenderId = message.senderId;
      if (fromSocket && this.selectedConversation?.conversationId !== message.conversationId) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
      }
      this.applyFilters();
    }
  }

  public applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    let list = this.conversations.filter(c => term ? c.missionTitre.toLowerCase().includes(term) : true);
    list.sort((a, b) => new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime());
    this.filteredConversations = list;
    this.cdr.markForCheck();
  }

  public clearSearch(): void {
    this.searchTerm = '';
    this.applyFilters();
  }

  private markConversationAsSeen(conv: ConversationSummary): void {
    if (conv.unreadCount > 0) {
      this.subscriptions.add(
        this.chatService.markSeen(conv.conversationId).subscribe(() => {
          conv.unreadCount = 0;
          this.cdr.markForCheck();
        })
      );
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      if(this.messageContainer) this.messageContainer.nativeElement.scrollTop = this.messageContainer.nativeElement.scrollHeight;
    }, 50);
  }

  isMyMessage(message: ChatMessage): boolean {
    return message.senderId === this.currentUser?.id;
  }

  isConsecutiveMessage(messages: ChatMessage[], index: number, checkPrevious: boolean): boolean {
    const current = messages[index];
    const other = checkPrevious ? messages[index - 1] : messages[index + 1];
    return other && current.senderId === other.senderId;
  }

  onScroll(event: Event): void {
    const target = event.target as HTMLElement;
    if (target.scrollTop === 0 && !this.isLoadingMore && this.currentPage < this.totalPages - 1) {
      this.currentPage++;
      this.loadMessages(this.selectedConversation!.conversationId, true);
    }
  }
  
  autoGrowTextarea(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';
    textarea.style.height = (textarea.scrollHeight) + 'px';
  }

  toggleSidebar(): void { this.isSidebarOpen = !this.isSidebarOpen; }
  
  navigateToMission(): void {
    if(this.selectedConversation?.missionId) {
      this.router.navigate(['/freelencer/missions', this.selectedConversation.missionId]);
    }
  }
}

