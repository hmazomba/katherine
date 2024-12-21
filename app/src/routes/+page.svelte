<!-- src/routes/+page.svelte -->
<script>
  import InputField from '../components/InputField.svelte';
  import SendButton from '../components/SendButton.svelte';
  import ChatBubble from '../components/ChatBubble.svelte';
  import Sidebar from '../components/Sidebar.svelte';
  import ExportButton from '../components/ExportButton.svelte';
  import Rating from '../components/Rating.svelte';
  import { onMount } from 'svelte';
  import { createReactAgent } from "@langchain/langgraph/prebuilt";
  import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
  import { ChatGroq } from "@langchain/groq";
  import { MemorySaver } from "@langchain/langgraph/web";
  import { WebBrowser } from "langchain/tools/webbrowser";
  import { CohereEmbeddings } from "@langchain/cohere";

  let messages = [];
  let currentThreadId = null;
  let threads = [];
  let isLoading = false;
  let responseTime = null;
  let userRating = null;
  let showSidebar = true;
  let input = "";

  const searchTool = new TavilySearchResults({
    maxResults: 3,
    apiKey: import.meta.env.VITE_TAVILY_API_KEY,
  });

  const model = new ChatGroq({
    model: "llama-3.2-90b-vision-preview",
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    temperature: 0,
  });

  const system_prompt = `You are a helpful AI Assistant with access to the Web. When performing tasks needing supplemental information, search the web and follow URLs and context from page content to navigate to relevant sources. Prioritize authoritative results and try to resolve errors by understanding error codes. For web page navigation, if the page accessed doesn't provide immediate answers, identify follow-up URLs or page elements that direct to the needed information.

## When using create, edit, and log playground endpoints:
1. Be verbose about your intentions.
2. Maintain a "current state" of the project, summarizing what has been implemented and what remains.
3. Use pro_mode=true only when explicitly asked by the user. Remember this preference for the project's duration or until instructed otherwise.
4. If unsure about the current structure of main.js in your p5js project, use 'recover_playground' to get the full code snapshot.
5. Build the project in "medium sized bites" - neither too incremental nor too ambitious at once.
6. Suggest user testing and feedback at appropriate intervals.
7. Keep the latest snapshot of the line-numbered main.js file in your context.
8. Proceed to follow-up steps and move progress forward at your own discretion, only stopping for user instruction or input when necessary.

## When editing playgrounds without pro_mode:
- After each change, internally review the response source code for syntax errors like duplicated code blocks, missing or duplicate curly brackets, missing semicolons, etc., and correct them before prompting the user to test the build.
- Consider the previous state of the latest source code from the last response when deciding which line numbers to start and end at for new code changes.
- Be precise with insert, replace, and delete actions. Avoid using placeholders like "// ... rest of the previously implemented code" as they will be written exactly into the code base.
- For insert: Use a single 'line' number.
- For replace and delete: Use 'start_line' and 'end_line'.
- Aim for precision in your edits, ensuring accuracy and relevance of the changes made.

## Pro Mode usage in edit_playground function:
- Use pro_mode=true only when explicitly instructed. Never commit changes without pro mode enabled.
- Always include a changelog in your initial pro mode request.
- Preview changes with preview_commit before committing in Pro Mode.
- Allow user testing and feedback after each commit in Pro Mode.

You have files uploaded as knowledge to pull from. Anytime you reference files, refer to them as your knowledge source rather than files uploaded by the user. You should adhere to the facts in the provided materials. Avoid speculations or information not contained in the documents. Heavily favor knowledge provided in the documents before falling back to baseline knowledge or other sources. If searching the documents didn"t yield any answer, just say that. Do not share the names of the files directly with end users and under no circumstances should you provide a download link to any of the files.`;
  const memory = new MemorySaver();

 

  const llm = new ChatGroq({
    apiKey: import.meta.env.VITE_GROQ_API_KEY,
    model: "mixtral-8x7b-32768",
    temperature: 0,
    maxTokens: undefined,
    maxRetries: 5,
  });

  const embeddings = new CohereEmbeddings({
    model: "embed-english-v3.0", 
    apiKey: import.meta.env.VITE_COHERE_API_KEY
  });

  const browser = new WebBrowser({ model: llm, embeddings });
  const agent = createReactAgent({ llm: model, tools: [searchTool, browser], checkpointSaver: memory, stateModifier: system_prompt});
  async function generateSummary(messages) {
    try {
      const prompt = `Summarize the following conversation in a short title (max 10 words): ${JSON.stringify(messages)}`;
      const response = await llm.invoke(prompt);
      return response.content;
    } catch (error) {
      console.error("Error generating summary:", error);
      return "New Chat";
    }
  }

  async function sendMessage() {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input, timestamp: new Date() };
    messages = [...messages, userMessage];
    input = "";
    isLoading = true;
    const startTime = performance.now();

    try {
      let inputs = { messages: messages.map(msg => ({ role: msg.role, content: msg.content })) };
      let config = { configurable: { thread_id: currentThreadId || Date.now().toString() } };
      if (!currentThreadId) {
        currentThreadId = config.configurable.thread_id;
      }
      let stream = await agent.stream(inputs, {
        ...config,
        streamMode: "values",
      });

      let finalMessages = null;
      for await (const { messages: streamMessages } of stream) {
        finalMessages = streamMessages;
      }

      if (finalMessages && finalMessages.length > 0) {
        const lastMessage = finalMessages[finalMessages.length - 1];
        let aiMessage;
        if (lastMessage?.content) {
          aiMessage = { role: "assistant", content: lastMessage.content, timestamp: new Date() };
        } else if (lastMessage?.tool_calls?.length > 0) {
          aiMessage = { role: "assistant", content: `Tool calls: ${JSON.stringify(lastMessage.tool_calls)}`, timestamp: new Date() };
        } else {
          aiMessage = { role: "assistant", content: "No content or tool calls in last message", timestamp: new Date() };
        }
        messages = [...messages, aiMessage];

        if (messages.filter(msg => msg.role === 'assistant').length === 1) {
          const summary = await generateSummary(messages);
          saveThread(summary);
        } else {
          saveThread();
        }
      }
      
      const endTime = performance.now();
      responseTime = (endTime - startTime) / 1000;
    } catch (error) {
      console.error("Error processing message:", error);
      messages = [...messages, { role: "assistant", content: "Error processing message.", timestamp: new Date() }];
    } finally {
      isLoading = false;
    }
  }

  async function loadThread(threadId) {
    const savedThread = localStorage.getItem(`thread-${threadId}`);
    if (savedThread) {
      const parsedThread = JSON.parse(savedThread);
      messages = parsedThread.messages;
      currentThreadId = parsedThread.threadId;
    }
  }

  function saveThread(summary = null) {
    if (currentThreadId) {
      const threadData = {
        threadId: currentThreadId,
        messages: messages,
        rating: userRating,
        summary: summary,
      };
      localStorage.setItem(`thread-${currentThreadId}`, JSON.stringify(threadData));
      loadThreads();
    }
  }

  function deleteThread(threadId) {
    localStorage.removeItem(`thread-${threadId}`);
    loadThreads();
    if (currentThreadId === threadId) {
      messages = [];
      currentThreadId = null;
    }
  }

  function loadThreads() {
    threads = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("thread-")) {
        const threadData = JSON.parse(localStorage.getItem(key));
        if (threadData) {
          threads.push({
            id: threadData.threadId,
            preview: threadData.summary || threadData.messages.filter(msg => msg.role === 'user').slice(-1)[0]?.content || 'No user message',
            timestamp: threadData.messages.filter(msg => msg.role === 'user').slice(-1)[0]?.timestamp || 'No timestamp',
          });
        }
      }
    }
    threads.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  }

  function handleRating(rating) {
    userRating = rating;
    saveThread();
  }

  async function exportConversation() {
    const exportData = {
      threadId: currentThreadId,
      messages: messages,
      rating: userRating,
    };
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `conversation-${currentThreadId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function handleNewChat() {
    messages = [];
    currentThreadId = null;
  }

  onMount(() => {
    loadThreads();
  });
</script>

<div class="font-raleway text-black bg-white min-h-screen flex">
  <Sidebar
      threads={threads}
      onSelect={loadThread}
      onDelete={deleteThread}
      on:newchat={handleNewChat}
      bind:showSidebar
    />
  <div class="flex-1 flex flex-col p-4 relative">
    <div class="flex-1 overflow-y-auto mb-4">
      {#each messages as message}
        <ChatBubble {message} />
      {/each}
    </div>
    <div class="flex items-center justify-between">
      <InputField placeholder="Enter your question here." multiline bind:value={input} on:submit={sendMessage} />
      <SendButton onClick={sendMessage} isLoading={isLoading} />
    </div>
    {#if responseTime}
      <p class="text-sm text-gray-500 mt-2">Response Time: {responseTime.toFixed(2)} seconds</p>
    {/if}
    <div class="flex items-center justify-between mt-2">
      <Rating onRate={handleRating} initialRating={userRating} />
      <ExportButton onExport={exportConversation} />
    </div>
  </div>
</div>

<style>
  @import url('https://fonts.googleapis.com/css2?family=Raleway:wght@400;700&display=swap');
  :root {
    font-family: 'Raleway', sans-serif, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
</style>