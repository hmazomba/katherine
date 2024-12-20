<script>
    export let message;
    function formatTime(date) {
      if (!(date instanceof Date)) {
        return 'Invalid Date';
      }
      return date.toLocaleTimeString();
    }
</script>

<div class="chat-container">
  <div class="chat-bubble {message.role === 'user' ? 'user' : 'assistant'}">
    <p class="chat-header">{message.role === 'user' ? 'You' : 'AI'}</p>
    <p class="chat-message">{message.content}</p>
    <p class="chat-timestamp">{formatTime(message.timestamp)}</p>
  </div>
</div>

<style>
  .chat-container {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    margin-bottom: 1rem;
  }

  .chat-container .chat-bubble {
    max-width: 60%;
    padding: 1rem;
    border-radius: 1rem;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    margin: 0.5rem 0;
    word-wrap: break-word;
  }

  .chat-container .chat-bubble.user {
    align-self: flex-end;
    background-color: #e0f7fa; /* Pastel light blue */
    text-align: right;
  }

  .chat-container .chat-bubble.assistant {
    align-self: flex-start;
    background-color: #f0f9f4; /* Pastel light green */
    text-align: left;
  }

  .chat-header {
    font-weight: bold;
    margin-bottom: 0.5rem;
  }

  .chat-message {
    font-size: 1rem;
    color: #333;
  }

  .chat-timestamp {
    font-size: 0.8rem;
    color: #777;
    margin-top: 0.5rem;
  }
</style>
