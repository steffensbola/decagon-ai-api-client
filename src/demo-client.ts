
import DecagonAPI from './api';
import dotenv from 'dotenv';

dotenv.config();

const baseURL = process.env.BASE_URL!;
const teamId = process.env.TEAM_ID!;
const privateKey = process.env.PRIVATE_KEY!;
const flowId = process.env.FLOW_ID!


const decagonAPI = new DecagonAPI(baseURL, teamId, privateKey);

async function main() {
  const userId = 'user123';
  const metadata = { key: 'value' };

  // Create a new conversation
  const newConversation = await decagonAPI.createNewConversation(userId, flowId, metadata);
  console.log('New Conversation ID:', newConversation.conversation_id);

  // Get user conversations
  const userConversations = await decagonAPI.getUserConversations(userId);
  console.log('User Conversations:', userConversations.conversations);

  // Get conversation history
  const conversationHistory = await decagonAPI.getConversationHistory(userId, newConversation.conversation_id);
  console.log('Conversation History:', conversationHistory.messages);

  // Chat completion
  const chatRequest = {
    conversation_id: newConversation.conversation_id,
    text: 'Hello, how can I help you?',
    flow_id: flowId,
    metadata,
  };
  const chatResponse = await decagonAPI.chatCompletion(userId, chatRequest);
  console.log('Chat Response:', chatResponse.events);

  // WebSocket connection
  decagonAPI.connectWebSocket(userId, (message) => {
    console.log('WebSocket Message:', message);
  });

  // Send a WebSocket message
  const wsMessage = {
    type: 'message',
    data: {
      conversation_id: newConversation.conversation_id,
      text: 'Hello from WebSocket!',
    },
  };
  decagonAPI.sendWebSocketMessage(wsMessage);

  // Close the WebSocket connection after some time
  setTimeout(() => {
    decagonAPI.closeWebSocket();
  }, 10000);
}

main().catch(console.error);