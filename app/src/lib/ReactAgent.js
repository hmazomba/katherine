// src/lib/ReActAgent.js
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { ChatGroq } from "@langchain/groq";
import { MemorySaver } from "@langchain/langgraph/web";

class ReActAgent {
    constructor() {
        this.searchTool = new TavilySearchResults({
            maxResults: 3,
        });

        this.model = new ChatGroq({
            model: "llama-3.2-90b-vision-preview",
            temperature: 0.5,
        });

        this.system_prompt = `You are a helpful assistant.`;
        this.memory = new MemorySaver();

        this.agent = createReactAgent({
            llm: this.model,
            tools: [this.searchTool],
            checkpointSaver: this.memory,
            stateModifier: this.system_prompt,
        });
    }

    async sendMessage(message, threadId) {
        let inputs = { messages: [{ role: "user", content: message }] };
        let config = { configurable: { thread_id: threadId } };
        let stream = await this.agent.stream(inputs, {
            ...config,
            streamMode: "values",
        });
        let lastMessage = null;
        for await (const { messages } of stream) {
            let msg = messages[messages?.length - 1];
            if (msg?.content) {
                 lastMessage = msg.content;
             }
        }

        return lastMessage;
    }

    async loadThread(threadId) {
        try {
            const thread = await this.memory.load(threadId);
            return thread;
        } catch (error) {
            console.error('Error loading thread:', error);
            return null
        }
    }

    async loadThreads() {
        try {
            const threadIds = await this.memory.list();
            const threads = await Promise.all(threadIds.map(async (id) => {
                const thread = await this.memory.load(id);
                return {
                    id: id,
                    messages: thread?.messages,
                    lastModified: thread?.lastModified
                }
            }));
             return threads.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
        } catch (error) {
          console.error('Error loading threads:', error)
            return [];
        }
    }

	async deleteThread(threadId) {
		try {
            await this.memory.delete(threadId)
		} catch (error) {
			console.error('Error deleting thread:', error);
		}
	}
}

export { ReActAgent };