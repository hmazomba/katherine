<!-- src/lib/components/SendButton.svelte -->
<script>
    export let onClick;
    export let isLoading = false;
  </script>
  
  <button
    on:click={onClick}
    class="ml-2 p-2 rounded-md bg-purple-500 hover:bg-purple-600 text-white shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
    disabled={isLoading}
  >
    {#if isLoading}
      <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
    {:else}
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-6 h-6">
        <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.769 59.769 0 0121.485 12a59.77 59.77 0 01-18.216 8.874L6 12z" />
      </svg>
    {/if}
  </button>