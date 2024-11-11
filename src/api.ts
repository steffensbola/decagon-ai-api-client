import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import WebSocket from 'ws';
import { AuthToken, NewConversationResponse, UserConversationsResponse, ConversationHistoryResponse, ChatCompletionRequest, ChatCompletionResponse, WebSocketMessage } from './types';

class DecagonAPI {
  private readonly apiClient: AxiosInstance;
  private readonly teamId: string;
  private readonly privateKey: string;
  private wsClient?: WebSocket;

  constructor(baseURL: string, teamId: string, privateKey: string) {
    this.apiClient = axios.create({ baseURL });
    this.teamId = teamId;
    this.privateKey = privateKey;
  }

  /**
   * Generates an authentication token for a user.
   * @param userId - The user ID.
   * @returns The authentication token.
   */
  private generateAuthToken(userId: string): AuthToken {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!this.privateKey) {
      throw new Error('Private key is required');
    }
    const epoch = Math.floor(Date.now() / 1000) + 24 * 60 * 60; // Token valid for 24 hours
    const message = userId + epoch;
    const signature = crypto.createHmac('sha256', this.privateKey).update(message).digest('hex');

    return {
      user_id: userId,
      epoch,
      signature,
    };
  }

  /**
   * Sets the authentication headers for the API client.
   * @param userId - The user ID.
   */
  private setAuthHeaders(userId: string) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    const token = this.generateAuthToken(userId);
    this.apiClient.defaults.headers.common['X-DECAGON-AUTH-USER-ID'] = token.user_id;
    this.apiClient.defaults.headers.common['X-DECAGON-AUTH-TEAM-ID'] = this.teamId;
    this.apiClient.defaults.headers.common['X-DECAGON-AUTH-SIGNATURE'] = token.signature;
    this.apiClient.defaults.headers.common['X-DECAGON-AUTH-EPOCH'] = token.epoch.toString();
  }

  /**
   * Creates a new conversation.
   * @param userId - The user ID.
   * @param flowId - The flow ID.
   * @param metadata - Additional metadata for the conversation.
   * @returns The response containing the new conversation ID.
   */
  public async createNewConversation(userId: string, flowId: string, metadata: any): Promise<NewConversationResponse> {
    this.setAuthHeaders(userId);
    const response = await this.apiClient.post<NewConversationResponse>('/conversation/new', { flow_id: flowId, metadata });
    return response.data;
  }

  /**
   * Retrieves the conversations for a user.
   * @param userId - The user ID.
   * @returns The response containing the user's conversations.
   */
  public async getUserConversations(userId: string): Promise<UserConversationsResponse> {
    this.setAuthHeaders(userId);
    const response = await this.apiClient.get<UserConversationsResponse>('/conversation/user');
    return response.data;
  }

  /**
   * Retrieves the history of a conversation.
   * @param userId - The user ID.
   * @param conversationId - The conversation ID.
   * @returns The response containing the conversation history.
   */
  public async getConversationHistory(userId: string, conversationId: string): Promise<ConversationHistoryResponse> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    this.setAuthHeaders(userId);
    const response = await this.apiClient.get<ConversationHistoryResponse>('/conversation/history', { params: { conversation_id: conversationId } });
    return response.data;
  }

  /**
   * Sends a chat completion request.
   * @param userId - The user ID.
   * @param request - The chat completion request.
   * @returns The response containing the chat completion events.
   */
  public async chatCompletion(userId: string, request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!request) {
      throw new Error('Invalid chat completion request');
    }
    this.setAuthHeaders(userId);
    const response = await this.apiClient.post<ChatCompletionResponse>('/chat/completion', request);
    return response.data;
  }

  /**
   * Sets conversation as read.
   * @param userId - The user ID.
   * @param conversationId - The conversation ID.
   */
  public async markConversationRead(userId: string, conversationId: string): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    this.setAuthHeaders(userId);
    await this.apiClient.post('/conversation/mark_read', { conversation_id: conversationId });
  }

  /**
   * Sets the CSAT score for a conversation.
   * @param userId - The user ID.
   * @param conversationId - The conversation ID.
   * @param score 
   */
  public async setCSAT(userId: string, conversationId: string, score: number): Promise<void> {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!conversationId) {
      throw new Error('Conversation ID is required');
    }
    if (score === undefined || score === null) {
      throw new Error('Score is required');
    }
    this.setAuthHeaders(userId);
    await this.apiClient.post('/csat/set', { conversation_id: conversationId, score });
  }

  /**
   * Connects to the WebSocket server.
   * @param userId - The user ID.
   * @param onMessage - Callback function to handle incoming messages.
   */
  public connectWebSocket(userId: string, onMessage: (message: WebSocketMessage) => void) {
    if (!userId) {
      throw new Error('User ID is required');
    }
    if (!onMessage) {
      throw new Error('onMessage callback is required');
    }
    const token = this.generateAuthToken(userId);
    const wsUrl = `wss://api.decagon.ai/ws?user_id=${token.user_id}&team_id=${this.teamId}&signature=${token.signature}&epoch=${token.epoch}`;
    this.wsClient = new WebSocket(wsUrl);

    this.wsClient.on('open', () => {
      console.log('WebSocket connection opened');
    });

    this.wsClient.on('message', (data) => {
      const message: WebSocketMessage = JSON.parse(data.toString());
      onMessage(message);
    });

    this.wsClient.on('close', () => {
      console.log('WebSocket connection closed');
    });

    this.wsClient.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  /**
   * Sends a message over the WebSocket connection.
   * @param message - The message to send.
   */
  public sendWebSocketMessage(message: WebSocketMessage) {
    if (!message) {
      throw new Error('Message is required');
    }
    if (this.wsClient && this.wsClient.readyState === WebSocket.OPEN) {
      this.wsClient.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open');
    }
  }

  /**
   * Closes the WebSocket connection.
   */
  public closeWebSocket() {
    if (this.wsClient) {
      this.wsClient.close();
    }
  }
}

export default DecagonAPI;