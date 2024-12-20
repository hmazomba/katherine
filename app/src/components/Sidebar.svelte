<script>
    export let threads = [];
    export let onSelect;
    export let onDelete;
    import { createEventDispatcher } from 'svelte';
    import { derived, writable } from 'svelte/store';

    const dispatch = createEventDispatcher();
    const searchTerm = writable('');
    const threadsStore = writable([]);
    const isSidebarOpen = writable(true); // Sidebar state

    $: {
        threadsStore.set(threads);
    }

    const filteredThreads = derived([searchTerm, threadsStore], ([$searchTerm, $threads]) => {
        if (!$searchTerm) {
            return $threads;
        }
        const lowerSearchTerm = $searchTerm.toLowerCase();
        return $threads.filter(thread =>
            thread.preview.toLowerCase().includes(lowerSearchTerm)
        );
    });

    function handleNewChat() {
        dispatch('newchat');
    }

    function toggleSidebar() {
        $isSidebarOpen = !$isSidebarOpen; // Toggle sidebar state
    }
</script>

<style>
    .floating-button {
        position: fixed;
        top: 1rem;
        right: 1rem;
        z-index: 50;
        background-color: #e9d5ff;
        padding: 0.5rem;
        border-radius: 50%;
        box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
        cursor: pointer;
        transition: transform 0.2s;
    }

    .floating-button:hover {
        background-color: #d8b4fe;
        transform: scale(1.1);
    }
</style>

{#if $isSidebarOpen}
    <!-- Sidebar content -->
    <div class="bg-gray-100 w-64 p-4 border-r shadow-md flex flex-col">
        <div class="flex justify-between items-center mb-4">
            <h2 class="text-lg font-bold">Saved Chats</h2>
            <button class="p-2 rounded-md bg-purple-200 hover:bg-purple-300 shadow-md" on:click={toggleSidebar}>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
            </button>
        </div>
        <button on:click={handleNewChat} class="w-full p-2 mb-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white shadow-md">
            New Chat
        </button>
        <input
            type="text"
            class="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-black mb-2"
            placeholder="Search chats..."
            bind:value={$searchTerm}
        />
        <div class="overflow-y-auto flex-1">
            {#each $filteredThreads as thread (thread.id)}
                <div class="p-2 mb-2 rounded-md bg-white shadow-sm hover:bg-gray-200 cursor-pointer flex justify-between items-center">
                    <div on:click={() => onSelect(thread.id)} class="flex-1 overflow-hidden">
                        <p class="font-bold text-sm truncate" title={thread.preview}>{thread.preview}</p>
                        <p class="text-xs text-gray-500">{thread.timestamp}</p>
                    </div>
                    <button on:click={() => onDelete(thread.id)} class="p-1 rounded-md hover:bg-red-200">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-4 h-4 text-red-500">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            {/each}
        </div>
    </div>
{:else}
    <!-- Floating button when sidebar is closed -->
    <button class="floating-button" on:click={toggleSidebar}>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
        </svg>
    </button>
{/if}
    