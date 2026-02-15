import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Trash2 } from "lucide-react";

export default function TaskCard({ task, isOverlay, onClick, onDelete }) {
  // Configuro lo "ordina-facile": dico a dnd-kit che questa card può essere spostata.
  // Se è un "overlay" (la card che vola durante il drag), disabilito il sortable per non creare loop.
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ 
    id: task.id, 
    disabled: isOverlay 
  });

  // Gestisco la trasformazione visiva (il movimento) mentre la trascino.
  // Se sto trascinando (isDragging), abbasso l'opacità della card originale che resta sotto.
  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.2 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-[#111114] p-6 border-l border-white/5 hover:border-[#4f46e5] 
                 transition-all duration-700 cursor-pointer group relative active:scale-[0.98]
                 shadow-[10px_10px_30px_rgba(0,0,0,0.3)]"
    >
      {/* Parte superiore della card: linea decorativa e tasto elimina */}
      <div className="flex justify-between items-start mb-4">
        {/* Questa linea si allunga quando passi sopra col mouse, fa molto stile "studio" */}
        <div className="h-[1px] w-6 bg-white/10 group-hover:w-12 group-hover:bg-[#4f46e5] transition-all duration-700" />
        
        {!isOverlay && (
          <button 
            onClick={(e) => { 
              e.stopPropagation(); // Evito che cliccando il cestino si apra anche il modal
              onDelete(); 
            }}
            className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-500 transition-all"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>

      {/* Titolo della nota */}
      <h3 className="text-[14px] font-normal tracking-wide text-white/80 group-hover:text-white transition-colors">
        {task.title || "Senza Titolo"}
      </h3>

      {/* Anteprima del contenuto: tolgo i simboli Markdown (# e *) per pulire la vista */}
      {task.content && (
        <p className="mt-4 text-[11px] leading-relaxed text-[#606066] line-clamp-2 font-light">
          {task.content.replace(/[#*]/g, '')} 
        </p>
      )}
      
      {/* Un piccolo dettaglio estetico: un ID finto in stile log di sistema in basso a destra */}
      <div className="absolute bottom-4 right-4 text-[7px] font-mono opacity-0 group-hover:opacity-10 transition-opacity tracking-tighter">
        LOG_REF_{task.id.split('-')[1]}
      </div>
    </div>
  );
}