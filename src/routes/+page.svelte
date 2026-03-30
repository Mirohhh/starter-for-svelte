<script lang="ts">
  import "../app.css";

  type Task = {
    id: number;
    text: string;
    completed: boolean;
    createdAt: Date;
  };

  type Filter = "all" | "active" | "completed";

  let tasks = $state<Array<Task>>([]);
  let newTask = $state("");
  let filter = $state<Filter>("all");
  let nextId = $state(1);

  function addTask() {
    const text = newTask.trim();
    if (!text) return;
    tasks = [
      ...tasks,
      { id: nextId++, text, completed: false, createdAt: new Date() },
    ];
    newTask = "";
  }

  function toggleTask(id: number) {
    tasks = tasks.map((t) =>
      t.id === id ? { ...t, completed: !t.completed } : t,
    );
  }

  function deleteTask(id: number) {
    tasks = tasks.filter((t) => t.id !== id);
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") addTask();
  }

  let filteredTasks = $derived(
    filter === "all"
      ? tasks
      : filter === "active"
        ? tasks.filter((t) => !t.completed)
        : tasks.filter((t) => t.completed),
  );

  let completedCount = $derived(tasks.filter((t) => t.completed).length);
  let activeCount = $derived(tasks.filter((t) => !t.completed).length);
</script>

<svelte:head>
  <title>Task Manager</title>
</svelte:head>

<main class="checker-background flex min-h-screen flex-col items-center p-5">
  <div class="mt-20 w-full max-w-[40em] lg:mt-28">
    <h1 class="text-center font-[Poppins] text-2xl font-light text-[#2D2D31]">
      Task Manager
    </h1>
    <p class="mb-8 text-center">Stay organized, one task at a time.</p>

    <div
      class="mb-8 rounded-md border border-[#EDEDF0] bg-white p-4 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)]"
    >
      <div class="flex gap-3">
        <input
          type="text"
          bind:value={newTask}
          onkeydown={handleKeydown}
          placeholder="What needs to be done?"
          class="flex-1 rounded-md border border-[#EDEDF0] bg-[#FAFAFB] px-3 py-2 text-sm text-[#56565C] placeholder-[#97979B] outline-none focus:border-[#FD366E52]"
        />
        <button
          onclick={addTask}
          class="cursor-pointer rounded-md bg-[#FD366E] px-4 py-2 text-white"
        >
          Add
        </button>
      </div>
    </div>

    {#if tasks.length > 0}
      <div class="mb-6 flex items-center justify-between">
        <div class="flex gap-2">
          {#each ["all", "active", "completed"] as f}
            <button
              onclick={() => (filter = f as Filter)}
              class={`cursor-pointer rounded-md border px-3 py-1 text-sm ${
                filter === f
                  ? "border-[#FD366E52] bg-[#FD366E14] text-[#FD366E]"
                  : "border-[#EDEDF0] bg-white text-[#56565C]"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          {/each}
        </div>
        <div class="flex gap-3 text-sm text-[#97979B]">
          <span>{activeCount} active</span>
          <span>{completedCount} done</span>
        </div>
      </div>
    {/if}

    <div class="flex flex-col gap-3">
      {#each filteredTasks as task (task.id)}
        <div
          class="flex items-center gap-3 rounded-md border border-[#EDEDF0] bg-white p-4 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)] transition-opacity duration-200"
          class:opacity-50={task.completed}
        >
          <button
            onclick={() => toggleTask(task.id)}
            class={`flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border ${
              task.completed
                ? "border-[#FD366E52] bg-[#FD366E] text-white"
                : "border-[#EDEDF0] bg-[#FAFAFB]"
            }`}
          >
            {#if task.completed}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            {/if}
          </button>
          <span
            class={`flex-1 text-sm ${task.completed ? "text-[#97979B] line-through" : "text-[#56565C]"}`}
          >
            {task.text}
          </span>
          <span class="font-[Fira_Code] text-xs text-[#97979B]">
            {task.createdAt.toLocaleString("en-US", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
          <button
            onclick={() => deleteTask(task.id)}
            aria-label="Delete task"
            class="cursor-pointer rounded-md border border-transparent px-2 py-1 text-[#97979B] hover:border-[#FF453A3D] hover:bg-[#FF453A0D] hover:text-[#B31212]"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 3.5L11 11.5M11 3.5L3 11.5"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-linecap="round"
              />
            </svg>
          </button>
        </div>
      {:else}
        <div
          class="rounded-md border border-[#EDEDF0] bg-white p-8 text-center text-[#97979B]"
        >
          {#if filter === "all"}
            No tasks yet. Add one above to get started.
          {:else if filter === "active"}
            No active tasks.
          {:else}
            No completed tasks yet.
          {/if}
        </div>
      {/each}
    </div>

    <div class="mt-10 grid grid-rows-3 gap-7 lg:grid-cols-3 lg:grid-rows-none">
      <div
        class="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Quick add</h2>
        <p>
          Type a task and press <code class="rounded-sm bg-[#EDEDF0] p-1"
            >Enter</code
          > to add it instantly.
        </p>
      </div>
      <div
        class="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Filter views</h2>
        <p>
          Switch between All, Active, and Completed to focus on what matters.
        </p>
      </div>
      <div
        class="flex h-full w-72 flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Stay on track</h2>
        <p>Check off tasks as you go. Completed items fade out gracefully.</p>
      </div>
    </div>
  </div>
</main>
