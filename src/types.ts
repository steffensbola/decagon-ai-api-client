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

export interface Message {
  id: number;
  conversation_id: string;
  role: 'AI' | 'AGENT' | 'USER';
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

export interface ChatCompletionResponse {
  events: Event[];
}

export interface Event {
  type: string;
  role?: 'AI' | 'AGENT';
  text?: string;
  channel?: string;
  choices?: string[];
  message?: string[];
  error?: string;
}

export interface WebSocketMessage {
  type: string;
  data: any;
}