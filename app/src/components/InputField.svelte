<!-- src/lib/components/InputField.svelte -->
<script>
    export let placeholder = "";
    export let multiline = false;
    export let value = "";
    import { createEventDispatcher } from 'svelte';
  
    const dispatch = createEventDispatcher();
  
    function handleSubmit(event) {
      event.preventDefault();
      dispatch('submit');
    }
  
    function handleKeyDown(event) {
      if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        dispatch('submit');
      }
    }
  </script>
  
  <form on:submit={handleSubmit} class="flex-1">
    {#if multiline}
      <textarea
        class="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-black overflow-y-auto resize-none"
        {placeholder}
        bind:value
        on:keydown={handleKeyDown}
      ></textarea>
    {:else}
      <input
        type="text"
        class="w-full p-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-300 text-black"
        {placeholder}
        bind:value
        on:keydown={handleKeyDown}
      />
    {/if}
  </form>