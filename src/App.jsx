import React, { useState, useEffect } from "react";
import {
  DndContext,
  rectIntersection,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import Column from "./components/Column";
import TaskCard from "./components/TaskCard";
import ReactMarkdown from "react-markdown";

// Qui definisco la struttura base. Se voglio cambiare i nomi alle colonne
// o aggiungere dei task di esempio all'inizio, lo faccio qui.
const initialData = {
  tasks: {
    "task-1": {
      id: "task-1",
      title: "Benvenuto su Lexi.board",
      content: "Questa è un'interfaccia **minimale** progettata per la chiarezza. \n\nPuoi usare questo spazio per organizzare pensieri, task o frammenti di codice.",
    },
    "task-2": {
      id: "task-2",
      title: "Sintassi Markdown",
      content: "L'editor supporta il **Markdown**.\n\n- Usa i cancelletti per i titoli\n- Il grassetto con i doppi asterischi\n- I trattini per le liste\n\nProva a cliccare su questa card per modificarla!",
    },
    "task-3": {
      id: "task-3",
      title: "Organizzazione Fluida",
      content: "Trascina le card tra le colonne per cambiare lo stato. \n\nIl sistema utilizza **dnd-kit** per garantire movimenti fluidi e naturali anche su dispositivi touch.",
    },
    "task-4": {
      id: "task-4",
      title: "Salvataggio Automatico",
      content: "Non c'è un tasto 'Salva'. \n\nOgni modifica viene scritta istantaneamente nel `localStorage` del tuo browser. Puoi chiudere la scheda e tornare quando vuoi: i tuoi dati saranno qui.",
    },
  },
  columns: {
    "col-1": { id: "col-1", title: "IDEE", taskIds: ["task-1", "task-2"] },
    "col-2": { id: "col-2", title: "IN CORSO", taskIds: ["task-3"] },
    "col-3": { id: "col-3", title: "FINITO", taskIds: ["task-4"] },
  },
  columnOrder: ["col-1", "col-2", "col-3"],
};

export default function App() {
  // Gestione dello stato con persistenza nel LocalStorage
  const [data, setData] = useState(() => {
    const saved = localStorage.getItem("lexiboard-pro");
    if (!saved) return initialData;

    const parsedSaved = JSON.parse(saved);

    // Sincronizzazione "furba": prendo i titoli delle colonne dal codice (così posso cambiarli qui sopra)
    // ma mantengo i task e il loro ordine che l'utente ha salvato nel browser.
    const syncedColumns = {};
    initialData.columnOrder.forEach((colId) => {
      syncedColumns[colId] = {
        ...initialData.columns[colId],
        taskIds: parsedSaved.columns[colId]?.taskIds || [],
      };
    });

    return {
      tasks: parsedSaved.tasks || initialData.tasks,
      columns: syncedColumns,
      columnOrder: initialData.columnOrder,
    };
  });

  const [activeTask, setActiveTask] = useState(null); // Per far vedere la card mentre la trascino
  const [editingTask, setEditingTask] = useState(null); // Per gestire il modal dell'editor

  // Ogni volta che lo stato "data" cambia, salvo tutto nel browser in automatico
  useEffect(() => {
    localStorage.setItem("lexiboard-pro", JSON.stringify(data));
  }, [data]);

  // Configuro i sensori per il drag and drop: 
  // metto una distanza di 8px prima di attivare il trascinamento così non parte per sbaglio al click
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  // La logica principale del trascinamento
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const sourceCol = Object.values(data.columns).find((c) => c.taskIds.includes(activeId));
    const destCol = Object.values(data.columns).find((c) => c.taskIds.includes(overId) || c.id === overId);

    if (!sourceCol || !destCol) return;

    // Se sposto nello stesso posto, cambio solo l'ordine dell'array
    if (sourceCol.id === destCol.id) {
      const oldIndex = sourceCol.taskIds.indexOf(activeId);
      const newIndex = destCol.taskIds.indexOf(overId);
      const newOrder = arrayMove(sourceCol.taskIds, oldIndex, newIndex);
      setData({ ...data, columns: { ...data.columns, [sourceCol.id]: { ...sourceCol, taskIds: newOrder } } });
    } else {
      // Se sposto da una colonna all'altra, tolgo da una e metto nell'altra
      const sourceIds = [...sourceCol.taskIds];
      const destIds = [...destCol.taskIds];
      sourceIds.splice(sourceIds.indexOf(activeId), 1);
      const overIndex = destIds.indexOf(overId);
      overIndex >= 0 ? destIds.splice(overIndex, 0, activeId) : destIds.push(activeId);
      setData({
        ...data,
        columns: {
          ...data.columns,
          [sourceCol.id]: { ...sourceCol, taskIds: sourceIds },
          [destCol.id]: { ...destCol, taskIds: destIds },
        },
      });
    }
  };

  // Funzione per creare una nuova nota al volo
  const addTask = (colId) => {
    const id = `task-${Date.now()}`; // Uso il timestamp per avere ID sempre unici
    setData({
      ...data,
      tasks: { ...data.tasks, [id]: { id, title: "Nuova Nota", content: "" } },
      columns: {
        ...data.columns,
        [colId]: { ...data.columns[colId], taskIds: [...data.columns[colId].taskIds, id] },
      },
    });
  };

  // Funzione per eliminare una nota e pulire i riferimenti nelle colonne
  const deleteTask = (taskId) => {
    const newData = { ...data };
    delete newData.tasks[taskId];
    Object.keys(newData.columns).forEach((c) => {
      newData.columns[c].taskIds = newData.columns[c].taskIds.filter((id) => id !== taskId);
    });
    setData(newData);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#a0a0a8] px-6 md:px-12 selection:bg-[#4f46e5] selection:text-white flex flex-col">
      
      {/* Header: stile pulito, tutto in uppercase per il look minimal */}
      <header className="py-24 max-w-7xl mx-auto flex flex-col items-center">
        <div className="relative inline-block text-center text-white">
          <div className="absolute -top-4 -left-4 w-2 h-2 rounded-full bg-[#4f46e5]" />
          <h1 className="text-4xl md:text-5xl font-light tracking-[0.25em] uppercase">
            lexi<span className="font-black text-[#4f46e5]">.</span>board
          </h1>
          <p className="text-[9px] font-mono uppercase tracking-[0.6em] mt-6 opacity-30">
            Il Tuo Sistema d'Archivio Minimal
          </p>
        </div>
      </header>

      {/* Main: qui gestisco il contesto del Drag & Drop */}
      <main className="max-w-[1400px] mx-auto w-full flex-grow">
        <DndContext
          sensors={sensors}
          collisionDetection={rectIntersection}
          onDragStart={(e) => setActiveTask(data.tasks[e.active.id])}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 items-start">
            {data.columnOrder.map((colId) => {
              const column = data.columns[colId];
              const tasks = column.taskIds.map((id) => data.tasks[id]);
              return (
                <Column
                  key={colId}
                  column={column}
                  tasks={tasks}
                  onAddTask={() => addTask(colId)}
                  renderTask={(task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onClick={() => setEditingTask(task)}
                      onDelete={() => deleteTask(task.id)}
                    />
                  )}
                />
              );
            })}
          </div>

          {/* L'overlay serve a far vedere la card che "vola" mentre la sposto */}
          <DragOverlay dropAnimation={null}>
            {activeTask && (
              <div className="shadow-2xl opacity-90 border-l-2 border-[#4f46e5] scale-105 transition-transform">
                <TaskCard task={activeTask} isOverlay />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      </main>

      {/* Footer: Ho messo i link ai social e il tasto per resettare tutto se serve */}
      <footer className="mt-20 py-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 max-w-[1400px] mx-auto w-full">
        <div className="flex flex-col gap-1 text-center md:text-left order-3 md:order-1">
          <p className="text-[10px] font-mono tracking-[0.2em] opacity-30 uppercase">
            © 2026 Lexi.board System
          </p>
          <p className="text-[9px] font-mono opacity-10 uppercase tracking-widest">
            FORZA MILAN
          </p>
        </div>

        <div className="flex gap-12 order-1 md:order-2">
          {/* GitHub Icon Link */}
          <a href="https://github.com/Raffa134-dev" target="_blank" rel="noopener noreferrer" className="group transition-all duration-300" aria-label="GitHub">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" className="opacity-30 group-hover:opacity-100 group-hover:text-[#4f46e5] transition-all">
              <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
            </svg>
          </a>
          {/* Discord Icon Link */}
          <a href="https://discord.com/users/.raffa__" target="_blank" rel="noopener noreferrer" className="group transition-all duration-300" aria-label="Discord">
            <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="1.5" fill="none" className="opacity-30 group-hover:opacity-100 group-hover:text-[#5865F2] transition-all">
              <circle cx="9" cy="12" r="1"></circle><circle cx="15" cy="12" r="1"></circle>
              <path d="M7.5 7.1c2.7-1.1 6.3-1.1 9 0M5.5 13.9c.7 2.1 3.5 3.1 6.5 3.1s5.8-1 6.5-3.1M7 19c-3-2-4-5-4-8a10 10 0 0 1 18 0c0 3-1 6-4 8"></path>
            </svg>
          </a>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3 order-2 md:order-3">
          <button
            onClick={() => {
              if (confirm("ATTENZIONE: Stai per resettare l'intero database locale. Procedere?")) {
                localStorage.clear();
                window.location.reload();
              }
            }}
            className="text-[9px] font-mono opacity-20 hover:opacity-100 hover:text-red-500 transition-all uppercase tracking-[0.2em] px-3 py-1 border border-white/5 hover:border-red-500/20"
          >
            [ Resetta Local Storage ]
          </button>
          <div className="flex items-center gap-2 text-[9px] font-mono opacity-20 uppercase tracking-tighter">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4f46e5] animate-pulse" />
            Status: Operativo
          </div>
        </div>
      </footer>

      {/* Editor Modal: si attiva quando clicco su una card */}
      {editingTask && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 backdrop-blur-2xl bg-black/80 text-white">
          <div className="bg-[#0e0e10] w-full max-w-6xl h-full border border-white/5 shadow-2xl flex flex-col overflow-hidden">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0e0e10]">
              {/* Titolo editabile nel modal */}
              <input
                className="bg-transparent text-3xl md:text-4xl font-light tracking-tight focus:outline-none w-full text-white uppercase"
                value={editingTask.title}
                onChange={(e) => {
                  const t = e.target.value;
                  setEditingTask({ ...editingTask, title: t });
                  setData({
                    ...data,
                    tasks: { ...data.tasks, [editingTask.id]: { ...data.tasks[editingTask.id], title: t } },
                  });
                }}
              />
              <button
                onClick={() => setEditingTask(null)}
                className="ml-4 px-6 py-2 border border-white/10 text-[#a0a0a8] text-[9px] font-mono tracking-[0.3em] hover:border-white/40 hover:text-white transition-all duration-500 uppercase"
              >
                Esci
              </button>
            </div>
            
            {/* Editor vero e proprio: a sinistra scrivo, a destra vedo l'anteprima Markdown */}
            <div className="flex flex-col md:flex-row flex-1 overflow-hidden text-[#a0a0a8]">
              <textarea
                className="flex-1 bg-black/20 p-10 resize-none focus:outline-none font-mono text-sm leading-relaxed text-[#8ca393] border-b md:border-b-0 md:border-r border-white/5"
                placeholder="// Inizia a scrivere..."
                value={editingTask.content}
                onChange={(e) => {
                  const c = e.target.value;
                  setEditingTask({ ...editingTask, content: c });
                  setData({
                    ...data,
                    tasks: { ...data.tasks, [editingTask.id]: { ...data.tasks[editingTask.id], content: c } },
                  });
                }}
              />
              <div className="flex-1 p-10 overflow-y-auto bg-white/[0.01]">
                <div className="text-[9px] font-mono uppercase tracking-[0.3em] opacity-20 mb-8 border-b border-white/5 pb-2">
                  Anteprima Live
                </div>
                <div className="prose prose-invert prose-indigo max-w-none">
                  <ReactMarkdown>{editingTask.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}