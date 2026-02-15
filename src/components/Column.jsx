import React from "react";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

export default function Column({ column, tasks, onAddTask, renderTask }) {
  // Dico a dnd-kit che questa intera colonna è una "zona di atterraggio" (droppable).
  // Senza questo, le card non saprebbero dove finire quando le trasciniamo nel vuoto di una colonna.
  const { setNodeRef } = useDroppable({ id: column.id });

  return (
    <div ref={setNodeRef} className="flex flex-col h-full min-h-[400px]">
      
      {/* --- Header Colonna --- */}
      <div className="flex items-baseline justify-between mb-8 px-2">
        <div className="flex items-baseline">
          {/* Titolo in maiuscolo e molto spaziato per il look "editoriale" */}
          <h2 className="text-[11px] font-bold uppercase tracking-[0.4em] text-white/90 select-none">
            {column.title}
          </h2>
          {/* Quel cursore viola che pulsa fa sembrare l'app un terminale attivo */}
          <span className="text-[#4f46e5] ml-1 font-black animate-pulse">_</span>
        </div>
        
        {/* Contatore dei task: uso padStart per avere sempre due cifre (es. 01, 02) che è più ordinato */}
        <span className="text-[9px] font-mono opacity-20 uppercase tracking-tighter">
          Qtà: {tasks.length.toString().padStart(2, '0')}
        </span>
      </div>

      {/* --- Area Task --- */}
      <div className="space-y-6 flex-1">
        {/* SortableContext aiuta a gestire l'ordinamento interno dei task nella colonna */}
        <SortableContext 
          items={tasks.map((t) => t.id)} 
          strategy={verticalListSortingStrategy}
        >
          {/* Mappo i task e uso la funzione renderTask passata da App.jsx */}
          {tasks.map((task) => renderTask(task))}
        </SortableContext>
      </div>

      {/* --- Pulsante Aggiungi --- */}
      <button 
        onClick={onAddTask}
        className="mt-8 group flex items-center justify-center gap-3 py-4 border border-white/5 
                   hover:border-[#4f46e5]/40 hover:bg-[#4f46e5]/5 transition-all duration-500 rounded-none"
      >
        <Plus size={14} className="group-hover:text-[#4f46e5] transition-colors" />
        <span className="text-[9px] uppercase tracking-[0.2em] font-medium opacity-40 group-hover:opacity-100 group-hover:text-white">
          Aggiungi
        </span>
      </button>
    </div>
  );
}