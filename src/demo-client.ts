
import DecagonAPI from './api';
import dotenv from 'dotenv';
import { safeAsync } from './safe-async';

dotenv.config();

const baseURL = process.env.BASE_URL!;
const teamId = process.env.TEAM_ID!;
const privateKey = process.env.PRIVATE_KEY!;
const flowId = process.env.FLOW_ID!


const decagonAPI = new DecagonAPI(baseURL, teamId, privateKey);

async function main() {
  const userId = 'user1234';
  const metadata = { 
    user_type: 'user_type',
    email: 'email@example.org',
    firstName: 'Chris',
    lastName: 'Steffens',
  };


  // Create a new conversation
  const newConversation = await safeAsync(() => decagonAPI.createNewConversation(userId, flowId, metadata));
  if(newConversation.error) return console.error('Error:', newConversation.error);
  console.log('New Conversation:', newConversation.data);

  // Get user conversations
  const userConversations = await decagonAPI.getUserConversations(userId);
  console.log('User Conversations:', userConversations.conversations);

  
  // Chat completion
  const chatRequest = {
    conversation_id: newConversation.data.conversation_id,
    text: 'Hi, how can I edit contact information?',
    flow_id: flowId,
    metadata
  };
  const chatResponse = await decagonAPI.chatCompletion(userId, chatRequest);
  console.log('Chat Response:', chatResponse.map((event) => event.text));
  
  // Get conversation history
  const conversationHistory = await decagonAPI.getConversationHistory(userId, newConversation.data.conversation_id);
  console.log('Conversation History:', conversationHistory.messages);

  // Set CSAT
  const conversationCsat = await decagonAPI.setCSAT(userId, newConversation.data.conversation_id, 5);
  console.log('Conversation CSAT:', conversationCsat);

  // Set ar read
  const markReadResult = await safeAsync(() => decagonAPI.markConversationRead(userId, newConversation.data.conversation_id));
  if(markReadResult.error) return console.log('Error marking conversation as read:', markReadResult.error);
  console.log('Conversation marked as read');


  // Prepare a WebSocket message
  const wsMessage = {
      text: 'Hello from WebSocket!',
      type: 'chat_message',
      flow_id: flowId,
      metadata: {'newField': 'this is new metadata pushed from the web socket',
        'richMetadataField': {business_name: 'the name', studio_id: "the studioId", a_nested_object:{a_property: 'prop_value'}}, ...metadata},
    };

  // WebSocket connection
  decagonAPI.connectWebSocket(
    userId, 
    newConversation.data.conversation_id, 
    ()=> {
      decagonAPI.sendWebSocketMessage(wsMessage)
    },
    (message) => {
      console.log('WebSocket Message:', message)
    }
  );

  // Close the WebSocket connection after some time
  setTimeout(() => {
    decagonAPI.closeWebSocket();
  }, 10000);
}

main().catch(console.error);