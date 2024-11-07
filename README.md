# Decagon AI API Sample client
This is a sample application to interact with Decagon.ai through chat [API Enpoints](https://decagon.notion.site/External-Docs-fa24a4ca00cc4b5aa2c7f7652c1c458d).


## Authentication

All Decagon endpoints require authentication to validate a user and prevent impersonation. The first step in authenticating a user is to generate a signature for them [by following the instruction here](https://docs.decagon.ai/adding-decagon-to-your-website/authenticating-users). Once you have a user's signature, send the following headers to each request made to Decagon.

```json
X-DECAGON-AUTH-USER-ID: <A self-specified user ID for this user>

X-DECAGON-AUTH-TEAM-ID: <A team ID provided to you by Decagon>

X-DECAGON-AUTH-SIGNATURE: <Signature that you just computed>

X-DECAGON-AUTH-EPOCH: <Epoch used in the signature>
```

## REST Endpoints

### **POST /conversation/new**

This endpoint is used to create a new conversation for a user. This endpoint accepts 2 values in the POST body, a `flow_id` which is a Decagon-specified value indicating the flow that this conversation should use, and `metadata` which is an arbitrary JSON value that can be used within the flow. This is typically used to pass things like customer identifiers, tokens, customer types, and other metadata to the AI to use. The expected POST body is:

```json
{

	"flow_id": str

	"metadata": json

}
```

The expected return value is the conversation ID of the newly created conversation:

```json
{

	"conversation_id": str

}
```

### GET /conversation/user

This endpoint is used to retrieve all the conversations for a given user. It also returns metadata about each conversation for use on an "All Conversations" page. This endpoint accepts no parameters, and returns:

```json
{
    "conversations": [
        {
            "id": str <Conversation ID>,
            "role": str <Role of the last responding person: AI, AGENT or USER>,
            "text": str <Content of the last message>,
            "created_at": timestamp <Timestamp of the last message>,
            "time_ago": str <Human readable time-ago of the last message>,
            "num_unread_messages": int <Number of unread messages>
        }
    ....]
}
```

### GET /conversation/history

This endpoint returns the history of a single conversation. It accepts a single parameter - the conversation ID:

```json
conversation_id: str
```

In response, it returns the history of the conversation:

```json
{
    "messages": [
        {
            "id": int <A globally unique ID for this message>,
            "conversation_id": str <The current conversation ID>,
            "role": str <Role of the person: AI, AGENT or USER>,
            "text": str <Content of the message>,
            "created_at": timestamp <Timestamp of the last message>,
            "time_ago": str <Human readable time-ago of the last message>,
        }
    ...],
    "destination": str <The destination of this conversation, eg AI, ZENDESK, etc>
}
```

### POST /chat/completion

If you wish to interact with the AI models over a REST endpoint instead of a WebSocket, you can use this endpoint to generate AI chat messages. The endpoint must be sent the following POST body:

```json
{
    "conversation_id": str <The conversation ID for this conversation>,
    "text": str <The text content of the message>,
    "flow_id": str <The flow ID to use for this message, see creating a conversation>
    "metadata": json <The metadata for this conversation, see creating a conversation>
    "action_id": Optional[str] <The action ID that was chosen>
}
```

In response, you will receive the following response:

```json
{
    "events": List[Event] <An array of events to display>
}
```

Each event will be one of the objects below. For instance, it may display a series of messages or a transfer message followed by an escalation indicator.

**Completed message**

If a complete message was generated:

```json
{
    "type": "chat_message",
    "role": "AI" | "AGENT",
    "text": str <The text content of the message>
}
```

**Closing the conversation**

If the conversation has been closed (typically through a live agent closing the conversation), Decagon returns this indicator:

```json
{
    "type": "close_conversation"
}
```

**Escalation indicator**

In the event that a chat is escalated from the AI to a human agent, an escalation indicator is returned:

```json
{
    "type": "escalation_to_human",
    "channel": str <Customer specified escalation channel>
}
```

**Chat Actions**

Decagon supports the ability to return "Action Buttons". In the case of an action button being returned, the following payload is returned:

```json
{
    "type": "chat_actions",
    "choices": [
        <Customer defined array of action options>
    ]
}
```

**Suggested Next Messages**

Instead of relying on the user to come up with the right next things to ask / do, Decagon helpfully offers a list of potential next messages to display to the user for them to select from:

```json
{
    "type": "suggested_messages",
    "message": [
        str <A suggested message>
    ]
}
```

**Errors**

If Decagon runs into an error that should be displayed to the user, the following payload is returned:

```json
{
    "type": "error"
    "error": str <Description of the error that was encountered>
}
```

## WebSocket endpoints

Actually engaging in a chat requires connecting to a WebSocket to stream messages back and forth. Once a new conversation is created, or an old conversation is resumed, you can send new messages to the chat by first connecting to the `/chat/{conversation_id}` WebSocket endpoint.

### Sending a message

All messages sent from the user to the WebSocket should be in the following format:

```json
{
    "text": str <The text content of the message>,
    "flow_id": str <The flow ID to use for this message, see creating a conversation>
    "metadata": json <The metadata for this conversation, see creating a conversation>
    "action_id": Optional[str] <The action ID that was chosen>
}
```

### Receiving a message

In response to user messages, the returned stream of messages can be of the following types:

**Text Received**

If a text message is received, the payload will be of the form:

```json
{
    "type": "chat_message",
    "role": "AI" | "AGENT",
    "text": str <The text content of the message>
}
```

**Typing indicators**

To display appropriate typing indicators on the frontend, Decagon returns the following typing indicator messages:

```json
{
    "type": "start_typing" | "stop_typing"
}
```

**Closing the conversation**

If the conversation has been closed (typically through a live agent closing the conversation), Decagon returns this indicator:

```json
{
    "type": "close_conversation"
}
```

**Escalation indicator**

If a chat is escalated from the AI to a human agent, an escalation indicator is returned:

```json
{
    "type": "escalation_to_human",
    "channel": str <Customer specified escalation channel>
}
```

**Chat Actions**

Decagon supports the ability to return "Action Buttons". In the case of an action button being returned, the following payload is returned:

```json
{
    "type": "chat_actions",
    "choices": [
        <Customer defined array of action options>
    ]
}
```

**Suggested Next Messages**

Instead of relying on the user to come up with the right next things to ask / do, Decagon helpfully offers a list of potential next messages to display to the user for them to select from:

```json
{
    "type": "suggested_messages",
    "message": [
        str <A suggested message>
    ]
}
```

**Errors**

If Decagon runs into an error that should be displayed to the user, the following payload is returned:

```json
{
    "type": "error"
    "error": str <Description of the error that was encountered>
}
```
