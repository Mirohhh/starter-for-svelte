<script lang="ts">
  import "../app.css";
  import { listTasks, createTask, updateTask, deleteTask } from "$lib/appwrite";
  import { onMount } from "svelte";

  type Priority = "low" | "medium" | "high";

  type Task = {
    $id: string;
    taskName: string;
    description: string;
    priority: Priority;
    completed: boolean;
    createdAt: Date;
  };

  type Filter = "all" | "active" | "completed";

  const priorityOrder: Record<Priority, number> = {
    high: 0,
    medium: 1,
    low: 2,
  };
  const priorityColors: Record<Priority, string> = {
    high: "bg-[#FF453A3D] text-[#B31212]",
    medium: "bg-[#FD366E14] text-[#FD366E]",
    low: "bg-[#10B9813D] text-[#0A714F]",
  };
  const dateFormatter = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  let tasks = $state<Array<Task>>([]);
  let newTask = $state("");
  let newDescription = $state("");
  let newPriority = $state<Priority>("medium");
  let filter = $state<Filter>("all");
  let sortByPriority = $state(false);
  let loading = $state(true);
  let error = $state("");
  let pendingTaskIds = $state<Record<string, boolean>>({});

  onMount(async () => {
    await fetchTasks();
  });

  async function fetchTasks() {
    try {
      loading = true;
      error = "";
      const docs = await listTasks();
      tasks = docs.map((doc: Record<string, unknown>) => ({
        $id: doc.$id as string,
        taskName: doc.taskName as string,
        description: (doc.description as string) ?? "",
        priority: (doc.priority as Priority) ?? "medium",
        completed: doc.completed as boolean,
        createdAt: new Date(doc.$createdAt as string),
      }));
    } catch (e) {
      error = e instanceof Error ? e.message : "Failed to load tasks";
    } finally {
      loading = false;
    }
  }

  async function addTask() {
    const text = newTask.trim();
    if (!text) return;
    const tempId = `temp-${crypto.randomUUID()}`;
    const optimisticTask: Task = {
      $id: tempId,
      taskName: text,
      description: newDescription.trim(),
      priority: newPriority,
      completed: false,
      createdAt: new Date(),
    };

    tasks = [optimisticTask, ...tasks];
    newTask = "";
    newDescription = "";
    newPriority = "medium";

    try {
      error = "";
      const doc = await createTask({
        taskName: text,
        description: optimisticTask.description,
        priority: optimisticTask.priority,
        completed: false,
      });
      tasks = tasks.map((task) =>
        task.$id === tempId
          ? {
              $id: doc.$id,
              taskName: doc.taskName,
              description: doc.description ?? "",
              priority: doc.priority ?? "medium",
              completed: doc.completed,
              createdAt: new Date(doc.$createdAt),
            }
          : task,
      );
    } catch (e) {
      tasks = tasks.filter((task) => task.$id !== tempId);
      newTask = text;
      newDescription = optimisticTask.description;
      newPriority = optimisticTask.priority;
      error = e instanceof Error ? e.message : "Failed to add task";
    }
  }

  async function toggleTask(id: string) {
    const task = tasks.find((t) => t.$id === id);
    if (!task) return;
    const nextCompleted = !task.completed;
    tasks = tasks.map((t) => (t.$id === id ? { ...t, completed: nextCompleted } : t));
    pendingTaskIds = { ...pendingTaskIds, [id]: true };
    try {
      error = "";
      const doc = await updateTask(id, { completed: nextCompleted });
      tasks = tasks.map((t) =>
        t.$id === id ? { ...t, completed: doc.completed } : t,
      );
    } catch (e) {
      tasks = tasks.map((t) =>
        t.$id === id ? { ...t, completed: task.completed } : t,
      );
      error = e instanceof Error ? e.message : "Failed to update task";
    } finally {
      const { [id]: _, ...rest } = pendingTaskIds;
      pendingTaskIds = rest;
    }
  }

  async function handleDelete(id: string) {
    const removedIndex = tasks.findIndex((t) => t.$id === id);
    const removedTask = tasks[removedIndex];
    if (!removedTask) return;
    tasks = tasks.filter((t) => t.$id !== id);
    pendingTaskIds = { ...pendingTaskIds, [id]: true };
    try {
      error = "";
      await deleteTask(id);
    } catch (e) {
      tasks = [
        ...tasks.slice(0, removedIndex),
        removedTask,
        ...tasks.slice(removedIndex),
      ];
      error = e instanceof Error ? e.message : "Failed to delete task";
    } finally {
      const { [id]: _, ...rest } = pendingTaskIds;
      pendingTaskIds = rest;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Enter") addTask();
  }

  let filteredTasks = $derived(
    (() => {
      let result =
        filter === "all"
          ? tasks
          : filter === "active"
            ? tasks.filter((t) => !t.completed)
            : tasks.filter((t) => t.completed);

      if (sortByPriority) {
        result = [...result].sort(
          (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority],
        );
      }

      return result;
    })(),
  );

  let completedCount = $derived(tasks.filter((t) => t.completed).length);
  let activeCount = $derived(tasks.filter((t) => !t.completed).length);
</script>

<svelte:head>
  <title>Task Manager</title>
</svelte:head>

<main class="checker-background relative flex h-dvh flex-col items-center overflow-hidden p-5">
  <div class="mt-12 mb-12 flex h-full w-full max-w-[64rem] min-h-0 flex-col lg:mt-12">
    <h1 class="text-center font-[Poppins] text-2xl font-light text-[#2D2D31]">
      Task Manager
    </h1>
    <p class="mb-8 text-center">Stay organized, one task at a time.</p>

    {#if error}
      <div
        class="mb-6 rounded-md border border-[#FF453A3D] bg-[#FF453A0D] p-3 text-sm text-[#B31212]"
      >
        {error}
        <button
          onclick={() => (error = "")}
          class="ml-2 cursor-pointer underline">dismiss</button
        >
      </div>
    {/if}

    <div
      class="mb-8 rounded-md border border-[#EDEDF0] bg-white p-4 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)]"
    >
      <div class="flex flex-col gap-3">
        <input
          type="text"
          bind:value={newTask}
          onkeydown={handleKeydown}
          placeholder="What needs to be done?"
          class="rounded-md border border-[#EDEDF0] bg-[#FAFAFB] px-3 py-2 text-sm text-[#56565C] placeholder-[#97979B] outline-none focus:border-[#FD366E52]"
        />
        <input
          type="text"
          bind:value={newDescription}
          onkeydown={handleKeydown}
          placeholder="Description (optional)"
          class="rounded-md border border-[#EDEDF0] bg-[#FAFAFB] px-3 py-2 text-sm text-[#56565C] placeholder-[#97979B] outline-none focus:border-[#FD366E52]"
        />
        <div class="flex items-center gap-3">
          <label for="priority-select" class="text-sm text-[#97979B]"
            >Priority</label
          >
          <select
            id="priority-select"
            bind:value={newPriority}
            class="rounded-md border border-[#EDEDF0] bg-[#FAFAFB] px-3 py-2 text-sm text-[#56565C] outline-none focus:border-[#FD366E52]"
          >
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <div class="flex-1"></div>
          <button
            onclick={addTask}
            class="cursor-pointer rounded-md bg-[#FD366E] px-4 py-2 text-white"
          >
            Add
          </button>
        </div>
      </div>
    </div>

    <div class="flex min-h-0 flex-1 flex-col pr-1">
    {#if loading}
      <div class="flex justify-center py-12">
        <div role="status">
          <svg
            aria-hidden="true"
            class="h-5 w-5 animate-spin fill-[#FD366E] text-gray-200"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
              fill="currentColor"
            />
            <path
              d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
              fill="currentFill"
            />
          </svg>
          <span class="sr-only">Loading...</span>
        </div>
      </div>
    {:else if tasks.length > 0}
      <div class="mb-6 flex items-center justify-between">
        <div class="flex gap-2 overflow-y-auto">
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
          <button
            onclick={() => (sortByPriority = !sortByPriority)}
            class={`cursor-pointer rounded-md border px-3 py-1 text-sm ${
              sortByPriority
                ? "border-[#FD366E52] bg-[#FD366E14] text-[#FD366E]"
                : "border-[#EDEDF0] bg-white text-[#56565C]"
            }`}
          >
            Priority
          </button>
        </div>
        <div class="flex gap-3 text-sm text-[#97979B]">
          <span>{activeCount} active</span>
          <span>{completedCount} done</span>
        </div>
      </div>
    {/if}

    {#if !loading && !error}
      <div class="flex flex-col gap-3 overflow-y-auto">
        {#each filteredTasks as task (task.$id)}
          <div
            class="flex items-start gap-3 rounded-md border border-[#EDEDF0] bg-white p-4 shadow-[0px_2px_12px_0px_hsla(0,0%,0%,0.03)] transition-opacity duration-200"
            class:opacity-50={task.completed}
          >
            <button
              onclick={() => toggleTask(task.$id)}
              disabled={pendingTaskIds[task.$id]}
              class={`mt-0.5 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded border ${
                task.completed
                  ? "border-[#FD366E52] bg-[#FD366E] text-white"
                  : "border-[#EDEDF0] bg-[#FAFAFB]"
              } disabled:cursor-not-allowed disabled:opacity-50`}
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
            <div class="flex flex-1 flex-col gap-1">
              <div class="flex items-center gap-2">
                <span
                  class={`text-sm ${task.completed ? "text-[#97979B] line-through" : "text-[#56565C]"}`}
                >
                  {task.taskName}
                </span>
                <span
                  class={`rounded-sm px-1 text-xs ${priorityColors[task.priority]}`}
                >
                  {task.priority}
                </span>
              </div>
              {#if task.description}
                <p class="text-xs text-[#97979B]">
                  {task.description}
                </p>
              {/if}
            </div>
            <span class="mt-0.5 shrink-0 font-[Fira_Code] text-xs text-[#97979B]">
              {dateFormatter.format(task.createdAt)}
            </span>
            <button
              onclick={() => handleDelete(task.$id)}
              aria-label="Delete task"
              disabled={pendingTaskIds[task.$id]}
              class="shrink-0 cursor-pointer rounded-md border border-transparent px-2 py-1 text-[#97979B] hover:border-[#FF453A3D] hover:bg-[#FF453A0D] hover:text-[#B31212] disabled:cursor-not-allowed disabled:opacity-50"
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
    {/if}

    </div>

    <!-- <div class="mt-6 grid shrink-0 grid-rows-3 gap-7 lg:grid-cols-3 lg:grid-rows-none">
      <div
        class="flex h-full w-full flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Quick add</h2>
        <p>
          Type a task and press <code class="rounded-sm bg-[#EDEDF0] p-1"
            >Enter</code
          > to add it instantly.
        </p>
      </div>
      <div
        class="flex h-full w-full flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Filter views</h2>
        <p>
          Switch between All, Active, and Completed to focus on what matters.
        </p>
      </div>
      <div
        class="flex h-full w-full flex-col gap-2 rounded-md border border-[#EDEDF0] bg-white p-4"
      >
        <h2 class="text-xl font-light text-[#2D2D31]">Stay on track</h2>
        <p>Check off tasks as you go. Completed items fade out gracefully.</p>
      </div>
    </div> -->
  </div>
</main>
