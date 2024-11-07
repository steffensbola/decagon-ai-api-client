// api.ts
import axios, { AxiosInstance } from 'axios';
import crypto from 'crypto';
import { AuthToken, NewConversationResponse, UserConversationsResponse, ConversationHistoryResponse, ChatCompletionRequest, ChatCompletionResponse } from './types';

class DecagonAPI {
  private readonly apiClient: AxiosInstance;
  private readonly teamId: string;
  private readonly privateKey: string;

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
    this.setAuthHeaders(userId);
    const response = await this.apiClient.post<ChatCompletionResponse>('/chat/completion', request);
    return response.data;
  }
}

export default DecagonAPI;