export interface AuthToken {
  user_id: string;
  epoch: number;
  signature: string;
}

export interface Conversation {
  id: string;
  role: 'AI' | 'AGENT' | 'USER';
  text: string;
  created_at: string;
  time_ago: string;
  num_unread_messages: number;
}

export type MessageRole = 'AI' | 'AGENT' | 'USER';

export interface Message {
  id: number;
  conversation_id: string;
  role: MessageRole;
  text: string;
  created_at: string;
  time_ago: string;
}

export interface NewConversationResponse {
  conversation_id: string;
}

export interface UserConversationsResponse {
  conversations: Conversation[];
}

export interface ConversationHistoryResponse {
  messages: Message[];
  destination: string;
}

export interface ChatCompletionRequest {
  conversation_id: string;
  text: string;
  flow_id: string;
  metadata: any;
  action_id?: string;
}

export type ChatCompletionResponse = ChatCompletionResponseEvent[];

export type ChatCompletionEventType = 'start_typing'| 'chat_message' | 'stop_typing';

export interface ChatCompletionResponseEvent {
  type: ChatCompletionEventType | string;
  role?: MessageRole;
  text?: string;
  channel?: string;
  choices?: string[];
  message?: string[];
  error?: string;
  chosen_playbook: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}